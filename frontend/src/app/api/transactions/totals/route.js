import { getCurrentUser, jsonError } from '@/lib/jwt-server';
import { supaGetUser } from '@/lib/supabase-server';
import { decryptTransaction } from '@/lib/encryption';

export async function GET(request) {
  const auth = await getCurrentUser(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  try {
    // Fetch ALL transactions (just the fields we need for totals)
    const txns = await supaGetUser('transactions', {
      user_id: `eq.${auth.userId}`,
      select: 'amount,amount_encrypted,maaser_amount_encrypted,type,currency,exchange_rate_to_base,maaser_percentage',
      order: 'date.desc',
    }, auth.userId);

    const baseCurrency = new URL(request.url).searchParams.get('currency') || 'USD';

    const totals = { totalIncome: 0, totalMaaser: 0, totalGiven: 0, totalLent: 0, incomeCount: 0, giveCount: 0, lendCount: 0, totalCount: txns.length };

    for (const raw of txns) {
      const t = decryptTransaction(raw);
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
