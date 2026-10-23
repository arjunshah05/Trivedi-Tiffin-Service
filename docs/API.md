# API Reference

Base: `/api/v1`. All successful responses use `{ "data": ... }`; errors use `{ "error": { "code", "message" } }`.

## Authentication
- `POST /auth/register` — `{ fullName, email, phone?, password }`; creates CUSTOMER only.
- `POST /auth/login` — `{ email, password }`; sets HttpOnly session cookie.
- `POST /auth/logout` — clears session cookie.
- `GET /auth/me` — authenticated current user.

## Tiffin tracking
- `GET /tiffins?month=YYYY-MM`
- `PUT /tiffins/:serviceDate/:mealType` — `{ status: "RECEIVED" | "NOT_RECEIVED", note? }`
- `mealType` is `LUNCH` or `DINNER`; serviceDate is `YYYY-MM-DD`.

## Billing and customer data
- `GET /billing/dashboard?month=YYYY-MM` — current and previous month summaries.
- `GET /billing/summary?month=YYYY-MM`
- `GET /billing/payments?month=YYYY-MM`
- `GET /pricing/current`

Billing summaries include `monthlyChargesPaise`, `openingOutstandingPaise`, `totalDuePaise`, `totalPaidPaise`, `remainingBalancePaise`, and `paymentStatus` (`UNPAID`, `PARTIALLY_PAID`, or `PAID`). Monthly bill snapshots are persisted separately from payment transactions. The preceding month's remaining balance is carried forward once.

## Administrator
- `GET /admin/overview?month=YYYY-MM`
- `GET /admin/customers?search=&page=1&limit=20`
- `GET /admin/customers/:userId/summary?month=YYYY-MM`
- `PATCH /admin/customers/:userId/status` — `{ status: "ACTIVE" | "INACTIVE" }`
- `GET /admin/pricing`
- `POST /pricing` — `{ amountRupees, effectiveFrom }` (admin-only)
- `POST /admin/payments/:userId` — `{ billingPeriod, amountRupees, method, paidAt?, reference?, note?, idempotencyKey }`. Amounts cannot exceed the outstanding balance for that bill. A unique idempotency key is required per payment form submission.
- `POST /admin/payments/:userId/:paymentId/reverse` — `{ reason }`; reverses a confirmed payment while retaining its audit record.
- `GET /admin/payments/customer/:userId?month=YYYY-MM` (or `?year=YYYY`)

Payment history includes completed and reversed transactions. Reversals require a reason and are excluded from billing calculations.
