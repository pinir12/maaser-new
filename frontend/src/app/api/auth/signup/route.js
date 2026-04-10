import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { supaGet, supaPost } from '@/lib/supabase-server';
import { createToken, stripPassword, jsonError } from '@/lib/jwt-server';

export async function POST(request) {
  const { email, password, name, base_currency = 'USD' } = await request.json();
  if (!email || !password || !name) return jsonError('All fields required');

  try {
    const existing = await supaGet('users', { email: `eq.${email.toLowerCase()}`, select: 'id', limit: '1' });
    if (existing.length) return jsonError('Email already registered', 409);

    const hash = await bcrypt.hash(password, 10);
    const newUser = {
      email: email.toLowerCase(),
      password_hash: hash,
      name,
      base_currency,
      distribution_mode: 'both',
      default_view: 'month',
      use_hebrew_calendar: false,
      default_maaser_percentage: 10,
      give_ratio: 50,
      lend_ratio: 50,
      is_admin: false,
      created_at: new Date().toISOString(),
    };

    const created = await supaPost('users', newUser);
    const createdUser = Array.isArray(created) ? created[0] : created;
    const token = createToken(String(createdUser.id));

    // Admin notification (fire and forget)
    try {
      const apiKey = process.env.RESEND_API_KEY;
      const adminEmail = process.env.ADMIN_EMAIL || 'mail@pinir.co.uk';
      if (apiKey) {
        const resend = new Resend(apiKey);
        await resend.emails.send({
          from: 'Maaser Tracker <mail@pinir.co.uk>',
          to: [adminEmail],
          subject: `New Signup: ${name}`,
          html: `<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto"><div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:24px;border-radius:12px 12px 0 0;color:white"><h2 style="margin:0">New User Registration</h2></div><div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px"><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email.toLowerCase()}</p><p><strong>Time:</strong> ${new Date().toISOString()}</p></div></div>`,
        });
      }
    } catch {}

    return Response.json({ token, user: stripPassword(createdUser) });
  } catch (e) {
    return jsonError(`Failed to create user: ${e.message}`, 500);
  }
}
