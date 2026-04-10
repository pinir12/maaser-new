(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/node_modules/@hebcal/hdate/dist/esm/greg.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "abs2greg",
    ()=>abs2greg,
    "daysInGregMonth",
    ()=>daysInGregMonth,
    "greg2abs",
    ()=>greg2abs,
    "isDate",
    ()=>isDate,
    "isGregLeapYear",
    ()=>isGregLeapYear
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_type_of$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@swc/helpers/esm/_type_of.js [app-client] (ecmascript)");
;
/*! @hebcal/hdate v0.21.1, distributed under GPLv2 https://www.gnu.org/licenses/gpl-2.0.txt */ /* eslint-disable @typescript-eslint/no-namespace, no-inner-declarations */ /** @private */ var lengths = [
    0,
    31,
    28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
];
/** @private */ var monthLengths = [
    lengths,
    lengths.slice()
];
monthLengths[1][2] = 29;
/**
 * @private
 */ function mod(x, y) {
    return x - y * Math.floor(x / y);
}
/**
 * @private
 */ function quotient(x, y) {
    return Math.floor(x / y);
}
/**
 * @private
 * @param abs - R.D. number of days
 */ function yearFromFixed(abs) {
    var l0 = abs - 1;
    var n400 = quotient(l0, 146097);
    var d1 = mod(l0, 146097);
    var n100 = quotient(d1, 36524);
    var d2 = mod(d1, 36524);
    var n4 = quotient(d2, 1461);
    var d3 = mod(d2, 1461);
    var n1 = quotient(d3, 365);
    var year = 400 * n400 + 100 * n100 + 4 * n4 + n1;
    return n100 !== 4 && n1 !== 4 ? year + 1 : year;
}
/*
const ABS_14SEP1752 = 639797;
const ABS_2SEP1752 = 639785;
*/ /*
 * Formerly in namespace, now top-level
 */ /**
 * Returns true if the Gregorian year is a leap year
 * @param year Gregorian year
 */ function isGregLeapYear(year) {
    return !(year % 4) && (!!(year % 100) || !(year % 400));
}
/**
 * Number of days in the Gregorian month for given year
 * @param month Gregorian month (1=January, 12=December)
 * @param year Gregorian year
 */ function daysInGregMonth(month, year) {
    // 1 based months
    return monthLengths[+isGregLeapYear(year)][month];
}
/**
 * Returns true if the object is a Javascript Date
 */ function isDate(obj) {
    // eslint-disable-next-line no-prototype-builtins
    return (typeof obj === "undefined" ? "undefined" : (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_type_of$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(obj)) === 'object' && Date.prototype.isPrototypeOf(obj);
}
/**
 * @private
 * @param year
 * @param month (1-12)
 * @param day (1-31)
 */ function toFixed(year, month, day) {
    var py = year - 1;
    return 365 * py + quotient(py, 4) - quotient(py, 100) + quotient(py, 400) + quotient(367 * month - 362, 12) + (month <= 2 ? 0 : isGregLeapYear(year) ? -1 : -2) + day;
}
/**
 * Converts Gregorian date to absolute R.D. (Rata Die) days
 * @param date Gregorian date
 */ function greg2abs(date) {
    if (!isDate(date)) {
        throw new TypeError("not a Date: ".concat(date));
    } else if (isNaN(date.getTime())) {
        throw new RangeError('Invalid Date');
    }
    var abs = toFixed(date.getFullYear(), date.getMonth() + 1, date.getDate());
    /*
      if (abs < ABS_14SEP1752 && abs > ABS_2SEP1752) {
        throw new RangeError(`Invalid Date: ${date}`);
      }
      */ return abs;
}
/**
 * Converts from Rata Die (R.D. number) to Gregorian date.
 * See the footnote on page 384 of ``Calendrical Calculations, Part II:
 * Three Historical Calendars'' by E. M. Reingold,  N. Dershowitz, and S. M.
 * Clamen, Software--Practice and Experience, Volume 23, Number 4
 * (April, 1993), pages 383-404 for an explanation.
 *
 * Note that this function returns the daytime portion of the date.
 * For example, the 15th of Cheshvan 5769 began at sundown on
 * 12 November 2008 and continues through 13 November 2008. This
 * function would return only the date 13 November 2008.
 * @param abs - R.D. number of days
 * @example
 * const abs = hebrew2abs(5769, months.CHESHVAN, 15);
 * const date = abs2greg(abs); // 13 November 2008
 * const year = date.getFullYear(); // 2008
 * const monthNum = date.getMonth() + 1; // 11
 * const day = date.getDate(); // 13
 */ function abs2greg(abs) {
    if (typeof abs !== 'number' || isNaN(abs)) {
        throw new TypeError("not a Number: ".concat(abs));
    }
    abs = Math.trunc(abs);
    /*
      if (abs < ABS_14SEP1752 && abs > ABS_2SEP1752) {
        throw new RangeError(`Invalid Date: ${abs}`);
      }
      */ var year = yearFromFixed(abs);
    var priorDays = abs - toFixed(year, 1, 1);
    var correction = abs < toFixed(year, 3, 1) ? 0 : isGregLeapYear(year) ? 1 : 2;
    var month = quotient(12 * (priorDays + correction) + 373, 367);
    var day = abs - toFixed(year, month, 1) + 1;
    var dt = new Date(year, month - 1, day);
    if (year < 100 && year >= 0) {
        dt.setFullYear(year);
    }
    return dt;
}
;
}),
"[project]/frontend/node_modules/@hebcal/hdate/dist/esm/gregNamespace.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "greg",
    ()=>greg
]);
/*! @hebcal/hdate v0.21.1, distributed under GPLv2 https://www.gnu.org/licenses/gpl-2.0.txt */ var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$greg$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/greg.js [app-client] (ecmascript)");
;
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-namespace */ /**
 * Gregorian date helper functions
 */ var greg;
(function(greg) {})(greg || (greg = {}));
greg.abs2greg = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$greg$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["abs2greg"];
greg.daysInMonth = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$greg$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["daysInGregMonth"];
greg.greg2abs = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$greg$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["greg2abs"];
greg.isDate = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$greg$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isDate"];
greg.isLeapYear = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$greg$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isGregLeapYear"];
;
}),
"[project]/frontend/node_modules/@hebcal/hdate/dist/esm/hebrewStripNikkud.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "hebrewStripNikkud",
    ()=>hebrewStripNikkud
]);
/*! @hebcal/hdate v0.21.1, distributed under GPLv2 https://www.gnu.org/licenses/gpl-2.0.txt */ /**
 * Removes niqqud from Hebrew string
 */ function hebrewStripNikkud(str) {
    var a = str.normalize();
    // now strip out niqqud and trope
    return a.replace(/[\u0590-\u05bd]/g, '').replace(/[\u05bf-\u05c7]/g, '');
}
;
}),
"[project]/frontend/node_modules/@hebcal/hdate/dist/esm/hdateBase.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "abs2hebrew",
    ()=>abs2hebrew,
    "daysInMonth",
    ()=>daysInMonth,
    "daysInYear",
    ()=>daysInYear,
    "elapsedDays",
    ()=>elapsedDays,
    "getMonthName",
    ()=>getMonthName,
    "hd2abs",
    ()=>hd2abs,
    "hebrew2abs",
    ()=>hebrew2abs,
    "isLeapYear",
    ()=>isLeapYear,
    "longCheshvan",
    ()=>longCheshvan,
    "monthFromName",
    ()=>monthFromName,
    "months",
    ()=>months,
    "monthsInYear",
    ()=>monthsInYear,
    "shortKislev",
    ()=>shortKislev
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_to_consumable_array$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@swc/helpers/esm/_to_consumable_array.js [app-client] (ecmascript)");
/*! @hebcal/hdate v0.21.1, distributed under GPLv2 https://www.gnu.org/licenses/gpl-2.0.txt */ var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hebrewStripNikkud$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/hebrewStripNikkud.js [app-client] (ecmascript)");
;
;
/*
 * More minimal HDate
 */ var NISAN = 1;
