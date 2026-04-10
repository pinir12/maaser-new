import { getCurrentUser, jsonError } from '@/lib/jwt-server';
import { supaGet, supaPost } from '@/lib/supabase-server';

export async function GET(request) {
  const auth = await getCurrentUser(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  try {
    const txns = await supaGet('transactions', { user_id: `eq.${auth.userId}`, select: '*', order: 'date.desc' });
    return Response.json(txns);
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

  try {
    const result = await supaPost('transactions', data);
    return Response.json(Array.isArray(result) ? result[0] : result);
  } catch (e) {
    return jsonError(`Failed to create transaction: ${e.message}`, 500);
  }
}
