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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const passport_1 = require("@nestjs/passport");
const current_user_decorator_1 = require("./current-user.decorator");
const cors_config_1 = require("../common/cors-config");
const REFRESH_COOKIE_NAME = 'jnc_refresh_token';
function getRefreshCookieOptions() {
    const isSecure = process.env.COOKIE_SECURE === 'false'
        ? false
        : (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging');
    return {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'strict',
        path: '/api/v1/auth',
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
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async login(loginDto, req, res) {
        const ip = req.ip || req.socket?.remoteAddress;
        const result = await this.authService.login(loginDto, ip);
        if (result && result.refreshToken) {
            res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
            const { refreshToken, ...rest } = result;
            return rest;
        }
        return result;
    }
    async selectCompany(dto, req, res) {
        const ip = req.ip || req.socket?.remoteAddress;
        const result = await this.authService.selectCompany(dto, ip);
        if (result && result.refreshToken) {
            res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
            const { refreshToken, ...rest } = result;
            return rest;
        }
        return result;
    }
    async forgotPassword(dto, req) {
        const ip = req.ip || req.socket?.remoteAddress;
        return this.authService.forgotPassword(dto, ip);
    }
    async resetPassword(dto) {
        return this.authService.resetPassword(dto);
    }
    async refresh(refreshDto, req, res) {
        enforceCsrf(req);
        const tokenFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
        const rawRefreshToken = tokenFromCookie || refreshDto.refreshToken;
        const ip = req.ip || req.socket?.remoteAddress;
        const result = await this.authService.refreshToken(rawRefreshToken, ip);
        if (result && result.refreshToken) {
            res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());
            const { refreshToken, ...rest } = result;
            return rest;
        }
        return result;
    }
    async logout(req, res) {
        enforceCsrf(req);
        const tokenFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
        const ip = req.ip || req.socket?.remoteAddress;
        await this.authService.logout(tokenFromCookie, undefined, ip);
        const cookieOpts = getRefreshCookieOptions();
        res.clearCookie(REFRESH_COOKIE_NAME, {
            path: '/api/v1/auth',
            httpOnly: true,
            sameSite: 'strict',
            secure: cookieOpts.secure,
        });
        res.setHeader('Clear-Site-Data', '"cache", "storage"');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return { success: true, message: 'Logged out successfully' };
    }
    async logoutAll(user, req, res) {
        enforceCsrf(req);
        const ip = req.ip || req.socket?.remoteAddress;
        await this.authService.logoutAll(user.id, ip);
        const cookieOpts = getRefreshCookieOptions();
        res.clearCookie(REFRESH_COOKIE_NAME, {
            path: '/api/v1/auth',
            httpOnly: true,
            sameSite: 'strict',
            secure: cookieOpts.secure,
        });
        res.setHeader('Clear-Site-Data', '"cache", "storage"');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return { success: true, message: 'Signed out of all devices successfully' };
    }
    async getProfile(user) {
        return (0, auth_service_1.formatAuthUser)(user);
    }
    async updateProfile(user, body) {
        return this.authService.updateProfile(user.id, body);
    }
    async changePassword(user, body) {
        return this.authService.changePassword(user.id, body.currentPass, body.newPass);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: process.env.NODE_ENV === 'production' ? 10 : 100, ttl: 900000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 900000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('login/select-company'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.SelectCompanyDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "selectCompany", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 900000 } }),
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.ForgotPasswordDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 900000 } }),
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.RefreshTokenDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('logout-all'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logoutAll", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Patch)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, login_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('change-password'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, login_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
