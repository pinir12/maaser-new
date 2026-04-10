// Server-side Supabase REST API helpers
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

export function supaHeaders() {
  return {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
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

export async function supaPatch(table, params, data) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await fetch(url.toString(), {
    method: 'PATCH',
    headers: supaHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok && res.status !== 204) throw new Error(`Supabase PATCH ${table} failed: ${res.status}`);
  // PATCH may return 204 with no body
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
