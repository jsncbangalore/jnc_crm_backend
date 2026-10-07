"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalHttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let GlobalHttpExceptionFilter = class GlobalHttpExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger('GlobalExceptionFilter');
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const requestId = request.headers['x-request-id'] || request.id || 'unknown';
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            message = typeof res === 'object' && res.message ? res.message : res;
        }
        if (status >= 500) {
            const errorStack = exception instanceof Error ? exception.stack : String(exception);
            this.logger.error(`[${requestId}] Server Error 500 on ${request.method} ${request.url}: ${errorStack}`);
            if (process.env.NODE_ENV === 'production') {
                return response.status(status).json({
                    statusCode: 500,
                    message: 'Internal server error',
                    requestId,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        return response.status(status).json({
            statusCode: status,
            message,
            requestId,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.GlobalHttpExceptionFilter = GlobalHttpExceptionFilter;
exports.GlobalHttpExceptionFilter = GlobalHttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], GlobalHttpExceptionFilter);
