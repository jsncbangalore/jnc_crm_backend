"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScopingService = void 0;
const common_1 = require("@nestjs/common");
const tenant_util_1 = require("../common/tenant.util");
const data_visibility_1 = require("./data-visibility");
let ScopingService = class ScopingService {
    getCustomerListScope() {
        return (0, data_visibility_1.getCustomerListScope)();
    }
    getTenantScope(user) {
        if (user.role === 'platform_super_admin' && !user.tenantId) {
            throw new common_1.ForbiddenException('Platform administrators cannot access company workspace resources directly. Impersonate a client company to view their data.');
        }
        return { tenantId: (0, tenant_util_1.requireTenantId)(user) };
    }
    getScope(user, model, overrideScope) {
        const tenantFilter = this.getTenantScope(user);
        const level = (0, data_visibility_1.getVisibility)(user.role, model, overrideScope);
        if (level === 'none') {
            throw new common_1.ForbiddenException(`Your role does not have access to ${model} records.`);
        }
        if (level === 'all') {
            return { ...tenantFilter };
        }
        const hasAssignment = model === 'Lead';
        const hasShares = model === 'Lead';
        if (level === 'team') {
            const clauses = [{ createdById: user.id }];
            if (hasAssignment) {
                clauses.push({ assignedToId: user.id });
                if (user.teamId)
                    clauses.push({ assignedTo: { teamId: user.teamId } });
                clauses.push({ assignedToId: null });
            }
            return { ...tenantFilter, OR: clauses };
        }
        const ownClauses = [{ createdById: user.id }];
        if (hasAssignment)
            ownClauses.push({ assignedToId: user.id });
        if (hasShares)
            ownClauses.push({ shares: { some: { userId: user.id } } });
        return { ...tenantFilter, OR: ownClauses };
    }
    getLeadScope(user) { return this.getScope(user, 'Lead'); }
    getCompanyScope(user, overrideScope) { return this.getScope(user, 'Company', overrideScope); }
    getContactScope(user, overrideScope) { return this.getScope(user, 'Contact', overrideScope); }
    getQuotationScope(user) { return this.getScope(user, 'Quotation'); }
    getOrderScope(user) { return this.getScope(user, 'Order'); }
    getInvoiceScope(user) { return this.getScope(user, 'Invoice'); }
    getSupplierScope(user) { return this.getScope(user, 'Supplier'); }
    getInventoryScope(user) {
        const tenantFilter = this.getTenantScope(user);
        const level = (0, data_visibility_1.getVisibility)(user.role, 'Inventory');
        if (level === 'none')
            throw new common_1.ForbiddenException('Your role does not have access to Inventory records.');
        if (user.role === 'sub_admin' && user.warehouseId)
            return { ...tenantFilter, warehouseId: user.warehouseId };
        return { ...tenantFilter };
    }
    getCustomObjectScope(user) { return this.getTenantScope(user); }
    getProjectScope(user) { return this.getTenantScope(user); }
};
exports.ScopingService = ScopingService;
exports.ScopingService = ScopingService = __decorate([
    (0, common_1.Injectable)()
], ScopingService);
