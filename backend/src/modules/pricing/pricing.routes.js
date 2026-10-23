import { Router } from 'express';
import { PricingRate } from './PricingRate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { ApiError } from '../../shared/ApiError.js';
import { rupeesToPaise } from '../../shared/money.js';
import { dateString } from '../../shared/date.js';
import { User } from '../users/User.js';

const router = Router();
router.get('/current', requireAuth, asyncHandler(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const [customerRate, globalRate] = await Promise.all([
    req.user.role === 'CUSTOMER'
      ? PricingRate.findOne({ userId: req.user._id, effectiveFrom: { $lte: today } }).sort({ effectiveFrom: -1, createdAt: -1, _id: -1 }).lean()
      : null,
    PricingRate.findOne({
      effectiveFrom: { $lte: today },
      $or: [{ userId: null }, { userId: { $exists: false } }]
    }).sort({ effectiveFrom: -1, createdAt: -1, _id: -1 }).lean()
  ]);
  res.json({ data: { rate: customerRate || globalRate || { amountPaise: 7500, effectiveFrom: 'default' }, isCustom: Boolean(customerRate) } });
}));
router.get('/', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const rates = await PricingRate.find({ $or: [{ userId: null }, { userId: { $exists: false } }] }).sort({ effectiveFrom: -1, createdAt: -1, _id: -1 }).lean();
  res.json({ data: { rates } });
}));
router.post('/', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const { amountRupees, effectiveFrom } = req.body || {};
  if (!Number.isFinite(Number(amountRupees)) || Number(amountRupees) <= 0 || Number(amountRupees) > 1000000) throw new ApiError(400, 'Price must be between ₹0.01 and ₹10,00,000.', 'INVALID_PRICE');
  if (!dateString(effectiveFrom)) throw new ApiError(400, 'effectiveFrom must be a valid YYYY-MM-DD date.', 'INVALID_DATE');
  const rate = await PricingRate.create({ userId: null, amountPaise: rupeesToPaise(amountRupees), effectiveFrom, createdBy: req.user._id });
  res.status(201).json({ data: { rate } });
}));
router.get('/customers/:userId', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const customer = await User.findOne({ _id: req.params.userId, role: 'CUSTOMER' }).select('_id');
  if (!customer) throw new ApiError(404, 'Customer not found.', 'CUSTOMER_NOT_FOUND');
  const today = new Date().toISOString().slice(0, 10);
  const [rates, currentRate] = await Promise.all([
    PricingRate.find({ userId: customer._id }).sort({ effectiveFrom: -1, createdAt: -1, _id: -1 }).lean(),
    PricingRate.findOne({ userId: customer._id, effectiveFrom: { $lte: today } }).sort({ effectiveFrom: -1, createdAt: -1, _id: -1 }).lean()
  ]);
  res.json({ data: { rates, currentRate } });
}));
router.post('/customers/:userId', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const { amountRupees, effectiveFrom } = req.body || {};
  const amount = Number(amountRupees);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000 || Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-7) {
    throw new ApiError(400, 'Price must be between ₹0.01 and ₹10,00,000 with no more than two decimal places.', 'INVALID_PRICE');
  }
  if (!dateString(effectiveFrom)) throw new ApiError(400, 'effectiveFrom must be a valid YYYY-MM-DD date.', 'INVALID_DATE');
  const customer = await User.findOne({ _id: req.params.userId, role: 'CUSTOMER' }).select('_id');
  if (!customer) throw new ApiError(404, 'Customer not found.', 'CUSTOMER_NOT_FOUND');
  const rate = await PricingRate.create({
    userId: customer._id,
    amountPaise: rupeesToPaise(amount),
    effectiveFrom,
    createdBy: req.user._id
  });
  res.status(201).json({ data: { rate } });
}));
export default router;
