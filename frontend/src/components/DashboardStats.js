import { getCurrencySymbol } from '../lib/validation';
import { TrendingUp, Wallet, HandCoins, Heart, PiggyBank } from 'lucide-react';

export function DashboardStats({ stats, maaserBalance, baseCurrency, distributionMode }) {
  const isGiveOnly = distributionMode === 'give_only';
  const symbol = getCurrencySymbol(baseCurrency);
  const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div data-testid="dashboard-stats" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-500">Income</span>
          <TrendingUp className="w-4 h-4 text-emerald-500" />
        </div>
        <p data-testid="total-income-amount" className="text-xl font-bold text-emerald-600">{symbol}{fmt(stats.totalIncome)}</p>
      </div>

      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-500">Maaser</span>
          <PiggyBank className="w-4 h-4 text-amber-500" />
        </div>
        <p data-testid="maaser-owed-amount" className="text-xl font-bold text-amber-600">{symbol}{fmt(stats.totalMaaserOwed)}</p>
      </div>

      <div className={`bg-white rounded-xl p-3 border shadow-sm ${maaserBalance < 0 ? 'border-red-300' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-500">Balance</span>
          <Wallet className={`w-4 h-4 ${maaserBalance >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
        </div>
        <p data-testid="maaser-balance-amount" className={`text-xl font-bold ${maaserBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
          {maaserBalance < 0 && '-'}{symbol}{fmt(Math.abs(maaserBalance))}
        </p>
      </div>

      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-500">Given</span>
          <Heart className="w-4 h-4 text-blue-500" />
        </div>
        <p data-testid="total-given-amount" className="text-xl font-bold text-blue-600">{symbol}{fmt(stats.totalGiven)}</p>
      </div>

      {!isGiveOnly && (
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500">Lent</span>
            <HandCoins className="w-4 h-4 text-rose-500" />
          </div>
          <p data-testid="total-lent-amount" className="text-xl font-bold text-rose-600">{symbol}{fmt(stats.totalLent)}</p>
        </div>
      )}
    </div>
  );
}
