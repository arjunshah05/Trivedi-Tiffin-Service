import mongoose from 'mongoose';
import { Payment } from './Payment.js';
import { ApiError } from '../../shared/ApiError.js';
import { rupeesToPaise } from '../../shared/money.js';

export function validatePaymentCorrectionInput(input = {}) {
  const amount = Number(input.requestedAmountRupees);
  const explanation = String(input.reason || '').trim();
  const key = String(input.idempotencyKey || '').trim();
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10000000 || Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-7) {
    throw new ApiError(400, 'Corrected amount must be positive and have no more than two decimal places.', 'INVALID_CORRECTION_AMOUNT');
  }
  if (explanation.length < 3 || explanation.length > 500) {
    throw new ApiError(400, 'Provide a correction reason between 3 and 500 characters.', 'INVALID_CORRECTION_REASON');
  }
  if (key.length < 8 || key.length > 120) {
    throw new ApiError(400, 'A valid idempotency key is required for each correction request.', 'INVALID_IDEMPOTENCY_KEY');
  }
  return { requestedAmountPaise: rupeesToPaise(amount), explanation, key };
}

export async function requestPaymentCorrection({ userId, paymentId, input }) {
  const { requestedAmountPaise, explanation, key } = validatePaymentCorrectionInput(input);

  const payment = await Payment.findOne({ _id: paymentId, userId, status: 'CONFIRMED' });
  if (!payment) throw new ApiError(404, 'Confirmed payment not found.', 'PAYMENT_NOT_FOUND');
  const duplicate = payment.correctionRequests.find(request => request.idempotencyKey === key);
  if (duplicate) {
    assertSameCorrection(duplicate, requestedAmountPaise, explanation);
    return { correction: duplicate, created: false };
  }
  const originalAmountPaise = payment.correctedAmountPaise ?? payment.amountPaise;
  if (requestedAmountPaise === originalAmountPaise) {
    throw new ApiError(400, 'The corrected amount must differ from the current payment amount.', 'UNCHANGED_CORRECTION_AMOUNT');
  }

  if (payment.correctionRequests.some(request => request.status === 'PENDING')) {
    throw new ApiError(409, 'This payment already has a pending correction request.', 'CORRECTION_ALREADY_PENDING');
  }

  const correctionId = new mongoose.Types.ObjectId();
  const correction = {
    _id: correctionId,
    originalAmountPaise,
    requestedAmountPaise,
    reason: explanation,
    idempotencyKey: key,
    requestedBy: userId,
    requestedAt: new Date(),
    previousPaymentStatus: payment.status,
    status: 'PENDING'
  };
  const updated = await Payment.findOneAndUpdate(
    {
      _id: payment._id,
      userId,
      status: 'CONFIRMED',
      $and: [
        { correctionRequests: { $not: { $elemMatch: { status: 'PENDING' } } } },
        { correctionRequests: { $not: { $elemMatch: { idempotencyKey: key } } } }
      ]
    },
    { $push: { correctionRequests: correction } },
    { new: true, runValidators: true }
  ).lean();

  if (updated) {
    return { correction: updated.correctionRequests.find(request => String(request._id) === String(correctionId)), created: true };
  }
  const latest = await Payment.findOne({ _id: payment._id, userId }).lean();
  const racedDuplicate = latest?.correctionRequests.find(request => request.idempotencyKey === key);
  if (racedDuplicate) {
    assertSameCorrection(racedDuplicate, requestedAmountPaise, explanation);
    return { correction: racedDuplicate, created: false };
  }
  if (latest?.correctionRequests.some(request => request.status === 'PENDING')) {
    throw new ApiError(409, 'This payment already has a pending correction request.', 'CORRECTION_ALREADY_PENDING');
  }
  throw new ApiError(409, 'The payment changed while the correction was being submitted. Refresh and try again.', 'PAYMENT_CHANGED');
}

function assertSameCorrection(correction, amountPaise, reason) {
  if (correction.requestedAmountPaise !== amountPaise || correction.reason !== reason) {
    throw new ApiError(409, 'This request key was already used for a different correction.', 'IDEMPOTENCY_KEY_REUSED');
  }
}

export async function decidePaymentCorrection({ paymentId, userId, correctionId, reviewerId, decision, decisionReason = '' }) {
  const updateTime = new Date();
  const update = {
    $set: {
      'correctionRequests.$.status': decision,
      'correctionRequests.$.reviewedBy': reviewerId,
      'correctionRequests.$.reviewedAt': updateTime,
      'correctionRequests.$.decisionReason': decisionReason,
      'correctionRequests.$.updatedPaymentStatus': 'CONFIRMED'
    }
  };

  if (decision === 'APPROVED') {
    const payment = await Payment.findOne({ _id: paymentId, userId, status: 'CONFIRMED' }).lean();
    if (!payment) throw new ApiError(404, 'Confirmed payment not found.', 'PAYMENT_NOT_FOUND');
    const correction = payment.correctionRequests.find(request =>
      String(request._id) === String(correctionId) && request.status === 'PENDING'
    );
    if (!correction) throw new ApiError(409, 'This correction request has already been reviewed.', 'CORRECTION_ALREADY_REVIEWED');
    update.$set.correctedAmountPaise = correction.requestedAmountPaise;
  }

  const payment = await Payment.findOneAndUpdate(
    {
      _id: paymentId,
      userId,
      status: 'CONFIRMED',
      correctionRequests: { $elemMatch: { _id: correctionId, status: 'PENDING' } }
    },
    update,
    { new: true, runValidators: true }
  );
  if (!payment) throw new ApiError(409, 'This correction request has already been reviewed or the payment is unavailable.', 'CORRECTION_ALREADY_REVIEWED');
  return payment;
}
