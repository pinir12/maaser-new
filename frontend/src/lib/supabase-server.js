// Server-side Supabase REST API helpers
import jwt from 'jsonwebtoken';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY; // service_role key — admin only, bypasses RLS
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY; // anon key — safe for user-scoped calls
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET; // from Supabase > Settings > API > JWT Secret

// Service-role headers (admin-level, bypasses RLS)
// Used for: signup, verification, admin panel, cron jobs
export function supaHeaders() {
  return {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

// User-scoped headers (subject to RLS).
// Uses anon key + user JWT so PostgREST applies RLS policies.
// Falls back to service-role if JWT secret or anon key not configured yet.
export function supaUserHeaders(userId) {
  if (!SUPABASE_JWT_SECRET || !userId) return supaHeaders();

  const userToken = jwt.sign(
    {
      sub: userId,
      role: 'authenticated',
      iss: 'supabase',
      aud: 'authenticated',
    },
    SUPABASE_JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    'apikey': SUPABASE_ANON_KEY || SUPABASE_KEY,
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

export async function supaGet(table, params = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await fetch(url.toString(), { headers: supaHeaders() });
  if (!res.ok) throw new Error(`Supabase GET ${table} failed: ${res.status}`);
  return res.json();
}

// User-scoped GET (subject to RLS)
export async function supaGetUser(table, params = {}, userId) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await fetch(url.toString(), { headers: supaUserHeaders(userId) });
  if (!res.ok) throw new Error(`Supabase GET ${table} failed: ${res.status}`);
  return res.json();
}

export async function supaGetRaw(table, queryString) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${queryString}`, { headers: supaHeaders() });
  if (!res.ok) throw new Error(`Supabase GET ${table} failed: ${res.status}`);
  return res.json();
}

export async function supaPost(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: supaHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase POST ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// User-scoped POST (subject to RLS)
export async function supaPostUser(table, data, userId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: supaUserHeaders(userId),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase POST ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function supaPatch(table, params, data) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await fetch(url.toString(), {
    method: 'PATCH',
    headers: supaHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok && res.status !== 204) throw new Error(`Supabase PATCH ${table} failed: ${res.status}`);
  if (res.status === 204) return [];
  return res.json();
}

// User-scoped PATCH (subject to RLS)
export async function supaPatchUser(table, params, data, userId) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await fetch(url.toString(), {
    method: 'PATCH',
    headers: supaUserHeaders(userId),
    body: JSON.stringify(data),
  });
  if (!res.ok && res.status !== 204) throw new Error(`Supabase PATCH ${table} failed: ${res.status}`);
  if (res.status === 204) return [];
  return res.json();
}

export async function supaDelete(table, params) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await fetch(url.toString(), {
    method: 'DELETE',
    headers: supaHeaders(),
  });
  if (!res.ok && res.status !== 204) throw new Error(`Supabase DELETE ${table} failed: ${res.status}`);
  return true;
}

// User-scoped DELETE (subject to RLS)
export async function supaDeleteUser(table, params, userId) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await fetch(url.toString(), {
    method: 'DELETE',
    headers: supaUserHeaders(userId),
  });
  if (!res.ok && res.status !== 204) throw new Error(`Supabase DELETE ${table} failed: ${res.status}`);
  return true;
}