var IYYAR = 2;
var SIVAN = 3;
var TAMUZ = 4;
var AV = 5;
var ELUL = 6;
var TISHREI = 7;
var CHESHVAN = 8;
var KISLEV = 9;
var TEVET = 10;
var SHVAT = 11;
var ADAR_I = 12;
var ADAR_II = 13;
/**
 * Hebrew months of the year (NISAN=1, TISHREI=7)
 * @readonly
 * @enum {number}
 */ var months = {
    /** Nissan / ניסן */ NISAN: NISAN,
    /** Iyyar / אייר */ IYYAR: IYYAR,
    /** Sivan / סיון */ SIVAN: SIVAN,
    /** Tamuz (sometimes Tammuz) / תמוז */ TAMUZ: TAMUZ,
    /** Av / אב */ AV: AV,
    /** Elul / אלול */ ELUL: ELUL,
    /** Tishrei / תִּשְׁרֵי */ TISHREI: TISHREI,
    /** Cheshvan / חשון */ CHESHVAN: CHESHVAN,
    /** Kislev / כסלו */ KISLEV: KISLEV,
    /** Tevet / טבת */ TEVET: TEVET,
    /** Sh'vat / שבט */ SHVAT: SHVAT,
    /** Adar or Adar Rishon / אדר */ ADAR_I: ADAR_I,
    /** Adar Sheini (only on leap years) / אדר ב׳ */ ADAR_II: ADAR_II
};
var NISAN_STR = 'Nisan';
var monthNames0 = [
    '',
    NISAN_STR,
    'Iyyar',
    'Sivan',
    'Tamuz',
    'Av',
    'Elul',
    'Tishrei',
    'Cheshvan',
    'Kislev',
    'Tevet',
    "Sh'vat"
];
/*
 * Transliterations of Hebrew month names.
 * Regular years are index 0 and leap years are index 1.
 * @private
 */ var monthNames = [
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_to_consumable_array$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(monthNames0).concat([
        'Adar',
        NISAN_STR
    ]),
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_to_consumable_array$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(monthNames0).concat([
        'Adar I',
        'Adar II',
        NISAN_STR
    ])
];
var edCache = new Map();
var EPOCH = -1373428;
// Avg year length in the cycle (19 solar years with 235 lunar months)
var AVG_HEBYEAR_DAYS = 365.24682220597794;
/**
 * @private
 */ function assertNumber(n, name) {
    if (typeof n !== 'number' || isNaN(n)) {
        throw new TypeError("param '".concat(name, "' not a number: ").concat(n));
    }
}
/**
 * Converts Hebrew date to R.D. (Rata Die) fixed days.
 * R.D. 1 is the imaginary date Monday, January 1, 1 on the Gregorian
 * Calendar.
 * @param year Hebrew year
 * @param month Hebrew month
 * @param day Hebrew date (1-30)
 * @example
 * const abs = hebrew2abs(5769, months.CHESHVAN, 15);
 */ function hebrew2abs(year, month, day) {
    assertNumber(year, 'year');
    assertNumber(month, 'month');
    assertNumber(day, 'day');
    if (year < 1) {
        throw new RangeError("hebrew2abs: invalid year ".concat(year));
    }
    var tempabs = day;
    if (month < TISHREI) {
        for(var m = TISHREI; m <= monthsInYear(year); m++){
            tempabs += daysInMonth(m, year);
        }
        for(var m1 = NISAN; m1 < month; m1++){
            tempabs += daysInMonth(m1, year);
        }
    } else {
        for(var m2 = TISHREI; m2 < month; m2++){
            tempabs += daysInMonth(m2, year);
        }
    }
    return EPOCH + elapsedDays(year) + tempabs - 1;
}
/**
 * Converts Hebrew date to R.D. (Rata Die) fixed days.
 * R.D. 1 is the imaginary date Monday, January 1, 1 on the Gregorian
 * Calendar.
 */ function hd2abs(hdate) {
    return hebrew2abs(hdate.yy, hdate.mm, hdate.dd);
}
/**
 * @private
 */ function newYear(year) {
    return EPOCH + elapsedDays(year);
}
/**
 * Converts absolute R.D. days to Hebrew date
 * @param abs absolute R.D. days
 */ function abs2hebrew(abs) {
    assertNumber(abs, 'abs');
    abs = Math.trunc(abs);
    if (abs <= EPOCH) {
        throw new RangeError("abs2hebrew: ".concat(abs, " is before epoch"));
    }
    // first, quickly approximate year
    var year = Math.floor((abs - EPOCH) / AVG_HEBYEAR_DAYS);
    while(newYear(year) <= abs){
        ++year;
    }
    --year;
    var month = abs < hebrew2abs(year, 1, 1) ? 7 : 1;
    while(abs > hebrew2abs(year, month, daysInMonth(month, year))){
        ++month;
    }
    var day = 1 + abs - hebrew2abs(year, month, 1);
    return {
        yy: year,
        mm: month,
        dd: day
    };
}
/**
 * Returns true if Hebrew year is a leap year
 * @param year Hebrew year
 */ function isLeapYear(year) {
    return (1 + year * 7) % 19 < 7;
}
/**
 * Number of months in this Hebrew year (either 12 or 13 depending on leap year)
 * @param year Hebrew year
 */ function monthsInYear(year) {
    return 12 + +isLeapYear(year); // boolean is cast to 1 or 0
}
/**
 * Number of days in Hebrew month in a given year (29 or 30)
 * @param month Hebrew month (e.g. months.TISHREI)
 * @param year Hebrew year
 */ function daysInMonth(month, year) {
    switch(month){
        case IYYAR:
        case TAMUZ:
        case ELUL:
        case TEVET:
        case ADAR_II:
            return 29;
    }
    if (month === ADAR_I && !isLeapYear(year) || month === CHESHVAN && !longCheshvan(year) || month === KISLEV && shortKislev(year)) {
        return 29;
    } else {
        return 30;
    }
}
/**
 * Returns a transliterated string name of Hebrew month in year,
 * for example 'Elul' or 'Cheshvan'.
 * @param month Hebrew month (e.g. months.TISHREI)
 * @param year Hebrew year
 */ function getMonthName(month, year) {
    assertNumber(month, 'month');
    assertNumber(year, 'year');
    if (month < 1 || month > 14) {
        throw new TypeError("bad monthNum: ".concat(month));
    }
    return monthNames[+isLeapYear(year)][month];
}
/**
 * Days from sunday prior to start of Hebrew calendar to mean
 * conjunction of Tishrei in Hebrew YEAR
 * @param year Hebrew year
 */ function elapsedDays(year) {
    var n = edCache.get(year);
    if (typeof n === 'number') {
        return n;
    }
    var elapsed = elapsedDays0(year);
    edCache.set(year, elapsed);
    return elapsed;
}
/**
 * Days from sunday prior to start of Hebrew calendar to mean
 * conjunction of Tishrei in Hebrew YEAR
 * @private
 * @param year Hebrew year
 */ function elapsedDays0(year) {
    var prevYear = year - 1;
    var mElapsed = 235 * Math.floor(prevYear / 19) + // Months in complete 19 year lunar (Metonic) cycles so far
    12 * (prevYear % 19) + // Regular months in this cycle
    Math.floor((prevYear % 19 * 7 + 1) / 19); // Leap months this cycle
    var pElapsed = 204 + 793 * (mElapsed % 1080);
    var hElapsed = 5 + 12 * mElapsed + 793 * Math.floor(mElapsed / 1080) + Math.floor(pElapsed / 1080);
    var parts = pElapsed % 1080 + 1080 * (hElapsed % 24);
    var day = 1 + 29 * mElapsed + Math.floor(hElapsed / 24);
    var altDay = day;
    if (parts >= 19440 || 2 === day % 7 && parts >= 9924 && !isLeapYear(year) || 1 === day % 7 && parts >= 16789 && isLeapYear(prevYear)) {
        altDay++;
    }
    if (altDay % 7 === 0 || altDay % 7 === 3 || altDay % 7 === 5) {
        return altDay + 1;
    } else {
        return altDay;
    }
}
/**
 * Number of days in the hebrew YEAR.
 * A common Hebrew calendar year can have a length of 353, 354 or 355 days
 * A leap Hebrew calendar year can have a length of 383, 384 or 385 days
 * @param year Hebrew year
 */ function daysInYear(year) {
    return elapsedDays(year + 1) - elapsedDays(year);
}
/**
 * true if Cheshvan is long in Hebrew year
 * @param year Hebrew year
 */ function longCheshvan(year) {
    return daysInYear(year) % 10 === 5;
}
/**
 * true if Kislev is short in Hebrew year
 * @param year Hebrew year
 */ function shortKislev(year) {
    return daysInYear(year) % 10 === 3;
}
/**
 * Converts Hebrew month string name to numeric
 * @param monthName monthName
 */ function monthFromName(monthName) {
    if (typeof monthName === 'number') {
        if (isNaN(monthName) || monthName < 1 || monthName > 14) {
            throw new RangeError("bad monthName: ".concat(monthName));
        }
        return monthName;
    }
    var c = monthName.trim().toLowerCase();
    // remove all niqud and trailing gershayim (for Adar Alef/Bet)
    c = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hebrewStripNikkud$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hebrewStripNikkud"])(c).replace(/׳$/, '');
    // If Hebrew month starts with a bet (for example `בתמוז`) then ignore it
    if (c[0] === 'ב') {
        c = c.substring(1);
    }
    /*
    the Hebrew months are unique to their second letter
    N         Nisan  (November?)
    I         Iyyar
    E        Elul
    C        Cheshvan
    K        Kislev
    1        1Adar
    2        2Adar
    Si Sh     Sivan, Shvat
    Ta Ti Te Tamuz, Tishrei, Tevet
    Av Ad    Av, Adar
  
    אב אד אי אל   אב אדר אייר אלול
    ח            חשון
    ט            טבת
    כ            כסלו
    נ            ניסן
    ס            סיון
    ש            שבט
    תמ תש        תמוז תשרי
    */ switch(c[0]){
        case 'n':
        case 'נ':
            if (c[1] === 'o') {
                break; /* this catches "november" */ 
            }
            return NISAN;
        case 'i':
            return IYYAR;
        case 'e':
            return ELUL;
        case 'c':
        case 'ח':
            return CHESHVAN;
        case 'k':
        case 'כ':
            return KISLEV;
        case 's':
            switch(c[1]){
                case 'i':
                    return SIVAN;
                case 'h':
                    return SHVAT;
            }
            break;
        case 't':
            switch(c[1]){
                case 'a':
                    return TAMUZ;
                case 'i':
                    return TISHREI;
                case 'e':
                    return TEVET;
            }
            break;
        case 'a':
            switch(c[1]){
                case 'v':
                    return AV;
                case 'd':
                    if (/(1|[^i]i|a|א)$/i.test(c)) {
                        return ADAR_I;
                    }
                    return ADAR_II; // else assume sheini
            }
            break;
        case 'ס':
            return SIVAN;
        case 'ט':
            return TEVET;
        case 'ש':
            return SHVAT;
        case 'א':
            switch(c[1]){
                case 'ב':
                    return AV;
                case 'ד':
                    if (/(1|[^i]i|a|א)$/i.test(c)) {
                        return ADAR_I;
                    }
                    return ADAR_II; // else assume sheini
                case 'י':
                    return IYYAR;
                case 'ל':
                    return ELUL;
            }
            break;
        case 'ת':
            switch(c[1]){
                case 'מ':
                    return TAMUZ;
                case 'ש':
                    return TISHREI;
            }
            break;
    }
    throw new RangeError("bad monthName: ".concat(monthName));
}
;
}),
"[project]/frontend/node_modules/@hebcal/hdate/dist/esm/anniversary.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getBirthdayHD",
    ()=>getBirthdayHD,
    "getBirthdayOrAnniversary",
    ()=>getBirthdayOrAnniversary,
    "getYahrzeit",
    ()=>getYahrzeit,
    "getYahrzeitHD",
    ()=>getYahrzeitHD
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_type_of$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@swc/helpers/esm/_type_of.js [app-client] (ecmascript)");
/*! @hebcal/hdate v0.21.1, distributed under GPLv2 https://www.gnu.org/licenses/gpl-2.0.txt */ var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/hdateBase.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$greg$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/greg.js [app-client] (ecmascript)");
;
;
;
var NISAN = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["months"].NISAN;
var CHESHVAN = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["months"].CHESHVAN;
var KISLEV = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["months"].KISLEV;
var TEVET = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["months"].TEVET;
var SHVAT = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["months"].SHVAT;
var ADAR_I = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["months"].ADAR_I;
var ADAR_II = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["months"].ADAR_II;
/**
 * Returns true if the object is a SimpleHebrewDate
 * @private
 */ function isSimpleHebrewDate(obj) {
    return (typeof obj === "undefined" ? "undefined" : (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_type_of$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(obj)) === 'object' && obj !== null && typeof obj.yy === 'number' && typeof obj.mm === 'number' && typeof obj.dd === 'number';
}
/**
 * @private
 */ function toSimpleHebrewDate(obj) {
    if (isSimpleHebrewDate(obj)) {
        return obj;
    } else if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$greg$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isDate"])(obj)) {
        var abs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$greg$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["greg2abs"])(obj);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["abs2hebrew"])(abs);
    } else {
        // typeof obj === 'number'
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["abs2hebrew"])(obj);
    }
}
/**
 * Calculates yahrzeit.
 * `hyear` must be after original `date` of death.
 * Returns `undefined` when requested year preceeds or is same as original year.
 *
 * Hebcal uses the algorithm defined in "Calendrical Calculations"
 * by Edward M. Reingold and Nachum Dershowitz.
 *
 * The customary anniversary date of a death is more complicated and depends
 * also on the character of the year in which the first anniversary occurs.
 * There are several cases:
 *
 * * If the date of death is Marcheshvan 30, the anniversary in general depends
 *   on the first anniversary; if that first anniversary was not Marcheshvan 30,
 *   use the day before Kislev 1.
 * * If the date of death is Kislev 30, the anniversary in general again depends
 *   on the first anniversary — if that was not Kislev 30, use the day before
 *   Tevet 1.
 * * If the date of death is Adar II, the anniversary is the same day in the
 *   last month of the Hebrew year (Adar or Adar II).
 * * If the date of death is Adar I 30, the anniversary in a Hebrew year that
 *   is not a leap year (in which Adar only has 29 days) is the last day in
 *   Shevat.
 * * In all other cases, use the normal (that is, same month number) anniversary
 *   of the date of death. [Calendrical Calculations p. 113]
 * @example
 * import {getYahrzeit} from '@hebcal/hdate';
 * const dt = new Date(2014, 2, 2); // '2014-03-02' == '30 Adar I 5774'
 * const anniversary = getYahrzeit(5780, dt); // '2/25/2020' == '30 Sh\'vat 5780'
 * @param hyear Hebrew year
 * @param date Gregorian or Hebrew date of death
 * @returns anniversary occurring in `hyear`
 */ function getYahrzeit(hyear, date) {
    var hd = getYahrzeitHD(hyear, date);
    if (typeof hd === 'undefined') {
        return hd;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$greg$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["abs2greg"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hebrew2abs"])(hd.yy, hd.mm, hd.dd));
}
function getYahrzeitHD(hyear, date) {
    var hDeath = toSimpleHebrewDate(date);
    if (hyear <= hDeath.yy) {
        // Hebrew year ${hyear} occurs on or before original date in ${hDeath.yy}
        return undefined;
    }
    if (hDeath.mm === CHESHVAN && hDeath.dd === 30 && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["longCheshvan"])(hDeath.yy + 1)) {
        // If it's Heshvan 30 it depends on the first anniversary;
        // if that was not Heshvan 30, use the day before Kislev 1.
        hDeath = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["abs2hebrew"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hebrew2abs"])(hyear, KISLEV, 1) - 1);
    } else if (hDeath.mm === KISLEV && hDeath.dd === 30 && (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shortKislev"])(hDeath.yy + 1)) {
        // If it's Kislev 30 it depends on the first anniversary;
        // if that was not Kislev 30, use the day before Teveth 1.
        hDeath = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["abs2hebrew"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hebrew2abs"])(hyear, TEVET, 1) - 1);
    } else if (hDeath.mm === ADAR_II) {
        // If it's Adar II, use the same day in last month of year (Adar or Adar II).
        hDeath.mm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["monthsInYear"])(hyear);
    } else if (hDeath.mm === ADAR_I && hDeath.dd === 30 && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isLeapYear"])(hyear)) {
        // If it's the 30th in Adar I and year is not a leap year
        // (so Adar has only 29 days), use the last day in Shevat.
        hDeath.dd = 30;
        hDeath.mm = SHVAT;
    }
    // In all other cases, use the normal anniversary of the date of death.
    // advance day to rosh chodesh if needed
    if (hDeath.mm === CHESHVAN && hDeath.dd === 30 && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["longCheshvan"])(hyear)) {
        hDeath.mm = KISLEV;
        hDeath.dd = 1;
    } else if (hDeath.mm === KISLEV && hDeath.dd === 30 && (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shortKislev"])(hyear)) {
        hDeath.mm = TEVET;
        hDeath.dd = 1;
    }
    hDeath.yy = hyear;
    return hDeath;
}
/**
 * Calculates a birthday or anniversary (non-yahrzeit).
 * `hyear` must be after original `date` of anniversary.
 * Returns `undefined` when requested year preceeds or is same as original year.
 *
 * Hebcal uses the algorithm defined in "Calendrical Calculations"
 * by Edward M. Reingold and Nachum Dershowitz.
 *
 * The birthday of someone born in Adar of an ordinary year or Adar II of
 * a leap year is also always in the last month of the year, be that Adar
 * or Adar II. The birthday in an ordinary year of someone born during the
 * first 29 days of Adar I in a leap year is on the corresponding day of Adar;
 * in a leap year, the birthday occurs in Adar I, as expected.
 *
 * Someone born on the thirtieth day of Marcheshvan, Kislev, or Adar I
 * has his birthday postponed until the first of the following month in
 * years where that day does not occur. [Calendrical Calculations p. 111]
 * @example
 * import {getBirthdayOrAnniversary} from '@hebcal/hdate';
 * const dt = new Date(2014, 2, 2); // '2014-03-02' == '30 Adar I 5774'
 * const anniversary = getBirthdayOrAnniversary(5780, dt); // '3/26/2020' == '1 Nisan 5780'
 * @param hyear Hebrew year
 * @param date Gregorian or Hebrew date of event
 * @returns anniversary occurring in `hyear`
 */ function getBirthdayOrAnniversary(hyear, date) {
    var hd = getBirthdayHD(hyear, date);
    if (typeof hd === 'undefined') {
        return hd;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$greg$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["abs2greg"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hebrew2abs"])(hd.yy, hd.mm, hd.dd));
}
function getBirthdayHD(hyear, date) {
    var orig = toSimpleHebrewDate(date);
    var origYear = orig.yy;
    if (hyear === origYear) {
        return orig;
    } else if (hyear < origYear) {
        // Hebrew year ${hyear} occurs on or before original date in ${origYear}
        return undefined;
    }
    var isOrigLeap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isLeapYear"])(origYear);
    var month = orig.mm;
    var day = orig.dd;
    if (month === ADAR_I && !isOrigLeap || month === ADAR_II && isOrigLeap) {
        month = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["monthsInYear"])(hyear);
    } else if (month === CHESHVAN && day === 30 && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["longCheshvan"])(hyear)) {
        month = KISLEV;
        day = 1;
    } else if (month === KISLEV && day === 30 && (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shortKislev"])(hyear)) {
        month = TEVET;
        day = 1;
    } else if (month === ADAR_I && day === 30 && isOrigLeap && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isLeapYear"])(hyear)) {
        month = NISAN;
        day = 1;
    }
    return {
        yy: hyear,
        mm: month,
        dd: day
    };
}
;
}),
"[project]/frontend/node_modules/@hebcal/hdate/dist/esm/gematriya.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "gematriya",
    ()=>gematriya,
    "gematriyaStrToNum",
    ()=>gematriyaStrToNum
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_sliced_to_array$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@swc/helpers/esm/_sliced_to_array.js [app-client] (ecmascript)");
;
/*! @hebcal/hdate v0.21.1, distributed under GPLv2 https://www.gnu.org/licenses/gpl-2.0.txt */ var GERESH = '׳';
var GERSHAYIM = '״';
var heb2num = {
    א: 1,
    ב: 2,
    ג: 3,
    ד: 4,
    ה: 5,
    ו: 6,
    ז: 7,
    ח: 8,
    ט: 9,
    י: 10,
    כ: 20,
    ל: 30,
    מ: 40,
    נ: 50,
    ס: 60,
    ע: 70,
    פ: 80,
    צ: 90,
    ק: 100,
    ר: 200,
    ש: 300,
    ת: 400
};
var num2heb = {};
var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
try {
    for(var _iterator = Object.entries(heb2num)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
        var _step_value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_sliced_to_array$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(_step.value, 2), key = _step_value[0], val = _step_value[1];
        num2heb[val] = key;
    }
} catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
} finally{
    try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
        }
    } finally{
        if (_didIteratorError) {
            throw _iteratorError;
        }
    }
}
function num2digits(num) {
    var digits = [];
    while(num > 0){
        if (num === 15 || num === 16) {
            digits.push(9);
            digits.push(num - 9);
            break;
        }
        var incr = 100;
        var i = void 0;
        for(i = 400; i > num; i -= incr){
            if (i === incr) {
                incr = incr / 10;
            }
        }
        digits.push(i);
        num -= i;
    }
    return digits;
}
/**
 * Converts a numerical value to a string of Hebrew letters.
 *
 * When specifying years of the Hebrew calendar in the present millennium,
 * we omit the thousands (which is presently 5 [ה]).
 * @example
 * gematriya(5774) // 'תשע״ד' - cropped to 774
 * gematriya(25) // 'כ״ה'
 * gematriya(60) // 'ס׳'
 * gematriya(3761) // 'ג׳תשס״א'
 * gematriya(1123) // 'א׳קכ״ג'
 */ function gematriya(num) {
    var num1 = parseInt(num, 10);
    if (!num1 || num1 < 0) {
        throw new TypeError("invalid number: ".concat(num));
    }
    var str = '';
    var thousands = Math.floor(num1 / 1000);
    if (thousands > 0 && thousands !== 5) {
        var tdigits = num2digits(thousands);
        var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
        try {
            for(var _iterator = tdigits[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                var tdig = _step.value;
                str += num2heb[tdig];
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally{
            try {
                if (!_iteratorNormalCompletion && _iterator.return != null) {
                    _iterator.return();
                }
            } finally{
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
        str += GERESH;
    }
    var digits = num2digits(num1 % 1000);
    if (digits.length === 1) {
        return str + num2heb[digits[0]] + GERESH;
    }
    for(var i = 0; i < digits.length; i++){
        if (i + 1 === digits.length) {
            str += GERSHAYIM;
        }
        str += num2heb[digits[i]];
    }
    return str;
}
/**
 * Converts a string of Hebrew letters to a numerical value.
 *
 * Only considers the value of Hebrew letters `א` through `ת`.
 * Ignores final Hebrew letters such as `ך` (kaf sofit) or `ם` (mem sofit)
 * and vowels (nekudot).
 */ function gematriyaStrToNum(str) {
    var num = 0;
    var gereshIdx = str.indexOf(GERESH);
    if (gereshIdx !== -1 && gereshIdx !== str.length - 1) {
        var thousands = str.substring(0, gereshIdx);
        num += gematriyaStrToNum(thousands) * 1000;
        str = str.substring(gereshIdx);
    }
    var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
    try {
        for(var _iterator = str[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
            var ch = _step.value;
            var n = heb2num[ch];
            if (typeof n === 'number') {
                num += n;
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally{
        try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
            }
        } finally{
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
    return num;
}
;
}),
"[project]/frontend/node_modules/@hebcal/hdate/dist/esm/molad.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "molad",
    ()=>molad
]);
/*! @hebcal/hdate v0.21.1, distributed under GPLv2 https://www.gnu.org/licenses/gpl-2.0.txt */ var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/hdateBase.js [app-client] (ecmascript)");
;
/**
 * Calculates the molad for a Hebrew month
 */ function molad(year, month) {
    var m_adj = month - 7;
    if (m_adj < 0) {
        m_adj += (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["monthsInYear"])(year);
    }
    var mElapsed = 235 * Math.floor((year - 1) / 19) + // Months in complete 19 year lunar (Metonic) cycles so far
    12 * ((year - 1) % 19) + // Regular months in this cycle
    Math.floor((7 * ((year - 1) % 19) + 1) / 19) + // Leap months this cycle
    m_adj; // add elapsed months till the start of the molad of the month
    var pElapsed = 204 + Math.floor(793 * (mElapsed % 1080));
    var hElapsed = 5 + 12 * mElapsed + 793 * Math.floor(mElapsed / 1080) + Math.floor(pElapsed / 1080) - 6;
    var parts = pElapsed % 1080 + 1080 * (hElapsed % 24);
    var chalakim = parts % 1080;
    var day = 1 + 29 * mElapsed + Math.floor(hElapsed / 24);
    return {
        year: year,
        month: month,
        dayOfWeek: day % 7,
        hour: hElapsed % 24,
        minutes: Math.floor(chalakim / 18),
        chalakim: chalakim % 18
    };
}
;
}),
"[project]/frontend/node_modules/@hebcal/hdate/dist/esm/pad.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "pad2",
    ()=>pad2,
    "pad4",
    ()=>pad4
]);
/*! @hebcal/hdate v0.21.1, distributed under GPLv2 https://www.gnu.org/licenses/gpl-2.0.txt */ /**
 * Formats a number with leading zeros so the resulting string is 4 digits long.
 * Similar to `string.padStart(4, '0')` but will also format
 * negative numbers similar to how the JavaScript date formats
 * negative year numbers (e.g. `-37` is formatted as `-000037`).
 */ function pad4(num) {
    if (num < 0) {
        return '-00' + pad4(-num);
    } else if (num < 10) {
        return '000' + num;
    } else if (num < 100) {
        return '00' + num;
    } else if (num < 1000) {
        return '0' + num;
    }
    return String(num);
}
/**
 * Formats a number with leading zeros so the resulting string is 2 digits long.
 * Similar to `string.padStart(2, '0')`.
 */ function pad2(num) {
    if (num >= 0 && num < 10) {
        return '0' + num;
    }
    return String(num);
}
;
}),
"[project]/frontend/node_modules/@hebcal/hdate/dist/esm/dateFormat.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getPseudoISO",
    ()=>getPseudoISO,
    "getTimezoneOffset",
    ()=>getTimezoneOffset,
    "isoDateString",
    ()=>isoDateString
]);
/*! @hebcal/hdate v0.21.1, distributed under GPLv2 https://www.gnu.org/licenses/gpl-2.0.txt */ var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$pad$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/pad.js [app-client] (ecmascript)");
;
var _formatters = new Map();
/**
 * @private
 */ function getFormatter(tzid) {
    var fmt = _formatters.get(tzid);
    if (fmt) return fmt;
    var f = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: tzid
    });
    _formatters.set(tzid, f);
    return f;
}
var dateFormatRegex = /^(\d+).(\d+).(\d+),?\s+(\d+).(\d+).(\d+)/;
/**
 * Returns a string similar to `Date.toISOString()` but in the
 * timezone `tzid`. Contrary to the typical meaning of `Z` at the end
 * of the string, this is not actually a UTC date.
 */ function getPseudoISO(tzid, date) {
    var str = getFormatter(tzid).format(date);
    var m = dateFormatRegex.exec(str);
    if (m === null) {
        throw new Error("Unable to parse formatted string: ".concat(str));
    }
    var hour = m[4];
    if (hour === '24') {
        hour = '00';
    }
    m[3] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$pad$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pad4"])(parseInt(m[3], 10));
    return "".concat(m[3], "-").concat(m[1], "-").concat(m[2], "T").concat(hour, ":").concat(m[5], ":").concat(m[6], "Z");
}
/**
 * Returns number of minutes `tzid` is offset from UTC on date `date`.
 */ function getTimezoneOffset(tzid, date) {
    var utcStr = getPseudoISO('UTC', date);
    var localStr = getPseudoISO(tzid, date);
    var diffMs = new Date(utcStr).getTime() - new Date(localStr).getTime();
    return Math.ceil(diffMs / 1000 / 60);
}
/**
 * Returns YYYY-MM-DD in the local timezone
 */ function isoDateString(dt) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$pad$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pad4"])(dt.getFullYear()) + '-' + (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$pad$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pad2"])(dt.getMonth() + 1) + '-' + (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$pad$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pad2"])(dt.getDate());
}
;
}),
"[project]/frontend/node_modules/@hebcal/hdate/dist/esm/ashkenazi.po.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>poAshkenazi
]);
/*! @hebcal/hdate v0.21.1, distributed under GPLv2 https://www.gnu.org/licenses/gpl-2.0.txt */ var poAshkenazi = {
    "headers": {
        "plural-forms": "nplurals=2; plural=(n > 1);",
        "language": "en_CA@ashkenazi"
    },
    "contexts": {
        "": {
            "Tevet": [
                "Teves"
            ]
        }
    }
};
;
}),
"[project]/frontend/node_modules/@hebcal/hdate/dist/esm/he.po.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>poHe
]);
/*! @hebcal/hdate v0.21.1, distributed under GPLv2 https://www.gnu.org/licenses/gpl-2.0.txt */ var poHe = {
    "headers": {
        "plural-forms": "nplurals=2; plural=(n > 1);",
        "language": "he"
    },
    "contexts": {
        "": {
            "Adar": [
                "אֲדָר"
            ],
            "Adar I": [
                "אֲדָר א׳"
            ],
            "Adar II": [
                "אֲדָר ב׳"
            ],
            "Av": [
                "אָב"
            ],
            "Cheshvan": [
                "חֶשְׁוָן"
            ],
            "Elul": [
                "אֱלוּל"
            ],
            "Iyyar": [
                "אִיָּיר"
            ],
            "Kislev": [
                "כִּסְלֵו"
            ],
            "Nisan": [
                "נִיסָן"
            ],
            "Sh'vat": [
                "שְׁבָט"
            ],
            "Sivan": [
                "סִיוָן"
            ],
            "Tamuz": [
                "תַּמּוּז"
            ],
            "Tevet": [
                "טֵבֵת"
            ],
            "Tishrei": [
                "תִּשְׁרֵי"
            ]
        }
    }
};
;
}),
"[project]/frontend/node_modules/@hebcal/hdate/dist/esm/locale.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Locale",
    ()=>Locale
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_class_call_check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@swc/helpers/esm/_class_call_check.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_create_class$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@swc/helpers/esm/_create_class.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_sliced_to_array$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@swc/helpers/esm/_sliced_to_array.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_type_of$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@swc/helpers/esm/_type_of.js [app-client] (ecmascript)");
/*! @hebcal/hdate v0.21.1, distributed under GPLv2 https://www.gnu.org/licenses/gpl-2.0.txt */ var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hebrewStripNikkud$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/hebrewStripNikkud.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$ashkenazi$2e$po$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/ashkenazi.po.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$he$2e$po$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/he.po.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
var noopLocale = {
    headers: {
        'plural-forms': 'nplurals=2; plural=(n!=1);'
    },
    contexts: {
        '': {}
    }
};
var alias = {
    h: 'he',
    a: 'ashkenazi',
    s: 'en',
    '': 'en'
};
/** @private */ var locales = new Map();
/** @private */ function getEnOrdinal(n) {
    var s = [
        'th',
        'st',
        'nd',
        'rd'
    ];
    var v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
/** @private */ function checkLocale(locale) {
    if (typeof locale !== 'string') {
        throw new TypeError("Invalid locale name: ".concat(locale));
    }
    locale = alias[locale] || locale;
    return locale.toLowerCase();
}
/** @private */ function getExistingLocale(locale) {
    var locale1 = checkLocale(locale);
    var loc = locales.get(locale1);
    if (!loc) {
        throw new RangeError("Locale '".concat(locale, "' not found"));
    }
    return loc;
}
/**
 * A locale in Hebcal is used for translations/transliterations of
 * holidays. `@hebcal/hdate` supports four locales by default
 * * `en` - default, Sephardic transliterations (e.g. "Shabbat")
 * * `ashkenazi` - Ashkenazi transliterations (e.g. "Shabbos")
 * * `he` - Hebrew (e.g. "שַׁבָּת")
 * * `he-x-NoNikud` - Hebrew without nikud (e.g. "שבת")
 */ var Locale = /*#__PURE__*/ function() {
    "use strict";
    function Locale() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_class_call_check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, Locale);
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_create_class$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(Locale, null, [
        {
            key: "lookupTranslation",
            value: /**
     * Returns translation only if `locale` offers a non-empty translation for `id`.
     * Otherwise, returns `undefined`.
     * @param id Message ID to translate
     * @param [locale] Optional locale name (i.e: `'he'`, `'fr'`). Defaults to no-op locale.
     */ function lookupTranslation(id, locale) {
                var loc = typeof locale === 'string' && locales.get(checkLocale(locale)) || noopLocale.contexts[''];
                var array = loc[id];
                if ((array === null || array === void 0 ? void 0 : array.length) && array[0].length) {
                    return array[0];
                }
                return undefined;
            }
        },
        {
            key: "gettext",
            value: /**
     * By default, if no translation was found, returns `id`.
     * @param id Message ID to translate
     * @param [locale] Optional locale name (i.e: `'he'`, `'fr'`). Defaults to no-op locale.
     */ function gettext(id, locale) {
                var text = this.lookupTranslation(id, locale);
                if (typeof text === 'undefined') {
                    return id;
                }
                return text;
            }
        },
        {
            key: "addLocale",
            value: /**
     * Register locale translations.
     * @param locale Locale name (i.e.: `'he'`, `'fr'`)
     * @param data parsed data from a `.po` file.
     */ function addLocale(locale, data) {
                locale = checkLocale(locale);
                var ctx = data.contexts;
                if ((typeof ctx === "undefined" ? "undefined" : (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_type_of$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(ctx)) !== 'object' || (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_type_of$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(ctx['']) !== 'object') {
                    throw new TypeError("Locale '".concat(locale, "' invalid compact format"));
                }
                locales.set(locale, ctx['']);
            }
        },
        {
            key: "addTranslation",
            value: /**
     * Adds a translation to `locale`, replacing any previous translation.
     * @param locale Locale name (i.e: `'he'`, `'fr'`).
     * @param id Message ID to translate
     * @param translation Translation text
     */ function addTranslation(locale, id, translation) {
                var loc = getExistingLocale(locale);
                if (typeof id !== 'string' || id.length === 0) {
                    throw new TypeError("Invalid id string: ".concat(id));
                }
                var isArray = Array.isArray(translation);
                if (isArray) {
                    var t0 = translation[0];
                    if (typeof t0 !== 'string' || t0.length === 0) {
                        throw new TypeError("Invalid translation array: ".concat(translation));
                    }
                } else if (typeof translation !== 'string') {
                    throw new TypeError("Invalid translation string: ".concat(translation));
                }
                loc[id] = isArray ? translation : [
                    translation
                ];
            }
        },
        {
            key: "addTranslations",
            value: /**
     * Adds multiple translations to `locale`, replacing any previous translations.
     * @param locale Locale name (i.e: `'he'`, `'fr'`).
     * @param data parsed data from a `.po` file.
     */ function addTranslations(locale, data) {
                var loc = getExistingLocale(locale);
                var ctx = data.contexts;
                if ((typeof ctx === "undefined" ? "undefined" : (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_type_of$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(ctx)) !== 'object' || (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_type_of$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(ctx['']) !== 'object') {
                    throw new TypeError("Locale '".concat(locale, "' invalid compact format"));
                }
                Object.assign(loc, ctx['']);
            }
        },
        {
            key: "getLocaleNames",
            value: /**
     * Returns the names of registered locales
     */ function getLocaleNames() {
                var keys = Array.from(locales.keys());
                return keys.sort(function(a, b) {
                    return a.localeCompare(b);
                });
            }
        },
        {
            key: "hasLocale",
            value: /**
     * Checks whether a locale has been registered
     * @param locale Locale name (i.e: `'he'`, `'fr'`).
     */ function hasLocale(locale) {
                var locale1 = checkLocale(locale);
                return locales.has(locale1);
            }
        },
        {
            key: "ordinal",
            value: /**
     * Renders a number in ordinal, such as 1st, 2nd or 3rd
     * @param [locale] Optional locale name (i.e: `'he'`, `'fr'`). Defaults to no-op locale.
     */ function ordinal(n, locale) {
                var locale0 = locale === null || locale === void 0 ? void 0 : locale.toLowerCase();
                if (!locale0) {
                    return getEnOrdinal(n);
                }
                locale0 = alias[locale0] || locale0;
                switch(locale0){
                    case 'en':
                    case 'ashkenazi':
                        return getEnOrdinal(n);
                    case 'es':
                        return n + 'º';
                    case 'he':
                    case 'he-x-nonikud':
                        return String(n);
                }
                if (locale0.startsWith('ashkenazi')) {
                    return getEnOrdinal(n);
                }
                return n + '.';
            }
        },
        {
            key: "hebrewStripNikkud",
            value: /**
     * Removes nekudot from Hebrew string
     */ function hebrewStripNikkud(str) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hebrewStripNikkud$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hebrewStripNikkud"])(str);
            }
        },
        {
            key: "copyLocaleNoNikud",
            value: /**
     * Makes a copy of entire Hebrew locale with no niqqud
     */ function copyLocaleNoNikud(data) {
                var strs = data.contexts[''];
                var m = {};
                var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                try {
                    for(var _iterator = Object.entries(strs)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                        var _step_value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_sliced_to_array$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(_step.value, 2), key = _step_value[0], val = _step_value[1];
                        m[key] = [
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hebrewStripNikkud$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hebrewStripNikkud"])(val[0])
                        ];
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally{
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return != null) {
                            _iterator.return();
                        }
                    } finally{
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
                return {
                    headers: data.headers,
                    contexts: {
                        '': m
                    }
                };
            }
        }
    ]);
    return Locale;
}();
Locale.addLocale('en', noopLocale);
/* Ashkenazic transliterations */ Locale.addLocale('ashkenazi', __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$ashkenazi$2e$po$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]);
/* Hebrew with nikkud */ Locale.addLocale('he', __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$he$2e$po$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]);
/* Hebrew without nikkud */ var poHeNoNikud = Locale.copyLocaleNoNikud(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$he$2e$po$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]);
Locale.addLocale('he-x-NoNikud', poHeNoNikud);
;
}),
"[project]/frontend/node_modules/@hebcal/hdate/dist/esm/hdate.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HDate",
    ()=>HDate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_class_call_check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@swc/helpers/esm/_class_call_check.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_create_class$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@swc/helpers/esm/_create_class.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_type_of$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@swc/helpers/esm/_type_of.js [app-client] (ecmascript)");
