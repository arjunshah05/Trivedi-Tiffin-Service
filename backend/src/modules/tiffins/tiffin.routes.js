import { Router } from 'express';
import { TiffinEntry } from './TiffinEntry.js';
import { parseMonth, dateString } from '../../shared/date.js';
import { ApiError } from '../../shared/ApiError.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { start, end } = parseMonth(req.query.month);
  const entries = await TiffinEntry.find({ userId: req.user._id, serviceDate: { $gte: start, $lte: end } }).sort({ serviceDate: 1, mealType: 1 }).lean();
  res.json({ data: { entries } });
}));

router.put('/:serviceDate/:mealType', asyncHandler(async (req, res) => {
  const { serviceDate, mealType } = req.params;
  const { status, note = '' } = req.body || {};
  if (!dateString(serviceDate)) throw new ApiError(400, 'Use a valid date in YYYY-MM-DD format.', 'INVALID_DATE');
  if (!['LUNCH', 'DINNER'].includes(mealType)) throw new ApiError(400, 'Meal type must be LUNCH or DINNER.', 'INVALID_MEAL_TYPE');
  if (!['RECEIVED', 'NOT_RECEIVED'].includes(status)) throw new ApiError(400, 'Status must be RECEIVED or NOT_RECEIVED.', 'INVALID_STATUS');
  const date = new Date(`${serviceDate}T00:00:00.000Z`);
  const now = new Date();
  if (date > new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))) {
    throw new ApiError(400, 'Future meal entries cannot be recorded yet.', 'FUTURE_ENTRY');
  }
  const entry = await TiffinEntry.findOneAndUpdate(
    { userId: req.user._id, serviceDate, mealType },
    { $set: { status, note: String(note).slice(0, 200) } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json({ data: { entry } });
}));

export default router;
