'use client';

import { TrendingUp, TrendingDown, Minus, Lightbulb } from 'lucide-react';

function pctChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function TrendBadge({ value, invert = false }) {
  if (Math.abs(value) < 0.5) return <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-400 font-medium"><Minus className="w-3 h-3" />steady</span>;
  const up = value > 0;
  const positive = invert ? !up : up;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(value).toFixed(0)}%
    </span>
  );
}

export function Insights({ currentStats, previousStats, isGiveOnly, periodLabel, hasCurrentData, hasPreviousData, isAllTime }) {
  if (isAllTime) return null;
  if (!hasPreviousData && !hasCurrentData) return null;
  if (!hasPreviousData) return null; // first period — nothing to compare

  const insights = [];

  const cur = currentStats;
  const prev = previousStats;

  // Income insight
  if (prev.totalIncome > 0 || cur.totalIncome > 0) {
    const change = pctChange(cur.totalIncome, prev.totalIncome);
    if (!hasCurrentData) {
      insights.push({ text: `No income recorded yet this ${periodLabel.toLowerCase()}`, trend: null, key: 'income-quiet' });
    } else if (prev.totalIncome === 0) {
      insights.push({ text: `First ${periodLabel.toLowerCase()} with income tracked`, trend: null, key: 'income-first' });
    } else {
      const dir = change > 1 ? 'up' : change < -1 ? 'down' : 'steady';
      const msg = dir === 'up' ? `Income is up vs last ${periodLabel.toLowerCase()}`
        : dir === 'down' ? `Income is down vs last ${periodLabel.toLowerCase()}`
        : `Income is holding steady`;
      insights.push({ text: msg, trend: <TrendBadge value={change} />, key: 'income' });
    }
  }

  // Giving insight
  if (prev.totalGiven > 0 || cur.totalGiven > 0) {
    const change = pctChange(cur.totalGiven, prev.totalGiven);
    if (hasCurrentData && cur.totalGiven > 0 && prev.totalGiven > 0) {
      const dir = change > 1 ? 'up' : change < -1 ? 'down' : 'steady';
      const msg = dir === 'up' ? 'Giving has increased'
        : dir === 'down' ? 'Giving has decreased'
        : 'Giving is consistent';
      insights.push({ text: msg, trend: <TrendBadge value={change} />, key: 'give' });
    } else if (hasCurrentData && cur.totalGiven > 0 && prev.totalGiven === 0) {
      insights.push({ text: 'Started giving this period', trend: null, key: 'give-new' });
    } else if (hasCurrentData && cur.totalGiven === 0 && prev.totalGiven > 0) {
      insights.push({ text: `No giving yet — last ${periodLabel.toLowerCase()} you gave`, trend: null, key: 'give-none' });
    }
  }

  // Lending insight (give+lend mode only)
  if (!isGiveOnly && (prev.totalLent > 0 || cur.totalLent > 0)) {
    const change = pctChange(cur.totalLent, prev.totalLent);
    if (hasCurrentData && cur.totalLent > 0 && prev.totalLent > 0) {
      const dir = change > 1 ? 'up' : change < -1 ? 'down' : 'steady';
      const msg = dir === 'up' ? 'Lending has increased'
        : dir === 'down' ? 'Lending has decreased'
        : 'Lending is consistent';
      insights.push({ text: msg, trend: <TrendBadge value={change} />, key: 'lend' });
    } else if (hasCurrentData && cur.totalLent > 0 && prev.totalLent === 0) {
      insights.push({ text: 'Started lending this period', trend: null, key: 'lend-new' });
    }
  }

  // Maaser fulfillment insight
  if (hasCurrentData && cur.totalMaaser > 0) {
    const fulfilled = ((cur.totalGiven + (isGiveOnly ? 0 : cur.totalLent)) / cur.totalMaaser) * 100;
    if (fulfilled >= 100) {
      insights.push({ text: `Maaser fully covered this ${periodLabel.toLowerCase()}`, trend: null, key: 'maaser-done' });
    } else if (fulfilled >= 50) {
      insights.push({ text: `${fulfilled.toFixed(0)}% of this ${periodLabel.toLowerCase()}'s maaser distributed`, trend: null, key: 'maaser-partial' });
    }
  }

  // Quiet period fallback
  if (!hasCurrentData && hasPreviousData) {
    insights.push({ text: `Quiet ${periodLabel.toLowerCase()} so far — last ${periodLabel.toLowerCase()} had activity`, trend: null, key: 'quiet' });
  }

  if (insights.length === 0) return null;

  return (
    <div data-testid="insights-panel" className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-sm px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Insights</p>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {insights.map(i => (
          <div key={i.key} className="flex items-center gap-2 text-sm text-slate-600">
            <span>{i.text}</span>
            {i.trend}
          </div>
        ))}
      </div>
    </div>
  );
}
