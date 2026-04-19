import jwt from 'jsonwebtoken';
import { Resend } from 'resend';

/**
 * Send an email via Resend with proper error handling.
 * Resend SDK does NOT throw on API errors — it returns { data, error }.
 * This helper throws on error so callers can catch properly.
 */
export async function sendEmail({ from, to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Email service not configured (RESEND_API_KEY missing)');

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({ from, to, subject, html });

  if (result.error) {
    const msg = result.error.message || JSON.stringify(result.error);
    console.error(`[EMAIL] Resend error: ${msg} | to: ${to}`);
    throw new Error(msg);
  }

  return result.data;
}


const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Generate a 6-digit verification code + signed JWT token for magic link
 */
export function generateVerificationCode(userId, purpose = 'email_verify') {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  const token = jwt.sign(
    { user_id: userId, code, purpose },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { code, expires, token };
}

/**
 * Check if an email domain is disposable/temporary
 */
export async function isDisposableEmail(email) {
  try {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return true;

    const domains = (await import('disposable-email-domains')).default;
    return domains.includes(domain);
  } catch {
    return false; // fail open — don't block signups if the check fails
  }
}

/**
 * Build the verification email HTML
 */
export function buildVerificationEmail(userName, code, token, appUrl) {
  const verifyUrl = `${appUrl}?verify=${encodeURIComponent(token)}`;
  const subject = `${code} is your Maaser Tracker verification code`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#2563eb 0%,#4f46e5 100%);padding:32px 32px 28px;text-align:center;">
          <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
            <span style="color:#ffffff;font-size:24px;font-weight:800;line-height:48px;">M</span>
          </div>
          <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;letter-spacing:-0.3px;">Verify your email</h1>
          <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Welcome to Maaser Tracker, ${userName || 'there'}!</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Enter this code in the app to verify your email address:
          </p>

          <!-- Code Box -->
          <div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
            <span style="font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;font-size:36px;font-weight:800;letter-spacing:8px;color:#1e293b;">${code}</span>
            <p style="color:#94a3b8;font-size:12px;margin:12px 0 0;font-weight:500;">Expires in 1 hour</p>
          </div>

          <!-- Divider with OR -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr>
              <td style="border-bottom:1px solid #e2e8f0;width:42%;"></td>
              <td style="text-align:center;padding:0 12px;color:#94a3b8;font-size:12px;font-weight:600;white-space:nowrap;">OR</td>
              <td style="border-bottom:1px solid #e2e8f0;width:42%;"></td>
            </tr>
          </table>

          <!-- Button -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${verifyUrl}" target="_blank"
                style="display:inline-block;background:linear-gradient(135deg,#2563eb,#4f46e5);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:12px;box-shadow:0 4px 12px rgba(37,99,235,0.3);">
                Verify Email Address
              </a>
            </td></tr>
          </table>

          <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:24px 0 0;text-align:center;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
          <p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.5;">
            Maaser Tracker &mdash; Track your maaser with ease<br/>
            This is an automated message, please do not reply.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { html, subject };
}
