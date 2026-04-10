import { getCurrentUser, jsonError } from '@/lib/jwt-server';
import { supaPatch, supaDelete } from '@/lib/supabase-server';

export async function PUT(request, { params }) {
  const auth = await getCurrentUser(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  const { id } = await params;
  const data = await request.json();
  data.updated_at = new Date().toISOString();
  if (data.maaser_percentage != null) data.maaser_percentage = Math.round(data.maaser_percentage);

  try {
    const result = await supaPatch('transactions', { id: `eq.${id}`, user_id: `eq.${auth.userId}` }, data);
    return Response.json(Array.isArray(result) && result.length ? result[0] : { success: true });
  } catch {
    return jsonError('Failed to update transaction', 500);
  }
}

export async function DELETE(request, { params }) {
  const auth = await getCurrentUser(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  const { id } = await params;
  try {
    await supaDelete('transactions', { id: `eq.${id}`, user_id: `eq.${auth.userId}` });
    return Response.json({ success: true });
  } catch {
    return jsonError('Failed to delete transaction', 500);
  }
}
