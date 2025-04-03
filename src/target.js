(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.kollavarsham = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
d = require("kollavarsham")

module.exports.kollavarsham = d;
},{"kollavarsham":13}],2:[function(require,module,exports){
"use strict";
/*
 * kollavarsham
 * http://kollavarsham.org
 *
 * Copyright (c) 2014-2023 The Kollavarsham Team
 * Licensed under the MIT license.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Calculations = void 0;
/**
 * @module calculations
 */
var calendar_1 = require("./calendar");
var index_1 = require("./celestial/index");
var julianDate_1 = require("./dates/julianDate");
var kollavarshamDate_1 = require("./dates/kollavarshamDate");
var mathHelper_1 = require("./mathHelper");
var sakaDate_1 = require("./dates/sakaDate");
var Ujjain = {
    system: '',
    latitude: 23.2,
    longitude: 75.8
};
/**
 *
 *  **INTERNAL/PRIVATE**
 *
 * @class Calculations
 */
var Calculations = /** @class */ (function () {
    function Calculations(settings) {
        this.longitude = settings.longitude;
        this.latitude = settings.latitude;
        this.celestial = new index_1.Celestial(settings.system);
        this.calendar = new calendar_1.Calendar(this.celestial);
    }
    Calculations.getPaksa = function (tithi) {
        return tithi >= 15 ? 'Krsnapaksa' : 'Suklapaksa';
    };
    Calculations.prototype.fromGregorianToSaka = function (gregorianDate) {
        var year = gregorianDate.getFullYear();
        var julianDay = calendar_1.Calendar.gregorianDateToJulianDay(gregorianDate);
        var ahargana = calendar_1.Calendar.julianDayToAhargana(julianDay);
        // Calculate the SakaDate at 6 AM
        var timeAsFractionalDayAt6AM = 0.25; // time at 6 o'clock
        var sakaDate = this.celestialCalculations(ahargana, year, julianDay, timeAsFractionalDayAt6AM);
        // Calculate the SakaDate at the given time
        // (this is done only for the resulting the naksatra, which now has better precision)
        var timeFromGregorianDate = calendar_1.Calendar.timeIntoFractionalDay(gregorianDate);
        var sakaDateAtGivenTime = this.celestialCalculations(ahargana, year, julianDay, timeFromGregorianDate);
        sakaDate.naksatra = sakaDateAtGivenTime.naksatra;
        sakaDate.gregorianDate = gregorianDate; // set the input gregorian date
        return sakaDate;
    };
    Calculations.prototype.celestialCalculations = function (ahargana, year, julianDay, timeAsFractionalDay) {
        ahargana += timeAsFractionalDay;
        // Definition of desantara
        //      http://books.google.com/books?id=kt9DIY1g9HYC&pg=PA683&lpg=PA683&dq=desantara&source=bl&ots=NLd1wFKFfN&sig=jCfG95R-6eiSff3L73DCodijo1I&hl=en&sa=X&ei=uKgHU__uKOr7yAGm0YGoBQ&ved=0CF8Q6AEwCDgK#v=onepage&q=desantara&f=false
        var desantara = (this.longitude - Ujjain.longitude) / 360;
        // desantara
        ahargana -= desantara;
        // time of sunrise at local latitude
        var equationOfTime = this.celestial.getDaylightEquation(year, this.latitude, ahargana);
        ahargana -= equationOfTime;
        var _a = index_1.Celestial.getSunriseTime(timeAsFractionalDay, equationOfTime), sunriseHour = _a.sunriseHour, sunriseMinute = _a.sunriseMinute;
        var _b = this.celestial.setPlanetaryPositions(ahargana), trueSolarLongitude = _b.trueSolarLongitude, trueLunarLongitude = _b.trueLunarLongitude;
        // finding tithi and longitude of conjunction
        var tithi = index_1.Celestial.getTithi(trueSolarLongitude, trueLunarLongitude);
        // last conjunction & next conjunction
        var lastConjunctionLongitude = this.celestial.getLastConjunctionLongitude(ahargana, tithi);
        var nextConjunctionLongitude = this.celestial.getNextConjunctionLongitude(ahargana, tithi);
        var masaNum = calendar_1.Calendar.getMasaNum(trueSolarLongitude, lastConjunctionLongitude);
        // kali and Saka era
        var kaliYear = this.calendar.aharganaToKali(ahargana + (4 - masaNum) * 30);
        var sakaYear = calendar_1.Calendar.kaliToSaka(kaliYear);
        var tithiDay = mathHelper_1.MathHelper.truncate(tithi) + 1;
        var paksa = Calculations.getPaksa(tithiDay);
        tithiDay = tithiDay >= 15 ? tithiDay -= 15 : tithiDay;
        var _c = this.calendar.getSauraMasaAndSauraDivasa(ahargana, desantara), sauraMasa = _c.sauraMasa, sauraDivasa = _c.sauraDivasa;
        var sakaDate = new sakaDate_1.SakaDate(sakaYear, masaNum, tithiDay, paksa);
        sakaDate.julianDay = mathHelper_1.MathHelper.truncate(julianDay + 0.5);
        sakaDate.ahargana = mathHelper_1.MathHelper.truncate(ahargana + 0.5); // Remove the decimals
        sakaDate.originalAhargana = ahargana;
        sakaDate.sauraMasa = sauraMasa;
        sakaDate.sauraDivasa = sauraDivasa;
        sakaDate.naksatra = calendar_1.Calendar.getNaksatra(trueLunarLongitude);
        sakaDate.kaliYear = kaliYear;
        sakaDate.adhimasa = calendar_1.Calendar.getAdhimasa(lastConjunctionLongitude, nextConjunctionLongitude);
        sakaDate.fractionalTithi = mathHelper_1.MathHelper.fractional(tithi);
        sakaDate.sunriseHour = sunriseHour;
        sakaDate.sunriseMinute = sunriseMinute;
        return sakaDate;
    };
    Calculations.prototype.fromGregorian = function (gregorianDate) {
        var sakaDate = this.fromGregorianToSaka(gregorianDate);
        return sakaDate.generateKollavarshamDate();
    };
    Calculations.prototype.toGregorian = function (kollavarshamDate) {
        // TODO: Implement this to convert a Kollavarsham date to Gregorian
        console.log('kollavarshamDate: ' + JSON.stringify(kollavarshamDate)); // eslint-disable-line no-console
        throw new Error('Not implemented');
    };
    Calculations.prototype.toGregorianFromSaka = function (sakaDate) {
        // TODO: Remove this method??
        // This is implemented specifically for the pancanga-nodejs cli (https://github.com/kollavarsham/pancanga-nodejs)
        // Could be removed when toGregorian has been implemented based on this
        var sakaYear = sakaDate.year;
        var masaNum = sakaDate.month;
        var tithiDay = sakaDate.tithi;
        var paksa = sakaDate.paksa;
        if (paksa === 'Krsnapaksa') {
            tithiDay += 15;
        }
        var kaliYear = calendar_1.Calendar.sakaToKali(sakaYear);
        var ahargana = this.calendar.kaliToAhargana(kaliYear, masaNum, tithiDay);
        var julianDay = calendar_1.Calendar.aharganaToJulianDay(ahargana);
        julianDay += 0.5;
        var modernDate = calendar_1.Calendar.julianDayToModernDate(julianDay);
        if (julianDate_1.JulianDate.prototype.isPrototypeOf(modernDate)) { // eslint-disable-line no-prototype-builtins
            console.log('\nkollavarsham::toGregorianDate: *** Returning an instance of JulianDate class ***'); // eslint-disable-line no-console
        }
        // TODO: Not happy that the empty constructor will make this with MalayalamYear => 1, MalayalamMonth => 1, and MalayalamDate => 1
        // TODO: Think this through before implementing toGregorian above
        var kollavarshamDate = new kollavarshamDate_1.KollavarshamDate();
        kollavarshamDate.gregorianDate = modernDate;
        kollavarshamDate.julianDay = julianDay;
        kollavarshamDate.ahargana = ahargana;
        kollavarshamDate.sakaDate = sakaDate;
        return kollavarshamDate;
    };
    return Calculations;
}());
exports.Calculations = Calculations;

},{"./calendar":3,"./celestial/index":4,"./dates/julianDate":10,"./dates/kollavarshamDate":11,"./dates/sakaDate":12,"./mathHelper":14}],3:[function(require,module,exports){
"use strict";
/*
 * kollavarsham
 * http://kollavarsham.org
 *
 * Copyright (c) 2014-2023 The Kollavarsham Team
 * Licensed under the MIT license.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Calendar = void 0;
/**
 * @module calendar
 */
var julianDate_1 = require("./dates/julianDate");
var mathHelper_1 = require("./mathHelper");
// TODO: Refactor this out
var samkranti = {
    ahargana: -1,
    Year: -1,
    Month: -1,
    Day: -1,
    Hour: -1,
    Min: -1
};
/**
 *
 *  **INTERNAL/PRIVATE**
 *
 * @class Calendar
 */
var Calendar = /** @class */ (function () {
    function Calendar(celestial) {
        this.celestial = celestial;
    }
    Object.defineProperty(Calendar, "weekdays", {
        get: function () {
            return {
                0: { en: 'Monday', ml: 'തിങ്കൾ' },
                1: { en: 'Tuesday', ml: 'ചൊവ്വ' },
                2: { en: 'Wednesday', ml: 'ബുധൻ' },
                3: { en: 'Thursday', ml: 'വ്യാഴം' },
                4: { en: 'Friday', ml: 'വെള്ളി' },
                5: { en: 'Saturday', ml: 'ശനി' },
                6: { en: 'Sunday', ml: 'ഞായർ' }
            };
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Calendar, "months", {
        get: function () {
            return {
                January: 0,
                February: 1,
                March: 2,
                April: 3,
                May: 4,
                June: 5,
                July: 6,
                August: 7,
                September: 8,
                October: 9,
                November: 10,
                December: 11
            };
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Calendar, "naksatras", {
        get: function () {
            var _a;
            return _a = {},
                _a[-1] = { saka: '', enMalayalam: '', mlMalayalam: '' },
                _a[0] = { saka: 'Asvini', enMalayalam: 'Ashwathi', mlMalayalam: 'അശ്വതി' },
                _a[1] = { saka: 'Bharani', enMalayalam: 'Bharani', mlMalayalam: 'ഭരണി' },
                _a[2] = { saka: 'Krttika', enMalayalam: 'Karthika', mlMalayalam: 'കാർത്തിക' },
                _a[3] = { saka: 'Rohini', enMalayalam: 'Rohini', mlMalayalam: 'രോഹിണി' },
                _a[4] = { saka: 'Mrgasira', enMalayalam: 'Makiryam', mlMalayalam: 'മകയിരം' },
                _a[5] = { saka: 'Ardra', enMalayalam: 'Thiruvathira', mlMalayalam: 'തിരുവാതിര' },
                _a[6] = { saka: 'Punarvasu', enMalayalam: 'Punartham', mlMalayalam: 'പുണർതം' },
                _a[7] = { saka: 'Pusya', enMalayalam: 'Pooyam', mlMalayalam: 'പൂയം' },
                _a[8] = { saka: 'Aslesa', enMalayalam: 'Aayilyam', mlMalayalam: 'ആയില്യം' },
                _a[9] = { saka: 'Magha', enMalayalam: 'Makam', mlMalayalam: 'മകം' },
                _a[10] = { saka: 'P-phalguni', enMalayalam: 'Pooram', mlMalayalam: 'പൂരം' },
                _a[11] = { saka: 'U-phalguni', enMalayalam: 'Uthram', mlMalayalam: 'ഉത്രം' },
                _a[12] = { saka: 'Hasta', enMalayalam: 'Atham', mlMalayalam: 'അത്തം' },
                _a[13] = { saka: 'Citra', enMalayalam: 'Chithra', mlMalayalam: 'ചിത്ര' },
                _a[14] = { saka: 'Svati', enMalayalam: 'Chothi', mlMalayalam: 'ചോതി' },
                _a[15] = { saka: 'Visakha', enMalayalam: 'Vishakham', mlMalayalam: 'വിശാഖം' },
                _a[16] = { saka: 'Anuradha', enMalayalam: 'Anizham', mlMalayalam: 'അനിഴം' },
                _a[17] = { saka: 'Jyestha', enMalayalam: 'Thrikketta', mlMalayalam: 'തൃക്കേട്ട' },
                _a[18] = { saka: 'Mula', enMalayalam: 'Moolam', mlMalayalam: 'മൂലം' },
                _a[19] = { saka: 'P-asadha', enMalayalam: 'Pooradam', mlMalayalam: 'പൂരാടം' },
                _a[20] = { saka: 'U-asadha', enMalayalam: 'Uthradam', mlMalayalam: 'ഉത്രാടം' },
                _a[21] = { saka: 'Sravana', enMalayalam: 'Thiruvonam', mlMalayalam: 'തിരുവോണം' },
                _a[22] = { saka: 'Dhanistha', enMalayalam: 'Avittam', mlMalayalam: 'അവിട്ടം' },
                _a[23] = { saka: 'Satabhisaj', enMalayalam: 'Chathayam', mlMalayalam: 'ചതയം' },
                _a[24] = { saka: 'P-bhadrapada', enMalayalam: 'Poororuttathi', mlMalayalam: 'പൂരുരുട്ടാതി' },
                _a[25] = { saka: 'U-bhadrapada', enMalayalam: 'Uthrattathi', mlMalayalam: 'ഉത്രട്ടാതി' },
                _a[26] = { saka: 'Revati', enMalayalam: 'Revathi', mlMalayalam: 'രേവതി' },
                _a[27] = { saka: 'Asvini', enMalayalam: 'Ashwathi', mlMalayalam: 'അശ്വതി' },
                _a;
        },
        enumerable: false,
        configurable: true
    });
    Calendar.timeIntoFractionalDay = function (date) {
        // TODO: Incorporate this into calculating the multiple-naksatra-per-day (time precision)
        // The year, month and day from the passed in date is discarded and only the time is used.
        // And even from the time information only the hour and minute is used and seconds, milliseconds etc. is discarded
        if (!(date instanceof Date)) {
            throw new Error('Invalid parameter. \'date\' should be an instance of \'Date\'');
        }
        var hour = date.getHours();
        var minute = date.getMinutes();
        return (hour * 60 + minute) / (24 * 60);
    };
    Calendar.gregorianDateToJulianDay = function (date) {
        //  TODO:
        // Annotate all the magic numbers below !
        // There is some explanation here - http://quasar.as.utexas.edu/BillInfo/JulianDatesG.html
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        if (month < 3) {
            year -= 1;
            month += 12;
        }
        var julianDay = mathHelper_1.MathHelper.truncate(365.25 * year) + mathHelper_1.MathHelper.truncate(30.59 * (month - 2)) + day + 1721086.5;
        if (year < 0) {
            julianDay -= 1;
            if (year % 4 === 0 && month > 3) {
                julianDay += 1;
            }
        }
        if (julianDay >= 2299160) {
            julianDay += mathHelper_1.MathHelper.truncate(year / 400) - mathHelper_1.MathHelper.truncate(year / 100) + 2;
        }
        return julianDay;
    };
    Calendar.julianDayToJulianDate = function (julianDay) {
        var j = mathHelper_1.MathHelper.truncate(julianDay) + 1402;
        var k = mathHelper_1.MathHelper.truncate((j - 1) / 1461);
        var l = j - 1461 * k;
        var n = mathHelper_1.MathHelper.truncate((l - 1) / 365) - mathHelper_1.MathHelper.truncate(l / 1461);
        var i = l - 365 * n + 30;
        var J = mathHelper_1.MathHelper.truncate(80 * i / 2447);
        var I = mathHelper_1.MathHelper.truncate(J / 11);
        var day = i - mathHelper_1.MathHelper.truncate(2447 * J / 80);
        var month = J + 2 - 12 * I;
        var year = 4 * k + n + I - 4716;
        return new julianDate_1.JulianDate(year, month, day);
    };
    Calendar.julianDayToGregorianDate = function (julianDay) {
        var a = julianDay + 68569;
        var b = mathHelper_1.MathHelper.truncate(a / 36524.25);
        var c = a - mathHelper_1.MathHelper.truncate(36524.25 * b + 0.75);
        var e = mathHelper_1.MathHelper.truncate((c + 1) / 365.2425);
        var f = c - mathHelper_1.MathHelper.truncate(365.25 * e) + 31;
        var g = mathHelper_1.MathHelper.truncate(f / 30.59);
        var h = mathHelper_1.MathHelper.truncate(g / 11);
        var day = mathHelper_1.MathHelper.truncate(f - mathHelper_1.MathHelper.truncate(30.59 * g) + (julianDay - mathHelper_1.MathHelper.truncate(julianDay)));
        var month = mathHelper_1.MathHelper.truncate(g - 12 * h + 2);
        var year = mathHelper_1.MathHelper.truncate(100 * (b - 49) + e + h);
        var result = new Date(year, month - 1, day);
        if (year > 0 && year <= 99) {
            result.setFullYear(year);
        }
        return result;
    };
    Calendar.julianDayToModernDate = function (julianDay) {
        // Will return JulianDate object for any date before 1st January 1583 AD and Date objects for later dates
        return julianDay < 2299239 ? Calendar.julianDayToJulianDate(julianDay) : Calendar.julianDayToGregorianDate(julianDay);
    };
    Calendar.julianDayToAhargana = function (julianDay) {
        return julianDay - 588465.50;
    };
    Calendar.aharganaToJulianDay = function (ahargana) {
        return 588465.50 + ahargana;
    };
    Calendar.kaliToSaka = function (yearKali) {
        return yearKali - 3179;
    };
    Calendar.sakaToKali = function (yearSaka) {
        return yearSaka + 3179;
    };
    Calendar.julianDayToWeekday = function (julianDay) {
        return Calendar.weekdays[mathHelper_1.MathHelper.truncate(julianDay + 0.5) % 7];
    };
    Calendar.getAdhimasa = function (lastConjunctionLongitude, nextConjunctionLongitude) {
        var n1 = mathHelper_1.MathHelper.truncate(lastConjunctionLongitude / 30);
        var n2 = mathHelper_1.MathHelper.truncate(nextConjunctionLongitude / 30);
        return Math.abs(n1 - n2) < mathHelper_1.MathHelper.epsilon ? 'Adhika-' : '';
    };
    Calendar.getMasaNum = function (trueSolarLongitude, lastConjunctionLongitude) {
        var masaNum = mathHelper_1.MathHelper.truncate(trueSolarLongitude / 30) % 12;
        if (masaNum === mathHelper_1.MathHelper.truncate(lastConjunctionLongitude / 30) % 12) {
            masaNum += 1;
        }
        masaNum = (masaNum + 12) % 12;
        return masaNum;
    };
    Calendar.getNaksatra = function (trueLunarLongitude) {
        return Calendar.naksatras[mathHelper_1.MathHelper.truncate(trueLunarLongitude * 27 / 360)];
    };
    Calendar.prototype.nextDate = function (date) {
        // TODO: This looks like a concern of the calling library - But could be exposed as a static utility method (0 usages other than tests)
        date.setUTCDate(date.getUTCDate() + 1);
        return date;
    };
    Calendar.prototype.julianInEngland = function (julianDay) {
        // TODO: This might be exposed as a static utility method (0 usages other than tests)
        // Gregorian calendar was first introduced in most of Europe in 1582,
        // but it wasn't adopted in England (and so in US and Canada) until 1752
        //
        // - http://www.timeanddate.com/calendar/julian-gregorian-switch.html
        //
        // This returns true between
        //      October 14th, 1582 and September 14th, 1752, both dates exclusive
        return julianDay >= 2299160 && julianDay <= 2361221;
    };
    Calendar.prototype.aharganaToKali = function (ahargana) {
        return mathHelper_1.MathHelper.truncate(ahargana * this.celestial.planets.sun.YugaRotation / this.celestial.yuga.CivilDays);
    };
    Calendar.prototype.kaliToAhargana = function (yearKali, masaNum, tithiDay) {
        var sauraMasas = yearKali * 12 + masaNum; // expired saura masas
        var adhiMasas = mathHelper_1.MathHelper.truncate(sauraMasas * this.celestial.yuga.Adhimasa / (12 * this.celestial.planets.sun.YugaRotation)); // expired adhimasas
        var candraMasas = sauraMasas + adhiMasas; // expired candra masas
        var tithis = 30 * candraMasas + tithiDay - 1; // expired tithis
        var avamas = mathHelper_1.MathHelper.truncate(tithis * this.celestial.yuga.Ksayadina / this.celestial.yuga.Tithi); // expired avamas
        return tithis - avamas;
    };
    Calendar.prototype.findSamkranti = function (leftAhargana, rightAhargana) {
        var width = (rightAhargana - leftAhargana) / 2;
        var centreAhargana = (rightAhargana + leftAhargana) / 2;
        if (width < mathHelper_1.MathHelper.epsilon) {
            return centreAhargana;
        }
        else {
            var centreTslong = this.celestial.getTrueSolarLongitude(centreAhargana);
            centreTslong -= mathHelper_1.MathHelper.truncate(centreTslong / 30) * 30;
            if (centreTslong < 5) {
                return this.findSamkranti(leftAhargana, centreAhargana);
            }
            else {
                return this.findSamkranti(centreAhargana, rightAhargana);
            }
        }
    };
    Calendar.prototype.calculateSamkranti = function (ahargana, desantara) {
        samkranti.ahargana = this.findSamkranti(ahargana, ahargana + 1) + desantara;
        // below line is the fix that Yano-san worked in for Kerala dates - #20140223 cf. try_calculations
        var roundedSamkranti = mathHelper_1.MathHelper.truncate(samkranti.ahargana) + 0.5;
        var samkrantiModernDate = Calendar.julianDayToModernDate(Calendar.aharganaToJulianDay(roundedSamkranti));
        if (julianDate_1.JulianDate.prototype.isPrototypeOf(samkrantiModernDate)) { // eslint-disable-line no-prototype-builtins
            var samkrantiDate = samkrantiModernDate;
            samkranti.Year = samkrantiDate.year;
            samkranti.Month = samkrantiDate.month;
            samkranti.Day = samkrantiDate.date;
        }
        else {
            var samkrantiDate = samkrantiModernDate;
            samkranti.Year = samkrantiDate.getFullYear();
            samkranti.Month = samkrantiDate.getMonth() + 1;
            samkranti.Day = samkrantiDate.getDate();
        }
        var fractionalDay = mathHelper_1.MathHelper.fractional(samkranti.ahargana) * 24;
        samkranti.Hour = mathHelper_1.MathHelper.truncate(fractionalDay);
        samkranti.Min = mathHelper_1.MathHelper.truncate(60 * mathHelper_1.MathHelper.fractional(fractionalDay));
    };
    Calendar.prototype.isTodaySauraMasaFirst = function (ahargana, desantara) {
        /*
         //    Definition of the first day
         //    samkranti is between today's 0:00 and 24:00
         //    ==
         //    at 0:00 before 30x, at 24:00 after 30x
         */
        var trueSolarLongitudeToday = this.celestial.getTrueSolarLongitude(ahargana - desantara);
        var trueSolarLongitudeTomorrow = this.celestial.getTrueSolarLongitude(ahargana - desantara + 1);
        trueSolarLongitudeToday -= mathHelper_1.MathHelper.truncate(trueSolarLongitudeToday / 30) * 30;
        trueSolarLongitudeTomorrow -= mathHelper_1.MathHelper.truncate(trueSolarLongitudeTomorrow / 30) * 30;
        if (25 < trueSolarLongitudeToday && trueSolarLongitudeTomorrow < 5) { // eslint-disable-line yoda
            this.calculateSamkranti(ahargana, desantara);
            return true;
        }
        return false;
    };
    Calendar.prototype.getSauraMasaAndSauraDivasa = function (ahargana, desantara) {
        // If today is the first day then 1
        // Otherwise yesterday's + 1
        var month;
        var day;
        ahargana = mathHelper_1.MathHelper.truncate(ahargana);
        if (this.isTodaySauraMasaFirst(ahargana, desantara)) {
            day = 1;
            var tsLongTomorrow = this.celestial.getTrueSolarLongitude(ahargana + 1);
            month = mathHelper_1.MathHelper.truncate(tsLongTomorrow / 30) % 12;
            month = (month + 12) % 12;
        }
        else {
            var _a = this.getSauraMasaAndSauraDivasa(ahargana - 1, desantara), sauraMasa = _a.sauraMasa, sauraDivasa = _a.sauraDivasa;
            month = sauraMasa;
            day = sauraDivasa + 1;
        }
        return { sauraMasa: month, sauraDivasa: day };
    };
    return Calendar;
}());
exports.Calendar = Calendar;

},{"./dates/julianDate":10,"./mathHelper":14}],4:[function(require,module,exports){
"use strict";
/*
 * kollavarsham
 * http://kollavarsham.org
 *
 * Copyright (c) 2014-2023 The Kollavarsham Team
 * Licensed under the MIT license.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Celestial = void 0;
/**
 * @module celestial
 */
var mathHelper_1 = require("../mathHelper");
var index_1 = require("./planetarySystem/index");
/**
 *
 *  **INTERNAL/PRIVATE**
 *
 * @class Celestial
 */
var Celestial = /** @class */ (function () {
    function Celestial(system) {
        if (system === void 0) { system = 'SuryaSiddhanta'; }
        var planetarySystem = new index_1.PlanetarySystem(system);
        this.planets = planetarySystem.planets;
        this.yuga = planetarySystem.yuga;
        this.backLastConjunctionAhargana = -1;
        this.backNextConjunctionAhargana = -1;
        this.backLastConjunctionLongitude = -1;
        this.backNextConjunctionLongitude = -1;
    }
    Celestial.threeRelation = function (left, center, right) {
        if (left < center && center < right) {
            return 1;
        }
        else if (right < center && center < left) {
            return -1;
        }
        return 0;
    };
    Celestial.declination = function (longitude) {
        // https://en.wikipedia.org/wiki/Declination
        return Math.asin(Math.sin(longitude / mathHelper_1.MathHelper.radianInDegrees) * Math.sin(24 / mathHelper_1.MathHelper.radianInDegrees)) *
            mathHelper_1.MathHelper.radianInDegrees;
    };
    Celestial.getSunriseTime = function (time, equationOfTime) {
        // TODO: Add Tests if/when feasible
        var sunriseTime = (time - equationOfTime) * 24;
        var sunriseHour = mathHelper_1.MathHelper.truncate(sunriseTime);
        var sunriseMinute = mathHelper_1.MathHelper.truncate(60 * mathHelper_1.MathHelper.fractional(sunriseTime));
        return { sunriseHour: sunriseHour, sunriseMinute: sunriseMinute };
    };
    Celestial.getTithi = function (trueSolarLongitude, trueLunarLongitude) {
        var eclipticLongitude = trueLunarLongitude - trueSolarLongitude;
        eclipticLongitude = mathHelper_1.MathHelper.zero360(eclipticLongitude);
        return eclipticLongitude / 12;
    };
    Celestial.prototype.setPlanetaryPositions = function (ahargana) {
        var $planets = this.planets;
        // Lunar apogee and node at sunrise
        $planets.candrocca.MeanPosition = mathHelper_1.MathHelper.zero360(this.getMeanLongitude(ahargana, $planets.candrocca.YugaRotation) + 90);
        $planets.rahu.MeanPosition = mathHelper_1.MathHelper.zero360(this.getMeanLongitude(ahargana, $planets.rahu.YugaRotation) + 180);
        // mean and true sun at sunrise
        var meanSolarLongitude = this.getMeanLongitude(ahargana, $planets.sun.YugaRotation);
        $planets.sun.MeanPosition = meanSolarLongitude;
        var trueSolarLongitude = mathHelper_1.MathHelper.zero360(meanSolarLongitude - this.getMandaEquation(meanSolarLongitude - $planets.sun.Apogee, 'sun'));
        // mean and true moon at sunrise
        var meanLunarLongitude = this.getMeanLongitude(ahargana, $planets.moon.YugaRotation);
        $planets.moon.MeanPosition = meanLunarLongitude;
        $planets.moon.Apogee = $planets.candrocca.MeanPosition;
        var trueLunarLongitude = mathHelper_1.MathHelper.zero360(meanLunarLongitude - this.getMandaEquation(meanLunarLongitude - $planets.moon.Apogee, 'moon'));
        // The below was a separate method named calculations.planetary (ported from planetary_calculations in perl)
        var planetNames = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'];
        for (var i = 0; i < planetNames.length; i++) {
            $planets[planetNames[i]].MeanPosition = this.getMeanLongitude(ahargana, $planets[planetNames[i]].Rotation);
        }
        return { trueSolarLongitude: trueSolarLongitude, trueLunarLongitude: trueLunarLongitude };
    };
    Celestial.prototype.getMeanLongitude = function (ahargana, rotation) {
        // https://en.wikipedia.org/wiki/Mean_longitude
        // https://en.wikipedia.org/wiki/Ecliptic_coordinate_system#Spherical_coordinates
        return 360 * mathHelper_1.MathHelper.fractional(rotation * ahargana / this.yuga.CivilDays);
    };
    Celestial.prototype.getDaylightEquation = function (year, latitude, ahargana) {
        // Good read - http://en.wikipedia.org/wiki/Equation_of_time#Calculating_the_equation_of_time
        var meanSolarLongitude = this.getMeanLongitude(ahargana, this.planets.sun.YugaRotation);
        // Sayana Solar Longitude and Declination
        var sayanaMeanSolarLongitude = meanSolarLongitude + 54 / 3600 * (year - 499);
        var sayanaDeclination = Celestial.declination(sayanaMeanSolarLongitude); // See Sewell, p.10
        // Equation of day light by Analemma (https://en.wikipedia.org/wiki/Analemma)
        var x = Math.tan(latitude / mathHelper_1.MathHelper.radianInDegrees) * Math.tan(sayanaDeclination / mathHelper_1.MathHelper.radianInDegrees);
        return 0.5 * Math.asin(x) / Math.PI;
    };
    Celestial.prototype.getMandaEquation = function (argument, planet) {
        return Math.asin(this.planets[planet].MandaCircumference / 360 * Math.sin(argument / mathHelper_1.MathHelper.radianInDegrees)) * mathHelper_1.MathHelper.radianInDegrees;
    };
    Celestial.prototype.getTrueLunarLongitude = function (ahargana) {
        var meanLunarLongitude = this.getMeanLongitude(ahargana, this.planets.moon.YugaRotation);
        var apogee = this.getMeanLongitude(ahargana, this.planets.candrocca.YugaRotation) + 90;
        return mathHelper_1.MathHelper.zero360(meanLunarLongitude - this.getMandaEquation(meanLunarLongitude - apogee, 'moon'));
    };
    Celestial.prototype.getTrueSolarLongitude = function (ahargana) {
        var meanSolarLongitude = this.getMeanLongitude(ahargana, this.planets.sun.YugaRotation);
        return mathHelper_1.MathHelper.zero360(meanSolarLongitude - this.getMandaEquation(meanSolarLongitude - this.planets.sun.Apogee, 'sun'));
    };
    Celestial.prototype.getEclipticLongitude = function (ahargana) {
        var eclipticLongitude = Math.abs(this.getTrueLunarLongitude(ahargana) - this.getTrueSolarLongitude(ahargana));
        if (eclipticLongitude >= 180) {
            eclipticLongitude = 360 - eclipticLongitude;
        }
        return eclipticLongitude;
    };
    Celestial.prototype.findConjunction = function (leftX, leftY, rightX, rightY) {
        var width = (rightX - leftX) / 2;
        var centreX = (rightX + leftX) / 2;
        if (width < mathHelper_1.MathHelper.epsilon) {
            return this.getTrueSolarLongitude(centreX);
        }
        else {
            var centreY = this.getEclipticLongitude(centreX);
            var relation = Celestial.threeRelation(leftY, centreY, rightY);
            if (relation < 0) {
                rightX += width;
                rightY = this.getEclipticLongitude(rightX);
                return this.findConjunction(centreX, centreY, rightX, rightY);
            }
            else if (relation > 0) {
                leftX -= width;
                leftY = this.getEclipticLongitude(leftX);
                return this.findConjunction(leftX, leftY, centreX, centreY);
            }
            else {
                leftX += width / 2;
                leftY = this.getEclipticLongitude(leftX);
                rightX -= width / 2;
                rightY = this.getEclipticLongitude(rightX);
                return this.findConjunction(leftX, leftY, rightX, rightY);
            }
        }
    };
    Celestial.prototype.getConjunction = function (ahargana) {
        var leftX = ahargana - 2;
        var leftY = this.getEclipticLongitude(leftX);
        var rightX = ahargana + 2;
        var rightY = this.getEclipticLongitude(rightX);
        return this.findConjunction(leftX, leftY, rightX, rightY);
    };
    Celestial.prototype.getLastConjunctionLongitude = function (ahargana, tithi) {
        var newNew = this.yuga.CivilDays / (this.planets.moon.YugaRotation - this.planets.sun.YugaRotation);
        ahargana -= tithi * (newNew / 30);
        if (Math.abs(ahargana - this.backLastConjunctionAhargana) < 1) {
            return this.backLastConjunctionLongitude;
        }
        else if (Math.abs(ahargana - this.backNextConjunctionAhargana) < 1) {
            this.backLastConjunctionAhargana = this.backNextConjunctionAhargana;
            this.backLastConjunctionLongitude = this.backNextConjunctionLongitude;
            return this.backNextConjunctionLongitude;
        }
        else {
            this.backLastConjunctionAhargana = ahargana;
            this.backLastConjunctionLongitude = this.getConjunction(ahargana);
            return this.backLastConjunctionLongitude;
        }
    };
    Celestial.prototype.getNextConjunctionLongitude = function (ahargana, tithi) {
        var newNew = this.yuga.CivilDays / (this.planets.moon.YugaRotation - this.planets.sun.YugaRotation);
        ahargana += (30 - tithi) * (newNew / 30);
        if (Math.abs(ahargana - this.backNextConjunctionAhargana) < 1) {
            return this.backNextConjunctionLongitude;
        }
        else {
            this.backNextConjunctionAhargana = ahargana;
            this.backNextConjunctionLongitude = this.getConjunction(ahargana);
            return this.backNextConjunctionLongitude;
        }
    };
    return Celestial;
}());
exports.Celestial = Celestial;

},{"../mathHelper":14,"./planetarySystem/index":5}],5:[function(require,module,exports){
"use strict";
/*
 * kollavarsham
 * http://kollavarsham.org
 *
 * Copyright (c) 2014-2023 The Kollavarsham Team
 * Licensed under the MIT license.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanetarySystem = void 0;
/**
 * @module planetarySystem
 */
var index_1 = require("./planets/index");
var yuga_1 = require("./yuga");
var star;
var sun;
var moon;
var mercury;
var venus;
var mars;
var jupiter;
var saturn;
var candrocca; // Moon Apogee
var rahu; // Moon Node
var _yuga; // eslint-disable-line no-underscore-dangle
var planetsList;
/**
 *
 *  **INTERNAL/PRIVATE**
 *
 * @class PlanetarySystem
 */
var PlanetarySystem = /** @class */ (function () {
    function PlanetarySystem(system) {
        if (system === void 0) { system = 'SuryaSiddhanta'; }
        this.system = system === 'InPancasiddhantika' ? system : 'SuryaSiddhanta';
        star = new index_1.Star();
        sun = new index_1.Sun();
        moon = new index_1.Moon();
        mercury = new index_1.Mercury();
        venus = new index_1.Venus();
        mars = new index_1.Mars();
        jupiter = new index_1.Jupiter();
        saturn = new index_1.Saturn();
        candrocca = new index_1.Candrocca(); // Moon Apogee
        rahu = new index_1.Rahu(); // Moon Node
        _yuga = new yuga_1.Yuga();
        this.initializeYugaRotations();
        this.initializeYuga();
        PlanetarySystem.initializePlanetaryConstants();
        planetsList = [star, sun, moon, mercury, venus, mars, jupiter, saturn, candrocca, rahu]
            .reduce(function (list, planet) {
            var _a;
            return (__assign(__assign({}, list), (_a = {}, _a[planet.name] = planet, _a)));
        }, {});
    }
    Object.defineProperty(PlanetarySystem.prototype, "yuga", {
        get: function () {
            return _yuga;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PlanetarySystem.prototype, "planets", {
        get: function () {
            return planetsList;
        },
        enumerable: false,
        configurable: true
    });
    PlanetarySystem.prototype.initializeYugaRotations = function () {
        // common values across the systems
        sun.YugaRotation = 4320000;
        moon.YugaRotation = 57753336;
        jupiter.YugaRotation = 364220;
        var isSuryaSiddhantaSystem = this.system === 'SuryaSiddhanta';
        // # Saura, HIL, p.15 && # Latadeva/Ardharatrika, HIL, p.15
        star.YugaRotation = isSuryaSiddhantaSystem ? 1582237800 : 1582237828;
        mercury.YugaRotation = isSuryaSiddhantaSystem ? 17937000 : 17937060;
        venus.YugaRotation = isSuryaSiddhantaSystem ? 7022388 : 7022376;
        mars.YugaRotation = isSuryaSiddhantaSystem ? 2296824 : 2296832;
        saturn.YugaRotation = isSuryaSiddhantaSystem ? 146564 : 146568;
        candrocca.YugaRotation = isSuryaSiddhantaSystem ? 488219 : 488203;
        rahu.YugaRotation = isSuryaSiddhantaSystem ? -232226 : -232238;
    };
    PlanetarySystem.prototype.initializeYuga = function () {
        this.yuga.CivilDays = star.YugaRotation - sun.YugaRotation;
        this.yuga.SynodicMonth = moon.YugaRotation - sun.YugaRotation;
        this.yuga.Adhimasa = this.yuga.SynodicMonth - 12 * sun.YugaRotation;
        this.yuga.Tithi = 30 * this.yuga.SynodicMonth;
        this.yuga.Ksayadina = this.yuga.Tithi - this.yuga.CivilDays;
    };
    PlanetarySystem.initializePlanetaryConstants = function () {
        // star
        star.Rotation = 0;
        star.Sighra = 0;
        star.Apogee = 0;
        star.MandaCircumference = 0;
        star.SighraCircumference = 0;
        // sun
        sun.Rotation = sun.YugaRotation;
        sun.Sighra = sun.YugaRotation;
        sun.Apogee = 77 + 17 / 60;
        sun.MandaCircumference = 13 + 50 / 60;
        sun.SighraCircumference = 0;
        // moon
        moon.Rotation = moon.YugaRotation;
        moon.Sighra = 0;
        moon.Apogee = 0;
        moon.MandaCircumference = 31 + 50 / 60;
        moon.SighraCircumference = 0;
        // mercury
        mercury.Rotation = sun.YugaRotation;
        mercury.Sighra = mercury.YugaRotation;
        mercury.Apogee = 220 + 27 / 60;
        mercury.MandaCircumference = 29;
        mercury.SighraCircumference = 131.5;
        // venus
        venus.Rotation = sun.YugaRotation;
        venus.Sighra = venus.YugaRotation;
        venus.Apogee = 79 + 50 / 60;
        venus.MandaCircumference = 11.5;
        venus.SighraCircumference = 261;
        // mars
        mars.Rotation = mars.YugaRotation;
        mars.Sighra = sun.YugaRotation;
        mars.Apogee = 130 + 2 / 60;
        mars.MandaCircumference = 73.5;
        mars.SighraCircumference = 233.5;
        // jupiter
        jupiter.Rotation = jupiter.YugaRotation;
        jupiter.Sighra = sun.YugaRotation;
        jupiter.Apogee = 171 + 18 / 60;
        jupiter.MandaCircumference = 32.5;
        jupiter.SighraCircumference = 71;
        // saturn
        saturn.Rotation = saturn.YugaRotation;
        saturn.Sighra = sun.YugaRotation;
        saturn.Apogee = 236 + 37 / 60;
        saturn.MandaCircumference = 48.5;
        saturn.SighraCircumference = 39.5;
        // Candrocca
        candrocca.Rotation = candrocca.YugaRotation;
        candrocca.Sighra = 0;
        candrocca.Apogee = 0;
        candrocca.MandaCircumference = 0;
        candrocca.SighraCircumference = 0;
        // Rahu
        rahu.Rotation = rahu.YugaRotation;
        rahu.Sighra = 0;
        rahu.Apogee = 0;
        rahu.MandaCircumference = 0;
        rahu.SighraCircumference = 0;
    };
    return PlanetarySystem;
}());
exports.PlanetarySystem = PlanetarySystem;

},{"./planets/index":6,"./yuga":7}],6:[function(require,module,exports){
"use strict";
/*
 * kollavarsham
 * http://kollavarsham.org
 *
 * Copyright (c) 2014-2023 The Kollavarsham Team
 * Licensed under the MIT license.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rahu = exports.Candrocca = exports.Saturn = exports.Jupiter = exports.Mars = exports.Venus = exports.Mercury = exports.Moon = exports.Sun = exports.Star = exports.Planet = void 0;
/**
 * @module planets
 */
/**
 *
 *  **INTERNAL/PRIVATE**
 *
 * @class Planet
 * @constructor
 */
var Planet = /** @class */ (function () {
    function Planet() {
        /**
         * Name of the planet subclass
         *
         * @property name
         * @type {string}
         */
        this.name = '';
        /**
         * **TODO: Description**
         *
         * @property YugaRotation
         * @type {Number}
         */
        this.YugaRotation = 0; // sidereal rotations
        /**
         * **TODO: Description**
         *
         * @property Rotation
         * @type {Number}
         */
        this.Rotation = 0;
        /**
         * **TODO: Description**
         *
         * @property Sighra
         * @type {Number}
         */
        this.Sighra = 0;
        /**
         * **TODO: Description**
         *
         * @property MeanPosition
         * @type {Number}
         */
        this.MeanPosition = 0;
        /**
         * **TODO: Description**
         *
         * @property Apogee
         * @type {Number}
         */
        this.Apogee = 0;
        /**
         * **TODO: Description**
         *
         * @property MandaCircumference
         * @type {Number}
         */
        this.MandaCircumference = 0;
        /**
         * **TODO: Description**
         *
         * @property SighraCircumference
         * @type {Number}
         */
        this.SighraCircumference = 0;
    }
    return Planet;
}());
exports.Planet = Planet;
/**
 *
 *  **INTERNAL/PRIVATE**
 *
 * @class Star
 * @extends Planet
 */
var Star = /** @class */ (function (_super) {
    __extends(Star, _super);
    function Star() {
        var _this = _super.call(this) || this;
        _this.name = 'star';
        return _this;
    }
    return Star;
}(Planet));
exports.Star = Star;
/**
 *
 *  **INTERNAL/PRIVATE**
 *
 * @class Sun
 * @extends Planet
 */
var Sun = /** @class */ (function (_super) {
    __extends(Sun, _super);
    function Sun() {
        var _this = _super.call(this) || this;
        _this.name = 'sun';
        return _this;
    }
    return Sun;
}(Planet));
exports.Sun = Sun;
/**
 *
 *  **INTERNAL/PRIVATE**
 *
 * @class Moon
 * @extends Planet
 */
var Moon = /** @class */ (function (_super) {
    __extends(Moon, _super);
    function Moon() {
        var _this = _super.call(this) || this;
        _this.name = 'moon';
        return _this;
    }
    return Moon;
}(Planet));
exports.Moon = Moon;
/**
 *
 *  **INTERNAL/PRIVATE**
 *
 * @class Mercury
 * @extends Planet
 */
var Mercury = /** @class */ (function (_super) {
    __extends(Mercury, _super);
    function Mercury() {
        var _this = _super.call(this) || this;
        _this.name = 'mercury';
        return _this;
    }
    return Mercury;
}(Planet));
exports.Mercury = Mercury;
/**
 *
 *  **INTERNAL/PRIVATE**
 *
 * @class Venus
 * @extends Planet
 */
var Venus = /** @class */ (function (_super) {
    __extends(Venus, _super);
    function Venus() {
        var _this = _super.call(this) || this;
        _this.name = 'venus';
        return _this;
    }
    return Venus;
}(Planet));
exports.Venus = Venus;
/**
 *
 *  **INTERNAL/PRIVATE**
 *
 * @class Mars
 * @extends Planet
 */
var Mars = /** @class */ (function (_super) {
    __extends(Mars, _super);
    function Mars() {
        var _this = _super.call(this) || this;
        _this.name = 'mars';
        return _this;
    }
    return Mars;
}(Planet));
exports.Mars = Mars;
/**
 *
 *  **INTERNAL/PRIVATE**
 *
 * @class Jupiter
 * @extends Planet
 */
var Jupiter = /** @class */ (function (_super) {
    __extends(Jupiter, _super);
    function Jupiter() {
        var _this = _super.call(this) || this;
        _this.name = 'jupiter';
        return _this;
    }
    return Jupiter;
}(Planet));
exports.Jupiter = Jupiter;
/**
 *
 *  **INTERNAL/PRIVATE**
 *
 * @class Saturn
 * @extends Planet
 */
var Saturn = /** @class */ (function (_super) {
    __extends(Saturn, _super);
    function Saturn() {
        var _this = _super.call(this) || this;
        _this.name = 'saturn';
        return _this;
    }
    return Saturn;
}(Planet));
exports.Saturn = Saturn;
/**
 *
 *  **INTERNAL/PRIVATE**
 *
 * @class Candrocca
 * @extends Planet
 */
var Candrocca = /** @class */ (function (_super) {
    __extends(Candrocca, _super);
    function Candrocca() {
        var _this = _super.call(this) || this;
        _this.name = 'candrocca';
        return _this;
    }
    return Candrocca;
}(Planet));
exports.Candrocca = Candrocca;
/**
 *
 *  **INTERNAL/PRIVATE**
 *
 * @class Rahu
 * @extends Planet
 */
var Rahu = /** @class */ (function (_super) {
    __extends(Rahu, _super);
    function Rahu() {
        var _this = _super.call(this) || this;
        _this.name = 'rahu';
        return _this;
    }
    return Rahu;
}(Planet));
exports.Rahu = Rahu;

},{}],7:[function(require,module,exports){
"use strict";
/*
 * kollavarsham
 * http://kollavarsham.org
 *
 * Copyright (c) 2014-2023 The Kollavarsham Team
 * Licensed under the MIT license.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Yuga = void 0;
/**
 * @module yuga
 */
/**
 *
 *  **INTERNAL/PRIVATE**
 *
 * @class Yuga
 */
var Yuga = /** @class */ (function () {
    function Yuga() {
        this.CivilDays = 0;
        this.SynodicMonth = 0;
        this.Adhimasa = 0;
        this.Tithi = 0;
        this.Ksayadina = 0;
    }
    return Yuga;
}());
exports.Yuga = Yuga;

},{}],8:[function(require,module,exports){
"use strict";
/*
 * kollavarsham
 * http://kollavarsham.org
 *
 * Copyright (c) 2014-2023 The Kollavarsham Team
 * Licensed under the MIT license.
 */
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDate = void 0;
/**
 * @module baseDate
 */
var calendar_1 = require("../calendar");
var pad = function (num, size) {
    var s = "000000000".concat(num);
    return s.substr(s.length - size);
};
var masaNames = (_a = {},
    _a[0] = { saka: 'Caitra    ', saura: 'Mesa      ', enMalayalam: 'Chingam   ', mlMalayalam: 'ചിങ്ങം' },
    _a[1] = { saka: 'Vaisakha  ', saura: 'Vrsa      ', enMalayalam: 'Kanni     ', mlMalayalam: 'കന്നി' },
    _a[2] = { saka: 'Jyaistha  ', saura: 'Mithuna   ', enMalayalam: 'Thulam    ', mlMalayalam: 'തുലാം' },
    _a[3] = { saka: 'Asadha    ', saura: 'Karkata   ', enMalayalam: 'Vrischikam', mlMalayalam: 'വൃശ്ചികം' },
    _a[4] = { saka: 'Sravana   ', saura: 'Simha     ', enMalayalam: 'Dhanu     ', mlMalayalam: 'ധനു' },
    _a[5] = { saka: 'Bhadrapada', saura: 'Kanya     ', enMalayalam: 'Makaram   ', mlMalayalam: 'മകരം' },
    _a[6] = { saka: 'Asvina    ', saura: 'Tula      ', enMalayalam: 'Kumbham   ', mlMalayalam: 'കുംഭം' },
    _a[7] = { saka: 'Karttika  ', saura: 'Vrscika   ', enMalayalam: 'Meenam    ', mlMalayalam: 'മീനം' },
    _a[8] = { saka: 'Margasirsa', saura: 'Dhanus    ', enMalayalam: 'Medam     ', mlMalayalam: 'മേടം' },
    _a[9] = { saka: 'Pausa     ', saura: 'Makara    ', enMalayalam: 'Idavam    ', mlMalayalam: 'ഇടവം' },
    _a[10] = { saka: 'Magha     ', saura: 'Kumbha    ', enMalayalam: 'Mithunam  ', mlMalayalam: 'മിഥുനം' },
    _a[11] = { saka: 'Phalguna  ', saura: 'Mina      ', enMalayalam: 'Karkitakam', mlMalayalam: 'കർക്കടകം' },
    _a);
/**
 * Serves as the base class for both the {@link JulianDate} and
 * {@link KollavarshamDate} classes.
 *
 *  **INTERNAL/PRIVATE**
 *
 * @class BaseDate
 * @constructor
 * @param year {Number}
 * @param month {Number}
 * @param day {Number}
 */
var BaseDate = /** @class */ (function () {
    function BaseDate(year, month, date) {
        if (year === void 0) { year = 0; }
        if (month === void 0) { month = 0; }
        if (date === void 0) { date = 0; }
        /**
         * The `Naksatra` (Star) for this instance of the date. **Set separately after an instance is created**
         *
         * @property naksatra
         * @type { { saka: String, enMalayalam: string, mlMalayalam: string } }
         */
        this._naksatra = calendar_1.Calendar.naksatras[-1];
        this.year = year;
        this.month = month;
        this.date = date;
        this.gregorianDate = new Date();
        this.julianDay = -1;
        this.ahargana = -1;
        this.sauraMasa = -1;
        this.sauraDivasa = -1;
    }
    Object.defineProperty(BaseDate.prototype, "naksatra", {
        get: function () {
            return this._naksatra; // eslint-disable-line no-underscore-dangle
        },
        set: function (val) {
            this._naksatra = val; // eslint-disable-line no-underscore-dangle
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseDate.prototype, "sauraMasaName", {
        /**
         * Returns the Saura Masa name for the current instance of date.
         *
         * @property sauraMasaName
         * @type {string}
         */
        get: function () {
            return BaseDate.getMasaName(this.sauraMasa).saura;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseDate.prototype, "weekdayName", {
        /**
         * Returns the weekday (in English) for the current instance of date.
         *
         * @property weekdayName
         * @type {string}
         */
        get: function () {
            return calendar_1.Calendar.julianDayToWeekday(this.julianDay).en;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseDate.prototype, "mlWeekdayName", {
        /**
         * Returns the weekday (in Malayalam) for the current instance of date.
         *
         * @property mlWeekdayName
         * @type {string}
         */
        get: function () {
            return calendar_1.Calendar.julianDayToWeekday(this.julianDay).ml;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Converts the Date to a nicely formatted string with year, month and date
     *
     * @method toString
     * @for BaseDate
     * @type {string}
     */
    BaseDate.prototype.toString = function () {
        return "".concat(pad(this.year, 4), " ").concat(pad(this.month, 2), " ").concat(pad(this.date, 2));
    };
    /**
     * Returns the month names object that has Saka, Saura and Kollavarsham (English & Malayalam) month names for the specified index `masaNumber`
     *
     * @method getMasaName
     * @for BaseDate
     * @param masaNumber {Number}
     * @returns { {saka : {string}, saura : {string}, enMalayalam : {string}, mlMalayalam : {string} } }
     */
    BaseDate.getMasaName = function (masaNumber) {
        return masaNames[masaNumber];
    };
    return BaseDate;
}());
exports.BaseDate = BaseDate;

},{"../calendar":3}],9:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./baseDate"), exports);
__exportStar(require("./sakaDate"), exports);
__exportStar(require("./julianDate"), exports);
__exportStar(require("./kollavarshamDate"), exports);

},{"./baseDate":8,"./julianDate":10,"./kollavarshamDate":11,"./sakaDate":12}],10:[function(require,module,exports){
"use strict";
/*
 * kollavarsham
 * http://kollavarsham.org
 *
 * Copyright (c) 2014-2023 The Kollavarsham Team
 * Licensed under the MIT license.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.JulianDate = void 0;
/**
 * @module julianDate
 */
var baseDate_1 = require("./baseDate");
/**
 * Represents a Julian date's year, month and day
 * `toGregorianDateFromSaka` method of the {@link Kollavarsham} class returns an instance of this type for dates
 * older than `1st January 1583 AD`
 *
 *  **INTERNAL/PRIVATE**
 *
 * @class JulianDate
 * @constructor
 * @param [year=1] {Number} Julian year
 * @param [month=1] {Number} Julian month
 * @param [day=1] {Number} Julian day
 * @extends BaseDate
 */
var JulianDate = /** @class */ (function (_super) {
    __extends(JulianDate, _super);
    function JulianDate(year, month, day) {
        if (year === void 0) { year = 1; }
        if (month === void 0) { month = 1; }
        if (day === void 0) { day = 1; }
        return _super.call(this, year, month, day) || this;
    }
    return JulianDate;
}(baseDate_1.BaseDate));
exports.JulianDate = JulianDate;

},{"./baseDate":8}],11:[function(require,module,exports){
"use strict";
/*
 * kollavarsham
 * http://kollavarsham.org
 *
 * Copyright (c) 2014-2023 The Kollavarsham Team
 * Licensed under the MIT license.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.KollavarshamDate = void 0;
/**
 * @module kollavarshamDate
 */
var baseDate_1 = require("./baseDate");
var sakaDate_1 = require("./sakaDate");
/**
 * Represents a Kollavarsham date's year, month and date
 * @class KollavarshamDate
 * @constructor
 * @param [year=1] {Number} The Kollavarsham year
 * @param [month=1] {Number} The Kollavarsham month
 * @param [day=1] {Number} The Kollavarsham day
 * @extends BaseDate
 */
var KollavarshamDate = /** @class */ (function (_super) {
    __extends(KollavarshamDate, _super);
    function KollavarshamDate(year, month, day) {
        if (year === void 0) { year = 1; }
        if (month === void 0) { month = 1; }
        if (day === void 0) { day = 1; }
        var _this = _super.call(this, year, month, day) || this;
        _this.sakaDate = new sakaDate_1.SakaDate(year, month);
        return _this;
    }
    Object.defineProperty(KollavarshamDate.prototype, "naksatraName", {
        /**
         * Returns the Kollavarsham Naksatra name (in English) for this instance date
         *
         * @property naksatraName
         * @type {string}
         */
        get: function () {
            return this.naksatra.enMalayalam;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(KollavarshamDate.prototype, "mlNaksatraName", {
        /**
         * Returns the Kollavarsham Naksatra name (in Malayalam) for this instance of date
         *
         * @property mlNaksatraName
         * @type {string}
         */
        get: function () {
            return this.naksatra.mlMalayalam;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(KollavarshamDate.prototype, "masaName", {
        /**
         * Returns the Kollavarsham month name (in English) for this instance of date
         *
         * @property masaName
         * @type {string}
         */
        get: function () {
            return KollavarshamDate.getMasaName(this.month - 1).enMalayalam;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(KollavarshamDate.prototype, "mlMasaName", {
        /**
         * Returns the Kollavarsham month name (in Malayalam) for this instance of date
         *
         * @property mlMasaName
         * @type {string}
         */
        get: function () {
            return KollavarshamDate.getMasaName(this.month - 1).mlMalayalam;
        },
        enumerable: false,
        configurable: true
    });
    return KollavarshamDate;
}(baseDate_1.BaseDate));
exports.KollavarshamDate = KollavarshamDate;

},{"./baseDate":8,"./sakaDate":12}],12:[function(require,module,exports){
"use strict";
/*
 * kollavarsham
 * http://kollavarsham.org
 *
 * Copyright (c) 2014-2023 The Kollavarsham Team
 * Licensed under the MIT license.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SakaDate = void 0;
/**
 * @module sakaDate
 */
var baseDate_1 = require("./baseDate");
var kollavarshamDate_1 = require("./kollavarshamDate");
var mathHelper_1 = require("../mathHelper");
/**
 * Represents an Saka date's year, month and paksa and tithi
 * @class SakaDate
 * @constructor
 * @param [year=1] {Number} Saka Year
 * @param [month=1] {Number} Saka Month
 * @param [tithi=1] {Number} Lunar Day
 * @param [paksa='Suklapaksa'] {string} Lunar Phase - Valid values are `Suklapaksa` (default) or 'Krsnapaksa`
 * @extends BaseDate
 */
var SakaDate = /** @class */ (function (_super) {
    __extends(SakaDate, _super);
    function SakaDate(year, month, tithi, paksa) {
        if (year === void 0) { year = 1; }
        if (month === void 0) { month = 1; }
        if (tithi === void 0) { tithi = 1; }
        if (paksa === void 0) { paksa = 'Suklapaksa'; }
        var _this = _super.call(this, year, month, tithi) || this;
        _this.paksa = paksa === 'Krsnapaksa' ? paksa : 'Suklapaksa';
        _this.kaliYear = -1;
        _this.adhimasa = '';
        _this.fractionalTithi = -1;
        _this.sunriseHour = -1;
        _this.sunriseMinute = -1;
        _this.originalAhargana = -1;
        return _this;
    }
    Object.defineProperty(SakaDate.prototype, "sakaYear", {
        /**
         * Returns the Saka year on this instance of SakaDate (same as the underlyiung `year` property from the {@link BaseDate} class)
         *
         * @property sakaYear
         * @type {Number}
         */
        get: function () {
            return this.year;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SakaDate.prototype, "tithi", {
        /**
         * Returns the Tithi on this instance of SakaDate (same as the underlyiung `date` property from the {@link BaseDate} class)
         *
         * In Vedic timekeeping, a tithi (also spelled thithi) is a lunar day, or the time it takes for the longitudinal angle between the Moon and the Sun to increase by 12°.
         * Tithis begin at varying times of day and vary in duration from approximately 19 to approximately 26 hours.
         *
         * _Source_: https://en.wikipedia.org/wiki/Tithi
         *
         * @property tithi
         * @type {Number}
         */
        get: function () {
            return this.date;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SakaDate.prototype, "vikramaYear", {
        /**
         * Returns the Vikrama year corresponding to the Saka year of this instance.
         *
         * @property vikramaYear
         * @type {Number}
         */
        get: function () {
            return this.year + 135;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SakaDate.prototype, "naksatraName", {
        /**
         * Returns the Saka Naksatra name for this instance of SakaDate
         *
         * @property naksatraName
         * @type {string}
         */
        get: function () {
            return this.naksatra.saka;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SakaDate.prototype, "masaName", {
        /**
         * Returns the month name for this instance of SakaDate
         *
         * @property masaName
         * @type {string}
         */
        get: function () {
            return SakaDate.getMasaName(this.month).saka;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Generates an instance of {@link KollavarshamDate} from this instance of SakaDate
     *
     * @method generateKollavarshamDate
     * @for SakaDate
     * @returns {KollavarshamDate}
     */
    SakaDate.prototype.generateKollavarshamDate = function () {
        // TODO: Add unit tests
        var malayalaMasa = (this.sauraMasa - 4 + 12) % 12;
        // Sewell p.45 - https://archive.org/stream/indiancalendarwi00sewerich#page/45/mode/1up
        var malayalamYear = this.year - 747 + mathHelper_1.MathHelper.truncate((this.month - malayalaMasa + 12) / 12);
        var kollavarshamDate = new kollavarshamDate_1.KollavarshamDate(malayalamYear, malayalaMasa + 1, this.sauraDivasa);
        kollavarshamDate.gregorianDate = this.gregorianDate;
        kollavarshamDate.julianDay = this.julianDay;
        kollavarshamDate.ahargana = this.ahargana;
        kollavarshamDate.sauraMasa = this.sauraMasa;
        kollavarshamDate.sauraDivasa = this.sauraDivasa;
        kollavarshamDate.naksatra = this.naksatra;
        // TODO: As fail-Safe for getting any other properties from the SakaDate, store a copy here directly
        kollavarshamDate.sakaDate = this;
        return kollavarshamDate;
    };
    SakaDate.prototype.toString = function () {
        return "".concat(_super.prototype.toString.call(this), " ").concat(this.paksa);
    };
    return SakaDate;
}(baseDate_1.BaseDate));
exports.SakaDate = SakaDate;

},{"../mathHelper":14,"./baseDate":8,"./kollavarshamDate":11}],13:[function(require,module,exports){
"use strict";
/*
 * kollavarsham
 * http://kollavarsham.org
 *
 * Copyright (c) 2014-2023 The Kollavarsham Team
 * Licensed under the MIT license.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Kollavarsham = exports.DefaultSettings = void 0;
/**
 * @module kollavarsham
 */
var calculations_1 = require("./calculations");
var index_1 = require("./dates/index");
exports.DefaultSettings = { system: 'SuryaSiddhanta', latitude: 23.2, longitude: 75.8 };
/**
 * The Kollavarsham class implements all the public APIs of the library.
 *
 * Create a new instance of this class, passing in the relevant options and call methods on the instance.
 *
 * @class Kollavarsham
 * @param {Object} [options] A set of key value pairs to configure the Kollavarsham instance. All settings are optional.
 *  @param {String} [options.system='SuryaSiddhanta'] Set to 'InPancasiddhantika' or 'SuryaSiddhanta' to use the corresponding system
 *  @param {Number} [options.latitude=23.2] Sets the latitude for the location for the conversions. Defaults to Ujjain, Madhya Pradesh
 *  @param {Number} [options.longitude=75.8] Sets the longitude for the location for the conversions. Default to Ujjain, Madhya Pradesh
 * @constructor
 * @example
 *const Kollavarsham = require('kollavarsham');
 *
 *const options = {
 *  system: 'SuryaSiddhanta',
 *  latitude: 10,
 *  longitude: 76.2
 *};
 *
 *const kollavarsham = new Kollavarsham(options);
 *
 *let todayInMalayalamEra = kollavarsham.fromGregorianDate(new Date());
 *
 *let today = kollavarsham.toGregorianDate(todayInMalayalamEra);  // Not implemented yet
 */
var Kollavarsham = /** @class */ (function () {
    function Kollavarsham(options) {
        if (options === void 0) { options = exports.DefaultSettings; }
        /**
         * Holds the settings state of the Kollavarsham instance. To access a snapshot use the {@link Kollavarsham#getSettings} method
         * @property settings
         * @type {{system, latitude, longitude}}
         */
        this.settings = {
            system: options.system,
            latitude: options.latitude,
            longitude: options.longitude
        };
    }
    /**
     * Converts a Gregorian date to the equivalent Kollavarsham date, respecting the current configuration
     *
     * @method fromGregorianDate
     * @for Kollavarsham
     * @param date {Date} The Gregorian date to be converted to Kollavarsham
     * @returns {kollavarshamDate} Converted date
     * @example
     *const Kollavarsham = require('Kollavarsham');
     *const kollavarsham = new Kollavarsham();
     *let today = kollavarsham.fromGregorianDate(new Date(1979, 4, 22));
     */
    Kollavarsham.prototype.fromGregorianDate = function (date) {
        var calculations = new calculations_1.Calculations(this.settings);
        return calculations.fromGregorian(date);
    };
    /**
     * Converts a Kollavarsham date (an instance of {@link kollavarshamDate}) to its equivalent Gregorian date, respecting the current configuration.
     * This method Will return {@link JulianDate} object for any date before 1st January 1583 AD and
     * [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) objects for later dates.
     *
     *  **This API has not been implemented yet**
     *
     * @method toGregorianDate
     * @for Kollavarsham
     * @param date {kollavarshamDate} The Kollavarsham date to be converted to Gregorian
     * @returns {Date|JulianDate} Converted date
     * @throws **"When the API is implemented, will convert &lt;date&gt;"**
     */
    Kollavarsham.prototype.toGregorianDate = function (date) {
        //TODO: Implement this method
        throw new Error("When the API is implemented, will convert ".concat(date));
    };
    /**
     * Converts a Saka date (an instance of {@link sakaDate}) to its equivalent Gregorian date, respecting the current configuration.
     * This method Will return {@link JulianDate} object for any date before 1st January 1583 AD and
     * [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) objects for later dates.
     *
     * @method toGregorianDateFromSaka
     * @for Kollavarsham
     * @param sakaDate {sakaDate} The Saka date to be converted to Gregorian
     * @returns {Date|JulianDate} Converted date
     */
    Kollavarsham.prototype.toGregorianDateFromSaka = function (sakaDate) {
        // TODO: Remove this method??
        // This is implemented specifically for the pancanga-nodejs cli (https://github.com/kollavarsham/pancanga-nodejs)
        // Could be removed when toGregorian has been implemented based on this
        if (!(sakaDate instanceof index_1.SakaDate)) {
            throw new Error('Parameter sakaDate should be an instance of the \'SakaDate\' class');
        }
        var calculations = new calculations_1.Calculations(this.settings);
        return calculations.toGregorianFromSaka(sakaDate);
    };
    return Kollavarsham;
}());
exports.Kollavarsham = Kollavarsham;
__exportStar(require("./dates/index"), exports);

},{"./calculations":2,"./dates/index":9}],14:[function(require,module,exports){
"use strict";
/*
 * kollavarsham
 * http://kollavarsham.org
 *
 * Copyright (c) 2014-2023 The Kollavarsham Team
 * Licensed under the MIT license.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MathHelper = void 0;
/**
 * @module mathHelper
 */
var _epsilon = 1e-8; // eslint-disable-line no-underscore-dangle
var _radianInDegrees = 180 / Math.PI; // eslint-disable-line no-underscore-dangle
/**
 *
 *  **INTERNAL/PRIVATE**
 *
 * @class MathHelper
 */
var MathHelper = /** @class */ (function () {
    function MathHelper() {
    }
    Object.defineProperty(MathHelper, "epsilon", {
        get: function () {
            return _epsilon;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathHelper, "radianInDegrees", {
        get: function () {
            return _radianInDegrees;
        },
        enumerable: false,
        configurable: true
    });
    MathHelper.isNumber = function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };
    MathHelper.isInt = function (n) {
        return MathHelper.isNumber(n) && n % 1 === 0;
    };
    MathHelper.truncateDecimals = function (num, digits) {
        // Thanks Nick Knowlson! - http://stackoverflow.com/a/9232092/218882
        //     (The original from that answer has a bug though, where an integer was getting rounded to "".
        //      Caught it while getting calendar.gregorianDateToJulianDay to work. 2 hours... Phew!)
        var numS = num.toString();
        var decPos = numS.indexOf('.');
        var result = decPos === -1 ? num.toString() : numS.substr(0, 1 + decPos + digits);
        var resultAsNumber = parseFloat(result);
        return isNaN(resultAsNumber) ? 0 : resultAsNumber;
    };
    MathHelper.truncate = function (n) {
        return MathHelper.truncateDecimals(n, 0);
    };
    MathHelper.floor = function (n) {
        var result = Math.floor(n);
        return isNaN(result) ? 0 : result;
    };
    MathHelper.fractional = function (n) {
        var result = n % 1;
        return isNaN(result) ? 0 : result;
    };
    MathHelper.round = function (n) {
        return MathHelper.isNumber(n) ? MathHelper.floor(parseFloat(n) + 0.5) : 0;
    };
    MathHelper.square = function (n) {
        return MathHelper.isNumber(n) ? Math.pow(parseFloat(n), 2) : 0;
    };
    MathHelper.zero360 = function (angleInDegrees) {
        var result = angleInDegrees - MathHelper.truncate(angleInDegrees / 360) * 360;
        return result < 0 ? 360 + result : result;
    };
    return MathHelper;
}());
exports.MathHelper = MathHelper;

},{}]},{},[1])(1)
});
