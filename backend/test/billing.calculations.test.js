import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBill, confirmedPaymentsForMonth } from '../src/modules/billing/billing.calculations.js';

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
