# Trulicare Health Intelligence Dashboard — Full Technical Documentation & Project Report

## Executive Overview

**Trulicare Health Intelligence Dashboard** is an enterprise digital health and tele-care management platform built to optimize patient medication adherence, track health symptoms, streamline pharmacy refill dispatches, and enable proactive caregiver oversight.

---

## 1. Tech Stack & Infrastructure

- **Frontend**: React 18, Vite, Recharts (Data Visualization), Lucide React (Icons), Vanilla CSS (Custom Design System tokens).
- **Backend**: Node.js, Express.js (REST API).
- **Database**: MongoDB with Mongoose ODM (Data modeling & schemas).
- **Job Engine**: `node-cron` for automated reminder dispatches and adherence checks.
- **Messaging & Alerts**: `nodemailer` (Email/SMTP), `web-push` (VAPID push notifications), `twilio` (SMS notifications).
- **Document Services**: `pdfkit` for generating clinical PDF reports.
- **Security & Middleware**: `helmet` (Security Headers & CSP), `cors`, `express-rate-limit`, `jsonwebtoken` (JWT), `bcryptjs` (Password hashing).

---

## 2. System Architecture

```
                                    ┌───────────────────────┐
                                    │   React 18 / Vite     │
                                    │    (Client Portal)    │
                                    └───────────┬───────────┘
                                                │
                                       HTTP / REST API (JWT)
                                                │
                                    ┌───────────▼───────────┐
                                    │   Express.js API      │
                                    │ (Controllers & Routes)│
                                    └─────┬─────┬─────┬─────┘
                                          │     │     │
                 ┌────────────────────────┘     │     └────────────────────────┐
                 ▼                              ▼                              ▼
     ┌───────────────────────┐      ┌───────────────────────┐      ┌───────────────────────┐
     │   MongoDB / Mongoose  │      │   Cron Task Engine    │      │ Multi-Channel Engine  │
     │(User, Med, Log Schemas│      │  (node-cron Workers)  │      │(Email, Push, SMS, PDF)│
     └───────────────────────┘      └───────────────────────┘      └───────────────────────┘
```

---

## 3. Data Schema Specifications

### 3.1 User Model (`models/User.js`)
- `name` (String, Required)
- `email` (String, Unique, Required)
- `password` (String, Hashed via bcrypt)
- `role` (Enum: `patient`, `caregiver`, `pharmacist`, `admin`)
- `phone` (String, Optional for SMS alerts)
- `pushSubscription` (Object for VAPID web push endpoints)
- `caregiverCode` (Unique referral string linking caregivers to patients)

### 3.2 Medicine Model (`models/Medicine.js`)
- `userId` (ObjectId ref User)
- `name` (String, Required)
- `dosage` (String, e.g., "500mg")
- `frequency` (String, e.g., "Daily", "Twice a day")
- `scheduledTimes` (Array of Strings, e.g., `["08:00", "20:00"]`)
- `totalQuantity` (Number, Current pill inventory)
- `refillThreshold` (Number, Alert trigger level)

### 3.3 Adherence Log Model (`models/AdherenceLog.js`)
- `userId` (ObjectId ref User)
- `medicineId` (ObjectId ref Medicine)
- `status` (Enum: `taken`, `missed`, `skipped`)
- `timestamp` (Date)
- `notes` (String)

### 3.4 Symptom Log Model (`models/SymptomLog.js`)
- `userId` (ObjectId ref User)
- `symptomName` (String)
- `severity` (Number, 1 to 10 scale)
- `associatedMedicineId` (ObjectId ref Medicine, Optional)
- `timestamp` (Date)
- `notes` (String)

### 3.5 Pharmacy Request Model (`models/PharmacyRequest.js`)
- `patientId` (ObjectId ref User)
- `medicineId` (ObjectId ref Medicine)
- `quantityRequested` (Number)
- `status` (Enum: `pending`, `processing`, `dispatched`, `completed`, `cancelled`)
- `notes` (String)
- `requestedAt` (Date)

### 3.6 Audit Log Model (`models/AuditLog.js`)
- `userId` (ObjectId ref User)
- `action` (String)
- `ipAddress` (String)
- `userAgent` (String)
- `timestamp` (Date)

---

## 4. API Endpoint Summary

### Authentication Routes (`/api/auth`)
- `POST /api/auth/register` — Create user account with specified role.
- `POST /api/auth/login` — Authenticate credentials and return JWT token.
- `GET /api/auth/me` — Fetch current authenticated profile details.
- `PUT /api/auth/profile` — Update account profile details.

### Health Data Routes (`/api/data`)
- `GET /api/data/dashboard` — Fetch calculated adherence scores, medication counts, and recent logs.
- `GET /api/data/medicines` — Retrieve user's active prescriptions.
- `POST /api/data/medicines` — Add new medication schedule and inventory.
- `POST /api/data/adherence` — Log medication intake (`taken`, `missed`, `skipped`).
- `GET /api/data/symptoms` — Retrieve symptom tracking history.
- `POST /api/data/symptoms` — Log new symptom entry with severity rating.
- `POST /api/data/refill` — Trigger pharmacy refill dispatch request.
- `GET /api/data/export-pdf` — Download generated clinical health PDF summary report.

---

## 5. Security Policies & Best Practices

1. **Helmet CSP**: Prevents unauthorized inline scripts and enforces strict content source policies.
2. **Stateless JWT Authorization**: Tokens signed with custom secret; passed via HTTP Authorization Bearer headers.
3. **Password Hashing**: `bcryptjs` salted password storage prevents reverse lookups.
4. **Auditability**: Critical user events and pharmacy dispatches logged to `AuditLog`.

---

## 6. Setup and Installation

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env # Configure MONGODB_URI, JWT_SECRET, SMTP, TWILIO, VAPID
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env # Configure VITE_API_URL, VITE_VAPID_PUBLIC_KEY
npm run dev
```
