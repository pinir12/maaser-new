import bcrypt from 'bcryptjs';
import { supaGet } from '@/lib/supabase-server';
import { createToken, stripPassword, jsonError } from '@/lib/jwt-server';

export async function POST(request) {
  const { email, password } = await request.json();
  if (!email || !password) return jsonError('Email and password required');

  try {
    const users = await supaGet('users', { email: `eq.${email.toLowerCase()}`, select: '*', limit: '1' });
    if (!users.length) return jsonError('Invalid email or password', 401);

    const dbUser = users[0];
    const valid = await bcrypt.compare(password, dbUser.password_hash || '');
    if (!valid) return jsonError('Invalid email or password', 401);

    // Block login if email not verified
    if (dbUser.email_verified === false) {
      return Response.json({ needsVerification: true, email: dbUser.email }, { status: 403 });
    }

    const token = createToken(String(dbUser.id));
    return Response.json({ token, user: stripPassword(dbUser) });
  } catch (e) {
    return jsonError('Database error', 500);
  }
}
