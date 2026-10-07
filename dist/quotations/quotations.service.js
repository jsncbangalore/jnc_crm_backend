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
exports.QuotationsService = exports.UpdateQuotationStatusDto = exports.CreateQuotationDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const scoping_service_1 = require("../auth/scoping.service");
const audit_service_1 = require("../audit/audit.service");
const orders_service_1 = require("../orders/orders.service");
const tenant_util_1 = require("../common/tenant.util");
const class_validator_1 = require("class-validator");
class CreateQuotationDto {
}
exports.CreateQuotationDto = CreateQuotationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "leadId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "contactId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "customerName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "customerPhone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "customerEmail", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "companyName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "shippingAddress", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "validUntil", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "terms", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateQuotationDto.prototype, "taxRate", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateQuotationDto.prototype, "lines", void 0);
class UpdateQuotationStatusDto {
}
exports.UpdateQuotationStatusDto = UpdateQuotationStatusDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateQuotationStatusDto.prototype, "status", void 0);
let QuotationsService = class QuotationsService {
    constructor(prisma, scopingService, auditService, ordersService) {
        this.prisma = prisma;
        this.scopingService = scopingService;
        this.auditService = auditService;
        this.ordersService = ordersService;
    }
    async resolveSkuForLine(line, user, warehouseId) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        if (line.skuId && line.skuId.trim()) {
            const existing = await this.prisma.sku.findFirst({ where: { id: line.skuId, tenantId } });
            if (existing)
                return existing;
        }
        const text = (line.name || '').trim();
        if (!text) {
            throw new common_1.BadRequestException('Product / SKU description is required.');
        }
        let found = await this.prisma.sku.findFirst({
            where: {
                tenantId,
                OR: [
                    { skuCode: { equals: text } },
                    { name: { equals: text } },
                ],
            },
        });
        if (found)
            return found;
        const count = await this.prisma.sku.count({ where: { tenantId } });
        const cleanPrefix = text.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'PROD';
        const autoSkuCode = `${cleanPrefix}-${String(count + 1).padStart(4, '0')}`;
        let whId = warehouseId;
        if (!whId) {
            const defaultWh = await this.prisma.warehouse.findFirst({ where: { tenantId }, orderBy: { createdAt: 'asc' } });
            whId = defaultWh?.id;
        }
        const created = await this.prisma.sku.create({
            data: {
                tenantId,
                skuCode: autoSkuCode,
                name: text,
                category: 'Communication / PA System',
                hsnCode: '85184000',
                taxRate: 18.0,
                packageType: 'Unit',
                unitPrice: line.unitPrice || 0,
                costPrice: 0,
                reorderPoint: 10,
                stockItems: whId
                    ? {
                        create: {
                            warehouseId: whId,
                            quantityOnHand: 0,
                            quantityReserved: 0,
                        },
                    }
                    : undefined,
            },
        });
        return created;
    }
    async create(dto, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        if (!dto.customerName || !dto.customerPhone) {
            throw new common_1.BadRequestException('Customer Name and Phone are required.');
        }
        if (!dto.lines || dto.lines.length === 0) {
            throw new common_1.BadRequestException('At least 1 product line is required for quotation.');
        }
        const count = await this.prisma.quotation.count({ where: { tenantId } });
        const quoteNumber = `JNC-QT-${String(count + 1).padStart(5, '0')}`;
        const resolvedLines = [];
        let subtotal = 0;
        for (const l of dto.lines) {
            const sku = await this.resolveSkuForLine(l, user);
            const qty = Number(l.quantity) || 1;
            const price = Number(l.unitPrice) || 0;
            const discount = Number(l.discount) || 0;
            const total = Math.max(0, qty * price - discount);
            subtotal += total;
            resolvedLines.push({
                skuId: sku.id,
                quantity: qty,
                unitPrice: price,
                discount,
                totalPrice: total,
                notes: l.notes,
            });
        }
        const taxRate = dto.taxRate !== undefined ? Number(dto.taxRate) : 18.0;
        const taxAmount = (subtotal * taxRate) / 100;
        const totalAmount = subtotal + taxAmount;
        const validUntil = dto.validUntil ? new Date(dto.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const quotation = await this.prisma.quotation.create({
            data: {
                tenantId,
                quoteNumber,
                leadId: dto.leadId,
                contactId: dto.contactId,
                createdById: user.id,
                status: 'draft',
                subtotal,
                taxRate,
                taxAmount,
                totalAmount,
                validUntil,
                notes: dto.notes,
                terms: dto.terms || '1. 100% advance or approved credit terms.\n2. Delivery within 7–10 days of confirmation.\n3. Prices inclusive/exclusive of GST as indicated.',
                lines: {
                    create: resolvedLines,
                },
            },
            include: {
                lines: { include: { sku: true } },
                lead: true,
                contact: true,
                createdBy: { select: { id: true, name: true, employeeCode: true } },
            },
        });
        if (dto.leadId) {
            await this.prisma.lead.update({
                where: { id: dto.leadId },
                data: { status: 'quoted' },
            }).catch(() => { });
        }
        await this.auditService.log({
            tenantId,
            actorId: user.id,
            actorName: user.employeeCode,
            action: 'CREATE',
            entityName: 'Quotation',
            entityId: quotation.id,
            afterState: { quoteNumber, totalAmount },
        });
        return quotation;
    }
    async findAll(user, query) {
        const scope = this.scopingService.getQuotationScope(user);
        const where = { ...scope, deletedAt: null };
        if (query.status)
            where.status = query.status;
        if (query.search) {
            const searchOR = [
                { quoteNumber: { contains: query.search } },
                { lead: { customerName: { contains: query.search } } },
                { lead: { customerPhone: { contains: query.search } } },
                { contact: { name: { contains: query.search } } },
            ];
            if (scope.OR) {
                where.AND = [{ OR: scope.OR }, { OR: searchOR }];
                delete where.OR;
            }
            else {
                where.OR = searchOR;
            }
        }
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.prisma.quotation.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    lines: { include: { sku: true } },
                    lead: true,
                    contact: true,
                    order: true,
                    createdBy: { select: { id: true, name: true, employeeCode: true } },
                },
            }),
            this.prisma.quotation.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const scope = this.scopingService.getQuotationScope(user);
        const quotation = await this.prisma.quotation.findFirst({
            where: { id, tenantId, ...scope },
            include: {
                lines: { include: { sku: true } },
                lead: true,
                contact: true,
                order: { include: { invoices: true } },
                createdBy: { select: { id: true, name: true, employeeCode: true } },
            },
        });
        if (!quotation)
            throw new common_1.NotFoundException('Quotation not found');
        return quotation;
    }
    async updateStatus(id, status, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const quote = await this.findOne(id, user);
        const res = await this.prisma.quotation.updateMany({
            where: { id, tenantId },
            data: { status },
        });
        if (res.count === 0)
            throw new common_1.NotFoundException('Quotation not found');
        const updated = await this.findOne(id, user);
        await this.auditService.log({
            actorId: user.id,
            actorName: user.employeeCode,
            action: 'STATUS_CHANGE',
            entityName: 'Quotation',
            entityId: id,
            beforeState: { status: quote.status },
            afterState: { status },
        });
        return updated;
    }
    async convertToOrder(id, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const quote = await this.findOne(id, user);
        if (quote.order) {
            throw new common_1.BadRequestException('Quotation has already been converted to an order.');
        }
        const customerName = quote.lead?.customerName || quote.contact?.name || 'Valued Client';
        const customerPhone = quote.lead?.customerPhone || quote.contact?.phone || '—';
        const customerEmail = quote.lead?.customerEmail || quote.contact?.email;
        const order = await this.ordersService.createOrder({
            quotationId: quote.id,
            contactId: quote.contactId || undefined,
            customerName,
            customerPhone,
            customerEmail,
            shippingAddress: quote.lead?.city,
            notes: quote.notes || undefined,
            lines: quote.lines.map((l) => ({
                skuId: l.skuId,
                name: l.sku?.name,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
            })),
        }, user);
        await this.prisma.quotation.updateMany({
            where: { id, tenantId },
            data: { status: 'approved' },
        });
        if (quote.leadId) {
            await this.prisma.lead.updateMany({
                where: { id: quote.leadId, tenantId },
                data: { status: 'won' },
            }).catch(() => { });
        }
        return order;
    }
};
exports.QuotationsService = QuotationsService;
exports.QuotationsService = QuotationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        scoping_service_1.ScopingService,
        audit_service_1.AuditService,
        orders_service_1.OrdersService])
], QuotationsService);
