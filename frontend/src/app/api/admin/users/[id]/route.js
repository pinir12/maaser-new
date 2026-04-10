import { getCurrentAdmin, jsonError } from '@/lib/jwt-server';
import { supaPatch, supaDelete } from '@/lib/supabase-server';

export async function PUT(request, { params }) {
  const auth = await getCurrentAdmin(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  const { id } = await params;
  const updates = await request.json();
  const allowed = new Set(['is_admin', 'name', 'email', 'base_currency']);
  const safe = {};
  for (const [k, v] of Object.entries(updates)) {
    if (allowed.has(k)) safe[k] = v;
  }

  try {
    await supaPatch('users', { id: `eq.${id}` }, safe);
    return Response.json({ success: true });
  } catch {
    return jsonError('Failed to update user', 500);
  }
}

export async function DELETE(request, { params }) {
  const auth = await getCurrentAdmin(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  const { id } = await params;
  try {
    await supaDelete('transactions', { user_id: `eq.${id}` });
    await supaDelete('users', { id: `eq.${id}` });
    return Response.json({ success: true });
  } catch {
    return jsonError('Failed to delete user', 500);
  }
}
