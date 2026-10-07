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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const tenant_util_1 = require("../common/tenant.util");
let TeamsService = class TeamsService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async findAll(creator) {
        if (creator.role !== 'platform_super_admin' && creator.role !== 'tenant_admin' && creator.role !== 'admin') {
            throw new common_1.ForbiddenException('Access denied.');
        }
        const tenantId = (0, tenant_util_1.requireTenantId)(creator);
        const teams = await this.prisma.team.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { users: true }
                }
            }
        });
        return teams.map(team => ({
            ...team,
            allowedPages: JSON.parse(team.allowedPages || '[]'),
            userCount: team._count.users
        }));
    }
    async createTeam(dto, creator) {
        if (creator.role !== 'platform_super_admin' && creator.role !== 'tenant_admin' && creator.role !== 'admin') {
            throw new common_1.ForbiddenException('Access denied.');
        }
        const tenantId = (0, tenant_util_1.requireTenantId)(creator);
        const team = await this.prisma.team.create({
            data: {
                tenantId,
                name: dto.name.trim(),
                allowedPages: JSON.stringify(dto.allowedPages || []),
            }
        });
        await this.auditService.log({
            tenantId,
            actorId: creator.id,
            actorName: creator.employeeCode,
            action: 'CREATE',
            entityName: 'Team',
            entityId: team.id,
            afterState: dto,
        });
        return { ...team, allowedPages: JSON.parse(team.allowedPages) };
    }
    async updateTeam(id, dto, creator) {
        if (creator.role !== 'platform_super_admin' && creator.role !== 'tenant_admin' && creator.role !== 'admin') {
            throw new common_1.ForbiddenException('Access denied.');
        }
        const tenantId = (0, tenant_util_1.requireTenantId)(creator);
        const targetTeam = await this.prisma.team.findFirst({ where: { id, tenantId } });
        if (!targetTeam)
            throw new common_1.NotFoundException('Team not found');
        const updateData = {};
        if (dto.name)
            updateData.name = dto.name.trim();
        if (dto.allowedPages)
            updateData.allowedPages = JSON.stringify(dto.allowedPages);
        const updated = await this.prisma.team.update({
            where: { id },
            data: updateData,
        });
        await this.auditService.log({
            tenantId,
            actorId: creator.id,
            actorName: creator.employeeCode,
            action: 'UPDATE',
            entityName: 'Team',
            entityId: updated.id,
            afterState: dto,
        });
        return { ...updated, allowedPages: JSON.parse(updated.allowedPages) };
    }
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], TeamsService);
