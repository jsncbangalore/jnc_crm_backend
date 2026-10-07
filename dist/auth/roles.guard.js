"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const roles_decorator_1 = require("./roles.decorator");
const page_access_decorator_1 = require("./page-access.decorator");
const prisma_service_1 = require("../prisma/prisma.service");
let RolesGuard = class RolesGuard {
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const requiredPage = this.reflector.getAllAndOverride(page_access_decorator_1.PAGE_ACCESS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const req = context.switchToHttp().getRequest();
        const user = req.user;
        if (!user) {
            throw new common_1.ForbiddenException('User authentication context required');
        }
        if (user && user.mustResetPassword) {
            const path = req.path || req.url || '';
            const isAuthRoute = path.includes('/auth/') || path.startsWith('/api/v1/auth/');
            if (!isAuthRoute) {
                throw new common_1.ForbiddenException('Password reset required: You must change your temporary password before accessing CRM resources.');
            }
        }
        if (user.role === 'platform_super_admin' && !user.tenantId) {
            if (requiredRoles && requiredRoles.includes('platform_super_admin')) {
                return true;
            }
            if (requiredPage || (requiredRoles && requiredRoles.length > 0)) {
                throw new common_1.ForbiddenException('Platform administrators cannot access company workspace resources directly. Impersonate a client company to view their data.');
            }
            const path = req.path || req.url || '';
            if (path.includes('/platform/') || path.includes('/auth/')) {
                return true;
            }
            throw new common_1.ForbiddenException('Platform administrators cannot access company workspace resources directly. Impersonate a client company to view their data.');
        }
        if (requiredRoles && requiredRoles.length > 0) {
            let isAuthorized = requiredRoles.includes(user.role);
            if (!isAuthorized) {
                if (user.role === 'tenant_admin') {
                    const isPlatformOnly = requiredRoles.every((r) => r === 'platform_super_admin');
                    if (!isPlatformOnly) {
                        isAuthorized = true;
                    }
                }
                else if (user.role === 'admin') {
                    if (requiredRoles.some((r) => ['admin', 'sub_admin', 'employee'].includes(r))) {
                        isAuthorized = true;
                    }
                }
                else if (user.role === 'sub_admin') {
                    if (requiredRoles.some((r) => ['sub_admin', 'employee'].includes(r))) {
                        isAuthorized = true;
                    }
                }
            }
            if (!isAuthorized) {
                throw new common_1.ForbiddenException(`Access denied. Required roles: [${requiredRoles.join(', ')}]`);
            }
        }
        if (requiredPage) {
            const dbUser = await this.prisma.user.findUnique({
                where: { id: user.sub || user.id },
                include: { teamRef: true }
            });
            if (!dbUser)
                return false;
            if (dbUser.teamId && dbUser.teamRef) {
                try {
                    const allowedPages = JSON.parse(dbUser.teamRef.allowedPages || '[]');
                    if (!allowedPages.includes(requiredPage)) {
                        throw new common_1.ForbiddenException(`Access restricted: Your team does not have access to the '${requiredPage}' module.`);
                    }
                }
                catch (e) {
                    if (e instanceof common_1.ForbiddenException)
                        throw e;
                    throw new common_1.ForbiddenException(`Access restricted: Invalid team permissions format.`);
                }
            }
        }
        return true;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector, prisma_service_1.PrismaService])
], RolesGuard);
