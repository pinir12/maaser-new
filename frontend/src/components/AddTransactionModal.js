import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { incomeSchema, giveSchema, lendSchema, currencies, getCurrencySymbol, calculateMaaser, TRANSACTION_TYPES, RECURRING_FREQUENCIES, getRecurringLabel } from '../lib/validation';
import { toHebrewDate } from '../lib/hebrew-calendar';
import { X, Calendar, DollarSign, User, Repeat, TrendingUp, Heart, HandCoins } from 'lucide-react';

export function AddTransactionModal({ isOpen, onClose, onSubmit, editTransaction, baseCurrency, distributionMode, maaserBalance = 0 }) {
  const [txnType, setTxnType] = useState(TRANSACTION_TYPES.INCOME);
  const isGiveOnly = distributionMode === 'give_only';

  const getSchema = () => txnType === TRANSACTION_TYPES.INCOME ? incomeSchema : txnType === TRANSACTION_TYPES.GIVE ? giveSchema : lendSchema;

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(getSchema()),
    defaultValues: { description: '', amount: '', currency: baseCurrency || 'USD', exchange_rate_to_base: 1, date: new Date().toISOString().split('T')[0], maaser_percentage: 10, recipient_name: '', is_recurring: false, recurring_frequency: 'none', recurring_end_date: '' }
  });

  const watchCurrency = watch('currency');
  const watchDate = watch('date');
  const watchAmount = watch('amount');
  const watchMaaserPct = watch('maaser_percentage');
  const watchRecurring = watch('is_recurring');

  useEffect(() => {
    if (isOpen) {
      if (editTransaction) {
        setTxnType(editTransaction.type);
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
        reset({ description: '', amount: '', currency: baseCurrency || 'USD', exchange_rate_to_base: 1, date: new Date().toISOString().split('T')[0], maaser_percentage: 10, recipient_name: '', is_recurring: false, recurring_frequency: 'none', recurring_end_date: '' });
      }
    }
  }, [isOpen, editTransaction, reset, baseCurrency]);

  useEffect(() => { if (watchCurrency === baseCurrency) setValue('exchange_rate_to_base', 1); }, [watchCurrency, baseCurrency, setValue]);

  const hebrewDate = watchDate ? toHebrewDate(new Date(watchDate)) : null;
  const calcMaaser = txnType === TRANSACTION_TYPES.INCOME && watchAmount ? calculateMaaser(Number(watchAmount), Number(watchMaaserPct) || 10) : 0;

  const onFormSubmit = async (data) => {
    const formData = {
      description: data.description,
      amount: Number(data.amount),
      currency: data.currency,
      exchange_rate_to_base: Number(data.exchange_rate_to_base),
      date: data.date,
      type: txnType,
      is_recurring: data.is_recurring || false,
      recurring_frequency: data.is_recurring ? data.recurring_frequency : 'none',
      recurring_end_date: data.is_recurring && data.recurring_end_date ? data.recurring_end_date : null,
      hebrew_date: hebrewDate?.displayEn || null
    };
    if (txnType === TRANSACTION_TYPES.INCOME) { formData.maaser_percentage = Number(data.maaser_percentage) || 10; formData.maaser_amount = calcMaaser; }
    if ((txnType === TRANSACTION_TYPES.GIVE || txnType === TRANSACTION_TYPES.LEND) && data.recipient_name) formData.recipient_name = data.recipient_name;
    await onSubmit(formData, editTransaction?.id);
    onClose();
  };

  if (!isOpen) return null;

  const types = [
    { type: TRANSACTION_TYPES.INCOME, label: 'Income', Icon: TrendingUp, color: 'bg-emerald-500' },
    { type: TRANSACTION_TYPES.GIVE, label: 'Give', Icon: Heart, color: 'bg-blue-500' },
    ...(!isGiveOnly ? [{ type: TRANSACTION_TYPES.LEND, label: 'Lend', Icon: HandCoins, color: 'bg-rose-500' }] : [])
  ];

  return (
    <div data-testid="add-transaction-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">{editTransaction ? 'Edit' : 'Add'} Transaction</h2>
          <button data-testid="close-modal-btn" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-2 p-4 border-b border-slate-200">
          {types.map(({ type, label, Icon, color }) => (
            <button key={type} data-testid={`type-${type}-btn`} onClick={() => setTxnType(type)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-colors ${txnType === type ? `${color} text-white` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {(txnType === TRANSACTION_TYPES.GIVE || txnType === TRANSACTION_TYPES.LEND) && (
          <div className="mx-4 mt-4 p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
            Available Maaser: <strong>{getCurrencySymbol(baseCurrency)}{maaserBalance.toFixed(2)}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Description</label>
            <input data-testid="transaction-description-input" type="text" {...register('description')} placeholder={txnType === TRANSACTION_TYPES.INCOME ? 'e.g., Salary' : txnType === TRANSACTION_TYPES.GIVE ? 'e.g., Charity' : 'e.g., Loan'}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500" />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input data-testid="transaction-amount-input" type="number" step="0.01" {...register('amount', { valueAsNumber: true })} placeholder="0.00"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500" />
              </div>
              {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Currency</label>
              <select data-testid="transaction-currency-select" {...register('currency')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500">
                {currencies.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
              </select>
            </div>
          </div>

          {watchCurrency !== baseCurrency && (
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Exchange Rate to {baseCurrency}</label>
              <input data-testid="transaction-exchange-rate-input" type="number" step="0.0001" {...register('exchange_rate_to_base', { valueAsNumber: true })} placeholder="1.0"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          {txnType === TRANSACTION_TYPES.INCOME && (
            <div className="p-3 bg-emerald-50 rounded-xl">
              <label className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1 block">Maaser %</label>
              <div className="flex items-center gap-3">
                <input data-testid="maaser-percentage-input" type="number" min="0" max="100" {...register('maaser_percentage', { valueAsNumber: true })}
                  className="w-20 px-3 py-2 bg-white border border-emerald-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500" />
                {watchAmount && <span className="text-emerald-700 text-sm">= {getCurrencySymbol(watchCurrency)}{calcMaaser.toFixed(2)}</span>}
              </div>
            </div>
          )}

          {(txnType === TRANSACTION_TYPES.GIVE || txnType === TRANSACTION_TYPES.LEND) && (
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">{txnType === TRANSACTION_TYPES.GIVE ? 'Recipient (optional)' : 'Recipient'}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input data-testid="recipient-name-input" type="text" {...register('recipient_name')} placeholder={txnType === TRANSACTION_TYPES.GIVE ? 'e.g., Charity org' : 'e.g., John'}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input data-testid="transaction-date-input" type="date" {...register('date')} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            {hebrewDate && <p data-testid="hebrew-date-display" className="mt-1 text-xs text-blue-600">{hebrewDate.displayEn}</p>}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input data-testid="is-recurring-checkbox" type="checkbox" {...register('is_recurring')} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <Repeat className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Recurring</span>
            </label>
            {watchRecurring && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Frequency</label>
                  <select data-testid="recurring-frequency-select" {...register('recurring_frequency')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm">
                    {Object.entries(RECURRING_FREQUENCIES).filter(([k]) => k !== 'NONE').map(([, v]) => <option key={v} value={v}>{getRecurringLabel(v)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">End Date</label>
                  <input data-testid="recurring-end-date-input" type="date" {...register('recurring_end_date')} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm" />
                </div>
              </div>
            )}
          </div>

          <button data-testid="submit-transaction-btn" type="submit" disabled={isSubmitting}
            className={`w-full py-3 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 ${
              txnType === TRANSACTION_TYPES.INCOME ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25' :
              txnType === TRANSACTION_TYPES.GIVE ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/25' :
              'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25'
            }`}>
            {isSubmitting ? 'Saving...' : editTransaction ? 'Update' : `Add ${txnType.charAt(0).toUpperCase() + txnType.slice(1)}`}
          </button>
        </form>
      </div>
    </div>
  );
}
