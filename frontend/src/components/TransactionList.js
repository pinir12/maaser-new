import { useState } from 'react';
import { formatHebrewDate } from '../lib/hebrew-calendar';
import { getCurrencySymbol, TRANSACTION_TYPES, getRecurringLabel } from '../lib/validation';
import { Pencil, Trash2, Calendar, DollarSign, User, Repeat, TrendingUp, Heart, HandCoins, ChevronDown } from 'lucide-react';

function AccordionSection({ type, label, items, icon: Icon, colors, defaultOpen, onEdit, onDelete, useHebrewDates, baseCurrency }) {
  const [open, setOpen] = useState(defaultOpen);
  const normalize = (t) => t.currency === baseCurrency ? t.amount : t.amount * (t.exchange_rate_to_base || 1);

  if (items.length === 0) return null;

  const total = items.reduce((sum, t) => sum + (t.currency === baseCurrency ? t.amount : t.amount * (t.exchange_rate_to_base || 1)), 0);

  return (
    <div data-testid={`accordion-${type}`} className="rounded-xl border border-slate-200/80 overflow-hidden bg-white/60 backdrop-blur-sm">
      <button
        data-testid={`accordion-trigger-${type}`}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className={`p-1.5 rounded-lg ${colors.badge}`}>
            <Icon className="w-4 h-4" />
          </span>
          <span className="font-semibold text-slate-800 text-sm">{label}</span>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{items.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${colors.text}`}>
            {getCurrencySymbol(baseCurrency)}{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-3 pb-3 space-y-1.5">
          {items.map((t) => (
            <div
              key={t.id}
              data-testid={`transaction-item-${t.id}`}
              className={`flex items-center justify-between p-3 rounded-xl border ${colors.border} ${colors.bg} transition-all hover:shadow-sm`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span data-testid={`transaction-description-${t.id}`} className="font-medium text-slate-900 truncate text-sm">
                    {t.description}
                  </span>
                  {t.is_recurring && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-slate-200/80 text-slate-600 rounded-full">
                      <Repeat className="w-2.5 h-2.5" />
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
                  <p data-testid={`transaction-amount-${t.id}`} className={`font-bold text-sm ${colors.text}`}>
                    {type === TRANSACTION_TYPES.INCOME ? '+' : '-'}{getCurrencySymbol(t.currency)}{t.amount.toLocaleString()}
                  </p>
                  {t.currency !== baseCurrency && (
                    <p className="text-[10px] text-slate-400">{getCurrencySymbol(baseCurrency)}{normalize(t).toFixed(2)}</p>
                  )}
                </div>
                
                <div className="flex gap-0.5">
                  <button
                    data-testid={`edit-transaction-${t.id}`}
                    onClick={() => onEdit(t)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    data-testid={`delete-transaction-${t.id}`}
                    onClick={() => onDelete(t.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TransactionList({ transactions, onEdit, onDelete, useHebrewDates, baseCurrency }) {
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

  const sections = [
    {
      type: TRANSACTION_TYPES.INCOME,
      label: 'Income',
      icon: TrendingUp,
      colors: { bg: 'bg-emerald-50/80', text: 'text-emerald-600', border: 'border-emerald-200/80', badge: 'bg-emerald-100 text-emerald-600' },
      items: grouped[TRANSACTION_TYPES.INCOME]
    },
    {
      type: TRANSACTION_TYPES.GIVE,
      label: 'Gives',
      icon: Heart,
      colors: { bg: 'bg-blue-50/80', text: 'text-blue-600', border: 'border-blue-200/80', badge: 'bg-blue-100 text-blue-600' },
      items: grouped[TRANSACTION_TYPES.GIVE]
    },
    {
      type: TRANSACTION_TYPES.LEND,
      label: 'Lends',
      icon: HandCoins,
      colors: { bg: 'bg-rose-50/80', text: 'text-rose-600', border: 'border-rose-200/80', badge: 'bg-rose-100 text-rose-600' },
      items: grouped[TRANSACTION_TYPES.LEND]
    }
  ];

  return (
    <div data-testid="transaction-list" className="space-y-3">
      {sections.map(({ type, label, icon, colors, items }) => (
        <AccordionSection
          key={type}
          type={type}
          label={label}
          icon={icon}
          colors={colors}
          items={items}
          defaultOpen={true}
          onEdit={onEdit}
          onDelete={onDelete}
          useHebrewDates={useHebrewDates}
          baseCurrency={baseCurrency}
        />
      ))}
    </div>
  );
}
