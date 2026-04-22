import { getCurrentUser, jsonError } from '@/lib/jwt-server';
import { supaGet, supaPost } from '@/lib/supabase-server';
import { encryptTransaction, decryptTransaction } from '@/lib/encryption';

export async function GET(request) {
  const auth = await getCurrentUser(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit')) || 50;
  const offset = parseInt(url.searchParams.get('offset')) || 0;

  const params = {
    user_id: `eq.${auth.userId}`,
    select: '*',
    order: 'date.desc,created_at.desc',
    limit: String(limit),
    offset: String(offset),
  };

  try {
    const txns = await supaGet('transactions', params);
    const hasMore = txns.length === limit;
    return Response.json({ transactions: txns.map(decryptTransaction), hasMore, offset, limit });
  } catch (e) {
    return jsonError(`Failed to fetch transactions: ${e.message}`, 500);
  }
}

export async function POST(request) {
  const auth = await getCurrentUser(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  const data = await request.json();
  data.user_id = auth.userId;
  data.created_at = new Date().toISOString();
  if (data.maaser_percentage != null) data.maaser_percentage = Math.round(data.maaser_percentage);

  const encrypted = encryptTransaction(data);

  try {
    const result = await supaPost('transactions', encrypted);
    const created = Array.isArray(result) ? result[0] : result;
    return Response.json(decryptTransaction(created));
  } catch (e) {
    return jsonError(`Failed to create transaction: ${e.message}`, 500);
  }
}
