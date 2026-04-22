import { getCurrentUser, jsonError } from '@/lib/jwt-server';
import { supaGetUser } from '@/lib/supabase-server';
import { decryptTransaction } from '@/lib/encryption';

export async function GET(request) {
  const auth = await getCurrentUser(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  try {
    const data = await supaGetUser('transactions', {
      user_id: `eq.${auth.userId}`,
      select: 'description,amount,amount_encrypted,maaser_amount_encrypted,currency,recipient_name,type,maaser_percentage,exchange_rate_to_base',
      order: 'created_at.desc',
      limit: '200',
    }, auth.userId);

    const decrypted = data.map(decryptTransaction);
    const seen = {};
    for (const t of decrypted) {
      const key = (t.description || '').toLowerCase();
      if (key && !seen[key]) seen[key] = t;
    }
    return Response.json(Object.values(seen));
  } catch {
    return Response.json([]);
  }
}
