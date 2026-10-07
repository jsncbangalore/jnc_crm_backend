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
var ActivitiesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_util_1 = require("../common/tenant.util");
let ActivitiesService = ActivitiesService_1 = class ActivitiesService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ActivitiesService_1.name);
    }
    async listProjects(user) {
        this.requireProjectAccessRole(user);
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        if (user.role === 'developer') {
            return this.prisma.project.findMany({
                where: {
                    tenantId,
                    assignments: {
                        some: { userId: user.id },
                    },
                },
                orderBy: { createdAt: 'desc' },
                include: {
                    createdBy: { select: { id: true, name: true, employeeCode: true } },
                    assignments: {
                        include: {
                            user: { select: { id: true, name: true, employeeCode: true, role: true } },
                        },
                    },
                    _count: { select: { dailyLogs: true } },
                },
            });
        }
        return this.prisma.project.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: {
                createdBy: { select: { id: true, name: true, employeeCode: true } },
                assignments: {
                    include: {
                        user: { select: { id: true, name: true, employeeCode: true, role: true } },
                    },
                },
                _count: { select: { dailyLogs: true } },
            },
        });
    }
    async createProject(user, dto) {
        this.requireProjectCreationRole(user);
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        return this.prisma.project.create({
            data: {
                tenantId,
                name: dto.name.trim(),
                description: dto.description?.trim(),
                status: dto.status || 'active',
                createdById: user.id,
            },
            include: {
                createdBy: { select: { id: true, name: true, employeeCode: true } },
                assignments: {
                    include: {
                        user: { select: { id: true, name: true, employeeCode: true, role: true } },
                    },
                },
            },
        });
    }
    async updateProject(user, id, dto) {
        this.requireProjectCreationRole(user);
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const res = await this.prisma.project.updateMany({
            where: { id, tenantId },
            data: {
                name: dto.name?.trim(),
                description: dto.description?.trim(),
                status: dto.status,
            },
        });
        if (res.count === 0)
            throw new common_1.NotFoundException('Project not found');
        return this.findProjectOrFail(id, user);
    }
    async deleteProject(user, id) {
        this.requireSuperAdminOrAdmin(user);
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const res = await this.prisma.project.deleteMany({ where: { id, tenantId } });
        if (res.count === 0)
            throw new common_1.NotFoundException('Project not found');
        return { success: true };
    }
    async getAssignableUsers(user) {
        this.requireAssignmentRole(user);
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        return this.prisma.user.findMany({
            where: {
                tenantId,
                role: { in: ['developer', 'developer_lead', 'project_manager'] },
                isActive: true,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                employeeCode: true,
                role: true,
                email: true,
            },
            orderBy: { name: 'asc' },
        });
    }
    async assignMembers(user, projectId, memberIds) {
        this.requireAssignmentRole(user);
        await this.findProjectOrFail(projectId, user);
        await this.prisma.projectAssignment.deleteMany({
            where: { projectId },
        });
        if (memberIds && memberIds.length > 0) {
            await this.prisma.projectAssignment.createMany({
                data: memberIds.map((userId) => ({
                    projectId,
                    userId,
                    assignedById: user.id,
                })),
            });
        }
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        return this.prisma.project.findFirst({
            where: { id: projectId, tenantId },
            include: {
                assignments: {
                    include: {
                        user: { select: { id: true, name: true, employeeCode: true, role: true } },
                    },
                },
            },
        });
    }
    async listLogs(user, projectId) {
        this.requireProjectAccessRole(user);
        await this.findProjectOrFail(projectId, user);
        if (user.role === 'developer') {
            return this.prisma.projectDailyLog.findMany({
                where: {
                    projectId,
                    uploadedById: user.id,
                },
                orderBy: { logDate: 'desc' },
                include: {
                    uploadedBy: { select: { id: true, name: true, employeeCode: true, role: true } },
                },
            });
        }
        return this.prisma.projectDailyLog.findMany({
            where: { projectId },
            orderBy: { logDate: 'desc' },
            include: {
                uploadedBy: { select: { id: true, name: true, employeeCode: true, role: true } },
            },
        });
    }
    async createLog(user, projectId, dto) {
        this.requireProjectAccessRole(user);
        await this.findProjectOrFail(projectId, user);
        if (user.role === 'developer') {
            const assignment = await this.prisma.projectAssignment.findFirst({
                where: { projectId, userId: user.id },
            });
            if (!assignment) {
                throw new common_1.ForbiddenException('You are not assigned to this project.');
            }
        }
        const log = await this.prisma.projectDailyLog.create({
            data: {
                projectId,
                uploadedById: user.id,
                fileName: dto.fileName,
                taskSummary: dto.taskSummary,
                recordsJson: JSON.stringify(dto.records),
                rawPayload: JSON.stringify({ uploadedBy: user.employeeCode, rows: dto.records.length }),
            },
            include: {
                uploadedBy: { select: { id: true, name: true, employeeCode: true, role: true } },
            },
        });
        this.logger.log(`Daily log submitted for project ${projectId} by ${user.employeeCode} (${user.role})`);
        return log;
    }
    async deleteLog(user, projectId, logId) {
        this.requireSuperAdminOrAdmin(user);
        await this.findProjectOrFail(projectId, user);
        const log = await this.prisma.projectDailyLog.findFirst({
            where: { id: logId, projectId },
        });
        if (!log)
            throw new common_1.NotFoundException('Daily log not found.');
        return this.prisma.projectDailyLog.delete({ where: { id: logId } });
    }
    requireProjectAccessRole(user) {
        const allowed = [
            'platform_super_admin',
            'tenant_admin',
            'admin',
            'sub_admin',
            'project_manager',
            'developer_lead',
            'developer',
        ];
        if (!allowed.includes(user.role)) {
            throw new common_1.ForbiddenException('Access restricted to Project Team members.');
        }
    }
    requireProjectCreationRole(user) {
        const allowed = ['platform_super_admin', 'tenant_admin', 'admin', 'project_manager'];
        if (!allowed.includes(user.role)) {
            throw new common_1.ForbiddenException('Only Project Managers and Admins can create or edit projects.');
        }
    }
    requireAssignmentRole(user) {
        const allowed = ['platform_super_admin', 'tenant_admin', 'admin', 'developer_lead', 'project_manager'];
        if (!allowed.includes(user.role)) {
            throw new common_1.ForbiddenException('Only Developer Leads, Project Managers, and Admins can assign developers.');
        }
    }
    requireSuperAdminOrAdmin(user) {
        if (user.role !== 'platform_super_admin' && user.role !== 'tenant_admin' && user.role !== 'admin') {
            throw new common_1.ForbiddenException('Only Tenant Admin or Admin can delete records.');
        }
    }
    async findProjectOrFail(id, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const project = await this.prisma.project.findFirst({
            where: { id, tenantId },
        });
        if (!project)
            throw new common_1.NotFoundException(`Project not found.`);
        return project;
    }
};
exports.ActivitiesService = ActivitiesService;
exports.ActivitiesService = ActivitiesService = ActivitiesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ActivitiesService);
