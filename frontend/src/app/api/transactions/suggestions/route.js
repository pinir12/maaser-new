import { getCurrentUser, jsonError } from '@/lib/jwt-server';
import { supaGet } from '@/lib/supabase-server';

export async function GET(request) {
  const auth = await getCurrentUser(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  try {
    const data = await supaGet('transactions', {
      user_id: `eq.${auth.userId}`,
      select: 'description,amount,currency,recipient_name,type,maaser_percentage',
      order: 'created_at.desc',
      limit: '200',
    });

    const seen = {};
    for (const t of data) {
      const key = (t.description || '').toLowerCase();
      if (key && !seen[key]) seen[key] = t;
    }
    return Response.json(Object.values(seen));
  } catch {
    return Response.json([]);
  }
}
