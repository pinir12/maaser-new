import { supaGet, supaPatch } from '@/lib/supabase-server';
import { createToken, stripPassword, jsonError, verifyToken } from '@/lib/jwt-server';

export async function POST(request) {
  const { email, code, token } = await request.json();

  // Magic link token
  if (token) {
    try {
      const payload = verifyToken(token);
      if (payload.purpose !== 'magic_login') return jsonError('Invalid login token');

      const users = await supaGet('users', { id: `eq.${payload.user_id}`, select: '*', limit: '1' });
      if (!users.length) return jsonError('User not found', 404);
      const user = users[0];

      if (user.verification_code !== payload.code) {
        return jsonError('Login link expired. Please request a new one.', 400);
      }

      await supaPatch('users', { id: `eq.${user.id}` }, {
        email_verified: true,
        verification_code: null,
        verification_expires: null,
      });

      const authToken = createToken(String(user.id));
      user.email_verified = true;
      return Response.json({ token: authToken, user: stripPassword(user) });
    } catch (e) {
      if (e.name === 'TokenExpiredError') return jsonError('Login link expired. Please request a new one.', 400);
      return jsonError('Invalid login token', 400);
    }
  }

  // Code-based
  if (!email || !code) return jsonError('Email and code required');

  try {
    const users = await supaGet('users', { email: `eq.${email.toLowerCase()}`, select: '*', limit: '1' });
    if (!users.length) return jsonError('Invalid code', 400);
    const user = users[0];

    if (!user.verification_code || !user.verification_expires) {
      return jsonError('No login code found. Please request a new one.', 400);
    }
    if (new Date(user.verification_expires) < new Date()) {
      return jsonError('Login code expired. Please request a new one.', 400);
    }
    if (user.verification_code !== code.trim()) {
      return jsonError('Invalid code', 400);
    }

    await supaPatch('users', { id: `eq.${user.id}` }, {
      email_verified: true,
      verification_code: null,
      verification_expires: null,
    });

    const authToken = createToken(String(user.id));
    user.email_verified = true;
    return Response.json({ token: authToken, user: stripPassword(user) });
  } catch (e) {
    return jsonError(`Login failed: ${e.message}`, 500);
  }
}
