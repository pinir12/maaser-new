import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  incomeSchema, 
  giveSchema, 
  lendSchema,
  currencies, 
  getCurrencySymbol,
  calculateMaaser,
  TRANSACTION_TYPES,
  RECURRING_FREQUENCIES,
  getRecurringLabel
} from '../lib/validation';
import { toHebrewDate } from '../lib/hebrew-calendar';
import { X, Calendar, DollarSign, User, Repeat, TrendingUp, Heart, HandCoins } from 'lucide-react';

export function AddTransactionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editTransaction,
  baseCurrency,
  distributionMode,
  maaserBalance = 0
}) {
  const [transactionType, setTransactionType] = useState(TRANSACTION_TYPES.INCOME);
  const isGiveOnly = distributionMode === 'give_only';
  
  // Get the right schema based on type
  const getSchema = () => {
    switch (transactionType) {
      case TRANSACTION_TYPES.INCOME:
        return incomeSchema;
      case TRANSACTION_TYPES.GIVE:
        return giveSchema;
      case TRANSACTION_TYPES.LEND:
        return lendSchema;
      default:
        return incomeSchema;
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      description: '',
      amount: '',
      currency: baseCurrency || 'USD',
      exchange_rate_to_base: 1,
      date: new Date().toISOString().split('T')[0],
      maaser_percentage: 10,
      recipient_name: '',
      is_recurring: false,
      recurring_frequency: 'none',
      recurring_end_date: ''
    }
  });

  const watchCurrency = watch('currency');
  const watchDate = watch('date');
  const watchAmount = watch('amount');
  const watchMaaserPercentage = watch('maaser_percentage');
  const watchIsRecurring = watch('is_recurring');

  // Reset form when modal opens/closes or type changes
  useEffect(() => {
    if (isOpen) {
      if (editTransaction) {
        setTransactionType(editTransaction.type);
        reset({
          description: editTransaction.description,
          amount: editTransaction.amount,
          currency: editTransaction.currency,
          exchange_rate_to_base: editTransaction.exchange_rate_to_base,
          date: editTransaction.date?.split('T')[0] || new Date().toISOString().split('T')[0],
          maaser_percentage: editTransaction.maaser_percentage || 10,
          recipient_name: editTransaction.recipient_name || '',
          is_recurring: editTransaction.is_recurring || false,
          recurring_frequency: editTransaction.recurring_frequency || 'none',
          recurring_end_date: editTransaction.recurring_end_date || ''
        });
      } else {
        reset({
          description: '',
          amount: '',
          currency: baseCurrency || 'USD',
          exchange_rate_to_base: 1,
          date: new Date().toISOString().split('T')[0],
          maaser_percentage: 10,
          recipient_name: '',
          is_recurring: false,
          recurring_frequency: 'none',
          recurring_end_date: ''
        });
      }
    }
  }, [isOpen, editTransaction, reset, baseCurrency, transactionType]);

  // Auto-set exchange rate when currency matches base
  useEffect(() => {
    if (watchCurrency === baseCurrency) {
      setValue('exchange_rate_to_base', 1);
    }
  }, [watchCurrency, baseCurrency, setValue]);

  const hebrewDate = watchDate ? toHebrewDate(new Date(watchDate)) : null;
  const calculatedMaaser = transactionType === TRANSACTION_TYPES.INCOME && watchAmount 
    ? calculateMaaser(Number(watchAmount), Number(watchMaaserPercentage) || 10)
    : 0;

  const onFormSubmit = async (data) => {
    const formData = {
      ...data,
      type: transactionType,
      amount: Number(data.amount),
      exchange_rate_to_base: Number(data.exchange_rate_to_base),
      maaser_percentage: transactionType === TRANSACTION_TYPES.INCOME ? Number(data.maaser_percentage) : null,
      maaser_amount: transactionType === TRANSACTION_TYPES.INCOME ? calculatedMaaser : null,
      hebrew_date: hebrewDate?.displayEn || null
    };
    
    await onSubmit(formData, editTransaction?.id);
    onClose();
  };

  if (!isOpen) return null;

  const typeButtons = [
    { type: TRANSACTION_TYPES.INCOME, label: 'Income', icon: TrendingUp, color: 'bg-emerald-500' },
    { type: TRANSACTION_TYPES.GIVE, label: 'Give', icon: Heart, color: 'bg-[#1E3F32]' },
  ];
  
  if (!isGiveOnly) {
    typeButtons.push({ type: TRANSACTION_TYPES.LEND, label: 'Lend', icon: HandCoins, color: 'bg-[#C2574A]' });
  }

  return (
    <div 
      data-testid="add-transaction-modal" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white/90 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-bold text-[#181C1A]">
            {editTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            data-testid="close-modal-btn"
            onClick={onClose}
            className="p-2 text-[#68706B] hover:text-[#181C1A] hover:bg-black/5 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Transaction Type Tabs */}
        <div className="flex gap-2 p-4 border-b border-white/20">
          {typeButtons.map(({ type, label, icon: Icon, color }) => (
            <button
              key={type}
              data-testid={`type-${type}-btn`}
              onClick={() => setTransactionType(type)}
              className={`
                flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all
                ${transactionType === type 
                  ? `${color} text-white shadow-md` 
                  : 'bg-white/50 text-[#68706B] hover:bg-white/70'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Maaser Balance Info (for Give/Lend) */}
        {(transactionType === TRANSACTION_TYPES.GIVE || transactionType === TRANSACTION_TYPES.LEND) && (
          <div className="mx-6 mt-4 p-3 bg-[#1E3F32]/10 rounded-xl">
            <p className="text-sm text-[#1E3F32]">
              <span className="font-semibold">Available Maaser:</span>{' '}
              {getCurrencySymbol(baseCurrency)}{maaserBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-5">
          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
              Description
            </label>
            <input
              data-testid="transaction-description-input"
              type="text"
              {...register('description')}
              placeholder={
                transactionType === TRANSACTION_TYPES.INCOME ? "e.g., Monthly salary" :
                transactionType === TRANSACTION_TYPES.GIVE ? "e.g., Charity donation" :
                "e.g., Loan to friend"
              }
              className="w-full px-4 py-3 bg-white/50 backdrop-blur-md border border-white/40 rounded-xl focus:ring-2 focus:ring-[#1E3F32]/50 focus:bg-white transition-all text-[#181C1A] placeholder:text-[#68706B]/50"
            />
            {errors.description && (
              <p data-testid="description-error" className="mt-1 text-sm text-[#C2574A]">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
                Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#68706B]" />
                <input
                  data-testid="transaction-amount-input"
                  type="number"
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-md border border-white/40 rounded-xl focus:ring-2 focus:ring-[#1E3F32]/50 focus:bg-white transition-all text-[#181C1A]"
                />
              </div>
              {errors.amount && (
                <p data-testid="amount-error" className="mt-1 text-sm text-[#C2574A]">
                  {errors.amount.message}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
                Currency
              </label>
              <select
                data-testid="transaction-currency-select"
                {...register('currency')}
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-md border border-white/40 rounded-xl focus:ring-2 focus:ring-[#1E3F32]/50 focus:bg-white transition-all text-[#181C1A]"
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exchange Rate (only if currency differs from base) */}
          {watchCurrency !== baseCurrency && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
                Exchange Rate to {baseCurrency}
              </label>
              <input
                data-testid="transaction-exchange-rate-input"
                type="number"
                step="0.0001"
                {...register('exchange_rate_to_base', { valueAsNumber: true })}
                placeholder="1.0"
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-md border border-white/40 rounded-xl focus:ring-2 focus:ring-[#1E3F32]/50 focus:bg-white transition-all text-[#181C1A]"
              />
              <p className="mt-1 text-xs text-[#68706B]">
                How many {baseCurrency} is 1 {watchCurrency}?
              </p>
            </div>
          )}

          {/* Maaser Percentage (Income only) */}
          {transactionType === TRANSACTION_TYPES.INCOME && (
            <div className="p-4 bg-emerald-500/10 rounded-xl">
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 mb-2">
                Maaser Percentage
              </label>
              <div className="flex items-center gap-4">
                <input
                  data-testid="maaser-percentage-input"
                  type="number"
                  min="0"
                  max="100"
                  {...register('maaser_percentage', { valueAsNumber: true })}
                  className="w-24 px-4 py-2 bg-white/70 border border-white/40 rounded-xl focus:ring-2 focus:ring-emerald-500/50 transition-all text-[#181C1A]"
                />
                <span className="text-emerald-700 font-medium">%</span>
                {watchAmount && (
                  <span className="text-emerald-700">
                    = {getCurrencySymbol(watchCurrency)}{calculatedMaaser.toFixed(2)} maaser
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Recipient Name (Give/Lend) */}
          {(transactionType === TRANSACTION_TYPES.GIVE || transactionType === TRANSACTION_TYPES.LEND) && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
                {transactionType === TRANSACTION_TYPES.GIVE ? 'Recipient/Organization (optional)' : 'Recipient Name'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#68706B]" />
                <input
                  data-testid="recipient-name-input"
                  type="text"
                  {...register('recipient_name')}
                  placeholder={transactionType === TRANSACTION_TYPES.GIVE ? "e.g., Local charity" : "e.g., John Doe"}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-md border border-white/40 rounded-xl focus:ring-2 focus:ring-[#1E3F32]/50 focus:bg-white transition-all text-[#181C1A]"
                />
              </div>
              {errors.recipient_name && (
                <p className="mt-1 text-sm text-[#C2574A]">
                  {errors.recipient_name.message}
                </p>
              )}
            </div>
          )}

          {/* Date with Hebrew display */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#68706B]" />
              <input
                data-testid="transaction-date-input"
                type="date"
                {...register('date')}
                className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-md border border-white/40 rounded-xl focus:ring-2 focus:ring-[#1E3F32]/50 focus:bg-white transition-all text-[#181C1A]"
              />
            </div>
            {hebrewDate && (
              <p data-testid="hebrew-date-display" className="mt-1 text-sm text-[#4A6E82]">
                Hebrew: {hebrewDate.displayEn}
              </p>
            )}
          </div>

          {/* Recurring Options */}
          <div className="p-4 bg-[#4A6E82]/10 rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              <input
                data-testid="is-recurring-checkbox"
                type="checkbox"
                {...register('is_recurring')}
                className="w-5 h-5 rounded border-white/40 text-[#1E3F32] focus:ring-[#1E3F32]/50"
              />
              <label className="flex items-center gap-2 text-sm font-medium text-[#181C1A]">
                <Repeat className="w-4 h-4 text-[#4A6E82]" />
                Make this recurring
              </label>
            </div>
            
            {watchIsRecurring && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
                    Frequency
                  </label>
                  <select
                    data-testid="recurring-frequency-select"
                    {...register('recurring_frequency')}
                    className="w-full px-3 py-2 bg-white/70 border border-white/40 rounded-xl text-[#181C1A]"
                  >
                    {Object.entries(RECURRING_FREQUENCIES).filter(([k]) => k !== 'NONE').map(([key, value]) => (
                      <option key={value} value={value}>
                        {getRecurringLabel(value)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
                    End Date (optional)
                  </label>
                  <input
                    data-testid="recurring-end-date-input"
                    type="date"
                    {...register('recurring_end_date')}
                    className="w-full px-3 py-2 bg-white/70 border border-white/40 rounded-xl text-[#181C1A]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            data-testid="submit-transaction-btn"
            type="submit"
            disabled={isSubmitting}
            className={`
              w-full py-3 text-white font-semibold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed
              ${transactionType === TRANSACTION_TYPES.INCOME ? 'bg-emerald-500 hover:bg-emerald-600' :
                transactionType === TRANSACTION_TYPES.GIVE ? 'bg-[#1E3F32] hover:bg-[#152e24]' :
                'bg-[#C2574A] hover:bg-[#a84a3f]'}
            `}
          >
            {isSubmitting ? 'Saving...' : editTransaction ? 'Update' : `Add ${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}`}
          </button>
        </form>
      </div>
    </div>
  );
}
