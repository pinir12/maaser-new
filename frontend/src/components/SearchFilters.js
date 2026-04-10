import { useState } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { TRANSACTION_TYPES } from '../lib/validation';

export function SearchFilters({ 
  searchQuery, 
  onSearchChange, 
  filters, 
  onFiltersChange,
  distributionMode 
}) {
  const [showFilters, setShowFilters] = useState(false);
  const isGiveOnly = distributionMode === 'give_only';

  const activeFilterCount = [
    filters.types.length > 0,
    filters.dateFrom,
    filters.dateTo,
    filters.amountMin,
    filters.amountMax,
    filters.isRecurring !== null,
    filters.recipient
  ].filter(Boolean).length;

  const handleTypeToggle = (type) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    onFiltersChange({ ...filters, types: newTypes });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      types: [],
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
      isRecurring: null,
      recipient: ''
    });
    onSearchChange('');
  };

  const transactionTypes = [
    { type: TRANSACTION_TYPES.INCOME, label: 'Income', color: 'bg-emerald-500' },
    { type: TRANSACTION_TYPES.GIVE, label: 'Give', color: 'bg-[#1E3F32]' },
  ];
  
  if (!isGiveOnly) {
    transactionTypes.push({ type: TRANSACTION_TYPES.LEND, label: 'Lend', color: 'bg-[#C2574A]' });
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-4 space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#68706B]" />
          <input
            data-testid="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-white/40 rounded-xl focus:ring-2 focus:ring-[#1E3F32]/50 focus:bg-white transition-all text-[#181C1A] placeholder:text-[#68706B]/50"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68706B] hover:text-[#181C1A]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <button
          data-testid="toggle-filters-btn"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            showFilters || activeFilterCount > 0
              ? 'bg-[#1E3F32] text-white'
              : 'bg-white/50 text-[#68706B] hover:bg-white/70'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {activeFilterCount}
            </span>
          )}
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="space-y-4 pt-4 border-t border-white/20">
          {/* Transaction Type Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
              Transaction Type
            </label>
            <div className="flex flex-wrap gap-2">
              {transactionTypes.map(({ type, label, color }) => (
                <button
                  key={type}
                  data-testid={`filter-type-${type}`}
                  onClick={() => handleTypeToggle(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filters.types.includes(type)
                      ? `${color} text-white`
                      : 'bg-white/50 text-[#68706B] hover:bg-white/70'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
                From Date
              </label>
              <input
                data-testid="filter-date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 bg-white/50 border border-white/40 rounded-xl text-[#181C1A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
                To Date
              </label>
              <input
                data-testid="filter-date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 bg-white/50 border border-white/40 rounded-xl text-[#181C1A]"
              />
            </div>
          </div>

          {/* Amount Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
                Min Amount
              </label>
              <input
                data-testid="filter-amount-min"
                type="number"
                value={filters.amountMin}
                onChange={(e) => onFiltersChange({ ...filters, amountMin: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 bg-white/50 border border-white/40 rounded-xl text-[#181C1A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
                Max Amount
              </label>
              <input
                data-testid="filter-amount-max"
                type="number"
                value={filters.amountMax}
                onChange={(e) => onFiltersChange({ ...filters, amountMax: e.target.value })}
                placeholder="∞"
                className="w-full px-3 py-2 bg-white/50 border border-white/40 rounded-xl text-[#181C1A]"
              />
            </div>
          </div>

          {/* Recurring Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
              Recurring Status
            </label>
            <div className="flex gap-2">
              {[
                { value: null, label: 'All' },
                { value: true, label: 'Recurring Only' },
                { value: false, label: 'One-time Only' }
              ].map(({ value, label }) => (
                <button
                  key={String(value)}
                  data-testid={`filter-recurring-${value}`}
                  onClick={() => onFiltersChange({ ...filters, isRecurring: value })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filters.isRecurring === value
                      ? 'bg-[#4A6E82] text-white'
                      : 'bg-white/50 text-[#68706B] hover:bg-white/70'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
              Recipient
            </label>
            <input
              data-testid="filter-recipient"
              type="text"
              value={filters.recipient}
              onChange={(e) => onFiltersChange({ ...filters, recipient: e.target.value })}
              placeholder="Filter by recipient name..."
              className="w-full px-3 py-2 bg-white/50 border border-white/40 rounded-xl text-[#181C1A]"
            />
          </div>

          {/* Clear Filters */}
          {(activeFilterCount > 0 || searchQuery) && (
            <button
              data-testid="clear-filters-btn"
              onClick={handleClearFilters}
              className="w-full py-2 text-sm font-medium text-[#C2574A] hover:bg-[#C2574A]/10 rounded-xl transition-all"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
