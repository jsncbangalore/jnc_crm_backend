export interface CompanyInvoiceProfile {
    companyName: string;
    tradingName: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    stateCode: string;
    pincode: string;
    phone: string;
    email: string;
    website: string;
    gstin: string;
    msmeUdyamNo: string;
    lutBondNo: string;
    lutValidity: string;
    bankDetails: {
        accountHolderName: string;
        bankName: string;
        accountNumber: string;
        ifscCode: string;
        branch: string;
    };
}
export declare const JSNC_COMPANY_PROFILE: CompanyInvoiceProfile;
export interface TaxBreakdown {
    taxableAmount: number;
    isInterState: boolean;
    isSez: boolean;
    cgstRate: number;
    cgstAmount: number;
    sgstRate: number;
    sgstAmount: number;
    igstRate: number;
    igstAmount: number;
    totalTax: number;
    grandTotal: number;
    roundOff: number;
}
export declare function calculateGst(taxableAmount: number, customerState?: string, taxRatePercent?: number, isSez?: boolean): TaxBreakdown;
export declare function numberToIndianWords(amount: number): string;
