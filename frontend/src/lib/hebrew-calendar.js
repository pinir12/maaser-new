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
 * Navigate to next/previous Hebrew month
 * @param {number} currentMonth - Current Hebrew month
 * @param {number} currentYear - Current Hebrew year
 * @param {number} direction - 1 for next, -1 for previous
 * @returns {Object} New month and year
 */
export function navigateHebrewMonth(currentMonth, currentYear, direction) {
  const isLeapYear = HDate.isLeapYear(currentYear);
  const maxMonth = isLeapYear ? 13 : 12;
  
  let newMonth = currentMonth + direction;
  let newYear = currentYear;
  
  if (newMonth > maxMonth) {
    newMonth = 1;
    newYear++;
  } else if (newMonth < 1) {
    newYear--;
    newMonth = HDate.isLeapYear(newYear) ? 13 : 12;
  }
  
  return { month: newMonth, year: newYear };
}
