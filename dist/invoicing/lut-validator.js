"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLutEndDate = parseLutEndDate;
exports.validateLutStatus = validateLutStatus;
function parseLutEndDate(lutValidity) {
    if (!lutValidity || typeof lutValidity !== 'string') {
        return { expiryDate: null, expiryDateStr: null };
    }
    const str = lutValidity.trim();
    const toMatch = str.match(/(?:to|till|until|validity|end|through)\s*:?\s*(\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
    let targetDateToken = toMatch ? toMatch[1] : null;
    if (!targetDateToken) {
        const allDates = str.match(/\b\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g);
        if (allDates && allDates.length > 0) {
            targetDateToken = allDates[allDates.length - 1];
        }
    }
    if (!targetDateToken) {
        const isoDate = new Date(str);
        if (!isNaN(isoDate.getTime())) {
            const day = String(isoDate.getDate()).padStart(2, '0');
            const month = String(isoDate.getMonth() + 1).padStart(2, '0');
            const year = isoDate.getFullYear();
            return { expiryDate: isoDate, expiryDateStr: `${day}/${month}/${year}` };
        }
        return { expiryDate: null, expiryDateStr: null };
    }
    const parts = targetDateToken.split(/[\/\-\.]/);
    if (parts.length === 3) {
        let day = 0, month = 0, year = 0;
        if (parts[0].length === 4) {
            year = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10) - 1;
            day = parseInt(parts[2], 10);
        }
        else {
            day = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10) - 1;
            year = parseInt(parts[2], 10);
            if (year < 100)
                year += 2000;
        }
        const expiryDate = new Date(year, month, day, 23, 59, 59, 999);
        if (!isNaN(expiryDate.getTime())) {
            const formattedDay = String(day).padStart(2, '0');
            const formattedMonth = String(month + 1).padStart(2, '0');
            const formattedYear = year;
            const expiryDateStr = `${formattedDay}/${formattedMonth}/${formattedYear}`;
            return { expiryDate, expiryDateStr };
        }
    }
    return { expiryDate: null, expiryDateStr: null };
}
function validateLutStatus(lutBondNo = 'AD290525013648T', lutValidity, referenceDate = new Date()) {
    const bondNo = (lutBondNo || 'AD290525013648T').trim();
    const refDate = referenceDate ? new Date(referenceDate) : new Date();
    const { expiryDate, expiryDateStr } = parseLutEndDate(lutValidity);
    if (!expiryDate) {
        return {
            isExpired: false,
            isExpiringSoon: false,
            daysRemaining: 999,
            expiryDateStr: null,
            expiryDate: null,
            lutBondNo: bondNo,
            warningMessage: null,
            severity: 'unknown',
        };
    }
    const diffMs = expiryDate.getTime() - refDate.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) {
        return {
            isExpired: true,
            isExpiringSoon: false,
            daysRemaining,
            expiryDateStr,
            expiryDate,
            lutBondNo: bondNo,
            warningMessage: `LUT bond ${bondNo} expired on ${expiryDateStr} -- confirm renewal before issuing this SEZ invoice.`,
            severity: 'expired',
        };
    }
    else if (daysRemaining <= 30) {
        return {
            isExpired: false,
            isExpiringSoon: true,
            daysRemaining,
            expiryDateStr,
            expiryDate,
            lutBondNo: bondNo,
            warningMessage: `LUT bond ${bondNo} expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} (on ${expiryDateStr}) -- confirm renewal before issuing this SEZ invoice.`,
            severity: 'expiring_soon',
        };
    }
    return {
        isExpired: false,
        isExpiringSoon: false,
        daysRemaining,
        expiryDateStr,
        expiryDate,
        lutBondNo: bondNo,
        warningMessage: null,
        severity: 'valid',
    };
}
