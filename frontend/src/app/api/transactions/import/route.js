import { getCurrentUser, jsonError } from '@/lib/jwt-server';
import { supaPostUser } from '@/lib/supabase-server';
import { encryptTransaction } from '@/lib/encryption';

export async function POST(request) {
  const auth = await getCurrentUser(request);
  if (auth.error) return jsonError(auth.error, auth.status);

  const { transactions } = await request.json();
  if (!Array.isArray(transactions) || !transactions.length) {
    return jsonError('No transactions to import');
  }

  let imported = 0;
  const errors = [];

  for (const txn of transactions) {
    const data = encryptTransaction({
      user_id: auth.userId,
      description: txn.description || '',
      amount: parseFloat(txn.amount) || 0,
      currency: txn.currency || 'GBP',
      exchange_rate_to_base: txn.exchange_rate_to_base || 1,
      type: txn.type || 'income',
      recipient_name: txn.recipient_name || '',
      date: txn.date,
      maaser_percentage: txn.maaser_percentage != null ? Math.round(txn.maaser_percentage) : 10,
      is_recurring: false,
      recurring_frequency: 'none',
      created_at: new Date().toISOString(),
    });

    try {
      await supaPostUser('transactions', data, auth.userId);
      imported++;
    } catch (e) {
      errors.push({ description: txn.description, error: e.message });
    }
  }

  return Response.json({ imported, errors, total: transactions.length });
}
