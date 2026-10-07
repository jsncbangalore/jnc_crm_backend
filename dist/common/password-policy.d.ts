export interface PasswordValidationContext {
    email?: string;
    name?: string;
}
export declare function validatePasswordPolicy(password: string, context?: PasswordValidationContext): void;
export declare function needsRehash(hash: string): boolean;
