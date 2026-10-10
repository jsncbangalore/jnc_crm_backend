"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_ORIGIN_LIST = void 0;
exports.getAllowedCorsOrigins = getAllowedCorsOrigins;
exports.getCorsOriginsCount = getCorsOriginsCount;
exports.getAllowedCorsHosts = getAllowedCorsHosts;
exports.isAllowedOrigin = isAllowedOrigin;
exports.corsOriginCallback = corsOriginCallback;
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('CORS');
const rejectedOriginsSet = new Set();
exports.ALLOWED_ORIGIN_LIST = [
    'https://admin.jsnc.co.in',
    'http://admin.jsnc.co.in',
    'https://api.jsnc.co.in',
    'http://api.jsnc.co.in',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:3000',
    'http://localhost:3333',
];
function getAllowedCorsOrigins() {
    const isProd = process.env.NODE_ENV?.toLowerCase() === 'production';
    const envOrigins = [
        ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
        ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : []),
        ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
        ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
    ]
        .map((u) => u.trim())
        .filter(Boolean);
    if (isProd) {
        return Array.from(new Set(envOrigins));
    }
    return Array.from(new Set([...exports.ALLOWED_ORIGIN_LIST, ...envOrigins]));
}
function getCorsOriginsCount() {
    return getAllowedCorsOrigins().length;
}
function getAllowedCorsHosts() {
    const origins = getAllowedCorsOrigins();
    const hosts = origins.map((u) => {
        try {
            return new URL(u).hostname;
        }
        catch {
            return u;
        }
    });
    return Array.from(new Set(hosts));
}
function isAllowedOrigin(origin, frontendUrlEnv) {
    if (!origin) {
        return true;
    }
    const configuredOrigins = getAllowedCorsOrigins();
    if (configuredOrigins.includes(origin) || origin.endsWith('.jsnc.co.in')) {
        return true;
    }
    return false;
}
function corsOriginCallback(origin, callback) {
    if (isAllowedOrigin(origin, process.env.FRONTEND_URL)) {
        callback(null, true);
    }
    else {
        if (origin && !rejectedOriginsSet.has(origin)) {
            rejectedOriginsSet.add(origin);
            const count = getCorsOriginsCount();
            logger.warn(`CORS rejected origin ${origin}; allowed origins: ${count} configured`);
        }
        callback(null, false);
    }
}
