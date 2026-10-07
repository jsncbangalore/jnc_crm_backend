"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeFormulaExport = sanitizeFormulaExport;
exports.sanitizeFormulaImport = sanitizeFormulaImport;
exports.sanitizeRowForExport = sanitizeRowForExport;
exports.sanitizeRowForImport = sanitizeRowForImport;
const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r'];
function sanitizeFormulaExport(val) {
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.length > 0 && FORMULA_TRIGGERS.some((char) => trimmed.startsWith(char))) {
            return `'${val}`;
        }
    }
    return val;
}
function sanitizeFormulaImport(val) {
    if (typeof val === 'string') {
        let cleaned = val.trim();
        if (cleaned.startsWith("'") && cleaned.length > 1 && FORMULA_TRIGGERS.some((char) => cleaned[1] === char)) {
            return cleaned.substring(1);
        }
        if (FORMULA_TRIGGERS.some((char) => cleaned.startsWith(char))) {
            return `'${cleaned}`;
        }
    }
    return val;
}
function sanitizeRowForExport(row) {
    const sanitized = {};
    for (const [key, val] of Object.entries(row)) {
        sanitized[key] = sanitizeFormulaExport(val);
    }
    return sanitized;
}
function sanitizeRowForImport(row) {
    const sanitized = {};
    for (const [key, val] of Object.entries(row)) {
        sanitized[key] = sanitizeFormulaImport(val);
    }
    return sanitized;
}
