import { Resend } from 'resend';
import { supaGet, supaPatch } from '@/lib/supabase-server';
import { jsonError } from '@/lib/jwt-server';
import { generateVerificationCode, isDisposableEmail } from '@/lib/email-verification';

export async function POST(request) {
  const { email } = await request.json();
  if (!email) return jsonError('Email is required');

  const lowerEmail = email.toLowerCase().trim();

  try {
    const users = await supaGet('users', { email: `eq.${lowerEmail}`, select: '*', limit: '1' });
    if (!users.length) {
      // Don't reveal if email exists
      return Response.json({ message: 'If that email exists, a login link has been sent.' });
    }
    const user = users[0];

    // Rate limit: 1 minute
    if (user.verification_expires) {
      const exp = new Date(user.verification_expires);
      const created = new Date(exp.getTime() - 60 * 60 * 1000);
      if (new Date() < new Date(created.getTime() + 60 * 1000)) {
        return jsonError('Please wait at least 1 minute before requesting another link', 429);
      }
    }

    const { code, expires, token } = generateVerificationCode(String(user.id), 'magic_login');

    await supaPatch('users', { id: `eq.${user.id}` }, {
      verification_code: code,
      verification_expires: expires,
    });

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.REACT_APP_BACKEND_URL || '';
      const loginUrl = `${appUrl}?login=${encodeURIComponent(token)}`;

      await resend.emails.send({
        from: 'Maaser Tracker <onboarding@resend.dev>',
        to: [user.email],
        subject: `${code} — Sign in to Maaser Tracker`,
        html: buildMagicLoginEmail(user.name, code, loginUrl),
      });
    }

    return Response.json({ message: 'If that email exists, a login link has been sent.', sent: true });
  } catch (e) {
    return jsonError(`Failed: ${e.message}`, 500);
  }
}

function buildMagicLoginEmail(name, code, loginUrl) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#059669 0%,#047857 100%);padding:32px 32px 28px;text-align:center;">
          <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
            <span style="color:#ffffff;font-size:24px;font-weight:800;line-height:48px;">M</span>
          </div>
          <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">Sign in to Maaser Tracker</h1>
          <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Hi ${name || 'there'}!</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 24px;">Enter this code in the app to sign in:</p>
          <div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
            <span style="font-family:'SF Mono',SFMono-Regular,Consolas,monospace;font-size:36px;font-weight:800;letter-spacing:8px;color:#1e293b;">${code}</span>
            <p style="color:#94a3b8;font-size:12px;margin:12px 0 0;font-weight:500;">Expires in 1 hour</p>
          </div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="border-bottom:1px solid #e2e8f0;width:42%;"></td>
            <td style="text-align:center;padding:0 12px;color:#94a3b8;font-size:12px;font-weight:600;">OR</td>
            <td style="border-bottom:1px solid #e2e8f0;width:42%;"></td></tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${loginUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#059669,#047857);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:12px;box-shadow:0 4px 12px rgba(5,150,105,0.3);">Sign In Now</a>
            </td></tr>
          </table>
          <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:24px 0 0;text-align:center;">If you didn't request this, you can safely ignore this email.</p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
          <p style="color:#94a3b8;font-size:11px;margin:0;">Maaser Tracker &mdash; Track your maaser with ease</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
