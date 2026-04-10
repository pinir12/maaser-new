import { useState } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { TRANSACTION_TYPES } from '../lib/validation';

export function SearchFilters({ searchQuery, onSearchChange, filters, onFiltersChange, distributionMode }) {
  const [showFilters, setShowFilters] = useState(false);
  const isGiveOnly = distributionMode === 'give_only';

  const activeCount = [
    filters.types.length > 0, filters.dateFrom, filters.dateTo,
    filters.amountMin, filters.amountMax, filters.isRecurring !== null, filters.recipient
  ].filter(Boolean).length;

  const handleTypeToggle = (type) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    onFiltersChange({ ...filters, types: newTypes });
  };

  const handleClear = () => {
    onFiltersChange({ types: [], dateFrom: '', dateTo: '', amountMin: '', amountMax: '', isRecurring: null, recipient: '' });
    onSearchChange('');
  };

  const types = [
    { type: TRANSACTION_TYPES.INCOME, label: 'Income', color: 'bg-emerald-500' },
    { type: TRANSACTION_TYPES.GIVE, label: 'Give', color: 'bg-blue-500' },
    ...(!isGiveOnly ? [{ type: TRANSACTION_TYPES.LEND, label: 'Lend', color: 'bg-rose-500' }] : [])
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            data-testid="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <button
          data-testid="toggle-filters-btn"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
            showFilters || activeCount > 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Filter className="w-4 h-4" />
          {activeCount > 0 && <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{activeCount}</span>}
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {showFilters && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Type</label>
            <div className="flex flex-wrap gap-2">
              {types.map(({ type, label, color }) => (
                <button
                  key={type}
                  data-testid={`filter-type-${type}`}
                  onClick={() => handleTypeToggle(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filters.types.includes(type) ? `${color} text-white` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">From</label>
              <input
                data-testid="filter-date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">To</label>
              <input
                data-testid="filter-date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Min Amount</label>
              <input
                data-testid="filter-amount-min"
                type="number"
                value={filters.amountMin}
                onChange={(e) => onFiltersChange({ ...filters, amountMin: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Max Amount</label>
              <input
                data-testid="filter-amount-max"
                type="number"
                value={filters.amountMax}
                onChange={(e) => onFiltersChange({ ...filters, amountMax: e.target.value })}
                placeholder="∞"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Recurring</label>
            <div className="flex gap-2">
              {[{ value: null, label: 'All' }, { value: true, label: 'Recurring' }, { value: false, label: 'One-time' }].map(({ value, label }) => (
                <button
                  key={String(value)}
                  data-testid={`filter-recurring-${value}`}
                  onClick={() => onFiltersChange({ ...filters, isRecurring: value })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filters.isRecurring === value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {(activeCount > 0 || searchQuery) && (
            <button
              data-testid="clear-filters-btn"
              onClick={handleClear}
              className="w-full py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      )}
    </div>
  );
}
