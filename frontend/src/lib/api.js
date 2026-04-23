'use client';

const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_BASE || '')
  : '';

function getToken() {
  return localStorage.getItem('finance_token');
}

function setToken(token) {
  localStorage.setItem('finance_token', token);
}

function clearToken() {
  localStorage.removeItem('finance_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Only force-reload for authenticated endpoints, not login/signup
    const isAuthEndpoint = path.includes('/auth/login') || path.includes('/auth/signup');
    if (!isAuthEndpoint) {
      clearToken();
      localStorage.removeItem('finance_user');
      window.location.reload();
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || `Error ${res.status}`);
  }

  return res.json();
}

// Auth
export async function apiLogin(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  // Handle needsVerification from both FastAPI (200) and Next.js (403)
  if (data.needsVerification) {
    return { needsVerification: true, email: data.email };
  }
  if (!res.ok) throw new Error(data.detail || 'Login failed');
  setToken(data.token);
  return data;
}

export async function apiSignup(email, password, name, base_currency) {
  const data = await request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, base_currency })
  });
  // New flow: signup returns { needsVerification, email } instead of token
  if (data.needsVerification) return data;
  if (data.token) setToken(data.token);
  return data;
}

export async function apiVerifyEmail(email, code, token) {
  const body = token ? { token } : { email, code };
  const data = await request('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (data.token) setToken(data.token);
  return data;
}

export async function apiResendVerification(email) {
  return request('/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function apiForgotPassword(email) {
  return request('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function apiResetPassword(email, code, token, newPassword) {
  const body = token ? { token, newPassword } : { email, code, newPassword };
  const data = await request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (data.token) setToken(data.token);
  return data;
}

export async function apiRequestMagicLogin(email) {
  return request('/api/auth/magic-login', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function apiVerifyMagicLogin(email, code, token) {
  const body = token ? { token } : { email, code };
  const data = await request('/api/auth/verify-magic-login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (data.token) setToken(data.token);
  return data;
}

export async function apiSetPassword(newPassword) {
  return request('/api/user/settings', {
    method: 'PUT',
    body: JSON.stringify({ new_password: newPassword }),
  });
}

export function apiLogout() {
  clearToken();
}

// Transactions
export function apiGetTransactions({ limit = 50, offset = 0 } = {}) {
  return request(`/api/transactions?limit=${limit}&offset=${offset}`);
}

export function apiGetTransactionTotals(currency = 'USD', dateFrom, dateTo) {
  let url = `/api/transactions/totals?currency=${currency}`;
  if (dateFrom) url += `&date_from=${dateFrom}`;
  if (dateTo) url += `&date_to=${dateTo}`;
  return request(url);
}

export function apiCreateTransaction(txn) {
  return request('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(txn)
  });
}

export function apiUpdateTransaction(id, txn) {
  return request(`/api/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(txn)
  });
}

export function apiDeleteTransaction(id) {
  return request(`/api/transactions/${id}`, {
    method: 'DELETE'
  });
}

// User settings
export function apiGetUserSettings() {
  return request('/api/user/settings');
}

export function apiUpdateUserSettings(updates) {
  return request('/api/user/settings', {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

// Admin
export function apiGetAdminUsers() {
  return request('/api/admin/users');
}

export function apiUpdateAdminUser(userId, updates) {
  return request(`/api/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

export function apiDeleteAdminUser(userId) {
  return request(`/api/admin/users/${userId}`, {
    method: 'DELETE'
  });
}

// Recurring
export function apiGetRecurringTransactions() {
  return request('/api/transactions/recurring');
}

export function apiBulkUpdateRecurring(description, type, updates) {
  return request('/api/transactions/recurring/bulk-update', {
    method: 'PUT',
    body: JSON.stringify({ description, type, updates })
  });
}

export function apiBulkDeleteRecurring(description, type) {
  return request('/api/transactions/recurring/bulk-delete', {
    method: 'DELETE',
    body: JSON.stringify({ description, type })
  });
}

// Suggestions (autofill)
export function apiGetSuggestions() {
  return request('/api/transactions/suggestions');
}

// Contact
export function apiSendContact(name, email, message) {
  return request('/api/email/contact', {
    method: 'POST',
    body: JSON.stringify({ name, email, message })
  });
}

// Currency
export function apiGetCurrencyRates(base) {
  return request(`/api/currency/rates/${base}`);
}

// Cron
export function apiProcessRecurring() {
  return request('/api/cron/recurring', { method: 'POST' });
}

export function apiSendMonthlySummary() {
  return request('/api/cron/monthly-summary', { method: 'POST' });
}

// CSV Import
export function apiImportTransactions(transactions) {
  return request('/api/transactions/import', {
    method: 'POST',
    body: JSON.stringify({ transactions })
  });
}

// Admin - Key Rotation
export function apiRotateEncryptionKey(oldKey, newKey) {
  return request('/api/admin/rotate-key', {
    method: 'POST',
    body: JSON.stringify({ oldKey, newKey }),
  });
}

