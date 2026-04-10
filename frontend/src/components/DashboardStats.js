import { getCurrencySymbol } from '../lib/validation';
import { TrendingUp, Wallet, HandCoins, Heart, PiggyBank } from 'lucide-react';

export function DashboardStats({ stats, maaserBalance, baseCurrency, distributionMode }) {
  const isGiveOnly = distributionMode === 'give_only';
  const symbol = getCurrencySymbol(baseCurrency);
  const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const cards = [
    { label: 'Income', value: stats.totalIncome, icon: TrendingUp, color: 'text-emerald-600', iconColor: 'text-emerald-500', testId: 'total-income-amount' },
    { label: 'Maaser', value: stats.totalMaaserOwed, icon: PiggyBank, color: 'text-amber-600', iconColor: 'text-amber-500', testId: 'maaser-owed-amount' },
    { label: 'Balance', value: Math.abs(maaserBalance), icon: Wallet, color: maaserBalance >= 0 ? 'text-blue-600' : 'text-red-600', iconColor: maaserBalance >= 0 ? 'text-blue-500' : 'text-red-500', testId: 'maaser-balance-amount', prefix: maaserBalance < 0 ? '-' : '', borderClass: maaserBalance < 0 ? 'border-red-300' : 'border-slate-200/80' },
    { label: 'Given', value: stats.totalGiven, icon: Heart, color: 'text-blue-600', iconColor: 'text-blue-500', testId: 'total-given-amount' },
    ...(!isGiveOnly ? [{ label: 'Lent', value: stats.totalLent, icon: HandCoins, color: 'text-rose-600', iconColor: 'text-rose-500', testId: 'total-lent-amount' }] : [])
  ];

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
