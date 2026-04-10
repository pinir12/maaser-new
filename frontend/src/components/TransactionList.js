import { useTransition } from 'react';
import { formatHebrewDate } from '../lib/hebrew-calendar';
import { getCurrencySymbol, TRANSACTION_TYPES, getRecurringLabel } from '../lib/validation';
import { Pencil, Trash2, Calendar, DollarSign, User, Repeat, TrendingUp, Heart, HandCoins } from 'lucide-react';

export function TransactionList({ 
  transactions, 
  onEdit, 
  onDelete, 
  useHebrewDates,
  baseCurrency 
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async (id) => {
    await onDelete(id);
  };

  const normalizeAmount = (transaction) => {
    if (transaction.currency === baseCurrency) {
      return transaction.amount;
    }
    return transaction.amount * (transaction.exchange_rate_to_base || 1);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case TRANSACTION_TYPES.INCOME:
        return <TrendingUp className="w-4 h-4" />;
      case TRANSACTION_TYPES.GIVE:
        return <Heart className="w-4 h-4" />;
      case TRANSACTION_TYPES.LEND:
        return <HandCoins className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case TRANSACTION_TYPES.INCOME:
        return 'bg-emerald-500/10 text-emerald-600';
      case TRANSACTION_TYPES.GIVE:
        return 'bg-[#1E3F32]/10 text-[#1E3F32]';
      case TRANSACTION_TYPES.LEND:
        return 'bg-[#C2574A]/10 text-[#C2574A]';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  const getAmountColor = (type) => {
    switch (type) {
      case TRANSACTION_TYPES.INCOME:
        return 'text-emerald-600';
      case TRANSACTION_TYPES.GIVE:
        return 'text-[#1E3F32]';
      case TRANSACTION_TYPES.LEND:
        return 'text-[#C2574A]';
      default:
        return 'text-[#181C1A]';
    }
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div 
        data-testid="empty-transactions" 
        className="text-center py-12 text-[#68706B]"
      >
        <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No transactions yet. Add your first income!</p>
      </div>
    );
  }

  // Group transactions by type
  const groupedTransactions = {
    [TRANSACTION_TYPES.INCOME]: transactions.filter(t => t.type === TRANSACTION_TYPES.INCOME),
    [TRANSACTION_TYPES.GIVE]: transactions.filter(t => t.type === TRANSACTION_TYPES.GIVE),
    [TRANSACTION_TYPES.LEND]: transactions.filter(t => t.type === TRANSACTION_TYPES.LEND),
  };

  const renderTransactionGroup = (type, label, items) => {
    if (items.length === 0) return null;
    
    return (
      <div key={type} className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] flex items-center gap-2">
          <span className={`p-1.5 rounded-lg ${getTypeColor(type)}`}>
            {getTypeIcon(type)}
          </span>
          {label} ({items.length})
        </h4>
        {items.map((transaction) => {
          const normalizedAmount = normalizeAmount(transaction);
          
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
                    {transaction.is_recurring && (
                      <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-[#4A6E82]/10 text-[#4A6E82] rounded-full flex items-center gap-1">
                        <Repeat className="w-3 h-3" />
                        {getRecurringLabel(transaction.recurring_frequency)}
                      </span>
                    )}
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
                    {type === TRANSACTION_TYPES.INCOME && transaction.maaser_percentage && (
                      <span className="text-amber-600">
                        {transaction.maaser_percentage}% maaser
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p 
                      data-testid={`transaction-amount-${transaction.id}`}
                      className={`text-lg font-bold ${getAmountColor(type)}`}
                    >
                      {type === TRANSACTION_TYPES.INCOME ? '+' : '-'}
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
  };

  return (
    <div data-testid="transaction-list" className="space-y-6">
      {renderTransactionGroup(TRANSACTION_TYPES.INCOME, 'Income', groupedTransactions[TRANSACTION_TYPES.INCOME])}
      {renderTransactionGroup(TRANSACTION_TYPES.GIVE, 'Gives', groupedTransactions[TRANSACTION_TYPES.GIVE])}
      {renderTransactionGroup(TRANSACTION_TYPES.LEND, 'Lends', groupedTransactions[TRANSACTION_TYPES.LEND])}
    </div>
  );
}
