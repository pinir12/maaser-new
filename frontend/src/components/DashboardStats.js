'use client';

import { getCurrencySymbol } from '../lib/validation';
import { HandCoins, Heart, PiggyBank } from 'lucide-react';

function Skeleton() {
  return <div className="h-7 w-24 bg-slate-200 rounded-md animate-pulse" />;
}

export function DashboardStats({ balances, baseCurrency, distributionMode, loading }) {
  const isGiveOnly = distributionMode === 'give_only';
  const symbol = getCurrencySymbol(baseCurrency);
  const fmt = (n) => Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (isGiveOnly) {
    const bal = balances.maaserBalance ?? 0;
    return (
      <div data-testid="dashboard-stats" className="flex gap-3">
        <div className={`w-48 sm:w-56 bg-white/80 backdrop-blur-sm rounded-xl p-4 border ${!loading && bal < 0 ? 'border-red-300' : 'border-slate-200/80'} shadow-sm`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Maaser Balance</span>
            <PiggyBank className={`w-5 h-5 ${loading ? 'text-slate-300' : bal >= 0 ? 'text-amber-500' : 'text-red-500'}`} />
          </div>
          {loading ? <Skeleton /> : (
            <p data-testid="maaser-balance-amount" className={`text-2xl font-bold ${bal >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
              {bal < 0 ? '-' : ''}{symbol}{fmt(bal)}
            </p>
          )}
        </div>
      </div>
    );
  }

  const gBal = balances.giveBalance ?? 0;
  const lBal = balances.lendBalance ?? 0;

  return (
    <div data-testid="dashboard-stats" className="flex gap-3">
      <div className={`w-44 sm:w-52 bg-white/80 backdrop-blur-sm rounded-xl p-4 border ${!loading && gBal < 0 ? 'border-red-300' : 'border-slate-200/80'} shadow-sm`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Give Balance</span>
          <Heart className={`w-5 h-5 ${loading ? 'text-slate-300' : gBal >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
        </div>
        {loading ? <Skeleton /> : (
          <p data-testid="give-balance-amount" className={`text-2xl font-bold ${gBal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {gBal < 0 ? '-' : ''}{symbol}{fmt(gBal)}
          </p>
        )}
      </div>
      <div className={`w-44 sm:w-52 bg-white/80 backdrop-blur-sm rounded-xl p-4 border ${!loading && lBal < 0 ? 'border-red-300' : 'border-slate-200/80'} shadow-sm`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Lend Balance</span>
          <HandCoins className={`w-5 h-5 ${loading ? 'text-slate-300' : lBal >= 0 ? 'text-violet-500' : 'text-red-500'}`} />
        </div>
        {loading ? <Skeleton /> : (
          <p data-testid="lend-balance-amount" className={`text-2xl font-bold ${lBal >= 0 ? 'text-violet-600' : 'text-red-600'}`}>
            {lBal < 0 ? '-' : ''}{symbol}{fmt(lBal)}
          </p>
        )}
      </div>
    </div>
  );
}
