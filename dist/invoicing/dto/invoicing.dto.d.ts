export declare class CreateDirectInvoiceDto {
    docType?: string;
    companyId?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    dueDate?: string;
    poDate?: string;
    buyerOrderNo?: string;
    referenceNo?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    customerAddress?: string;
    billingAddress?: string;
    shippingAddress?: string;
    customerGstin?: string;
    customerState?: string;
    paymentTerms?: string;
    notes?: string;
    lines?: any[];
    items?: any[];
    discount?: number;
    shippingCharges?: number;
}
export declare class UpdateInvoiceDto {
    customerName?: string;
    customerAddress?: string;
    customerGstin?: string;
    paymentTerms?: string;
    dueDate?: string;
    notes?: string;
    items?: any[];
    status?: string;
}
export declare class CompanyProfileDto {
    name?: string;
    address?: string;
    gstin?: string;
    pan?: string;
    email?: string;
    phone?: string;
    bankName?: string;
    bankBranch?: string;
    accountNumber?: string;
    ifscCode?: string;
    lutArn?: string;
    termsAndConditions?: string;
}
export declare class SignatorySettingsDto {
    signatoryName?: string;
    signatoryDesignation?: string;
    signatureImage?: string | null;
    stampImage?: string | null;
}
export declare class GenerateFromOrderDto {
    paymentTerms?: string;
    dueDate?: string;
    notes?: string;
}
export declare class VoidInvoiceDto {
    reason?: string;
}
export declare class RecordInvoicePaymentDto {
    amount: number;
    paymentType?: string;
    paymentMethod?: string;
    transactionRef?: string;
    paymentDate?: string;
    notes?: string;
}
export declare class EmailInvoiceDto {
    recipientEmail?: string;
    customNote?: string;
    templateType?: string;
}
