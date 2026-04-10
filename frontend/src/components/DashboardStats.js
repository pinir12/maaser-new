import { getCurrencySymbol, TRANSACTION_TYPES } from '../lib/validation';
import { TrendingUp, TrendingDown, Wallet, HandCoins, Heart, PiggyBank } from 'lucide-react';

export function DashboardStats({ 
  transactions, 
  baseCurrency, 
  distributionMode 
}) {
  const isGiveOnly = distributionMode === 'give_only';

  // Calculate totals with currency normalization, separated by type
  const stats = transactions.reduce((acc, t) => {
    const normalizedAmount = t.currency === baseCurrency 
      ? t.amount 
      : t.amount * (t.exchange_rate_to_base || 1);
    
    if (t.type === TRANSACTION_TYPES.INCOME) {
      const maaserAmount = normalizedAmount * ((t.maaser_percentage || 10) / 100);
      return {
        ...acc,
        totalIncome: acc.totalIncome + normalizedAmount,
        totalMaaserOwed: acc.totalMaaserOwed + maaserAmount,
        incomeCount: acc.incomeCount + 1
      };
    } else if (t.type === TRANSACTION_TYPES.GIVE) {
      return {
        ...acc,
        totalGiven: acc.totalGiven + normalizedAmount,
        giveCount: acc.giveCount + 1
      };
    } else if (t.type === TRANSACTION_TYPES.LEND) {
      return {
        ...acc,
        totalLent: acc.totalLent + normalizedAmount,
        lendCount: acc.lendCount + 1
      };
    }
    return acc;
  }, { 
    totalIncome: 0, 
    totalMaaserOwed: 0, 
    totalGiven: 0, 
    totalLent: 0,
    incomeCount: 0,
    giveCount: 0,
    lendCount: 0
  });

  // Calculate maaser balance (what's left to distribute)
  const maaserDistributed = stats.totalGiven + (isGiveOnly ? 0 : stats.totalLent);
  const maaserBalance = stats.totalMaaserOwed - maaserDistributed;

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
      className="space-y-4"
    >
      {/* Top Row - Income & Maaser */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Income */}
        <div 
          data-testid="stat-total-income"
          className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-6 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#68706B]">
              Total Income
            </span>
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p 
            data-testid="total-income-amount"
            className="text-3xl font-black text-emerald-600"
          >
            {symbol}{formatAmount(stats.totalIncome)}
          </p>
          <p className="text-sm text-[#68706B] mt-1">
            {stats.incomeCount} income{stats.incomeCount !== 1 ? 's' : ''} recorded
          </p>
        </div>

        {/* Maaser Owed */}
        <div 
          data-testid="stat-maaser-owed"
          className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-6 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#68706B]">
              Maaser Owed
            </span>
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <PiggyBank className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p 
            data-testid="maaser-owed-amount"
            className="text-3xl font-black text-amber-600"
          >
            {symbol}{formatAmount(stats.totalMaaserOwed)}
          </p>
          <p className="text-sm text-[#68706B] mt-1">
            10% of income (default)
          </p>
        </div>

        {/* Maaser Balance */}
        <div 
          data-testid="stat-maaser-balance"
          className={`bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-6 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg ${maaserBalance < 0 ? 'border-red-300' : ''}`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#68706B]">
              Maaser Balance
            </span>
            <div className={`p-2 rounded-xl ${maaserBalance >= 0 ? 'bg-[#1E3F32]/10' : 'bg-red-500/10'}`}>
              <Wallet className={`w-5 h-5 ${maaserBalance >= 0 ? 'text-[#1E3F32]' : 'text-red-500'}`} />
            </div>
          </div>
          <p 
            data-testid="maaser-balance-amount"
            className={`text-3xl font-black ${maaserBalance >= 0 ? 'text-[#1E3F32]' : 'text-red-500'}`}
          >
            {symbol}{formatAmount(Math.abs(maaserBalance))}
          </p>
          <p className="text-sm text-[#68706B] mt-1">
            {maaserBalance >= 0 ? 'Left to distribute' : 'Over-distributed!'}
          </p>
        </div>
      </div>

      {/* Bottom Row - Give & Lend */}
      <div className={`grid gap-4 ${isGiveOnly ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
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
              <Heart className="w-5 h-5 text-[#1E3F32]" />
            </div>
          </div>
          <p 
            data-testid="total-given-amount"
            className="text-3xl font-black text-[#1E3F32]"
          >
            {symbol}{formatAmount(stats.totalGiven)}
          </p>
          <p className="text-sm text-[#68706B] mt-1">
            {stats.giveCount} donation{stats.giveCount !== 1 ? 's' : ''} • Charitable contributions
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
                Total Lent
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
              {stats.lendCount} loan{stats.lendCount !== 1 ? 's' : ''} • Outstanding loans
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
