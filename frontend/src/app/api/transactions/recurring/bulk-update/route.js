import { getCurrentUser, jsonError } from '@/lib/jwt-server';
import { supaPatchUser } from '@/lib/supabase-server';

export async function PUT(request) {
  const auth = await getCurrentUser(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  const { description, type, updates } = await request.json();
  if (!description || !type || !updates) return jsonError('Missing required fields');

  updates.updated_at = new Date().toISOString();

  try {
    await supaPatchUser('transactions', {
      user_id: `eq.${auth.userId}`,
      description: `eq.${description}`,
      type: `eq.${type}`,
      is_recurring: 'eq.true',
    }, updates, auth.userId);
    return Response.json({ success: true });
  } catch {
    return jsonError('Failed to bulk update', 500);
  }
}
