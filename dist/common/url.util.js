"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFrontendUrl = getFrontendUrl;
exports.getDatabaseProjectRef = getDatabaseProjectRef;
const env_validation_1 = require("./env-validation");
function getFrontendUrl(overrideUrl) {
    if (overrideUrl && overrideUrl.trim() && !overrideUrl.includes('localhost')) {
        return overrideUrl.trim().replace(/\/+$/, '');
    }
    const envUrl = process.env.FRONTEND_URL || process.env.APP_URL;
    if (envUrl && envUrl.trim() && !envUrl.includes('localhost')) {
        return envUrl.trim().replace(/\/+$/, '');
    }
    if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:5173';
    }
    return 'https://admin.jsnc.co.in';
}
function getDatabaseProjectRef() {
    const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL || '';
    if (!dbUrl)
        return 'not-configured';
    const ref = (0, env_validation_1.extractSupabaseProjectRef)(dbUrl);
    if (ref)
        return ref;
    try {
        const parsed = new URL(dbUrl);
        return parsed.hostname;
    }
    catch {
        return 'dev-local';
    }
}
