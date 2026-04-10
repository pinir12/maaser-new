import { getCurrencySymbol } from '../lib/validation';
import { TrendingUp, Wallet, HandCoins, Heart, PiggyBank } from 'lucide-react';

export function DashboardStats({ 
  stats,
  maaserBalance,
  baseCurrency, 
  distributionMode,
  isAllTime = false
}) {
  const isGiveOnly = distributionMode === 'give_only';
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
      className="space-y-2"
    >
      {isAllTime && (
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#68706B]">
          All-Time Totals
        </h2>
      )}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Income */}
        <div 
          data-testid="stat-total-income"
          className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-4 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#68706B]">
              Income
            </span>
            <div className="p-1.5 bg-emerald-500/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p 
            data-testid="total-income-amount"
            className="text-2xl font-black text-emerald-600"
          >
            {symbol}{formatAmount(stats.totalIncome)}
          </p>
          <p className="text-xs text-[#68706B] mt-1">
            {stats.incomeCount} record{stats.incomeCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Maaser Owed */}
        <div 
          data-testid="stat-maaser-owed"
          className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-4 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#68706B]">
              Maaser Owed
            </span>
            <div className="p-1.5 bg-amber-500/10 rounded-lg">
              <PiggyBank className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p 
            data-testid="maaser-owed-amount"
            className="text-2xl font-black text-amber-600"
          >
            {symbol}{formatAmount(stats.totalMaaserOwed)}
          </p>
          <p className="text-xs text-[#68706B] mt-1">
            10% default rate
          </p>
        </div>

        {/* Maaser Balance */}
        <div 
          data-testid="stat-maaser-balance"
          className={`bg-white/70 backdrop-blur-xl border rounded-2xl p-4 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg ${
            maaserBalance < 0 ? 'border-red-300' : 'border-white/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#68706B]">
              Balance
            </span>
            <div className={`p-1.5 rounded-lg ${maaserBalance >= 0 ? 'bg-[#1E3F32]/10' : 'bg-red-500/10'}`}>
              <Wallet className={`w-4 h-4 ${maaserBalance >= 0 ? 'text-[#1E3F32]' : 'text-red-500'}`} />
            </div>
          </div>
          <p 
            data-testid="maaser-balance-amount"
            className={`text-2xl font-black ${maaserBalance >= 0 ? 'text-[#1E3F32]' : 'text-red-500'}`}
          >
            {maaserBalance < 0 && '-'}{symbol}{formatAmount(Math.abs(maaserBalance))}
          </p>
          <p className="text-xs text-[#68706B] mt-1">
            {maaserBalance >= 0 ? 'To distribute' : 'Over-distributed'}
          </p>
        </div>

        {/* Total Given */}
        <div 
          data-testid="stat-total-given"
          className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-4 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#68706B]">
              Given
            </span>
            <div className="p-1.5 bg-[#1E3F32]/10 rounded-lg">
              <Heart className="w-4 h-4 text-[#1E3F32]" />
            </div>
          </div>
          <p 
            data-testid="total-given-amount"
            className="text-2xl font-black text-[#1E3F32]"
          >
            {symbol}{formatAmount(stats.totalGiven)}
          </p>
          <p className="text-xs text-[#68706B] mt-1">
            {stats.giveCount} donation{stats.giveCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Total Lent - Only show if not give_only mode */}
        {!isGiveOnly && (
          <div 
            data-testid="stat-total-lent"
            className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-4 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#68706B]">
                Lent
              </span>
              <div className="p-1.5 bg-[#C2574A]/10 rounded-lg">
                <HandCoins className="w-4 h-4 text-[#C2574A]" />
              </div>
            </div>
            <p 
              data-testid="total-lent-amount"
              className="text-2xl font-black text-[#C2574A]"
            >
              {symbol}{formatAmount(stats.totalLent)}
            </p>
            <p className="text-xs text-[#68706B] mt-1">
              {stats.lendCount} loan{stats.lendCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
