import { getCurrencySymbol } from '../lib/validation';
import { TrendingUp, TrendingDown, Wallet, HandCoins } from 'lucide-react';

export function DashboardStats({ 
  transactions, 
  baseCurrency, 
  distributionMode 
}) {
  const isGiveOnly = distributionMode === 'give_only';

  // Calculate totals with currency normalization
  const stats = transactions.reduce((acc, t) => {
    const normalizedAmount = t.currency === baseCurrency 
      ? t.amount 
      : t.amount * (t.exchange_rate_to_base || 1);
    
    const giveAmount = normalizedAmount * ((t.give_percentage || 100) / 100);
    const lendAmount = isGiveOnly ? 0 : normalizedAmount * ((t.lend_percentage || 0) / 100);
    
    return {
      totalGiven: acc.totalGiven + giveAmount,
      totalLent: acc.totalLent + lendAmount,
      transactionCount: acc.transactionCount + 1
    };
  }, { totalGiven: 0, totalLent: 0, transactionCount: 0 });

  const totalBalance = stats.totalGiven + stats.totalLent;
  const symbol = getCurrencySymbol(baseCurrency);

  const formatAmount = (amount) => {
    return amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <div 
      data-testid="dashboard-stats" 
      className={`grid gap-4 ${isGiveOnly ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}
    >
      {/* Total Balance */}
      <div 
        data-testid="stat-total-balance"
        className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-6 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#68706B]">
            Total Balance
          </span>
          <div className="p-2 bg-[#1E3F32]/10 rounded-xl">
            <Wallet className="w-5 h-5 text-[#1E3F32]" />
          </div>
        </div>
        <p 
          data-testid="total-balance-amount"
          className="text-3xl font-black text-[#181C1A]"
        >
          {symbol}{formatAmount(totalBalance)}
        </p>
        <p className="text-sm text-[#68706B] mt-1">
          {stats.transactionCount} transaction{stats.transactionCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Total Given */}
      <div 
        data-testid="stat-total-given"
        className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-6 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#68706B]">
            Total Given
          </span>
          <div className="p-2 bg-[#1E3F32]/10 rounded-xl">
            <TrendingUp className="w-5 h-5 text-[#1E3F32]" />
          </div>
        </div>
        <p 
          data-testid="total-given-amount"
          className="text-3xl font-black text-[#1E3F32]"
        >
          {symbol}{formatAmount(stats.totalGiven)}
        </p>
        <p className="text-sm text-[#68706B] mt-1">
          Charitable contributions
        </p>
      </div>

      {/* Total Lent - Only show if not give_only mode */}
      {!isGiveOnly && (
        <div 
          data-testid="stat-total-lent"
          className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-6 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#68706B]">
              Total Owed
            </span>
            <div className="p-2 bg-[#C2574A]/10 rounded-xl">
              <HandCoins className="w-5 h-5 text-[#C2574A]" />
            </div>
          </div>
          <p 
            data-testid="total-lent-amount"
            className="text-3xl font-black text-[#C2574A]"
          >
            {symbol}{formatAmount(stats.totalLent)}
          </p>
          <p className="text-sm text-[#68706B] mt-1">
            Outstanding loans
          </p>
        </div>
      )}

      {/* Average Transaction */}
      {!isGiveOnly && (
        <div 
          data-testid="stat-average"
          className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-6 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#68706B]">
              Average
            </span>
            <div className="p-2 bg-[#4A6E82]/10 rounded-xl">
              <TrendingDown className="w-5 h-5 text-[#4A6E82]" />
            </div>
          </div>
          <p 
            data-testid="average-amount"
            className="text-3xl font-black text-[#4A6E82]"
          >
            {symbol}{formatAmount(stats.transactionCount > 0 ? totalBalance / stats.transactionCount : 0)}
          </p>
          <p className="text-sm text-[#68706B] mt-1">
            Per transaction
          </p>
        </div>
      )}
    </div>
  );
}
