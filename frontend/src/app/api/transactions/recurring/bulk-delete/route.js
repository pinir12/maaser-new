import { getCurrentUser, jsonError } from '@/lib/jwt-server';
import { supaDeleteUser } from '@/lib/supabase-server';

export async function DELETE(request) {
  const auth = await getCurrentUser(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  const { description, type } = await request.json();
  if (!description || !type) return jsonError('Missing required fields');

  try {
    await supaDeleteUser('transactions', {
      user_id: `eq.${auth.userId}`,
      description: `eq.${description}`,
      type: `eq.${type}`,
      is_recurring: 'eq.true',
    }, auth.userId);
    return Response.json({ success: true });
  } catch {
    return jsonError('Failed to bulk delete', 500);
  }
}
