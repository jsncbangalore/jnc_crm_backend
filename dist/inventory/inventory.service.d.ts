import { PrismaService } from '../prisma/prisma.service';
import { BackupService } from '../backup/backup.service';
import { ScopedUser } from '../auth/scoping.service';
import { ScopingService } from '../auth/scoping.service';
import { AuditService } from '../audit/audit.service';
export declare class InventoryService {
    private prisma;
    private scopingService;
    private auditService;
    private backupService;
    private lastClearAllTimestampPerTenant;
    constructor(prisma: PrismaService, scopingService: ScopingService, auditService: AuditService, backupService: BackupService);
    getStockLevels(user: ScopedUser, query: {
        warehouseId?: string;
        search?: string;
        lowStock?: boolean;
        page?: number;
        limit?: number;
    }): Promise<any[]>;
    recordMovement(data: {
        skuId: string;
        type: string;
        quantity: number;
        supplierId?: string;
        sourceWarehouseId?: string;
        destWarehouseId?: string;
        batchNo?: string;
        reasonCode?: string;
        referenceType?: string;
        referenceId?: string;
    }, user: ScopedUser): Promise<{
        sku: {
            id: string;
            tenantId: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            taxRate: number;
            unitPrice: number;
            productId: string | null;
            skuCode: string;
            category: string;
            hsnCode: string | null;
            packageType: string | null;
            costPrice: number;
            reorderPoint: number;
            reorderQty: number;
            datasheetUrl: string | null;
            preferredSupplierId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        type: string;
        quantity: number;
        skuId: string;
        batchNo: string | null;
        reasonCode: string | null;
        referenceType: string | null;
        referenceId: string | null;
        documentUrl: string | null;
        supplierId: string | null;
        sourceWarehouseId: string | null;
        destWarehouseId: string | null;
        performedById: string | null;
    }>;
    getReorderAlerts(user?: ScopedUser): Promise<{
        sku: {
            preferredSupplier: {
                id: string;
                tenantId: string;
                name: string;
                email: string | null;
                isActive: boolean;
                createdById: string | null;
                createdAt: Date;
                updatedAt: Date;
                phone: string | null;
                address: string | null;
                city: string | null;
                gstin: string | null;
                deletedAt: Date | null;
                notes: string | null;
                contactPerson: string | null;
                leadTimeDays: number;
                rating: number | null;
            };
            stockItems: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                warehouseId: string;
                skuId: string;
                quantityOnHand: number;
                quantityReserved: number;
                batchNo: string | null;
                mfgDate: Date | null;
                expiryDate: Date | null;
                binId: string | null;
            }[];
        } & {
            id: string;
            tenantId: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            taxRate: number;
            unitPrice: number;
            productId: string | null;
            skuCode: string;
            category: string;
            hsnCode: string | null;
            packageType: string | null;
            costPrice: number;
            reorderPoint: number;
            reorderQty: number;
            datasheetUrl: string | null;
            preferredSupplierId: string | null;
        };
        totalOnHand: number;
        isLowStock: boolean;
    }[]>;
    getWarehouses(user: ScopedUser): Promise<({
        _count: {
            stockItems: number;
        };
        bins: {
            id: string;
            createdAt: Date;
            warehouseId: string;
            binCode: string;
            zone: string;
            rack: string;
            shelf: string;
        }[];
    } & {
        id: string;
        tenantId: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        address: string | null;
        city: string | null;
        deletedAt: Date | null;
    })[]>;
    createWarehouse(data: {
        name: string;
        code: string;
        address?: string;
        city?: string;
    }, user?: ScopedUser): Promise<{
        id: string;
        tenantId: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        address: string | null;
        city: string | null;
        deletedAt: Date | null;
    }>;
    getSkus(user: ScopedUser, search?: string): Promise<{
        preferredSupplier: {
            id: string;
            name: string;
        };
        id: string;
        tenantId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        taxRate: number;
        unitPrice: number;
        productId: string | null;
        skuCode: string;
        category: string;
        hsnCode: string | null;
        packageType: string | null;
        reorderPoint: number;
        reorderQty: number;
        datasheetUrl: string | null;
        preferredSupplierId: string | null;
    }[]>;
    getSkuById(id: string, user: ScopedUser): Promise<any>;
    createSku(data: {
        skuCode: string;
        name: string;
        category?: string;
        hsnCode?: string;
        packageType?: string;
        unitPrice?: number;
        costPrice?: number;
        reorderPoint?: number;
        reorderQty?: number;
        preferredSupplierId?: string;
        initialStock?: number;
        warehouseId?: string;
        binCode?: string;
    }, user: ScopedUser): Promise<{
        id: string;
        tenantId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        taxRate: number;
        unitPrice: number;
        productId: string | null;
        skuCode: string;
        category: string;
        hsnCode: string | null;
        packageType: string | null;
        costPrice: number;
        reorderPoint: number;
        reorderQty: number;
        datasheetUrl: string | null;
        preferredSupplierId: string | null;
    }>;
    updateSku(id: string, data: any, user: ScopedUser): Promise<{
        id: string;
        tenantId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        taxRate: number;
        unitPrice: number;
        productId: string | null;
        skuCode: string;
        category: string;
        hsnCode: string | null;
        packageType: string | null;
        costPrice: number;
        reorderPoint: number;
        reorderQty: number;
        datasheetUrl: string | null;
        preferredSupplierId: string | null;
    }>;
    deleteSku(id: string, user?: ScopedUser): Promise<import(".prisma/client").Prisma.BatchPayload>;
    bulkDeleteSkus(ids: string[], user?: ScopedUser): Promise<{
        deletedCount: number;
    }>;
    importSpreadsheet(records: any[], user: ScopedUser, defaultWarehouseCode?: string): Promise<{
        totalRows: number;
        importedCount: number;
        updatedCount: number;
        errors: string[];
        skusCreated: string[];
    }>;
    initiateTransfer(data: {
        skuId: string;
        sourceWarehouseId: string;
        destinationWarehouseId: string;
        quantity: number;
        notes?: string;
    }, user: ScopedUser): Promise<{
        sku: {
            id: string;
            tenantId: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            taxRate: number;
            unitPrice: number;
            productId: string | null;
            skuCode: string;
            category: string;
            hsnCode: string | null;
            packageType: string | null;
            costPrice: number;
            reorderPoint: number;
            reorderQty: number;
            datasheetUrl: string | null;
            preferredSupplierId: string | null;
        };
        sourceWarehouse: {
            id: string;
            tenantId: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            address: string | null;
            city: string | null;
            deletedAt: Date | null;
        };
        destinationWarehouse: {
            id: string;
            tenantId: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            address: string | null;
            city: string | null;
            deletedAt: Date | null;
        };
        initiatedBy: {
            id: string;
            name: string;
            employeeCode: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        quantity: number;
        notes: string | null;
        skuId: string;
        sourceWarehouseId: string;
        transferNumber: string;
        initiatedAt: Date;
        receivedAt: Date | null;
        cancelledAt: Date | null;
        destinationWarehouseId: string;
        initiatedById: string | null;
        receivedById: string | null;
    }>;
    getTransfers(user: ScopedUser, query?: {
        page?: number;
        limit?: number;
        status?: string;
        warehouseId?: string;
        search?: string;
    }): Promise<{
        items: ({
            sku: {
                id: string;
                tenantId: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                taxRate: number;
                unitPrice: number;
                productId: string | null;
                skuCode: string;
                category: string;
                hsnCode: string | null;
                packageType: string | null;
                costPrice: number;
                reorderPoint: number;
                reorderQty: number;
                datasheetUrl: string | null;
                preferredSupplierId: string | null;
            };
            sourceWarehouse: {
                id: string;
                tenantId: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                address: string | null;
                city: string | null;
                deletedAt: Date | null;
            };
            destinationWarehouse: {
                id: string;
                tenantId: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                address: string | null;
                city: string | null;
                deletedAt: Date | null;
            };
            initiatedBy: {
                id: string;
                name: string;
                employeeCode: string;
            };
            receivedBy: {
                id: string;
                name: string;
                employeeCode: string;
            };
        } & {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            quantity: number;
            notes: string | null;
            skuId: string;
            sourceWarehouseId: string;
            transferNumber: string;
            initiatedAt: Date;
            receivedAt: Date | null;
            cancelledAt: Date | null;
            destinationWarehouseId: string;
            initiatedById: string | null;
            receivedById: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    receiveTransfer(id: string, user: ScopedUser): Promise<{
        sku: {
            id: string;
            tenantId: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            taxRate: number;
            unitPrice: number;
            productId: string | null;
            skuCode: string;
            category: string;
            hsnCode: string | null;
            packageType: string | null;
            costPrice: number;
            reorderPoint: number;
            reorderQty: number;
            datasheetUrl: string | null;
            preferredSupplierId: string | null;
        };
        sourceWarehouse: {
            id: string;
            tenantId: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            address: string | null;
            city: string | null;
            deletedAt: Date | null;
        };
        destinationWarehouse: {
            id: string;
            tenantId: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            address: string | null;
            city: string | null;
            deletedAt: Date | null;
        };
        initiatedBy: {
            id: string;
            name: string;
            employeeCode: string;
        };
        receivedBy: {
            id: string;
            name: string;
            employeeCode: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        quantity: number;
        notes: string | null;
        skuId: string;
        sourceWarehouseId: string;
        transferNumber: string;
        initiatedAt: Date;
        receivedAt: Date | null;
        cancelledAt: Date | null;
        destinationWarehouseId: string;
        initiatedById: string | null;
        receivedById: string | null;
    }>;
    cancelTransfer(id: string, user: ScopedUser): Promise<{
        sku: {
            id: string;
            tenantId: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            taxRate: number;
            unitPrice: number;
            productId: string | null;
            skuCode: string;
            category: string;
            hsnCode: string | null;
            packageType: string | null;
            costPrice: number;
            reorderPoint: number;
            reorderQty: number;
            datasheetUrl: string | null;
            preferredSupplierId: string | null;
        };
        sourceWarehouse: {
            id: string;
            tenantId: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            address: string | null;
            city: string | null;
            deletedAt: Date | null;
        };
        destinationWarehouse: {
            id: string;
            tenantId: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            address: string | null;
            city: string | null;
            deletedAt: Date | null;
        };
        initiatedBy: {
            id: string;
            name: string;
            employeeCode: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        quantity: number;
        notes: string | null;
        skuId: string;
        sourceWarehouseId: string;
        transferNumber: string;
        initiatedAt: Date;
        receivedAt: Date | null;
        cancelledAt: Date | null;
        destinationWarehouseId: string;
        initiatedById: string | null;
        receivedById: string | null;
    }>;
    getInTransitSummary(user: ScopedUser): Promise<{
        totalInTransitQuantity: number;
        inTransitTransfersCount: number;
    }>;
    getMovements(user: ScopedUser, query?: {
        warehouseId?: string;
        skuId?: string;
        type?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        items: ({
            supplier: {
                id: string;
                tenantId: string;
                name: string;
                email: string | null;
                isActive: boolean;
                createdById: string | null;
                createdAt: Date;
                updatedAt: Date;
                phone: string | null;
                address: string | null;
                city: string | null;
                gstin: string | null;
                deletedAt: Date | null;
                notes: string | null;
                contactPerson: string | null;
                leadTimeDays: number;
                rating: number | null;
            };
            sku: {
                id: string;
                tenantId: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                taxRate: number;
                unitPrice: number;
                productId: string | null;
                skuCode: string;
                category: string;
                hsnCode: string | null;
                packageType: string | null;
                costPrice: number;
                reorderPoint: number;
                reorderQty: number;
                datasheetUrl: string | null;
                preferredSupplierId: string | null;
            };
            performedBy: {
                id: string;
                name: string;
                employeeCode: string;
            };
            sourceWarehouse: {
                id: string;
                tenantId: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                address: string | null;
                city: string | null;
                deletedAt: Date | null;
            };
            destWarehouse: {
                id: string;
                tenantId: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                address: string | null;
                city: string | null;
                deletedAt: Date | null;
            };
        } & {
            id: string;
            createdAt: Date;
            type: string;
            quantity: number;
            skuId: string;
            batchNo: string | null;
            reasonCode: string | null;
            referenceType: string | null;
            referenceId: string | null;
            documentUrl: string | null;
            supplierId: string | null;
            sourceWarehouseId: string | null;
            destWarehouseId: string | null;
            performedById: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    private computeProjectStockFields;
    getProjectStockPositions(user: ScopedUser, query?: {
        project?: string;
        search?: string;
        status?: string;
        shortageOnly?: boolean;
    }): Promise<{
        items: {
            project: string;
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            deletedAt: Date | null;
            quantity: number;
            notes: string | null;
            unit: string;
            reference: string;
            package: string | null;
            partValue: string | null;
            itemCode: string;
            bomQtyPerUnit: number;
            batchQty: number;
            plannedRequirement: number;
            openingStock: number;
            inflow: number;
            outflow: number;
            presentStock: number;
            shortage: number;
        }[];
        total: number;
        projects: string[];
    }>;
    getProjectStockSummary(user: ScopedUser): Promise<{
        totalPositions: number;
        uniqueProjects: number;
        totalPlannedRequirement: number;
        totalPresentStock: number;
        totalShortageQty: number;
        shortageItemsCount: number;
        criticalItemsCount: number;
        sufficientCount: number;
        totalSuppliers: number;
    }>;
    getProducts(user?: ScopedUser): Promise<({
        skus: {
            id: string;
            name: string;
            skuCode: string;
            category: string;
        }[];
    } & {
        id: string;
        tenantId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string | null;
        category: string;
    })[]>;
    seedFinishedProducts(user?: ScopedUser): Promise<{
        success: boolean;
        products: any[];
    }>;
    getInventoryDashboard(user: ScopedUser): Promise<{
        totalSuppliers: number;
        totalProducts: number;
        belowReorderPointCount: number;
        belowReorderPoint: {
            id: string;
            skuCode: string;
            name: string;
            category: string;
            totalOnHand: number;
            reorderPoint: number;
            reorderQty: number;
            preferredSupplier: {
                id: string;
                name: string;
                phone: string;
            };
            preferredSupplierId: string;
        }[];
    }>;
    recordSupplierPurchase(supplierId: string, dto: {
        invoiceNumber?: string;
        invoiceDate?: string;
        supplierGstin?: string;
        taxRate: number;
        taxType: string;
        documentUrl?: string;
        notes?: string;
        items: Array<{
            skuId: string;
            quantity: number;
            unitRate: number;
        }>;
    }, user: ScopedUser): Promise<{
        success: boolean;
        supplierId: string;
        invoiceNumber: string;
        subtotal: number;
        gstAmount: number;
        grandTotal: number;
        taxRate: number;
        taxType: string;
        documentUrl: string;
        movementsCreated: number;
    }>;
    getSupplierPurchases(supplierId: string, user: ScopedUser): Promise<({
        sku: {
            id: string;
            name: string;
            skuCode: string;
            category: string;
        };
        performedBy: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        type: string;
        quantity: number;
        skuId: string;
        batchNo: string | null;
        reasonCode: string | null;
        referenceType: string | null;
        referenceId: string | null;
        documentUrl: string | null;
        supplierId: string | null;
        sourceWarehouseId: string | null;
        destWarehouseId: string | null;
        performedById: string | null;
    })[]>;
    createProjectStockPosition(data: any, user: ScopedUser): Promise<{
        project: string;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        deletedAt: Date | null;
        quantity: number;
        notes: string | null;
        unit: string;
        reference: string;
        package: string | null;
        partValue: string | null;
        itemCode: string;
        bomQtyPerUnit: number;
        batchQty: number;
        plannedRequirement: number;
        openingStock: number;
        inflow: number;
        outflow: number;
        presentStock: number;
        shortage: number;
    }>;
    updateProjectStockPosition(id: string, data: any, user: ScopedUser): Promise<{
        project: string;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        deletedAt: Date | null;
        quantity: number;
        notes: string | null;
        unit: string;
        reference: string;
        package: string | null;
        partValue: string | null;
        itemCode: string;
        bomQtyPerUnit: number;
        batchQty: number;
        plannedRequirement: number;
        openingStock: number;
        inflow: number;
        outflow: number;
        presentStock: number;
        shortage: number;
    }>;
    deleteProjectStockPosition(id: string, user: ScopedUser): Promise<{
        project: string;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        deletedAt: Date | null;
        quantity: number;
        notes: string | null;
        unit: string;
        reference: string;
        package: string | null;
        partValue: string | null;
        itemCode: string;
        bomQtyPerUnit: number;
        batchQty: number;
        plannedRequirement: number;
        openingStock: number;
        inflow: number;
        outflow: number;
        presentStock: number;
        shortage: number;
    }>;
    bulkImportProjectStockPositions(rows: any[], user: ScopedUser): Promise<{
        success: boolean;
        importedCount: number;
    }>;
    recordProjectStockPurchase(positionId: string, dto: {
        quantityPurchased: number;
        unitRate: number;
        taxRate: number;
        supplierName?: string;
        supplierGstin?: string;
        invoiceNumber?: string;
        invoiceDate?: string;
        documentDataUrl?: string;
        notes?: string;
    }, user: ScopedUser): Promise<{
        success: boolean;
        position: {
            project: string;
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            deletedAt: Date | null;
            quantity: number;
            notes: string | null;
            unit: string;
            reference: string;
            package: string | null;
            partValue: string | null;
            itemCode: string;
            bomQtyPerUnit: number;
            batchQty: number;
            plannedRequirement: number;
            openingStock: number;
            inflow: number;
            outflow: number;
            presentStock: number;
            shortage: number;
        };
        purchaseSummary: {
            quantityPurchased: number;
            unitRate: number;
            taxRate: number;
            subtotal: number;
            gstAmount: number;
            grandTotal: number;
            supplierName: string;
            supplierGstin: string;
            invoiceNumber: string;
            invoiceDate: string;
            documentAttached: boolean;
        };
    }>;
    clearAllInventory(confirmMessage: string, user: ScopedUser): Promise<{
        success: boolean;
        message: string;
    }>;
    private getPurchaseBillsFilePath;
    private readStoredPurchaseBills;
    private writeStoredPurchaseBills;
    getPurchaseBills(user: ScopedUser, params?: any): Promise<{
        data: any[];
        total: number;
    }>;
    getPurchaseBill(id: string, user: ScopedUser): Promise<any>;
    createPurchaseBill(data: any, user: ScopedUser): Promise<{
        id: string;
        tenantId: string;
        invoiceNumber: any;
        vendorName: any;
        vendorGstin: any;
        vendorAddress: any;
        invoiceDate: any;
        project: any;
        items: any;
        subtotal: number;
        taxRate: number;
        cgst: number;
        sgst: number;
        igst: number;
        totalTax: number;
        grandTotal: number;
        documentUrl: any;
        rawText: any;
        notes: any;
        createdById: string;
        createdByName: any;
        createdAt: string;
        softCopyData: any;
    }>;
    deletePurchaseBill(id: string, user: ScopedUser): Promise<{
        success: boolean;
        message: string;
    }>;
    scanBillOcr(body: {
        rawText?: string;
        filename?: string;
        fileUrl?: string;
    }): Promise<{
        vendorName: string;
        vendorGstin: string;
        invoiceNumber: string;
        invoiceDate: string;
        items: {
            name: string;
            skuCode: string;
            quantity: number;
            unit: string;
            unitPrice: number;
            total: number;
        }[];
        subtotal: number;
        taxRate: number;
        cgst: number;
        sgst: number;
        igst: number;
        totalTax: number;
        grandTotal: number;
        rawText: string;
    }>;
    bulkEditComponents(body: {
        items?: Array<{
            skuId?: string;
            positionId?: string;
            skuCode?: string;
            name?: string;
        }>;
        positionIds?: string[];
        skuIds?: string[];
        updates?: {
            project?: string;
            supplierName?: string;
            packageType?: string;
            unit?: string;
            unitPrice?: number;
            costPrice?: number;
            taxRate?: number;
            plannedRequirement?: number;
            presentStock?: number;
        };
        rowUpdates?: Array<{
            skuId?: string;
            positionId?: string;
            project?: string;
            supplier?: string;
            packageType?: string;
            unit?: string;
            unitPrice?: number;
            taxRate?: number;
            plannedRequirement?: number;
            presentStock?: number;
        }>;
    }, user: ScopedUser): Promise<{
        success: boolean;
        updatedCount: number;
        message: string;
    }>;
}
