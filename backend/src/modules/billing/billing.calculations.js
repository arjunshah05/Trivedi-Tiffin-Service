export function calculateBill({
  openingOutstandingPaise = 0,
  openingCreditPaise = 0,
  monthlyChargesPaise = 0,
  adjustmentsPaise = 0,
  totalPaidPaise = 0
}) {
  const totalDuePaise = Math.max(
    0,
    openingOutstandingPaise + monthlyChargesPaise + adjustmentsPaise - openingCreditPaise
  );
  const remainingBalancePaise = Math.max(0, totalDuePaise - totalPaidPaise);
  const creditCarriedForwardPaise = Math.max(0, totalPaidPaise - totalDuePaise);
  const paymentStatus = remainingBalancePaise === 0
    ? 'PAID'
    : totalPaidPaise > 0 ? 'PARTIALLY_PAID' : 'UNPAID';

  return { totalDuePaise, remainingBalancePaise, creditCarriedForwardPaise, paymentStatus };
}

export function confirmedPaymentsForMonth(payments, month) {
  return payments.filter(payment =>
    payment.billingPeriod === month && payment.status === 'CONFIRMED'
  );
}

export function effectivePaymentAmountPaise(payment) {
  return payment.correctedAmountPaise ?? payment.amountPaise;
}

export function rateForServiceDate(rates, userId, serviceDate, defaultRatePaise = 7500) {
  const globalRates = rates.filter(rate => !rate.userId);
  const customerRates = rates.filter(rate => rate.userId && String(rate.userId) === String(userId));
  const customRate = [...customerRates].reverse().find(rate => rate.effectiveFrom <= serviceDate);
  const globalRate = [...globalRates].reverse().find(rate => rate.effectiveFrom <= serviceDate);
  return customRate?.amountPaise ?? globalRate?.amountPaise ?? defaultRatePaise;
}
