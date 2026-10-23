import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBill, confirmedPaymentsForMonth, effectivePaymentAmountPaise, rateForServiceDate } from '../src/modules/billing/billing.calculations.js';
import { validatePaymentCorrectionInput } from '../src/modules/payments/payment-corrections.service.js';

test('carries a prior unpaid balance into the next bill exactly once', () => {
  const october = calculateBill({
    monthlyChargesPaise: 225000,
    totalPaidPaise: 100000
  });
  assert.equal(october.totalDuePaise, 225000);
  assert.equal(october.remainingBalancePaise, 125000);

  const november = calculateBill({
    openingOutstandingPaise: october.remainingBalancePaise,
    monthlyChargesPaise: 180000,
    totalPaidPaise: 200000
  });
  assert.equal(november.totalDuePaise, 305000);
  assert.equal(november.remainingBalancePaise, 105000);
});

test('keeps a partial payment separate from the original bill amount', () => {
  const bill = calculateBill({
    monthlyChargesPaise: 225000,
    totalPaidPaise: 100000
  });
  assert.equal(bill.totalDuePaise, 225000);
  assert.equal(bill.remainingBalancePaise, 125000);
  assert.equal(bill.paymentStatus, 'PARTIALLY_PAID');
});

test('reports unpaid and fully paid bill statuses', () => {
  assert.equal(calculateBill({ monthlyChargesPaise: 225000 }).paymentStatus, 'UNPAID');
  assert.equal(calculateBill({ monthlyChargesPaise: 225000, totalPaidPaise: 225000 }).paymentStatus, 'PAID');
});

test('carries an overpayment forward as credit and applies it once next month', () => {
  const october = calculateBill({
    monthlyChargesPaise: 52500,
    totalPaidPaise: 105000
  });
  assert.equal(october.totalDuePaise, 52500);
  assert.equal(october.remainingBalancePaise, 0);
  assert.equal(october.creditCarriedForwardPaise, 52500);
  assert.equal(october.paymentStatus, 'PAID');

  const november = calculateBill({
    openingCreditPaise: october.creditCarriedForwardPaise,
    monthlyChargesPaise: 180000
  });
  assert.equal(november.totalDuePaise, 127500);
  assert.equal(november.remainingBalancePaise, 127500);
  assert.equal(november.creditCarriedForwardPaise, 0);
});

test('keeps partial payments as separate completed history records', () => {
  const payments = [
    { billingPeriod: '2026-10', amountPaise: 100000, status: 'CONFIRMED' },
    { billingPeriod: '2026-10', amountPaise: 50000, status: 'CONFIRMED' },
    { billingPeriod: '2026-10', amountPaise: 25000, status: 'REVERSED' },
    { billingPeriod: '2026-11', amountPaise: 30000, status: 'CONFIRMED' }
  ];
  const octoberPayments = confirmedPaymentsForMonth(payments, '2026-10');
  assert.equal(octoberPayments.length, 2);
  assert.deepEqual(octoberPayments.map(payment => payment.amountPaise), [100000, 50000]);
  assert.equal(octoberPayments.reduce((sum, payment) => sum + payment.amountPaise, 0), 150000);
});

test('uses an effective customer rate and falls back to global pricing', () => {
  const rates = [
    { effectiveFrom: '2026-01-01', amountPaise: 7500 },
    { effectiveFrom: '2026-10-01', amountPaise: 8000 },
    { userId: 'customer-a', effectiveFrom: '2026-09-15', amountPaise: 6500 },
    { userId: 'customer-a', effectiveFrom: '2026-11-01', amountPaise: 7000 },
    { userId: 'customer-b', effectiveFrom: '2026-10-01', amountPaise: 6000 }
  ];
  assert.equal(rateForServiceDate(rates, 'customer-a', '2026-08-20'), 7500);
  assert.equal(rateForServiceDate(rates, 'customer-a', '2026-10-20'), 6500);
  assert.equal(rateForServiceDate(rates, 'customer-a', '2026-11-01'), 7000);
  assert.equal(rateForServiceDate(rates, 'customer-b', '2026-10-20'), 6000);
  assert.equal(rateForServiceDate(rates, 'customer-c', '2026-10-20'), 8000);
});

test('uses the approved correction for billing and preserves the recorded amount', () => {
  const payment = { amountPaise: 150000, correctedAmountPaise: 100000 };
  const bill = calculateBill({
    monthlyChargesPaise: 250000,
    totalPaidPaise: effectivePaymentAmountPaise(payment)
  });
  assert.equal(payment.amountPaise, 150000);
  assert.equal(payment.correctedAmountPaise, 100000);
  assert.equal(bill.remainingBalancePaise, 150000);
});

test('uses the original payment amount when no correction was approved', () => {
  assert.equal(effectivePaymentAmountPaise({ amountPaise: 150000, correctedAmountPaise: null }), 150000);
});

test('accepts a valid customer payment correction request', () => {
  assert.deepEqual(validatePaymentCorrectionInput({
    requestedAmountRupees: 1000,
    reason: 'Actual transfer was ₹1,000.',
    idempotencyKey: 'correction-key-123'
  }), {
    requestedAmountPaise: 100000,
    explanation: 'Actual transfer was ₹1,000.',
    key: 'correction-key-123'
  });
});

test('rejects unsupported payment correction amounts', () => {
  for (const amount of [-1, 0, 'not-a-number', 100.123]) {
    assert.throws(
      () => validatePaymentCorrectionInput({
        requestedAmountRupees: amount,
        reason: 'Correction reason',
        idempotencyKey: 'correction-key-123'
      }),
      error => error.code === 'INVALID_CORRECTION_AMOUNT'
    );
  }
});
