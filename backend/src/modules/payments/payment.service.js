import { Payment } from './Payment.js';
import { ApiError } from '../../shared/ApiError.js';
import { rupeesToPaise } from '../../shared/money.js';
import { parseMonth } from '../../shared/date.js';
import { getBillingSummary } from '../billing/billing.service.js';

export async function createConfirmedPayment({ userId, actorId, input }) {
  const { billingPeriod, amountRupees, method, paidAt, reference = '', note = '', idempotencyKey } = input || {};
  parseMonth(billingPeriod);
  const amount = Number(amountRupees);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10000000 || Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-7) {
    throw new ApiError(400, 'Payment must be a positive amount with no more than two decimal places.', 'INVALID_AMOUNT');
  }
  if (!['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'].includes(method)) {
    throw new ApiError(400, 'Choose a valid payment method.', 'INVALID_METHOD');
  }
  const key = String(idempotencyKey || '').trim();
  if (key.length < 8 || key.length > 120) {
    throw new ApiError(400, 'A valid idempotency key is required for each payment submission.', 'INVALID_IDEMPOTENCY_KEY');
  }

  const amountPaise = rupeesToPaise(amount);
  const existing = await Payment.findOne({ userId, idempotencyKey: key });
  if (existing) {
    assertSamePayment(existing, billingPeriod, amountPaise, method);
    return { payment: existing, created: false };
  }

  await getBillingSummary(userId, billingPeriod);
  const paymentDate = paidAt ? new Date(paidAt) : new Date();
  if (Number.isNaN(paymentDate.getTime())) {
    throw new ApiError(400, 'Payment date is invalid.', 'INVALID_PAYMENT_DATE');
  }

  try {
    const [payment] = await Payment.create([{
      userId,
      billingPeriod,
      amountPaise,
      method,
      paidAt: paymentDate,
      reference: String(reference).slice(0, 100),
      note: String(note).slice(0, 300),
      createdBy: actorId,
      idempotencyKey: key
    }]);
    return { payment, created: true };
  } catch (error) {
    if (error.code !== 11000) throw error;
    const duplicate = await Payment.findOne({ userId, idempotencyKey: key });
    if (!duplicate) throw error;
    assertSamePayment(duplicate, billingPeriod, amountPaise, method);
    return { payment: duplicate, created: false };
  }
}

function assertSamePayment(payment, billingPeriod, amountPaise, method) {
  if (payment.billingPeriod !== billingPeriod || payment.amountPaise !== amountPaise || payment.method !== method) {
    throw new ApiError(409, 'This payment request key was already used for a different payment.', 'IDEMPOTENCY_KEY_REUSED');
  }
}