/*! @hebcal/hdate v0.21.1, distributed under GPLv2 https://www.gnu.org/licenses/gpl-2.0.txt */ var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/hdateBase.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$greg$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/greg.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$gematriya$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/gematriya.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$locale$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/locale.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
/*
    Hebcal - A Jewish Calendar Generator
    Copyright (c) 1994-2020 Danny Sadinoff
    Portions copyright Eyal Schachter and Michael J. Radwin

    https://github.com/hebcal/hebcal-es6

    This program is free software; you can redistribute it and/or
    modify it under the terms of the GNU General Public License
    as published by the Free Software Foundation; either version 2
    of the License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program. If not, see <http://www.gnu.org/licenses/>.
 */ function mod(x, y) {
    return x - y * Math.floor(x / y);
}
function isSimpleHebrewDate(obj) {
    return obj.yy !== undefined;
}
var UNITS_DAY = 'day';
var UNITS_WEEK = 'week';
var UNITS_MONTH = 'month';
var UNITS_YEAR = 'year';
/**
 * A `HDate` represents a Hebrew calendar date.
 *
 * An instance of this class encapsulates a date in the Hebrew calendar system.
 * It consists of a year, month, and day, without any associated time or location data.
 * The Hebrew calendar is a lunisolar calendar, meaning it is based on both lunar and solar cycles.
 *
 * A Hebrew date internally stores three numbers:
 * - year: The Hebrew year (1-9999). Counted from the traditional Hebrew date of creation (3761 BCE in the Gregorian calendar)
 * - month: The Hebrew month (1-13). Month 1 is Nisan, month 7 is Tishrei. There are 12 months in a regular year and 13 months in a leap year.
 * - day: The day of the month (1-30)
 *
 * This class uses Rata Die to convert between the Hebrew and Gregorian calendars.
 *
 * To calculate times of day, use `Zmanim` class from `@hebcal/core`
 * @see {@link https://en.wikipedia.org/wiki/Rata_Die | Rata Die}
 * @see {@link https://hebcal.github.io/api/core/classes/Zmanim.html | Zmanim}
 */ var HDate = /*#__PURE__*/ function() {
    "use strict";
    function HDate(day, month, year) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_class_call_check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, HDate);
        if (arguments.length === 2 || arguments.length > 3) {
            throw new TypeError('HDate constructor requires 0, 1 or 3 arguments');
        }
        if (arguments.length === 3) {
            // Hebrew day, Hebrew month, Hebrew year
            this.dd = this.mm = 1;
            var yy = typeof year === 'string' ? parseInt(year, 10) : year;
            if (isNaN(yy)) {
                throw new TypeError("HDate called with bad year: ".concat(year));
            }
            this.yy = yy;
            setMonth(this, month); // will throw if we can't parse
            var dd = typeof day === 'string' ? parseInt(day, 10) : day;
            if (isNaN(dd)) {
                throw new TypeError("HDate called with bad day: ".concat(day));
            }
            setDate(this, dd);
        } else {
            // 0 arguments
            if (typeof day === 'undefined' || day === null) {
                day = new Date();
            }
            // 1 argument
            var abs0 = typeof day === 'number' && !isNaN(day) ? day : (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$greg$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isDate"])(day) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$greg$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["greg2abs"])(day) : isSimpleHebrewDate(day) ? day : null;
            if (abs0 === null) {
                throw new TypeError("HDate called with bad arg: ".concat(day));
            }
            var isNumber = typeof abs0 === 'number';
            var d = isNumber ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["abs2hebrew"])(abs0) : abs0;
            this.yy = d.yy;
            this.mm = d.mm;
            this.dd = d.dd;
            if (isNumber) {
                this.rd = abs0;
            }
        }
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_create_class$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(HDate, [
        {
            /**
     * Returns the Hebrew year of this Hebrew date
     * @returns an integer >= 1
     * @example
     * const hd = new HDate(new Date(2008, 10, 13)); // 15 Cheshvan 5769
     * hd.getFullYear(); // 5769
     */ key: "getFullYear",
            value: function getFullYear() {
                return this.yy;
            }
        },
        {
            /**
     * Returns `true` if this Hebrew date occurs during a Hebrew leap year
     * @example
     * const hd = new HDate(new Date(2008, 10, 13)); // 15 Cheshvan 5769
     * hd.isLeapYear(); // false
     */ key: "isLeapYear",
            value: function isLeapYear() {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isLeapYear"])(this.yy);
            }
        },
        {
            /**
     * Returns the Hebrew month (1=NISAN, 7=TISHREI) of this Hebrew date
     * @returns an integer 1-13
     * @example
     * const hd = new HDate(new Date(2008, 10, 13)); // 15 Cheshvan 5769
     * hd.getMonth(); // 8
     */ key: "getMonth",
            value: function getMonth() {
                return this.mm;
            }
        },
        {
            /**
     * The Tishrei-based month of this Hebrew date. 1 is Tishrei, 7 is Nisan, 13 is Elul in a leap year
     * @returns an integer 1-13
     * @example
     * const hd = new HDate(new Date(2008, 10, 13)); // 15 Cheshvan 5769
     * hd.getTishreiMonth(); // 2
     */ key: "getTishreiMonth",
            value: function getTishreiMonth() {
                var nummonths = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["monthsInYear"])(this.getFullYear());
                return (this.getMonth() + nummonths - 6) % nummonths || nummonths;
            }
        },
        {
            /**
     * Number of days in the month of this Hebrew date (29 or 30)
     * @returns an integer 29-30
     * @example
     * const hd = new HDate(new Date(2008, 10, 13)); // 15 Cheshvan 5769
     * hd.daysInMonth(); // 29
     */ key: "daysInMonth",
            value: function daysInMonth() {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["daysInMonth"])(this.getMonth(), this.getFullYear());
            }
        },
        {
            /**
     * Gets the day within the month (1-30)
     * @returns an integer 1-30
     * @example
     * const hd = new HDate(new Date(2008, 10, 13)); // 15 Cheshvan 5769
     * hd.getDate(); // 15
     */ key: "getDate",
            value: function getDate() {
                return this.dd;
            }
        },
        {
            /**
     * Returns the day of the week for this Hebrew date,
     * where 0 represents Sunday, 1 represents Monday, 6 represents Saturday.
     *
     * For the day of the month, see `getDate()`
     * @returns an integer 0-6
     * @example
     * const hd = new HDate(new Date(2008, 10, 13)); // 15 Cheshvan 5769
     * hd.getDate(); // 4
     */ key: "getDay",
            value: function getDay() {
                return mod(this.abs(), 7);
            }
        },
        {
            /**
     * Converts this Hebrew date to the corresponding Gregorian date.
     *
     * The returned `Date` object will be in the local (i.e. host system) time zone.
     * Hours, minutes, seconds and milliseconds will all be zero.
     *
     * Note that this function returns the daytime portion of the date.
     * For example, the 15th of Cheshvan 5769 began at sundown on
     * 12 November 2008 and continues through 13 November 2008. This
     * function would return only the date 13 November 2008.
     * @example
     * const hd = new HDate(15, 'Cheshvan', 5769);
     * const date = hd.greg(); // 13 November 2008
     * const year = date.getFullYear(); // 2008
     * const monthNum = date.getMonth() + 1; // 11
     * const day = date.getDate(); // 13
     */ key: "greg",
            value: function greg() {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$greg$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["abs2greg"])(this.abs());
            }
        },
        {
            /**
     * Converts from Hebrew date representation to R.D. (Rata Die) fixed days.
     * R.D. 1 is the imaginary date Monday, January 1, 1 (Gregorian).
     * Note also that R.D. = Julian Date − 1,721,424.5
     * @see {@link https://en.wikipedia.org/wiki/Rata_Die | Rata Die}
     * @example
     * const hd = new HDate(15, 'Cheshvan', 5769);
     * hd.abs(); // 733359
     */ key: "abs",
            value: function abs() {
                if (typeof this.rd !== 'number') {
                    this.rd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hebrew2abs"])(this.yy, this.mm, this.dd);
                }
                return this.rd;
            }
        },
        {
            /**
     * Returns a transliterated Hebrew month name, e.g. `'Elul'` or `'Cheshvan'`.
     * @example
     * const hd = new HDate(new Date(2008, 10, 13)); // 15 Cheshvan 5769
     * hd.getMonthName(); // 'Cheshvan'
     */ key: "getMonthName",
            value: function getMonthName() {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMonthName"])(this.getMonth(), this.getFullYear());
            }
        },
        {
            /**
     * Renders this Hebrew date as a translated or transliterated string,
     * including ordinal e.g. `'15th of Cheshvan, 5769'`.
     * @example
     * import {HDate, months} from '@hebcal/hdate';
     *
     * const hd = new HDate(15, months.CHESHVAN, 5769);
     * console.log(hd.render('en')); // '15th of Cheshvan, 5769'
     * console.log(hd.render('he')); // '15 חֶשְׁוָן, 5769'
     * console.log(hd.render('en', false)); // '15th of Cheshvan'
     * console.log(hd.render('he', false)); // '15 חֶשְׁוָן'
     * @param [locale] Optional locale name (defaults to active locale).
     * @param [showYear=true] Display year (defaults to true).
     * @see {@link Locale}
     */ key: "render",
            value: function render(locale) {
                var showYear = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
                var locale0 = locale || 'en';
                var day = this.getDate();
                var monthName0 = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$locale$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Locale"].gettext(this.getMonthName(), locale0);
                var monthName = monthName0.replace(/'/g, '’');
                var nth = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$locale$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Locale"].ordinal(day, locale0);
                var dayOf = getDayOfTranslation(locale0);
                var dateStr = "".concat(nth).concat(dayOf, " ").concat(monthName);
                if (showYear) {
                    var fullYear = this.getFullYear();
                    return "".concat(dateStr, ", ").concat(fullYear);
                } else {
                    return dateStr;
                }
            }
        },
        {
            /**
     * Renders this Hebrew date in Hebrew gematriya, regardless of locale.
     * @param suppressNikud - suppress nekudot (default false)
     * @param suppressYear - suppress Hebrew year (default false)
     * @example
     * import {HDate, months} from '@hebcal/hdate';
     * const hd = new HDate(15, months.CHESHVAN, 5769);
     * hd.renderGematriya(); // 'ט״ו חֶשְׁוָן תשס״ט'
     * hd.renderGematriya(true); // 'ט״ו חשון תשס״ט'
     * hd.renderGematriya(false, true); // 'ט״ו חֶשְׁוָן'
     */ key: "renderGematriya",
            value: function renderGematriya() {
                var suppressNikud = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false, suppressYear = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
                var d = this.getDate();
                var locale = suppressNikud ? 'he-x-NoNikud' : 'he';
                var m = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$locale$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Locale"].gettext(this.getMonthName(), locale);
                var prefix = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$gematriya$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["gematriya"])(d) + ' ' + m;
                if (suppressYear) {
                    return prefix;
                }
                var y = this.getFullYear();
                return prefix + ' ' + (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$gematriya$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["gematriya"])(y);
            }
        },
        {
            /**
     * Returns an `HDate` corresponding to the specified day of week
     * **before** this Hebrew date
     * @example
     * new HDate(new Date('Wednesday February 19, 2014')).before(6).greg() // Sat Feb 15 2014
     * @param dayOfWeek day of week: Sunday=0, Saturday=6
     */ key: "before",
            value: function before(dayOfWeek) {
                return onOrBefore(dayOfWeek, this, -1);
            }
        },
        {
            /**
     * Returns an `HDate` corresponding to the specified day of week
     * **on or before** this Hebrew date
     * @example
     * new HDate(new Date('Wednesday February 19, 2014')).onOrBefore(6).greg() // Sat Feb 15 2014
     * new HDate(new Date('Saturday February 22, 2014')).onOrBefore(6).greg() // Sat Feb 22 2014
     * new HDate(new Date('Sunday February 23, 2014')).onOrBefore(6).greg() // Sat Feb 22 2014
     * @param dayOfWeek day of week: Sunday=0, Saturday=6
     */ key: "onOrBefore",
            value: function onOrBefore1(dayOfWeek) {
                return onOrBefore(dayOfWeek, this, 0);
            }
        },
        {
            /**
     * Returns an `HDate` corresponding to the specified day of week
     * **nearest** to this Hebrew date
     * @example
     * new HDate(new Date('Wednesday February 19, 2014')).nearest(6).greg() // Sat Feb 22 2014
     * new HDate(new Date('Tuesday February 18, 2014')).nearest(6).greg() // Sat Feb 15 2014
     * @param dayOfWeek day of week: Sunday=0, Saturday=6
     */ key: "nearest",
            value: function nearest(dayOfWeek) {
                return onOrBefore(dayOfWeek, this, 3);
            }
        },
        {
            /**
     * Returns an `HDate` corresponding to the specified day of week
     * **on or after** this Hebrew date
     * @example
     * new HDate(new Date('Wednesday February 19, 2014')).onOrAfter(6).greg() // Sat Feb 22 2014
     * new HDate(new Date('Saturday February 22, 2014')).onOrAfter(6).greg() // Sat Feb 22 2014
     * new HDate(new Date('Sunday February 23, 2014')).onOrAfter(6).greg() // Sat Mar 01 2014
     * @param dayOfWeek day of week: Sunday=0, Saturday=6
     */ key: "onOrAfter",
            value: function onOrAfter(dayOfWeek) {
                return onOrBefore(dayOfWeek, this, 6);
            }
        },
        {
            /**
     * Returns an `HDate` corresponding to the specified day of week
     * **after** this Hebrew date
     * @example
     * new HDate(new Date('Wednesday February 19, 2014')).after(6).greg() // Sat Feb 22 2014
     * new HDate(new Date('Saturday February 22, 2014')).after(6).greg() // Sat Mar 01 2014
     * new HDate(new Date('Sunday February 23, 2014')).after(6).greg() // Sat Mar 01 2014
     * @param dayOfWeek day of week: Sunday=0, Saturday=6
     */ key: "after",
            value: function after(dayOfWeek) {
                return onOrBefore(dayOfWeek, this, 7);
            }
        },
        {
            /**
     * Returns the next Hebrew date
     * @example
     * const hd = new HDate(new Date(2008, 10, 13)); // 15 Cheshvan 5769
     * hd.next(); // '16 Cheshvan 5769'
     */ key: "next",
            value: function next() {
                return new HDate(this.abs() + 1);
            }
        },
        {
            /**
     * Returns the previous Hebrew date
     * @example
     * const hd = new HDate(new Date(2008, 10, 13)); // 15 Cheshvan 5769
     * hd.prev(); // '14 Cheshvan 5769'
     */ key: "prev",
            value: function prev() {
                return new HDate(this.abs() - 1);
            }
        },
        {
            /**
     * Returns a cloned `HDate` object with a specified amount of time added
     *
     * Units are case insensitive, and support plural and short forms.
     * Note, short forms are case sensitive.
     *
     * | Unit | Shorthand | Description
     * | --- | --- | --- |
     * | `day` | `d` | days |
     * | `week` | `w` | weeks |
     * | `month` | `M` | months |
     * | `year` | `y` | years |
     */ key: "add",
            value: function add(amount) {
                var units = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 'd';
                amount = typeof amount === 'string' ? parseInt(amount, 10) : amount;
                if (!amount) {
                    return new HDate(this);
                }
                units = standardizeUnits(units);
                if (units === UNITS_DAY) {
                    return new HDate(this.abs() + amount);
                } else if (units === UNITS_WEEK) {
                    return new HDate(this.abs() + 7 * amount);
                } else if (units === UNITS_YEAR) {
                    return new HDate(this.getDate(), this.getMonth(), this.getFullYear() + amount);
                } else {
                    // units === UNITS_MONTH
                    var hd = new HDate(this);
                    var sign = amount > 0 ? 1 : -1;
                    amount = Math.abs(amount);
                    for(var i = 0; i < amount; i++){
                        hd = new HDate(hd.abs() + sign * hd.daysInMonth());
                    }
                    return hd;
                }
            }
        },
        {
            /**
     * Returns a cloned `HDate` object with a specified amount of time subracted
     *
     * Units are case insensitive, and support plural and short forms.
     * Note, short forms are case sensitive.
     *
     * | Unit | Shorthand | Description
     * | --- | --- | --- |
     * | `day` | `d` | days |
     * | `week` | `w` | weeks |
     * | `month` | `M` | months |
     * | `year` | `y` | years |
     * @example
     * import {HDate, months} from '@hebcal/hdate';
     *
     * const hd1 = new HDate(15, months.CHESHVAN, 5769);
     * const hd2 = hd1.add(1, 'weeks'); // 7 Kislev 5769
     * const hd3 = hd1.add(-3, 'M'); // 30 Av 5768
     */ key: "subtract",
            value: function subtract(amount) {
                var units = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 'd';
                return this.add(amount * -1, units);
            }
        },
        {
            /**
     * Returns the difference in days between the two given HDates.
     *
     * The result is positive if `this` date is comes chronologically
     * after the `other` date, and negative
     * if the order of the two dates is reversed.
     *
     * The result is zero if the two dates are identical.
     * @example
     * import {HDate, months} from '@hebcal/hdate';
     *
     * const hd1 = new HDate(25, months.KISLEV, 5770);
     * const hd2 = new HDate(15, months.CHESHVAN, 5769);
     * const days = hd1.deltaDays(hd2); // 394
     * @param other Hebrew date to compare
     */ key: "deltaDays",
            value: function deltaDays(other) {
                return this.abs() - other.abs();
            }
        },
        {
            /**
     * Compares this Hebrew date to another date, returning `true` if the dates match.
     * @param other Hebrew date to compare
     * @example
     * const hd1 = new HDate(new Date(2008, 10, 13));
     * const hd2 = new HDate(15, 'Cheshvan', 5769);
     * hd1.isSameDate(hd2); // true
     */ key: "isSameDate",
            value: function isSameDate(other) {
                return this.yy === other.yy && this.mm === other.mm && this.dd === other.dd;
            }
        },
        {
            /**
     * Returns a string representation of this Hebrew date using English transliterations
     * @example
     * const hd = new HDate(new Date(2008, 10, 13)); // 15 Cheshvan 5769
     * hd.toString(); // '15 Cheshvan 5769'
     */ key: "toString",
            value: function toString() {
                var day = this.getDate();
                var fullYear = this.getFullYear();
                var monthName = this.getMonthName();
                return "".concat(day, " ").concat(monthName, " ").concat(fullYear);
            }
        }
    ], [
        {
            key: "hebrew2abs",
            value: /**
     * Converts Hebrew date to R.D. (Rata Die) fixed days.
     * R.D. 1 is the imaginary date Monday, January 1, 1 on the Gregorian
     * Calendar.
     * @param year Hebrew year
     * @param month Hebrew month (1=NISAN, 7=TISHREI)
     * @param day Hebrew date (1-30)
     * @example
     * import {HDate, months} from '@hebcal/hdate';
     * HDate.hebrew2abs(5769, months.CHESHVAN, 15); // 733359
     */ function hebrew2abs(year, month, day) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hebrew2abs"])(year, month, day);
            }
        },
        {
            key: "isLeapYear",
            value: /**
     * Returns true if Hebrew year is a leap year
     * @param year Hebrew year
     * @example
     * HDate.isLeapYear(5783); // false
     * HDate.isLeapYear(5784); // true
     */ function isLeapYear(year) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isLeapYear"])(year);
            }
        },
        {
            key: "monthsInYear",
            value: /**
     * Number of months in this Hebrew year (either 12 or 13 depending on leap year)
     * @param year Hebrew year
     * @example
     * HDate.monthsInYear(5783); // 12
     * HDate.monthsInYear(5784); // 13
     */ function monthsInYear(year) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["monthsInYear"])(year);
            }
        },
        {
            key: "daysInMonth",
            value: /**
     * Number of days in Hebrew month in a given year (29 or 30)
     * @param month Hebrew month (e.g. months.TISHREI)
     * @param year Hebrew year
     * @example
     * import {HDate, months} from '@hebcal/hdate';
     * HDate.daysInMonth(months.CHESHVAN, 5769); // 29
     */ function daysInMonth(month, year) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["daysInMonth"])(month, year);
            }
        },
        {
            key: "getMonthName",
            value: /**
     * Returns a transliterated string name of Hebrew month in year,
     * for example 'Elul' or 'Cheshvan'.
     * @param month Hebrew month (e.g. months.TISHREI)
     * @param year Hebrew year
     * @example
     * import {HDate, months} from '@hebcal/hdate';
     * HDate.getMonthName(months.CHESHVAN, 5769); // 'Cheshvan'
     */ function getMonthName(month, year) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMonthName"])(month, year);
            }
        },
        {
            key: "monthNum",
            value: /**
     * Returns the Hebrew month number (NISAN=1, TISHREI=7)
     * @param month A number, or Hebrew month name string
     * @example
     * import {HDate, months} from '@hebcal/hdate';
     * HDate.monthNum(months.CHESHVAN); // 8
     * HDate.monthNum('Cheshvan'); // 8
     * HDate.monthNum('חשון'); // 8
     */ function monthNum(month) {
                if (typeof month === 'number') {
                    if (isNaN(month) || month > 14) {
                        throw new RangeError("bad monthNum: ".concat(month));
                    }
                    return month;
                }
                return month.charCodeAt(0) >= 48 && month.charCodeAt(0) <= 57 /* number */  ? parseInt(month, 10) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["monthFromName"])(month);
            }
        },
        {
            key: "daysInYear",
            value: /**
     * Number of days in the Hebrew year.
     * Regular years can have 353, 354, or 355 days.
     * Leap years can have 383, 384, or 385 days.
     * @param year Hebrew year
     * @example
     * HDate.daysInYear(5783); // 355
     * HDate.daysInYear(5784); // 383
     */ function daysInYear(year) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["daysInYear"])(year);
            }
        },
        {
            key: "longCheshvan",
            value: /**
     * true if Cheshvan is long in Hebrew year
     * @param year Hebrew year
     * @example
     * HDate.longCheshvan(5783); // true
     * HDate.longCheshvan(5784); // false
     */ function longCheshvan(year) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["longCheshvan"])(year);
            }
        },
        {
            key: "shortKislev",
            value: /**
     * true if Kislev is short in Hebrew year
     * @param year Hebrew year
     * @example
     * HDate.shortKislev(5783); // false
     * HDate.shortKislev(5784); // true
     */ function shortKislev(year) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shortKislev"])(year);
            }
        },
        {
            key: "monthFromName",
            value: /**
     * Converts Hebrew month string name to numeric
     * @example
     * import {HDate, months} from '@hebcal/hdate';
     * HDate.monthFromName(months.CHESHVAN); // 8
     * HDate.monthFromName('Cheshvan'); // 8
     * HDate.monthFromName('חשון'); // 8
     */ function monthFromName(monthName) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["monthFromName"])(monthName);
            }
        },
        {
            key: "dayOnOrBefore",
            value: /**
     * Convenience function for determining the R.D. date
     * near a specified R.D. date, corresponding to the specified day of week.
     *
     * Note: Applying this function to d+6 gives us the `dayOfWeek` on or after an
     * absolute day d. Similarly, applying it to d+3 gives the `dayOfWeek` nearest to
     * absolute date d, applying it to d-1 gives the `dayOfWeek` previous to absolute
     * date d, and applying it to d+7 gives the `dayOfWeek` following absolute date d.
     * @param dayOfWeek day of week: Sunday=0, Saturday=6
     */ function dayOnOrBefore(dayOfWeek, absdate) {
                return absdate - (absdate - dayOfWeek) % 7;
            }
        },
        {
            key: "isHDate",
            value: /**
     * Tests if the object is an instance of `HDate`
     * @example
     * HDate.isHDate(new HDate()); // true
     * HDate.isHDate(new Date()); // false
     * HDate.isHDate(null); // false
     * HDate.isHDate(12345); // false
     * HDate.isHDate('15 Cheshvan 5769'); // false
     */ function isHDate(obj) {
                return obj !== null && (typeof obj === "undefined" ? "undefined" : (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_type_of$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(obj)) === 'object' && typeof obj.yy === 'number' && typeof obj.mm === 'number' && typeof obj.dd === 'number' && typeof obj.greg === 'function' && typeof obj.abs === 'function';
            }
        },
        {
            key: "fromGematriyaString",
            value: /**
     * Construct a new instance of `HDate` from a Gematriya-formatted string
     * @example
     * HDate.fromGematriyaString('כ״ז בְּתַמּוּז תשפ״ג') // 27 Tamuz 5783
     * HDate.fromGematriyaString('כ׳ סיון תש״ד') // 20 Sivan 5704
     * HDate.fromGematriyaString('ה׳ אִיָיר תש״ח') // 5 Iyyar 5708
     */ function fromGematriyaString(str) {
                var currentThousands = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 5000;
                var parts = str.split(' ').filter(function(x) {
                    return x.length !== 0;
                });
                var numParts = parts.length;
                if (numParts !== 3 && numParts !== 4) {
                    throw new RangeError('cannot parse gematriya str: "'.concat(str, '"'));
                }
                var day = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$gematriya$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["gematriyaStrToNum"])(parts[0]);
                var monthStr = numParts === 3 ? parts[1] : parts[1] + ' ' + parts[2];
                var month = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["monthFromName"])(monthStr);
                var yearStr = numParts === 3 ? parts[2] : parts[3];
                var year = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$gematriya$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["gematriyaStrToNum"])(yearStr);
                if (year < 1000) {
                    year += currentThousands;
                }
                return new HDate(day, month, year);
            }
        }
    ]);
    return HDate;
}();
function standardizeUnits(units) {
    switch(units){
        case 'd':
            return UNITS_DAY;
        case 'w':
            return UNITS_WEEK;
        case 'M':
            return UNITS_MONTH;
        case 'y':
            return UNITS_YEAR;
    }
    var str = String(units || '').toLowerCase().replace(/s$/, '');
    switch(str){
        case UNITS_DAY:
        case UNITS_WEEK:
        case UNITS_MONTH:
        case UNITS_YEAR:
            return str;
    }
    throw new TypeError("Invalid units '".concat(units, "'"));
}
function getDayOfTranslation(locale) {
    switch(locale){
        case 'en':
        case 's':
        case 'a':
        case 'ashkenazi':
            return ' of';
    }
    var ofStr = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$locale$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Locale"].lookupTranslation('of', locale);
    if (ofStr) {
        return ' ' + ofStr;
    }
    if (locale.startsWith('ashkenazi')) {
        return ' of';
    }
    return '';
}
/**
 * Sets the day of the month of the date. Returns the object it was called upon
 * @private
 * @param month A number, or Hebrew month name string
 */ function setMonth(hd, month) {
    hd.mm = HDate.monthNum(month);
    fix(hd);
    return hd;
}
function setDate(hd, date) {
    hd.dd = date;
    fix(hd);
    return hd;
}
function fix(hd) {
    fixMonth(hd);
    fixDate(hd);
}
function fixDate(hd) {
    if (hd.dd < 1) {
        if (hd.mm === __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["months"].TISHREI) {
            hd.yy -= 1;
        }
        hd.dd += (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["daysInMonth"])(hd.mm, hd.yy);
        hd.mm -= 1;
        fix(hd);
    }
    if (hd.dd > (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["daysInMonth"])(hd.mm, hd.yy)) {
        if (hd.mm === __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["months"].ELUL) {
            hd.yy += 1;
        }
        hd.dd -= (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["daysInMonth"])(hd.mm, hd.yy);
        if (hd.mm === (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["monthsInYear"])(hd.yy)) {
            hd.mm = 1; // rollover to NISAN
        } else {
            hd.mm += 1;
        }
        fix(hd);
    }
    fixMonth(hd);
}
function fixMonth(hd) {
    if (hd.mm === __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["months"].ADAR_II && !hd.isLeapYear()) {
        hd.mm -= 1; // to Adar I
        fix(hd);
    } else if (hd.mm < 1) {
        hd.mm += (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["monthsInYear"])(hd.yy);
        hd.yy -= 1;
        fix(hd);
    } else if (hd.mm > (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["monthsInYear"])(hd.yy)) {
        hd.mm -= (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["monthsInYear"])(hd.yy);
        hd.yy += 1;
        fix(hd);
    }
    delete hd.rd;
}
function onOrBefore(day, t, offset) {
    return new HDate(HDate.dayOnOrBefore(day, t.abs() + offset));
}
;
}),
"[project]/frontend/node_modules/@hebcal/hdate/dist/esm/index.js [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
/*! @hebcal/hdate v0.21.1, distributed under GPLv2 https://www.gnu.org/licenses/gpl-2.0.txt */ var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$greg$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/greg.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$gregNamespace$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/gregNamespace.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdateBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/hdateBase.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$anniversary$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/anniversary.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$gematriya$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/gematriya.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$molad$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/molad.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$dateFormat$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/dateFormat.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$locale$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/locale.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$hebcal$2f$hdate$2f$dist$2f$esm$2f$hdate$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@hebcal/hdate/dist/esm/hdate.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
}),
"[project]/frontend/node_modules/@hebcal/noaa/dist/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GeoLocation",
    ()=>GeoLocation,
    "NOAACalculator",
    ()=>NOAACalculator
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_class_call_check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@swc/helpers/esm/_class_call_check.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_create_class$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@swc/helpers/esm/_create_class.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$temporal$2d$polyfill$2f$global$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/temporal-polyfill/global.esm.js [app-client] (ecmascript)");
;
;
;
/**
 * java.lang.Math.toRadians
 * @private
 * @param degrees
 */ function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}
