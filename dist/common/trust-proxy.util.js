"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTrustProxy = parseTrustProxy;
function parseTrustProxy(val, isProd) {
    if (val === 'true' || val === 'TRUE') {
        console.warn('[SECURITY WARNING] TRUST_PROXY cannot be true (boolean). Defaulting to numeric 1 hop.');
        return 1;
    }
    if (val !== undefined && val.trim() !== '') {
        const parsed = parseInt(val.trim(), 10);
        if (!isNaN(parsed) && parsed >= 0) {
            return parsed;
        }
        console.warn(`[SECURITY WARNING] Invalid TRUST_PROXY value "${val}". Expected integer hops. Defaulting to ${isProd ? 1 : 0}.`);
    }
    return isProd ? 1 : 0;
}
