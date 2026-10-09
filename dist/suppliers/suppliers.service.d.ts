import { PrismaService } from '../prisma/prisma.service';
import { ScopingService, ScopedUser } from '../auth/scoping.service';
export interface CreateSupplierDto {
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    gstin?: string;
    address?: string;
    city?: string;
    leadTimeDays?: number;
    notes?: string;
}
export declare class SuppliersService {
    private prisma;
    private scopingService;
    constructor(prisma: PrismaService, scopingService: ScopingService);
    create(dto: CreateSupplierDto, user?: ScopedUser): Promise<{
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
    }>;
    findAll(user?: ScopedUser, query?: {
        search?: string;
        isActive?: boolean;
    }): Promise<({
        _count: {
            stockMovements: number;
            preferredSkus: number;
        };
        preferredSkus: {
            id: string;
            name: string;
            skuCode: string;
            category: string;
        }[];
    } & {
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
    })[]>;
    findOne(id: string, user?: ScopedUser): Promise<{
        stockMovements: ({
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
        })[];
        preferredSkus: {
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
        }[];
    } & {
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
    }>;
    update(id: string, dto: Partial<CreateSupplierDto>, user?: ScopedUser): Promise<{
        stockMovements: ({
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
        })[];
        preferredSkus: {
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
        }[];
    } & {
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
    }>;
    delete(id: string, user?: ScopedUser): Promise<{
        success: boolean;
    }>;
    countActiveSuppliers(user?: ScopedUser): Promise<number>;
}
