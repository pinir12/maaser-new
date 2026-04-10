import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { getCurrentHebrewMonth, getHebrewMonthBounds } from '../lib/hebrew-calendar';
import { currencies, TRANSACTION_TYPES, getCurrencySymbol } from '../lib/validation';
import { ExportButtons } from '../lib/export';
import { DashboardStats } from './DashboardStats';
import { TransactionList } from './TransactionList';
import { AddTransactionModal } from './AddTransactionModal';
import { MonthlyViewToggle } from './MonthlyViewToggle';
import { SearchFilters } from './SearchFilters';
import { AnalyticsCharts } from './AnalyticsCharts';
import { SettingsModal } from './SettingsModal';
import { Plus, Settings, LogOut, RefreshCw, BarChart3, X } from 'lucide-react';

const VIEW_MODES = { ALL_TIME: 'all_time', YEAR: 'year', MONTH: 'month' };

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
  
  // Use user preferences for defaults
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

  // Update state when user preferences change
  useEffect(() => {
    if (user) {
      setViewMode(user.default_view || VIEW_MODES.MONTH);
      setUseHebrewDates(user.use_hebrew_calendar || false);
    }
  }, [user?.default_view, user?.use_hebrew_calendar]);

  // Calculate all-time stats
  const allTimeStats = useMemo(() => {
    const baseCurrency = user?.base_currency || 'USD';
    const isGiveOnly = user?.distribution_mode === 'give_only';
    
    return allTransactions.reduce((acc, t) => {
      const norm = t.currency === baseCurrency ? t.amount : t.amount * (t.exchange_rate_to_base || 1);
      
      if (t.type === TRANSACTION_TYPES.INCOME) {
        const maaser = norm * ((t.maaser_percentage || 10) / 100);
        return { ...acc, totalIncome: acc.totalIncome + norm, totalMaaserOwed: acc.totalMaaserOwed + maaser, incomeCount: acc.incomeCount + 1 };
      } else if (t.type === TRANSACTION_TYPES.GIVE) {
        return { ...acc, totalGiven: acc.totalGiven + norm, giveCount: acc.giveCount + 1 };
      } else if (t.type === TRANSACTION_TYPES.LEND && !isGiveOnly) {
        return { ...acc, totalLent: acc.totalLent + norm, lendCount: acc.lendCount + 1 };
      }
      return acc;
    }, { totalIncome: 0, totalMaaserOwed: 0, totalGiven: 0, totalLent: 0, incomeCount: 0, giveCount: 0, lendCount: 0 });
  }, [allTransactions, user?.base_currency, user?.distribution_mode]);

  const maaserBalance = useMemo(() => {
    const isGiveOnly = user?.distribution_mode === 'give_only';
    return allTimeStats.totalMaaserOwed - allTimeStats.totalGiven - (isGiveOnly ? 0 : allTimeStats.totalLent);
  }, [allTimeStats, user?.distribution_mode]);

  const fetchAllTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (error) throw error;
      setAllTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Apply filters
  useEffect(() => {
    let filtered = [...allTransactions];
    
    if (viewMode === VIEW_MODES.MONTH) {
      let startDate, endDate;
      if (useHebrewDates) {
        const bounds = getHebrewMonthBounds(selectedYear, selectedMonth);
        startDate = bounds.start; endDate = bounds.end;
      } else {
        startDate = new Date(selectedYear, selectedMonth - 1, 1);
        endDate = new Date(selectedYear, selectedMonth, 0);
      }
      filtered = filtered.filter(t => {
        const d = new Date(t.date);
        return d >= startDate && d <= endDate;
      });
    } else if (viewMode === VIEW_MODES.YEAR) {
      filtered = filtered.filter(t => new Date(t.date).getFullYear() === selectedYear);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.description?.toLowerCase().includes(q) || t.recipient_name?.toLowerCase().includes(q));
    }
    if (filters.types.length > 0) filtered = filtered.filter(t => filters.types.includes(t.type));
    if (filters.dateFrom) filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.dateFrom));
    if (filters.dateTo) filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.dateTo));
    if (filters.amountMin) filtered = filtered.filter(t => t.amount >= Number(filters.amountMin));
    if (filters.amountMax) filtered = filtered.filter(t => t.amount <= Number(filters.amountMax));
    if (filters.isRecurring !== null) filtered = filtered.filter(t => t.is_recurring === filters.isRecurring);
    if (filters.recipient.trim()) filtered = filtered.filter(t => t.recipient_name?.toLowerCase().includes(filters.recipient.toLowerCase()));
    
    setFilteredTransactions(filtered);
  }, [allTransactions, viewMode, selectedMonth, selectedYear, useHebrewDates, searchQuery, filters]);

  useEffect(() => { fetchAllTransactions(); }, [fetchAllTransactions]);

  const processRecurringTransactions = async () => {
    setProcessingRecurring(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cron/recurring`, { method: 'POST' });
      const result = await response.json();
      if (result.created > 0) {
        await fetchAllTransactions();
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
        await supabase.from('transactions').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editId);
      } else {
        await supabase.from('transactions').insert([{ ...data, user_id: user.id, created_at: new Date().toISOString() }]);
      }
      await fetchAllTransactions();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await supabase.from('transactions').delete().eq('id', id);
      setAllTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMonthChange = (month, year) => { setSelectedMonth(month); setSelectedYear(year); };

  const handleCalendarToggle = async () => {
    const newVal = !useHebrewDates;
    setUseHebrewDates(newVal);
    await updateUser({ use_hebrew_calendar: newVal });
    if (newVal) {
      const heb = getCurrentHebrewMonth();
      setSelectedMonth(heb.month); setSelectedYear(heb.year);
    } else {
      const now = new Date();
      setSelectedMonth(now.getMonth() + 1); setSelectedYear(now.getFullYear());
    }
  };

  const handleViewModeChange = async (mode) => {
    setViewMode(mode);
    await updateUser({ default_view: mode });
  };

  const periodStats = useMemo(() => {
    const baseCurrency = user?.base_currency || 'USD';
    const isGiveOnly = user?.distribution_mode === 'give_only';
    
    return filteredTransactions.reduce((acc, t) => {
      const norm = t.currency === baseCurrency ? t.amount : t.amount * (t.exchange_rate_to_base || 1);
      if (t.type === TRANSACTION_TYPES.INCOME) {
        const maaser = norm * ((t.maaser_percentage || 10) / 100);
        return { ...acc, totalIncome: acc.totalIncome + norm, totalMaaserOwed: acc.totalMaaserOwed + maaser };
      } else if (t.type === TRANSACTION_TYPES.GIVE) {
        return { ...acc, totalGiven: acc.totalGiven + norm };
      } else if (t.type === TRANSACTION_TYPES.LEND && !isGiveOnly) {
        return { ...acc, totalLent: acc.totalLent + norm };
      }
      return acc;
    }, { totalIncome: 0, totalMaaserOwed: 0, totalGiven: 0, totalLent: 0 });
  }, [filteredTransactions, user?.base_currency, user?.distribution_mode]);

  return (
    <div data-testid="dashboard" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">Finance Tracker</h1>
          <div className="flex items-center gap-2">
            <button
              data-testid="process-recurring-btn"
              onClick={processRecurringTransactions}
              disabled={processingRecurring}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              title="Sync Recurring"
            >
              <RefreshCw className={`w-5 h-5 ${processingRecurring ? 'animate-spin' : ''}`} />
            </button>
            <button
              data-testid="settings-btn"
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              data-testid="logout-btn"
              onClick={signOut}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Top Row: Add Button + Stats */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            data-testid="add-transaction-btn"
            onClick={() => { setEditTransaction(null); setShowModal(true); }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Add Transaction
          </button>
          
          <div className="flex-1">
            <DashboardStats
              stats={allTimeStats}
              maaserBalance={maaserBalance}
              baseCurrency={user?.base_currency || 'USD'}
              distributionMode={user?.distribution_mode || 'both'}
            />
          </div>
        </div>

        {/* View Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
            {[
              { value: VIEW_MODES.ALL_TIME, label: 'All' },
              { value: VIEW_MODES.YEAR, label: 'Year' },
              { value: VIEW_MODES.MONTH, label: 'Month' }
            ].map(({ value, label }) => (
              <button
                key={value}
                data-testid={`view-mode-${value}`}
                onClick={() => handleViewModeChange(value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  viewMode === value ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {viewMode !== VIEW_MODES.ALL_TIME && (
            <MonthlyViewToggle
              useHebrewDates={useHebrewDates}
              onToggle={handleCalendarToggle}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={handleMonthChange}
              showMonthNav={viewMode === VIEW_MODES.MONTH}
            />
          )}

          <button
            data-testid="toggle-charts-btn"
            onClick={() => setShowCharts(!showCharts)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              showCharts ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Charts
          </button>

          <ExportButtons
            transactions={allTransactions}
            stats={allTimeStats}
            maaserBalance={maaserBalance}
            baseCurrency={user?.base_currency || 'USD'}
            userName={user?.name || 'User'}
          />
        </div>

        {/* Period Summary (if not all-time) */}
        {viewMode !== VIEW_MODES.ALL_TIME && (
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Period Income</p>
                <p className="text-lg font-bold text-emerald-600">{getCurrencySymbol(user?.base_currency || 'USD')}{periodStats.totalIncome.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Period Maaser</p>
                <p className="text-lg font-bold text-amber-600">{getCurrencySymbol(user?.base_currency || 'USD')}{periodStats.totalMaaserOwed.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Period Given</p>
                <p className="text-lg font-bold text-blue-600">{getCurrencySymbol(user?.base_currency || 'USD')}{periodStats.totalGiven.toFixed(2)}</p>
              </div>
              {user?.distribution_mode !== 'give_only' && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Period Lent</p>
                  <p className="text-lg font-bold text-rose-600">{getCurrencySymbol(user?.base_currency || 'USD')}{periodStats.totalLent.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Charts */}
        {showCharts && (
          <AnalyticsCharts
            transactions={allTransactions}
            baseCurrency={user?.base_currency || 'USD'}
            distributionMode={user?.distribution_mode || 'both'}
          />
        )}

        {/* Search & Filters */}
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
          distributionMode={user?.distribution_mode || 'both'}
        />

        {/* Transactions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Transactions</h3>
            <span className="text-sm text-slate-500">{filteredTransactions.length} items</span>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : (
              <TransactionList
                transactions={filteredTransactions}
                onEdit={(t) => { setEditTransaction(t); setShowModal(true); }}
                onDelete={handleDeleteTransaction}
                useHebrewDates={useHebrewDates}
                baseCurrency={user?.base_currency || 'USD'}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddTransactionModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditTransaction(null); }}
        onSubmit={handleAddTransaction}
        editTransaction={editTransaction}
        baseCurrency={user?.base_currency || 'USD'}
        distributionMode={user?.distribution_mode || 'both'}
        maaserBalance={maaserBalance}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        user={user}
        updateUser={updateUser}
      />
    </div>
  );
}
