import { useState, useEffect, useOptimistic, useTransition } from 'react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { getCurrentHebrewMonth, getHebrewMonthBounds } from '../lib/hebrew-calendar';
import { currencies } from '../lib/validation';
import { DashboardStats } from './DashboardStats';
import { TransactionList } from './TransactionList';
import { AddTransactionModal } from './AddTransactionModal';
import { MonthlyViewToggle } from './MonthlyViewToggle';
import { 
  Plus, 
  Settings, 
  LogOut, 
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

export function Dashboard() {
  const { user, signOut, updateUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Calendar state
  const [useHebrewDates, setUseHebrewDates] = useState(false);
  const currentHebrew = getCurrentHebrewMonth();
  const currentGregorian = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    useHebrewDates ? currentHebrew.month : currentGregorian.getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(
    useHebrewDates ? currentHebrew.year : currentGregorian.getFullYear()
  );

  // Optimistic updates
  const [isPending, startTransition] = useTransition();
  const [optimisticTransactions, updateOptimisticTransactions] = useOptimistic(
    transactions,
    (state, { action, transaction, id }) => {
      switch (action) {
        case 'add':
          return [{ ...transaction, id: 'optimistic-' + Date.now(), optimistic: true }, ...state];
        case 'delete':
          return state.filter(t => t.id !== id);
        case 'update':
          return state.map(t => t.id === transaction.id ? { ...transaction, optimistic: true } : t);
        default:
          return state;
      }
    }
  );

  // Fetch transactions based on month/year and calendar type
  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedMonth, selectedYear, useHebrewDates]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let startDate, endDate;
      
      if (useHebrewDates) {
        const bounds = getHebrewMonthBounds(selectedYear, selectedMonth);
        startDate = bounds.start.toISOString().split('T')[0];
        endDate = bounds.end.toISOString().split('T')[0];
      } else {
        startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0];
        endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
      }

      // Use Supabase client
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (data, editId) => {
    try {
      if (editId) {
        // Update existing using Supabase client
        startTransition(() => {
          updateOptimisticTransactions({ 
            action: 'update', 
            transaction: { ...data, id: editId } 
          });
        });

        const { error } = await supabase
          .from('transactions')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', editId);

        if (error) throw error;
      } else {
        // Add new using Supabase client
        const newTransaction = {
          ...data,
          user_id: user.id,
          created_at: new Date().toISOString()
        };

        startTransition(() => {
          updateOptimisticTransactions({ action: 'add', transaction: newTransaction });
        });

        const { error } = await supabase
          .from('transactions')
          .insert([newTransaction]);

        if (error) throw error;
      }

      // Refresh transactions
      await fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      // Use Supabase client
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTransactions(prev => prev.filter(t => t.id !== id));
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
    
    // Reset to current month in new calendar system
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
            {/* Logo */}
            <h1 className="text-xl font-black text-[#181C1A] tracking-tight">
              Finance Tracker
            </h1>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-[#68706B]">
                Welcome, <span className="font-semibold text-[#181C1A]">{user?.name}</span>
              </span>
              
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
                    {/* Distribution Mode */}
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
                      <p className="text-xs text-[#68706B] mt-1">
                        {user?.distribution_mode === 'give_only' 
                          ? 'Lend tracking is disabled' 
                          : 'Track both gives and lends'
                        }
                      </p>
                    </div>

                    {/* Base Currency */}
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

            {/* Mobile Menu Button */}
            <button
              data-testid="mobile-menu-btn"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-[#68706B] hover:text-[#181C1A]"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-white/20 p-4 space-y-4">
            <p className="text-sm text-[#68706B]">
              Welcome, <span className="font-semibold text-[#181C1A]">{user?.name}</span>
            </p>
            
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Stats & Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Monthly View Toggle */}
            <MonthlyViewToggle
              useHebrewDates={useHebrewDates}
              onToggle={handleCalendarToggle}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={handleMonthChange}
            />

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

          {/* Right Column - Dashboard Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats */}
            <DashboardStats
              transactions={optimisticTransactions}
              baseCurrency={user?.base_currency || 'USD'}
              distributionMode={user?.distribution_mode || 'both'}
            />

            {/* Transaction List */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-[#181C1A] mb-4">
                Transactions
              </h3>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-[#1E3F32] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="mt-4 text-[#68706B]">Loading transactions...</p>
                </div>
              ) : (
                <TransactionList
                  transactions={optimisticTransactions}
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
      />

      {/* Click outside to close settings */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
