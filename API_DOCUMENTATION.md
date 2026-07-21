# Trulicare REST API Specification

All API endpoints return JSON envelopes formatted as:
- **Success**: `{ success: true, ...data }`
- **Error**: `{ success: false, message: "Error details..." }`

---

## 🔒 Authentication Endpoints (`/api/auth`)

### 1. `POST /api/auth/signup`
- **Auth**: Public
- **Body**: `{ name, email, password, role? }`
- **Behavior**: Roles sanitized to `Patient` or `Caregiver` during public signup. Returns HTTP 201.

### 2. `POST /api/auth/login`
- **Auth**: Public
- **Body**: `{ email, password }`
- **Response**: Sets HTTP-Only JWT Cookie (`token`) and returns `{ success: true, user }`.

### 3. `GET /api/auth/me`
- **Auth**: Bearer Token / Cookie
- **Response**: `{ success: true, user }`

---

## 💊 Health Data Endpoints (`/api/data`)

### 1. `GET /api/data/medicines`
- **Auth**: Authenticated User
- **Response**: Array of registered prescription objects.

### 2. `POST /api/data/medicines`
- **Auth**: Authenticated User
- **Body**: `{ name, totalQuantity, currentQuantity, dosageStrength, reminderTime, ... }`
- **Response**: Returns HTTP 201 with created medicine item.

### 3. `PUT /api/data/pharmacy-requests/:id`
- **Auth**: Authenticated User (`restrictTo('Pharmacist', 'Doctor', 'Admin')`)
- **Body**: `{ status: 'Fulfilled' | 'Rejected' }`
- **Behavior**: Enforces RBAC. Unauthorized patient requests return HTTP 403.
