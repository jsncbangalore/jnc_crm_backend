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
exports.OrdersService = exports.RecordOrderPaymentDto = exports.UpdateShipmentStatusDto = exports.CreateShipmentDto = exports.UpdateOrderStatusDto = exports.UpdateOrderDto = exports.CreateOrderDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const scoping_service_1 = require("../auth/scoping.service");
const notifications_service_1 = require("../notifications/notifications.service");
const audit_service_1 = require("../audit/audit.service");
const tenant_util_1 = require("../common/tenant.util");
const brand_1 = require("../common/brand");
const class_validator_1 = require("class-validator");
class CreateOrderDto {
}
exports.CreateOrderDto = CreateOrderDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "quotationId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "contactId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "customerName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "customerPhone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "customerEmail", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "shippingAddress", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateOrderDto.prototype, "lines", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "paymentStatus", void 0);
class UpdateOrderDto {
}
exports.UpdateOrderDto = UpdateOrderDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrderDto.prototype, "quotationId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrderDto.prototype, "contactId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrderDto.prototype, "customerName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrderDto.prototype, "customerPhone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrderDto.prototype, "customerEmail", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrderDto.prototype, "shippingAddress", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateOrderDto.prototype, "lines", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrderDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrderDto.prototype, "paymentStatus", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrderDto.prototype, "status", void 0);
class UpdateOrderStatusDto {
}
exports.UpdateOrderStatusDto = UpdateOrderStatusDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateOrderStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrderStatusDto.prototype, "note", void 0);
class CreateShipmentDto {
}
exports.CreateShipmentDto = CreateShipmentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "courierName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "trackingNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "trackingUrl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "notes", void 0);
class UpdateShipmentStatusDto {
}
exports.UpdateShipmentStatusDto = UpdateShipmentStatusDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateShipmentStatusDto.prototype, "status", void 0);
class RecordOrderPaymentDto {
}
exports.RecordOrderPaymentDto = RecordOrderPaymentDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RecordOrderPaymentDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RecordOrderPaymentDto.prototype, "paymentType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RecordOrderPaymentDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RecordOrderPaymentDto.prototype, "transactionRef", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RecordOrderPaymentDto.prototype, "paymentDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RecordOrderPaymentDto.prototype, "notes", void 0);
let OrdersService = class OrdersService {
    constructor(prisma, scopingService, notificationsService, auditService) {
        this.prisma = prisma;
        this.scopingService = scopingService;
        this.notificationsService = notificationsService;
        this.auditService = auditService;
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
            throw new common_1.BadRequestException('Product SKU or description name is required for all order items.');
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
        const codePrefix = text.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'ITEM';
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const skuCode = `SKU-${codePrefix}-${randomSuffix}`;
        const newSku = await this.prisma.sku.create({
            data: {
                tenantId,
                skuCode,
                name: text,
                category: 'Equipment',
                unitPrice: line.unitPrice || 0,
                costPrice: Math.round((line.unitPrice || 0) * 0.7),
                hsnCode: line.hsnCode || '85312000',
                packageType: "Unit",
            },
        });
        let defaultWarehouse = await this.prisma.warehouse.findFirst({ where: { tenantId } });
        if (!defaultWarehouse) {
            defaultWarehouse = await this.prisma.warehouse.create({
                data: {
                    tenantId,
                    code: 'MAIN-01',
                    name: 'Main Warehouse',
                    city: 'Headquarters',
                },
            });
        }
        if (defaultWarehouse) {
            await this.prisma.stockItem.create({
                data: {
                    skuId: newSku.id,
                    warehouseId: defaultWarehouse.id,
                    quantityOnHand: 1000,
                    quantityReserved: 0,
                },
            });
        }
        return newSku;
    }
    async createOrder(dto, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const count = await this.prisma.order.count({ where: { tenantId } });
        const orderNumber = `ORD-${String(count + 1).padStart(5, '0')}`;
        const resolvedLines = [];
        for (const line of dto.lines) {
            const sku = await this.resolveSkuForLine(line, user);
            resolvedLines.push({
                skuId: sku.id,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
            });
        }
        const subtotal = resolvedLines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
        const taxAmount = subtotal * 0.18;
        const totalAmount = subtotal + taxAmount;
        const order = await this.prisma.order.create({
            data: {
                tenantId,
                orderNumber,
                quotationId: dto.quotationId,
                contactId: dto.contactId,
                createdById: user.id,
                customerName: dto.customerName,
                customerPhone: dto.customerPhone,
                customerEmail: dto.customerEmail,
                shippingAddress: dto.shippingAddress,
                subtotal,
                taxAmount,
                totalAmount,
                notes: dto.notes,
                status: 'confirmed',
                paymentStatus: 'pending',
                lines: {
                    create: resolvedLines.map((l) => ({
                        skuId: l.skuId,
                        quantity: l.quantity,
                        unitPrice: l.unitPrice,
                        totalPrice: l.quantity * l.unitPrice,
                    })),
                },
            },
            include: {
                lines: { include: { sku: true } },
                contact: true,
                createdBy: { select: { id: true, name: true, employeeCode: true } },
            },
        });
        for (const line of resolvedLines) {
            const stockItem = await this.prisma.stockItem.findFirst({
                where: { skuId: line.skuId },
                orderBy: { quantityOnHand: 'desc' },
            });
            if (stockItem) {
                await this.prisma.stockItem.update({
                    where: { id: stockItem.id },
                    data: { quantityReserved: { increment: line.quantity } },
                });
                await this.prisma.stockMovement.create({
                    data: {
                        skuId: line.skuId,
                        type: 'outward',
                        quantity: line.quantity,
                        referenceType: 'order',
                        referenceId: order.id,
                        performedById: user.id,
                        reasonCode: 'stock_reservation',
                    },
                });
            }
        }
        await this.prisma.statusHistory.create({
            data: {
                entityType: 'order',
                entityId: order.id,
                toStatus: 'confirmed',
                changedById: user.id,
                note: 'Order confirmed, stock reserved',
            },
        });
        await this.auditService.log({
            actorId: user.id,
            actorName: user.employeeCode,
            action: 'CREATE',
            entityName: 'Order',
            entityId: order.id,
            afterState: { orderNumber, totalAmount, linesCount: resolvedLines.length },
        });
        return order;
    }
    async findAll(user, query) {
        const scopeWhere = this.scopingService.getOrderScope(user);
        const where = { ...scopeWhere, deletedAt: null };
        if (query.status)
            where.status = query.status;
        if (query.search) {
            const searchOR = [
                { orderNumber: { contains: query.search } },
                { customerName: { contains: query.search } },
                { customerPhone: { contains: query.search } },
            ];
            if (scopeWhere.OR) {
                where.AND = [{ OR: scopeWhere.OR }, { OR: searchOR }];
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
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { confirmedAt: 'desc' },
                include: {
                    lines: { include: { sku: true } },
                    shipments: true,
                    invoices: {
                        where: { isVoided: false },
                        include: { lines: true },
                    },
                    payments: {
                        include: { recordedBy: { select: { id: true, name: true, employeeCode: true } } },
                        orderBy: { createdAt: 'desc' },
                    },
                    contact: true,
                    createdBy: { select: { id: true, name: true, employeeCode: true } },
                },
            }),
            this.prisma.order.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const scope = this.scopingService.getOrderScope(user);
        const order = await this.prisma.order.findFirst({
            where: { id, tenantId, ...scope },
            include: {
                lines: { include: { sku: { include: { preferredSupplier: true } } } },
                shipments: true,
                invoices: {
                    include: { lines: true, createdBy: { select: { id: true, name: true, employeeCode: true } } },
                },
                payments: {
                    include: { recordedBy: { select: { id: true, name: true, employeeCode: true } } },
                    orderBy: { createdAt: 'desc' },
                },
                quotation: { include: { lines: true } },
                contact: true,
                createdBy: { select: { id: true, name: true, employeeCode: true } },
            },
        });
        if (!order || order.deletedAt)
            throw new common_1.NotFoundException('Order not found');
        const scopeWhere = this.scopingService.getOrderScope(user);
        if (scopeWhere.createdById && order.createdById !== user.id) {
            throw new common_1.NotFoundException('Order not found');
        }
        return order;
    }
    async recordPayment(orderId, dto, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const order = await this.findOne(orderId, user);
        const amount = Number(dto.amount);
        if (isNaN(amount) || amount <= 0) {
            throw new common_1.BadRequestException('Valid payment amount is required');
        }
        const activeInvoice = await this.prisma.invoice.findFirst({
            where: { orderId: order.id, tenantId, isVoided: false },
            orderBy: { createdAt: 'desc' },
        });
        const paymentRecord = await this.prisma.paymentRecord.create({
            data: {
                orderId: order.id,
                invoiceId: activeInvoice?.id || undefined,
                amount,
                paymentType: dto.paymentType || 'advance',
                paymentMethod: dto.paymentMethod || 'NEFT',
                transactionRef: dto.transactionRef?.trim(),
                paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
                notes: dto.notes,
                recordedById: user.id,
            },
        });
        const allPayments = await this.prisma.paymentRecord.findMany({
            where: { orderId: order.id },
        });
        const totalPaid = allPayments.reduce((acc, p) => acc + p.amount, 0);
        let paymentStatus = 'pending';
        if (totalPaid >= order.totalAmount - 0.5) {
            paymentStatus = 'paid';
        }
        else if (totalPaid > 0) {
            paymentStatus = 'partial';
        }
        const balanceAmount = Math.max(0, Number((order.totalAmount - totalPaid).toFixed(2)));
        await this.prisma.order.updateMany({
            where: { id: order.id, tenantId },
            data: {
                paidAmount: totalPaid,
                balanceAmount,
                paymentStatus,
                paymentRef: dto.transactionRef?.trim() || order.paymentRef,
            },
        });
        const updatedOrder = await this.findOne(order.id, user);
        if (activeInvoice) {
            const invBalanceDue = Math.max(0, Number((activeInvoice.totalAmount - totalPaid).toFixed(2)));
            await this.prisma.invoice.updateMany({
                where: { id: activeInvoice.id, tenantId },
                data: {
                    paymentStatus: paymentStatus === 'paid' ? 'paid' : (totalPaid > 0 ? 'partial' : 'unpaid'),
                    balanceDue: invBalanceDue,
                    advanceAdjusted: totalPaid,
                    transactionRef: dto.transactionRef?.trim() || activeInvoice.transactionRef,
                },
            });
        }
        await this.auditService.log({
            actorId: user.id,
            actorName: user.employeeCode,
            action: 'UPDATE',
            entityName: 'Order',
            entityId: order.id,
            afterState: { paymentId: paymentRecord.id, amount, totalPaid, balanceAmount, paymentStatus },
        });
        return updatedOrder;
    }
    async updateOrder(id, dto, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const order = await this.findOne(id, user);
        let subtotal = order.subtotal;
        let taxAmount = order.taxAmount;
        let totalAmount = order.totalAmount;
        if (dto.lines && dto.lines.length > 0) {
            const resolvedLines = [];
            for (const line of dto.lines) {
                const sku = await this.resolveSkuForLine(line, user);
                resolvedLines.push({
                    skuId: sku.id,
                    quantity: line.quantity,
                    unitPrice: line.unitPrice,
                });
            }
            subtotal = resolvedLines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
            taxAmount = subtotal * 0.18;
            totalAmount = subtotal + taxAmount;
            for (const oldLine of order.lines) {
                const stockItem = await this.prisma.stockItem.findFirst({
                    where: { skuId: oldLine.skuId },
                });
                if (stockItem) {
                    await this.prisma.stockItem.update({
                        where: { id: stockItem.id },
                        data: { quantityReserved: { decrement: oldLine.quantity } },
                    });
                }
            }
            for (const newLine of resolvedLines) {
                const stockItem = await this.prisma.stockItem.findFirst({
                    where: { skuId: newLine.skuId },
                    orderBy: { quantityOnHand: 'desc' },
                });
                if (stockItem) {
                    await this.prisma.stockItem.update({
                        where: { id: stockItem.id },
                        data: { quantityReserved: { increment: newLine.quantity } },
                    });
                }
            }
            await this.prisma.orderLine.deleteMany({ where: { orderId: id } });
            await this.prisma.orderLine.createMany({
                data: resolvedLines.map((l) => ({
                    orderId: id,
                    skuId: l.skuId,
                    quantity: l.quantity,
                    unitPrice: l.unitPrice,
                    totalPrice: l.quantity * l.unitPrice,
                })),
            });
        }
        await this.prisma.order.updateMany({
            where: { id, tenantId },
            data: {
                customerName: dto.customerName ?? order.customerName,
                customerPhone: dto.customerPhone ?? order.customerPhone,
                customerEmail: dto.customerEmail !== undefined ? dto.customerEmail : order.customerEmail,
                shippingAddress: dto.shippingAddress !== undefined ? dto.shippingAddress : order.shippingAddress,
                notes: dto.notes !== undefined ? dto.notes : order.notes,
                paymentStatus: dto.paymentStatus ?? order.paymentStatus,
                subtotal,
                taxAmount,
                totalAmount,
            },
        });
        const updated = await this.findOne(id, user);
        await this.auditService.log({
            actorId: user.id,
            actorName: user.employeeCode,
            action: 'UPDATE',
            entityName: 'Order',
            entityId: id,
            afterState: { customerName: updated.customerName, totalAmount: updated.totalAmount },
        });
        return updated;
    }
    async updateStatus(id, dto, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const order = await this.findOne(id, user);
        const oldStatus = order.status;
        await this.prisma.order.updateMany({
            where: { id, tenantId },
            data: { status: dto.status },
        });
        const updated = await this.findOne(id, user);
        await this.prisma.statusHistory.create({
            data: {
                entityType: 'order',
                entityId: id,
                fromStatus: oldStatus,
                toStatus: dto.status,
                changedById: user.id,
                note: dto.note,
            },
        });
        await this.auditService.log({
            actorId: user.id,
            actorName: user.employeeCode,
            action: 'STATUS_CHANGE',
            entityName: 'Order',
            entityId: id,
            beforeState: { status: oldStatus },
            afterState: { status: dto.status },
        });
        return updated;
    }
    async createShipment(dto, user) {
        const order = await this.findOne(dto.orderId, user);
        const count = await this.prisma.shipment.count();
        const shipmentNumber = `JNC-SHIP-${String(count + 1).padStart(5, '0')}`;
        const shipment = await this.prisma.shipment.create({
            data: {
                shipmentNumber,
                orderId: dto.orderId,
                courierName: dto.courierName,
                trackingNumber: dto.trackingNumber,
                trackingUrl: dto.trackingUrl,
                notes: dto.notes,
                status: 'dispatched',
                dispatchedAt: new Date(),
            },
        });
        await this.updateStatus(dto.orderId, { status: 'dispatched', note: `Dispatched via ${dto.courierName} (${dto.trackingNumber})` }, user);
        for (const line of order.lines) {
            const stockItem = await this.prisma.stockItem.findFirst({
                where: { skuId: line.skuId },
                orderBy: { quantityOnHand: 'desc' },
            });
            if (stockItem) {
                await this.prisma.stockItem.update({
                    where: { id: stockItem.id },
                    data: {
                        quantityOnHand: { decrement: line.quantity },
                        quantityReserved: { decrement: line.quantity },
                    },
                });
            }
        }
        if (order.customerEmail) {
            const branding = await this.notificationsService.getBranding();
            await this.notificationsService.sendEmail({
                to: order.customerEmail,
                subject: `Your Order ${order.orderNumber} Has Been Dispatched - ${branding.companyDisplayName}`,
                html: this.buildDispatchEmailHtml(order, shipment, branding),
                relatedEntityType: 'shipment',
                relatedEntityId: shipment.id,
            });
        }
        await this.prisma.statusHistory.create({
            data: {
                entityType: 'shipment',
                entityId: shipment.id,
                toStatus: 'dispatched',
                changedById: user.id,
                note: `Shipment created by ${user.employeeCode}`,
            },
        });
        return shipment;
    }
    async updateShipmentStatus(shipmentId, status, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const shipment = await this.prisma.shipment.findFirst({
            where: { id: shipmentId, tenantId },
            include: { order: true },
        });
        if (!shipment)
            throw new common_1.NotFoundException('Shipment not found');
        const oldStatus = shipment.status;
        await this.prisma.shipment.updateMany({
            where: { id: shipmentId, tenantId },
            data: {
                status,
                deliveredAt: status === 'delivered' ? new Date() : shipment.deliveredAt,
            },
        });
        await this.prisma.statusHistory.create({
            data: {
                entityType: 'shipment',
                entityId: shipmentId,
                fromStatus: oldStatus,
                toStatus: status,
                changedById: user.id,
            },
        });
        if (status === 'delivered') {
            await this.prisma.order.updateMany({
                where: { id: shipment.orderId, tenantId },
                data: { status: 'delivered' },
            });
            if (shipment.order.customerEmail) {
                const branding = await this.notificationsService.getBranding();
                await this.notificationsService.sendEmail({
                    to: shipment.order.customerEmail,
                    subject: `Your Order ${shipment.order.orderNumber} Has Been Delivered - ${branding.companyDisplayName}`,
                    html: this.buildDeliveryEmailHtml(shipment.order, branding),
                    relatedEntityType: 'order',
                    relatedEntityId: shipment.orderId,
                });
            }
        }
        const updated = await this.prisma.shipment.findFirst({
            where: { id: shipmentId, tenantId },
            include: { order: true },
        });
        return updated;
    }
    async listShipments(user, query) {
        const scopeWhere = this.scopingService.getOrderScope(user);
        const where = {
            order: {
                ...scopeWhere,
                deletedAt: null,
            },
        };
        if (query.status)
            where.status = query.status;
        if (query.search) {
            where.OR = [
                { shipmentNumber: { contains: query.search } },
                { courierName: { contains: query.search } },
                { trackingNumber: { contains: query.search } },
                { order: { customerName: { contains: query.search } } },
                { order: { orderNumber: { contains: query.search } } },
            ];
        }
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.prisma.shipment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { dispatchedAt: 'desc' },
                include: {
                    order: {
                        include: {
                            lines: { include: { sku: true } },
                            invoices: true,
                            createdBy: { select: { id: true, name: true, employeeCode: true } },
                        },
                    },
                },
            }),
            this.prisma.shipment.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    buildDispatchEmailHtml(order, shipment, branding) {
        const companyName = branding?.companyDisplayName || brand_1.BRAND_CONFIG.displayName;
        const phone = branding?.companyPhone || '';
        return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #2E5EFF; color: white; padding: 20px; text-align: center;">
          <h2 style="margin:0;">${companyName} — Order Dispatched</h2>
        </div>
        <div style="padding: 24px; background: #ffffff; color: #1e293b;">
          <p>Dear ${order.customerName},</p>
          <p>Your order <strong>${order.orderNumber}</strong> has been dispatched.</p>
          <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
            <tr><td style="padding:8px; background:#f1f5f9; border: 1px solid #e2e8f0;"><strong>Courier</strong></td><td style="padding:8px; border: 1px solid #e2e8f0;">${shipment.courierName}</td></tr>
            <tr><td style="padding:8px; background:#f1f5f9; border: 1px solid #e2e8f0;"><strong>Tracking No.</strong></td><td style="padding:8px; border: 1px solid #e2e8f0;">${shipment.trackingNumber}</td></tr>
            ${shipment.trackingUrl ? `<tr><td style="padding:8px; background:#f1f5f9; border: 1px solid #e2e8f0;"><strong>Track Here</strong></td><td style="padding:8px; border: 1px solid #e2e8f0;"><a href="${shipment.trackingUrl}">Click to Track Shipment</a></td></tr>` : ''}
          </table>
          <p>For queries, please contact us${phone ? ` at <strong>${phone}</strong>` : ''}. Our team will be happy to assist you.</p>
          <p>Thank you for your business!</p>
          <p style="margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
            <strong>${companyName}</strong>${phone ? ` • Support: ${phone}` : ''}
          </p>
        </div>
      </div>
    `;
    }
    buildDeliveryEmailHtml(order, branding) {
        const companyName = branding?.companyDisplayName || brand_1.BRAND_CONFIG.displayName;
        const phone = branding?.companyPhone || '';
        return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #00B8A9; color: white; padding: 20px; text-align: center;">
          <h2 style="margin:0;">${companyName} — Order Delivered</h2>
        </div>
        <div style="padding: 24px; background: #ffffff; color: #1e293b;">
          <p>Dear ${order.customerName},</p>
          <p>Your order <strong>${order.orderNumber}</strong> has been successfully delivered. Thank you!</p>
          <p>We hope you are satisfied with your purchase. For any feedback or assistance, please reach out to us${phone ? ` at <strong>${phone}</strong>` : ''}.</p>
          <p style="margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
            <strong>${companyName}</strong>${phone ? ` • Support: ${phone}` : ''}
          </p>
        </div>
      </div>
    `;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        scoping_service_1.ScopingService,
        notifications_service_1.NotificationsService,
        audit_service_1.AuditService])
], OrdersService);
