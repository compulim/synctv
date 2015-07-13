/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:false, strict:true, undef:true, curly:true, devel:true, indent:4, maxerr:50, expr:true, onevar:true, browser:true, node:true */

!function (exports) {
    'use strict';

    if (!exports) {
        // This feature is not supported in the current environment.
        return;
    }

    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        formats = {
            'yyyy': function (d, utc) { return (utc ? d.getUTCFullYear() : d.getFullYear()) + ''; },
            'yyy': function (d, utc) { return (utc ? d.getUTCFullYear() : d.getFullYear()) + ''; },
            'yy': function (d, utc) { return ((utc ? d.getUTCFullYear() : d.getFullYear()) + '').substr(-2); },
            'MMMM': function (d, utc) { return months[(utc ? d.getUTCMonth() : d.getMonth())]; },
            'MMM': function (d, utc) { return months[(utc ? d.getUTCMonth() : d.getMonth())].substr(0, 3); },
            'MM': function (d, utc) { return pad((utc ? d.getUTCMonth() : d.getMonth()) + 1, 2); },
            'M': function (d, utc) { return (utc ? d.getUTCMonth() : d.getMonth()) + 1 + ''; },
            'dddd': function (d, utc) { return weekdays[(utc ? d.getUTCDay() : d.getDay())]; },
            'ddd': function (d, utc) { return weekdays[(utc ? d.getUTCDay() : d.getDay())].substr(0, 3); },
            'dd': function (d, utc) { return pad(utc ? d.getUTCDate() : d.getDate(), 2); },
            'd': function (d, utc) { return (utc ? d.getUTCDate() : d.getDate()) + ''; },
            'HH': function (d, utc) { return pad(utc ? d.getUTCHours() : d.getHours(), 2); },
            'H': function (d, utc) { return (utc ? d.getUTCHours() : d.getHours()) + ''; },
            'hh': function (d, utc) { return pad(((utc ? d.getUTCHours() : d.getHours()) % 12) || 12, 2); },
            'h': function (d, utc) { return (((utc ? d.getUTCHours() : d.getHours()) % 12) || 12) + ''; },
            'mm': function (d, utc) { return pad(utc ? d.getUTCMinutes() : d.getMinutes(), 2); },
            'm': function (d, utc) { return (utc ? d.getUTCMinutes() : d.getMinutes()) + ''; },
            'ss': function (d, utc) { return pad(utc ? d.getUTCSeconds() : d.getSeconds(), 2); },
            's': function (d, utc) { return (utc ? d.getUTCSeconds() : d.getSeconds()) + ''; },
            'fff': function (d, utc) { return pad(utc ? d.getMilliseconds() : d.getMilliseconds(), 3); },
            'ff': function (d, utc) { return Math.floor((utc ? d.getMilliseconds() : d.getMilliseconds()) / 10); },
            'f': function (d, utc) { return Math.floor((utc ? d.getMilliseconds() : d.getMilliseconds()) / 100); },
            'tt': function (d, utc) { return (utc ? d.getUTCHours() : d.getHours()) < 12 ? 'AM' : 'PM'; },
            't': function (d, utc) { return (utc ? d.getUTCHours() : d.getHours()) < 12 ? 'AM' : 'PM'; }
        },
        parsers = {
            'yyyy': function (value, date, utc) {
                return parseDateFixedDigitsPart(value, 4, date, utc ? date.setUTCFullYear : date.setFullYear);
            },
            'yyy': function (value, date, utc) {
                return parseDateAnyDigitsPart(value, 4, date, utc ? date.setUTCFullYear : date.setFullYear);
            },
            'yy': function (value, date, utc) {
                return parseDateFixedDigitsPart(value, 2, date, function (v) {
                    v += 2000;
                    utc ? date.setUTCFullYear(v) : date.setFullYear(v);
                });
            },
            'MMMM': function (value, date, utc) {
                var index = indexStartsWith(months, value);

                if (~index) {
                    utc ? date.setUTCMonth(index) : date.setMonth(index);
                    return months[index].length;
                } else {
                    return 0;
                }
            },
            'MMM': function (value, date, utc) {
                var index = indexStartsWith(months, value.substr(0, 3));

                if (~index) {
                    utc ? date.setUTCMonth(index) : date.setMonth(index);
                    return 3;
                } else {
                    return 0;
                }
            },
            'MM': function (value, date, utc) {
                return parseDateFixedDigitsPart(value, 2, date, function (v) {
                    utc ? date.setUTCMonth(v - 1) : date.setMonth(v - 1);
                });
            },
            'M': function (value, date, utc) {
                return parseDateAnyDigitsPart(value, 2, date, function (v) {
                    utc ? date.setUTCMonth(v - 1) : date.setMonth(v - 1);
                });
            },
            'dddd': function (value, date, utc) {
                var index = indexStartsWith(weekdays, value);

                return ~index ? weekdays[index].length : 0;
            },
            'ddd': function (value, date, utc) {
                return ~indexStartsWith(weekdays, value) ? 3 : 0;
            },
            'dd': function (value, date, utc) {
                return parseDateFixedDigitsPart(value, 2, date, utc ? date.setUTCDate : date.setDate);
            },
            'd': function (value, date, utc) {
                return parseDateAnyDigitsPart(value, 2, date, utc ? date.setUTCDate : date.setDate);
            },
            'HH': function (value, date, utc) {
                return parseDateFixedDigitsPart(value, 2, date, utc ? date.setUTCHours : date.setHours);
            },
            'H': function (value, date, utc) {
                return parseDateAnyDigitsPart(value, 2, date, utc ? date.setUTCHours : date.setHours);
            },
            'hh': function (value, date, utc) {
                return parseDateFixedDigitsPart(value, 2, date, function (v) {
                    if (v >= 12) { v -= 12; }
                    utc ? date.setUTCHours(v) : date.setHours(v);
                });
            },
            'h': function (value, date, utc) {
                return parseDateAnyDigitsPart(value, 2, date, function (v) {
                    if (v >= 12) { v -= 12; }
                    utc ? date.setUTCHours(v) : date.setHours(v);
                });
            },
            'mm': function (value, date, utc) {
                return parseDateFixedDigitsPart(value, 2, date, utc ? date.setUTCMinutes : date.setMinutes);
            },
            'm': function (value, date, utc) {
                return parseDateAnyDigitsPart(value, 2, date, utc ? date.setUTCMinutes : date.setMinutes);
            },
            'ss': function (value, date, utc) {
                return parseDateFixedDigitsPart(value, 2, date, utc ? date.setUTCSeconds : date.setSeconds);
            },
            's': function (value, date, utc) {
                return parseDateAnyDigitsPart(value, 2, date, utc ? date.setUTCSeconds : date.setSeconds);
            },
            'fff': function (value, date, utc) {
                return parseDateFixedDigitsPart(value, 3, date, utc ? date.setUTCMilliseconds : date.setMilliseconds);
            },
            'ff': function (value, date, utc) {
                return parseDateFixedDigitsPart(value, 2, date, function (v) {
                    utc ? date.setUTCMilliseconds(v * 10) : date.setMilliseconds(v * 10);
                });
            },
            'f': function (value, date, utc) {
                return parseDateFixedDigitsPart(value, 1, date, function (v) {
                    utc ? date.setUTCMilliseconds(v * 100) : date.setMilliseconds(v * 100);
                });
            },
            'tt': function (value, date, utc) {
                value = value.substr(0, 2).toLowerCase();

                if (value === 'am') {
                    return 2;
                } else if (value === 'pm') {
                    date.setHours(date.getHours() + 12);
                    return 2;
                } else {
                    return 0;
                }
            },
            't': function (value, date, utc) {
                value = value.substr(0, 2).toLowerCase();

                if (value === 'am') {
                    return 2;
                } else if (value === 'pm') {
                    date.setHours(date.getHours() + 12);
                    return 2;
                } else {
                    return 0;
                }
            },
            ' ': function (value) {
                return value.charAt(0) === ' ' ? 1 : 0;
            },
            '*': function () {
                return 1;
            }
        };

    exports.format = function (date, format, utc) {
        // yyyy-MMM-dd HH:mm:ss.fff

        if (!format) {
            return '';
        }

        var i = 0, l = format.length, last, c, fn, output = '';

        for (; i <= l; i++) {
            c = format.charAt(i);

            if (typeof last === 'undefined') {
                last = c;
            } else if (last.charAt(last.length - 1) === c) {
                last += c;
            } else {
                fn = formats[last];

                if (fn) {
                    output += fn(date, utc);
                } else if (typeof last !== 'undefined') {
                    output += last;
                }

                last = c;
            }
        }

        return output;
    };

    exports.parse = function (text, format, utc) {
        if (!text || !format) {
            return;
        }

        var date = utc ? new Date(0) : new Date(1970, 0, 1, 0, 0, 0, 0),
            i = 0, l = format.length, textIndex = 0, formatter, c, fn, output = '';

        for (; i <= l; i++) {
            c = format.charAt(i);

            if (typeof formatter === 'undefined') {
                formatter = c;
            } else if (formatter.charAt(formatter.length - 1) === c && c !== '*') {
                formatter += c;
            } else {
                fn = parsers[formatter];

                if (fn) {
                    textIndex += fn(text.substr(textIndex), date, utc);
                } else if (text.substr(textIndex, formatter.length) === formatter) {
                    textIndex += formatter.length;
                }

                formatter = c;
            }
        }

        return date;
    };

    exports.compact = function (date) {
        return pad(date.getFullYear(), 4) +
               pad(date.getMonth() + 1, 2) +
               pad(date.getDate(), 2) +
               pad(date.getHours(), 2) +
               pad(date.getMinutes(), 2) +
               pad(date.getSeconds(), 2) +
               pad(date.getMilliseconds(), 3);
    };

    exports.add = function (date, value) {
        var year = date.getFullYear() + (value.years || 0),
            month = date.getMonth() + (value.months || 0),
            day = date.getDate() + (value.days || 0) + (value.weeks || 0) * 7,
            hour = date.getHours() + (value.hours || 0),
            minutes = date.getMinutes() + (value.minutes || 0),
            seconds = date.getSeconds() + (value.seconds || 0),
            milliseconds = date.getMilliseconds() + (value.milliseconds || 0);

        return new Date(year, month, day, hour, minutes, seconds, milliseconds);
    };

    function pad(v, c) {
        var s = v + '', i = 0, l = c - s.length;

        for (; i < l; i++) {
            s = '0' + s;
        }

        return s;
    }

    function indexStartsWith(arr, value) {
        var i = 0, l = arr.length, item, strLength;

        value = value.toLowerCase();

        for (; i < l; i++) {
            item = arr[i].toLowerCase();
            strLength = Math.min(item.length, value.length);

            if (item.substr(0, strLength) === value.substr(0, strLength)) {
                return i;
            }
        }

        return -1;
    }

    function parseDateFixedDigitsPart(value, numDigits, date, setter) {
        value = +value.substr(0, numDigits);

        if (isNaN(value)) {
            return 0;
        } else {
            setter.call(date, value);

            return numDigits;
        }
    }

    function parseDateAnyDigitsPart(value, maxNumDigits, date, setter) {
        value = parseInt(value.substr(0, maxNumDigits), 10);

        if (isNaN(value)) {
            return 0;
        } else {
            setter.call(date, value);

            return (value + '').length;
        }
    }
}(
    typeof window !== 'undefined' ? (window.ztom = window.ztom || {}).date = {} :
    typeof module !== 'undefined' ? module.exports :
    null);