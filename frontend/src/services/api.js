const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}/api/v1${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const payload = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || 'Request failed. Please try again.');
    error.status = response.status;
    error.code = payload?.error?.code;
    throw error;
  }
  return payload.data;
}

export const api = {
  me: () => request('/auth/me'),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  dashboard: (month) => request(`/billing/dashboard?month=${encodeURIComponent(month)}`),
  tiffins: (month) => request(`/tiffins?month=${encodeURIComponent(month)}`),
  setTiffin: (date, meal, status) => request(`/tiffins/${date}/${meal}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  payments: (month) => request(`/billing/payments?month=${encodeURIComponent(month)}`),
  currentRate: () => request('/pricing/current'),
  adminOverview: (month) => request(`/admin/overview?month=${encodeURIComponent(month)}`),
  adminCustomers: (search = '') => request(`/admin/customers?search=${encodeURIComponent(search)}`),
  customerSummary: (id, month) => request(`/admin/customers/${id}/summary?month=${encodeURIComponent(month)}`),
  setCustomerStatus: (id, status) => request(`/admin/customers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  pricing: () => request('/admin/pricing'),
  setPricing: (amountRupees, effectiveFrom) => request('/pricing', { method: 'POST', body: JSON.stringify({ amountRupees, effectiveFrom }) }),
  recordPayment: (id, body) => request(`/admin/payments/${id}`, { method: 'POST', body: JSON.stringify(body) }),
  reversePayment: (userId, paymentId, reason) => request(`/admin/payments/${userId}/${paymentId}/reverse`, { method: 'POST', body: JSON.stringify({ reason }) }),
  customerPayments: (id, month) => request(`/admin/payments/customer/${id}?month=${encodeURIComponent(month)}`)
};
