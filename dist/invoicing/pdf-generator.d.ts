export interface PdfDocumentOptions {
    templateType?: string;
    companyProfile?: {
        companyName?: string;
        tradeName?: string;
        address?: string;
        city?: string;
        state?: string;
        pincode?: string;
        gstin?: string;
        pan?: string;
        phone?: string;
        email?: string;
        website?: string;
        bankName?: string;
        bankAccountNumber?: string;
        bankIfsc?: string;
        bankBranch?: string;
        bankAccountHolder?: string;
        lutBondNo?: string;
        lutValidity?: string;
        logoUrl?: string | null;
    };
    signatorySettings?: {
        signatoryName?: string;
        signatoryDesignation?: string;
        signatureImage?: string | null;
        stampImage?: string | null;
    };
}
export declare function generateInvoicePdfBuffer(invoice: any, options?: PdfDocumentOptions): Promise<Buffer>;