/**
 * java.lang.Math.toDegrees
 * @private
 * @param radians
 */ function radiansToDegrees(radians) {
    return radians * 180 / Math.PI;
}
var GeoLocation = /*#__PURE__*/ function() {
    "use strict";
    function GeoLocation(name, latitude, longitude, elevation, timeZoneId) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_class_call_check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, GeoLocation);
        /**
         * @private
         */ this.locationName = null;
        this.setLocationName(name);
        this.setLatitude(latitude);
        this.setLongitude(longitude);
        this.setElevation(elevation);
        this.setTimeZone(timeZoneId);
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_create_class$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(GeoLocation, [
        {
            /**
     * Method to get the elevation in Meters.
     *
     * @return {number} Returns the elevation in Meters.
     */ key: "getElevation",
            value: function getElevation() {
                return this.elevation;
            }
        },
        {
            /**
     * Method to set the elevation in Meters <b>above </b> sea level.
     *
     * @param {number} elevation
     *            The elevation to set in Meters. An Error will be thrown if the value is a negative.
     */ key: "setElevation",
            value: function setElevation(elevation) {
                if (typeof elevation !== 'number') throw new TypeError('Invalid elevation');
                if (elevation < 0) {
                    throw new RangeError("elevation ".concat(elevation, " must be zero or positive"));
                }
                this.elevation = elevation;
            }
        },
        {
            key: "setLatitude",
            value: function setLatitude(latitude) {
                if (typeof latitude !== 'number') throw new TypeError('Invalid latitude');
                if (latitude < -90 || latitude > 90) {
                    throw new RangeError("Latitude ".concat(latitude, " out of range [-90,90]"));
                }
                this.latitude = latitude;
            }
        },
        {
            /**
     * @return {number} Returns the latitude.
     */ key: "getLatitude",
            value: function getLatitude() {
                return this.latitude;
            }
        },
        {
            key: "setLongitude",
            value: function setLongitude(longitude) {
                if (typeof longitude !== 'number') throw new TypeError('Invalid longitude');
                if (longitude < -180 || longitude > 180) {
                    throw new RangeError("Longitude ".concat(longitude, " out of range [-180,180]"));
                }
                this.longitude = longitude;
            }
        },
        {
            /**
     * @return {number} Returns the longitude.
     */ key: "getLongitude",
            value: function getLongitude() {
                return this.longitude;
            }
        },
        {
            /**
     * @return {string|null} Returns the location name.
     */ key: "getLocationName",
            value: function getLocationName() {
                return this.locationName;
            }
        },
        {
            /**
     * @param {string|null} name
     *            The setter method for the display name.
     */ key: "setLocationName",
            value: function setLocationName(name) {
                this.locationName = name;
            }
        },
        {
            /**
     * @return {string} Returns the timeZone.
     */ key: "getTimeZone",
            value: function getTimeZone() {
                return this.timeZoneId;
            }
        },
        {
            /**
     * Method to set the TimeZone.
     * @param {string} timeZoneId
     *            The timeZone to set.
     */ key: "setTimeZone",
            value: function setTimeZone(timeZoneId) {
                if (!timeZoneId) {
                    throw new RangeError('Invalid timeZoneId');
                }
                this.timeZoneId = timeZoneId;
            }
        }
    ]);
    return GeoLocation;
}();
/**
 * The commonly used average solar refraction. Calendrical Calculations lists a more accurate global average of
 * 34.478885263888294
 * @private
 */ var refraction = 34 / 60;
