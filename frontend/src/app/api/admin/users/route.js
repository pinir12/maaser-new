import { getCurrentAdmin, jsonError } from '@/lib/jwt-server';
import { supaGet } from '@/lib/supabase-server';

export async function GET(request) {
  const auth = await getCurrentAdmin(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  try {
    const users = await supaGet('users', {
      select: 'id,name,email,base_currency,created_at,is_admin',
      order: 'created_at.desc',
    });
    return Response.json(users);
  } catch {
    return jsonError('Failed to fetch users', 500);
  }
}
