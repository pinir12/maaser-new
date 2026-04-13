import { Resend } from 'resend';
import { supaGet, supaPatch } from '@/lib/supabase-server';
import { jsonError } from '@/lib/jwt-server';
import { generateVerificationCode, buildVerificationEmail } from '@/lib/email-verification';

export async function POST(request) {
  const { email } = await request.json();
  if (!email) return jsonError('Email is required');

  try {
    const users = await supaGet('users', { email: `eq.${email.toLowerCase()}`, select: '*', limit: '1' });
    if (!users.length) return jsonError('User not found', 404);
    const user = users[0];

    if (user.email_verified) {
      return Response.json({ message: 'Email already verified' });
    }

    // Rate limit: don't allow resend more than once per minute
    if (user.verification_expires) {
      const expiresAt = new Date(user.verification_expires);
      const createdAt = new Date(expiresAt.getTime() - 60 * 60 * 1000); // code was created 1hr before expiry
      const oneMinuteAfterCreation = new Date(createdAt.getTime() + 60 * 1000);
      if (new Date() < oneMinuteAfterCreation) {
        return jsonError('Please wait at least 1 minute before requesting a new code', 429);
      }
    }

    const { code, expires, token } = generateVerificationCode(String(user.id));

    await supaPatch('users', { id: `eq.${user.id}` }, {
      verification_code: code,
      verification_expires: expires,
    });

    // Send email
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return jsonError('Email service not configured', 500);

    const resend = new Resend(apiKey);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.REACT_APP_BACKEND_URL || '';
    const { html, subject } = buildVerificationEmail(user.name, code, token, appUrl);

    await resend.emails.send({
      from: 'Maaser Tracker <onboarding@resend.dev>',
      to: [user.email],
      subject,
      html,
    });

    return Response.json({ message: 'Verification email sent' });
  } catch (e) {
    return jsonError(`Failed to resend verification: ${e.message}`, 500);
  }
}
