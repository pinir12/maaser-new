import { getCurrentUser, stripPassword, jsonError } from '@/lib/jwt-server';
import { supaGet } from '@/lib/supabase-server';

export async function GET(request) {
  const auth = await getCurrentUser(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  try {
    const users = await supaGet('users', { id: `eq.${auth.userId}`, select: '*' });
    if (!users.length) return jsonError('User not found', 404);
    return Response.json(stripPassword(users[0]));
  } catch {
    return jsonError('Failed to fetch user', 500);
  }
}
