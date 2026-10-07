export declare const ALLOWED_ORIGIN_LIST: string[];
export declare function isAllowedOrigin(origin?: string, frontendUrlEnv?: string): boolean;
export declare function corsOriginCallback(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void;
