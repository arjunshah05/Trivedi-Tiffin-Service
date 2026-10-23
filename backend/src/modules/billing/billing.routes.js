import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { getBillingSummary } from './billing.service.js';
import { Payment } from '../payments/Payment.js';
import { parseMonth } from '../../shared/date.js';

const router = Router();
router.use(requireAuth);
router.get('/summary', asyncHandler(async (req, res) => {
  const month = String(req.query.month || new Date().toISOString().slice(0, 7));
  const summary = await getBillingSummary(req.user._id, month);
  res.json({ data: { summary } });
}));
router.get('/payments', asyncHandler(async (req, res) => {
  const month = String(req.query.month || new Date().toISOString().slice(0, 7));
  parseMonth(month);
  const payments = await Payment.find({ userId: req.user._id, billingPeriod: month }).sort({ paidAt: -1 }).lean();
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
