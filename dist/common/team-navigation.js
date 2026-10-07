"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_ONLY_PAGE = exports.PAGE_KEY_TO_ROUTE = void 0;
exports.resolveTeamNavigation = resolveTeamNavigation;
exports.PAGE_KEY_TO_ROUTE = {
    dashboard: '/',
    leads: '/leads',
    orders: '/orders',
    invoices: '/invoices',
    inventory: '/inventory',
    suppliers: '/suppliers',
    shipments: '/shipments',
    quotations: '/quotations',
    users: '/users',
    automation: '/automation',
    custom_objects: '/setup/objects',
    daily_activities: '/daily-activities',
};
exports.ROLE_ONLY_PAGE = {
    project_manager: 'daily_activities',
    developer_lead: 'daily_activities',
    developer: 'daily_activities',
    store_manager: 'inventory',
};
function resolveTeamNavigation(user, pageKey) {
    if (!user) {
        return { action: 'redirect', targetRoute: '/login' };
    }
    const isPlatformSuperAdmin = user.role === 'platform_super_admin' && !user.tenantId;
    if (isPlatformSuperAdmin) {
        return { action: 'redirect', targetRoute: '/platform/companies' };
    }
    if (user.role === 'tenant_admin' || user.role === 'admin' || user.role === 'sub_admin') {
        return { action: 'allow' };
    }
    const onlyPage = exports.ROLE_ONLY_PAGE[user.role || ''];
    if (onlyPage) {
        if (pageKey !== onlyPage) {
            return { action: 'redirect', targetRoute: exports.PAGE_KEY_TO_ROUTE[onlyPage] || '/' };
        }
        return { action: 'allow' };
    }
    if (user.teamId && user.teamRef) {
        let allowedPages = [];
        try {
            allowedPages = typeof user.teamRef.allowedPages === 'string'
                ? JSON.parse(user.teamRef.allowedPages || '[]')
                : (user.teamRef.allowedPages || []);
        }
        catch {
            allowedPages = [];
        }
        if (allowedPages.length === 0) {
            return { action: 'no_pages' };
        }
        if (!allowedPages.includes(pageKey)) {
            const firstAllowed = allowedPages.find((p) => exports.PAGE_KEY_TO_ROUTE[p]);
            return { action: 'redirect', targetRoute: exports.PAGE_KEY_TO_ROUTE[firstAllowed || ''] || '/' };
        }
    }
    return { action: 'allow' };
}
