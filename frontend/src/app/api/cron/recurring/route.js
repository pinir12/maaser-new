import { supaGet, supaPost } from '@/lib/supabase-server';
import { encryptTransaction, decryptTransaction } from '@/lib/encryption';

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
        // Check if already exists (idempotent — safe to call multiple times)
        const check = await supaGet('transactions', {
          user_id: `eq.${txn.user_id}`,
          description: `eq.${txn.description}`,
          date: `eq.${ds}`,
          select: 'id',
        });

        if (!check.length) {
          const newTxn = encryptTransaction({
            user_id: txn.user_id,
            description: txn.description,
            amount: txn.amount,
            currency: txn.currency,
            exchange_rate_to_base: txn.exchange_rate_to_base || 1,
            type: txn.type,
            maaser_percentage: txn.maaser_percentage,
            maaser_amount: txn.maaser_amount,
            recipient_name: txn.recipient_name,
            date: ds,
            is_recurring: true,
            recurring_frequency: freq,
            recurring_end_date: txn.recurring_end_date,
            created_at: new Date().toISOString(),
          });
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
