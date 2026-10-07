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
exports.AuditService = void 0;
exports.extractClientIp = extractClientIp;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
function extractClientIp(req) {
    if (!req)
        return '127.0.0.1';
    const forwarded = req.headers?.['x-forwarded-for'];
    if (forwarded) {
        const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
        if (raw)
            return raw.trim();
    }
    return req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
}
let AuditService = class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(dto) {
        try {
            return await this.prisma.auditLog.create({
                data: {
                    tenantId: dto.tenantId || null,
                    actorId: dto.actorId,
                    actorName: dto.actorName,
                    action: dto.action,
                    entityName: dto.entityName,
                    entityId: dto.entityId,
                    beforeState: dto.beforeState ? JSON.stringify(dto.beforeState) : null,
                    afterState: dto.afterState ? JSON.stringify(dto.afterState) : null,
                    ipAddress: dto.ipAddress || '127.0.0.1',
                },
            });
        }
        catch (e) {
            console.warn('AuditLog creation warning:', e);
            return null;
        }
    }
    async getLogs(query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const skip = (page - 1) * limit;
        const where = {};
        if (query.tenantId)
            where.tenantId = query.tenantId;
        if (query.entityName)
            where.entityName = query.entityName;
        if (query.entityId)
            where.entityId = query.entityId;
        if (query.actorId)
            where.actorId = query.actorId;
        if (query.search) {
            where.OR = [
                { actorName: { contains: query.search } },
                { action: { contains: query.search } },
                { entityName: { contains: query.search } },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { timestamp: 'desc' },
                include: {
                    actor: {
                        select: { id: true, name: true, employeeCode: true, email: true },
                    },
                },
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
