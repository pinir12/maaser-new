import { getCurrentUser, stripPassword, jsonError } from '@/lib/jwt-server';
import { supaGet, supaPatch } from '@/lib/supabase-server';

export async function GET(request) {
  const auth = await getCurrentUser(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  try {
    const users = await supaGet('users', { id: `eq.${auth.userId}`, select: '*' });
    if (!users.length) return jsonError('User not found', 404);
    return Response.json(stripPassword(users[0]));
  } catch {
    return jsonError('Failed to fetch settings', 500);
  }
}

export async function PUT(request) {
  const auth = await getCurrentUser(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  const updates = await request.json();
  const allowed = new Set(['base_currency', 'distribution_mode', 'default_view', 'use_hebrew_calendar', 'default_maaser_percentage', 'give_ratio', 'lend_ratio', 'name']);
  const safe = {};
  for (const [k, v] of Object.entries(updates)) {
    if (allowed.has(k)) safe[k] = v;
  }
  if (!Object.keys(safe).length) return jsonError('No valid fields to update');

  try {
    const result = await supaPatch('users', { id: `eq.${auth.userId}` }, safe);
    if (Array.isArray(result) && result.length) return Response.json(stripPassword(result[0]));
    return Response.json({ success: true });
  } catch {
    return jsonError('Failed to update settings', 500);
  }
}
