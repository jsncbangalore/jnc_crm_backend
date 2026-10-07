export declare const ALL_ROLES: readonly ["platform_super_admin", "tenant_admin", "admin", "sub_admin", "project_manager", "developer_lead", "store_manager", "finance", "accountant", "employee", "developer", "client", "customer"];
export type UserRole = (typeof ALL_ROLES)[number];
export declare const ROLE_RANKS: Record<string, number>;
export declare const ROLE_LABELS: Record<string, string>;
export declare function isPlatformOwner(user?: {
    role?: string;
    tenantId?: string | null;
} | null): boolean;
export declare function getRoleRedirectPath(user?: {
    role?: string;
    tenantId?: string | null;
} | null): string;
export declare function getAllowedAssignableRoles(actorRole?: string): string[];
