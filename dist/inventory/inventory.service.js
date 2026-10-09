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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const backup_service_1 = require("../backup/backup.service");
const scoping_service_1 = require("../auth/scoping.service");
const audit_service_1 = require("../audit/audit.service");
const tenant_util_1 = require("../common/tenant.util");
const path = require("path");
const fs = require("fs");
let InventoryService = class InventoryService {
    constructor(prisma, scopingService, auditService, backupService) {
        this.prisma = prisma;
        this.scopingService = scopingService;
        this.auditService = auditService;
        this.backupService = backupService;
        this.lastClearAllTimestampPerTenant = new Map();
    }
    async getStockLevels(user, query) {
        this.scopingService.getInventoryScope(user);
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 200;
        const skip = (page - 1) * limit;
        const canSeeCostPrice = user.role === 'platform_super_admin' || user.role === 'tenant_admin' || user.role === 'admin';
        const skuWhere = { deletedAt: null, tenantId };
        if (query.search) {
            skuWhere.AND = [
                {
                    OR: [
                        { skuCode: { contains: query.search } },
                        { name: { contains: query.search } },
                        { category: { contains: query.search } },
                    ],
                },
            ];
        }
        const skus = await this.prisma.sku.findMany({
            where: skuWhere,
            skip,
            take: limit,
            include: {
                preferredSupplier: {
                    select: { id: true, name: true, phone: true, leadTimeDays: true },
                },
                stockItems: {
                    where: query.warehouseId ? { warehouseId: query.warehouseId } : undefined,
                    include: {
                        warehouse: { select: { id: true, name: true, code: true } },
                        bin: true,
                    },
                },
            },
            orderBy: { skuCode: 'asc' },
        });
        const result = skus.map((sku) => {
            const totalOnHand = sku.stockItems.reduce((s, si) => s + si.quantityOnHand, 0);
            const totalReserved = sku.stockItems.reduce((s, si) => s + si.quantityReserved, 0);
            const totalAvailable = totalOnHand - totalReserved;
            const isLowStock = totalOnHand <= sku.reorderPoint;
            const stockPercent = sku.reorderPoint > 0
                ? Math.min(100, Math.round((totalOnHand / (sku.reorderPoint * 2)) * 100))
                : 100;
            const item = {
                ...sku,
                totalOnHand,
                totalReserved,
                totalAvailable,
                isLowStock,
                stockPercent,
            };
            if (!canSeeCostPrice) {
                delete item.costPrice;
            }
            return item;
        });
        if (query.lowStock) {
            return result.filter((s) => s.isLowStock);
        }
        return result;
    }
    async recordMovement(data, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const sku = await this.prisma.sku.findFirst({
            where: { id: data.skuId, tenantId },
        });
        if (!sku) {
            throw new common_1.NotFoundException(`SKU "${data.skuId}" not found in your organization`);
        }
        const movement = await this.prisma.stockMovement.create({
            data: {
                ...data,
                quantity: Number(data.quantity),
                performedById: user.id,
            },
            include: { sku: true },
        });
        if (data.type === 'inward') {
            const existing = await this.prisma.stockItem.findFirst({
                where: {
                    skuId: data.skuId,
                    warehouseId: data.destWarehouseId,
                },
            });
            if (existing) {
                await this.prisma.stockItem.update({
                    where: { id: existing.id },
                    data: { quantityOnHand: { increment: data.quantity } },
                });
            }
            else if (data.destWarehouseId) {
                await this.prisma.stockItem.create({
                    data: {
                        skuId: data.skuId,
                        warehouseId: data.destWarehouseId,
                        quantityOnHand: data.quantity,
                        quantityReserved: 0,
                        batchNo: data.batchNo,
                    },
                });
            }
        }
        else if (data.type === 'adjustment') {
            const existing = await this.prisma.stockItem.findFirst({
                where: { skuId: data.skuId },
            });
            if (existing) {
                await this.prisma.stockItem.update({
                    where: { id: existing.id },
                    data: { quantityOnHand: { increment: data.quantity } },
                });
            }
        }
        return movement;
    }
    async getReorderAlerts(user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const skus = await this.prisma.sku.findMany({
            where: { deletedAt: null, tenantId },
            include: {
                preferredSupplier: true,
                stockItems: true,
            },
        });
        const alerts = skus
            .map((sku) => {
            const totalOnHand = sku.stockItems.reduce((s, si) => s + si.quantityOnHand, 0);
            return { sku, totalOnHand, isLowStock: totalOnHand <= sku.reorderPoint };
        })
            .filter((s) => s.isLowStock);
        return alerts;
    }
    async getWarehouses(user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const where = { deletedAt: null, tenantId };
        const scope = this.scopingService.getInventoryScope(user);
        if (scope.warehouseId) {
            where.id = scope.warehouseId;
        }
        return this.prisma.warehouse.findMany({
            where,
            include: {
                bins: true,
                _count: {
                    select: { stockItems: true },
                },
            },
        });
    }
    async createWarehouse(data, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        return this.prisma.warehouse.create({
            data: {
                ...data,
                tenantId,
            },
        });
    }
    async getSkus(user, search) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const canSeeCostPrice = user.role === 'platform_super_admin' || user.role === 'tenant_admin' || user.role === 'admin';
        const skus = await this.prisma.sku.findMany({
            where: {
                deletedAt: null,
                tenantId,
                ...(search ? {
                    OR: [
                        { skuCode: { contains: search } },
                        { name: { contains: search } },
                        { category: { contains: search } },
                    ],
                } : {}),
            },
            include: {
                preferredSupplier: { select: { id: true, name: true } },
            },
            orderBy: { skuCode: 'asc' },
        });
        if (!canSeeCostPrice) {
            return skus.map(({ costPrice, ...rest }) => rest);
        }
        return skus;
    }
    async getSkuById(id, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const canSeeCostPrice = user.role === 'platform_super_admin' || user.role === 'tenant_admin' || user.role === 'admin';
        const sku = await this.prisma.sku.findFirst({
            where: { id, tenantId },
            include: {
                preferredSupplier: true,
                stockItems: {
                    include: { warehouse: true, bin: true },
                },
                stockMovements: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                    include: {
                        performedBy: { select: { id: true, name: true, employeeCode: true } },
                        sourceWarehouse: true,
                        destWarehouse: true,
                    },
                },
                orderLines: {
                    orderBy: { order: { confirmedAt: 'desc' } },
                    take: 50,
                    include: {
                        order: {
                            select: {
                                id: true,
                                orderNumber: true,
                                customerName: true,
                                customerPhone: true,
                                status: true,
                                paymentStatus: true,
                                confirmedAt: true,
                            },
                        },
                    },
                },
            },
        });
        if (!sku) {
            throw new common_1.NotFoundException('SKU not found');
        }
        const totalOnHand = sku.stockItems.reduce((sum, s) => sum + s.quantityOnHand, 0);
        const totalReserved = sku.stockItems.reduce((sum, s) => sum + s.quantityReserved, 0);
        const totalAvailable = Math.max(0, totalOnHand - totalReserved);
        const totalUsedInOrders = sku.orderLines.reduce((sum, ol) => sum + ol.quantity, 0);
        const totalInwardMovements = sku.stockMovements
            .filter((m) => m.type === 'inward')
            .reduce((sum, m) => sum + m.quantity, 0);
        const totalOutwardMovements = sku.stockMovements
            .filter((m) => m.type === 'outward')
            .reduce((sum, m) => sum + m.quantity, 0);
        const activeOrders = sku.orderLines.filter((ol) => ol.order?.status === 'confirmed' || ol.order?.status === 'processing');
        const data = {
            ...sku,
            totalOnHand,
            totalReserved,
            totalAvailable,
            usageStats: {
                totalUsedInOrders,
                totalInwardMovements,
                totalOutwardMovements,
                activeOrdersCount: activeOrders.length,
                activeReservedUnits: activeOrders.reduce((sum, ol) => sum + ol.quantity, 0),
            },
        };
        if (!canSeeCostPrice) {
            delete data.costPrice;
        }
        return data;
    }
    async createSku(data, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const sku = await this.prisma.sku.create({
            data: {
                tenantId,
                skuCode: data.skuCode.trim(),
                name: data.name.trim(),
                category: data.category || 'General',
                hsnCode: data.hsnCode?.trim() || undefined,
                packageType: data.packageType || 'Unit',
                unitPrice: Number(data.unitPrice) || 0,
                costPrice: Number(data.costPrice) || 0,
                taxRate: Number(data.taxRate) || 18.0,
                reorderPoint: Number(data.reorderPoint) || 10,
                reorderQty: Number(data.reorderQty) || 50,
                preferredSupplierId: data.preferredSupplierId || undefined,
            },
        });
        let warehouse = data.warehouseId
            ? await this.prisma.warehouse.findFirst({ where: { id: data.warehouseId, tenantId } })
            : await this.prisma.warehouse.findFirst({ where: { tenantId } });
        if (!warehouse) {
            warehouse = await this.prisma.warehouse.create({
                data: {
                    tenantId,
                    code: 'MAIN-01',
                    name: 'Main Warehouse',
                    city: 'Headquarters',
                },
            });
        }
        const initialQty = Number(data.initialStock) || 0;
        if (warehouse && initialQty > 0) {
            await this.prisma.stockItem.create({
                data: {
                    skuId: sku.id,
                    warehouseId: warehouse.id,
                    quantityOnHand: initialQty,
                    quantityReserved: 0,
                },
            });
            await this.prisma.stockMovement.create({
                data: {
                    skuId: sku.id,
                    type: 'inward',
                    quantity: initialQty,
                    destWarehouseId: warehouse.id,
                    reasonCode: 'manual_sku_creation',
                    performedById: user.id,
                },
            });
        }
        return sku;
    }
    async updateSku(id, data, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const { quantityOnHand, reasonCode, supplierId: inputSupplierId, supplierName, ...skuData } = data;
        const existingSku = await this.prisma.sku.findFirst({ where: { id, tenantId } });
        if (!existingSku) {
            throw new common_1.NotFoundException('SKU not found');
        }
        await this.prisma.sku.updateMany({
            where: { id, tenantId },
            data: {
                ...skuData,
                unitPrice: skuData.unitPrice !== undefined ? Number(skuData.unitPrice) : undefined,
                costPrice: skuData.costPrice !== undefined ? Number(skuData.costPrice) : undefined,
                taxRate: skuData.taxRate !== undefined ? Number(skuData.taxRate) : undefined,
                reorderPoint: skuData.reorderPoint !== undefined ? Number(skuData.reorderPoint) : undefined,
                reorderQty: skuData.reorderQty !== undefined ? Number(skuData.reorderQty) : undefined,
            },
        });
        const updated = await this.prisma.sku.findFirst({ where: { id, tenantId } });
        if (quantityOnHand !== undefined) {
            let stockItem = await this.prisma.stockItem.findFirst({ where: { skuId: id } });
            if (!stockItem) {
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
                    stockItem = await this.prisma.stockItem.create({
                        data: {
                            skuId: id,
                            warehouseId: defaultWarehouse.id,
                            quantityOnHand: 0,
                            quantityReserved: 0,
                        },
                    });
                }
            }
            if (stockItem) {
                const newQty = Number(quantityOnHand);
                const delta = newQty - stockItem.quantityOnHand;
                if (delta !== 0) {
                    let resolvedSupplierId = inputSupplierId || updated.preferredSupplierId || undefined;
                    if (!resolvedSupplierId && supplierName) {
                        let sup = await this.prisma.supplier.findFirst({
                            where: { name: { equals: supplierName.trim() }, tenantId },
                        });
                        if (!sup) {
                            sup = await this.prisma.supplier.create({
                                data: { tenantId, name: supplierName.trim(), leadTimeDays: 7, isActive: true },
                            });
                        }
                        resolvedSupplierId = sup.id;
                    }
                    if (reasonCode === 'purchase_inward' && delta > 0 && !resolvedSupplierId) {
                        throw new common_1.BadRequestException('Supplier is required when recording a New Stock Inward / Purchase movement.');
                    }
                    await this.prisma.stockMovement.create({
                        data: {
                            skuId: id,
                            type: delta > 0 ? 'inward' : 'outward',
                            quantity: Math.abs(delta),
                            supplierId: delta > 0 ? resolvedSupplierId : undefined,
                            destWarehouseId: delta > 0 ? stockItem.warehouseId : undefined,
                            sourceWarehouseId: delta < 0 ? stockItem.warehouseId : undefined,
                            reasonCode: reasonCode || (delta > 0 ? 'purchase_inward' : 'manual_inventory_adjustment'),
                            performedById: user.id,
                        },
                    });
                    await this.prisma.stockItem.update({
                        where: { id: stockItem.id },
                        data: { quantityOnHand: newQty },
                    });
                }
            }
        }
        return updated;
    }
    async deleteSku(id, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        return this.prisma.sku.updateMany({
            where: { id, tenantId },
            data: { deletedAt: new Date() },
        });
    }
    async bulkDeleteSkus(ids, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const result = await this.prisma.sku.updateMany({
            where: { id: { in: ids }, tenantId },
            data: { deletedAt: new Date() },
        });
        return { deletedCount: result.count };
    }
    async importSpreadsheet(records, user, defaultWarehouseCode = 'MAIN-01') {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const results = {
            totalRows: records.length,
            importedCount: 0,
            updatedCount: 0,
            errors: [],
            skusCreated: [],
        };
        let defaultWarehouse = await this.prisma.warehouse.findFirst({
            where: { code: defaultWarehouseCode, tenantId },
        });
        if (!defaultWarehouse) {
            defaultWarehouse = await this.prisma.warehouse.findFirst({ where: { tenantId } }) || await this.prisma.warehouse.create({
                data: {
                    tenantId,
                    code: defaultWarehouseCode,
                    name: 'Main Warehouse',
                    city: 'Headquarters',
                },
            });
        }
        const hasParsedExtra = records.some((r) => r && r.__parsed_extra && Array.isArray(r.__parsed_extra));
        if (hasParsedExtra) {
            const reconstructed = [];
            const rawRows = records.map((r) => {
                const firstVal = Object.values(r).find((v) => !Array.isArray(v));
                const extra = Array.isArray(r.__parsed_extra) ? r.__parsed_extra : [];
                return [firstVal, ...extra];
            });
            let headerIdx = -1;
            const keywords = ['sku', 'item', 'code', 'part', 'component', 'description', 'specs', 'project', 'unit', 'price', 'rate', 'quantity', 'qty', 'stock', 'reference'];
            for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
                const rowStr = rawRows[i].map((c) => String(c || '').toLowerCase().trim()).join(' ');
                let matches = 0;
                for (const kw of keywords) {
                    if (rowStr.includes(kw))
                        matches++;
                }
                if (matches >= 2) {
                    headerIdx = i;
                    break;
                }
            }
            if (headerIdx !== -1) {
                const headers = rawRows[headerIdx].map((h) => String(h || '').trim());
                for (let r = headerIdx + 1; r < rawRows.length; r++) {
                    const row = rawRows[r];
                    if (!Array.isArray(row) || row.every((c) => !c))
                        continue;
                    const obj = {};
                    for (let c = 0; c < headers.length; c++) {
                        if (headers[c])
                            obj[headers[c]] = row[c];
                    }
                    reconstructed.push(obj);
                }
                records = reconstructed;
            }
        }
        records = records.map((row) => {
            const normalizedRow = {};
            for (const key in row) {
                if (Object.prototype.hasOwnProperty.call(row, key)) {
                    const cleanKey = key
                        .replace(/^\uFEFF/, '')
                        .trim()
                        .toLowerCase()
                        .replace(/[\s_\-\/—–]+/g, '');
                    normalizedRow[cleanKey] = row[key];
                }
            }
            return normalizedRow;
        });
        results.totalRows = records.length;
        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            try {
                let skuCode = (row.skucode ||
                    row.sku ||
                    row.itemcode ||
                    row.componentitemcodesku ||
                    row.partnumber ||
                    row['SKU Code'] ||
                    row['skuCode'] ||
                    '')
                    .toString()
                    .trim();
                let name = (row.name ||
                    row.productname ||
                    row.description ||
                    row.itemname ||
                    row.partvalue ||
                    row.equipmentname ||
                    row.specs ||
                    row.partspecs ||
                    row.partname ||
                    '')
                    .toString()
                    .trim();
                if (!skuCode || !name) {
                    const vals = Object.values(row)
                        .map((v) => String(v || '').trim())
                        .filter(Boolean);
                    if (vals.length >= 4) {
                        const possibleSku = vals.find((v) => /^[A-Z0-9]{2,10}-[A-Z0-9\-]{2,20}$/i.test(v));
                        if (possibleSku) {
                            skuCode = skuCode || possibleSku;
                            name = name || vals.find((v) => v !== possibleSku && v.length > 3) || skuCode;
                        }
                    }
                }
                if (!skuCode || !name) {
                    results.errors.push(`Row ${i + 1}: SKU Code and Name are required. (Keys: ${Object.keys(row).join(', ')})`);
                    continue;
                }
                const category = (row.category || row.type || 'General').toString().trim();
                const hsnCode = (row.hsncode || row.hsn || '').toString().trim() || undefined;
                const packageType = (row.packagetype || row.package || row.unit || 'Unit').toString().trim();
                const unitPrice = parseFloat(row.unitprice || row.price || row.sellingprice || 0) || 0;
                const costPrice = parseFloat(row.costprice || row.cost || 0) || (unitPrice * 0.75);
                const taxRate = parseFloat(row.taxrate || row.gst || row.gstrate || 18) || 18.0;
                const reorderPoint = parseInt(row.reorderpoint || row.minstock || 10, 10) || 10;
                const reorderQty = parseInt(row.reorderqty || row.reorderquantity || 50, 10) || 50;
                const quantityOnHand = parseInt(row.quantityonhand || row.quantity || row.qty || row.stock || row.onhand || 0, 10) || 0;
                const supplierName = (row.suppliername || row.supplier || '').toString().trim();
                const binCode = (row.bincode || row.bin || row.location || '').toString().trim();
                const batchNo = (row.batchno || row.batch || row.lot || `BATCH-${new Date().getFullYear()}-IMP`).toString().trim();
                let preferredSupplierId = null;
                if (supplierName) {
                    let sup = await this.prisma.supplier.findFirst({
                        where: { name: { equals: supplierName }, tenantId },
                    });
                    if (!sup) {
                        sup = await this.prisma.supplier.create({
                            data: {
                                tenantId,
                                name: supplierName,
                                leadTimeDays: 7,
                                isActive: true,
                            },
                        });
                    }
                    preferredSupplierId = sup.id;
                }
                let binId = null;
                if (binCode) {
                    let bin = await this.prisma.locationBin.findFirst({
                        where: { warehouseId: defaultWarehouse.id, binCode },
                    });
                    if (!bin) {
                        bin = await this.prisma.locationBin.create({
                            data: {
                                warehouseId: defaultWarehouse.id,
                                binCode,
                                zone: binCode.split('-')[0] || 'A',
                                rack: binCode.split('-')[1] || '01',
                                shelf: binCode.split('-')[2] || '01',
                            },
                        });
                    }
                    binId = bin.id;
                }
                const existingSku = await this.prisma.sku.findFirst({
                    where: { skuCode, tenantId },
                });
                let skuId;
                if (existingSku) {
                    await this.prisma.sku.updateMany({
                        where: { id: existingSku.id, tenantId },
                        data: {
                            name,
                            category,
                            hsnCode: hsnCode || existingSku.hsnCode,
                            packageType,
                            unitPrice: unitPrice > 0 ? unitPrice : existingSku.unitPrice,
                            costPrice: costPrice > 0 ? costPrice : existingSku.costPrice,
                            taxRate: taxRate > 0 ? taxRate : existingSku.taxRate,
                            reorderPoint: reorderPoint > 0 ? reorderPoint : existingSku.reorderPoint,
                            reorderQty: reorderQty > 0 ? reorderQty : existingSku.reorderQty,
                            preferredSupplierId: preferredSupplierId || existingSku.preferredSupplierId,
                            deletedAt: null,
                        },
                    });
                    skuId = existingSku.id;
                    results.updatedCount++;
                }
                else {
                    const newSku = await this.prisma.sku.create({
                        data: {
                            tenantId,
                            skuCode,
                            name,
                            category,
                            hsnCode,
                            packageType,
                            unitPrice,
                            costPrice,
                            taxRate,
                            reorderPoint,
                            reorderQty,
                            preferredSupplierId,
                        },
                    });
                    skuId = newSku.id;
                    results.importedCount++;
                    results.skusCreated.push(skuCode);
                }
                const existingStock = await this.prisma.stockItem.findFirst({
                    where: { skuId, warehouseId: defaultWarehouse.id },
                });
                if (existingStock) {
                    if (quantityOnHand > 0) {
                        await this.prisma.stockItem.update({
                            where: { id: existingStock.id },
                            data: {
                                quantityOnHand: quantityOnHand,
                                binId: binId || existingStock.binId,
                                batchNo: batchNo || existingStock.batchNo,
                            },
                        });
                    }
                }
                else {
                    await this.prisma.stockItem.create({
                        data: {
                            skuId,
                            warehouseId: defaultWarehouse.id,
                            binId,
                            quantityOnHand,
                            quantityReserved: 0,
                            batchNo,
                        },
                    });
                }
                if (quantityOnHand > 0) {
                    await this.prisma.stockMovement.create({
                        data: {
                            skuId,
                            type: 'inward',
                            quantity: quantityOnHand,
                            destWarehouseId: defaultWarehouse.id,
                            supplierId: preferredSupplierId,
                            batchNo,
                            reasonCode: 'spreadsheet_bulk_import',
                            performedById: user.id,
                        },
                    });
                }
            }
            catch (err) {
                results.errors.push(`Row ${i + 1}: ${err.message}`);
            }
        }
        return results;
    }
    async initiateTransfer(data, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        if (user.role === 'employee') {
            throw new common_1.ForbiddenException('Employees are not authorized to initiate stock transfers.');
        }
        const quantity = Number(data.quantity);
        if (!quantity || quantity <= 0) {
            throw new common_1.BadRequestException('Transfer quantity must be greater than 0.');
        }
        if (data.sourceWarehouseId === data.destinationWarehouseId) {
            throw new common_1.BadRequestException('Source and Destination warehouses must be different.');
        }
        if (user.role === 'sub_admin' && user.warehouseId && user.warehouseId !== data.sourceWarehouseId) {
            throw new common_1.ForbiddenException('Sub-Admins are only permitted to transfer stock out of their assigned warehouse.');
        }
        const sku = await this.prisma.sku.findFirst({ where: { id: data.skuId, tenantId } });
        if (!sku || sku.deletedAt) {
            throw new common_1.NotFoundException('SKU not found or has been deleted.');
        }
        const sourceWh = await this.prisma.warehouse.findFirst({ where: { id: data.sourceWarehouseId, tenantId } });
        const destWh = await this.prisma.warehouse.findFirst({ where: { id: data.destinationWarehouseId, tenantId } });
        if (!sourceWh || !destWh) {
            throw new common_1.NotFoundException('One or both specified warehouses do not exist.');
        }
        const sourceItem = await this.prisma.stockItem.findFirst({
            where: { skuId: data.skuId, warehouseId: data.sourceWarehouseId },
        });
        const availableOnHand = sourceItem ? sourceItem.quantityOnHand - sourceItem.quantityReserved : 0;
        if (availableOnHand < quantity) {
            throw new common_1.BadRequestException(`Insufficient available stock at ${sourceWh.name} for SKU ${sku.skuCode}: available ${availableOnHand}, requested ${quantity}.`);
        }
        const totalTransfers = await this.prisma.stockTransfer.count({ where: { tenantId } });
        const transferNumber = `TRF-${String(totalTransfers + 1).padStart(5, '0')}`;
        const transfer = await this.prisma.stockTransfer.create({
            data: {
                tenantId,
                transferNumber,
                skuId: data.skuId,
                sourceWarehouseId: data.sourceWarehouseId,
                destinationWarehouseId: data.destinationWarehouseId,
                quantity,
                status: 'in_transit',
                notes: data.notes?.trim() || null,
                initiatedById: user.id,
                initiatedAt: new Date(),
            },
            include: {
                sku: true,
                sourceWarehouse: true,
                destinationWarehouse: true,
                initiatedBy: { select: { id: true, name: true, employeeCode: true } },
            },
        });
        await this.prisma.stockItem.update({
            where: { id: sourceItem.id },
            data: { quantityOnHand: sourceItem.quantityOnHand - quantity },
        });
        await this.prisma.stockMovement.create({
            data: {
                skuId: data.skuId,
                type: 'transfer_out',
                quantity,
                sourceWarehouseId: data.sourceWarehouseId,
                destWarehouseId: data.destinationWarehouseId,
                reasonCode: 'warehouse_stock_transfer_out',
                referenceType: 'transfer',
                referenceId: transfer.id,
                performedById: user.id,
            },
        });
        await this.auditService.log({
            actorId: user.id,
            actorName: user.employeeCode,
            action: 'CREATE',
            entityName: 'StockTransfer',
            entityId: transfer.id,
            afterState: { transferNumber, status: 'in_transit', quantity, skuCode: sku.skuCode },
        });
        return transfer;
    }
    async getTransfers(user, query) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const page = Number(query?.page) || 1;
        const limit = Number(query?.limit) || 50;
        const skip = (page - 1) * limit;
        const where = { tenantId };
        if (user.role === 'sub_admin' && user.warehouseId) {
            where.OR = [
                { sourceWarehouseId: user.warehouseId },
                { destinationWarehouseId: user.warehouseId },
            ];
        }
        else if (query?.warehouseId) {
            where.OR = [
                { sourceWarehouseId: query.warehouseId },
                { destinationWarehouseId: query.warehouseId },
            ];
        }
        if (query?.status) {
            where.status = query.status;
        }
        if (query?.search) {
            where.OR = [
                { transferNumber: { contains: query.search } },
                { sku: { skuCode: { contains: query.search } } },
                { sku: { name: { contains: query.search } } },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.stockTransfer.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    sku: true,
                    sourceWarehouse: true,
                    destinationWarehouse: true,
                    initiatedBy: { select: { id: true, name: true, employeeCode: true } },
                    receivedBy: { select: { id: true, name: true, employeeCode: true } },
                },
            }),
            this.prisma.stockTransfer.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async receiveTransfer(id, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        if (user.role === 'employee') {
            throw new common_1.ForbiddenException('Employees are not authorized to receive stock transfers.');
        }
        const transfer = await this.prisma.stockTransfer.findFirst({
            where: { id, tenantId },
            include: { sku: true, sourceWarehouse: true, destinationWarehouse: true },
        });
        if (!transfer) {
            throw new common_1.NotFoundException(`Stock transfer with ID ${id} not found.`);
        }
        if (transfer.status !== 'in_transit') {
            throw new common_1.BadRequestException(`Cannot receive transfer ${transfer.transferNumber}: Status is already "${transfer.status}".`);
        }
        if (user.role === 'sub_admin' && user.warehouseId && user.warehouseId !== transfer.destinationWarehouseId) {
            throw new common_1.ForbiddenException('Sub-Admins can only receive transfers designated for their assigned warehouse.');
        }
        let destItem = await this.prisma.stockItem.findFirst({
            where: { skuId: transfer.skuId, warehouseId: transfer.destinationWarehouseId },
        });
        if (!destItem) {
            destItem = await this.prisma.stockItem.create({
                data: {
                    skuId: transfer.skuId,
                    warehouseId: transfer.destinationWarehouseId,
                    quantityOnHand: transfer.quantity,
                    quantityReserved: 0,
                },
            });
        }
        else {
            await this.prisma.stockItem.update({
                where: { id: destItem.id },
                data: { quantityOnHand: destItem.quantityOnHand + transfer.quantity },
            });
        }
        await this.prisma.stockMovement.create({
            data: {
                skuId: transfer.skuId,
                type: 'transfer_in',
                quantity: transfer.quantity,
                sourceWarehouseId: transfer.sourceWarehouseId,
                destWarehouseId: transfer.destinationWarehouseId,
                reasonCode: 'warehouse_stock_transfer_in',
                referenceType: 'transfer',
                referenceId: transfer.id,
                performedById: user.id,
            },
        });
        await this.prisma.stockTransfer.updateMany({
            where: { id, tenantId },
            data: {
                status: 'completed',
                receivedById: user.id,
                receivedAt: new Date(),
            },
        });
        const updated = await this.prisma.stockTransfer.findFirst({
            where: { id, tenantId },
            include: {
                sku: true,
                sourceWarehouse: true,
                destinationWarehouse: true,
                initiatedBy: { select: { id: true, name: true, employeeCode: true } },
                receivedBy: { select: { id: true, name: true, employeeCode: true } },
            },
        });
        await this.auditService.log({
            actorId: user.id,
            actorName: user.employeeCode,
            action: 'STATUS_CHANGE',
            entityName: 'StockTransfer',
            entityId: transfer.id,
            beforeState: { status: 'in_transit' },
            afterState: { status: 'completed' },
        });
        return updated;
    }
    async cancelTransfer(id, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        if (user.role === 'employee') {
            throw new common_1.ForbiddenException('Employees are not authorized to cancel stock transfers.');
        }
        const transfer = await this.prisma.stockTransfer.findFirst({
            where: { id, tenantId },
            include: { sku: true, sourceWarehouse: true, destinationWarehouse: true },
        });
        if (!transfer) {
            throw new common_1.NotFoundException(`Stock transfer with ID ${id} not found.`);
        }
        if (transfer.status !== 'in_transit') {
            throw new common_1.BadRequestException(`Cannot cancel transfer ${transfer.transferNumber}: Status is already "${transfer.status}".`);
        }
        if (user.role === 'sub_admin' && user.warehouseId && user.warehouseId !== transfer.sourceWarehouseId) {
            throw new common_1.ForbiddenException('Sub-Admins can only cancel transfers originating from their assigned warehouse.');
        }
        let sourceItem = await this.prisma.stockItem.findFirst({
            where: { skuId: transfer.skuId, warehouseId: transfer.sourceWarehouseId },
        });
        if (sourceItem) {
            await this.prisma.stockItem.update({
                where: { id: sourceItem.id },
                data: { quantityOnHand: sourceItem.quantityOnHand + transfer.quantity },
            });
        }
        else {
            await this.prisma.stockItem.create({
                data: {
                    skuId: transfer.skuId,
                    warehouseId: transfer.sourceWarehouseId,
                    quantityOnHand: transfer.quantity,
                    quantityReserved: 0,
                },
            });
        }
        await this.prisma.stockMovement.create({
            data: {
                skuId: transfer.skuId,
                type: 'transfer_cancel',
                quantity: transfer.quantity,
                sourceWarehouseId: transfer.sourceWarehouseId,
                destWarehouseId: transfer.destinationWarehouseId,
                reasonCode: 'warehouse_stock_transfer_cancelled',
                referenceType: 'transfer',
                referenceId: transfer.id,
                performedById: user.id,
            },
        });
        await this.prisma.stockTransfer.updateMany({
            where: { id, tenantId },
            data: {
                status: 'cancelled',
                cancelledAt: new Date(),
            },
        });
        const updated = await this.prisma.stockTransfer.findFirst({
            where: { id, tenantId },
            include: {
                sku: true,
                sourceWarehouse: true,
                destinationWarehouse: true,
                initiatedBy: { select: { id: true, name: true, employeeCode: true } },
            },
        });
        await this.auditService.log({
            actorId: user.id,
            actorName: user.employeeCode,
            action: 'STATUS_CHANGE',
            entityName: 'StockTransfer',
            entityId: transfer.id,
            beforeState: { status: 'in_transit' },
            afterState: { status: 'cancelled' },
        });
        return updated;
    }
    async getInTransitSummary(user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const where = { status: 'in_transit', tenantId };
        if (user.role === 'sub_admin' && user.warehouseId) {
            where.OR = [
                { sourceWarehouseId: user.warehouseId },
                { destinationWarehouseId: user.warehouseId },
            ];
        }
        const inTransitTransfers = await this.prisma.stockTransfer.findMany({
            where,
        });
        const totalInTransitQty = inTransitTransfers.reduce((sum, t) => sum + t.quantity, 0);
        const inTransitCount = inTransitTransfers.length;
        return {
            totalInTransitQuantity: totalInTransitQty,
            inTransitTransfersCount: inTransitCount,
        };
    }
    async getMovements(user, query) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const page = Number(query?.page) || 1;
        const limit = Number(query?.limit) || 50;
        const skip = (page - 1) * limit;
        const where = {
            sku: { tenantId },
        };
        if (user.role === 'sub_admin' && user.warehouseId) {
            where.OR = [
                { sourceWarehouseId: user.warehouseId },
                { destWarehouseId: user.warehouseId },
            ];
        }
        else if (query?.warehouseId) {
            where.OR = [
                { sourceWarehouseId: query.warehouseId },
                { destWarehouseId: query.warehouseId },
            ];
        }
        if (query?.skuId) {
            where.skuId = query.skuId;
        }
        if (query?.type) {
            where.type = query.type;
        }
        const [items, total] = await Promise.all([
            this.prisma.stockMovement.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    sku: true,
                    supplier: true,
                    sourceWarehouse: true,
                    destWarehouse: true,
                    performedBy: { select: { id: true, name: true, employeeCode: true } },
                },
            }),
            this.prisma.stockMovement.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    computeProjectStockFields(data) {
        const quantity = Number(data.quantity) || 1;
        const bomQtyPerUnit = Number(data.bomQtyPerUnit) || 1;
        const batchQty = Number(data.batchQty) || 1;
        const plannedRequirement = data.plannedRequirement !== undefined && data.plannedRequirement !== null && !isNaN(Number(data.plannedRequirement))
            ? Number(data.plannedRequirement)
            : bomQtyPerUnit * batchQty;
        const openingStock = Number(data.openingStock) || 0;
        const inflow = Number(data.inflow) || 0;
        const outflow = Number(data.outflow) || 0;
        const presentStock = data.presentStock !== undefined && data.presentStock !== null && !isNaN(Number(data.presentStock))
            ? Number(data.presentStock)
            : openingStock + inflow - outflow;
        const shortage = Math.max(0, plannedRequirement - presentStock);
        let status = data.status;
        if (!status || status === 'Auto' || status === 'Automatic' || status === 'Sufficient') {
            if (shortage <= 0 && presentStock >= plannedRequirement * 1.5) {
                status = 'Surplus';
            }
            else if (shortage <= 0) {
                status = 'Sufficient';
            }
            else if (shortage > 0 && presentStock > 0) {
                status = 'Shortage';
            }
            else {
                status = 'Critical Shortage';
            }
        }
        return {
            project: String(data.project || 'General Project').trim(),
            reference: String(data.reference || '-').trim(),
            quantity,
            itemCode: String(data.itemCode || data.skuCode || '').trim(),
            partValue: data.partValue ? String(data.partValue).trim() : null,
            package: data.package || data.packageType ? String(data.package || data.packageType).trim() : null,
            unit: String(data.unit || 'Nos').trim(),
            bomQtyPerUnit,
            batchQty,
            plannedRequirement,
            openingStock,
            inflow,
            outflow,
            presentStock,
            shortage,
            status,
            notes: data.notes ? String(data.notes).trim() : null,
        };
    }
    async getProjectStockPositions(user, query) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const where = { deletedAt: null, tenantId };
        if (query?.project && query.project !== 'all') {
            where.project = query.project;
        }
        if (query?.status && query.status !== 'all') {
            where.status = query.status;
        }
        if (query?.shortageOnly) {
            where.shortage = { gt: 0 };
        }
        if (query?.search) {
            const q = query.search.trim();
            where.AND = [
                {
                    OR: [
                        { project: { contains: q } },
                        { reference: { contains: q } },
                        { itemCode: { contains: q } },
                        { partValue: { contains: q } },
                        { package: { contains: q } },
                        { notes: { contains: q } },
                    ],
                },
            ];
        }
        const items = await this.prisma.projectStockPosition.findMany({
            where,
            orderBy: [{ project: 'asc' }, { itemCode: 'asc' }],
        });
        const projectsList = await this.prisma.projectStockPosition.findMany({
            where: { deletedAt: null, tenantId },
            select: { project: true },
            distinct: ['project'],
            orderBy: { project: 'asc' },
        });
        return {
            items,
            total: items.length,
            projects: projectsList.map((p) => p.project),
        };
    }
    async getProjectStockSummary(user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const items = await this.prisma.projectStockPosition.findMany({
            where: { deletedAt: null, tenantId },
        });
        const totalPositions = items.length;
        const uniqueProjects = new Set(items.map((i) => i.project)).size;
        const totalPlannedRequirement = items.reduce((sum, i) => sum + i.plannedRequirement, 0);
        const totalPresentStock = items.reduce((sum, i) => sum + i.presentStock, 0);
        const totalShortageQty = items.reduce((sum, i) => sum + i.shortage, 0);
        const shortageItemsCount = items.filter((i) => i.shortage > 0).length;
        const criticalItemsCount = items.filter((i) => i.status === 'Critical Shortage' || (i.shortage > 0 && i.presentStock === 0)).length;
        const sufficientCount = items.filter((i) => i.shortage === 0).length;
        const totalSuppliers = await this.prisma.supplier.count({ where: { deletedAt: null, isActive: true, tenantId } });
        return {
            totalPositions,
            uniqueProjects,
            totalPlannedRequirement,
            totalPresentStock,
            totalShortageQty,
            shortageItemsCount,
            criticalItemsCount,
            sufficientCount,
            totalSuppliers,
        };
    }
    async getProducts(user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        return this.prisma.product.findMany({
            where: { deletedAt: null, tenantId },
            include: {
                skus: {
                    where: { deletedAt: null, tenantId },
                    select: { id: true, skuCode: true, name: true, category: true },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    async seedFinishedProducts(user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const products = [
            { name: 'Control Panel', category: 'Controllers', description: 'Central control station and main logic controller' },
            { name: 'Power Amplifier', category: 'Audio Systems', description: 'Commercial amplifier units for distributed audio' },
            { name: 'Intercom Station', category: 'Intercom', description: 'Two-way duplex voice communications station' },
            { name: 'Speaker Unit', category: 'Audio Systems', description: 'Flush mount and horn speakers' },
            { name: 'Zone Module', category: 'Controllers', description: 'Addressable loop and zone distribution interface' },
            { name: 'Sensors & Alarms', category: 'Safety Systems', description: 'Optical smoke, heat, and panic alarm devices' },
            { name: 'IP PBX Gateway', category: 'Telephony', description: 'SIP telephony and hybrid VoIP gateway' },
            { name: 'Access Terminal', category: 'Access Control', description: 'Biometric and RFID security terminal' },
            { name: 'Network Switch', category: 'Networking', description: 'Managed Gigabit PoE+ Network Switch' },
        ];
        const results = [];
        for (const p of products) {
            const existing = await this.prisma.product.findFirst({ where: { name: p.name, deletedAt: null, tenantId } });
            if (existing) {
                results.push({ ...existing, action: 'skipped' });
            }
            else {
                const created = await this.prisma.product.create({ data: { ...p, tenantId } });
                results.push({ ...created, action: 'created' });
            }
        }
        return { success: true, products: results };
    }
    async getInventoryDashboard(user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const [totalSuppliers, totalProducts, skusRaw] = await Promise.all([
            this.prisma.supplier.count({ where: { deletedAt: null, isActive: true, tenantId } }),
            this.prisma.product.count({ where: { deletedAt: null, tenantId } }),
            this.prisma.sku.findMany({
                where: { deletedAt: null, tenantId },
                include: {
                    stockItems: true,
                    preferredSupplier: { select: { id: true, name: true, phone: true } },
                },
            }),
        ]);
        const belowReorderPoint = skusRaw
            .map((sku) => {
            const totalOnHand = sku.stockItems.reduce((s, si) => s + si.quantityOnHand, 0);
            return { sku, totalOnHand, isLowStock: totalOnHand <= sku.reorderPoint };
        })
            .filter((s) => s.isLowStock)
            .map(({ sku, totalOnHand }) => ({
            id: sku.id,
            skuCode: sku.skuCode,
            name: sku.name,
            category: sku.category,
            totalOnHand,
            reorderPoint: sku.reorderPoint,
            reorderQty: sku.reorderQty,
            preferredSupplier: sku.preferredSupplier,
            preferredSupplierId: sku.preferredSupplierId,
        }));
        return {
            totalSuppliers,
            totalProducts,
            belowReorderPointCount: belowReorderPoint.length,
            belowReorderPoint,
        };
    }
    async recordSupplierPurchase(supplierId, dto, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const supplier = await this.prisma.supplier.findFirst({ where: { id: supplierId, tenantId } });
        if (!supplier)
            throw new common_1.NotFoundException(`Supplier ${supplierId} not found`);
        let defaultWarehouse = await this.prisma.warehouse.findFirst({ where: { deletedAt: null, tenantId }, orderBy: { createdAt: 'asc' } });
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
        let overallSubtotal = 0;
        let overallGst = 0;
        const createdMovements = [];
        for (const item of dto.items) {
            const sku = await this.prisma.sku.findFirst({ where: { id: item.skuId, tenantId } });
            if (!sku)
                continue;
            const qty = Math.round(Number(item.quantity));
            const rate = Number(item.unitRate);
            const subtotal = rate * qty;
            const taxRate = Number(dto.taxRate) || 0;
            const gstAmt = Math.round(((subtotal * taxRate) / 100) * 100) / 100;
            overallSubtotal += subtotal;
            overallGst += gstAmt;
            const movement = await this.prisma.stockMovement.create({
                data: {
                    skuId: sku.id,
                    type: 'inward',
                    quantity: qty,
                    supplierId,
                    destWarehouseId: defaultWarehouse?.id,
                    referenceType: 'purchase',
                    referenceId: dto.invoiceNumber || `SUP-PO-${Date.now()}`,
                    reasonCode: `Supplier Purchase (Invoice: ${dto.invoiceNumber || 'N/A'}, GSTIN: ${dto.supplierGstin || supplier.gstin || 'N/A'})`,
                    documentUrl: dto.documentUrl,
                    performedById: user.id,
                },
            });
            createdMovements.push(movement);
            if (defaultWarehouse) {
                const stockItem = await this.prisma.stockItem.findFirst({ where: { skuId: sku.id, warehouseId: defaultWarehouse.id } });
                if (stockItem) {
                    await this.prisma.stockItem.update({ where: { id: stockItem.id }, data: { quantityOnHand: { increment: qty } } });
                }
                else {
                    await this.prisma.stockItem.create({
                        data: { skuId: sku.id, warehouseId: defaultWarehouse.id, quantityOnHand: qty, quantityReserved: 0 },
                    });
                }
            }
        }
        const grandTotal = overallSubtotal + overallGst;
        return {
            success: true,
            supplierId,
            invoiceNumber: dto.invoiceNumber,
            subtotal: overallSubtotal,
            gstAmount: overallGst,
            grandTotal,
            taxRate: dto.taxRate,
            taxType: dto.taxType,
            documentUrl: dto.documentUrl,
            movementsCreated: createdMovements.length,
        };
    }
    async getSupplierPurchases(supplierId, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const movements = await this.prisma.stockMovement.findMany({
            where: {
                supplierId,
                type: 'inward',
                sku: { tenantId },
            },
            include: {
                sku: { select: { id: true, skuCode: true, name: true, category: true } },
                performedBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return movements;
    }
    async createProjectStockPosition(data, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        if (!data.project || !data.project.trim()) {
            throw new common_1.BadRequestException('Project name is required');
        }
        if (!data.itemCode || !data.itemCode.trim()) {
            throw new common_1.BadRequestException('Item Code is required');
        }
        const formatted = this.computeProjectStockFields(data);
        return this.prisma.projectStockPosition.create({
            data: {
                ...formatted,
                tenantId,
            },
        });
    }
    async updateProjectStockPosition(id, data, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const existing = await this.prisma.projectStockPosition.findFirst({
            where: { id, tenantId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Project stock position "${id}" not found`);
        }
        const merged = { ...existing, ...data, id: existing.id, tenantId };
        const formatted = this.computeProjectStockFields(merged);
        await this.prisma.projectStockPosition.updateMany({
            where: { id, tenantId },
            data: formatted,
        });
        return this.prisma.projectStockPosition.findFirst({
            where: { id, tenantId },
        });
    }
    async deleteProjectStockPosition(id, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const existing = await this.prisma.projectStockPosition.findFirst({
            where: { id, tenantId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Project stock position "${id}" not found`);
        }
        return this.prisma.projectStockPosition.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async bulkImportProjectStockPositions(rows, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        if (!Array.isArray(rows) || rows.length === 0) {
            throw new common_1.BadRequestException('Rows array cannot be empty');
        }
        const created = [];
        for (const r of rows) {
            if (!r.project && !r.itemCode)
                continue;
            const formatted = this.computeProjectStockFields(r);
            const row = await this.prisma.projectStockPosition.create({
                data: {
                    ...formatted,
                    tenantId,
                },
            });
            created.push(row);
        }
        return {
            success: true,
            importedCount: created.length,
        };
    }
    async recordProjectStockPurchase(positionId, dto, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const position = await this.prisma.projectStockPosition.findFirst({
            where: { id: positionId, tenantId },
        });
        if (!position)
            throw new common_1.NotFoundException('Project stock position not found');
        const qty = Number(dto.quantityPurchased) || 0;
        const rate = Number(dto.unitRate) || 0;
        const taxRate = Number(dto.taxRate) || 18;
        const subtotal = Number((qty * rate).toFixed(2));
        const gstAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
        const grandTotal = Number((subtotal + gstAmount).toFixed(2));
        const newInflow = position.inflow + qty;
        const newPresentStock = position.openingStock + newInflow - position.outflow;
        const newShortage = Math.max(0, position.plannedRequirement - newPresentStock);
        let newStatus = 'Sufficient';
        if (newShortage > 0 && newPresentStock === 0) {
            newStatus = 'Critical Shortage';
        }
        else if (newShortage > 0) {
            newStatus = 'Shortage';
        }
        else if (newPresentStock >= position.plannedRequirement * 1.5) {
            newStatus = 'Surplus';
        }
        const purchaseNote = `Purchased ${qty} ${position.unit} from ${dto.supplierName || 'Supplier'} (GST: ${taxRate}%, Inv: ${dto.invoiceNumber || 'N/A'}, Total: ₹${grandTotal.toLocaleString('en-IN')})`;
        const updatedPosition = await this.prisma.projectStockPosition.update({
            where: { id: positionId },
            data: {
                inflow: newInflow,
                presentStock: newPresentStock,
                shortage: newShortage,
                status: newStatus,
                notes: position.notes ? `${position.notes} | ${purchaseNote}` : purchaseNote,
            },
        });
        const sku = await this.prisma.sku.findFirst({
            where: {
                tenantId,
                OR: [
                    { skuCode: position.itemCode },
                    { name: position.itemCode },
                    { name: position.partValue || '' },
                ],
            },
        });
        let defaultWarehouse = await this.prisma.warehouse.findFirst({
            where: { deletedAt: null, tenantId },
            orderBy: { createdAt: 'asc' },
        });
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
        if (sku && defaultWarehouse) {
            await this.prisma.stockMovement.create({
                data: {
                    skuId: sku.id,
                    type: 'inward',
                    quantity: qty,
                    destWarehouseId: defaultWarehouse.id,
                    referenceType: 'purchase',
                    referenceId: dto.invoiceNumber || `PO-${position.project}-${Date.now()}`,
                    reasonCode: `Project Purchase (${dto.supplierName || 'Supplier'} GSTIN: ${dto.supplierGstin || 'N/A'})`,
                    performedById: user.id,
                },
            });
            const stockItem = await this.prisma.stockItem.findFirst({
                where: { skuId: sku.id, warehouseId: defaultWarehouse.id },
            });
            if (stockItem) {
                await this.prisma.stockItem.update({
                    where: { id: stockItem.id },
                    data: { quantityOnHand: { increment: qty } },
                });
            }
            else {
                await this.prisma.stockItem.create({
                    data: {
                        skuId: sku.id,
                        warehouseId: defaultWarehouse.id,
                        quantityOnHand: qty,
                        quantityReserved: 0,
                    },
                });
            }
        }
        return {
            success: true,
            position: updatedPosition,
            purchaseSummary: {
                quantityPurchased: qty,
                unitRate: rate,
                taxRate,
                subtotal,
                gstAmount,
                grandTotal,
                supplierName: dto.supplierName,
                supplierGstin: dto.supplierGstin,
                invoiceNumber: dto.invoiceNumber,
                invoiceDate: dto.invoiceDate,
                documentAttached: !!dto.documentDataUrl,
            },
        };
    }
    async clearAllInventory(confirmMessage, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, code: true },
        });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant organization not found.');
        const expectedConfirm = `DELETE ALL INVENTORY OF ${tenant.code.toUpperCase()}`;
        if (!confirmMessage || confirmMessage.trim() !== expectedConfirm) {
            throw new common_1.BadRequestException(`Confirmation message invalid. Body must equal: {"confirm": "${expectedConfirm}"}`);
        }
        const latestAuditLog = await this.prisma.auditLog.findFirst({
            where: { tenantId, action: 'INVENTORY_CLEAR_ALL' },
            orderBy: { timestamp: 'desc' },
        });
        if (latestAuditLog && latestAuditLog.timestamp) {
            const lastClearedTime = new Date(latestAuditLog.timestamp).getTime();
            const elapsedMs = Date.now() - lastClearedTime;
            if (elapsedMs < 3600000) {
                const remainingMins = Math.ceil((3600000 - elapsedMs) / 60000);
                throw new common_1.HttpException(`Clear all inventory rate limited. Maximum 1 call per hour per company. Try again in ${remainingMins} minutes.`, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
        }
        await this.backupService.createBackup(user);
        await this.prisma.projectStockPosition.deleteMany({ where: { tenantId } });
        await this.prisma.stockTransfer.deleteMany({ where: { tenantId } });
        const tenantSkus = await this.prisma.sku.findMany({
            where: { tenantId },
            select: { id: true },
        });
        const tenantSkuIds = tenantSkus.map((s) => s.id);
        if (tenantSkuIds.length > 0) {
            await this.prisma.stockMovement.deleteMany({
                where: { skuId: { in: tenantSkuIds } },
            });
            await this.prisma.stockItem.deleteMany({
                where: { skuId: { in: tenantSkuIds } },
            });
        }
        const orderLines = await this.prisma.orderLine.findMany({ select: { skuId: true } });
        const invoiceLines = await this.prisma.invoiceLine.findMany({ select: { skuId: true } });
        const quoteLines = await this.prisma.quotationLine.findMany({ select: { skuId: true } });
        const referencedSkuIds = new Set([
            ...orderLines.map((l) => l.skuId),
            ...invoiceLines.map((l) => l.skuId).filter(Boolean),
            ...quoteLines.map((l) => l.skuId).filter(Boolean),
        ]);
        await this.prisma.sku.deleteMany({
            where: {
                tenantId,
                id: { notIn: Array.from(referencedSkuIds) },
            },
        });
        await this.prisma.sku.updateMany({
            where: {
                tenantId,
                id: { in: Array.from(referencedSkuIds) },
            },
            data: {
                deletedAt: new Date(),
            },
        });
        await this.prisma.auditLog.create({
            data: {
                tenantId,
                actorId: user.id,
                actorName: user?.name || user.employeeCode || 'Administrator',
                action: 'INVENTORY_CLEAR_ALL',
                entityName: 'Inventory',
                entityId: tenantId,
                afterState: JSON.stringify({ confirmMessage, clearedAt: new Date().toISOString() }),
            },
        }).catch(() => { });
        return {
            success: true,
            message: `All inventory data for company ${tenant.code} cleared fresh.`,
        };
    }
    getPurchaseBillsFilePath() {
        const dir = path.resolve(process.cwd(), 'data');
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
        return path.join(dir, 'purchase_bills.json');
    }
    readStoredPurchaseBills() {
        try {
            const filePath = this.getPurchaseBillsFilePath();
            if (!fs.existsSync(filePath))
                return [];
            const content = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(content || '[]');
        }
        catch {
            return [];
        }
    }
    writeStoredPurchaseBills(bills) {
        const filePath = this.getPurchaseBillsFilePath();
        fs.writeFileSync(filePath, JSON.stringify(bills, null, 2), 'utf-8');
    }
    async getPurchaseBills(user, params) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const bills = this.readStoredPurchaseBills();
        let result = bills.filter((b) => !b.tenantId || b.tenantId === tenantId);
        if (params?.search) {
            const q = params.search.toLowerCase();
            result = result.filter((b) => (b.invoiceNumber && b.invoiceNumber.toLowerCase().includes(q)) ||
                (b.vendorName && b.vendorName.toLowerCase().includes(q)) ||
                (b.project && b.project.toLowerCase().includes(q)));
        }
        return { data: result, total: result.length };
    }
    async getPurchaseBill(id, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const bills = this.readStoredPurchaseBills();
        const bill = bills.find((b) => b.id === id && (!b.tenantId || b.tenantId === tenantId));
        if (!bill)
            throw new common_1.NotFoundException(`Purchase bill ${id} not found`);
        return bill;
    }
    async createPurchaseBill(data, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const bills = this.readStoredPurchaseBills();
        const id = `BILL-${Date.now()}-${Math.round(Math.random() * 1000)}`;
        const newBill = {
            id,
            tenantId,
            invoiceNumber: data.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
            vendorName: data.vendorName || 'Supplier / Vendor',
            vendorGstin: data.vendorGstin || '',
            vendorAddress: data.vendorAddress || '',
            invoiceDate: data.invoiceDate || new Date().toISOString().slice(0, 10),
            project: data.project || 'General Inventory',
            items: Array.isArray(data.items) ? data.items : [],
            subtotal: Number(data.subtotal || 0),
            taxRate: Number(data.taxRate || 18),
            cgst: Number(data.cgst || 0),
            sgst: Number(data.sgst || 0),
            igst: Number(data.igst || 0),
            totalTax: Number(data.totalTax || 0),
            grandTotal: Number(data.grandTotal || 0),
            documentUrl: data.documentUrl || null,
            rawText: data.rawText || '',
            notes: data.notes || '',
            createdById: user?.id,
            createdByName: user?.name || user?.employeeCode || 'Administrator',
            createdAt: new Date().toISOString(),
            softCopyData: data.softCopyData || null,
        };
        bills.unshift(newBill);
        this.writeStoredPurchaseBills(bills);
        if (Array.isArray(data.items) && data.items.length > 0) {
            for (const item of data.items) {
                if (item.skuCode || item.name) {
                    try {
                        const existingPos = await this.prisma.projectStockPosition.findFirst({
                            where: {
                                tenantId,
                                OR: [
                                    { itemCode: item.skuCode },
                                    { partValue: item.name },
                                ],
                            },
                        });
                        if (existingPos) {
                            await this.prisma.projectStockPosition.updateMany({
                                where: { id: existingPos.id, tenantId },
                                data: {
                                    inflow: { increment: Number(item.quantity || 0) },
                                    presentStock: { increment: Number(item.quantity || 0) },
                                    notes: newBill.documentUrl ? `Invoice: ${newBill.invoiceNumber} | BillDoc: ${newBill.documentUrl}` : existingPos.notes,
                                },
                            });
                        }
                    }
                    catch (e) {
                    }
                }
            }
        }
        return newBill;
    }
    async deletePurchaseBill(id, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        let bills = this.readStoredPurchaseBills();
        const bill = bills.find((b) => b.id === id && (!b.tenantId || b.tenantId === tenantId));
        if (!bill)
            throw new common_1.NotFoundException(`Purchase bill ${id} not found`);
        bills = bills.filter((b) => b.id !== id);
        this.writeStoredPurchaseBills(bills);
        return { success: true, message: `Bill ${bill.invoiceNumber} deleted` };
    }
    async scanBillOcr(body) {
        const text = body.rawText || '';
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        let detectedVendor = '';
        let detectedGstin = '';
        let detectedInvoiceNo = '';
        let detectedDate = new Date().toISOString().slice(0, 10);
        const detectedItems = [];
        const gstinMatch = text.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}\b/i);
        if (gstinMatch)
            detectedGstin = gstinMatch[0].toUpperCase();
        const invMatch = text.match(/(?:inv(?:oice)?|bill|tax\s*invoice)[\s\w]*[:#№\s-]*([A-Z0-9\/-]{3,20})/i);
        if (invMatch && invMatch[1])
            detectedInvoiceNo = invMatch[1].trim();
        const dateMatch = text.match(/(\d{1,2}[-\/.]\d{1,2}[-\/.](?:\d{4}|\d{2}))/);
        if (dateMatch) {
            detectedDate = dateMatch[1];
        }
        for (let i = 0; i < Math.min(lines.length, 5); i++) {
            const l = lines[i];
            if (l.length > 3 &&
                !l.toLowerCase().includes('tax invoice') &&
                !l.toLowerCase().includes('cash memo') &&
                !l.toLowerCase().includes('gstin') &&
                !l.toLowerCase().includes('bill to')) {
                detectedVendor = l;
                break;
            }
        }
        if (!detectedVendor)
            detectedVendor = 'Supplier / Vendor';
        for (const line of lines) {
            const numMatches = line.match(/\d+(?:\.\d+)?/g);
            if (numMatches && numMatches.length >= 2) {
                const parts = line.split(/\s{2,}|\t/).filter(Boolean);
                const nameCandidate = parts[0] || line.replace(/[\d,.]+/g, '').trim();
                if (nameCandidate.length > 2 &&
                    !nameCandidate.toLowerCase().includes('total') &&
                    !nameCandidate.toLowerCase().includes('tax') &&
                    !nameCandidate.toLowerCase().includes('subtotal') &&
                    !nameCandidate.toLowerCase().includes('invoice') &&
                    !nameCandidate.toLowerCase().includes('gst')) {
                    const qty = parseFloat(numMatches[0]) || 1;
                    const rate = parseFloat(numMatches[numMatches.length - 1]) || 5;
                    const skuCode = 'ITM-' + nameCandidate.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20);
                    detectedItems.push({
                        name: nameCandidate,
                        skuCode,
                        quantity: qty,
                        unit: 'Nos',
                        unitPrice: rate,
                        total: qty * rate,
                    });
                }
            }
        }
        const subtotal = detectedItems.reduce((s, it) => s + it.total, 0) || 0;
        const taxRate = 18;
        const totalTax = (subtotal * taxRate) / 100;
        const grandTotal = subtotal + totalTax;
        return {
            vendorName: detectedVendor,
            vendorGstin: detectedGstin || '',
            invoiceNumber: detectedInvoiceNo || `INV-${Date.now().toString().slice(-6)}`,
            invoiceDate: detectedDate,
            items: detectedItems,
            subtotal,
            taxRate,
            cgst: totalTax / 2,
            sgst: totalTax / 2,
            igst: 0,
            totalTax,
            grandTotal,
            rawText: text,
        };
    }
    async bulkEditComponents(body, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const { items, positionIds, skuIds, updates, rowUpdates } = body;
        let updatedCount = 0;
        if (rowUpdates && Array.isArray(rowUpdates) && rowUpdates.length > 0) {
            const positionUpdates = rowUpdates.filter((r) => r.positionId);
            const skuUpdates = rowUpdates.filter((r) => r.skuId);
            await this.prisma.$transaction(async (tx) => {
                for (const r of positionUpdates) {
                    const updateData = {};
                    if (r.project !== undefined)
                        updateData.project = r.project;
                    if (r.packageType !== undefined)
                        updateData.package = r.packageType;
                    if (r.unit !== undefined)
                        updateData.unit = r.unit;
                    if (r.supplier !== undefined)
                        updateData.notes = `Supplier: ${r.supplier}`;
                    if (r.plannedRequirement !== undefined)
                        updateData.plannedRequirement = Number(r.plannedRequirement);
                    if (r.presentStock !== undefined)
                        updateData.presentStock = Number(r.presentStock);
                    if (Object.keys(updateData).length > 0) {
                        await tx.projectStockPosition.updateMany({
                            where: { id: r.positionId, tenantId },
                            data: updateData,
                        });
                        updatedCount++;
                    }
                }
                for (const r of skuUpdates) {
                    const updateData = {};
                    if (r.unitPrice !== undefined) {
                        updateData.unitPrice = Number(r.unitPrice);
                        updateData.costPrice = Number(r.unitPrice);
                    }
                    if (r.taxRate !== undefined)
                        updateData.taxRate = Number(r.taxRate);
                    if (r.packageType !== undefined)
                        updateData.packageType = r.packageType;
                    if (r.unit !== undefined)
                        updateData.packageType = r.unit;
                    if (Object.keys(updateData).length > 0) {
                        await tx.sku.updateMany({
                            where: { id: r.skuId, tenantId },
                            data: updateData,
                        });
                    }
                }
            });
            return {
                success: true,
                updatedCount: rowUpdates.length,
                message: `Successfully updated ${rowUpdates.length} components.`,
            };
        }
        if (updates && Object.keys(updates).length > 0) {
            const targetPosIds = [];
            const targetSkuIds = [];
            if (Array.isArray(positionIds)) {
                targetPosIds.push(...positionIds);
            }
            if (Array.isArray(skuIds)) {
                targetSkuIds.push(...skuIds);
            }
            if (Array.isArray(items)) {
                items.forEach((it) => {
                    if (it.positionId)
                        targetPosIds.push(it.positionId);
                    if (it.skuId)
                        targetSkuIds.push(it.skuId);
                });
            }
            const uniquePosIds = Array.from(new Set(targetPosIds));
            const uniqueSkuIds = Array.from(new Set(targetSkuIds));
            const posUpdateData = {};
            if (updates.project !== undefined && updates.project.trim()) {
                posUpdateData.project = updates.project.trim();
            }
            if (updates.packageType !== undefined) {
                posUpdateData.package = updates.packageType;
            }
            if (updates.unit !== undefined) {
                posUpdateData.unit = updates.unit;
            }
            if (updates.supplierName !== undefined && updates.supplierName.trim()) {
                posUpdateData.notes = `Supplier: ${updates.supplierName.trim()}`;
            }
            if (updates.plannedRequirement !== undefined && !isNaN(Number(updates.plannedRequirement))) {
                posUpdateData.plannedRequirement = Number(updates.plannedRequirement);
            }
            if (updates.presentStock !== undefined && !isNaN(Number(updates.presentStock))) {
                posUpdateData.presentStock = Number(updates.presentStock);
            }
            const skuUpdateData = {};
            if (updates.unitPrice !== undefined && !isNaN(Number(updates.unitPrice))) {
                skuUpdateData.unitPrice = Number(updates.unitPrice);
                skuUpdateData.costPrice = Number(updates.unitPrice);
            }
            if (updates.taxRate !== undefined && !isNaN(Number(updates.taxRate))) {
                skuUpdateData.taxRate = Number(updates.taxRate);
            }
            if (updates.packageType !== undefined) {
                skuUpdateData.packageType = updates.packageType;
            }
            if (updates.unit !== undefined) {
                skuUpdateData.packageType = updates.unit;
            }
            await this.prisma.$transaction(async (tx) => {
                if (uniquePosIds.length > 0 && Object.keys(posUpdateData).length > 0) {
                    const res = await tx.projectStockPosition.updateMany({
                        where: { id: { in: uniquePosIds }, tenantId },
                        data: posUpdateData,
                    });
                    updatedCount += res.count;
                }
                if (uniqueSkuIds.length > 0 && Object.keys(skuUpdateData).length > 0) {
                    await tx.sku.updateMany({
                        where: { id: { in: uniqueSkuIds }, tenantId },
                        data: skuUpdateData,
                    });
                }
            });
            return {
                success: true,
                updatedCount: Math.max(uniquePosIds.length, uniqueSkuIds.length),
                message: `Successfully updated ${Math.max(uniquePosIds.length, uniqueSkuIds.length)} components.`,
            };
        }
        throw new common_1.BadRequestException('No updates provided for bulk edit');
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        scoping_service_1.ScopingService,
        audit_service_1.AuditService,
        backup_service_1.BackupService])
], InventoryService);
