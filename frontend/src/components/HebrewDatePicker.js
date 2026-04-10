import { useState, useMemo, useRef } from 'react';
import { HDate, months } from '@hebcal/core';
import { getHebrewMonths } from '../lib/hebrew-calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function HebrewDatePicker({ value, onChange }) {
  const todayRef = useRef(new HDate());
  const today = todayRef.current;
  const initial = value ? new HDate(new Date(value)) : today;
  
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [selectedDate, setSelectedDate] = useState(value || null);

  const monthList = useMemo(() => getHebrewMonths(viewYear), [viewYear]);
  const currentMonthName = useMemo(() => {
    try {
      const hd = new HDate(1, viewMonth, viewYear);
      return hd.getMonthName();
    } catch {
      return `Month ${viewMonth}`;
    }
  }, [viewMonth, viewYear]);

  const daysInMonth = useMemo(() => {
    try {
      return HDate.daysInMonth(viewMonth, viewYear);
    } catch {
      return 30;
    }
  }, [viewMonth, viewYear]);

  const days = useMemo(() => {
    const result = [];
    for (let d = 1; d <= daysInMonth; d++) {
      try {
        const hd = new HDate(d, viewMonth, viewYear);
        const greg = hd.greg();
        result.push({
          hebrewDay: d,
          gregorian: greg,
          isoDate: greg.toISOString().split('T')[0],
          isToday: hd.isSameDate(today)
        });
      } catch {
        // skip invalid dates
      }
    }
    return result;
  }, [viewMonth, viewYear, daysInMonth, today]);

  // Get day of week for the first day to align the grid
  const firstDayOfWeek = days.length > 0 ? days[0].gregorian.getDay() : 0;

  const handlePrevMonth = () => {
    const isLeap = HDate.isLeapYear(viewYear);
    const maxMonth = isLeap ? 13 : 12;
    if (viewMonth <= 1) {
      setViewYear(viewYear - 1);
      const prevLeap = HDate.isLeapYear(viewYear - 1);
      setViewMonth(prevLeap ? 13 : 12);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const isLeap = HDate.isLeapYear(viewYear);
    const maxMonth = isLeap ? 13 : 12;
    if (viewMonth >= maxMonth) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelect = (day) => {
    setSelectedDate(day.isoDate);
    onChange(day.isoDate);
  };

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div data-testid="hebrew-date-picker" className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-full max-w-[300px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 text-slate-400 hover:text-slate-600 rounded"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <span className="font-semibold text-slate-900 text-sm">{currentMonthName}</span>
          <span className="text-slate-500 text-sm ml-1">{viewYear}</span>
        </div>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 text-slate-400 hover:text-slate-600 rounded"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Month quick select */}
      <div className="mb-3">
        <select
          value={viewMonth}
          onChange={e => setViewMonth(Number(e.target.value))}
          className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
        >
          {monthList.map(m => (
            <option key={m.value} value={m.value}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {weekDays.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-slate-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Empty cells for alignment */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map(day => {
          const isSelected = selectedDate === day.isoDate;
          return (
            <button
              key={day.hebrewDay}
              type="button"
              data-testid={`hebrew-day-${day.hebrewDay}`}
              onClick={() => handleSelect(day)}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all
                ${isSelected
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : day.isToday
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-slate-700 hover:bg-blue-50'
                }
              `}
            >
              <span className="leading-none">{day.hebrewDay}</span>
              <span className={`text-[8px] leading-none mt-0.5 ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                {day.gregorian.getDate()}/{day.gregorian.getMonth() + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
