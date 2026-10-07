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
exports.SuppliersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const scoping_service_1 = require("../auth/scoping.service");
const tenant_util_1 = require("../common/tenant.util");
let SuppliersService = class SuppliersService {
    constructor(prisma, scopingService) {
        this.prisma = prisma;
        this.scopingService = scopingService;
    }
    async create(dto, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        return this.prisma.supplier.create({
            data: {
                tenantId,
                name: dto.name,
                contactPerson: dto.contactPerson,
                email: dto.email,
                phone: dto.phone,
                gstin: dto.gstin,
                address: dto.address,
                city: dto.city,
                leadTimeDays: dto.leadTimeDays ? Number(dto.leadTimeDays) : 7,
                notes: dto.notes,
                createdById: user?.id ?? null,
            },
        });
    }
    async findAll(user, query = {}) {
        const scope = user ? this.scopingService.getSupplierScope(user) : { tenantId: (0, tenant_util_1.requireTenantId)(user) };
        const where = { deletedAt: null, ...scope };
        if (query.isActive !== undefined) {
            where.isActive = query.isActive;
        }
        if (query.search) {
            const searchOR = [
                { name: { contains: query.search } },
                { contactPerson: { contains: query.search } },
                { city: { contains: query.search } },
                { email: { contains: query.search } },
                { gstin: { contains: query.search } },
            ];
            if (scope.OR) {
                where.AND = [{ OR: scope.OR }, { OR: searchOR }];
                delete where.OR;
            }
            else {
                where.OR = searchOR;
            }
        }
        return this.prisma.supplier.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                preferredSkus: {
                    select: { id: true, skuCode: true, name: true, category: true },
                },
                _count: {
                    select: { stockMovements: true, preferredSkus: true },
                },
            },
        });
    }
    async findOne(id, user) {
        const scope = user ? this.scopingService.getSupplierScope(user) : { tenantId: (0, tenant_util_1.requireTenantId)(user) };
        const supplier = await this.prisma.supplier.findFirst({
            where: { id, ...scope },
            include: {
                preferredSkus: true,
                stockMovements: {
                    take: 20,
                    orderBy: { createdAt: 'desc' },
                    include: { sku: true },
                },
            },
        });
        if (!supplier || supplier.deletedAt) {
            throw new common_1.NotFoundException('Supplier not found');
        }
        return supplier;
    }
    async update(id, dto, user) {
        const scope = user ? this.scopingService.getSupplierScope(user) : { tenantId: (0, tenant_util_1.requireTenantId)(user) };
        const res = await this.prisma.supplier.updateMany({
            where: { id, ...scope, deletedAt: null },
            data: dto,
        });
        if (res.count === 0) {
            throw new common_1.NotFoundException('Supplier not found');
        }
        return this.findOne(id, user);
    }
    async delete(id, user) {
        const scope = user ? this.scopingService.getSupplierScope(user) : { tenantId: (0, tenant_util_1.requireTenantId)(user) };
        const res = await this.prisma.supplier.updateMany({
            where: { id, ...scope, deletedAt: null },
            data: { deletedAt: new Date() },
        });
        if (res.count === 0) {
            throw new common_1.NotFoundException('Supplier not found');
        }
        return { success: true };
    }
    async countActiveSuppliers(user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        return this.prisma.supplier.count({
            where: {
                tenantId,
                isActive: true,
                deletedAt: null,
            },
        });
    }
};
exports.SuppliersService = SuppliersService;
exports.SuppliersService = SuppliersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        scoping_service_1.ScopingService])
], SuppliersService);
