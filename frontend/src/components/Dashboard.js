'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { apiGetTransactions, apiGetTransactionTotals, apiCreateTransaction, apiUpdateTransaction, apiDeleteTransaction, apiProcessRecurring } from '../lib/api';
import { getCurrentHebrewMonth, getHebrewMonthBounds, getHebrewYearBounds } from '../lib/hebrew-calendar';
import { TRANSACTION_TYPES, getCurrencySymbol } from '../lib/validation';
import { ExportButtons } from '../lib/export';
import { DashboardStats } from './DashboardStats';
import { TransactionList } from './TransactionList';
import { AddTransactionModal } from './AddTransactionModal';
import { MonthlyViewToggle } from './MonthlyViewToggle';
import { SearchFilters } from './SearchFilters';
import { AnalyticsCharts } from './AnalyticsCharts';
import { SettingsModal } from './SettingsModal';
import { ContactModal } from './ContactModal';
import { AdminPanel } from './AdminPanel';
import { RecurringManager } from './RecurringManager';
import { Insights } from './Insights';
import { CSVImportModal } from './CSVImportModal';
import { Plus, Settings, LogOut, RefreshCw, BarChart3, Mail, Shield, Repeat, FileSpreadsheet } from 'lucide-react';

const VIEW_MODES = { ALL_TIME: 'all_time', YEAR: 'year', MONTH: 'month' };

// Timezone-safe: format Date to "YYYY-MM-DD" using local time
function dateToStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Get transaction date as "YYYY-MM-DD" string
function txnDateStr(t) {
  return (t.date || '').split('T')[0];
}

