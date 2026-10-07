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
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const prisma_service_1 = require("../prisma/prisma.service");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(prisma) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET,
            algorithms: ['HS256'],
            issuer: 'jnc-crm-api',
            audience: 'jnc-crm-client',
        });
        this.prisma = prisma;
    }
    async validate(payload) {
        const user = await this.prisma.user.findFirst({
            where: { id: payload.sub, deletedAt: null },
            select: {
                id: true,
                tenantId: true,
                employeeCode: true,
                name: true,
                email: true,
                role: true,
                team: true,
                teamId: true,
                warehouseId: true,
                isActive: true,
                mustResetPassword: true,
                tokenVersion: true,
                tenant: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        slug: true,
                        status: true,
                        logoUrl: true,
                        currency: true,
                        deletedAt: true,
                    },
                },
            },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('User account is invalid or deactivated');
        }
        if (payload.tokenVersion !== undefined && payload.tokenVersion !== user.tokenVersion) {
            throw new common_1.UnauthorizedException('Session expired due to password or credential reset. Please log in again.');
        }
        if (user.tenant && (user.tenant.status !== 'active' || user.tenant.deletedAt !== null) && user.role !== 'platform_super_admin') {
            throw new common_1.UnauthorizedException('Your company account is suspended or expired. Please contact support.');
        }
        return user;
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JwtStrategy);
