export declare class CreateLeadDto {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    city?: string;
    source?: string;
    productCategory?: string;
    productName?: string;
    quantity?: number;
    estimatedValue?: number;
    queryMessage?: string;
    companyName?: string;
    assignedToId?: string;
    rawPayload?: string;
}
export declare class UpdateLeadStatusDto {
    status: string;
    note?: string;
    lostReason?: string;
}
export declare class CreateLeadActivityDto {
    type: string;
    title: string;
    description?: string;
    scheduledAt?: string;
    isCompleted?: boolean;
}
export declare class ShareLeadDto {
    targetUserId: string;
}
export declare class ImportLeadsDto {
    records: any[];
}
