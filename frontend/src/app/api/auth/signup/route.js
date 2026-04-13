import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { supaGet, supaPost } from '@/lib/supabase-server';
import { jsonError } from '@/lib/jwt-server';
import { generateVerificationCode, isDisposableEmail, buildVerificationEmail } from '@/lib/email-verification';

export async function POST(request) {
  const { email, password, name, base_currency = 'USD' } = await request.json();
  if (!email || !password || !name) return jsonError('All fields required');

  const lowerEmail = email.toLowerCase().trim();

  // Check for disposable/temp email
  const disposable = await isDisposableEmail(lowerEmail);
  if (disposable) {
    return jsonError('Temporary or disposable email addresses are not allowed. Please use a real email.', 400);
  }

  try {
    const existing = await supaGet('users', { email: `eq.${lowerEmail}`, select: 'id', limit: '1' });
    if (existing.length) return jsonError('Email already registered', 409);

    const hash = await bcrypt.hash(password, 10);
    const { code, expires, token } = generateVerificationCode('pending');

    const newUser = {
      email: lowerEmail,
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
      email_verified: false,
      verification_code: code,
      verification_expires: expires,
      created_at: new Date().toISOString(),
    };

    const created = await supaPost('users', newUser);
    const createdUser = Array.isArray(created) ? created[0] : created;

    // Re-generate token with actual user ID
    const { code: _, expires: __, token: verifyToken } = generateVerificationCode(String(createdUser.id));
    // Update the verification code to match the new token
    // Actually the code is the same, we just need the token with real user_id
    const finalToken = verifyToken;

    // Send verification email
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const resend = new Resend(apiKey);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.REACT_APP_BACKEND_URL || '';
        
        // Generate new code+token with real user ID
        const verify = generateVerificationCode(String(createdUser.id));
        // Update user with the new code (since we regenerated)
        const { supaPatch } = await import('@/lib/supabase-server');
        await supaPatch('users', { id: `eq.${createdUser.id}` }, {
          verification_code: verify.code,
          verification_expires: verify.expires,
        });

        const { html, subject } = buildVerificationEmail(name, verify.code, verify.token, appUrl);
        await resend.emails.send({
          from: 'Maaser Tracker <onboarding@resend.dev>',
          to: [lowerEmail],
          subject,
          html,
        });

        // Also notify admin (fire and forget)
        const adminEmail = process.env.ADMIN_EMAIL || 'mail@pinir.co.uk';
        resend.emails.send({
          from: 'Finance Tracker <onboarding@resend.dev>',
          to: [adminEmail],
          subject: `New Signup: ${name}`,
          html: `<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto"><div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:24px;border-radius:12px 12px 0 0;color:white"><h2 style="margin:0">New User Registration</h2></div><div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px"><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${lowerEmail}</p><p><strong>Time:</strong> ${new Date().toISOString()}</p></div></div>`,
        }).catch(() => {});
      }
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
    }

    return Response.json({ needsVerification: true, email: lowerEmail });
  } catch (e) {
    return jsonError(`Failed to create user: ${e.message}`, 500);
  }
}
