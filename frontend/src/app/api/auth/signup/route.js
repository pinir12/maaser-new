import bcrypt from 'bcryptjs';
import { supaGet, supaPost } from '@/lib/supabase-server';
import { jsonError } from '@/lib/jwt-server';
import { generateVerificationCode, isDisposableEmail, buildVerificationEmail, sendEmail } from '@/lib/email-verification';

export async function POST(request) {
  const { email, password, name, base_currency = 'USD' } = await request.json();
  if (!email || !name) return jsonError('Name and email are required');

  const lowerEmail = email.toLowerCase().trim();

  const disposable = await isDisposableEmail(lowerEmail);
  if (disposable) {
    return jsonError('Temporary or disposable email addresses are not allowed. Please use a real email.', 400);
  }

  try {
    const existing = await supaGet('users', { email: `eq.${lowerEmail}`, select: 'id', limit: '1' });
    if (existing.length) return jsonError('Email already registered', 409);

    const hash = password ? await bcrypt.hash(password, 10) : '';

    const newUser = {
      email: lowerEmail,
      password_hash: hash,
      name,
      base_currency,
      distribution_mode: 'give_only',
      default_view: 'month',
      use_hebrew_calendar: false,
      default_maaser_percentage: 10,
      give_ratio: 50,
      lend_ratio: 50,
      is_admin: false,
      email_verified: false,
      created_at: new Date().toISOString(),
    };

    const created = await supaPost('users', newUser);
    const createdUser = Array.isArray(created) ? created[0] : created;

    // Send verification email
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.REACT_APP_BACKEND_URL || '';
      const verify = generateVerificationCode(String(createdUser.id));
      const { supaPatch } = await import('@/lib/supabase-server');
      await supaPatch('users', { id: `eq.${createdUser.id}` }, {
        verification_code: verify.code,
        verification_expires: verify.expires,
      });

      const { html, subject } = buildVerificationEmail(name, verify.code, verify.token, appUrl);
      await sendEmail({
        from: 'Maaser Tracker <onboarding@resend.dev>',
        to: [lowerEmail],
        subject,
        html,
      });

      // Notify admin (fire and forget)
      const adminEmail = process.env.ADMIN_EMAIL || 'mail@pinir.co.uk';
      const signupType = password ? 'Password' : 'Passwordless';
      const adminHtml = '<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto"><div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:24px;border-radius:12px 12px 0 0;color:white"><h2 style="margin:0">New User Registration</h2></div><div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px"><p><strong>Name:</strong> ' + name + '</p><p><strong>Email:</strong> ' + lowerEmail + '</p><p><strong>Type:</strong> ' + signupType + '</p><p><strong>Time:</strong> ' + new Date().toISOString() + '</p></div></div>';
      sendEmail({
        from: 'Maaser Tracker <mail@pinir.co.uk>',
        to: [adminEmail],
        subject: 'New Signup: ' + name,
        html: adminHtml,
      }).catch(() => {});
    } catch (emailErr) {
      console.error('[SIGNUP] Email send failed:', emailErr.message);
    }

    return Response.json({ needsVerification: true, email: lowerEmail });
  } catch (e) {
    return jsonError(`Failed to create user: ${e.message}`, 500);
  }
}