// private double refraction = 34.478885263888294 / 60d;
/**
 * The commonly used average solar radius in minutes of a degree.
 * @private
 */ var solarRadius = 16 / 60;
/**
 * The commonly used average earth radius in KM. At this time, this only affects elevation adjustment and not the
 * sunrise and sunset calculations. The value currently defaults to 6356.9 KM.
 * @private
 */ var earthRadius = 6356.9; // in KM
var NOAACalculator = /*#__PURE__*/ function() {
    "use strict";
    function NOAACalculator(geoLocation, date) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_class_call_check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, NOAACalculator);
        this.date = date;
        this.geoLocation = geoLocation;
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_create_class$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(NOAACalculator, [
        {
            /**
     * The getSunrise method Returns a `Date` representing the
     * {@link getElevationAdjustment elevation adjusted} sunrise time. The zenith used
     * for the calculation uses {@link GEOMETRIC_ZENITH geometric zenith} of 90&deg; plus
     * {@link getElevationAdjustment}. This is adjusted
     * to add approximately 50/60 of a degree to account for 34 archminutes of refraction
     * and 16 archminutes for the sun's radius for a total of {@link adjustZenith 90.83333&deg;}.
     *
     * @return {Temporal.ZonedDateTime | null} the `Date` representing the exact sunrise time. If the calculation can't be computed such as
     *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
     *         does not set, a null will be returned. See detailed explanation on top of the page.
     * @see adjustZenith
     * @see getSeaLevelSunrise()
     * @see getUTCSunrise
     */ key: "getSunrise",
            value: function getSunrise() {
                var sunrise = this.getUTCSunrise0(NOAACalculator.GEOMETRIC_ZENITH);
                if (isNaN(sunrise)) return null;
                return this.getDateFromTime(sunrise, true);
            }
        },
        {
            /**
     * A method that returns the sunrise without {@link getElevationAdjustment elevation
     * adjustment}. Non-sunrise and sunset calculations such as dawn and dusk, depend on the amount of visible light,
     * something that is not affected by elevation. This method returns sunrise calculated at sea level. This forms the
     * base for dawn calculations that are calculated as a dip below the horizon before sunrise.
     *
     * @return {Temporal.ZonedDateTime | null} the `Date` representing the exact sea-level sunrise time. If the calculation can't be computed
     *         such as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one
     *         where it does not set, a null will be returned. See detailed explanation on top of the page.
     * @see getSunrise
     * @see getUTCSeaLevelSunrise
     * @see getSeaLevelSunset()
     */ key: "getSeaLevelSunrise",
            value: function getSeaLevelSunrise() {
                var sunrise = this.getUTCSeaLevelSunrise(NOAACalculator.GEOMETRIC_ZENITH);
                if (isNaN(sunrise)) return null;
                return this.getDateFromTime(sunrise, true);
            }
        },
        {
            /**
     * A method that returns the beginning of civil twilight (dawn) using a zenith of {@link CIVIL_ZENITH 96&deg;}.
     *
     * @return {Temporal.ZonedDateTime | null} The `Date` of the beginning of civil twilight using a zenith of 96&deg;. If the calculation
     *         can't be computed, null will be returned. See detailed explanation on top of the page.
     * @see CIVIL_ZENITH
     */ key: "getBeginCivilTwilight",
            value: function getBeginCivilTwilight() {
                return this.getSunriseOffsetByDegrees(NOAACalculator.CIVIL_ZENITH);
            }
        },
        {
            /**
     * A method that returns the beginning of nautical twilight using a zenith of {@link NAUTICAL_ZENITH 102&deg;}.
     *
     * @return {Temporal.ZonedDateTime | null} The `Date` of the beginning of nautical twilight using a zenith of 102&deg;. If the
     *         calculation can't be computed null will be returned. See detailed explanation on top of the page.
     * @see NAUTICAL_ZENITH
     */ key: "getBeginNauticalTwilight",
            value: function getBeginNauticalTwilight() {
                return this.getSunriseOffsetByDegrees(NOAACalculator.NAUTICAL_ZENITH);
            }
        },
        {
            /**
     * A method that returns the beginning of astronomical twilight using a zenith of {@link ASTRONOMICAL_ZENITH
     * 108&deg;}.
     *
     * @return {Temporal.ZonedDateTime | null} The `Date` of the beginning of astronomical twilight using a zenith of 108&deg;. If the
     *         calculation can't be computed, null will be returned. See detailed explanation on top of the page.
     * @see ASTRONOMICAL_ZENITH
     */ key: "getBeginAstronomicalTwilight",
            value: function getBeginAstronomicalTwilight() {
                return this.getSunriseOffsetByDegrees(NOAACalculator.ASTRONOMICAL_ZENITH);
            }
        },
        {
            /**
     * The getSunset method Returns a `Date` representing the
     * {@link getElevationAdjustment elevation adjusted} sunset time. The zenith used for
     * the calculation uses {@link GEOMETRIC_ZENITH geometric zenith} of 90&deg; plus
     * {@link getElevationAdjustment}. This is adjusted
     * to add approximately 50/60 of a degree to account for 34 archminutes of refraction
     * and 16 archminutes for the sun's radius for a total of {@link adjustZenith 90.83333&deg;}.
     * Note:
     * In certain cases the calculates sunset will occur before sunrise. This will typically happen when a timezone
     * other than the local timezone is used (calculating Los Angeles sunset using a GMT timezone for example). In this
     * case the sunset date will be incremented to the following date.
     *
     * @return {Temporal.ZonedDateTime | null} The `Date` representing the exact sunset time. If the calculation can't be computed such as in
     *         the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
     *         does not set, a null will be returned. See detailed explanation on top of the page.
     * @see adjustZenith
     * @see getSeaLevelSunset()
     * @see getUTCSunset
     */ key: "getSunset",
            value: function getSunset() {
                var sunset = this.getUTCSunset0(NOAACalculator.GEOMETRIC_ZENITH);
                if (isNaN(sunset)) return null;
                return this.getDateFromTime(sunset, false);
            }
        },
        {
            /**
     * A method that returns the sunset without {@link getElevationAdjustment elevation
     * adjustment}. Non-sunrise and sunset calculations such as dawn and dusk, depend on the amount of visible light,
     * something that is not affected by elevation. This method returns sunset calculated at sea level. This forms the
     * base for dusk calculations that are calculated as a dip below the horizon after sunset.
     *
     * @return {Temporal.ZonedDateTime | null} The `Date` representing the exact sea-level sunset time. If the calculation can't be computed
     *         such as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one
     *         where it does not set, a null will be returned. See detailed explanation on top of the page.
     * @see getSunset
     * @see getUTCSeaLevelSunset
     */ key: "getSeaLevelSunset",
            value: function getSeaLevelSunset() {
                var sunset = this.getUTCSeaLevelSunset(NOAACalculator.GEOMETRIC_ZENITH);
                if (isNaN(sunset)) return null;
                return this.getDateFromTime(sunset, false);
            }
        },
        {
            /**
     * A method that returns the end of civil twilight using a zenith of {@link CIVIL_ZENITH 96&deg;}.
     *
     * @return {Temporal.ZonedDateTime | null} The `Date` of the end of civil twilight using a zenith of {@link CIVIL_ZENITH 96&deg;}. If
     *         the calculation can't be computed, null will be returned. See detailed explanation on top of the page.
     * @see CIVIL_ZENITH
     */ key: "getEndCivilTwilight",
            value: function getEndCivilTwilight() {
                return this.getSunsetOffsetByDegrees(NOAACalculator.CIVIL_ZENITH);
            }
        },
        {
            /**
     * A method that returns the end of nautical twilight using a zenith of {@link NAUTICAL_ZENITH 102&deg;}.
     *
     * @return {Temporal.ZonedDateTime | null} The `Date` of the end of nautical twilight using a zenith of {@link NAUTICAL_ZENITH 102&deg;}
     *         . If the calculation can't be computed, null will be returned. See detailed explanation on top of the
     *         page.
     * @see NAUTICAL_ZENITH
     */ key: "getEndNauticalTwilight",
            value: function getEndNauticalTwilight() {
                return this.getSunsetOffsetByDegrees(NOAACalculator.NAUTICAL_ZENITH);
            }
        },
        {
            /**
     * A method that returns the end of astronomical twilight using a zenith of {@link ASTRONOMICAL_ZENITH 108&deg;}.
     *
     * @return {Temporal.ZonedDateTime | null} The `Date` of the end of astronomical twilight using a zenith of {@link ASTRONOMICAL_ZENITH
     *         108&deg;}. If the calculation can't be computed, null will be returned. See detailed explanation on top
     *         of the page.
     * @see ASTRONOMICAL_ZENITH
     */ key: "getEndAstronomicalTwilight",
            value: function getEndAstronomicalTwilight() {
                return this.getSunsetOffsetByDegrees(NOAACalculator.ASTRONOMICAL_ZENITH);
            }
        },
        {
            /**
     * A utility method that returns the time of an offset by degrees below or above the horizon of
     * {@link getSunrise() sunrise}. Note that the degree offset is from the vertical, so for a calculation of 14&deg;
     * before sunrise, an offset of 14 + {@link GEOMETRIC_ZENITH} = 104 would have to be passed as a parameter.
     *
     * @param {number} offsetZenith
     *            the degrees before {@link getSunrise} to use in the calculation. For time after sunrise use
     *            negative numbers. Note that the degree offset is from the vertical, so for a calculation of 14&deg;
     *            before sunrise, an offset of 14 + {@link GEOMETRIC_ZENITH} = 104 would have to be passed as a
     *            parameter.
     * @return {Temporal.ZonedDateTime | null} The `Date` of the offset after (or before) {@link getSunrise}. If the calculation
     *         can't be computed such as in the Arctic Circle where there is at least one day a year where the sun does
     *         not rise, and one where it does not set, a null will be returned. See detailed explanation on top of the
     *         page.
     */ key: "getSunriseOffsetByDegrees",
            value: function getSunriseOffsetByDegrees(offsetZenith) {
                var dawn = this.getUTCSunrise0(offsetZenith);
                if (isNaN(dawn)) return null;
                return this.getDateFromTime(dawn, true);
            }
        },
        {
            /**
     * A utility method that returns the time of an offset by degrees below or above the horizon of {@link getSunset()
     * sunset}. Note that the degree offset is from the vertical, so for a calculation of 14&deg; after sunset, an
     * offset of 14 + {@link GEOMETRIC_ZENITH} = 104 would have to be passed as a parameter.
     *
     * @param {number} offsetZenith
     *            the degrees after {@link getSunset} to use in the calculation. For time before sunset use negative
     *            numbers. Note that the degree offset is from the vertical, so for a calculation of 14&deg; after
     *            sunset, an offset of 14 + {@link GEOMETRIC_ZENITH} = 104 would have to be passed as a parameter.
     * @return {Temporal.ZonedDateTime | null} The `Date`of the offset after (or before) {@link getSunset}. If the calculation can't
     *         be computed such as in the Arctic Circle where there is at least one day a year where the sun does not
     *         rise, and one where it does not set, a null will be returned. See detailed explanation on top of the
     *         page.
     */ key: "getSunsetOffsetByDegrees",
            value: function getSunsetOffsetByDegrees(offsetZenith) {
                var sunset = this.getUTCSunset0(offsetZenith);
                if (isNaN(sunset)) return null;
                return this.getDateFromTime(sunset, false);
            }
        },
        {
            /**
     * A method that returns the sunrise in UTC time without correction for time zone offset from GMT and without using
     * daylight savings time.
     *
     * @param {number} zenith
     *            the degrees below the horizon. For time after sunrise use negative numbers.
     * @return {number} The time in the format: 18.75 for 18:45:00 UTC/GMT. If the calculation can't be computed such as in the
     *         Arctic Circle where there is at least one day a year where the sun does not rise, and one where it does
     *         not set, `NaN` will be returned. See detailed explanation on top of the page.
     */ key: "getUTCSunrise0",
            value: function getUTCSunrise0(zenith) {
                return this.getUTCSunrise(this.getAdjustedDate(), this.geoLocation, zenith, true);
            }
        },
        {
            /**
     * A method that returns the sunrise in UTC time without correction for time zone offset from GMT and without using
     * daylight savings time. Non-sunrise and sunset calculations such as dawn and dusk, depend on the amount of visible
     * light, something that is not affected by elevation. This method returns UTC sunrise calculated at sea level. This
     * forms the base for dawn calculations that are calculated as a dip below the horizon before sunrise.
     *
     * @param {number} zenith
     *            the degrees below the horizon. For time after sunrise use negative numbers.
     * @return {number} The time in the format: 18.75 for 18:45:00 UTC/GMT. If the calculation can't be computed such as in the
     *         Arctic Circle where there is at least one day a year where the sun does not rise, and one where it does
     *         not set, `NaN` will be returned. See detailed explanation on top of the page.
     * @see getUTCSunrise
     * @see getUTCSeaLevelSunset
     */ key: "getUTCSeaLevelSunrise",
            value: function getUTCSeaLevelSunrise(zenith) {
                return this.getUTCSunrise(this.getAdjustedDate(), this.geoLocation, zenith, false);
            }
        },
        {
            /**
     * A method that returns the sunset in UTC time without correction for time zone offset from GMT and without using
     * daylight savings time.
     *
     * @param {number} zenith
     *            the degrees below the horizon. For time after sunset use negative numbers.
     * @return {number} The time in the format: 18.75 for 18:45:00 UTC/GMT. If the calculation can't be computed such as in the
     *         Arctic Circle where there is at least one day a year where the sun does not rise, and one where it does
     *         not set, `NaN` will be returned. See detailed explanation on top of the page.
     * @see getUTCSeaLevelSunset
     */ key: "getUTCSunset0",
            value: function getUTCSunset0(zenith) {
                return this.getUTCSunset(this.getAdjustedDate(), this.geoLocation, zenith, true);
            }
        },
        {
            /**
     * A method that returns the sunset in UTC time without correction for elevation, time zone offset from GMT and
     * without using daylight savings time. Non-sunrise and sunset calculations such as dawn and dusk, depend on the
     * amount of visible light, something that is not affected by elevation. This method returns UTC sunset calculated
     * at sea level. This forms the base for dusk calculations that are calculated as a dip below the horizon after
     * sunset.
     *
     * @param {number} zenith
     *            the degrees below the horizon. For time before sunset use negative numbers.
     * @return {number} The time in the format: 18.75 for 18:45:00 UTC/GMT. If the calculation can't be computed such as in the
     *         Arctic Circle where there is at least one day a year where the sun does not rise, and one where it does
     *         not set, `NaN` will be returned. See detailed explanation on top of the page.
     * @see getUTCSunset
     * @see getUTCSeaLevelSunrise
     */ key: "getUTCSeaLevelSunset",
            value: function getUTCSeaLevelSunset(zenith) {
                return this.getUTCSunset(this.getAdjustedDate(), this.geoLocation, zenith, false);
            }
        },
        {
            /**
     * Adjusts the <code>Calendar</code> to deal with edge cases where the location crosses the antimeridian.
     * @private
     * @see GeoLocation#getAntimeridianAdjustment()
     * @return the adjusted Calendar
     */ key: "getAdjustedDate",
            value: function getAdjustedDate() {
                return this.date;
            }
        },
        {
            /**
     * Method to return the adjustment to the zenith required to account for the elevation. Since a person at a higher
     * elevation can see farther below the horizon, the calculation for sunrise / sunset is calculated below the horizon
     * used at sea level. This is only used for sunrise and sunset and not times before or after it such as
     * {@link getBeginNauticalTwilight() nautical twilight} since those
     * calculations are based on the level of available light at the given dip below the horizon, something that is not
     * affected by elevation, the adjustment should only made if the zenith == 90&deg; {@link adjustZenith adjusted}
     * for refraction and solar radius. The algorithm used is
     *
     * <pre>
     * elevationAdjustment = Math.toDegrees(Math.acos(earthRadiusInMeters / (earthRadiusInMeters + elevationMeters)));
     * </pre>
     *
     * The source of this algorithm is <a href="http://www.calendarists.com">Calendrical Calculations</a> by Edward M.
     * Reingold and Nachum Dershowitz. An alternate algorithm that produces an almost identical (but not accurate)
     * result found in Ma'aglay Tzedek by Moishe Kosower and other sources is:
     *
     * <pre>
     * elevationAdjustment = 0.0347 * Math.sqrt(elevationMeters);
     * </pre>
     *
     * @param {number} elevation
     *            elevation in Meters.
     * @return {number} the adjusted zenith
     */ key: "getElevationAdjustment",
            value: function getElevationAdjustment(elevation) {
                // double elevationAdjustment = 0.0347 * Math.sqrt(elevation);
                var elevationAdjustment = radiansToDegrees(Math.acos(earthRadius / (earthRadius + elevation / 1000)));
                return elevationAdjustment;
            }
        },
        {
            /**
     * Adjusts the zenith of astronomical sunrise and sunset to account for solar refraction, solar radius and
     * elevation. The value for Sun's zenith and true rise/set Zenith (used in this class and subclasses) is the angle
     * that the center of the Sun makes to a line perpendicular to the Earth's surface. If the Sun were a point and the
     * Earth were without an atmosphere, true sunset and sunrise would correspond to a 90&deg; zenith. Because the Sun
     * is not a point, and because the atmosphere refracts light, this 90&deg; zenith does not, in fact, correspond to
     * true sunset or sunrise, instead the centre of the Sun's disk must lie just below the horizon for the upper edge
     * to be obscured. This means that a zenith of just above 90&deg; must be used. The Sun subtends an angle of 16
     * minutes of arc, and atmospheric refraction
     * accounts for 34 minutes or so, giving a total
     * of 50 arcminutes. The total value for ZENITH is 90+(5/6) or 90.8333333&deg; for true sunrise/sunset. Since a
     * person at an elevation can see blow the horizon of a person at sea level, this will also adjust the zenith to
     * account for elevation if available. Note that this will only adjust the value if the zenith is exactly 90 degrees.
     * For values below and above this no correction is done. As an example, astronomical twilight is when the sun is
     * 18&deg; below the horizon or {@link ASTRONOMICAL_ZENITH 108&deg;
     * below the zenith}. This is traditionally calculated with none of the above mentioned adjustments. The same goes
     * for various <em>tzais</em> and <em>alos</em> times such as the
     * {@link ZmanimCalendar#ZENITH_16_POINT_1 16.1&deg;} dip used in
     * {@link ComplexZmanimCalendar#getAlos16Point1Degrees}.
     *
     * @param {number} zenith
     *            the azimuth below the vertical zenith of 90&deg;. For sunset typically the {@link adjustZenith
     *            zenith} used for the calculation uses geometric zenith of 90&deg; and {@link adjustZenith adjusts}
     *            this slightly to account for solar refraction and the sun's radius. Another example would be
     *            {@link getEndNauticalTwilight} that passes
     *            {@link NAUTICAL_ZENITH} to this method.
     * @param {number} elevation
     *            elevation in Meters.
     * @return {number} The zenith adjusted to include the sun's radius, refracton
     *         and {@link getElevationAdjustment elevation} adjustment. This will only be adjusted for
     *         sunrise and sunset (if the zenith == 90&deg;)
     * @see getElevationAdjustment
     */ key: "adjustZenith",
            value: function adjustZenith(zenith, elevation) {
                var adjustedZenith = zenith;
                if (zenith === NOAACalculator.GEOMETRIC_ZENITH) {
                    // only adjust if it is exactly sunrise or sunset
                    adjustedZenith = zenith + (solarRadius + refraction + this.getElevationAdjustment(elevation));
                }
                return adjustedZenith;
            }
        },
        {
            /**
     * A method that calculates UTC sunrise as well as any time based on an angle above or below sunrise.
     * @param date
     *            Used to calculate day of year.
     * @param geoLocation
     *            The location information used for astronomical calculating sun times.
     * @param zenith
     *            the azimuth below the vertical zenith of 90 degrees. for sunrise typically the {@link adjustZenith
     *            zenith} used for the calculation uses geometric zenith of 90&deg; and {@link adjustZenith adjusts}
     *            this slightly to account for solar refraction and the sun's radius. Another example would be
     *            {@link getBeginNauticalTwilight} that passes
     *            {@link NAUTICAL_ZENITH} to this method.
     * @param adjustForElevation
     *            Should the time be adjusted for elevation
     * @return The UTC time of sunrise in 24 hour format. 5:45:00 AM will return 5.75.0. If an error was encountered in
     *         the calculation (expected behavior for some locations such as near the poles,
     *         `NaN` will be returned.
     */ key: "getUTCSunrise",
            value: function getUTCSunrise(date, geoLocation, zenith, adjustForElevation) {
                var elevation = adjustForElevation ? geoLocation.getElevation() : 0;
                var adjustedZenith = this.adjustZenith(zenith, elevation);
                var sunrise = NOAACalculator.getSunriseUTC(NOAACalculator.getJulianDay(date), geoLocation.getLatitude(), -geoLocation.getLongitude(), adjustedZenith);
                sunrise = sunrise / 60;
                // ensure that the time is >= 0 and < 24
                while(sunrise < 0){
                    sunrise += 24;
                }
                while(sunrise >= 24){
                    sunrise -= 24;
                }
                return sunrise;
            }
        },
        {
            /**
     * A method that calculates UTC sunset as well as any time based on an angle above or below sunset.
     * @param date
     *            Used to calculate day of year.
     * @param geoLocation
     *            The location information used for astronomical calculating sun times.
     * @param zenith
     *            the azimuth below the vertical zenith of 90&deg;. For sunset typically the {@link adjustZenith
     *            zenith} used for the calculation uses geometric zenith of 90&deg; and {@link adjustZenith adjusts}
     *            this slightly to account for solar refraction and the sun's radius. Another example would be
     *            {@link getEndNauticalTwilight} that passes
     *            {@link NAUTICAL_ZENITH} to this method.
     * @param adjustForElevation
     *            Should the time be adjusted for elevation
     * @return The UTC time of sunset in 24 hour format. 5:45:00 AM will return 5.75.0. If an error was encountered in
     *         the calculation (expected behavior for some locations such as near the poles,
     *         `NaN` will be returned.
     */ key: "getUTCSunset",
            value: function getUTCSunset(date, geoLocation, zenith, adjustForElevation) {
                var elevation = adjustForElevation ? geoLocation.getElevation() : 0;
                var adjustedZenith = this.adjustZenith(zenith, elevation);
                var sunset = NOAACalculator.getSunsetUTC(NOAACalculator.getJulianDay(date), geoLocation.getLatitude(), -geoLocation.getLongitude(), adjustedZenith);
                sunset = sunset / 60;
                // ensure that the time is >= 0 and < 24
                while(sunset < 0){
                    sunset += 24;
                }
                while(sunset >= 24){
                    sunset -= 24;
                }
                return sunset;
            }
        },
        {
            /**
     * A utility method that will allow the calculation of a temporal (solar) hour based on the sunrise and sunset
     * passed as parameters to this method. An example of the use of this method would be the calculation of a
     * non-elevation adjusted temporal hour by passing in {@link getSeaLevelSunrise() sea level sunrise} and
     * {@link getSeaLevelSunset() sea level sunset} as parameters.
     *
     * @param {Temporal.ZonedDateTime | null} startOfDay
     *            The start of the day.
     * @param {Temporal.ZonedDateTime | null} endOfDay
     *            The end of the day.
     *
     * @return {number} the <code>long</code> millisecond length of the temporal hour. If the calculation can't be computed a
     *         `NaN` will be returned. See detailed explanation on top of the page.
     *
     * @see getTemporalHour()
     */ key: "getTemporalHour",
            value: function getTemporalHour() {
                var startOfDay = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : this.getSeaLevelSunrise(), endOfDay = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : this.getSeaLevelSunset();
                if (startOfDay === null || endOfDay === null) {
                    return NaN;
                }
                var delta = endOfDay.epochMilliseconds - startOfDay.epochMilliseconds;
                return Math.floor(delta / 12);
            }
        },
        {
            /**
     * A method that returns sundial or solar noon. It occurs when the Sun is <a href
     * ="http://en.wikipedia.org/wiki/Transit_%28astronomy%29">transiting</a> the <a
     * href="http://en.wikipedia.org/wiki/Meridian_%28astronomy%29">celestial meridian</a>. In this class it is
     * calculated as halfway between the sunrise and sunset passed to this method. This time can be slightly off the
     * real transit time due to changes in declination (the lengthening or shortening day).
     *
     * @param {Temporal.ZonedDateTime | null} startOfDay
     *            the start of day for calculating the sun's transit. This can be sea level sunrise, visual sunrise (or
     *            any arbitrary start of day) passed to this method.
     * @param {Temporal.ZonedDateTime | null} endOfDay
     *            the end of day for calculating the sun's transit. This can be sea level sunset, visual sunset (or any
     *            arbitrary end of day) passed to this method.
     *
     * @return {Temporal.ZonedDateTime | null} The `Date` representing Sun's transit. If the calculation can't be computed such as in the
     *         Arctic Circle where there is at least one day a year where the sun does not rise, and one where it does
     *         not set, null will be returned. See detailed explanation on top of the page.
     */ key: "getSunTransit",
            value: function getSunTransit() {
                var startOfDay = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : this.getSeaLevelSunrise(), endOfDay = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : this.getSeaLevelSunset();
                var temporalHour = this.getTemporalHour(startOfDay, endOfDay);
                return NOAACalculator.getTimeOffset(startOfDay, temporalHour * 6);
            }
        },
        {
            /**
     * A method that returns a `Date` from the time passed in as a parameter.
     * @protected
     * @param {number} time
     *            The time to be set as the time for the `Date`. The time expected is in the format: 18.75
     *            for 6:45:00 PM.
     * @param {boolean} isSunrise true if the time is sunrise, and false if it is sunset
     * @return {Temporal.ZonedDateTime | null} The Date.
     */ key: "getDateFromTime",
            value: function getDateFromTime(time, isSunrise) {
                if (isNaN(time)) {
                    return null;
                }
                var calculatedTime = time;
                var cal = this.getAdjustedDate();
                //    let cal = new Temporal.PlainDate(adj.year, adj.month, adj.day);
                var hours = Math.trunc(calculatedTime); // retain only the hours
                calculatedTime -= hours;
                var minutes = Math.trunc(calculatedTime *= 60); // retain only the minutes
                calculatedTime -= minutes;
                var seconds = Math.trunc(calculatedTime *= 60); // retain only the seconds
                calculatedTime -= seconds; // remaining milliseconds
                // Check if a date transition has occurred, or is about to occur - this indicates the date of the event is
                // actually not the target date, but the day prior or after
                var localTimeHours = Math.trunc(this.geoLocation.getLongitude() / 15);
                if (isSunrise && localTimeHours + hours > 18) {
                    cal = cal.add({
                        days: -1
                    });
                //      cal = cal.minus({days: 1});
                } else if (!isSunrise && localTimeHours + hours < 6) {
                    cal = cal.add({
                        days: 1
                    });
                }
                return cal.toZonedDateTime({
                    timeZone: 'UTC',
                    plainTime: new Temporal.PlainTime(hours, minutes, seconds, Math.trunc(calculatedTime * 1000))
                }).withTimeZone(this.geoLocation.getTimeZone());
            }
        }
    ], [
        {
            key: "getTimeOffset",
            value: /**
     * A utility method that returns a date offset by the offset time passed in. Please note that the level of light
     * during twilight is not affected by elevation, so if this is being used to calculate an offset before sunrise or
     * after sunset with the intent of getting a rough "level of light" calculation, the sunrise or sunset time passed
     * to this method should be sea level sunrise and sunset.
     *
     * @param {Temporal.ZonedDateTime | null} time
     *            the start time
     * @param {number} offset
     *            the offset in milliseconds to add to the time.
     * @return {Temporal.ZonedDateTime | null} the `Date` with the offset in milliseconds added to it
     */ function getTimeOffset(time, offset) {
                if (time === null || isNaN(offset)) {
                    return null;
                }
                return time.add({
                    milliseconds: offset
                });
            }
        },
        {
            key: "getJulianDay",
            value: /**
     * Return the <a href="http://en.wikipedia.org/wiki/Julian_day">Julian day</a> from a Java Calendar
     * @private
     * @param {Temporal.ZonedDateTime} date
     *            The Java Calendar
     * @return the Julian day corresponding to the date Note: Number is returned for start of day. Fractional days
     *         should be added later.
     */ function getJulianDay(date) {
                var year = date.year, month = date.month;
                var day = date.day;
                if (month <= 2) {
                    year -= 1;
                    month += 12;
                }
                var a = Math.trunc(year / 100);
                var b = Math.trunc(2 - a + a / 4);
                return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
            }
        },
        {
            key: "getJulianCenturiesFromJulianDay",
            value: /**
     * Convert <a href="http://en.wikipedia.org/wiki/Julian_day">Julian day</a> to centuries since J2000.0.
     * @private
     * @param julianDay
     *            the Julian Day to convert
     * @return the centuries since 2000 Julian corresponding to the Julian Day
     */ function getJulianCenturiesFromJulianDay(julianDay) {
                return (julianDay - NOAACalculator.JULIAN_DAY_JAN_1_2000) / NOAACalculator.JULIAN_DAYS_PER_CENTURY;
            }
        },
        {
            key: "getJulianDayFromJulianCenturies",
            value: /**
     * Convert centuries since J2000.0 to <a href="http://en.wikipedia.org/wiki/Julian_day">Julian day</a>.
     * @private
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return the Julian Day corresponding to the Julian centuries passed in
     */ function getJulianDayFromJulianCenturies(julianCenturies) {
                return julianCenturies * NOAACalculator.JULIAN_DAYS_PER_CENTURY + NOAACalculator.JULIAN_DAY_JAN_1_2000;
            }
        },
        {
            key: "getSunGeometricMeanLongitude",
            value: /**
     * Returns the Geometric <a href="http://en.wikipedia.org/wiki/Mean_longitude">Mean Longitude</a> of the Sun.
     * @private
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return the Geometric Mean Longitude of the Sun in degrees
     */ function getSunGeometricMeanLongitude(julianCenturies) {
                var longitude = 280.46646 + julianCenturies * (36000.76983 + 0.0003032 * julianCenturies);
                while(longitude > 360){
                    longitude -= 360;
                }
                while(longitude < 0){
                    longitude += 360;
                }
                return longitude; // in degrees
            }
        },
        {
            key: "getSunGeometricMeanAnomaly",
            value: /**
     * Returns the Geometric <a href="http://en.wikipedia.org/wiki/Mean_anomaly">Mean Anomaly</a> of the Sun.
     * @private
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return the Geometric Mean Anomaly of the Sun in degrees
     */ function getSunGeometricMeanAnomaly(julianCenturies) {
                return 357.52911 + julianCenturies * (35999.05029 - 0.0001537 * julianCenturies); // in degrees
            }
        },
        {
            key: "getEarthOrbitEccentricity",
            value: /**
     * Return the <a href="http://en.wikipedia.org/wiki/Eccentricity_%28orbit%29">eccentricity of earth's orbit</a>.
     * @private
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return the unitless eccentricity
     */ function getEarthOrbitEccentricity(julianCenturies) {
                return 0.016708634 - julianCenturies * (0.000042037 + 0.0000001267 * julianCenturies); // unitless
            }
        },
        {
            key: "getSunEquationOfCenter",
            value: /**
     * Returns the <a href="http://en.wikipedia.org/wiki/Equation_of_the_center">equation of center</a> for the sun.
     * @private
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return the equation of center for the sun in degrees
     */ function getSunEquationOfCenter(julianCenturies) {
                var m = NOAACalculator.getSunGeometricMeanAnomaly(julianCenturies);
                var mrad = degreesToRadians(m);
                var sinm = Math.sin(mrad);
                var sin2m = Math.sin(mrad + mrad);
                var sin3m = Math.sin(mrad + mrad + mrad);
                return sinm * (1.914602 - julianCenturies * (0.004817 + 0.000014 * julianCenturies)) + sin2m * (0.019993 - 0.000101 * julianCenturies) + sin3m * 0.000289; // in degrees
            }
        },
        {
            key: "getSunTrueLongitude",
            value: /**
     * Return the true longitude of the sun
     * @private
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return the sun's true longitude in degrees
     */ function getSunTrueLongitude(julianCenturies) {
                var sunLongitude = NOAACalculator.getSunGeometricMeanLongitude(julianCenturies);
                var center = NOAACalculator.getSunEquationOfCenter(julianCenturies);
                return sunLongitude + center; // in degrees
            }
        },
        {
            key: "getSunApparentLongitude",
            value: /**
     * Return the apparent longitude of the sun
     * @private
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return sun's apparent longitude in degrees
     */ function getSunApparentLongitude(julianCenturies) {
                var sunTrueLongitude = NOAACalculator.getSunTrueLongitude(julianCenturies);
                var omega = 125.04 - 1934.136 * julianCenturies;
                var lambda = sunTrueLongitude - 0.00569 - 0.00478 * Math.sin(degreesToRadians(omega));
                return lambda; // in degrees
            }
        },
        {
            key: "getMeanObliquityOfEcliptic",
            value: /**
     * Returns the mean <a href="http://en.wikipedia.org/wiki/Axial_tilt">obliquity of the ecliptic</a> (Axial tilt).
     * @private
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return the mean obliquity in degrees
     */ function getMeanObliquityOfEcliptic(julianCenturies) {
                var seconds = 21.448 - julianCenturies * (46.815 + julianCenturies * (0.00059 - julianCenturies * 0.001813));
                return 23 + (26 + seconds / 60) / 60; // in degrees
            }
        },
        {
            key: "getObliquityCorrection",
            value: /**
     * Returns the corrected <a href="http://en.wikipedia.org/wiki/Axial_tilt">obliquity of the ecliptic</a> (Axial
     * tilt).
     * @private
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return the corrected obliquity in degrees
     */ function getObliquityCorrection(julianCenturies) {
                var obliquityOfEcliptic = NOAACalculator.getMeanObliquityOfEcliptic(julianCenturies);
                var omega = 125.04 - 1934.136 * julianCenturies;
                return obliquityOfEcliptic + 0.00256 * Math.cos(degreesToRadians(omega)); // in degrees
            }
        },
        {
            key: "getSunDeclination",
            value: /**
     * Return the <a href="http://en.wikipedia.org/wiki/Declination">declination</a> of the sun.
     * @private
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return
     *            the sun's declination in degrees
     */ function getSunDeclination(julianCenturies) {
                var obliquityCorrection = NOAACalculator.getObliquityCorrection(julianCenturies);
                var lambda = NOAACalculator.getSunApparentLongitude(julianCenturies);
                var sint = Math.sin(degreesToRadians(obliquityCorrection)) * Math.sin(degreesToRadians(lambda));
                var theta = radiansToDegrees(Math.asin(sint));
                return theta; // in degrees
            }
        },
        {
            key: "getEquationOfTime",
            value: /**
     * Return the <a href="http://en.wikipedia.org/wiki/Equation_of_time">Equation of Time</a> - the difference between
     * true solar time and mean solar time
     * @private
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return equation of time in minutes of time
     */ function getEquationOfTime(julianCenturies) {
                var epsilon = NOAACalculator.getObliquityCorrection(julianCenturies);
                var geomMeanLongSun = NOAACalculator.getSunGeometricMeanLongitude(julianCenturies);
                var eccentricityEarthOrbit = NOAACalculator.getEarthOrbitEccentricity(julianCenturies);
                var geomMeanAnomalySun = NOAACalculator.getSunGeometricMeanAnomaly(julianCenturies);
                var y = Math.tan(degreesToRadians(epsilon) / 2);
                y *= y;
                var sin2l0 = Math.sin(2 * degreesToRadians(geomMeanLongSun));
                var sinm = Math.sin(degreesToRadians(geomMeanAnomalySun));
                var cos2l0 = Math.cos(2 * degreesToRadians(geomMeanLongSun));
                var sin4l0 = Math.sin(4 * degreesToRadians(geomMeanLongSun));
                var sin2m = Math.sin(2 * degreesToRadians(geomMeanAnomalySun));
                var equationOfTime = y * sin2l0 - 2 * eccentricityEarthOrbit * sinm + 4 * eccentricityEarthOrbit * y * sinm * cos2l0 - 0.5 * y * y * sin4l0 - 1.25 * eccentricityEarthOrbit * eccentricityEarthOrbit * sin2m;
                return radiansToDegrees(equationOfTime) * 4; // in minutes of time
            }
        },
        {
            key: "getSunHourAngleAtSunrise",
            value: /**
     * Return the <a href="http://en.wikipedia.org/wiki/Hour_angle">hour angle</a> of the sun at sunrise for the
     * latitude.
     * @private
     * @param {number} lat
     *            , the latitude of observer in degrees
     * @param solarDec
     *            the declination angle of sun in degrees
     * @param {number} zenith
     *            the zenith
     * @return hour angle of sunrise in radians
     */ function getSunHourAngleAtSunrise(lat, solarDec, zenith) {
                var latRad = degreesToRadians(lat);
                var sdRad = degreesToRadians(solarDec);
                return Math.acos(Math.cos(degreesToRadians(zenith)) / (Math.cos(latRad) * Math.cos(sdRad)) - Math.tan(latRad) * Math.tan(sdRad)); // in radians
            }
        },
        {
            key: "getSunHourAngleAtSunset",
            value: /**
     * Returns the <a href="http://en.wikipedia.org/wiki/Hour_angle">hour angle</a> of the sun at sunset for the
     * latitude.
     * @private
     * @param {number} lat
     *            the latitude of observer in degrees
     * @param solarDec
     *            the declination angle of sun in degrees
     * @param {number} zenith
     *            the zenith
     * @return the hour angle of sunset in radians
     */ function getSunHourAngleAtSunset(lat, solarDec, zenith) {
                var latRad = degreesToRadians(lat);
                var sdRad = degreesToRadians(solarDec);
                var hourAngle = Math.acos(Math.cos(degreesToRadians(zenith)) / (Math.cos(latRad) * Math.cos(sdRad)) - Math.tan(latRad) * Math.tan(sdRad));
                return -hourAngle; // in radians
            }
        },
        {
            key: "getSolarElevation",
            value: /**
     * Return the <a href="http://en.wikipedia.org/wiki/Celestial_coordinate_system">Solar Elevation</a> for the
     * horizontal coordinate system at the given location at the given time. Can be negative if the sun is below the
     * horizon. Not corrected for altitude.
     *
     * @param {Temporal.ZonedDateTime} date
     *            time of calculation
     * @param {number} lat
     *            latitude of location for calculation
     * @param {number} lon
     *            longitude of location for calculation
     * @return {number} solar elevation in degrees - horizon is 0 degrees, civil twilight is -6 degrees
     */ function getSolarElevation(date, lat, lon) {
                var julianDay = NOAACalculator.getJulianDay(date.toPlainDate());
                var julianCenturies = NOAACalculator.getJulianCenturiesFromJulianDay(julianDay);
                var equationOfTime = NOAACalculator.getEquationOfTime(julianCenturies);
                var longitude = date.hour + 12 + (date.minute + equationOfTime + date.second / 60) / 60;
                longitude = -(longitude * 360 / 24) % 360;
                var hourAngleRad = degreesToRadians(lon - longitude);
                var declination = NOAACalculator.getSunDeclination(julianCenturies);
                var decRad = degreesToRadians(declination);
                var latRad = degreesToRadians(lat);
                return radiansToDegrees(Math.asin(Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourAngleRad)));
            }
        },
        {
            key: "getSolarAzimuth",
            value: /**
     * Return the <a href="http://en.wikipedia.org/wiki/Celestial_coordinate_system">Solar Azimuth</a> for the
     * horizontal coordinate system at the given location at the given time. Not corrected for altitude. True south is 0
     * degrees.
     *
     * @param {Temporal.ZonedDateTime} date
     *            time of calculation
     * @param {number} latitude
     *            latitude of location for calculation
     * @param {number} lon
     *            longitude of location for calculation
     * @return {number}
     */ function getSolarAzimuth(date, latitude, lon) {
                var julianDay = NOAACalculator.getJulianDay(date.toPlainDate());
                var julianCenturies = NOAACalculator.getJulianCenturiesFromJulianDay(julianDay);
                var equationOfTime = NOAACalculator.getEquationOfTime(julianCenturies);
                var longitude = date.hour + 12 + (date.minute + equationOfTime + date.second / 60) / 60;
                longitude = -(longitude * 360 / 24) % 360;
                var hourAngleRad = degreesToRadians(lon - longitude);
                var declination = NOAACalculator.getSunDeclination(julianCenturies);
                var decRad = degreesToRadians(declination);
                var latRad = degreesToRadians(latitude);
                return radiansToDegrees(Math.atan(Math.sin(hourAngleRad) / (Math.cos(hourAngleRad) * Math.sin(latRad) - Math.tan(decRad) * Math.cos(latRad)))) + 180;
            }
        },
        {
            key: "getSunriseUTC",
            value: /**
     * Return the <a href="http://en.wikipedia.org/wiki/Universal_Coordinated_Time">Universal Coordinated Time</a> (UTC)
     * of sunrise for the given day at the given location on earth
     * @private
     * @param julianDay
     *            the Julian day
     * @param {number} latitude
     *            the latitude of observer in degrees
     * @param {number} longitude
     *            the longitude of observer in degrees
     * @param {number} zenith
     *            the zenith
     * @return the time in minutes from zero UTC
     */ function getSunriseUTC(julianDay, latitude, longitude, zenith) {
                var julianCenturies = NOAACalculator.getJulianCenturiesFromJulianDay(julianDay);
                // Find the time of solar noon at the location, and use that declination. This is better than start of the
                // Julian day
                var noonmin = NOAACalculator.getSolarNoonUTC(julianCenturies, longitude);
                var tnoon = NOAACalculator.getJulianCenturiesFromJulianDay(julianDay + noonmin / 1440);
                // First pass to approximate sunrise (using solar noon)
                var eqTime = NOAACalculator.getEquationOfTime(tnoon);
                var solarDec = NOAACalculator.getSunDeclination(tnoon);
                var hourAngle = NOAACalculator.getSunHourAngleAtSunrise(latitude, solarDec, zenith);
                var delta = longitude - radiansToDegrees(hourAngle);
                var timeDiff = 4 * delta; // in minutes of time
                var timeUTC = 720 + timeDiff - eqTime; // in minutes
                // Second pass includes fractional Julian Day in gamma calc
                var newt = NOAACalculator.getJulianCenturiesFromJulianDay(NOAACalculator.getJulianDayFromJulianCenturies(julianCenturies) + timeUTC / 1440);
                eqTime = NOAACalculator.getEquationOfTime(newt);
                solarDec = NOAACalculator.getSunDeclination(newt);
                hourAngle = NOAACalculator.getSunHourAngleAtSunrise(latitude, solarDec, zenith);
                delta = longitude - radiansToDegrees(hourAngle);
                timeDiff = 4 * delta;
                timeUTC = 720 + timeDiff - eqTime; // in minutes
                return timeUTC;
            }
        },
        {
            key: "getSolarNoonUTC",
            value: /**
     * Return the <a href="http://en.wikipedia.org/wiki/Universal_Coordinated_Time">Universal Coordinated Time</a> (UTC)
     * of <a href="http://en.wikipedia.org/wiki/Noon#Solar_noon">solar noon</a> for the given day at the given location
     * on earth.
     * @private
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @param {number} longitude
     *            the longitude of observer in degrees
     * @return the time in minutes from zero UTC
     */ function getSolarNoonUTC(julianCenturies, longitude) {
                // First pass uses approximate solar noon to calculate eqtime
                var tnoon = NOAACalculator.getJulianCenturiesFromJulianDay(NOAACalculator.getJulianDayFromJulianCenturies(julianCenturies) + longitude / 360);
                var eqTime = NOAACalculator.getEquationOfTime(tnoon);
                var solNoonUTC = 720 + longitude * 4 - eqTime; // min
                var newt = NOAACalculator.getJulianCenturiesFromJulianDay(NOAACalculator.getJulianDayFromJulianCenturies(julianCenturies) - 0.5 + solNoonUTC / 1440);
                eqTime = NOAACalculator.getEquationOfTime(newt);
                return 720 + longitude * 4 - eqTime; // min
            }
        },
        {
            key: "getSunsetUTC",
            value: /**
     * Return the <a href="http://en.wikipedia.org/wiki/Universal_Coordinated_Time">Universal Coordinated Time</a> (UTC)
     * of sunset for the given day at the given location on earth
     * @private
     * @param julianDay
     *            the Julian day
     * @param {number} latitude
     *            the latitude of observer in degrees
     * @param {number} longitude
     *            : longitude of observer in degrees
     * @param {number} zenith
     *            the zenith
     * @return the time in minutes from zero Universal Coordinated Time (UTC)
     */ function getSunsetUTC(julianDay, latitude, longitude, zenith) {
                var julianCenturies = NOAACalculator.getJulianCenturiesFromJulianDay(julianDay);
                // Find the time of solar noon at the location, and use that declination. This is better than start of the
                // Julian day
                var noonmin = NOAACalculator.getSolarNoonUTC(julianCenturies, longitude);
                var tnoon = NOAACalculator.getJulianCenturiesFromJulianDay(julianDay + noonmin / 1440);
                // First calculates sunrise and approx length of day
                var eqTime = NOAACalculator.getEquationOfTime(tnoon);
                var solarDec = NOAACalculator.getSunDeclination(tnoon);
                var hourAngle = NOAACalculator.getSunHourAngleAtSunset(latitude, solarDec, zenith);
                var delta = longitude - radiansToDegrees(hourAngle);
                var timeDiff = 4 * delta;
                var timeUTC = 720 + timeDiff - eqTime;
                // Second pass includes fractional Julian Day in gamma calc
                var newt = NOAACalculator.getJulianCenturiesFromJulianDay(NOAACalculator.getJulianDayFromJulianCenturies(julianCenturies) + timeUTC / 1440);
                eqTime = NOAACalculator.getEquationOfTime(newt);
                solarDec = NOAACalculator.getSunDeclination(newt);
                hourAngle = NOAACalculator.getSunHourAngleAtSunset(latitude, solarDec, zenith);
                delta = longitude - radiansToDegrees(hourAngle);
                timeDiff = 4 * delta;
                timeUTC = 720 + timeDiff - eqTime; // in minutes
                return timeUTC;
            }
        }
    ]);
    return NOAACalculator;
}();
/**
 * The zenith of astronomical sunrise and sunset. The sun is 90&deg; from the vertical 0&deg;
 * @private
 */ NOAACalculator.GEOMETRIC_ZENITH = 90;
