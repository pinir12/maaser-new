// cron-job.org - peshpesh

import { supaGet, supaPost } from '@/lib/supabase-server';
import { decryptTransaction } from '@/lib/encryption';

export async function POST() {
  return processRecurring();
}

export async function GET() {
  return processRecurring();
}

async function processRecurring() {
  const today = new Date();
  let createdCount = 0;

  try {
    const allRecurring = await supaGet('transactions', { is_recurring: 'eq.true', select: '*' });

    for (const rawTxn of allRecurring) {
      const txn = decryptTransaction(rawTxn);

      if (txn.recurring_end_date) {
        try {
          if (new Date(txn.recurring_end_date) < today) continue;
        } catch { continue; }
      }

      let nextDate = new Date(txn.date);
      const freq = txn.recurring_frequency || 'monthly';

      while (nextDate <= today) {
        if (freq === 'daily') nextDate.setDate(nextDate.getDate() + 1);
        else if (freq === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        else if (freq === 'biweekly') nextDate.setDate(nextDate.getDate() + 14);
        else if (freq === 'monthly') {
          let m = nextDate.getMonth() + 1;
          let y = nextDate.getFullYear();
          if (m > 11) { m = 0; y++; }
          nextDate = new Date(y, m, Math.min(nextDate.getDate(), 28));
        } else if (freq === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
        else break;

        if (nextDate > today) break;

        const ds = nextDate.toISOString().split('T')[0];

        // Idempotency: check if a transaction with same user+date+type already exists
        // Use the raw encrypted description for exact match in DB
        const existing = await supaGet('transactions', {
          user_id: `eq.${rawTxn.user_id}`,
          date: `eq.${ds}`,
          type: `eq.${rawTxn.type}`,
          description: `eq.${rawTxn.description}`,
          select: 'id',
          limit: '1',
        });

        if (!existing.length) {
          // Copy encrypted fields directly — don't re-encrypt (avoids different IV issue)
          const newTxn = {
            user_id: rawTxn.user_id,
            description: rawTxn.description,
            amount: rawTxn.amount,
            amount_encrypted: rawTxn.amount_encrypted,
            maaser_amount_encrypted: rawTxn.maaser_amount_encrypted,
            currency: rawTxn.currency,
            exchange_rate_to_base: rawTxn.exchange_rate_to_base || 1,
            type: rawTxn.type,
            maaser_percentage: rawTxn.maaser_percentage,
            recipient_name: rawTxn.recipient_name,
            date: ds,
            is_recurring: true,
            recurring_frequency: freq,
            recurring_end_date: rawTxn.recurring_end_date,
            created_at: new Date().toISOString(),
          };
          try {
            await supaPost('transactions', newTxn);
            createdCount++;
          } catch {}
        }
      }
    }

    return Response.json({ success: true, created: createdCount, message: `Created ${createdCount} recurring entries` });
  } catch (e) {
    return Response.json({ detail: 'Failed to process recurring' }, { status: 500 });
  }
}
