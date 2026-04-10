import { getCurrentHebrewMonth, getHebrewMonthBounds, navigateHebrewMonth } from '../lib/hebrew-calendar';
import { HDate } from '@hebcal/core';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export function MonthlyViewToggle({ useHebrewDates, onToggle, selectedMonth, selectedYear, onMonthChange, showMonthNav = true }) {
  const currentHebrew = getCurrentHebrewMonth();

  const handlePrev = () => {
    if (useHebrewDates) {
      const { month, year } = navigateHebrewMonth(selectedMonth || currentHebrew.month, selectedYear || currentHebrew.year, -1);
      onMonthChange(month, year);
    } else {
      const d = new Date(selectedYear, selectedMonth - 1, 1);
      d.setMonth(d.getMonth() - 1);
      onMonthChange(d.getMonth() + 1, d.getFullYear());
    }
  };

  const handleNext = () => {
    if (useHebrewDates) {
      const { month, year } = navigateHebrewMonth(selectedMonth || currentHebrew.month, selectedYear || currentHebrew.year, 1);
      onMonthChange(month, year);
    } else {
      const d = new Date(selectedYear, selectedMonth - 1, 1);
      d.setMonth(d.getMonth() + 1);
      onMonthChange(d.getMonth() + 1, d.getFullYear());
    }
  };

  const getDisplay = () => {
    if (useHebrewDates) {
      try {
        const hd = new HDate(1, selectedMonth, selectedYear);
        return `${hd.getMonthName()} ${selectedYear}`;
      } catch { return `${selectedMonth}/${selectedYear}`; }
    }
    return new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-slate-200 shadow-sm">
      {showMonthNav ? (
        <>
          <button onClick={handlePrev} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 min-w-[120px] justify-center">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span data-testid="current-month-display" className="font-medium text-slate-900 text-sm">{getDisplay()}</span>
          </div>
          <button onClick={handleNext} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <button onClick={() => onMonthChange(selectedMonth, selectedYear - 1)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium text-slate-900 text-sm min-w-[60px] text-center">{selectedYear}</span>
          <button onClick={() => onMonthChange(selectedMonth, selectedYear + 1)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <button
        data-testid="calendar-toggle-btn"
        onClick={onToggle}
        className={`ml-2 px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
          useHebrewDates ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
        }`}
      >
        {useHebrewDates ? 'HEB' : 'GRE'}
      </button>
    </div>
  );
}
