import bcrypt from 'bcryptjs';
import { supaGet, supaPatch } from '@/lib/supabase-server';
import { createToken, stripPassword, jsonError, verifyToken } from '@/lib/jwt-server';

export async function POST(request) {
  const { email, code, token, newPassword } = await request.json();

  if (!newPassword || newPassword.length < 6) {
    return jsonError('Password must be at least 6 characters');
  }

  let userId;

  // Magic link token
  if (token) {
    try {
      const payload = verifyToken(token);
      if (payload.purpose !== 'password_reset') return jsonError('Invalid reset token');
      userId = payload.user_id;

      const users = await supaGet('users', { id: `eq.${userId}`, select: '*', limit: '1' });
      if (!users.length) return jsonError('User not found', 404);
      if (users[0].verification_code !== payload.code) {
        return jsonError('Reset link expired. Please request a new one.', 400);
      }
    } catch (e) {
      if (e.name === 'TokenExpiredError') return jsonError('Reset link expired. Please request a new one.', 400);
      return jsonError('Invalid reset token', 400);
    }
  }
  // Code-based
  else if (email && code) {
    const users = await supaGet('users', { email: `eq.${email.toLowerCase()}`, select: '*', limit: '1' });
    if (!users.length) return jsonError('User not found', 404);
    const user = users[0];

    if (!user.verification_code || !user.verification_expires) {
      return jsonError('No reset code found. Please request a new one.', 400);
    }
    if (new Date(user.verification_expires) < new Date()) {
      return jsonError('Reset code expired. Please request a new one.', 400);
    }
    if (user.verification_code !== code.trim()) {
      return jsonError('Invalid reset code', 400);
    }
    userId = user.id;
  } else {
    return jsonError('Email+code or token required');
  }

  try {
    const hash = await bcrypt.hash(newPassword, 10);
    await supaPatch('users', { id: `eq.${userId}` }, {
      password_hash: hash,
      verification_code: null,
      verification_expires: null,
      email_verified: true, // also mark verified if not already
    });

    const users = await supaGet('users', { id: `eq.${userId}`, select: '*' });
    const authToken = createToken(String(userId));
    return Response.json({ token: authToken, user: stripPassword(users[0]) });
  } catch (e) {
    return jsonError(`Failed to reset password: ${e.message}`, 500);
  }
}
