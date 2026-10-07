"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_ORIGIN_LIST = void 0;
exports.isAllowedOrigin = isAllowedOrigin;
exports.corsOriginCallback = corsOriginCallback;
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
function isAllowedOrigin(origin, frontendUrlEnv) {
    if (!origin) {
        return true;
    }
    const envOrigins = [
        ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
        ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : []),
        ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
        ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
        ...(frontendUrlEnv ? frontendUrlEnv.split(',') : []),
    ]
        .map((u) => u.trim())
        .filter(Boolean);
    const configuredOrigins = [
        ...exports.ALLOWED_ORIGIN_LIST,
        ...envOrigins,
    ];
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
        callback(null, false);
    }
}
