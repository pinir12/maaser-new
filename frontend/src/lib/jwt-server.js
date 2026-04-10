// Server-side JWT and auth helpers
import jwt from 'jsonwebtoken';
import { supaGet } from './supabase-server';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY_DAYS = 30;

export function createToken(userId) {
  return jwt.sign(
    { user_id: String(userId) },
    JWT_SECRET,
    { expiresIn: `${JWT_EXPIRY_DAYS}d` }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function stripPassword(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

// Extract and verify user from Authorization header
export async function getCurrentUser(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Not authenticated', status: 401 };
  }
  try {
    const payload = verifyToken(authHeader.slice(7));
    return { userId: payload.user_id };
  } catch (e) {
    const msg = e.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return { error: msg, status: 401 };
  }
}

// Extract and verify admin user
export async function getCurrentAdmin(request) {
  const result = await getCurrentUser(request);
  if (result.error) return result;

  try {
    const users = await supaGet('users', { id: `eq.${result.userId}`, select: 'is_admin' });
    if (!users.length || !users[0].is_admin) {
      return { error: 'Admin access required', status: 403 };
    }
    return { userId: result.userId };
  } catch {
    return { error: 'Admin check failed', status: 500 };
  }
}

export function jsonError(message, status = 400) {
  return Response.json({ detail: message }, { status });
}
