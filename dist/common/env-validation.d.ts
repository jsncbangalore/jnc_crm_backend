export type EnvCategory = 'REQUIRED' | 'FEATURE-GATED' | 'OPTIONAL';
export interface EnvDefinition {
    key: string;
    category: EnvCategory;
    description: string;
    isSecret?: boolean;
}
export declare const ENV_CATALOG: EnvDefinition[];
export interface EnvValidationResult {
    isValid: boolean;
    missingVariables: string[];
    configuredVariables: string[];
    invalidVariables: string[];
    warnings: string[];
    featureGatedStatus: Record<string, 'enabled' | 'disabled'>;
}
export interface ValidationOptions {
    exitOnError?: boolean;
    verbose?: boolean;
}
export declare function extractSupabaseProjectRef(urlStr?: string): string | null;
export declare function validateEnvironment(env?: NodeJS.ProcessEnv, options?: ValidationOptions): EnvValidationResult;
export declare function validateEnvironmentOrExit(env?: NodeJS.ProcessEnv): EnvValidationResult;
