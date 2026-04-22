import { getCurrentUser, jsonError } from '@/lib/jwt-server';
import { supaPatch, supaDelete } from '@/lib/supabase-server';
import { encryptTransaction, decryptTransaction } from '@/lib/encryption';

export async function PUT(request, { params }) {
  const auth = await getCurrentUser(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  const { id } = await params;
  const data = await request.json();
  data.updated_at = new Date().toISOString();
  if (data.maaser_percentage != null) data.maaser_percentage = Math.round(data.maaser_percentage);

  const encrypted = encryptTransaction(data);

  try {
    const result = await supaPatch('transactions', { id: `eq.${id}`, user_id: `eq.${auth.userId}` }, encrypted);
    if (Array.isArray(result) && result.length) return Response.json(decryptTransaction(result[0]));
    return Response.json({ success: true });
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
