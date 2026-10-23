import { Router } from 'express';
import { PricingRate } from './PricingRate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { ApiError } from '../../shared/ApiError.js';
import { rupeesToPaise } from '../../shared/money.js';
import { dateString } from '../../shared/date.js';

const router = Router();
router.get('/current', requireAuth, asyncHandler(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const rate = await PricingRate.findOne({ effectiveFrom: { $lte: today } }).sort({ effectiveFrom: -1 }).lean();
  res.json({ data: { rate: rate || { amountPaise: 7500, effectiveFrom: 'default' } } });
}));
router.get('/', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const rates = await PricingRate.find().sort({ effectiveFrom: -1 }).lean();
  res.json({ data: { rates } });
}));
router.post('/', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const { amountRupees, effectiveFrom } = req.body || {};
  if (!Number.isFinite(Number(amountRupees)) || Number(amountRupees) <= 0 || Number(amountRupees) > 1000000) throw new ApiError(400, 'Price must be between ₹0.01 and ₹10,00,000.', 'INVALID_PRICE');
  if (!dateString(effectiveFrom)) throw new ApiError(400, 'effectiveFrom must be a valid YYYY-MM-DD date.', 'INVALID_DATE');
  const rate = await PricingRate.create({ amountPaise: rupeesToPaise(amountRupees), effectiveFrom, createdBy: req.user._id });
  res.status(201).json({ data: { rate } });
}));
export default router;
