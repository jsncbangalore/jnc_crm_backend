import { ModelName, CustomerListScope } from './data-visibility';
export interface ScopedUser {
    id: string;
    tenantId?: string | null;
    employeeCode: string;
    role: string;
    teamId?: string | null;
    warehouseId?: string | null;
    tenant?: {
        id: string;
        code: string;
        name: string;
        slug: string;
        status: string;
    } | null;
}
export declare class ScopingService {
    getCustomerListScope(): CustomerListScope;
    getTenantScope(user: ScopedUser): {
        tenantId: string;
    };
    getScope(user: ScopedUser, model: ModelName, overrideScope?: CustomerListScope): Record<string, any>;
    getLeadScope(user: ScopedUser): Record<string, any>;
    getCompanyScope(user: ScopedUser, overrideScope?: CustomerListScope): Record<string, any>;
    getContactScope(user: ScopedUser, overrideScope?: CustomerListScope): Record<string, any>;
    getQuotationScope(user: ScopedUser): Record<string, any>;
    getOrderScope(user: ScopedUser): Record<string, any>;
    getInvoiceScope(user: ScopedUser): Record<string, any>;
    getSupplierScope(user: ScopedUser): Record<string, any>;
    getInventoryScope(user: ScopedUser): {
        warehouseId: string;
        tenantId: string;
    } | {
        tenantId: string;
    };
    getCustomObjectScope(user: ScopedUser): {
        tenantId: string;
    };
    getProjectScope(user: ScopedUser): {
        tenantId: string;
    };
}
