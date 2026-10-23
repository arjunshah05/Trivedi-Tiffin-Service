export function rupeesToPaise(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error('Amount must be a non-negative number.');
  return Math.round((n + Number.EPSILON) * 100);
}
export function paiseToRupees(paise) {
  return Number((Number(paise || 0) / 100).toFixed(2));
}
export function formatINR(paise) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((paise || 0) / 100);
}
