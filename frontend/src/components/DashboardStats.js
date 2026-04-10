import { getCurrencySymbol } from '../lib/validation';
import { TrendingUp, Wallet, HandCoins, Heart, PiggyBank } from 'lucide-react';

export function DashboardStats({ stats, balances, baseCurrency, distributionMode }) {
  const isGiveOnly = distributionMode === 'give_only';
  const symbol = getCurrencySymbol(baseCurrency);
  const fmt = (n) => Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let cards;

  if (isGiveOnly) {
    // give_only: Income | Maaser Balance | Given
    const bal = balances.maaserBalance ?? 0;
    cards = [
      { label: 'Income', value: stats.totalIncome, icon: TrendingUp, color: 'text-emerald-600', iconColor: 'text-emerald-500', testId: 'total-income-amount' },
      { label: 'Maaser Owed', value: Math.abs(bal), icon: PiggyBank, color: bal >= 0 ? 'text-amber-600' : 'text-red-600', iconColor: bal >= 0 ? 'text-amber-500' : 'text-red-500', testId: 'maaser-balance-amount', prefix: bal < 0 ? '-' : '', borderClass: bal < 0 ? 'border-red-300' : '' },
      { label: 'Given', value: stats.totalGiven, icon: Heart, color: 'text-blue-600', iconColor: 'text-blue-500', testId: 'total-given-amount' },
    ];
  } else {
    // give+lend: Income | Give Balance | Lend Balance | Given | Lent
    const gBal = balances.giveBalance ?? 0;
    const lBal = balances.lendBalance ?? 0;
    cards = [
      { label: 'Income', value: stats.totalIncome, icon: TrendingUp, color: 'text-emerald-600', iconColor: 'text-emerald-500', testId: 'total-income-amount' },
      { label: 'Give Owed', value: Math.abs(gBal), icon: Heart, color: gBal >= 0 ? 'text-blue-600' : 'text-red-600', iconColor: gBal >= 0 ? 'text-blue-500' : 'text-red-500', testId: 'give-balance-amount', prefix: gBal < 0 ? '-' : '', borderClass: gBal < 0 ? 'border-red-300' : '' },
      { label: 'Lend Owed', value: Math.abs(lBal), icon: HandCoins, color: lBal >= 0 ? 'text-rose-600' : 'text-red-600', iconColor: lBal >= 0 ? 'text-rose-500' : 'text-red-500', testId: 'lend-balance-amount', prefix: lBal < 0 ? '-' : '', borderClass: lBal < 0 ? 'border-red-300' : '' },
      { label: 'Given', value: stats.totalGiven, icon: Heart, color: 'text-blue-600', iconColor: 'text-blue-500', testId: 'total-given-amount' },
      { label: 'Lent', value: stats.totalLent, icon: HandCoins, color: 'text-rose-600', iconColor: 'text-rose-500', testId: 'total-lent-amount' },
    ];
  }

  return (
    <div data-testid="dashboard-stats" className="flex gap-3">
      {cards.map(({ label, value, icon: Icon, color, iconColor, testId, prefix, borderClass }) => (
        <div key={label} className={`flex-1 min-w-0 bg-white/80 backdrop-blur-sm rounded-xl p-3 border ${borderClass || 'border-slate-200/80'} shadow-sm`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <p data-testid={testId} className={`text-lg font-bold ${color} truncate`}>
            {prefix || ''}{symbol}{fmt(value)}
          </p>
        </div>
      ))}
    </div>
  );
}
