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
exports.CustomObjectsController = void 0;
const common_1 = require("@nestjs/common");
const page_access_decorator_1 = require("../auth/page-access.decorator");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const custom_objects_service_1 = require("./custom-objects.service");
const custom_objects_dto_1 = require("./dto/custom-objects.dto");
let CustomObjectsController = class CustomObjectsController {
    constructor(customObjectsService) {
        this.customObjectsService = customObjectsService;
    }
    getAllObjects(user) {
        return this.customObjectsService.getAllObjects(user);
    }
    getObjectById(id, user) {
        return this.customObjectsService.getObjectById(id, user);
    }
    createObject(data, user) {
        return this.customObjectsService.createObject(data, user);
    }
    updateObject(id, data, user) {
        return this.customObjectsService.updateObject(id, data, user);
    }
    deleteObject(id, user) {
        return this.customObjectsService.deleteObject(id, user);
    }
    getObjectFields(objectId, includeDeleted, user) {
        return this.customObjectsService.getObjectFields(objectId, includeDeleted === 'true', user);
    }
    createField(objectId, data, user) {
        return this.customObjectsService.createField(objectId, data, user);
    }
    updateField(objectId, fieldId, data, user) {
        return this.customObjectsService.updateField(objectId, fieldId, data, user);
    }
    softDeleteField(objectId, fieldId, user) {
        return this.customObjectsService.softDeleteField(objectId, fieldId, user);
    }
    restoreField(objectId, fieldId, user) {
        return this.customObjectsService.restoreField(objectId, fieldId, user);
    }
    getLookupOptions(targetObject, search, user) {
        return this.customObjectsService.getLookupOptions(targetObject, search, user);
    }
    getRecords(objectApiName, page, limit, search, sortBy, sortOrder, includeArchived, user) {
        return this.customObjectsService.getRecords(objectApiName, {
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 25,
            search,
            sortBy,
            sortOrder,
            includeArchived: includeArchived === 'true',
        }, user);
    }
    getRecordById(objectApiName, recordId, user) {
        return this.customObjectsService.getRecordById(objectApiName, recordId, user);
    }
    createRecord(objectApiName, submittedData, user) {
        return this.customObjectsService.createRecord(objectApiName, submittedData, user);
    }
    updateRecord(objectApiName, recordId, submittedData, user) {
        return this.customObjectsService.updateRecord(objectApiName, recordId, submittedData, user);
    }
    deleteRecord(objectApiName, recordId, user) {
        return this.customObjectsService.deleteRecord(objectApiName, recordId, user);
    }
};
exports.CustomObjectsController = CustomObjectsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CustomObjectsController.prototype, "getAllObjects", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomObjectsController.prototype, "getObjectById", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [custom_objects_dto_1.CreateCustomObjectDto, Object]),
    __metadata("design:returntype", void 0)
], CustomObjectsController.prototype, "createObject", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, custom_objects_dto_1.UpdateCustomObjectDto, Object]),
    __metadata("design:returntype", void 0)
], CustomObjectsController.prototype, "updateObject", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomObjectsController.prototype, "deleteObject", null);
__decorate([
    (0, common_1.Get)(':id/fields'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('includeDeleted')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CustomObjectsController.prototype, "getObjectFields", null);
__decorate([
    (0, common_1.Post)(':id/fields'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, custom_objects_dto_1.CreateCustomFieldDto, Object]),
    __metadata("design:returntype", void 0)
], CustomObjectsController.prototype, "createField", null);
__decorate([
    (0, common_1.Patch)(':id/fields/:fieldId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('fieldId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, custom_objects_dto_1.UpdateCustomFieldDto, Object]),
    __metadata("design:returntype", void 0)
], CustomObjectsController.prototype, "updateField", null);
__decorate([
    (0, common_1.Delete)(':id/fields/:fieldId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('fieldId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CustomObjectsController.prototype, "softDeleteField", null);
__decorate([
    (0, common_1.Patch)(':id/fields/:fieldId/restore'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('fieldId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CustomObjectsController.prototype, "restoreField", null);
__decorate([
    (0, common_1.Get)('lookups/:targetObject'),
    __param(0, (0, common_1.Param)('targetObject')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CustomObjectsController.prototype, "getLookupOptions", null);
__decorate([
    (0, common_1.Get)(':objectApiName/records'),
    __param(0, (0, common_1.Param)('objectApiName')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('sortBy')),
    __param(5, (0, common_1.Query)('sortOrder')),
    __param(6, (0, common_1.Query)('includeArchived')),
    __param(7, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, Object]),
    __metadata("design:returntype", void 0)
], CustomObjectsController.prototype, "getRecords", null);
__decorate([
    (0, common_1.Get)(':objectApiName/records/:recordId'),
    __param(0, (0, common_1.Param)('objectApiName')),
    __param(1, (0, common_1.Param)('recordId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CustomObjectsController.prototype, "getRecordById", null);
__decorate([
    (0, common_1.Post)(':objectApiName/records'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: false, forbidNonWhitelisted: false })),
    __param(0, (0, common_1.Param)('objectApiName')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CustomObjectsController.prototype, "createRecord", null);
__decorate([
    (0, common_1.Patch)(':objectApiName/records/:recordId'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: false, forbidNonWhitelisted: false })),
    __param(0, (0, common_1.Param)('objectApiName')),
    __param(1, (0, common_1.Param)('recordId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], CustomObjectsController.prototype, "updateRecord", null);
__decorate([
    (0, common_1.Delete)(':objectApiName/records/:recordId'),
    __param(0, (0, common_1.Param)('objectApiName')),
    __param(1, (0, common_1.Param)('recordId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CustomObjectsController.prototype, "deleteRecord", null);
exports.CustomObjectsController = CustomObjectsController = __decorate([
    (0, common_1.Controller)('custom-objects'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin'),
    (0, page_access_decorator_1.PageAccess)('custom_objects'),
    __metadata("design:paramtypes", [custom_objects_service_1.CustomObjectsService])
], CustomObjectsController);
