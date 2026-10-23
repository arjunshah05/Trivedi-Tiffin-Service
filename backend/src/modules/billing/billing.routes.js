import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { getBillingSummary } from './billing.service.js';
import { Payment } from '../payments/Payment.js';
import { parseMonth } from '../../shared/date.js';
import { ApiError } from '../../shared/ApiError.js';
import { createConfirmedPayment } from '../payments/payment.service.js';
import { requestPaymentCorrection } from '../payments/payment-corrections.service.js';

const router = Router();
router.use(requireAuth);
router.post('/payments', asyncHandler(async (req, res) => {
  if (req.user.role !== 'CUSTOMER') {
    throw new ApiError(403, 'Only customer accounts can submit their own payments.', 'FORBIDDEN');
  }
  const result = await createConfirmedPayment({
    userId: req.user._id,
    actorId: req.user._id,
    input: req.body
  });
  res.status(result.created ? 201 : 200).json({ data: { payment: result.payment } });
}));
router.post('/payments/:paymentId/corrections', asyncHandler(async (req, res) => {
  if (req.user.role !== 'CUSTOMER') {
    throw new ApiError(403, 'Only customers can request corrections to their own payments.', 'FORBIDDEN');
  }
  const result = await requestPaymentCorrection({
    userId: req.user._id,
    paymentId: req.params.paymentId,
    input: req.body
  });
  res.status(result.created ? 201 : 200).json({ data: { correction: result.correction } });
}));
router.get('/summary', asyncHandler(async (req, res) => {
  const month = String(req.query.month || new Date().toISOString().slice(0, 7));
  const summary = await getBillingSummary(req.user._id, month);
  res.json({ data: { summary } });
}));
router.get('/payments', asyncHandler(async (req, res) => {
  const month = String(req.query.month || new Date().toISOString().slice(0, 7));
  parseMonth(month);
  const payments = await Payment.find({ userId: req.user._id, billingPeriod: month })
    .sort({ paidAt: -1 })
    .populate('correctionRequests.requestedBy', 'fullName email')
    .populate('correctionRequests.reviewedBy', 'fullName email')
    .lean();
  res.json({ data: { payments } });
}));
router.get('/dashboard', asyncHandler(async (req, res) => {
  const current = String(req.query.month || new Date().toISOString().slice(0, 7));
  parseMonth(current);
  const [y, m] = current.split('-').map(Number);
  const previousDate = new Date(Date.UTC(y, m - 2, 1));
  const previous = `${previousDate.getUTCFullYear()}-${String(previousDate.getUTCMonth() + 1).padStart(2, '0')}`;
  const [currentSummary, previousSummary] = await Promise.all([
    getBillingSummary(req.user._id, current), getBillingSummary(req.user._id, previous)
  ]);
  res.json({ data: { current: currentSummary, previous: previousSummary } });
}));
export default router;
