import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { getCurrencySymbol, TRANSACTION_TYPES } from '../lib/validation';
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

const COLORS = {
  income: '#10b981',
  maaser: '#f59e0b',
  given: '#1E3F32',
  lent: '#C2574A',
  balance: '#4A6E82'
};

export function AnalyticsCharts({ transactions, baseCurrency, distributionMode }) {
  const [chartType, setChartType] = useState('area'); // area, bar, pie
  const isGiveOnly = distributionMode === 'give_only';
  const symbol = getCurrencySymbol(baseCurrency);

  // Process transactions into monthly data
  const monthlyData = useMemo(() => {
    const monthMap = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          month: monthLabel,
          monthKey,
          income: 0,
          maaser: 0,
          given: 0,
          lent: 0
        };
      }
      
      const normalizedAmount = t.currency === baseCurrency 
        ? t.amount 
        : t.amount * (t.exchange_rate_to_base || 1);
      
      if (t.type === TRANSACTION_TYPES.INCOME) {
        monthMap[monthKey].income += normalizedAmount;
        monthMap[monthKey].maaser += normalizedAmount * ((t.maaser_percentage || 10) / 100);
      } else if (t.type === TRANSACTION_TYPES.GIVE) {
        monthMap[monthKey].given += normalizedAmount;
      } else if (t.type === TRANSACTION_TYPES.LEND) {
        monthMap[monthKey].lent += normalizedAmount;
      }
    });
    
    // Sort by date and return array
    return Object.values(monthMap)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .slice(-12); // Last 12 months
  }, [transactions, baseCurrency]);

  // Calculate totals for pie chart
  const pieData = useMemo(() => {
    const totals = transactions.reduce((acc, t) => {
      const normalizedAmount = t.currency === baseCurrency 
        ? t.amount 
        : t.amount * (t.exchange_rate_to_base || 1);
      
      if (t.type === TRANSACTION_TYPES.GIVE) {
        acc.given += normalizedAmount;
      } else if (t.type === TRANSACTION_TYPES.LEND && !isGiveOnly) {
        acc.lent += normalizedAmount;
      }
      return acc;
    }, { given: 0, lent: 0 });

    const data = [
      { name: 'Given', value: totals.given, color: COLORS.given }
    ];
    
    if (!isGiveOnly && totals.lent > 0) {
      data.push({ name: 'Lent', value: totals.lent, color: COLORS.lent });
    }
    
    return data;
  }, [transactions, baseCurrency, isGiveOnly]);

  const formatCurrency = (value) => {
    return `${symbol}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-xl border border-white/40 rounded-xl p-3 shadow-lg">
          <p className="font-semibold text-[#181C1A] mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (monthlyData.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-6 text-center">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-[#68706B] opacity-50" />
        <p className="text-[#68706B]">Add transactions to see analytics</p>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-[#181C1A]">Analytics</h3>
        
        {/* Chart Type Toggle */}
        <div className="flex gap-1 bg-white/50 rounded-xl p-1">
          <button
            data-testid="chart-type-area"
            onClick={() => setChartType('area')}
            className={`p-2 rounded-lg transition-all ${
              chartType === 'area' 
                ? 'bg-[#1E3F32] text-white' 
                : 'text-[#68706B] hover:bg-white/50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
          </button>
          <button
            data-testid="chart-type-bar"
            onClick={() => setChartType('bar')}
            className={`p-2 rounded-lg transition-all ${
              chartType === 'bar' 
                ? 'bg-[#1E3F32] text-white' 
                : 'text-[#68706B] hover:bg-white/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            data-testid="chart-type-pie"
            onClick={() => setChartType('pie')}
            className={`p-2 rounded-lg transition-all ${
              chartType === 'pie' 
                ? 'bg-[#1E3F32] text-white' 
                : 'text-[#68706B] hover:bg-white/50'
            }`}
          >
            <PieChartIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="h-80">
        {chartType === 'area' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.income} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.income} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMaaser" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.maaser} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.maaser} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorGiven" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.given} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.given} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#68706B', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fill: '#68706B', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={formatCurrency}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="income" 
                name="Income"
                stroke={COLORS.income} 
                fillOpacity={1} 
                fill="url(#colorIncome)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="maaser" 
                name="Maaser"
                stroke={COLORS.maaser} 
                fillOpacity={1} 
                fill="url(#colorMaaser)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="given" 
                name="Given"
                stroke={COLORS.given} 
                fillOpacity={1} 
                fill="url(#colorGiven)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {chartType === 'bar' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#68706B', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fill: '#68706B', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={formatCurrency}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="income" name="Income" fill={COLORS.income} radius={[4, 4, 0, 0]} />
              <Bar dataKey="maaser" name="Maaser" fill={COLORS.maaser} radius={[4, 4, 0, 0]} />
              <Bar dataKey="given" name="Given" fill={COLORS.given} radius={[4, 4, 0, 0]} />
              {!isGiveOnly && (
                <Bar dataKey="lent" name="Lent" fill={COLORS.lent} radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === 'pie' && (
          <div className="flex items-center justify-center h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${formatCurrency(value)} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Summary below chart */}
      <div className="mt-6 pt-4 border-t border-white/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-[#68706B] uppercase tracking-wider">Avg Monthly Income</p>
            <p className="text-lg font-bold text-emerald-600">
              {formatCurrency(monthlyData.reduce((sum, m) => sum + m.income, 0) / Math.max(monthlyData.length, 1))}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#68706B] uppercase tracking-wider">Avg Monthly Maaser</p>
            <p className="text-lg font-bold text-amber-600">
              {formatCurrency(monthlyData.reduce((sum, m) => sum + m.maaser, 0) / Math.max(monthlyData.length, 1))}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#68706B] uppercase tracking-wider">Avg Monthly Given</p>
            <p className="text-lg font-bold text-[#1E3F32]">
              {formatCurrency(monthlyData.reduce((sum, m) => sum + m.given, 0) / Math.max(monthlyData.length, 1))}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#68706B] uppercase tracking-wider">Total Months</p>
            <p className="text-lg font-bold text-[#4A6E82]">
              {monthlyData.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
