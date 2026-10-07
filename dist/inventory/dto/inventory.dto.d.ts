export declare class CreateWarehouseDto {
    name: string;
    code: string;
    address?: string;
    city?: string;
}
export declare class RecordMovementDto {
    skuId: string;
    warehouseId: string;
    type: string;
    quantity: number;
    reason?: string;
    reference?: string;
    batchNumber?: string;
}
export declare class CreateSkuDto {
    skuCode: string;
    code?: string;
    name: string;
    description?: string;
    category?: string;
    unit?: string;
    price?: number;
    unitPrice?: number;
    costPrice?: number;
    reorderPoint?: number;
    reorderLevel?: number;
    reorderQty?: number;
    warehouseId?: string;
    initialStock?: number;
    hsnCode?: string;
    packageType?: string;
    preferredSupplierId?: string;
    binCode?: string;
    taxRate?: number;
}
export declare class UpdateSkuDto {
    code?: string;
    name?: string;
    description?: string;
    category?: string;
    unit?: string;
    price?: number;
    costPrice?: number;
    reorderLevel?: number;
    hsnCode?: string;
    taxRate?: number;
    isActive?: boolean;
}
export declare class BulkDeleteSkusDto {
    ids: string[];
}
export declare class ImportInventoryDto {
    records: any[];
    warehouseCode?: string;
}
export declare class TransferStockDto {
    skuId: string;
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    quantity: number;
    notes?: string;
}
export declare class CreateProjectStockDto {
    projectId: string;
    skuId: string;
    allocatedQuantity: number;
    notes?: string;
}
export declare class UpdateProjectStockDto {
    allocatedQuantity?: number;
    consumedQuantity?: number;
    notes?: string;
}
export declare class AssignProjectStockDto {
    projectId: string;
    skuId: string;
    quantity: number;
    notes?: string;
}
export declare class BulkImportProjectStockDto {
    rows: any[];
}
export declare class AllocateProjectStockDto {
    projectId: string;
    skuId: string;
    quantity: number;
    warehouseId?: string;
}
export declare class CreatePurchaseBillDto {
    supplierId: string;
    billNumber: string;
    totalAmount: number;
    items?: any[];
    notes?: string;
    documentUrl?: string;
}
export declare class ScanBillOcrDto {
    rawText?: string;
    filename?: string;
    fileUrl?: string;
    documentUrl?: string;
    imageBase64?: string;
}
export declare class BulkEditComponentsDto {
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
    components?: any[];
}
export declare class RecordPurchaseDto {
    invoiceNumber?: string;
    amount?: number;
    notes?: string;
    items?: any[];
}
