"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SanitizeResponseInterceptor = void 0;
exports.sanitizeObject = sanitizeObject;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const SENSITIVE_KEYS = new Set([
    'passwordhash',
    'smtppass',
    'imappass',
    'webhooksecret',
    'tokenhash',
    'resettokenhash',
    'encryptionkey',
    'backupencryptionkey',
    'appsecret',
]);
function sanitizeObject(data) {
    if (data === null || data === undefined) {
        return data;
    }
    if (Array.isArray(data)) {
        return data.map((item) => sanitizeObject(item));
    }
    if (typeof data === 'object') {
        if (data instanceof Date || Buffer.isBuffer(data)) {
            return data;
        }
        const cleaned = {};
        for (const [key, value] of Object.entries(data)) {
            if (SENSITIVE_KEYS.has(key.toLowerCase())) {
                continue;
            }
            cleaned[key] = sanitizeObject(value);
        }
        return cleaned;
    }
    return data;
}
let SanitizeResponseInterceptor = class SanitizeResponseInterceptor {
    intercept(context, next) {
        return next.handle().pipe((0, operators_1.map)((data) => sanitizeObject(data)));
    }
};
exports.SanitizeResponseInterceptor = SanitizeResponseInterceptor;
exports.SanitizeResponseInterceptor = SanitizeResponseInterceptor = __decorate([
    (0, common_1.Injectable)()
], SanitizeResponseInterceptor);
