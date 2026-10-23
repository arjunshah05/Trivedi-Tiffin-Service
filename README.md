# Trivedi Tiffin Service

A modular full-stack application for customer accounts, lunch/dinner tracking, monthly billing, manual weekly payments, and an admin dashboard.

## Stack

- Node.js 24 LTS (recommended; use a currently supported LTS release)
- React 19.3 + Vite 8
- Node.js + Express 5
- MongoDB + Mongoose 9
- Cookie-based JWT authentication with HttpOnly cookies
- CSS modules-by-feature (one global design system stylesheet)

Package versions are pinned to stable release lines available at project creation. Before a real production release, run dependency/security audits and update lockfiles with `npm install`.

## Features

- Customer registration and login
- Customer dashboard with current/previous month summary
- Calendar-based lunch and dinner tracking
- States: received, not received, unrecorded
- Configurable per-tiffin price
- Admin customer list and overview
- Admin manual payment entry (cash/UPI/bank transfer/other)
- Payment history and remaining balance calculation
- Role-based access control
- Modular frontend feature folders and backend modules
- Validation, rate limiting, Helmet, request logging, and consistent API errors

## Quick start

Prerequisites: Node.js 24 LTS, npm, and a MongoDB database (local MongoDB or MongoDB Atlas).

1. Copy `backend/.env.example` to `backend/.env` and set a strong `JWT_SECRET` and `MONGODB_URI`. Copy `frontend/.env.example` to `frontend/.env`; leave `VITE_API_BASE_URL` empty for local Vite development.
2. In one terminal:
   ```bash
   cd backend
   npm install
   npm run seed:admin
   npm run dev
   ```
3. In another terminal:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Open the Vite URL printed in the terminal (usually `http://localhost:5173`).

The development server proxies `/api` to the backend at `http://localhost:5000`. Keep both terminals running.

## First admin account

Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `backend/.env`, then run `npm run seed:admin`. The script creates an admin only if the email does not already exist. Do not expose this seed script or admin credentials publicly.

## Business rules implemented

- Only `RECEIVED` meals count toward charges.
- A tiffin is a meal: lunch and dinner are counted independently.
- The default rate is stored in the `PricingRate` collection; admin can update it.
- Monthly charges are the sum of received meals at the rate effective on each meal's date. Lunch and dinner are charged separately.
- Monthly bill snapshots are stored separately from payments. Each bill records its monthly charges, opening outstanding balance, adjustments, total due, payments, remaining balance, and payment status.
- `total due = opening outstanding + monthly charges + adjustments`; the previous month's remaining balance becomes the next month's opening balance exactly once.
- Payments are separate ledger records and never reduce the original meal charges. Confirmed payments reduce the selected month's cumulative amount due; reversed transactions remain in the audit history and no longer count toward the bill.
- Payment amounts are validated against the outstanding balance. Admin payment requests use idempotency keys to avoid duplicate submissions. Completed payments can be reversed by an administrator with a required reason.
- Bill status is Unpaid, Partially Paid, or Paid based on total due and confirmed payments. Payment history can be filtered by month (including year).
- Amounts are stored as integer paise, avoiding floating-point currency calculations.
- Payment records are not deleted through the API. Administrators can reverse a payment with an audited reason.
- This version does not process online payments; payment methods are recorded manually.

## Important production checklist

This is a substantial working starter, not a substitute for production QA or security review. Before going live:
- Use HTTPS and a secure same-site deployment strategy.
- Set `NODE_ENV=production`, a long random secret, and exact `CLIENT_ORIGIN`.
- Add password reset/email verification and operational account recovery.
- Add audit logging and payment reversal/adjustment workflow.
- Confirm business policy for historical edits, rate changes, month closing, and overpayments.
- Add automated tests and run `npm audit` in both packages.
- Configure backups, restore tests, monitoring, and alerting.
- Review cookie/CSRF behavior for your exact production domain architecture.
- Do not treat an unrecorded meal as “not received”; it remains unrecorded until a customer saves a state.

## Scripts

Backend:
- `npm run dev` — development server
- `npm start` — production server
- `npm run seed:admin` — create initial admin from environment values

Frontend:
- `npm run dev` — Vite development server
- `npm run build` — production build
- `npm run preview` — preview production build

Backend tests:
- `npm test` — run billing calculation and balance carry-forward tests

## Project layout

```text
Trivedi-Tiffin-Service/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── tiffins/
│   │   │   ├── pricing/
│   │   │   ├── payments/
│   │   │   ├── billing/
│   │   │   └── admin/
│   │   ├── shared/
│   │   ├── app.js
│   │   └── server.js
│   └── scripts/seedAdmin.js
└── frontend/
    └── src/
        ├── app/
        ├── components/
        ├── features/
        ├── services/
        ├── utils/
        ├── App.jsx
        ├── main.jsx
        └── styles.css
```
