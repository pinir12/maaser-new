import { Resend } from 'resend';
import { jsonError } from '@/lib/jwt-server';

export async function POST(request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return jsonError('Email not configured', 500);

  const { name, email, message } = await request.json();
  if (!name || !email || !message) return jsonError('All fields required');

  const adminEmail = process.env.ADMIN_EMAIL || 'mail@pinir.co.uk';
  const html = `<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto"><div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:24px;border-radius:12px 12px 0 0;color:white"><h2 style="margin:0">Contact Form</h2></div><div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px"><p><strong>From:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><div style="background:white;padding:16px;border-radius:8px;border:1px solid #e2e8f0">${message}</div></div></div>`;

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: 'Finance Tracker <mail@pinir.co.uk>',
      to: [adminEmail],
      subject: `Contact: ${name}`,
      html,
    });
    return Response.json({ status: 'success', email_id: result?.data?.id || 'sent' });
  } catch (e) {
    return jsonError(e.message, 500);
  }
}
