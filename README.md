# Medicine Availability Finder

A full-stack, enterprise-grade healthcare web application connecting patients with verified local pharmacies and medical agencies to find real-time medicine availability, stock counts, pricing, locations, and instant restock notifications.

---

## 🌟 Key Features

- **Public Medicine Search & Filtering:** PostgreSQL `pg_trgm` fuzzy text matching across medicine names, generic names, brands, and categories. Filter by form (Tablet, Capsule, Syrup, etc.), city, and stock status.
- **Centralized Master Catalog:** Admin-managed master medicine catalog ensuring standardized drug naming, dosage, generic mapping, and forms.
- **Vendor Inventory Management:** Approved Pharmacies and Medical Agencies manage their stock lines, pricing, minimum threshold alerts, and real-time availability updates.
- **Admin Approval Workflow:** Mandatory administrator verification flow for registered Pharmacies and Medical Agencies with Brevo email notifications upon approval or rejection.
- **Patient Medicine Requests & Reservations:** Patients can request reservations directly from specific pharmacies with instant status updates (`PENDING`, `APPROVED`, `FULFILLED`, `REJECTED`, `CANCELLED`).
- **"Notify Me When Available" Subscriptions:** Instant Brevo email notifications automatically triggered whenever out-of-stock items are replenished by vendors.
- **Search History Tracking:** Autonomous logging of user queries for personalized search history and admin query insights.
- **Role-Based Access Control (RBAC):** Secure JWT authentication enforcing `PATIENT`, `PHARMACY`, `MEDICAL_AGENCY`, and `ADMIN` role privileges.

---

## 📁 Repository Architecture

```text
medicine-availability-finder/
├── backend/                  # Express.js REST API & Neon PostgreSQL Service
│   ├── src/
│   │   ├── config/           # Neon Database client (`pg`) & SSL configurations
│   │   ├── controllers/      # Request handlers for auth, admin, search, inventory, etc.
│   │   ├── middleware/       # JWT auth guard, RBAC middleware, error handler
│   │   ├── routes/           # Express router endpoints
│   │   ├── services/         # Business logic layer & Brevo email dispatch engine
│   │   ├── utils/            # E2E test script (`testCompleteApp.js`)
│   │   └── server.js         # Express app entry point & CORS configuration
│   ├── .env.example          # Environment variable template (No secrets stored)
│   └── package.json
│
└── frontend/                 # Vite + React 18 Single Page Application
    ├── src/
    │   ├── components/       # UI components, layout header, footer, modals
    │   ├── context/          # React AuthContext (JWT session management)
    │   ├── pages/            # Public, Patient, Vendor, and Admin view pages
    │   ├── services/         # Axios API client setup & endpoint methods
    │   ├── App.jsx           # Application route declarations & ProtectedRoute rules
    │   └── main.jsx          # Entry point
    ├── vercel.json           # Vercel SPA route rewrite rules
    └── package.json
```

---

## 🚀 Environment Setup & Local Development

### 1. Database Setup (Neon PostgreSQL)
1. Provision a PostgreSQL instance on [Neon.tech](https://neon.tech).
2. Execute table definitions and ensure `pg_trgm` extension is enabled.

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your Neon DATABASE_URL, JWT_SECRET, and BREVO_API_KEY in .env
npm run dev
```
- Server runs on `http://localhost:5000`
- Health check endpoint: `http://localhost:5000/api/health/db`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Client runs on `http://localhost:5173`

---

## 🧪 End-to-End Integration Testing

Run the automated 10-step integration test suite covering auth, vendor approvals, inventory creation, restock notifications, requests, and fuzzy search:

```bash
cd backend
node src/utils/testCompleteApp.js
```

---

## ☁️ Deployment Instructions

### Backend Deployment (Render / Railway / Heroku)
1. Create a **Web Service** pointing to the repository's `backend` directory.
2. Build command: `npm install`
3. Start command: `node src/server.js`
4. Configure environment variables in the host portal:
   - `DATABASE_URL`: `postgresql://<user>:<password>@<host>/<db>?sslmode=require`
   - `JWT_SECRET`: `<secure-random-jwt-secret>`
   - `JWT_EXPIRES_IN`: `7d`
   - `BREVO_API_KEY`: `<your-brevo-api-key>`
   - `BREVO_SENDER_EMAIL`: `<your-verified-brevo-email>`
   - `BREVO_SENDER_NAME`: `Medicine Availability Finder`
   - `CLIENT_URL`: `https://your-frontend.vercel.app`

### Frontend Deployment (Vercel)
1. Import repository to Vercel and set Root Directory to `frontend`.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-backend.onrender.com/api`
5. `vercel.json` ensures all frontend routes rewrite to `/index.html` for clean client-side routing.

---

## 🔐 Security Standards
- Password hashing using `bcryptjs` (salt rounds = 10).
- Stateless JWT authentication with role authorization middleware.
- Zero secrets or credentials committed to Git repository (`.env` files strictly excluded in `.gitignore`).
