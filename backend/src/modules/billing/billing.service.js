import { TiffinEntry } from '../tiffins/TiffinEntry.js';
import { PricingRate } from '../pricing/PricingRate.js';
import { Payment } from '../payments/Payment.js';
import { MonthlyBill } from './MonthlyBill.js';
import { calculateBill, confirmedPaymentsForMonth } from './billing.calculations.js';
import { parseMonth } from '../../shared/date.js';

function monthAfter(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  const next = new Date(Date.UTC(year, monthNumber, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthsBetween(first, last) {
  const months = [];
  for (let month = first; month <= last; month = monthAfter(month)) months.push(month);
  return months;
}

export async function getBillingSummary(userId, month) {
  const { end } = parseMonth(month);
  const [entries, rates, payments, existingBills] = await Promise.all([
    TiffinEntry.find({ userId, serviceDate: { $lte: end }, status: 'RECEIVED' }).lean(),
    PricingRate.find({ effectiveFrom: { $lte: end } }).sort({ effectiveFrom: 1 }).lean(),
    Payment.find({ userId, billingPeriod: { $lte: month } }).lean(),
    MonthlyBill.find({ userId, billingPeriod: { $lte: month } }).lean()
  ]);
  const entriesByMonth = new Map();
  for (const entry of entries) {
    const entryMonth = entry.serviceDate.slice(0, 7);
    if (!entriesByMonth.has(entryMonth)) entriesByMonth.set(entryMonth, []);
    entriesByMonth.get(entryMonth).push(entry);
  }
  const paymentsByMonth = new Map();
  for (const payment of payments) {
    if (payment.status !== 'CONFIRMED') continue;
    paymentsByMonth.set(payment.billingPeriod, (paymentsByMonth.get(payment.billingPeriod) || 0) + payment.amountPaise);
  }
  const existingByMonth = new Map(existingBills.map(bill => [bill.billingPeriod, bill]));
  const firstMonth = [
    ...entries.map(entry => entry.serviceDate.slice(0, 7)),
    ...payments.map(payment => payment.billingPeriod),
    ...existingBills.map(bill => bill.billingPeriod),
    month
  ].sort()[0];
  const periods = monthsBetween(firstMonth, month);
  let openingOutstandingPaise = 0;
  let currentBill;

  for (const period of periods) {
    const periodEntries = entriesByMonth.get(period) || [];
    let lunchCount = 0;
    let dinnerCount = 0;
    let monthlyChargesPaise = 0;

    for (const entry of periodEntries) {
      if (entry.mealType === 'LUNCH') lunchCount++;
      if (entry.mealType === 'DINNER') dinnerCount++;
      const applicableRate = [...rates].reverse().find(rate => rate.effectiveFrom <= entry.serviceDate);
      monthlyChargesPaise += applicableRate?.amountPaise ?? rates[0]?.amountPaise ?? 7500;
    }

    const adjustmentsPaise = existingByMonth.get(period)?.adjustmentsPaise || 0;
    const totalPaidPaise = paymentsByMonth.get(period) || 0;
    const calculation = calculateBill({
      openingOutstandingPaise,
      monthlyChargesPaise,
      adjustmentsPaise,
      totalPaidPaise
    });
    const bill = await MonthlyBill.findOneAndUpdate(
      { userId, billingPeriod: period },
      {
        $set: {
          lunchCount,
          dinnerCount,
          monthlyChargesPaise,
          openingOutstandingPaise,
          adjustmentsPaise,
          totalDuePaise: calculation.totalDuePaise,
          totalPaidPaise,
          remainingBalancePaise: calculation.remainingBalancePaise,
          paymentStatus: calculation.paymentStatus,
          calculatedAt: new Date()
        }
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    openingOutstandingPaise = bill.remainingBalancePaise;
    if (period === month) currentBill = bill;
  }

  const monthPayments = confirmedPaymentsForMonth(payments, month);
  return {
    month,
    lunchCount: currentBill.lunchCount,
    dinnerCount: currentBill.dinnerCount,
    totalTiffins: currentBill.lunchCount + currentBill.dinnerCount,
    chargePaise: currentBill.monthlyChargesPaise,
    monthlyChargesPaise: currentBill.monthlyChargesPaise,
    openingOutstandingPaise: currentBill.openingOutstandingPaise,
    adjustmentsPaise: currentBill.adjustmentsPaise,
    totalDuePaise: currentBill.totalDuePaise,
    paidPaise: currentBill.totalPaidPaise,
    totalPaidPaise: currentBill.totalPaidPaise,
    balancePaise: currentBill.remainingBalancePaise,
    remainingBalancePaise: currentBill.remainingBalancePaise,
    paymentStatus: currentBill.paymentStatus,
    paymentsCount: monthPayments.length
  };
}
