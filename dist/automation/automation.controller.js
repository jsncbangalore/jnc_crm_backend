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
exports.AutomationController = void 0;
const common_1 = require("@nestjs/common");
const page_access_decorator_1 = require("../auth/page-access.decorator");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const automation_service_1 = require("./automation.service");
let AutomationController = class AutomationController {
    constructor(automationService) {
        this.automationService = automationService;
    }
    getAllRules(user, search, triggerEvent, isActive) {
        return this.automationService.getAllRules(user, {
            search,
            triggerEvent,
            isActive: isActive !== undefined ? isActive === 'true' : undefined,
        });
    }
    getMetrics(user) {
        return this.automationService.getMetrics(user);
    }
    getRuleById(user, id) {
        return this.automationService.getRuleById(user, id);
    }
    createRule(user, data) {
        return this.automationService.createRule(user, data);
    }
    updateRule(user, id, data) {
        return this.automationService.updateRule(user, id, data);
    }
    toggleRule(user, id, isActive) {
        return this.automationService.toggleRuleActive(user, id, isActive);
    }
    deleteRule(user, id) {
        return this.automationService.deleteRule(user, id);
    }
    runNightlyReorderCheck() {
        return this.automationService.runNightlyReorderCheck();
    }
    processDelayedJobs() {
        return this.automationService.processDelayedJobs();
    }
};
exports.AutomationController = AutomationController;
__decorate([
    (0, common_1.Get)('rules'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('triggerEvent')),
    __param(3, (0, common_1.Query)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], AutomationController.prototype, "getAllRules", null);
__decorate([
    (0, common_1.Get)('metrics'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AutomationController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('rules/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AutomationController.prototype, "getRuleById", null);
__decorate([
    (0, common_1.Post)('rules'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AutomationController.prototype, "createRule", null);
__decorate([
    (0, common_1.Patch)('rules/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], AutomationController.prototype, "updateRule", null);
__decorate([
    (0, common_1.Patch)('rules/:id/toggle'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Boolean]),
    __metadata("design:returntype", void 0)
], AutomationController.prototype, "toggleRule", null);
__decorate([
    (0, common_1.Delete)('rules/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AutomationController.prototype, "deleteRule", null);
__decorate([
    (0, common_1.Post)('run-nightly-reorder'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AutomationController.prototype, "runNightlyReorderCheck", null);
__decorate([
    (0, common_1.Post)('process-delayed-jobs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AutomationController.prototype, "processDelayedJobs", null);
exports.AutomationController = AutomationController = __decorate([
    (0, common_1.Controller)('automation'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin'),
    (0, page_access_decorator_1.PageAccess)('automation'),
    __metadata("design:paramtypes", [automation_service_1.AutomationService])
], AutomationController);
