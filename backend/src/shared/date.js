export function parseMonth(month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(month || ''))) {
    const err = new Error('month must use YYYY-MM format');
    err.statusCode = 400;
    throw err;
  }
  const [year, m] = month.split('-').map(Number);
  return { year, monthIndex: m - 1, start: `${month}-01`, end: `${year}-${String(m).padStart(2, '0')}-${new Date(year, m, 0).getDate()}` };
}
export function dateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
