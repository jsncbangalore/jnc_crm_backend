"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformAuthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const cors_config_1 = require("../common/cors-config");
const PLATFORM_REFRESH_COOKIE = 'jnc_platform_refresh';
function getPlatformRefreshCookieOptions() {
    const isSecure = process.env.COOKIE_SECURE === 'false'
        ? false
        : (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging');
    return {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'strict',
        path: '/api/v1/platform-auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    };
}
function enforceCsrf(req) {
    const xRequestedWith = req.headers['x-requested-with'];
    if (!xRequestedWith || xRequestedWith !== 'XMLHttpRequest') {
        throw new common_1.ForbiddenException('CSRF validation failed: Missing or invalid X-Requested-With header.');
    }
    const origin = req.headers.origin;
    if (origin && !(0, cors_config_1.isAllowedOrigin)(origin, process.env.FRONTEND_URL)) {
        throw new common_1.ForbiddenException(`CSRF validation failed: Origin '${origin}' is not permitted.`);
    }
}
let PlatformAuthController = class PlatformAuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async login(dto, req, res) {
        const ip = req.ip || req.socket?.remoteAddress;
        const result = await this.authService.platformLogin(dto, ip);
        if (result && result.refreshToken) {
            res.cookie(PLATFORM_REFRESH_COOKIE, result.refreshToken, getPlatformRefreshCookieOptions());
            const { refreshToken, ...rest } = result;
            return rest;
        }
        return result;
    }
    async refresh(refreshDto, req, res) {
        enforceCsrf(req);
        const tokenFromCookie = req.cookies?.[PLATFORM_REFRESH_COOKIE];
        const rawRefreshToken = tokenFromCookie || refreshDto.refreshToken;
        const ip = req.ip || req.socket?.remoteAddress;
        const result = await this.authService.refreshPlatformToken(rawRefreshToken, ip);
        if (result && result.refreshToken) {
            res.cookie(PLATFORM_REFRESH_COOKIE, result.refreshToken, getPlatformRefreshCookieOptions());
            const { refreshToken, ...rest } = result;
            return rest;
        }
        return result;
    }
    async logout(req, res) {
        enforceCsrf(req);
        const tokenFromCookie = req.cookies?.[PLATFORM_REFRESH_COOKIE];
        const ip = req.ip || req.socket?.remoteAddress;
        await this.authService.logout(tokenFromCookie, undefined, ip);
        const cookieOpts = getPlatformRefreshCookieOptions();
        res.clearCookie(PLATFORM_REFRESH_COOKIE, {
            path: '/api/v1/platform-auth',
            httpOnly: true,
            sameSite: 'strict',
            secure: cookieOpts.secure,
        });
        res.setHeader('Clear-Site-Data', '"cache", "storage"');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return { success: true, message: 'Platform super-admin logged out successfully' };
    }
};
exports.PlatformAuthController = PlatformAuthController;
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: process.env.NODE_ENV === 'production' ? 10 : 100, ttl: 900000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.PlatformLoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], PlatformAuthController.prototype, "login", null);
__decorate([
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.RefreshTokenDto, Object, Object]),
    __metadata("design:returntype", Promise)
], PlatformAuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PlatformAuthController.prototype, "logout", null);
exports.PlatformAuthController = PlatformAuthController = __decorate([
    (0, common_1.Controller)('platform-auth'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], PlatformAuthController);
