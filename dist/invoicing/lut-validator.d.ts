export interface LutValidationResult {
    isExpired: boolean;
    isExpiringSoon: boolean;
    daysRemaining: number;
    expiryDateStr: string | null;
    expiryDate: Date | null;
    lutBondNo: string;
    warningMessage: string | null;
    severity: 'expired' | 'expiring_soon' | 'valid' | 'unknown';
}
export declare function parseLutEndDate(lutValidity?: string): {
    expiryDate: Date | null;
    expiryDateStr: string | null;
};
export declare function validateLutStatus(lutBondNo?: string, lutValidity?: string, referenceDate?: Date | string): LutValidationResult;
