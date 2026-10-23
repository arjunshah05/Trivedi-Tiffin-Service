# Production Readiness Review

This codebase includes security-conscious defaults and modular boundaries, but should be treated as a production-oriented starter requiring a real deployment review.

## Required before public launch
- Run `npm install` in both applications and commit generated lockfiles.
- Run `npm audit` and address high/critical findings.
- Add unit/integration/E2E tests (billing, access control, meal uniqueness, payment retry).
- Add CSRF strategy appropriate to the final domain/cookie architecture.
- Add rate limiting for write endpoints, not only authentication.
- Add admin audit events for sensitive changes and financial operations.
- Add payment reversal and adjustment records instead of deleting history.
- Define overpayment handling and rate changes with invoice snapshots.
- Add pagination to payment history and month exports.
- Configure HTTPS, backup/restore, monitoring, and incident response.
- Add password reset, email verification, and admin recovery.
- Confirm time zone and date-boundary policy with the business owner.
- Review all validation and access-control paths with tests.

## Financial calculation caveat
Monthly summary charges received meals at the rate effective on each meal date. Payment totals are scoped to the selected billing period. The current starter reports a negative balance if recorded payments exceed that period's charges; decide whether this should be represented as credit carried forward. This behavior is intentionally visible rather than silently discarding overpayments.
