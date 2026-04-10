import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { getCurrencySymbol, TRANSACTION_TYPES } from '../lib/validation';
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

const COLORS = { income: '#10b981', maaser: '#f59e0b', given: '#3b82f6', lent: '#f43f5e' };

export function AnalyticsCharts({ transactions, baseCurrency, distributionMode }) {
  const [chartType, setChartType] = useState('area');
  const isGiveOnly = distributionMode === 'give_only';
  const symbol = getCurrencySymbol(baseCurrency);

  const monthlyData = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!map[key]) map[key] = { month: label, key, income: 0, maaser: 0, given: 0, lent: 0 };
      const norm = t.currency === baseCurrency ? t.amount : t.amount * (t.exchange_rate_to_base || 1);
      if (t.type === TRANSACTION_TYPES.INCOME) {
        map[key].income += norm;
        map[key].maaser += norm * ((t.maaser_percentage || 10) / 100);
      } else if (t.type === TRANSACTION_TYPES.GIVE) map[key].given += norm;
      else if (t.type === TRANSACTION_TYPES.LEND) map[key].lent += norm;
    });
    return Object.values(map).sort((a, b) => a.key.localeCompare(b.key)).slice(-12);
  }, [transactions, baseCurrency]);

  const pieData = useMemo(() => {
    const totals = transactions.reduce((acc, t) => {
      const norm = t.currency === baseCurrency ? t.amount : t.amount * (t.exchange_rate_to_base || 1);
      if (t.type === TRANSACTION_TYPES.GIVE) acc.given += norm;
      else if (t.type === TRANSACTION_TYPES.LEND && !isGiveOnly) acc.lent += norm;
      return acc;
    }, { given: 0, lent: 0 });
    const data = [{ name: 'Given', value: totals.given, color: COLORS.given }];
    if (!isGiveOnly && totals.lent > 0) data.push({ name: 'Lent', value: totals.lent, color: COLORS.lent });
    return data;
  }, [transactions, baseCurrency, isGiveOnly]);

  const fmt = (v) => `${symbol}${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-lg text-sm">
        <p className="font-medium text-slate-900 mb-1">{label}</p>
        {payload.map((e, i) => <p key={i} style={{ color: e.color }}>{e.name}: {fmt(e.value)}</p>)}
      </div>
    );
  };

  if (monthlyData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p className="text-slate-500">Add transactions to see analytics</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Analytics</h3>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {[{ type: 'area', Icon: TrendingUp }, { type: 'bar', Icon: BarChart3 }, { type: 'pie', Icon: PieChartIcon }].map(({ type, Icon }) => (
            <button
              key={type}
              data-testid={`chart-type-${type}`}
              onClick={() => setChartType(type)}
              className={`p-2 rounded-md transition-colors ${chartType === type ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        {chartType === 'area' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="cIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.income} stopOpacity={0.3}/><stop offset="95%" stopColor={COLORS.income} stopOpacity={0}/></linearGradient>
                <linearGradient id="cMaaser" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.maaser} stopOpacity={0.3}/><stop offset="95%" stopColor={COLORS.maaser} stopOpacity={0}/></linearGradient>
                <linearGradient id="cGiven" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.given} stopOpacity={0.3}/><stop offset="95%" stopColor={COLORS.given} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={fmt} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="income" name="Income" stroke={COLORS.income} fillOpacity={1} fill="url(#cIncome)" strokeWidth={2} />
              <Area type="monotone" dataKey="maaser" name="Maaser" stroke={COLORS.maaser} fillOpacity={1} fill="url(#cMaaser)" strokeWidth={2} />
              <Area type="monotone" dataKey="given" name="Given" stroke={COLORS.given} fillOpacity={1} fill="url(#cGiven)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
        {chartType === 'bar' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={fmt} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="income" name="Income" fill={COLORS.income} radius={[4, 4, 0, 0]} />
              <Bar dataKey="maaser" name="Maaser" fill={COLORS.maaser} radius={[4, 4, 0, 0]} />
              <Bar dataKey="given" name="Given" fill={COLORS.given} radius={[4, 4, 0, 0]} />
              {!isGiveOnly && <Bar dataKey="lent" name="Lent" fill={COLORS.lent} radius={[4, 4, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        )}
        {chartType === 'pie' && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, value, percent }) => `${name}: ${fmt(value)} (${(percent * 100).toFixed(0)}%)`} outerRadius={80} dataKey="value">
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-4 gap-4 text-center text-sm">
        <div><p className="text-slate-500">Avg Income</p><p className="font-bold text-emerald-600">{fmt(monthlyData.reduce((s, m) => s + m.income, 0) / Math.max(monthlyData.length, 1))}</p></div>
        <div><p className="text-slate-500">Avg Maaser</p><p className="font-bold text-amber-600">{fmt(monthlyData.reduce((s, m) => s + m.maaser, 0) / Math.max(monthlyData.length, 1))}</p></div>
        <div><p className="text-slate-500">Avg Given</p><p className="font-bold text-blue-600">{fmt(monthlyData.reduce((s, m) => s + m.given, 0) / Math.max(monthlyData.length, 1))}</p></div>
        <div><p className="text-slate-500">Months</p><p className="font-bold text-slate-900">{monthlyData.length}</p></div>
      </div>
    </div>
  );
}
