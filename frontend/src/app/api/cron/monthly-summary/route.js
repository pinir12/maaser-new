import { Resend } from 'resend';
import { supaGet } from '@/lib/supabase-server';

export async function POST() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return Response.json({ detail: 'Email not configured' }, { status: 500 });

  let sentCount = 0;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevEnd = new Date(monthStart.getTime() - 1);

  try {
    const users = await supaGet('users', { select: '*' });
    const resend = new Resend(apiKey);

    for (const user of users) {
      const userEmail = user.email;
      if (!userEmail) continue;

      const base = user.base_currency || 'USD';
      const prevStartStr = prevStart.toISOString().split('T')[0];
      const prevEndStr = prevEnd.toISOString().split('T')[0];

      let txns = [];
      try {
        const res = await fetch(
          `${process.env.SUPABASE_URL}/rest/v1/transactions?user_id=eq.${user.id}&date=gte.${prevStartStr}&date=lte.${prevEndStr}&select=*`,
          { headers: { apikey: process.env.SUPABASE_KEY, Authorization: `Bearer ${process.env.SUPABASE_KEY}`, 'Content-Type': 'application/json' } }
        );
        if (res.ok) txns = await res.json();
      } catch {}

      let income = 0, maaserGen = 0, given = 0, lent = 0;
      for (const t of txns) {
        const norm = t.amount * (t.currency !== base ? (t.exchange_rate_to_base || 1) : 1);
        if (t.type === 'income') { income += norm; maaserGen += norm * ((t.maaser_percentage || 10) / 100); }
        else if (t.type === 'give') given += norm;
        else if (t.type === 'lend') lent += norm;
      }

      const balance = maaserGen - given - lent;
      const monthName = prevStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const symMap = { USD: '$', ILS: '\u20aa', GBP: '\u00a3', EUR: '\u20ac' };
      const sym = symMap[base] || base + ' ';
      const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const html = `<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto"><div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:24px;border-radius:12px 12px 0 0;color:white"><h2 style="margin:0">Maaser Summary - ${monthName}</h2></div><div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px"><p>Hi ${user.name || 'there'},</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr style="border-bottom:1px solid #e2e8f0"><td style="padding:8px 0;color:#10b981;font-weight:600">Income</td><td style="padding:8px 0;text-align:right">${sym}${fmt(income)}</td></tr><tr style="border-bottom:1px solid #e2e8f0"><td style="padding:8px 0;color:#f59e0b;font-weight:600">Maaser Generated</td><td style="padding:8px 0;text-align:right">${sym}${fmt(maaserGen)}</td></tr><tr style="border-bottom:1px solid #e2e8f0"><td style="padding:8px 0;color:#3b82f6;font-weight:600">Given</td><td style="padding:8px 0;text-align:right">${sym}${fmt(given)}</td></tr><tr style="border-bottom:1px solid #e2e8f0"><td style="padding:8px 0;color:#ef4444;font-weight:600">Lent</td><td style="padding:8px 0;text-align:right">${sym}${fmt(lent)}</td></tr><tr><td style="padding:12px 0;font-weight:700;font-size:16px">Remaining Balance</td><td style="padding:12px 0;text-align:right;font-weight:700;font-size:16px;color:${balance >= 0 ? '#10b981' : '#ef4444'}">${sym}${fmt(balance)}</td></tr></table><p style="color:#64748b;font-size:13px">This is your monthly maaser recap. Keep up the great work!</p></div></div>`;

      try {
        await resend.emails.send({
          from: "Maaser Tracker <mail@pinir.co.uk>",
          to: [userEmail],
          subject: `Your Maaser Summary - ${monthName}`,
          html,
        });
        sentCount++;
      } catch {}
    }

    return Response.json({ success: true, sent: sentCount, message: `Sent ${sentCount} monthly summaries` });
  } catch (e) {
    return Response.json({ detail: 'Failed to send summaries' }, { status: 500 });
  }
}
