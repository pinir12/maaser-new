import { getCurrentUser, jsonError } from '@/lib/jwt-server';
import { supaGetUser, supaPostUser } from '@/lib/supabase-server';
import { encryptTransaction, decryptTransaction } from '@/lib/encryption';

export async function GET(request) {
  const auth = await getCurrentUser(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  try {
    const txns = await supaGetUser('transactions', { user_id: `eq.${auth.userId}`, select: '*', order: 'date.desc' }, auth.userId);
    return Response.json(txns.map(decryptTransaction));
  } catch {
    return jsonError('Failed to fetch transactions', 500);
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
    const result = await supaPostUser('transactions', encrypted, auth.userId);
    const created = Array.isArray(result) ? result[0] : result;
    return Response.json(decryptTransaction(created));
  } catch (e) {
    return jsonError(`Failed to create transaction: ${e.message}`, 500);
  }
}
