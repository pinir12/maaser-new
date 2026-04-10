import { formatHebrewDate } from '../lib/hebrew-calendar';
import { getCurrencySymbol, TRANSACTION_TYPES, getRecurringLabel } from '../lib/validation';
import { Pencil, Trash2, Calendar, DollarSign, User, Repeat, TrendingUp, Heart, HandCoins } from 'lucide-react';

export function TransactionList({ transactions, onEdit, onDelete, useHebrewDates, baseCurrency }) {
  const normalize = (t) => t.currency === baseCurrency ? t.amount : t.amount * (t.exchange_rate_to_base || 1);

  const getIcon = (type) => {
    if (type === TRANSACTION_TYPES.INCOME) return <TrendingUp className="w-4 h-4" />;
    if (type === TRANSACTION_TYPES.GIVE) return <Heart className="w-4 h-4" />;
    if (type === TRANSACTION_TYPES.LEND) return <HandCoins className="w-4 h-4" />;
    return <DollarSign className="w-4 h-4" />;
  };

  const getColor = (type) => {
    if (type === TRANSACTION_TYPES.INCOME) return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' };
    if (type === TRANSACTION_TYPES.GIVE) return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };
    if (type === TRANSACTION_TYPES.LEND) return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' };
    return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div data-testid="empty-transactions" className="text-center py-12 text-slate-500">
        <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>No transactions yet</p>
      </div>
    );
  }

  const grouped = {
    [TRANSACTION_TYPES.INCOME]: transactions.filter(t => t.type === TRANSACTION_TYPES.INCOME),
    [TRANSACTION_TYPES.GIVE]: transactions.filter(t => t.type === TRANSACTION_TYPES.GIVE),
    [TRANSACTION_TYPES.LEND]: transactions.filter(t => t.type === TRANSACTION_TYPES.LEND),
  };

  const renderGroup = (type, label, items) => {
    if (items.length === 0) return null;
    const colors = getColor(type);
    
    return (
      <div key={type} className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
          <span className={`p-1 rounded ${colors.bg} ${colors.text}`}>{getIcon(type)}</span>
          {label} ({items.length})
        </div>
        {items.map((t) => (
          <div
            key={t.id}
            data-testid={`transaction-item-${t.id}`}
            className={`flex items-center justify-between p-3 rounded-xl border ${colors.border} ${colors.bg} transition-all hover:shadow-sm`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span data-testid={`transaction-description-${t.id}`} className="font-medium text-slate-900 truncate">
                  {t.description}
                </span>
                {t.is_recurring && (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-slate-200 text-slate-600 rounded-full">
                    <Repeat className="w-3 h-3" />
                    {getRecurringLabel(t.recurring_frequency)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {useHebrewDates ? formatHebrewDate(t.date, 'en') : new Date(t.date).toLocaleDateString()}
                </span>
                {t.recipient_name && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {t.recipient_name}
                  </span>
                )}
                {type === TRANSACTION_TYPES.INCOME && t.maaser_percentage && (
                  <span className="text-amber-600">{t.maaser_percentage}% maaser</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 ml-4">
              <div className="text-right">
                <p data-testid={`transaction-amount-${t.id}`} className={`font-bold ${colors.text}`}>
                  {type === TRANSACTION_TYPES.INCOME ? '+' : '-'}{getCurrencySymbol(t.currency)}{t.amount.toLocaleString()}
                </p>
                {t.currency !== baseCurrency && (
                  <p className="text-xs text-slate-400">≈ {getCurrencySymbol(baseCurrency)}{normalize(t).toFixed(2)}</p>
                )}
              </div>
              
              <div className="flex gap-1">
                <button
                  data-testid={`edit-transaction-${t.id}`}
                  onClick={() => onEdit(t)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  data-testid={`delete-transaction-${t.id}`}
                  onClick={() => onDelete(t.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div data-testid="transaction-list" className="space-y-6">
      {renderGroup(TRANSACTION_TYPES.INCOME, 'Income', grouped[TRANSACTION_TYPES.INCOME])}
      {renderGroup(TRANSACTION_TYPES.GIVE, 'Gives', grouped[TRANSACTION_TYPES.GIVE])}
      {renderGroup(TRANSACTION_TYPES.LEND, 'Lends', grouped[TRANSACTION_TYPES.LEND])}
    </div>
  );
}
