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
import { ContactModal } from './ContactModal';
import { AdminPanel } from './AdminPanel';
import { RecurringManager } from './RecurringManager';
import { Plus, Settings, LogOut, RefreshCw, BarChart3, Mail, Shield, Repeat } from 'lucide-react';

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
  const [showContact, setShowContact] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  
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

  // Show admin panel if toggled
  if (showAdmin) {
    return <AdminPanel onBack={() => setShowAdmin(false)} />;
  }

  return (
    <div data-testid="dashboard" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Finance Tracker</h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              data-testid="contact-btn"
              onClick={() => setShowContact(true)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Contact"
            >
              <Mail className="w-[18px] h-[18px]" />
            </button>
            <button
              data-testid="recurring-manager-btn"
              onClick={() => setShowRecurring(!showRecurring)}
              className={`p-2 rounded-lg transition-all ${showRecurring ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
              title="Recurring Transactions"
            >
              <Repeat className="w-[18px] h-[18px]" />
            </button>
            <button
              data-testid="process-recurring-btn"
              onClick={processRecurringTransactions}
              disabled={processingRecurring}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50"
              title="Sync Recurring"
            >
              <RefreshCw className={`w-[18px] h-[18px] ${processingRecurring ? 'animate-spin' : ''}`} />
            </button>
            <button
              data-testid="settings-btn"
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              <Settings className="w-[18px] h-[18px]" />
            </button>
            {user?.is_admin && (
              <button
                data-testid="admin-btn"
                onClick={() => setShowAdmin(true)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Admin Panel"
              >
                <Shield className="w-[18px] h-[18px]" />
              </button>
            )}
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <button
              data-testid="logout-btn"
              onClick={signOut}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* Top Row: Add Button + Stats */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            data-testid="add-transaction-btn"
            onClick={() => { setEditTransaction(null); setShowModal(true); }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30 active:translate-y-0"
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

        {/* Recurring Manager Section */}
        {showRecurring && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Recurring Transactions</h3>
              </div>
              <button
                onClick={() => setShowRecurring(false)}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <RecurringManager
                userId={user?.id}
                baseCurrency={user?.base_currency || 'USD'}
                onBack={() => setShowRecurring(false)}
              />
            </div>
          </div>
        )}

        {/* View Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-sm border border-slate-200/80">
            {[
              { value: VIEW_MODES.ALL_TIME, label: 'All' },
              { value: VIEW_MODES.YEAR, label: 'Year' },
              { value: VIEW_MODES.MONTH, label: 'Month' }
            ].map(({ value, label }) => (
              <button
                key={value}
                data-testid={`view-mode-${value}`}
                onClick={() => handleViewModeChange(value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  viewMode === value ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
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
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              showCharts ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm' : 'bg-white/80 text-slate-500 hover:bg-slate-50 border border-slate-200/80'
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

        {/* Period Summary */}
        {viewMode !== VIEW_MODES.ALL_TIME && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-emerald-50/80 rounded-xl">
                <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-semibold mb-1">Period Income</p>
                <p className="text-lg font-bold text-emerald-700">{getCurrencySymbol(user?.base_currency || 'USD')}{periodStats.totalIncome.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-amber-50/80 rounded-xl">
                <p className="text-[10px] text-amber-600 uppercase tracking-wider font-semibold mb-1">Period Maaser</p>
                <p className="text-lg font-bold text-amber-700">{getCurrencySymbol(user?.base_currency || 'USD')}{periodStats.totalMaaserOwed.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-blue-50/80 rounded-xl">
                <p className="text-[10px] text-blue-600 uppercase tracking-wider font-semibold mb-1">Period Given</p>
                <p className="text-lg font-bold text-blue-700">{getCurrencySymbol(user?.base_currency || 'USD')}{periodStats.totalGiven.toFixed(2)}</p>
              </div>
              {user?.distribution_mode !== 'give_only' && (
                <div className="p-3 bg-rose-50/80 rounded-xl">
                  <p className="text-[10px] text-rose-600 uppercase tracking-wider font-semibold mb-1">Period Lent</p>
                  <p className="text-lg font-bold text-rose-700">{getCurrencySymbol(user?.base_currency || 'USD')}{periodStats.totalLent.toFixed(2)}</p>
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
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Transactions</h3>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full font-medium">{filteredTransactions.length} items</span>
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
        userId={user?.id}
        useHebrewCalendar={user?.use_hebrew_calendar || false}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        user={user}
        updateUser={updateUser}
      />

      <ContactModal
        isOpen={showContact}
        onClose={() => setShowContact(false)}
        userName={user?.name}
        userEmail={user?.email}
      />
    </div>
  );
}
