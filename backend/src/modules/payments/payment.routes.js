import { Router } from 'express';
import { Payment } from './Payment.js';
import { User } from '../users/User.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { ApiError } from '../../shared/ApiError.js';
import { parseMonth } from '../../shared/date.js';
import { createConfirmedPayment } from './payment.service.js';

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
  const user = await User.findById(req.params.userId);
  if (!user || user.role !== 'CUSTOMER') throw new ApiError(404, 'Customer not found.', 'CUSTOMER_NOT_FOUND');
  const result = await createConfirmedPayment({ userId: user._id, actorId: req.user._id, input: req.body });
  res.status(result.created ? 201 : 200).json({ data: { payment: result.payment } });
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
