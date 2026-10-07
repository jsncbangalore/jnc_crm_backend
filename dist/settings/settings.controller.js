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
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const settings_service_1 = require("./settings.service");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const settings_dto_1 = require("./dto/settings.dto");
let SettingsController = class SettingsController {
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    async getBranding() {
        return this.settingsService.getBranding();
    }
    async getBrandingLogoDefault(res) {
        return this.settingsService.servePublicBrandingImage('logo', undefined, res);
    }
    async getBrandingLogo(tenantKey, res) {
        return this.settingsService.servePublicBrandingImage('logo', tenantKey, res);
    }
    async getBrandingStampDefault(res) {
        return this.settingsService.servePublicBrandingImage('stamp', undefined, res);
    }
    async getBrandingStamp(tenantKey, res) {
        return this.settingsService.servePublicBrandingImage('stamp', tenantKey, res);
    }
    async updateBranding(body, user) {
        return this.settingsService.updateBranding(user, body);
    }
    async getCompanyProfile(user) {
        return this.settingsService.getCompanyProfile(user);
    }
    async updateCompanyProfile(body, user) {
        return this.settingsService.updateCompanyProfile(user, body);
    }
    async getMailAccounts(user) {
        return this.settingsService.getMailAccounts(user);
    }
    async createMailAccount(body, user) {
        return this.settingsService.createMailAccount(user, body);
    }
    async updateMailAccount(id, body, user) {
        return this.settingsService.updateMailAccount(user, id, body);
    }
    async deleteMailAccount(id, user) {
        return this.settingsService.deleteMailAccount(user, id);
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)('branding'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getBranding", null);
__decorate([
    (0, common_1.Get)('branding/logo'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getBrandingLogoDefault", null);
__decorate([
    (0, common_1.Get)('branding/logo/:tenantKey'),
    __param(0, (0, common_1.Param)('tenantKey')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getBrandingLogo", null);
__decorate([
    (0, common_1.Get)('branding/stamp'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getBrandingStampDefault", null);
__decorate([
    (0, common_1.Get)('branding/stamp/:tenantKey'),
    __param(0, (0, common_1.Param)('tenantKey')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getBrandingStamp", null);
__decorate([
    (0, common_1.Post)('branding'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [settings_dto_1.UpdateBrandingDto, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateBranding", null);
__decorate([
    (0, common_1.Get)('company-profile'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getCompanyProfile", null);
__decorate([
    (0, common_1.Post)('company-profile'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [settings_dto_1.UpdateCompanyProfileDto, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateCompanyProfile", null);
__decorate([
    (0, common_1.Get)('mail-accounts'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('platform_super_admin', 'tenant_admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getMailAccounts", null);
__decorate([
    (0, common_1.Post)('mail-accounts'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('platform_super_admin', 'tenant_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [settings_dto_1.CreateMailAccountDto, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "createMailAccount", null);
__decorate([
    (0, common_1.Put)('mail-accounts/:id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('platform_super_admin', 'tenant_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, settings_dto_1.UpdateMailAccountDto, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateMailAccount", null);
__decorate([
    (0, common_1.Delete)('mail-accounts/:id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('platform_super_admin', 'tenant_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "deleteMailAccount", null);
exports.SettingsController = SettingsController = __decorate([
    (0, common_1.Controller)('settings'),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], SettingsController);
