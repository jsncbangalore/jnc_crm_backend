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
exports.ActivitiesController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const activities_service_1 = require("./activities.service");
const project_dto_1 = require("./dto/project.dto");
const file_validator_1 = require("../common/file-validator");
const platform_express_1 = require("@nestjs/platform-express");
const XLSX = require("xlsx");
let ActivitiesController = class ActivitiesController {
    constructor(activitiesService) {
        this.activitiesService = activitiesService;
    }
    async listProjects(user) {
        return this.activitiesService.listProjects(user);
    }
    async createProject(body, user) {
        return this.activitiesService.createProject(user, body);
    }
    async updateProject(id, body, user) {
        return this.activitiesService.updateProject(user, id, body);
    }
    async deleteProject(id, user) {
        return this.activitiesService.deleteProject(user, id);
    }
    async getAssignableUsers(user) {
        return this.activitiesService.getAssignableUsers(user);
    }
    async assignMembers(projectId, body, user) {
        return this.activitiesService.assignMembers(user, projectId, body.memberIds || []);
    }
    async listLogs(projectId, user) {
        return this.activitiesService.listLogs(user, projectId);
    }
    async uploadLog(projectId, file, body, user) {
        const taskSummary = body?.taskSummary || '';
        if (!file && (!taskSummary || !taskSummary.trim())) {
            throw new common_1.BadRequestException('Please enter a summary or select a file to upload.');
        }
        if (file) {
            (0, file_validator_1.validateUploadedFile)(file, 'spreadsheet', 20 * 1024 * 1024);
        }
        let records = [];
        let fileName = undefined;
        if (file) {
            const ext = file.originalname.split('.').pop()?.toLowerCase();
            if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
                throw new common_1.BadRequestException('Only .xlsx, .xls or .csv files are accepted.');
            }
            const workbook = XLSX.read(file.buffer, { type: 'buffer' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            records = XLSX.utils.sheet_to_json(sheet, { defval: '' });
            fileName = file.originalname;
        }
        return this.activitiesService.createLog(user, projectId, {
            fileName,
            taskSummary,
            records,
        });
    }
    async deleteLog(projectId, logId, user) {
        return this.activitiesService.deleteLog(user, projectId, logId);
    }
};
exports.ActivitiesController = ActivitiesController;
__decorate([
    (0, common_1.Get)('projects'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "listProjects", null);
__decorate([
    (0, common_1.Post)('projects'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [project_dto_1.CreateProjectDto, Object]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "createProject", null);
__decorate([
    (0, common_1.Put)('projects/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, project_dto_1.UpdateProjectDto, Object]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "updateProject", null);
__decorate([
    (0, common_1.Delete)('projects/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "deleteProject", null);
__decorate([
    (0, common_1.Get)('assignable-users'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "getAssignableUsers", null);
__decorate([
    (0, common_1.Post)('projects/:id/assign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, project_dto_1.AssignMembersDto, Object]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "assignMembers", null);
__decorate([
    (0, common_1.Get)('projects/:projectId/logs'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "listLogs", null);
__decorate([
    (0, common_1.Post)('projects/:projectId/logs/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 20 * 1024 * 1024 } })),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, project_dto_1.UploadLogDto, Object]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "uploadLog", null);
__decorate([
    (0, common_1.Delete)('projects/:projectId/logs/:logId'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('logId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "deleteLog", null);
exports.ActivitiesController = ActivitiesController = __decorate([
    (0, common_1.Controller)('activities'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin', 'project_manager', 'developer_lead', 'developer'),
    __metadata("design:paramtypes", [activities_service_1.ActivitiesService])
], ActivitiesController);
