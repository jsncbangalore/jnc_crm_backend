"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_LABELS = exports.ROLE_RANKS = exports.ALL_ROLES = void 0;
exports.isPlatformOwner = isPlatformOwner;
exports.getRoleRedirectPath = getRoleRedirectPath;
exports.getAllowedAssignableRoles = getAllowedAssignableRoles;
exports.ALL_ROLES = [
    'platform_super_admin',
    'tenant_admin',
    'admin',
    'sub_admin',
    'project_manager',
    'developer_lead',
    'store_manager',
    'finance',
    'accountant',
    'employee',
    'developer',
    'client',
    'customer',
];
exports.ROLE_RANKS = {
    platform_super_admin: 100,
    tenant_admin: 80,
    admin: 60,
    sub_admin: 50,
    project_manager: 40,
    developer_lead: 35,
    store_manager: 30,
    finance: 25,
    accountant: 25,
    employee: 20,
    developer: 15,
    client: 10,
    customer: 10,
};
exports.ROLE_LABELS = {
    platform_super_admin: 'Platform Super Administrator',
    tenant_admin: 'Company Administrator (Tenant Admin)',
    admin: 'Administrator',
    sub_admin: 'Sub-Administrator',
    project_manager: 'Project Manager',
    developer_lead: 'Developer Lead',
    store_manager: 'Store / Inventory Manager',
    finance: 'Finance Specialist',
    accountant: 'Accountant',
    employee: 'Employee / Sales Representative',
    developer: 'Developer',
    client: 'Client Portal',
    customer: 'Customer',
};
function isPlatformOwner(user) {
    if (!user)
        return false;
    return user.role === 'platform_super_admin' && !user.tenantId;
}
function getRoleRedirectPath(user) {
    if (!user)
        return '/login';
    if (isPlatformOwner(user)) {
        return '/platform/companies';
    }
    switch (user.role) {
        case 'tenant_admin':
        case 'admin':
        case 'sub_admin':
            return '/';
        case 'employee':
            return '/leads';
        case 'developer':
        case 'developer_lead':
        case 'project_manager':
            return '/daily-activities';
        case 'store_manager':
            return '/inventory';
        case 'finance':
        case 'accountant':
            return '/invoices';
        case 'client':
        case 'customer':
            return '/orders';
        default:
            return '/';
    }
}
function getAllowedAssignableRoles(actorRole) {
    if (!actorRole)
        return [];
    const actorRank = exports.ROLE_RANKS[actorRole] || 0;
    return exports.ALL_ROLES.filter((role) => {
        if (role === 'platform_super_admin')
            return false;
        if (role === 'tenant_admin' && actorRole !== 'platform_super_admin')
            return false;
        return (exports.ROLE_RANKS[role] || 0) < actorRank;
    });
}