export function Dashboard() {
  const { user, signOut, updateUser } = useAuth();
  const [allTransactions, setAllTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [processingRecurring, setProcessingRecurring] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [serverTotals, setServerTotals] = useState(null);
  const [serverPeriodTotals, setServerPeriodTotals] = useState(null);

  const [viewMode, setViewMode] = useState(user?.default_view || VIEW_MODES.MONTH);
  const [useHebrewDates, setUseHebrewDates] = useState(user?.use_hebrew_calendar || false);

  const currentHebrew = getCurrentHebrewMonth();
  const currentGregorian = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    useHebrewDates ? currentHebrew.month : currentGregorian.getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(
    useHebrewDates ? currentHebrew.year : currentGregorian.getFullYear()
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    types: [], dateFrom: '', dateTo: '', amountMin: '', amountMax: '', isRecurring: null, recipient: ''
  });

  useEffect(() => {
    if (user) {
      setViewMode(user.default_view || VIEW_MODES.MONTH);
      setUseHebrewDates(user.use_hebrew_calendar || false);
    }
  }, [user?.default_view, user?.use_hebrew_calendar]);

  // --- Stats from server-side totals (always accurate, regardless of pagination) ---
  const isGiveOnly = user?.distribution_mode === 'give_only';
  const giveRatio = (user?.give_ratio ?? 50) / 100;
  const lendRatio = (user?.lend_ratio ?? 50) / 100;

  const allTimeStats = useMemo(() => {
    if (serverTotals) return serverTotals;
    // Fallback to client-side calc while server totals load
    const baseCurrency = user?.base_currency || 'USD';
    return allTransactions.reduce((acc, t) => {
      const norm = t.currency === baseCurrency ? t.amount : t.amount * (t.exchange_rate_to_base || 1);
      if (t.type === TRANSACTION_TYPES.INCOME) {
        const maaser = norm * ((t.maaser_percentage || 10) / 100);
        return { ...acc, totalIncome: acc.totalIncome + norm, totalMaaser: acc.totalMaaser + maaser, incomeCount: acc.incomeCount + 1 };
      } else if (t.type === TRANSACTION_TYPES.GIVE) {
        return { ...acc, totalGiven: acc.totalGiven + norm, giveCount: acc.giveCount + 1 };
      } else if (t.type === TRANSACTION_TYPES.LEND) {
        return { ...acc, totalLent: acc.totalLent + norm, lendCount: acc.lendCount + 1 };
      }
      return acc;
    }, { totalIncome: 0, totalMaaser: 0, totalGiven: 0, totalLent: 0, incomeCount: 0, giveCount: 0, lendCount: 0 });
  }, [serverTotals, allTransactions, user?.base_currency]);

  // Balances depend on mode
  const balances = useMemo(() => {
    if (isGiveOnly) {
      // Single maaser balance: maaser - given
      return {
        maaserBalance: allTimeStats.totalMaaser - allTimeStats.totalGiven
      };
    }
    // give+lend mode: split maaser into give balance and lend balance
    return {
      giveBalance: (allTimeStats.totalMaaser * giveRatio) - allTimeStats.totalGiven,
      lendBalance: (allTimeStats.totalMaaser * lendRatio) - allTimeStats.totalLent
    };
  }, [allTimeStats, isGiveOnly, giveRatio, lendRatio]);

  const PAGE_SIZE = 50;

  const fetchAllTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [txnResult, totals] = await Promise.all([
        apiGetTransactions({ limit: PAGE_SIZE, offset: 0 }),
        apiGetTransactionTotals(user.base_currency || 'USD'),
      ]);
      setAllTransactions(txnResult.transactions || []);
      setHasMore(txnResult.hasMore || false);
      setServerTotals(totals);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const result = await apiGetTransactions({ limit: PAGE_SIZE, offset: allTransactions.length });
      setAllTransactions(prev => [...prev, ...(result.transactions || [])]);
      setHasMore(result.hasMore || false);
    } catch (error) {
      console.error('Error loading more:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, allTransactions.length]);

  // --- TIMEZONE-SAFE date filtering using string comparison ---
  useEffect(() => {
    let filtered = [...allTransactions];

    if (viewMode === VIEW_MODES.MONTH) {
      let startStr, endStr;
      if (useHebrewDates) {
        const bounds = getHebrewMonthBounds(selectedYear, selectedMonth);
        startStr = dateToStr(bounds.start);
        endStr = dateToStr(bounds.end);
      } else {
        startStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
        endStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      }
      filtered = filtered.filter(t => {
        const ds = txnDateStr(t);
        return ds >= startStr && ds <= endStr;
      });
    } else if (viewMode === VIEW_MODES.YEAR) {
      if (useHebrewDates) {
        const yearBounds = getHebrewYearBounds(selectedYear);
        const startStr = dateToStr(yearBounds.start);
        const endStr = dateToStr(yearBounds.end);
        filtered = filtered.filter(t => {
          const ds = txnDateStr(t);
          return ds >= startStr && ds <= endStr;
        });
      } else {
        const startStr = `${selectedYear}-01-01`;
        const endStr = `${selectedYear}-12-31`;
        filtered = filtered.filter(t => {
          const ds = txnDateStr(t);
          return ds >= startStr && ds <= endStr;
        });
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.description?.toLowerCase().includes(q) || t.recipient_name?.toLowerCase().includes(q));
    }
    if (filters.types.length > 0) filtered = filtered.filter(t => filters.types.includes(t.type));
    if (filters.dateFrom) filtered = filtered.filter(t => txnDateStr(t) >= filters.dateFrom);
    if (filters.dateTo) filtered = filtered.filter(t => txnDateStr(t) <= filters.dateTo);
    if (filters.amountMin) filtered = filtered.filter(t => t.amount >= Number(filters.amountMin));
    if (filters.amountMax) filtered = filtered.filter(t => t.amount <= Number(filters.amountMax));
    if (filters.isRecurring !== null) filtered = filtered.filter(t => t.is_recurring === filters.isRecurring);
    if (filters.recipient.trim()) filtered = filtered.filter(t => t.recipient_name?.toLowerCase().includes(filters.recipient.toLowerCase()));

    setFilteredTransactions(filtered);
  }, [allTransactions, viewMode, selectedMonth, selectedYear, useHebrewDates, searchQuery, filters]);

  useEffect(() => { fetchAllTransactions(); }, [fetchAllTransactions]);

  // Fetch period-specific totals from server whenever view/month/year changes
  const getDateBounds = useCallback(() => {
    if (viewMode === VIEW_MODES.ALL_TIME) return { dateFrom: null, dateTo: null };
    let startStr, endStr;
    if (viewMode === VIEW_MODES.MONTH) {
      if (useHebrewDates) {
        const bounds = getHebrewMonthBounds(selectedYear, selectedMonth);
        startStr = dateToStr(bounds.start);
        endStr = dateToStr(bounds.end);
      } else {
        startStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
        endStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      }
    } else {
      if (useHebrewDates) {
        const yearBounds = getHebrewYearBounds(selectedYear);
        startStr = dateToStr(yearBounds.start);
        endStr = dateToStr(yearBounds.end);
      } else {
        startStr = `${selectedYear}-01-01`;
        endStr = `${selectedYear}-12-31`;
      }
    }
    return { dateFrom: startStr, dateTo: endStr };
  }, [viewMode, selectedMonth, selectedYear, useHebrewDates]);

  useEffect(() => {
    if (!user) return;
    const { dateFrom, dateTo } = getDateBounds();
    if (!dateFrom) {
      // All time — use serverTotals
      setServerPeriodTotals(null);
      return;
    }
    apiGetTransactionTotals(user.base_currency || 'USD', dateFrom, dateTo)
      .then(setServerPeriodTotals)
      .catch(() => setServerPeriodTotals(null));
  }, [user, getDateBounds]);

  const refreshAfterChange = useCallback(async () => {
    await fetchAllTransactions();
    // Also refresh period totals
    const { dateFrom, dateTo } = getDateBounds();
    if (dateFrom) {
      apiGetTransactionTotals(user?.base_currency || 'USD', dateFrom, dateTo)
        .then(setServerPeriodTotals)
        .catch(() => {});
    }
  }, [fetchAllTransactions, getDateBounds, user?.base_currency]);

  const processRecurringTransactions = async () => {
    setProcessingRecurring(true);
    try {
      const result = await apiProcessRecurring();
      if (result.created > 0) {
        await refreshAfterChange();
        alert(`Created ${result.created} recurring transaction(s)`);
      } else {
        alert('No new recurring transactions');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setProcessingRecurring(false);
    }
  };

  const handleAddTransaction = async (data, editId) => {
    try {
      if (editId) {
        await apiUpdateTransaction(editId, data);
      } else {
        await apiCreateTransaction(data);
      }
      await refreshAfterChange();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await apiDeleteTransaction(id);
      await refreshAfterChange();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMonthChange = (month, year) => { setSelectedMonth(month); setSelectedYear(year); };

  const handleCalendarToggle = () => {
    const newVal = !useHebrewDates;
    setUseHebrewDates(newVal);
    if (newVal) {
      const heb = getCurrentHebrewMonth();
      setSelectedMonth(heb.month); setSelectedYear(heb.year);
    } else {
      const now = new Date();
      setSelectedMonth(now.getMonth() + 1); setSelectedYear(now.getFullYear());
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const periodStats = useMemo(() => {
    // Use server-computed period totals when available
    if (serverPeriodTotals) return serverPeriodTotals;
    // Fallback to client-side from loaded transactions
    const baseCurrency = user?.base_currency || 'USD';
    return filteredTransactions.reduce((acc, t) => {
      const norm = t.currency === baseCurrency ? t.amount : t.amount * (t.exchange_rate_to_base || 1);
      if (t.type === TRANSACTION_TYPES.INCOME) {
        const maaser = norm * ((t.maaser_percentage || 10) / 100);
        return { ...acc, totalIncome: acc.totalIncome + norm, totalMaaser: acc.totalMaaser + maaser };
      } else if (t.type === TRANSACTION_TYPES.GIVE) {
        return { ...acc, totalGiven: acc.totalGiven + norm };
      } else if (t.type === TRANSACTION_TYPES.LEND) {
        return { ...acc, totalLent: acc.totalLent + norm };
      }
      return acc;
    }, { totalIncome: 0, totalMaaser: 0, totalGiven: 0, totalLent: 0 });
  }, [serverPeriodTotals, filteredTransactions, user?.base_currency]);

  // Previous period stats for Insights comparison
  const previousPeriodStats = useMemo(() => {
    if (viewMode === VIEW_MODES.ALL_TIME) return null;
    const baseCurrency = user?.base_currency || 'USD';

    let startStr, endStr;
    if (viewMode === VIEW_MODES.MONTH) {
      let pm = selectedMonth - 1, py = selectedYear;
      if (useHebrewDates) {
        if (pm < 1) { pm = 13; py -= 1; }
        try {
          const bounds = getHebrewMonthBounds(py, pm);
          startStr = dateToStr(bounds.start);
          endStr = dateToStr(bounds.end);
        } catch { return null; }
      } else {
        if (pm < 1) { pm = 12; py -= 1; }
        startStr = `${py}-${String(pm).padStart(2, '0')}-01`;
        const lastDay = new Date(py, pm, 0).getDate();
        endStr = `${py}-${String(pm).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      }
    } else {
      const py = selectedYear - 1;
      if (useHebrewDates) {
        try {
          const bounds = getHebrewYearBounds(py);
          startStr = dateToStr(bounds.start);
          endStr = dateToStr(bounds.end);
        } catch { return null; }
      } else {
        startStr = `${py}-01-01`;
        endStr = `${py}-12-31`;
      }
    }

    return allTransactions.filter(t => {
      const ds = txnDateStr(t);
      return ds >= startStr && ds <= endStr;
    }).reduce((acc, t) => {
      const norm = t.currency === baseCurrency ? t.amount : t.amount * (t.exchange_rate_to_base || 1);
      if (t.type === TRANSACTION_TYPES.INCOME) {
        const maaser = norm * ((t.maaser_percentage || 10) / 100);
        return { ...acc, totalIncome: acc.totalIncome + norm, totalMaaser: acc.totalMaaser + maaser };
      } else if (t.type === TRANSACTION_TYPES.GIVE) {
        return { ...acc, totalGiven: acc.totalGiven + norm };
      } else if (t.type === TRANSACTION_TYPES.LEND) {
        return { ...acc, totalLent: acc.totalLent + norm };
      }
      return acc;
    }, { totalIncome: 0, totalMaaser: 0, totalGiven: 0, totalLent: 0 });
  }, [allTransactions, viewMode, selectedMonth, selectedYear, useHebrewDates, user?.base_currency]);

  if (showAdmin) return <AdminPanel onBack={() => setShowAdmin(false)} />;

  const sym = getCurrencySymbol(user?.base_currency || 'USD');

  return (
    <div data-testid="dashboard" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Maaser Tracker</h1>
          </div>
          <div className="flex items-center gap-1">
            <button data-testid="contact-btn" onClick={() => setShowContact(true)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Contact">
              <Mail className="w-[18px] h-[18px]" />
            </button>
            <button data-testid="recurring-manager-btn" onClick={() => setShowRecurring(!showRecurring)}
              className={`p-2 rounded-lg transition-all ${showRecurring ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} title="Recurring">
              <Repeat className="w-[18px] h-[18px]" />
            </button>
            <button data-testid="settings-btn" onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
              <Settings className="w-[18px] h-[18px]" />
            </button>
            {user?.is_admin && (
              <button data-testid="admin-btn" onClick={() => setShowAdmin(true)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Admin">
                <Shield className="w-[18px] h-[18px]" />
              </button>
            )}
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <button data-testid="logout-btn" onClick={signOut} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2">
            <button data-testid="add-transaction-btn" onClick={() => { setEditTransaction(null); setShowModal(true); }}
              className="flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30 active:translate-y-0">
              <Plus className="w-4 h-4" />Add Transaction
            </button>
            <button data-testid="csv-import-open-btn" onClick={() => setShowCSVImport(true)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 transition-all" title="Import from CSV">
              <FileSpreadsheet className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1">
            <DashboardStats
              balances={balances}
              baseCurrency={user?.base_currency || 'USD'}
              distributionMode={user?.distribution_mode || 'both'}
              loading={loading}
            />
          </div>
        </div>

        {showRecurring && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2"><Repeat className="w-4 h-4 text-blue-600" /><h3 className="font-semibold text-slate-900">Recurring Transactions</h3></div>
              <div className="flex items-center gap-2">
                <button data-testid="process-recurring-btn" onClick={processRecurringTransactions} disabled={processingRecurring}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${processingRecurring ? 'animate-spin' : ''}`} />Sync Now
                </button>
                <button onClick={() => setShowRecurring(false)} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Close</button>
              </div>
            </div>
            <div className="p-4"><RecurringManager baseCurrency={user?.base_currency || 'USD'} onBack={() => setShowRecurring(false)} /></div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white/80 backdrop-blur-sm rounded-full p-1 shadow-sm border border-slate-200/80">
            {[{ value: VIEW_MODES.ALL_TIME, label: 'All' }, { value: VIEW_MODES.YEAR, label: 'Year' }, { value: VIEW_MODES.MONTH, label: 'Month' }].map(({ value, label }) => (
              <button key={value} data-testid={`view-mode-${value}`} onClick={() => handleViewModeChange(value)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${viewMode === value ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                {label}
              </button>
            ))}
          </div>

          {viewMode !== VIEW_MODES.ALL_TIME && (
            <MonthlyViewToggle useHebrewDates={useHebrewDates} onToggle={handleCalendarToggle}
              selectedMonth={selectedMonth} selectedYear={selectedYear} onMonthChange={handleMonthChange}
              showMonthNav={viewMode === VIEW_MODES.MONTH} />
          )}

          <button data-testid="toggle-charts-btn" onClick={() => setShowCharts(!showCharts)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${showCharts ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm' : 'bg-white/80 text-slate-500 hover:bg-slate-50 border border-slate-200/80'}`}>
            <BarChart3 className="w-4 h-4" />Charts
          </button>

          <ExportButtons transactions={allTransactions} stats={allTimeStats} maaserBalance={isGiveOnly ? balances.maaserBalance : 0}
            baseCurrency={user?.base_currency || 'USD'} userName={user?.name || 'User'} />
        </div>

        {/* Totals Summary */}
        {(() => {
          const isAllTime = viewMode === VIEW_MODES.ALL_TIME;
          const s = isAllTime ? allTimeStats : periodStats;
          const label = isAllTime ? 'All Time' : viewMode === VIEW_MODES.YEAR ? 'Year' : 'Month';
          const dot = (color) => <span className={`w-2 h-2 rounded-full ${loading ? 'bg-slate-300' : color}`} />;
          const skel = <span className="h-4 w-16 bg-slate-200 rounded animate-pulse inline-block" />;
          return (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-4 border border-slate-200/80 shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-3">{label} Totals</p>
              {isGiveOnly ? (
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    {dot('bg-emerald-500')}
                    <span className="text-xs text-slate-500">Income</span>
                    {loading ? skel : <span data-testid="totals-income" className="text-sm font-bold text-emerald-700">{sym}{s.totalIncome.toFixed(2)}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {dot('bg-amber-500')}
                    <span className="text-xs text-slate-500">Maaser</span>
                    {loading ? skel : <span data-testid="totals-maaser" className="text-sm font-bold text-amber-700">{sym}{s.totalMaaser.toFixed(2)}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {dot('bg-blue-500')}
                    <span className="text-xs text-slate-500">Given</span>
                    {loading ? skel : <span data-testid="totals-given" className="text-sm font-bold text-blue-700">{sym}{s.totalGiven.toFixed(2)}</span>}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    {dot('bg-emerald-500')}
                    <span className="text-xs text-slate-500">Income</span>
                    {loading ? skel : <span data-testid="totals-income" className="text-sm font-bold text-emerald-700">{sym}{s.totalIncome.toFixed(2)}</span>}
                  </div>
                  <div className="w-px h-5 bg-slate-200" />
                  <div className="flex items-center gap-2">
                    {dot('bg-blue-500')}
                    <span className="text-xs text-slate-500">Give</span>
                    {loading ? skel : <><span data-testid="totals-give-portion" className="text-sm font-bold text-blue-700">{sym}{(s.totalMaaser * giveRatio).toFixed(2)}</span>
                    <span className="text-[10px] text-slate-300">/</span>
                    <span data-testid="totals-given" className="text-sm font-bold text-blue-500">{sym}{s.totalGiven.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400">given</span></>}
                  </div>
                  <div className="w-px h-5 bg-slate-200" />
                  <div className="flex items-center gap-2">
                    {dot('bg-violet-500')}
                    <span className="text-xs text-slate-500">Lend</span>
                    {loading ? skel : <><span data-testid="totals-lend-portion" className="text-sm font-bold text-violet-700">{sym}{(s.totalMaaser * lendRatio).toFixed(2)}</span>
                    <span className="text-[10px] text-slate-300">/</span>
                    <span data-testid="totals-lent" className="text-sm font-bold text-violet-500">{sym}{s.totalLent.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400">lent</span></>}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {previousPeriodStats && (
          <Insights
            currentStats={viewMode === VIEW_MODES.ALL_TIME ? allTimeStats : periodStats}
            previousStats={previousPeriodStats}
            isGiveOnly={isGiveOnly}
            periodLabel={viewMode === VIEW_MODES.YEAR ? 'Year' : 'Month'}
            hasCurrentData={filteredTransactions.length > 0}
            hasPreviousData={previousPeriodStats.totalIncome > 0 || previousPeriodStats.totalGiven > 0 || previousPeriodStats.totalLent > 0}
            isAllTime={viewMode === VIEW_MODES.ALL_TIME}
          />
        )}

        {showCharts && <AnalyticsCharts transactions={allTransactions} baseCurrency={user?.base_currency || 'USD'} distributionMode={user?.distribution_mode || 'both'} />}

        <SearchFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} filters={filters} onFiltersChange={setFilters} distributionMode={user?.distribution_mode || 'both'} />

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Transactions</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full font-medium">{filteredTransactions.length}{hasMore ? '+' : ''} items</span>
              {serverTotals && <span className="text-xs text-slate-300">{serverTotals.totalCount} total</span>}
            </div>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : (
              <>
                <TransactionList transactions={filteredTransactions} onEdit={(t) => { setEditTransaction(t); setShowModal(true); }}
                  onDelete={handleDeleteTransaction} useHebrewDates={useHebrewDates} baseCurrency={user?.base_currency || 'USD'} />
                {hasMore && (
                  <div className="text-center pt-4">
                    <button data-testid="load-more-btn" onClick={loadMore} disabled={loadingMore}
                      className="px-6 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors disabled:opacity-50">
                      {loadingMore ? (
                        <span className="flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5 animate-spin" />Loading...</span>
                      ) : (
                        `Load more transactions`
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <AddTransactionModal isOpen={showModal} onClose={() => { setShowModal(false); setEditTransaction(null); }}
        onSubmit={handleAddTransaction} editTransaction={editTransaction}
        baseCurrency={user?.base_currency || 'USD'} distributionMode={user?.distribution_mode || 'both'}
        balances={balances} userId={user?.id} useHebrewCalendar={user?.use_hebrew_calendar || false}
        defaultMaaserPercentage={user?.default_maaser_percentage ?? 10}
        giveRatio={user?.give_ratio ?? 50} lendRatio={user?.lend_ratio ?? 50} />

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} user={user} updateUser={updateUser} />
      <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} userName={user?.name} userEmail={user?.email} />
      <CSVImportModal isOpen={showCSVImport} onClose={() => setShowCSVImport(false)}
        onImported={fetchAllTransactions} baseCurrency={user?.base_currency || 'GBP'}
        pastTransactions={allTransactions} defaultMaaserPercentage={user?.default_maaser_percentage ?? 10} />
    </div>
  );
}
