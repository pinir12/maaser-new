import { useState, useOptimistic, useTransition } from 'react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { formatHebrewDate, toHebrewDate } from '../lib/hebrew-calendar';
import { getCurrencySymbol } from '../lib/validation';
import { Pencil, Trash2, Calendar, DollarSign, User } from 'lucide-react';

export function TransactionList({ 
  transactions, 
  onEdit, 
  onDelete, 
  useHebrewDates,
  baseCurrency 
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticTransactions, updateOptimisticTransactions] = useOptimistic(
    transactions,
    (state, { action, transaction, id }) => {
      switch (action) {
        case 'add':
          return [{ ...transaction, id: 'optimistic-' + Date.now(), optimistic: true }, ...state];
        case 'delete':
          return state.filter(t => t.id !== id);
        case 'update':
          return state.map(t => t.id === transaction.id ? { ...transaction, optimistic: true } : t);
        default:
          return state;
      }
    }
  );

  const handleDelete = async (id) => {
    startTransition(() => {
      updateOptimisticTransactions({ action: 'delete', id });
    });
    await onDelete(id);
  };

  const normalizeAmount = (transaction) => {
    if (transaction.currency === baseCurrency) {
      return transaction.amount;
    }
    return transaction.amount * (transaction.exchange_rate_to_base || 1);
  };

  if (!optimisticTransactions || optimisticTransactions.length === 0) {
    return (
      <div 
        data-testid="empty-transactions" 
        className="text-center py-12 text-[#68706B]"
      >
        <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No transactions yet. Add your first transaction!</p>
      </div>
    );
  }

  return (
    <div data-testid="transaction-list" className="space-y-3">
      {optimisticTransactions.map((transaction) => {
        const normalizedAmount = normalizeAmount(transaction);
        const isGive = transaction.type === 'give' || transaction.give_percentage > 0;
        const isLend = transaction.type === 'lend' || transaction.lend_percentage > 0;
        
        return (
          <div
            key={transaction.id}
            data-testid={`transaction-item-${transaction.id}`}
            className={`
              bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-4
              transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg
              ${transaction.optimistic ? 'opacity-70' : ''}
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 
                    data-testid={`transaction-description-${transaction.id}`}
                    className="font-semibold text-[#181C1A]"
                  >
                    {transaction.description}
                  </h4>
                  <div className="flex gap-1">
                    {isGive && (
                      <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-[#1E3F32]/10 text-[#1E3F32] rounded-full">
                        Give {transaction.give_percentage}%
                      </span>
                    )}
                    {isLend && (
                      <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-[#C2574A]/10 text-[#C2574A] rounded-full">
                        Lend {transaction.lend_percentage}%
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-2 text-sm text-[#68706B]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {useHebrewDates 
                      ? formatHebrewDate(transaction.date, 'en')
                      : new Date(transaction.date).toLocaleDateString()
                    }
                  </span>
                  {transaction.recipient_name && (
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {transaction.recipient_name}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p 
                    data-testid={`transaction-amount-${transaction.id}`}
                    className="text-lg font-bold text-[#181C1A]"
                  >
                    {getCurrencySymbol(transaction.currency)}{transaction.amount.toLocaleString()}
                  </p>
                  {transaction.currency !== baseCurrency && (
                    <p className="text-xs text-[#68706B]">
                      ≈ {getCurrencySymbol(baseCurrency)}{normalizedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    data-testid={`edit-transaction-${transaction.id}`}
                    onClick={() => onEdit(transaction)}
                    className="p-2 text-[#68706B] hover:text-[#1E3F32] hover:bg-[#1E3F32]/10 rounded-xl transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    data-testid={`delete-transaction-${transaction.id}`}
                    onClick={() => handleDelete(transaction.id)}
                    disabled={isPending}
                    className="p-2 text-[#68706B] hover:text-[#C2574A] hover:bg-[#C2574A]/10 rounded-xl transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
