import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { getCurrentHebrewMonth, getHebrewMonthBounds } from '../lib/hebrew-calendar';
import { currencies, TRANSACTION_TYPES, getCurrencySymbol } from '../lib/validation';
import { DashboardStats } from './DashboardStats';
import { TransactionList } from './TransactionList';
import { AddTransactionModal } from './AddTransactionModal';
import { MonthlyViewToggle } from './MonthlyViewToggle';
import { SearchFilters } from './SearchFilters';
import { 
  Plus, 
  Settings, 
  LogOut, 
  Menu,
  X,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

const VIEW_MODES = {
  ALL_TIME: 'all_time',
  YEAR: 'year',
  MONTH: 'month'
};

export function Dashboard() {
  const { user, signOut, updateUser } = useAuth();
  
  // All transactions (for all-time stats)
  const [allTransactions, setAllTransactions] = useState([]);
  // Filtered transactions (for display)
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [processingRecurring, setProcessingRecurring] = useState(false);
  
  // View mode state
  const [viewMode, setViewMode] = useState(VIEW_MODES.MONTH);
  
  // Calendar state
  const [useHebrewDates, setUseHebrewDates] = useState(false);
  const currentHebrew = getCurrentHebrewMonth();
  const currentGregorian = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentGregorian.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentGregorian.getFullYear());

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    types: [], // empty = all types
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    isRecurring: null, // null = all, true = only recurring, false = only non-recurring
    recipient: ''
  });

  // Calculate all-time stats (always from allTransactions)
  const allTimeStats = useMemo(() => {
    const baseCurrency = user?.base_currency || 'USD';
    const isGiveOnly = user?.distribution_mode === 'give_only';
    
    return allTransactions.reduce((acc, t) => {
      const normalizedAmount = t.currency === baseCurrency 
        ? t.amount 
        : t.amount * (t.exchange_rate_to_base || 1);
      
      if (t.type === TRANSACTION_TYPES.INCOME) {
        const maaserAmount = normalizedAmount * ((t.maaser_percentage || 10) / 100);
        return {
          ...acc,
          totalIncome: acc.totalIncome + normalizedAmount,
          totalMaaserOwed: acc.totalMaaserOwed + maaserAmount,
          incomeCount: acc.incomeCount + 1
        };
      } else if (t.type === TRANSACTION_TYPES.GIVE) {
        return {
          ...acc,
          totalGiven: acc.totalGiven + normalizedAmount,
          giveCount: acc.giveCount + 1
        };
      } else if (t.type === TRANSACTION_TYPES.LEND && !isGiveOnly) {
        return {
          ...acc,
          totalLent: acc.totalLent + normalizedAmount,
          lendCount: acc.lendCount + 1
        };
      }
      return acc;
    }, { 
      totalIncome: 0, 
      totalMaaserOwed: 0, 
      totalGiven: 0, 
      totalLent: 0,
      incomeCount: 0,
      giveCount: 0,
      lendCount: 0
    });
  }, [allTransactions, user?.base_currency, user?.distribution_mode]);

  const maaserBalance = useMemo(() => {
    const isGiveOnly = user?.distribution_mode === 'give_only';
    const distributed = allTimeStats.totalGiven + (isGiveOnly ? 0 : allTimeStats.totalLent);
    return allTimeStats.totalMaaserOwed - distributed;
  }, [allTimeStats, user?.distribution_mode]);

  // Fetch all transactions
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

  // Apply filters to transactions
  useEffect(() => {
    let filtered = [...allTransactions];
    
    // Apply view mode filter
    if (viewMode === VIEW_MODES.MONTH) {
      let startDate, endDate;
      if (useHebrewDates) {
        const bounds = getHebrewMonthBounds(selectedYear, selectedMonth);
        startDate = bounds.start;
        endDate = bounds.end;
      } else {
        startDate = new Date(selectedYear, selectedMonth - 1, 1);
        endDate = new Date(selectedYear, selectedMonth, 0);
      }
      filtered = filtered.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= startDate && tDate <= endDate;
      });
    } else if (viewMode === VIEW_MODES.YEAR) {
      filtered = filtered.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === selectedYear;
      });
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(query) ||
        t.recipient_name?.toLowerCase().includes(query)
      );
    }
    
    // Apply type filter
    if (filters.types.length > 0) {
      filtered = filtered.filter(t => filters.types.includes(t.type));
    }
    
    // Apply date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.dateTo));
    }
    
    // Apply amount filter
    if (filters.amountMin) {
      filtered = filtered.filter(t => t.amount >= Number(filters.amountMin));
    }
    if (filters.amountMax) {
      filtered = filtered.filter(t => t.amount <= Number(filters.amountMax));
    }
    
    // Apply recurring filter
    if (filters.isRecurring !== null) {
      filtered = filtered.filter(t => t.is_recurring === filters.isRecurring);
    }
    
    // Apply recipient filter
    if (filters.recipient.trim()) {
      filtered = filtered.filter(t => 
        t.recipient_name?.toLowerCase().includes(filters.recipient.toLowerCase())
      );
    }
    
    setFilteredTransactions(filtered);
  }, [allTransactions, viewMode, selectedMonth, selectedYear, useHebrewDates, searchQuery, filters]);

  // Initial fetch
  useEffect(() => {
    fetchAllTransactions();
  }, [fetchAllTransactions]);

  // Process recurring transactions
  const processRecurringTransactions = async () => {
    setProcessingRecurring(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all recurring transactions
      const { data: recurringTxns, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_recurring', true);
      
      if (error) throw error;
      
      let created = 0;
      
      for (const txn of recurringTxns || []) {
        // Check if end date passed
        if (txn.recurring_end_date && new Date(txn.recurring_end_date) < today) {
          continue;
        }
        
        // Calculate next occurrence date
        const lastDate = new Date(txn.date);
        let nextDate = new Date(lastDate);
        
        switch (txn.recurring_frequency) {
          case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'biweekly':
            nextDate.setDate(nextDate.getDate() + 14);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
          default:
            continue;
        }
        
        // Check if next occurrence should be created
        while (nextDate <= today) {
          // Check if transaction already exists for this date
          const dateStr = nextDate.toISOString().split('T')[0];
          const existingCheck = await supabase
            .from('transactions')
            .select('id')
            .eq('user_id', user.id)
            .eq('description', txn.description)
            .eq('date', dateStr)
            .limit(1);
          
          if (!existingCheck.data || existingCheck.data.length === 0) {
            // Create new transaction
            const newTxn = {
              user_id: user.id,
              description: txn.description,
              amount: txn.amount,
              currency: txn.currency,
              exchange_rate_to_base: txn.exchange_rate_to_base,
              type: txn.type,
              maaser_percentage: txn.maaser_percentage,
              maaser_amount: txn.maaser_amount,
              recipient_name: txn.recipient_name,
              date: dateStr,
              is_recurring: true,
              recurring_frequency: txn.recurring_frequency,
              recurring_end_date: txn.recurring_end_date,
              created_at: new Date().toISOString()
            };
            
            await supabase.from('transactions').insert([newTxn]);
            created++;
          }
          
          // Move to next occurrence
          switch (txn.recurring_frequency) {
            case 'daily':
              nextDate.setDate(nextDate.getDate() + 1);
              break;
            case 'weekly':
              nextDate.setDate(nextDate.getDate() + 7);
              break;
            case 'biweekly':
              nextDate.setDate(nextDate.getDate() + 14);
              break;
            case 'monthly':
              nextDate.setMonth(nextDate.getMonth() + 1);
              break;
            case 'yearly':
              nextDate.setFullYear(nextDate.getFullYear() + 1);
              break;
          }
        }
      }
      
      if (created > 0) {
        await fetchAllTransactions();
        alert(`Created ${created} recurring transaction(s)`);
      } else {
        alert('No new recurring transactions to create');
      }
    } catch (error) {
      console.error('Error processing recurring transactions:', error);
      alert('Error processing recurring transactions');
    } finally {
      setProcessingRecurring(false);
    }
  };

  const handleAddTransaction = async (data, editId) => {
    try {
      if (editId) {
        const { error } = await supabase
          .from('transactions')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert([{
            ...data,
            user_id: user.id,
            created_at: new Date().toISOString()
          }]);
        if (error) throw error;
      }
      await fetchAllTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setAllTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditTransaction(transaction);
    setShowModal(true);
  };

  const handleMonthChange = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const handleCalendarToggle = () => {
    const newUseHebrew = !useHebrewDates;
    setUseHebrewDates(newUseHebrew);
    if (newUseHebrew) {
      const heb = getCurrentHebrewMonth();
      setSelectedMonth(heb.month);
      setSelectedYear(heb.year);
    } else {
      const now = new Date();
      setSelectedMonth(now.getMonth() + 1);
      setSelectedYear(now.getFullYear());
    }
  };

  const handleUpdateDistributionMode = async (mode) => {
    await updateUser({ distribution_mode: mode });
  };

  const handleUpdateBaseCurrency = async (currency) => {
    await updateUser({ base_currency: currency });
  };

  // Calculate period-specific stats
  const periodStats = useMemo(() => {
    const baseCurrency = user?.base_currency || 'USD';
    const isGiveOnly = user?.distribution_mode === 'give_only';
    
    return filteredTransactions.reduce((acc, t) => {
      const normalizedAmount = t.currency === baseCurrency 
        ? t.amount 
        : t.amount * (t.exchange_rate_to_base || 1);
      
      if (t.type === TRANSACTION_TYPES.INCOME) {
        const maaserAmount = normalizedAmount * ((t.maaser_percentage || 10) / 100);
        return {
          ...acc,
          totalIncome: acc.totalIncome + normalizedAmount,
          totalMaaserOwed: acc.totalMaaserOwed + maaserAmount,
          incomeCount: acc.incomeCount + 1
        };
      } else if (t.type === TRANSACTION_TYPES.GIVE) {
        return {
          ...acc,
          totalGiven: acc.totalGiven + normalizedAmount,
          giveCount: acc.giveCount + 1
        };
      } else if (t.type === TRANSACTION_TYPES.LEND && !isGiveOnly) {
        return {
          ...acc,
          totalLent: acc.totalLent + normalizedAmount,
          lendCount: acc.lendCount + 1
        };
      }
      return acc;
    }, { 
      totalIncome: 0, 
      totalMaaserOwed: 0, 
      totalGiven: 0, 
      totalLent: 0,
      incomeCount: 0,
      giveCount: 0,
      lendCount: 0
    });
  }, [filteredTransactions, user?.base_currency, user?.distribution_mode]);

  return (
    <div 
      data-testid="dashboard"
      className="min-h-screen"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1615716038854-58e352eee1db?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHNvZnQlMjBncmFkaWVudCUyMGJhY2tncm91bmQlMjBzYW5kJTIwcGFzdGVsJTIwZ3JlZW58ZW58MHx8fHwxNzc1Nzg0OTY2fDA&ixlib=rb-4.1.0&q=85)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-black text-[#181C1A] tracking-tight">
              Finance Tracker
            </h1>

            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-[#68706B]">
                Welcome, <span className="font-semibold text-[#181C1A]">{user?.name}</span>
              </span>
              
              {/* Process Recurring Button */}
              <button
                data-testid="process-recurring-btn"
                onClick={processRecurringTransactions}
                disabled={processingRecurring}
                className="flex items-center gap-2 px-3 py-2 text-[#4A6E82] hover:text-[#181C1A] hover:bg-[#4A6E82]/10 rounded-xl transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${processingRecurring ? 'animate-spin' : ''}`} />
                Sync Recurring
              </button>
              
              {/* Settings Dropdown */}
              <div className="relative">
                <button
                  data-testid="settings-btn"
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-2 px-3 py-2 text-[#68706B] hover:text-[#181C1A] hover:bg-black/5 rounded-xl transition-all"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
                </button>

                {showSettings && (
                  <div 
                    data-testid="settings-dropdown"
                    className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl p-4 space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
                        Distribution Mode
                      </label>
                      <select
                        data-testid="distribution-mode-select"
                        value={user?.distribution_mode || 'both'}
                        onChange={(e) => handleUpdateDistributionMode(e.target.value)}
                        className="w-full px-3 py-2 bg-white/50 border border-white/40 rounded-xl text-[#181C1A]"
                      >
                        <option value="both">Give & Lend</option>
                        <option value="give_only">Give Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
                        Base Currency
                      </label>
                      <select
                        data-testid="base-currency-select"
                        value={user?.base_currency || 'USD'}
                        onChange={(e) => handleUpdateBaseCurrency(e.target.value)}
                        className="w-full px-3 py-2 bg-white/50 border border-white/40 rounded-xl text-[#181C1A]"
                      >
                        {currencies.map(c => (
                          <option key={c.code} value={c.code}>
                            {c.symbol} {c.code}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <button
                data-testid="logout-btn"
                onClick={signOut}
                className="flex items-center gap-2 px-3 py-2 text-[#C2574A] hover:bg-[#C2574A]/10 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>

            <button
              data-testid="mobile-menu-btn"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-[#68706B] hover:text-[#181C1A]"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="md:hidden border-t border-white/20 p-4 space-y-4">
            <p className="text-sm text-[#68706B]">
              Welcome, <span className="font-semibold text-[#181C1A]">{user?.name}</span>
            </p>
            
            <button
              onClick={processRecurringTransactions}
              disabled={processingRecurring}
              className="w-full flex items-center justify-center gap-2 py-2 text-[#4A6E82] hover:bg-[#4A6E82]/10 rounded-xl"
            >
              <RefreshCw className={`w-4 h-4 ${processingRecurring ? 'animate-spin' : ''}`} />
              Sync Recurring
            </button>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
                Distribution Mode
              </label>
              <select
                value={user?.distribution_mode || 'both'}
                onChange={(e) => handleUpdateDistributionMode(e.target.value)}
                className="w-full px-3 py-2 bg-white/50 border border-white/40 rounded-xl text-[#181C1A]"
              >
                <option value="both">Give & Lend</option>
                <option value="give_only">Give Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
                Base Currency
              </label>
              <select
                value={user?.base_currency || 'USD'}
                onChange={(e) => handleUpdateBaseCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-white/50 border border-white/40 rounded-xl text-[#181C1A]"
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 py-2 text-[#C2574A] hover:bg-[#C2574A]/10 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* All-Time Stats (Always visible) */}
        <DashboardStats
          stats={allTimeStats}
          maaserBalance={maaserBalance}
          baseCurrency={user?.base_currency || 'USD'}
          distributionMode={user?.distribution_mode || 'both'}
          isAllTime={true}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* View Mode Selector */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-4">
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-3">
                View Period
              </label>
              <div className="flex flex-col gap-2">
                {[
                  { value: VIEW_MODES.ALL_TIME, label: 'All Time' },
                  { value: VIEW_MODES.YEAR, label: 'This Year' },
                  { value: VIEW_MODES.MONTH, label: 'This Month' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    data-testid={`view-mode-${value}`}
                    onClick={() => setViewMode(value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      viewMode === value
                        ? 'bg-[#1E3F32] text-white'
                        : 'bg-white/50 text-[#68706B] hover:bg-white/70'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Month/Year Selector (only for month/year views) */}
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

            {/* Add Transaction Button */}
            <button
              data-testid="add-transaction-btn"
              onClick={() => {
                setEditTransaction(null);
                setShowModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#1E3F32] text-white font-semibold rounded-2xl hover:bg-[#152e24] shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Transaction
            </button>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Period Stats (if not all-time) */}
            {viewMode !== VIEW_MODES.ALL_TIME && (
              <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-4">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#68706B] mb-3">
                  {viewMode === VIEW_MODES.MONTH ? 'Monthly' : 'Yearly'} Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-[#68706B]">Income</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {getCurrencySymbol(user?.base_currency || 'USD')}{periodStats.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#68706B]">Maaser</p>
                    <p className="text-lg font-bold text-amber-600">
                      {getCurrencySymbol(user?.base_currency || 'USD')}{periodStats.totalMaaserOwed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#68706B]">Given</p>
                    <p className="text-lg font-bold text-[#1E3F32]">
                      {getCurrencySymbol(user?.base_currency || 'USD')}{periodStats.totalGiven.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  {user?.distribution_mode !== 'give_only' && (
                    <div>
                      <p className="text-xs text-[#68706B]">Lent</p>
                      <p className="text-lg font-bold text-[#C2574A]">
                        {getCurrencySymbol(user?.base_currency || 'USD')}{periodStats.totalLent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Search & Filters */}
            <SearchFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filters={filters}
              onFiltersChange={setFilters}
              distributionMode={user?.distribution_mode || 'both'}
            />

            {/* Transaction List */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#181C1A]">
                  Transactions
                </h3>
                <span className="text-sm text-[#68706B]">
                  {filteredTransactions.length} result{filteredTransactions.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-[#1E3F32] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="mt-4 text-[#68706B]">Loading transactions...</p>
                </div>
              ) : (
                <TransactionList
                  transactions={filteredTransactions}
                  onEdit={handleEditTransaction}
                  onDelete={handleDeleteTransaction}
                  useHebrewDates={useHebrewDates}
                  baseCurrency={user?.base_currency || 'USD'}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditTransaction(null);
        }}
        onSubmit={handleAddTransaction}
        editTransaction={editTransaction}
        baseCurrency={user?.base_currency || 'USD'}
        distributionMode={user?.distribution_mode || 'both'}
        maaserBalance={maaserBalance}
      />

      {showSettings && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
