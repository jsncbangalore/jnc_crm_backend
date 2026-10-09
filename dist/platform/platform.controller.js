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
exports.PlatformAdminsController = exports.PlatformController = void 0;
const common_1 = require("@nestjs/common");
const platform_service_1 = require("./platform.service");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const platform_admin_dto_1 = require("./dto/platform-admin.dto");
let PlatformController = class PlatformController {
    constructor(platformService) {
        this.platformService = platformService;
    }
    async listTenants() {
        return this.platformService.listTenants();
    }
    async getTenant(id) {
        return this.platformService.getTenant(id);
    }
    async createTenant(dto) {
        return this.platformService.createTenant(dto);
    }
    async updateTenant(id, dto) {
        return this.platformService.updateTenant(id, dto);
    }
    async deleteTenant(id) {
        return this.platformService.deleteTenant(id);
    }
    async impersonateTenant(id, user, req) {
        const ip = req?.ip || req?.connection?.remoteAddress || '127.0.0.1';
        return this.platformService.impersonateTenant(id, user, ip);
    }
    async resetTenantAdminPassword(id, dto) {
        return this.platformService.resetTenantAdminPassword(id, dto);
    }
    async listTenantUsers(id) {
        return this.platformService.listTenantUsers(id);
    }
    async addTenantUser(id, dto) {
        return this.platformService.addTenantUser(id, dto);
    }
    async deleteTenantUser(id, userId) {
        return this.platformService.deleteTenantUser(id, userId);
    }
};
exports.PlatformController = PlatformController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PlatformController.prototype, "listTenants", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PlatformController.prototype, "getTenant", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlatformController.prototype, "createTenant", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PlatformController.prototype, "updateTenant", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PlatformController.prototype, "deleteTenant", null);
__decorate([
    (0, common_1.Post)(':id/impersonate'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PlatformController.prototype, "impersonateTenant", null);
__decorate([
    (0, common_1.Post)(':id/reset-admin-password'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, platform_admin_dto_1.ResetTenantAdminPasswordDto]),
    __metadata("design:returntype", Promise)
], PlatformController.prototype, "resetTenantAdminPassword", null);
__decorate([
    (0, common_1.Get)(':id/users'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PlatformController.prototype, "listTenantUsers", null);
__decorate([
    (0, common_1.Post)(':id/users'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PlatformController.prototype, "addTenantUser", null);
__decorate([
    (0, common_1.Delete)(':id/users/:userId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PlatformController.prototype, "deleteTenantUser", null);
exports.PlatformController = PlatformController = __decorate([
    (0, common_1.Controller)('platform/tenants'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('platform_super_admin'),
    __metadata("design:paramtypes", [platform_service_1.PlatformService])
], PlatformController);
let PlatformAdminsController = class PlatformAdminsController {
    constructor(platformService) {
        this.platformService = platformService;
    }
    async listPlatformAdmins() {
        return this.platformService.listPlatformAdmins();
    }
    async createPlatformAdmin(dto, actor) {
        return this.platformService.createPlatformAdmin(dto, actor);
    }
    async toggleActive(id, body) {
        return this.platformService.togglePlatformAdminActive(id, body?.isActive);
    }
    async resetPassword(id) {
        return this.platformService.resetPlatformAdminUserPassword(id);
    }
    async deletePlatformAdmin(id) {
        return this.platformService.deletePlatformAdmin(id);
    }
};
exports.PlatformAdminsController = PlatformAdminsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PlatformAdminsController.prototype, "listPlatformAdmins", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [platform_admin_dto_1.CreatePlatformAdminDto, Object]),
    __metadata("design:returntype", Promise)
], PlatformAdminsController.prototype, "createPlatformAdmin", null);
__decorate([
    (0, common_1.Patch)(':id/toggle-active'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, platform_admin_dto_1.TogglePlatformAdminActiveDto]),
    __metadata("design:returntype", Promise)
], PlatformAdminsController.prototype, "toggleActive", null);
__decorate([
    (0, common_1.Post)(':id/reset-password'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PlatformAdminsController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PlatformAdminsController.prototype, "deletePlatformAdmin", null);
exports.PlatformAdminsController = PlatformAdminsController = __decorate([
    (0, common_1.Controller)('platform/admins'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('platform_super_admin'),
    __metadata("design:paramtypes", [platform_service_1.PlatformService])
], PlatformAdminsController);
