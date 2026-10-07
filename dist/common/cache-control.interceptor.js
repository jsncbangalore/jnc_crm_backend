"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheControlInterceptor = void 0;
const common_1 = require("@nestjs/common");
let CacheControlInterceptor = class CacheControlInterceptor {
    intercept(context, next) {
        const http = context.switchToHttp();
        const response = http.getResponse();
        const request = http.getRequest();
        if (response && response.setHeader) {
            const url = (request.originalUrl || request.url || '').toLowerCase();
            const isPrivateFileDownload = url.includes('/download') ||
                url.includes('/export') ||
                url.includes('/pdf') ||
                url.includes('/uploads');
            if (isPrivateFileDownload) {
                response.setHeader('Cache-Control', 'private, no-store');
                response.setHeader('Pragma', 'no-cache');
                response.setHeader('Expires', '0');
            }
            else {
                response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                response.setHeader('Pragma', 'no-cache');
                response.setHeader('Expires', '0');
            }
        }
        return next.handle();
    }
};
exports.CacheControlInterceptor = CacheControlInterceptor;
exports.CacheControlInterceptor = CacheControlInterceptor = __decorate([
    (0, common_1.Injectable)()
], CacheControlInterceptor);
