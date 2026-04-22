import { getCurrentUser, jsonError } from '@/lib/jwt-server';
import { supaGet } from '@/lib/supabase-server';
import { decryptTransaction } from '@/lib/encryption';

export async function GET(request) {
  const auth = await getCurrentUser(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  try {
    const url = new URL(request.url);
    const baseCurrency = url.searchParams.get('currency') || 'USD';
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');

    const txns = await supaGet('transactions', {
      user_id: `eq.${auth.userId}`,
      select: 'amount,amount_encrypted,maaser_amount_encrypted,type,currency,exchange_rate_to_base,maaser_percentage,date',
      order: 'date.desc',
    });

    const totals = { totalIncome: 0, totalMaaser: 0, totalGiven: 0, totalLent: 0, incomeCount: 0, giveCount: 0, lendCount: 0, totalCount: 0 };

    for (const raw of txns) {
      const t = decryptTransaction(raw);
      const ds = (t.date || '').split('T')[0];

      if (dateFrom && ds < dateFrom) continue;
      if (dateTo && ds > dateTo) continue;

      totals.totalCount++;
      const norm = t.currency === baseCurrency ? t.amount : t.amount * (t.exchange_rate_to_base || 1);

      if (t.type === 'income') {
        const maaser = norm * ((t.maaser_percentage || 10) / 100);
        totals.totalIncome += norm;
        totals.totalMaaser += maaser;
        totals.incomeCount++;
      } else if (t.type === 'give') {
        totals.totalGiven += norm;
        totals.giveCount++;
      } else if (t.type === 'lend') {
        totals.totalLent += norm;
        totals.lendCount++;
      }
    }

    return Response.json(totals);
  } catch (e) {
    return jsonError(`Failed to compute totals: ${e.message}`, 500);
  }
}
