"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTenantId = requireTenantId;
const common_1 = require("@nestjs/common");
function requireTenantId(userOrTenantId) {
    if (typeof userOrTenantId === 'string') {
        const trimmed = userOrTenantId.trim();
        if (trimmed)
            return trimmed;
        throw new common_1.ForbiddenException('Tenant context is required for this operation.');
    }
    if (userOrTenantId?.tenantId) {
        return userOrTenantId.tenantId;
    }
    throw new common_1.ForbiddenException('Tenant context is required for this operation.');
}
