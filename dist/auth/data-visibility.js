"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VISIBILITY_TABLE = exports.VISIBILITY_TABLE_COMPANY = exports.VISIBILITY_TABLE_OWN = void 0;
exports.getCustomerListScope = getCustomerListScope;
exports.getVisibilityTable = getVisibilityTable;
exports.getVisibility = getVisibility;
function getCustomerListScope() {
    const envVal = process.env.CUSTOMER_LIST_SCOPE?.trim().toLowerCase();
    return envVal === 'company' ? 'company' : 'own';
}
exports.VISIBILITY_TABLE_OWN = {
    platform_super_admin: { Lead: 'all', Company: 'all', Contact: 'all', Quotation: 'all', Order: 'all', Invoice: 'all', Supplier: 'all', Inventory: 'all', Activity: 'all' },
    tenant_admin: { Lead: 'all', Company: 'all', Contact: 'all', Quotation: 'all', Order: 'all', Invoice: 'all', Supplier: 'all', Inventory: 'all', Activity: 'all' },
    admin: { Lead: 'all', Company: 'all', Contact: 'all', Quotation: 'all', Order: 'all', Invoice: 'all', Supplier: 'all', Inventory: 'all', Activity: 'all' },
    sub_admin: { Lead: 'team', Company: 'team', Contact: 'team', Quotation: 'team', Order: 'team', Invoice: 'team', Supplier: 'all', Inventory: 'all', Activity: 'team' },
    employee: { Lead: 'own', Company: 'own', Contact: 'own', Quotation: 'own', Order: 'own', Invoice: 'own', Supplier: 'none', Inventory: 'all', Activity: 'own' },
    store_manager: { Lead: 'none', Company: 'none', Contact: 'none', Quotation: 'none', Order: 'none', Invoice: 'none', Supplier: 'all', Inventory: 'all', Activity: 'own' },
    project_manager: { Lead: 'none', Company: 'none', Contact: 'none', Quotation: 'none', Order: 'none', Invoice: 'none', Supplier: 'none', Inventory: 'none', Activity: 'team' },
    developer_lead: { Lead: 'none', Company: 'none', Contact: 'none', Quotation: 'none', Order: 'none', Invoice: 'none', Supplier: 'none', Inventory: 'none', Activity: 'team' },
    developer: { Lead: 'none', Company: 'none', Contact: 'none', Quotation: 'none', Order: 'none', Invoice: 'none', Supplier: 'none', Inventory: 'none', Activity: 'own' },
};
exports.VISIBILITY_TABLE_COMPANY = {
    platform_super_admin: { Lead: 'all', Company: 'all', Contact: 'all', Quotation: 'all', Order: 'all', Invoice: 'all', Supplier: 'all', Inventory: 'all', Activity: 'all' },
    tenant_admin: { Lead: 'all', Company: 'all', Contact: 'all', Quotation: 'all', Order: 'all', Invoice: 'all', Supplier: 'all', Inventory: 'all', Activity: 'all' },
    admin: { Lead: 'all', Company: 'all', Contact: 'all', Quotation: 'all', Order: 'all', Invoice: 'all', Supplier: 'all', Inventory: 'all', Activity: 'all' },
    sub_admin: { Lead: 'team', Company: 'team', Contact: 'team', Quotation: 'team', Order: 'team', Invoice: 'team', Supplier: 'all', Inventory: 'all', Activity: 'team' },
    employee: { Lead: 'own', Company: 'all', Contact: 'all', Quotation: 'own', Order: 'own', Invoice: 'own', Supplier: 'none', Inventory: 'all', Activity: 'own' },
    store_manager: { Lead: 'none', Company: 'none', Contact: 'none', Quotation: 'none', Order: 'none', Invoice: 'none', Supplier: 'all', Inventory: 'all', Activity: 'own' },
    project_manager: { Lead: 'none', Company: 'none', Contact: 'none', Quotation: 'none', Order: 'none', Invoice: 'none', Supplier: 'none', Inventory: 'none', Activity: 'team' },
    developer_lead: { Lead: 'none', Company: 'none', Contact: 'none', Quotation: 'none', Order: 'none', Invoice: 'none', Supplier: 'none', Inventory: 'none', Activity: 'team' },
    developer: { Lead: 'none', Company: 'none', Contact: 'none', Quotation: 'none', Order: 'none', Invoice: 'none', Supplier: 'none', Inventory: 'none', Activity: 'own' },
};
function getVisibilityTable(scopeMode) {
    const mode = scopeMode ?? getCustomerListScope();
    return mode === 'company' ? exports.VISIBILITY_TABLE_COMPANY : exports.VISIBILITY_TABLE_OWN;
}
exports.VISIBILITY_TABLE = new Proxy(exports.VISIBILITY_TABLE_OWN, {
    get(target, prop) {
        const table = getVisibilityTable();
        return table[prop];
    },
});
function getVisibility(role, model, scopeMode) {
    const table = getVisibilityTable(scopeMode);
    const row = table[role];
    if (!row)
        return 'none';
    return row[model] ?? 'none';
}
