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
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  setToken(data.token);
  return data;
}

export async function apiSignup(email, password, name, base_currency) {
  const data = await request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, base_currency })
  });
  setToken(data.token);
  return data;
}

export function apiLogout() {
  clearToken();
}

// Transactions
export function apiGetTransactions() {
  return request('/api/transactions');
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

