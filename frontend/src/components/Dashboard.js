import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { apiGetTransactions, apiCreateTransaction, apiUpdateTransaction, apiDeleteTransaction, apiProcessRecurring } from '../lib/api';
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
import { Plus, Settings, LogOut, RefreshCw, BarChart3, Mail, Shield, Repeat } from 'lucide-react';

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

  // --- Stats calculations with new Give/Lend split ---
  const isGiveOnly = user?.distribution_mode === 'give_only';
  const giveRatio = (user?.give_ratio ?? 50) / 100;
  const lendRatio = (user?.lend_ratio ?? 50) / 100;

  const allTimeStats = useMemo(() => {
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
  }, [allTransactions, user?.base_currency]);

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

  const fetchAllTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiGetTransactions();
      setAllTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

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

  const processRecurringTransactions = async () => {
    setProcessingRecurring(true);
    try {
      const result = await apiProcessRecurring();
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
        await apiUpdateTransaction(editId, data);
      } else {
        await apiCreateTransaction(data);
      }
      await fetchAllTransactions();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await apiDeleteTransaction(id);
      await fetchAllTransactions();
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
  }, [filteredTransactions, user?.base_currency]);

  if (showAdmin) return <AdminPanel onBack={() => setShowAdmin(false)} />;

  const sym = getCurrencySymbol(user?.base_currency || 'USD');

  return (
    <div data-testid="dashboard" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Finance Tracker</h1>
          </div>
          <div className="flex items-center gap-1">
            <button data-testid="contact-btn" onClick={() => setShowContact(true)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Contact">
              <Mail className="w-[18px] h-[18px]" />
            </button>
            <button data-testid="recurring-manager-btn" onClick={() => setShowRecurring(!showRecurring)}
              className={`p-2 rounded-lg transition-all ${showRecurring ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} title="Recurring">
              <Repeat className="w-[18px] h-[18px]" />
            </button>
            <button data-testid="process-recurring-btn" onClick={processRecurringTransactions} disabled={processingRecurring}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50" title="Sync Recurring">
              <RefreshCw className={`w-[18px] h-[18px] ${processingRecurring ? 'animate-spin' : ''}`} />
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
          <button data-testid="add-transaction-btn" onClick={() => { setEditTransaction(null); setShowModal(true); }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30 active:translate-y-0">
            <Plus className="w-5 h-5" />Add Transaction
          </button>
          <div className="flex-1">
            <DashboardStats
              balances={balances}
              baseCurrency={user?.base_currency || 'USD'}
              distributionMode={user?.distribution_mode || 'both'}
            />
          </div>
        </div>

        {showRecurring && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2"><Repeat className="w-4 h-4 text-blue-600" /><h3 className="font-semibold text-slate-900">Recurring Transactions</h3></div>
              <button onClick={() => setShowRecurring(false)} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Close</button>
            </div>
            <div className="p-4"><RecurringManager baseCurrency={user?.base_currency || 'USD'} onBack={() => setShowRecurring(false)} /></div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-sm border border-slate-200/80">
            {[{ value: VIEW_MODES.ALL_TIME, label: 'All' }, { value: VIEW_MODES.YEAR, label: 'Year' }, { value: VIEW_MODES.MONTH, label: 'Month' }].map(({ value, label }) => (
              <button key={value} data-testid={`view-mode-${value}`} onClick={() => handleViewModeChange(value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === value ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
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

        {/* Totals Summary - always visible, shows all-time or period depending on view */}
        {(() => {
          const isAllTime = viewMode === VIEW_MODES.ALL_TIME;
          const s = isAllTime ? allTimeStats : periodStats;
          const label = isAllTime ? 'All Time' : viewMode === VIEW_MODES.YEAR ? 'Year' : 'Month';
          return (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-3">{label} Totals</p>
              <div className={`grid gap-4 text-center ${isGiveOnly ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'}`}>
                <div className="p-3 bg-emerald-50/80 rounded-xl">
                  <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-semibold mb-1">Income</p>
                  <p data-testid="totals-income" className="text-lg font-bold text-emerald-700">{sym}{s.totalIncome.toFixed(2)}</p>
                </div>
                {isGiveOnly ? (
                  <>
                    <div className="p-3 bg-amber-50/80 rounded-xl">
                      <p className="text-[10px] text-amber-600 uppercase tracking-wider font-semibold mb-1">Maaser</p>
                      <p data-testid="totals-maaser" className="text-lg font-bold text-amber-700">{sym}{s.totalMaaser.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-blue-50/80 rounded-xl">
                      <p className="text-[10px] text-blue-600 uppercase tracking-wider font-semibold mb-1">Given</p>
                      <p data-testid="totals-given" className="text-lg font-bold text-blue-700">{sym}{s.totalGiven.toFixed(2)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-blue-50/80 rounded-xl">
                      <p className="text-[10px] text-blue-600 uppercase tracking-wider font-semibold mb-1">Give</p>
                      <div className="flex items-baseline justify-center gap-2 mt-1">
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase tracking-wider">Portion</p>
                          <p data-testid="totals-give-portion" className="text-lg font-bold text-blue-700">{sym}{(s.totalMaaser * giveRatio).toFixed(2)}</p>
                        </div>
                        <div className="w-px h-8 bg-blue-200" />
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase tracking-wider">Given</p>
                          <p data-testid="totals-given" className="text-lg font-bold text-blue-500">{sym}{s.totalGiven.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-rose-50/80 rounded-xl">
                      <p className="text-[10px] text-rose-600 uppercase tracking-wider font-semibold mb-1">Lend</p>
                      <div className="flex items-baseline justify-center gap-2 mt-1">
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase tracking-wider">Portion</p>
                          <p data-testid="totals-lend-portion" className="text-lg font-bold text-rose-700">{sym}{(s.totalMaaser * lendRatio).toFixed(2)}</p>
                        </div>
                        <div className="w-px h-8 bg-rose-200" />
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase tracking-wider">Lent</p>
                          <p data-testid="totals-lent" className="text-lg font-bold text-rose-500">{sym}{s.totalLent.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {showCharts && <AnalyticsCharts transactions={allTransactions} baseCurrency={user?.base_currency || 'USD'} distributionMode={user?.distribution_mode || 'both'} />}

        <SearchFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} filters={filters} onFiltersChange={setFilters} distributionMode={user?.distribution_mode || 'both'} />

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Transactions</h3>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full font-medium">{filteredTransactions.length} items</span>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : (
              <TransactionList transactions={filteredTransactions} onEdit={(t) => { setEditTransaction(t); setShowModal(true); }}
                onDelete={handleDeleteTransaction} useHebrewDates={useHebrewDates} baseCurrency={user?.base_currency || 'USD'} />
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
    </div>
  );
}
