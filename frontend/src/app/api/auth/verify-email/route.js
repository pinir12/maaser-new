import { supaGet, supaPatch } from '@/lib/supabase-server';
import { createToken, stripPassword, jsonError } from '@/lib/jwt-server';

export async function POST(request) {
  const { email, code, token } = await request.json();

  // Magic-link token verification
  if (token) {
    try {
      const { verifyToken } = await import('@/lib/jwt-server');
      const payload = verifyToken(token);
      if (payload.purpose !== 'email_verify') return jsonError('Invalid verification token');

      const users = await supaGet('users', { id: `eq.${payload.user_id}`, select: '*', limit: '1' });
      if (!users.length) return jsonError('User not found', 404);
      const user = users[0];

      if (user.email_verified) {
        const authToken = createToken(String(user.id));
        return Response.json({ token: authToken, user: stripPassword(user) });
      }

      // Check if the code in token matches stored code
      if (user.verification_code !== payload.code) return jsonError('Verification code expired. Please request a new one.', 400);

      await supaPatch('users', { id: `eq.${user.id}` }, {
        email_verified: true,
        verification_code: null,
        verification_expires: null,
      });

      const updatedUsers = await supaGet('users', { id: `eq.${user.id}`, select: '*' });
      const authToken = createToken(String(user.id));
      return Response.json({ token: authToken, user: stripPassword(updatedUsers[0]) });
    } catch (e) {
      if (e.name === 'TokenExpiredError') return jsonError('Verification link expired. Please request a new one.', 400);
      return jsonError('Invalid verification token', 400);
    }
  }

  // Code-based verification
  if (!email || !code) return jsonError('Email and verification code required');

  try {
    const users = await supaGet('users', { email: `eq.${email.toLowerCase()}`, select: '*', limit: '1' });
    if (!users.length) return jsonError('User not found', 404);
    const user = users[0];

    if (user.email_verified) {
      const authToken = createToken(String(user.id));
      return Response.json({ token: authToken, user: stripPassword(user) });
    }

    if (!user.verification_code || !user.verification_expires) {
      return jsonError('No verification code found. Please request a new one.', 400);
    }

    if (new Date(user.verification_expires) < new Date()) {
      return jsonError('Verification code expired. Please request a new one.', 400);
    }

    if (user.verification_code !== code.trim()) {
      return jsonError('Invalid verification code', 400);
    }

    await supaPatch('users', { id: `eq.${user.id}` }, {
      email_verified: true,
      verification_code: null,
      verification_expires: null,
    });

    const updatedUsers = await supaGet('users', { id: `eq.${user.id}`, select: '*' });
    const authToken = createToken(String(user.id));
    return Response.json({ token: authToken, user: stripPassword(updatedUsers[0]) });
  } catch (e) {
    return jsonError(`Verification failed: ${e.message}`, 500);
  }
}
