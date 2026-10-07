export declare class UpdateBrandingDto {
    companyDisplayName?: string;
    companyPhone?: string;
    companyLogoUrl?: string | null;
}
export declare class UpdateCompanyProfileDto {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    website?: string;
    gstin?: string;
    pan?: string;
    lutBondNo?: string;
    lutValidity?: string;
    invoicePrefix?: string;
    invoiceTerms?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
    bankBranch?: string;
    bankUpi?: string;
    signatoryName?: string;
    signatoryDesignation?: string;
    signatureUrl?: string;
    stampUrl?: string;
    logoUrl?: string;
}
export declare class CreateMailAccountDto {
    name: string;
    email: string;
    senderName?: string;
    smtpHost: string;
    smtpPort?: number;
    smtpUser: string;
    smtpPass: string;
    isSecure?: boolean;
    purpose?: string;
}
export declare class UpdateMailAccountDto {
    name?: string;
    email?: string;
    senderName?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    isSecure?: boolean;
    purpose?: string;
    isActive?: boolean;
}
