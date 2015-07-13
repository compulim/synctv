/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, devel:true, indent:4, maxerr:50, expr:true, onevar:true, browser:true, node:true */

!function (exports) {
    'use strict';

    if (!exports) {
        // This feature is not supported in the current environment.
        return;
    }

    var bytesUnits = {
            zeroBytes: '0 bytes',
            'byte': 'a byte',
            bytes: 'bytes',
            kilobyte: '1 KB',
            kilobytes: 'KB',
            megabyte: '1 MB',
            megabytes: 'MB',
            gigabyte: '1 GB',
            gigabytes: 'GB'
        },
        c1024 = 1024,
        c1048576 = 1048576,
        c1073741824 = 1073741824;

    exports.humanize = function (v) {
        // Format number into #,###
        var str = v + '',
            newStr = [],
            i = str.length - 1,
            j = 0;

        for (; i >= 0; i--) {
            if (j !== 0 && j % 3 === 0) {
                newStr.unshift(',');
            }

            newStr.unshift(str[i]);

            j++;
        }

        return newStr.join('');
    };

    exports.bytes = function (v, units) {
        units = units || bytesUnits;

        if (v === 0) {
            return units.zeroBytes;
        } else if (v === 1) {
            return units.byte;
        } else if (v < c1024) {
            return v + ' ' + units.bytes;
        } else if (v === c1024) {
            return units.kilobyte;
        } else if (v < c1048576) {
            return (v / c1024).toFixed(1) + ' ' + units.kilobytes;
        } else if (v === c1048576) {
            return units.megabyte;
        } else if (v < c1073741824) {
            return (v / c1048576).toFixed(1) + ' ' + units.megabytes;
        } else if (v === c1073741824) {
            return units.gigabyte;
        } else {
            return (v / c1073741824).toFixed(1) + ' ' + units.gigabytes;
        }
    };

    exports.pad = function (v, length) {
        if (isNaN(v)) {
            return v + '';
        }

        var str = v + '';

        return new Array(Math.max(length - str.length + 1, 0)).join('0') + str;
    };
}(
    typeof window !== 'undefined' ? (window.ztom = window.ztom || {}).number = {} :
    typeof module !== 'undefined' ? module.exports :
    null);