/**
 * Default value for Sun's zenith and true rise/set Zenith (used in this class and subclasses) is the angle that the
 * center of the Sun makes to a line perpendicular to the Earth's surface. If the Sun were a point and the Earth
 * were without an atmosphere, true sunset and sunrise would correspond to a 90&deg; zenith. Because the Sun is not
 * a point, and because the atmosphere refracts light, this 90&deg; zenith does not, in fact, correspond to true
 * sunset or sunrise, instead the center of the Sun's disk must lie just below the horizon for the upper edge to be
 * obscured. This means that a zenith of just above 90&deg; must be used. The Sun subtends an angle of 16 minutes of
 * arc, and atmospheric refraction accounts for
 * 34 minutes or so, giving a total of 50
 * arcminutes. The total value for ZENITH is 90+(5/6) or 90.8333333&deg; for true sunrise/sunset.
 */ // const ZENITH: number = GEOMETRIC_ZENITH + 5.0 / 6.0;
/** Sun's zenith at civil twilight (96&deg;). */ NOAACalculator.CIVIL_ZENITH = 96;
/** Sun's zenith at nautical twilight (102&deg;). */ NOAACalculator.NAUTICAL_ZENITH = 102;
/** Sun's zenith at astronomical twilight (108&deg;). */ NOAACalculator.ASTRONOMICAL_ZENITH = 108;
/**
 * The <a href="http://en.wikipedia.org/wiki/Julian_day">Julian day</a> of January 1, 2000
 * @private
 */ NOAACalculator.JULIAN_DAY_JAN_1_2000 = 2451545;
/**
 * Julian days per century
 * @private
 */ NOAACalculator.JULIAN_DAYS_PER_CENTURY = 36525;
}),
]);

//# sourceMappingURL=0r9g_%40hebcal_0gc8tn-._.js.map