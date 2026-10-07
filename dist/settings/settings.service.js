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
var SettingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = exports.DEFAULT_BRANDING = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_util_1 = require("../common/tenant.util");
const encryption_util_1 = require("../common/encryption.util");
const brand_1 = require("../common/brand");
const fs = require("fs");
const path = require("path");
exports.DEFAULT_BRANDING = {
    companyDisplayName: brand_1.BRAND_CONFIG.displayName,
    companyPhone: '+91 9663421455',
    companyLogoUrl: '/api/v1/settings/branding/logo',
};
let SettingsService = SettingsService_1 = class SettingsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SettingsService_1.name);
    }
    async getBranding(tenantId) {
        try {
            let tenant = null;
            if (tenantId) {
                tenant = await this.prisma.tenant.findUnique({
                    where: { id: tenantId },
                    select: { name: true, phone: true, logoUrl: true },
                });
            }
            else {
                tenant = await this.prisma.tenant.findFirst({
                    where: { deletedAt: null },
                    orderBy: { createdAt: 'asc' },
                    select: { name: true, phone: true, logoUrl: true },
                });
            }
            if (tenant) {
                return {
                    companyDisplayName: tenant.name || exports.DEFAULT_BRANDING.companyDisplayName,
                    companyPhone: tenant.phone || exports.DEFAULT_BRANDING.companyPhone,
                    companyLogoUrl: tenant.logoUrl || exports.DEFAULT_BRANDING.companyLogoUrl,
                };
            }
        }
        catch (err) {
            this.logger.error(`Error reading company branding config: ${err.message}`);
        }
        return exports.DEFAULT_BRANDING;
    }
    async updateBranding(user, dto) {
        if (!user.tenantId) {
            throw new common_1.ForbiddenException('Platform administrator cannot modify company branding from the platform console.');
        }
        const tenantId = user.tenantId;
        if (user.role !== 'tenant_admin' && user.role !== 'admin') {
            throw new common_1.ForbiddenException('Only Administrators are authorized to modify Company Branding settings.');
        }
        const updatedTenant = await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                name: dto.companyDisplayName?.trim(),
                phone: dto.companyPhone?.trim(),
                logoUrl: dto.companyLogoUrl,
            },
        });
        this.logger.log(`Tenant branding updated for ${updatedTenant.code} by ${user.employeeCode}: ${updatedTenant.name}`);
        return {
            companyDisplayName: updatedTenant.name,
            companyPhone: updatedTenant.phone || exports.DEFAULT_BRANDING.companyPhone,
            companyLogoUrl: updatedTenant.logoUrl || exports.DEFAULT_BRANDING.companyLogoUrl,
        };
    }
    async getCompanyProfile(user) {
        if (!user.tenantId) {
            throw new common_1.ForbiddenException('Platform administrator cannot access tenant invoicing, banking, or tax profiles from the platform console.');
        }
        const tenantId = user.tenantId;
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Company tenant not found');
        }
        return tenant;
    }
    async updateCompanyProfile(user, dto) {
        if (!user.tenantId) {
            throw new common_1.ForbiddenException('Platform administrator cannot update tenant invoicing, banking, or tax profiles from the platform console.');
        }
        const tenantId = user.tenantId;
        if (user.role !== 'tenant_admin' && user.role !== 'admin') {
            throw new common_1.ForbiddenException('Only Administrators can update Company Invoicing & Tax Profile.');
        }
        const updated = await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                name: dto.name?.trim(),
                phone: dto.phone?.trim(),
                email: dto.email?.trim(),
                address: dto.address?.trim(),
                city: dto.city?.trim(),
                state: dto.state?.trim(),
                pincode: dto.pincode?.trim(),
                website: dto.website?.trim(),
                gstin: dto.gstin?.trim()?.toUpperCase(),
                pan: dto.pan?.trim()?.toUpperCase(),
                lutBondNo: dto.lutBondNo?.trim(),
                lutValidity: dto.lutValidity?.trim(),
                invoicePrefix: dto.invoicePrefix?.trim()?.toUpperCase(),
                invoiceTerms: dto.invoiceTerms?.trim(),
                bankName: dto.bankName?.trim(),
                bankAccountNumber: dto.bankAccountNumber?.trim(),
                bankIfsc: dto.bankIfsc?.trim()?.toUpperCase(),
                bankBranch: dto.bankBranch?.trim(),
                bankUpi: dto.bankUpi?.trim(),
                signatoryName: dto.signatoryName?.trim(),
                signatoryDesignation: dto.signatoryDesignation?.trim(),
                signatureUrl: dto.signatureUrl,
                stampUrl: dto.stampUrl,
                logoUrl: dto.logoUrl,
                isOnboarded: true,
            },
        });
        return updated;
    }
    async getMailAccounts(user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        if (user.role !== 'platform_super_admin' && user.role !== 'tenant_admin') {
            throw new common_1.ForbiddenException('Only Company Administrators can access Mail Account settings.');
        }
        return this.prisma.mailAccount.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                tenantId: true,
                name: true,
                email: true,
                senderName: true,
                smtpHost: true,
                smtpPort: true,
                smtpUser: true,
                isSecure: true,
                purpose: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
    async createMailAccount(user, dto) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        if (user.role !== 'platform_super_admin' && user.role !== 'tenant_admin') {
            throw new common_1.ForbiddenException('Only Company Administrators can configure Mail Accounts.');
        }
        const encryptedPass = (0, encryption_util_1.encryptAtRest)(dto.smtpPass) || dto.smtpPass;
        const created = await this.prisma.mailAccount.create({
            data: {
                tenantId,
                name: dto.name,
                email: dto.email,
                senderName: dto.senderName,
                smtpHost: dto.smtpHost,
                smtpPort: dto.smtpPort ? Number(dto.smtpPort) : 587,
                smtpUser: dto.smtpUser,
                smtpPass: encryptedPass,
                isSecure: Boolean(dto.isSecure),
                purpose: dto.purpose || 'PRIMARY_ALERTS',
                createdById: user.id,
            },
            select: {
                id: true,
                tenantId: true,
                name: true,
                email: true,
                senderName: true,
                smtpHost: true,
                smtpPort: true,
                smtpUser: true,
                isSecure: true,
                purpose: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return created;
    }
    async updateMailAccount(user, id, dto) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        if (user.role !== 'platform_super_admin' && user.role !== 'tenant_admin') {
            throw new common_1.ForbiddenException('Only Company Administrators can modify Mail Accounts.');
        }
        const account = await this.prisma.mailAccount.findFirst({ where: { id, tenantId } });
        if (!account) {
            throw new common_1.NotFoundException('Mail account not found');
        }
        const encryptedPass = dto.smtpPass !== undefined && dto.smtpPass !== ''
            ? ((0, encryption_util_1.encryptAtRest)(dto.smtpPass) || dto.smtpPass)
            : undefined;
        await this.prisma.mailAccount.updateMany({
            where: { id, tenantId },
            data: {
                name: dto.name,
                email: dto.email,
                senderName: dto.senderName,
                smtpHost: dto.smtpHost,
                smtpPort: dto.smtpPort !== undefined ? Number(dto.smtpPort) : undefined,
                smtpUser: dto.smtpUser,
                smtpPass: encryptedPass,
                isSecure: dto.isSecure !== undefined ? Boolean(dto.isSecure) : undefined,
                purpose: dto.purpose,
                isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : undefined,
            },
        });
        return this.prisma.mailAccount.findFirst({
            where: { id, tenantId },
            select: {
                id: true,
                tenantId: true,
                name: true,
                email: true,
                senderName: true,
                smtpHost: true,
                smtpPort: true,
                smtpUser: true,
                isSecure: true,
                purpose: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
    async deleteMailAccount(user, id) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        if (user.role !== 'platform_super_admin' && user.role !== 'tenant_admin') {
            throw new common_1.ForbiddenException('Only Company Administrators can delete Mail Accounts.');
        }
        const account = await this.prisma.mailAccount.findFirst({ where: { id, tenantId } });
        if (!account) {
            throw new common_1.NotFoundException('Mail account not found');
        }
        await this.prisma.mailAccount.deleteMany({
            where: { id, tenantId },
        });
        return { success: true };
    }
    async servePublicBrandingImage(type, tenantKey, res) {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        let tenant = null;
        try {
            if (tenantKey) {
                tenant = await this.prisma.tenant.findFirst({
                    where: {
                        OR: [{ id: tenantKey }, { code: tenantKey }, { slug: tenantKey }],
                        deletedAt: null,
                    },
                });
            }
            else {
                tenant = await this.prisma.tenant.findFirst({
                    where: { deletedAt: null },
                    orderBy: { createdAt: 'asc' },
                });
            }
        }
        catch (e) {
        }
        const imgVal = type === 'stamp' ? tenant?.stampUrl : tenant?.logoUrl;
        if (imgVal) {
            if (imgVal.startsWith('data:image/')) {
                const matches = imgVal.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    const contentType = matches[1];
                    const buffer = Buffer.from(matches[2], 'base64');
                    res.setHeader('Content-Type', contentType);
                    return res.send(buffer);
                }
            }
            else if (fs.existsSync(imgVal)) {
                const ext = path.extname(imgVal).toLowerCase();
                const mime = ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';
                res.setHeader('Content-Type', mime);
                return res.sendFile(path.resolve(imgVal));
            }
        }
        const defaultLogoPaths = [
            path.resolve(process.cwd(), 'assets/jnc-logo.jpg'),
            path.resolve(__dirname, '../../assets/jnc-logo.jpg'),
            path.resolve(__dirname, '../../../assets/jnc-logo.jpg'),
            path.resolve(process.cwd(), 'apps/api/assets/jnc-logo.jpg'),
            path.resolve(process.cwd(), 'apps/web/public/jnc-logo.jpg'),
        ];
        for (const p of defaultLogoPaths) {
            if (fs.existsSync(p)) {
                res.setHeader('Content-Type', 'image/jpeg');
                return res.sendFile(p);
            }
        }
        return res.status(404).send('Branding image not found');
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = SettingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
