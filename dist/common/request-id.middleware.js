"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestIdMiddleware = void 0;
exports.requestIdMiddleware = requestIdMiddleware;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
let RequestIdMiddleware = class RequestIdMiddleware {
    constructor() {
        this.logger = new common_1.Logger('HTTP');
    }
    use(req, res, next) {
        const rawId = req.headers['x-request-id'];
        const requestId = typeof rawId === 'string' && rawId.trim().length > 0
            ? rawId.trim()
            : crypto.randomUUID();
        req.headers['x-request-id'] = requestId;
        req.id = requestId;
        res.setHeader('X-Request-Id', requestId);
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            const status = res.statusCode;
            this.logger.log(`[${requestId}] ${req.method} ${req.originalUrl} ${status} - ${duration}ms`);
        });
        next();
    }
};
exports.RequestIdMiddleware = RequestIdMiddleware;
exports.RequestIdMiddleware = RequestIdMiddleware = __decorate([
    (0, common_1.Injectable)()
], RequestIdMiddleware);
function requestIdMiddleware(req, res, next) {
    const rawId = req.headers['x-request-id'];
    const requestId = typeof rawId === 'string' && rawId.trim().length > 0
        ? rawId.trim()
        : crypto.randomUUID();
    req.headers['x-request-id'] = requestId;
    req.id = requestId;
    res.setHeader('X-Request-Id', requestId);
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        common_1.Logger.log(`[${requestId}] ${req.method} ${req.originalUrl} ${status} - ${duration}ms`, 'HTTP');
    });
    next();
}
