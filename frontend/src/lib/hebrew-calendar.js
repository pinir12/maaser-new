import { HDate, HebrewCalendar, months } from '@hebcal/core';

/**
 * Convert a Gregorian date to Hebrew date
 * @param {Date} date - Gregorian date
 * @returns {Object} Hebrew date info
 */
export function toHebrewDate(date) {
  const hd = new HDate(date);
  return {
    day: hd.getDate(),
    month: hd.getMonth(),
    monthName: hd.getMonthName(),
    year: hd.getFullYear(),
    display: hd.render('he'),
    displayEn: hd.render('en'),
    hdate: hd
  };
}

/**
 * Get Hebrew month bounds (start and end dates in Gregorian)
 * @param {number} year - Hebrew year
 * @param {number} month - Hebrew month (1-based, Nisan=1 in traditional, but HDate uses Tishrei=1)
 * @returns {Object} Start and end Gregorian dates
 */
export function getHebrewMonthBounds(year, month) {
  // Get first day of the Hebrew month
  const startHd = new HDate(1, month, year);
  const startGregorian = startHd.greg();
  
  // Get the number of days in this month
  const daysInMonth = HDate.daysInMonth(month, year);
  
  // Get last day of the Hebrew month
  const endHd = new HDate(daysInMonth, month, year);
  const endGregorian = endHd.greg();
  
  return {
    start: startGregorian,
    end: endGregorian,
    startHebrew: startHd.render('he'),
    endHebrew: endHd.render('he'),
    monthName: startHd.getMonthName(),
    daysInMonth
  };
}

/**
 * Get Gregorian date bounds for a full Hebrew year
 */
export function getHebrewYearBounds(hebrewYear) {
  // Hebrew year starts on 1 Tishrei and ends on 29 Elul
  const startHd = new HDate(1, 7, hebrewYear); // Tishrei = month 7 in @hebcal/core
  const isLeap = HDate.isLeapYear(hebrewYear);
  const lastMonth = isLeap ? 13 : 12;
  // End of Elul (month 6 in the civil calendar ordering, but we need the actual last day)
  // Actually, Elul is month 6, last day is 29
  const endHd = new HDate(29, 6, hebrewYear);
  return {
    start: startHd.greg(),
    end: endHd.greg()
  };
}


/**
 * Get current Hebrew month info
 * @returns {Object} Current Hebrew month details
 */
export function getCurrentHebrewMonth() {
  const today = new HDate();
  return {
    day: today.getDate(),
    month: today.getMonth(),
    monthName: today.getMonthName(),
    year: today.getFullYear()
  };
}

/**
 * Get all Hebrew months for a given year
 * @param {number} year - Hebrew year
 * @returns {Array} Array of month objects
 */
export function getHebrewMonths(year) {
  const isLeapYear = HDate.isLeapYear(year);
  const monthList = [
    { value: months.TISHREI, name: 'Tishrei' },
    { value: months.CHESHVAN, name: 'Cheshvan' },
    { value: months.KISLEV, name: 'Kislev' },
    { value: months.TEVET, name: 'Tevet' },
    { value: months.SHVAT, name: 'Shvat' },
  ];
  
  if (isLeapYear) {
    monthList.push({ value: months.ADAR_I, name: 'Adar I' });
    monthList.push({ value: months.ADAR_II, name: 'Adar II' });
  } else {
    monthList.push({ value: months.ADAR_I, name: 'Adar' });
  }
  
  monthList.push(
    { value: months.NISAN, name: 'Nisan' },
    { value: months.IYAR, name: 'Iyar' },
    { value: months.SIVAN, name: 'Sivan' },
    { value: months.TAMUZ, name: 'Tamuz' },
    { value: months.AV, name: 'Av' },
    { value: months.ELUL, name: 'Elul' }
  );
  
  return monthList;
}

/**
 * Format Hebrew date for display
 * @param {Date|string} date - Date to format
 * @param {string} locale - 'he' or 'en'
 * @returns {string} Formatted Hebrew date
 */
export function formatHebrewDate(date, locale = 'en') {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hd = new HDate(d);
  return hd.render(locale);
}

/**
 * Navigate Hebrew months chronologically.
 * Hebrew chronological order: Tishrei(7) -> Cheshvan(8) -> Kislev(9) -> Tevet(10)
 * -> Shevat(11) -> Adar I(12) -> [Adar II(13)] -> Nisan(1) -> Iyar(2) -> Sivan(3)
 * -> Tammuz(4) -> Av(5) -> Elul(6)
 * Year increments at Tishrei(7), decrements going back past Tishrei to Elul(6).
 */
export function navigateHebrewMonth(currentMonth, currentYear, direction) {
  const isLeap = HDate.isLeapYear(currentYear);
  const order = isLeap
    ? [7, 8, 9, 10, 11, 12, 13, 1, 2, 3, 4, 5, 6]
    : [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

  const idx = order.indexOf(currentMonth);
  if (idx === -1) return { month: currentMonth, year: currentYear };

  const newIdx = idx + direction;

  if (newIdx >= order.length) {
    // Past Elul -> go to Tishrei of next year
    return { month: 7, year: currentYear + 1 };
  }
  if (newIdx < 0) {
    // Before Tishrei -> go to Elul of previous year
    return { month: 6, year: currentYear - 1 };
  }
  return { month: order[newIdx], year: currentYear };
}
