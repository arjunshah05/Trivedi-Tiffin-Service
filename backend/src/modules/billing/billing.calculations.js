export function calculateBill({
  openingOutstandingPaise = 0,
  monthlyChargesPaise = 0,
  adjustmentsPaise = 0,
  totalPaidPaise = 0
}) {
  const totalDuePaise = openingOutstandingPaise + monthlyChargesPaise + adjustmentsPaise;
  const remainingBalancePaise = Math.max(0, totalDuePaise - totalPaidPaise);
  const paymentStatus = remainingBalancePaise === 0
    ? 'PAID'
    : totalPaidPaise > 0 ? 'PARTIALLY_PAID' : 'UNPAID';

  return { totalDuePaise, remainingBalancePaise, paymentStatus };
}

export function confirmedPaymentsForMonth(payments, month) {
  return payments.filter(payment =>
    payment.billingPeriod === month && payment.status === 'CONFIRMED'
  );
}
