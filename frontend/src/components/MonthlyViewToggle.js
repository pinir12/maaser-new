import { 
  getCurrentHebrewMonth, 
  getHebrewMonths, 
  getHebrewMonthBounds,
  navigateHebrewMonth 
} from '../lib/hebrew-calendar';
import { HDate } from '@hebcal/core';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export function MonthlyViewToggle({ 
  useHebrewDates, 
  onToggle, 
  selectedMonth,
  selectedYear,
  onMonthChange 
}) {
  const currentHebrew = getCurrentHebrewMonth();

  const handlePrevMonth = () => {
    if (useHebrewDates) {
      const { month, year } = navigateHebrewMonth(
        selectedMonth || currentHebrew.month,
        selectedYear || currentHebrew.year,
        -1
      );
      onMonthChange(month, year);
    } else {
      const currentDate = new Date(selectedYear, selectedMonth - 1, 1);
      currentDate.setMonth(currentDate.getMonth() - 1);
      onMonthChange(currentDate.getMonth() + 1, currentDate.getFullYear());
    }
  };

  const handleNextMonth = () => {
    if (useHebrewDates) {
      const { month, year } = navigateHebrewMonth(
        selectedMonth || currentHebrew.month,
        selectedYear || currentHebrew.year,
        1
      );
      onMonthChange(month, year);
    } else {
      const currentDate = new Date(selectedYear, selectedMonth - 1, 1);
      currentDate.setMonth(currentDate.getMonth() + 1);
      onMonthChange(currentDate.getMonth() + 1, currentDate.getFullYear());
    }
  };

  const getDisplayMonth = () => {
    if (useHebrewDates) {
      // Create an HDate for the first day of the selected Hebrew month to get proper name
      try {
        const hd = new HDate(1, selectedMonth, selectedYear);
        return `${hd.getMonthName()} ${selectedYear}`;
      } catch (e) {
        return `Month ${selectedMonth}, ${selectedYear}`;
      }
    } else {
      const date = new Date(selectedYear, selectedMonth - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  const getMonthBoundsDisplay = () => {
    if (useHebrewDates) {
      const bounds = getHebrewMonthBounds(selectedYear, selectedMonth);
      return `${bounds.start.toLocaleDateString()} - ${bounds.end.toLocaleDateString()}`;
    }
    return null;
  };

  return (
    <div 
      data-testid="monthly-view-toggle"
      className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-4"
    >
      {/* Calendar Type Toggle */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#68706B]">
          Calendar Mode
        </span>
        <button
          data-testid="calendar-toggle-btn"
          onClick={onToggle}
          className={`
            relative w-32 h-9 rounded-xl transition-all duration-300
            ${useHebrewDates 
              ? 'bg-[#1E3F32]' 
              : 'bg-[#68706B]/20'
            }
          `}
        >
          <span 
            className={`
              absolute left-1 top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm
              transition-transform duration-300
              ${useHebrewDates ? 'translate-x-full' : 'translate-x-0'}
            `}
          />
          <span className={`absolute left-0 w-1/2 text-center text-xs font-semibold transition-colors ${!useHebrewDates ? 'text-[#181C1A]' : 'text-white/70'}`}>
            Gregorian
          </span>
          <span className={`absolute right-0 w-1/2 text-center text-xs font-semibold transition-colors ${useHebrewDates ? 'text-[#181C1A]' : 'text-[#68706B]'}`}>
            Hebrew
          </span>
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          data-testid="prev-month-btn"
          onClick={handlePrevMonth}
          className="p-2 text-[#68706B] hover:text-[#181C1A] hover:bg-black/5 rounded-xl transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4 text-[#1E3F32]" />
            <span 
              data-testid="current-month-display"
              className="font-bold text-[#181C1A]"
            >
              {getDisplayMonth()}
            </span>
          </div>
          {useHebrewDates && (
            <p 
              data-testid="month-bounds-display"
              className="text-xs text-[#68706B] mt-1"
            >
              {getMonthBoundsDisplay()}
            </p>
          )}
        </div>
        
        <button
          data-testid="next-month-btn"
          onClick={handleNextMonth}
          className="p-2 text-[#68706B] hover:text-[#181C1A] hover:bg-black/5 rounded-xl transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
