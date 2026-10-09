# Medicine Availability Finder

A centralized healthcare web application connecting patients with verified pharmacies and medical agencies to find medicine stock availability, pricing, locations, and real-time alerts.

## Project Structure

```
medicine-availability-finder/
├── backend/            # Express.js REST API server & Neon PostgreSQL controllers
└── frontend/           # Vite + React.js single-page application with Tailwind CSS
```

## Quick Start (Development)

### Backend Service
```bash
cd backend
npm install
npm run dev
```
Runs on: `http://localhost:5000`
Health Endpoint: `http://localhost:5000/api/health`

### Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Runs on: `http://localhost:5173`

## Environment Configuration
See `backend/.env.example` for required environment variables.
