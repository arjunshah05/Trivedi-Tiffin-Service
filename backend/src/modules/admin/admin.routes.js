import { Router } from 'express';
import { User } from '../users/User.js';
import { TiffinEntry } from '../tiffins/TiffinEntry.js';
import { Payment } from '../payments/Payment.js';
import { PricingRate } from '../pricing/PricingRate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { getBillingSummary } from '../billing/billing.service.js';
import { parseMonth } from '../../shared/date.js';

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

router.get('/overview', asyncHandler(async (req, res) => {
  const month = String(req.query.month || new Date().toISOString().slice(0, 7));
  parseMonth(month);
  const customers = await User.countDocuments({ role: 'CUSTOMER', status: 'ACTIVE' });
  const entries = await TiffinEntry.countDocuments({ serviceDate: { $regex: `^${month}` }, status: 'RECEIVED' });
  const payments = await Payment.find({ billingPeriod: month, status: 'CONFIRMED' }).lean();
  const collectedPaise = payments.reduce((sum, p) => sum + p.amountPaise, 0);
  const userIds = await User.find({ role: 'CUSTOMER' }).distinct('_id');
  let chargesPaise = 0, outstandingPaise = 0;
  for (const userId of userIds) {
    const summary = await getBillingSummary(userId, month);
    chargesPaise += summary.totalDuePaise;
    outstandingPaise += summary.balancePaise;
  }
  res.json({ data: { month, activeCustomers: customers, receivedTiffins: entries, collectedPaise, chargesPaise, outstandingPaise } });
}));

router.get('/customers', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const search = String(req.query.search || '').trim().slice(0, 80);
  const filter = { role: 'CUSTOMER', ...(search ? { $or: [
    { fullName: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
    { email: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
    { phone: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
  ] } : {}) };
  const [customers, total] = await Promise.all([
    User.find(filter).select('fullName email phone status createdAt').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter)
  ]);
  res.json({ data: { customers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
}));

router.get('/customers/:userId/summary', asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.userId, role: 'CUSTOMER' }).select('fullName email phone status');
  if (!user) return res.status(404).json({ error: { code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found.' } });
  const month = String(req.query.month || new Date().toISOString().slice(0, 7));
  const summary = await getBillingSummary(user._id, month);
  res.json({ data: { user, summary } });
}));

router.patch('/customers/:userId/status', asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!['ACTIVE', 'INACTIVE'].includes(status)) return res.status(400).json({ error: { code: 'INVALID_STATUS', message: 'Status must be ACTIVE or INACTIVE.' } });
  const user = await User.findOneAndUpdate({ _id: req.params.userId, role: 'CUSTOMER' }, { status }, { new: true }).select('fullName email status');
  if (!user) return res.status(404).json({ error: { code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found.' } });
  res.json({ data: { user } });
}));

router.get('/pricing', asyncHandler(async (req, res) => {
  const rates = await PricingRate.find().sort({ effectiveFrom: -1 }).lean();
  res.json({ data: { rates } });
}));
export default router;
