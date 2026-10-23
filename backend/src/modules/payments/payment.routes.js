import { Router } from 'express';
import { Payment } from './Payment.js';
import { User } from '../users/User.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { ApiError } from '../../shared/ApiError.js';
import { rupeesToPaise } from '../../shared/money.js';
import { parseMonth } from '../../shared/date.js';
import { getBillingSummary } from '../billing/billing.service.js';

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

router.post('/:userId/:paymentId/reverse', asyncHandler(async (req, res) => {
  const reason = String(req.body?.reason || '').trim();
  if (reason.length < 3 || reason.length > 300) {
    throw new ApiError(400, 'Provide a reversal reason between 3 and 300 characters.', 'INVALID_REVERSAL_REASON');
  }
  const payment = await Payment.findOneAndUpdate(
    { _id: req.params.paymentId, userId: req.params.userId, status: 'CONFIRMED' },
    { $set: { status: 'REVERSED', reversedAt: new Date(), reversalReason: reason, reversedBy: req.user._id } },
    { new: true, runValidators: true }
  );
  if (!payment) throw new ApiError(404, 'Confirmed payment not found.', 'PAYMENT_NOT_FOUND');
  res.json({ data: { payment } });
}));

router.post('/:userId', asyncHandler(async (req, res) => {
  const { billingPeriod, amountRupees, method, paidAt, reference = '', note = '', idempotencyKey } = req.body || {};
  parseMonth(billingPeriod);
  if (!Number.isFinite(Number(amountRupees)) || Number(amountRupees) <= 0 || Number(amountRupees) > 10000000 || Math.abs(Number(amountRupees) * 100 - Math.round(Number(amountRupees) * 100)) > 1e-7) throw new ApiError(400, 'Payment must be a positive amount with no more than two decimal places.', 'INVALID_AMOUNT');
  if (!['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'].includes(method)) throw new ApiError(400, 'Choose a valid payment method.', 'INVALID_METHOD');
  const key = String(idempotencyKey || '').trim();
  if (key.length < 8 || key.length > 120) throw new ApiError(400, 'A valid idempotency key is required for each payment submission.', 'INVALID_IDEMPOTENCY_KEY');
  const user = await User.findById(req.params.userId);
  if (!user || user.role !== 'CUSTOMER') throw new ApiError(404, 'Customer not found.', 'CUSTOMER_NOT_FOUND');
  const amountPaise = rupeesToPaise(amountRupees);
  if (key) {
    const existing = await Payment.findOne({ userId: user._id, idempotencyKey: key });
    if (existing) {
      if (existing.billingPeriod !== billingPeriod || existing.amountPaise !== amountPaise || existing.method !== method) {
        throw new ApiError(409, 'This payment request key was already used for a different payment.', 'IDEMPOTENCY_KEY_REUSED');
      }
      return res.json({ data: { payment: existing } });
    }
  }
  const summary = await getBillingSummary(user._id, billingPeriod);
  if (amountPaise > summary.balancePaise) {
    throw new ApiError(400, 'Payment cannot exceed the outstanding balance for this bill.', 'PAYMENT_EXCEEDS_BALANCE');
  }
  const paymentDate = paidAt ? new Date(paidAt) : new Date();
  if (Number.isNaN(paymentDate.getTime())) throw new ApiError(400, 'Payment date is invalid.', 'INVALID_PAYMENT_DATE');
  let payment;
  try {
    payment = await Payment.create({
    userId: user._id, billingPeriod, amountPaise,
    method, paidAt: paymentDate,
    reference: String(reference).slice(0, 100), note: String(note).slice(0, 300),
    createdBy: req.user._id, idempotencyKey: key
    });
  } catch (error) {
    if (error.code !== 11000 || !key) throw error;
    payment = await Payment.findOne({ userId: user._id, idempotencyKey: key });
    if (!payment) throw error;
    if (payment.billingPeriod !== billingPeriod || payment.amountPaise !== amountPaise || payment.method !== method) {
      throw new ApiError(409, 'This payment request key was already used for a different payment.', 'IDEMPOTENCY_KEY_REUSED');
    }
    return res.json({ data: { payment } });
  }
  res.status(201).json({ data: { payment } });
}));

router.get('/customer/:userId', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user || user.role !== 'CUSTOMER') throw new ApiError(404, 'Customer not found.', 'CUSTOMER_NOT_FOUND');
  const month = req.query.month ? String(req.query.month) : undefined;
  if (month) parseMonth(month);
  const year = req.query.year ? String(req.query.year) : undefined;
  if (year && !/^\d{4}$/.test(year)) throw new ApiError(400, 'year must use YYYY format.', 'INVALID_YEAR');
  const filter = {
    userId: user._id,
    ...(month ? { billingPeriod: month } : year ? { billingPeriod: new RegExp(`^${year}-`) } : {})
  };
  const payments = await Payment.find(filter).sort({ paidAt: -1 }).populate('createdBy', 'fullName email').lean();
  res.json({ data: { payments } });
}));

export default router;
