import { getCurrentUser, jsonError } from '@/lib/jwt-server';
import { supaGet } from '@/lib/supabase-server';
import { decryptTransaction } from '@/lib/encryption';

export async function GET(request) {
  const auth = await getCurrentUser(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  try {
    const txns = await supaGet('transactions', {
      user_id: `eq.${auth.userId}`,
      is_recurring: 'eq.true',
      select: '*',
      order: 'date.asc',
    });
    return Response.json(txns.map(decryptTransaction));
  } catch {
    return jsonError('Failed to fetch recurring', 500);
  }
}
