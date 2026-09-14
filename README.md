# ClaimPilot - Automated Insurance Claims Adjudication System

An intelligent, full-stack claims adjudication platform featuring AI-powered document extraction, human-in-the-loop review cockpits, role-based access control, and an executive operational dashboard.

## 🚀 Features

- **Role-Based Access Control (RBAC)**: Secure JWT authentication supporting `Administrator`, `Human_Verifier`/`Adjuster`, and `Claimant`/`Policyholder` roles with tenant isolation.
- **Automated Triage & Extraction Engine**: Ingestion pipeline for claim documents, identification proofs, and repair estimates with consistency scoring and risk checks.
- **Adjuster Review Cockpit**: Dual-pane interface comparing original uploaded evidence side-by-side with extracted structured entities and automated confidence levels.
- **Carrier Operations & Analytics Dashboard**: Real-time queue metrics, audit logging, processing turnaround analytics, and triage management.
- **Multi-Category Claim Support**: Life & Death, Auto Collision, Health, and Property damage claims.

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS**
- **Lucide Icons**
- **React Router DOM**
- **Axios**

### Backend
- **Node.js** & **Express**
- **MongoDB** & **Mongoose**
- **JWT (JSON Web Tokens)**
- **Multer** for file upload handling

---

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster or local MongoDB instance

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your MONGO_URI and PORT in .env
npm run dev
# or: node src/server.js
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:5173` (or as assigned by Vite) and proxy/connect to the backend at `http://localhost:5000`.

---

## 👥 Default Demo Credentials
- **Admin**: `admin@acme.com` / `password123`
- **Adjuster / Verifier**: `verifier@acme.com` / `password123`
