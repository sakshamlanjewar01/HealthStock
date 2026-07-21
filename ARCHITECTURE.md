# Trulicare System Architecture

## 🏛️ High-Level System Architecture

```mermaid
graph TD
    Client["Client SPA (React 18 / Vite 5)"] -->|HTTPS / REST| ExpressAPI["Express REST API (Port 5000)"]
    ExpressAPI -->|Mongoose ODM| MongoDB[(MongoDB Atlas Cluster)]
    ExpressAPI -->|Background Daemon| Cron["node-cron Scheduler"]
    Cron -->|Email Dispatch| SMTP["SMTP Server (Nodemailer)"]
    Cron -->|Push Protocol| WebPush["VAPID Push Service"]
    Cron -->|SMS / WhatsApp| Twilio["Twilio Gateway"]
    ExpressAPI -->|In-Memory Buffer| PDFKit["PDFKit Report Generator"]
```

---

## 🔐 Request & Security Architecture

1. **Authentication Layer**: JWT tokens delivered via HTTP-Only, `SameSite` cookies or `Authorization: Bearer <token>` headers.
2. **Authorization Layer (RBAC)**: `restrictTo('Pharmacist', 'Doctor', 'Admin')` middleware guards protected routes.
3. **Data Protection Layer**: Passwords hashed with BCrypt (10 rounds). Sensitive PII encrypted at rest using AES-256-CBC getters/setters in `User.js`.
4. **Network Hardened**: Express `helmet` headers, CORS domain filtering, `express-rate-limit` throttles.

---

## 🔄 Cron & Notification Architecture

- `cronService.js` triggers pre-alarm checks every minute (`* * * * *`).
- Patient local timezone resolved dynamically via `Intl.DateTimeFormat` against `user.timezone`.
- Daily intake validated against `AdherenceLog` collection to prevent duplicate alert dispatches.
