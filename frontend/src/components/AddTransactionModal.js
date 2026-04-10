import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema, currencies, getCurrencySymbol } from '../lib/validation';
import { toHebrewDate } from '../lib/hebrew-calendar';
import { X, Calendar, DollarSign, Percent, User } from 'lucide-react';

export function AddTransactionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editTransaction,
  baseCurrency,
  distributionMode 
}) {
  const isGiveOnly = distributionMode === 'give_only';
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: '',
      currency: baseCurrency || 'USD',
      exchange_rate_to_base: 1,
      type: isGiveOnly ? 'give' : 'both',
      give_percentage: 100,
      lend_percentage: 0,
      recipient_name: '',
      date: new Date().toISOString().split('T')[0]
    }
  });

  const watchCurrency = watch('currency');
  const watchGivePercentage = watch('give_percentage');
  const watchLendPercentage = watch('lend_percentage');
  const watchDate = watch('date');

  // Auto-adjust lend percentage when give percentage changes
  useEffect(() => {
    if (isGiveOnly) {
      setValue('lend_percentage', 0);
      setValue('give_percentage', 100);
    }
  }, [isGiveOnly, setValue]);

  // Reset form when modal opens/closes or edit transaction changes
  useEffect(() => {
    if (isOpen) {
      if (editTransaction) {
        reset({
          description: editTransaction.description,
          amount: editTransaction.amount,
          currency: editTransaction.currency,
          exchange_rate_to_base: editTransaction.exchange_rate_to_base,
          type: editTransaction.type,
          give_percentage: editTransaction.give_percentage,
          lend_percentage: isGiveOnly ? 0 : editTransaction.lend_percentage,
          recipient_name: editTransaction.recipient_name || '',
          date: editTransaction.date?.split('T')[0] || new Date().toISOString().split('T')[0]
        });
      } else {
        reset({
          description: '',
          amount: '',
          currency: baseCurrency || 'USD',
          exchange_rate_to_base: 1,
          type: isGiveOnly ? 'give' : 'both',
          give_percentage: 100,
          lend_percentage: 0,
          recipient_name: '',
          date: new Date().toISOString().split('T')[0]
        });
      }
    }
  }, [isOpen, editTransaction, reset, baseCurrency, isGiveOnly]);

  // Auto-set exchange rate when currency matches base
  useEffect(() => {
    if (watchCurrency === baseCurrency) {
      setValue('exchange_rate_to_base', 1);
    }
  }, [watchCurrency, baseCurrency, setValue]);

  const hebrewDate = watchDate ? toHebrewDate(new Date(watchDate)) : null;
  const totalPercentage = (Number(watchGivePercentage) || 0) + (Number(watchLendPercentage) || 0);
  const percentageError = totalPercentage > 100;

  const onFormSubmit = async (data) => {
    const formData = {
      ...data,
      amount: Number(data.amount),
      exchange_rate_to_base: Number(data.exchange_rate_to_base),
      give_percentage: Number(data.give_percentage),
      lend_percentage: isGiveOnly ? 0 : Number(data.lend_percentage),
      hebrew_date: hebrewDate?.displayEn || null
    };
    
    await onSubmit(formData, editTransaction?.id);
    onClose();
  };

  if (!isOpen) return null;

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
      <div className="relative w-full max-w-lg bg-white/90 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl">
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
              placeholder="What's this transaction for?"
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

          {/* Distribution Percentages - Only show if not give_only mode */}
          {!isGiveOnly && (
            <div className="p-4 bg-[#1E3F32]/5 rounded-xl">
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-3">
                Distribution
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#181C1A] mb-1 block">Give %</label>
                  <div className="relative">
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#68706B]" />
                    <input
                      data-testid="give-percentage-input"
                      type="number"
                      min="0"
                      max="100"
                      {...register('give_percentage', { valueAsNumber: true })}
                      className="w-full px-4 py-2 pr-10 bg-white/70 border border-white/40 rounded-xl focus:ring-2 focus:ring-[#1E3F32]/50 transition-all text-[#181C1A]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[#181C1A] mb-1 block">Lend %</label>
                  <div className="relative">
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#68706B]" />
                    <input
                      data-testid="lend-percentage-input"
                      type="number"
                      min="0"
                      max="100"
                      {...register('lend_percentage', { valueAsNumber: true })}
                      className="w-full px-4 py-2 pr-10 bg-white/70 border border-white/40 rounded-xl focus:ring-2 focus:ring-[#1E3F32]/50 transition-all text-[#181C1A]"
                    />
                  </div>
                </div>
              </div>
              
              {/* Percentage indicator */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${percentageError ? 'bg-[#C2574A]' : 'bg-[#1E3F32]'}`}
                    style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                  />
                </div>
                <span className={`text-sm font-bold ${percentageError ? 'text-[#C2574A]' : 'text-[#181C1A]'}`}>
                  {totalPercentage}%
                </span>
              </div>
              
              {percentageError && (
                <p data-testid="percentage-error" className="mt-2 text-sm text-[#C2574A]">
                  Total percentage cannot exceed 100%
                </p>
              )}
              {errors.lend_percentage && (
                <p data-testid="lend-percentage-error" className="mt-2 text-sm text-[#C2574A]">
                  {errors.lend_percentage.message}
                </p>
              )}
            </div>
          )}

          {/* Recipient Name (for lends) */}
          {!isGiveOnly && Number(watchLendPercentage) > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
                Recipient Name (for Lend)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#68706B]" />
                <input
                  data-testid="recipient-name-input"
                  type="text"
                  {...register('recipient_name')}
                  placeholder="Who are you lending to?"
                  className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-md border border-white/40 rounded-xl focus:ring-2 focus:ring-[#1E3F32]/50 focus:bg-white transition-all text-[#181C1A]"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            data-testid="submit-transaction-btn"
            type="submit"
            disabled={isSubmitting || percentageError}
            className="w-full py-3 bg-[#1E3F32] text-white font-semibold rounded-xl hover:bg-[#152e24] shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : editTransaction ? 'Update Transaction' : 'Add Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}
