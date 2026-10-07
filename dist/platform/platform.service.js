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
exports.PlatformService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const notifications_service_1 = require("../notifications/notifications.service");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
let PlatformService = class PlatformService {
    constructor(prisma, jwtService, notificationsService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.notificationsService = notificationsService;
    }
    async listTenants() {
        const tenants = await this.prisma.tenant.findMany({
            where: {
                deletedAt: null,
                isInternal: false,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        users: true,
                        leads: true,
                        orders: true,
                        invoices: true,
                        mailAccounts: true,
                    },
                },
            },
        });
        return tenants.map((tenant) => ({
            ...tenant,
            isPlatformOwnerTenant: false,
        }));
    }
    async getTenant(id) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
            include: {
                users: {
                    select: {
                        id: true,
                        employeeCode: true,
                        name: true,
                        email: true,
                        role: true,
                        isActive: true,
                        lastLoginAt: true,
                    },
                },
                mailAccounts: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        smtpHost: true,
                        purpose: true,
                        isActive: true,
                    },
                },
                _count: {
                    select: {
                        leads: true,
                        orders: true,
                        invoices: true,
                        skus: true,
                        projects: true,
                    },
                },
            },
        });
        if (!tenant)
            throw new common_1.NotFoundException('Company tenant not found');
        if (tenant.isInternal) {
            throw new common_1.ForbiddenException('This is the platform owner company and cannot be managed here.');
        }
        return tenant;
    }
    async createTenant(dto) {
        const cleanCode = dto.code.trim().toUpperCase();
        if (cleanCode === 'JNC' || cleanCode === 'JNC-ORG-001') {
            throw new common_1.BadRequestException(`Cannot provision tenant with reserved internal code '${cleanCode}'`);
        }
        const cleanSlug = (dto.slug || cleanCode.toLowerCase()).trim().replace(/[^a-z0-9-]/gi, '-');
        const existing = await this.prisma.tenant.findFirst({
            where: {
                OR: [{ code: cleanCode }, { slug: cleanSlug }],
            },
        });
        if (existing) {
            if (existing.isInternal) {
                throw new common_1.BadRequestException(`Cannot use code '${cleanCode}' reserved for platform owner company`);
            }
            throw new common_1.ConflictException(`Company with code '${cleanCode}' or slug '${cleanSlug}' already exists`);
        }
        const adminEmail = dto.adminEmail.trim().toLowerCase();
        const existingUser = await this.prisma.user.findFirst({
            where: { email: adminEmail },
        });
        if (existingUser) {
            throw new common_1.ConflictException(`User with email '${adminEmail}' is already registered in the system`);
        }
        const tempPassword = dto.adminPassword || 'Admin@123456';
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        const adminEmployeeCode = cleanCode.startsWith('JNC-') ? `${cleanCode}-SA-001` : `JNC-${cleanCode}-SA-001`;
        const result = await this.prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    code: cleanCode,
                    name: dto.name.trim(),
                    slug: cleanSlug,
                    status: 'active',
                    planTier: dto.planTier || 'standard',
                    maxUsers: dto.maxUsers || 10,
                    phone: dto.adminPhone || null,
                    email: adminEmail,
                    address: dto.address || null,
                    city: dto.city || null,
                    state: dto.state || 'Karnataka',
                    gstin: dto.gstin || null,
                    invoicePrefix: cleanCode,
                },
            });
            const adminUser = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    employeeCode: adminEmployeeCode,
                    name: dto.adminName.trim(),
                    email: adminEmail,
                    phone: dto.adminPhone || null,
                    passwordHash,
                    role: 'tenant_admin',
                    isActive: true,
                    mustResetPassword: true,
                },
            });
            await tx.warehouse.create({
                data: {
                    tenantId: tenant.id,
                    code: `${cleanCode}-WH-MAIN`,
                    name: `${dto.name} Main Warehouse`,
                    city: dto.city || 'Bengaluru',
                    isActive: true,
                },
            });
            return { tenant, adminUser };
        });
        let emailDispatched = false;
        let emailStatusMessage = 'Email not requested';
        if (dto.sendEmail !== false) {
            const loginUrl = dto.appUrl || process.env.APP_URL || 'http://localhost:5173/login';
            const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em; }
    .header p { margin: 4px 0 0; font-size: 13px; color: #94a3b8; }
    .body { padding: 28px; }
    .creds-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin: 20px 0; }
    .table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .table td { padding: 8px 4px; vertical-align: middle; }
    .label { width: 140px; color: #64748b; font-weight: 600; }
    .val { color: #0f172a; font-weight: 600; }
    .code-badge { font-family: monospace; font-size: 15px; font-weight: 700; color: #2563eb; }
    .pass-badge { font-family: monospace; font-size: 16px; font-weight: 700; color: #b91c1c; background: #fee2e2; padding: 4px 10px; border-radius: 6px; display: inline-block; }
    .btn-container { text-align: center; margin: 28px 0 10px; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2); }
    .footer { border-top: 1px solid #f1f5f9; padding: 16px 28px; text-align: center; font-size: 12px; color: #94a3b8; background: #fafafa; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Welcome to JNC CRM Platform</h1>
      <p>Company Workspace Provisioned for ${result.tenant.name}</p>
    </div>
    <div class="body">
      <p>Hello <strong>${result.adminUser.name}</strong>,</p>
      <p>Your company's isolated CRM workspace has been successfully created. Below are your official Super Admin access credentials to sign in:</p>
      
      <div class="creds-box">
        <table class="table">
          <tr>
            <td class="label">Company:</td>
            <td class="val">${result.tenant.name} (${result.tenant.code})</td>
          </tr>
          <tr>
            <td class="label">User ID / Code:</td>
            <td><span class="code-badge">${result.adminUser.employeeCode}</span></td>
          </tr>
          <tr>
            <td class="label">Login Email:</td>
            <td class="val font-mono">${result.adminUser.email}</td>
          </tr>
          <tr>
            <td class="label">Temporary Password:</td>
            <td><span class="pass-badge">${tempPassword}</span></td>
          </tr>
          <tr>
            <td class="label">Access Role:</td>
            <td class="val">Company Super Admin (Tenant Admin)</td>
          </tr>
          <tr>
            <td class="label">User Seats:</td>
            <td class="val">${result.tenant.maxUsers} Licenses</td>
          </tr>
        </table>
      </div>

      <div class="btn-container">
        <a href="${loginUrl}" class="btn">Login to Your CRM Workspace</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 4px;">For security, please change your temporary password upon your first sign in.</p>
      <p style="margin: 0;">JNC CRM Multi-Tenant Cloud Platform</p>
    </div>
  </div>
</body>
</html>
      `;
            try {
                await this.notificationsService.sendEmail({
                    to: result.adminUser.email,
                    subject: `[JNC CRM] Welcome! Your CRM Workspace Access Credentials for ${result.tenant.name}`,
                    html: emailHtml,
                    text: `Hello ${result.adminUser.name},\n\nYour company's CRM workspace has been provisioned:\n\nCompany: ${result.tenant.name} (${result.tenant.code})\nUser ID: ${result.adminUser.employeeCode}\nEmail: ${result.adminUser.email}\nTemporary Password: ${tempPassword}\nLogin URL: ${loginUrl}\n\nPlease change your temporary password upon first login.`,
                    tenantId: result.tenant.id,
                });
                emailDispatched = true;
                emailStatusMessage = `Credentials email dispatched successfully to ${result.adminUser.email}`;
            }
            catch (err) {
                emailDispatched = false;
                emailStatusMessage = `Company created, but email could not be sent: ${err?.message || 'SMTP error'}`;
            }
        }
        return {
            message: 'Company workspace and Tenant Admin created successfully',
            emailDispatched,
            emailStatusMessage,
            tenant: result.tenant,
            adminUser: {
                id: result.adminUser.id,
                employeeCode: result.adminUser.employeeCode,
                name: result.adminUser.name,
                email: result.adminUser.email,
                role: result.adminUser.role,
                tempPassword,
            },
        };
    }
    async updateTenant(id, dto) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
            include: { users: true },
        });
        if (!tenant)
            throw new common_1.NotFoundException('Company tenant not found');
        if (tenant.isInternal) {
            throw new common_1.ForbiddenException('This is the platform owner company and cannot be managed here.');
        }
        const { name, status, planTier, maxUsers, phone, email, invoicePrefix, logoUrl, } = dto;
        const updated = await this.prisma.tenant.update({
            where: { id },
            data: {
                ...(name !== undefined ? { name: name.trim() } : {}),
                ...(status !== undefined ? { status } : {}),
                ...(planTier !== undefined ? { planTier } : {}),
                ...(maxUsers !== undefined ? { maxUsers: Number(maxUsers) } : {}),
                ...(phone !== undefined ? { phone: phone?.trim() } : {}),
                ...(email !== undefined ? { email: email?.trim() } : {}),
                ...(invoicePrefix !== undefined ? { invoicePrefix: invoicePrefix?.trim() } : {}),
                ...(logoUrl !== undefined ? { logoUrl } : {}),
            },
        });
        if (email || phone) {
            const adminUser = tenant.users.find((u) => u.role === 'tenant_admin' || u.role === 'admin') ||
                tenant.users[0];
            if (adminUser) {
                await this.prisma.user.update({
                    where: { id: adminUser.id },
                    data: {
                        ...(email ? { email: email.trim().toLowerCase() } : {}),
                        ...(phone ? { phone: phone.trim() } : {}),
                    },
                });
            }
        }
        return updated;
    }
    async deleteTenant(id) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id } });
        if (!tenant)
            throw new common_1.NotFoundException('Company tenant not found');
        if (tenant.isInternal) {
            throw new common_1.ForbiddenException('This is the platform owner company and cannot be managed here.');
        }
        await this.prisma.tenant.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'suspended' },
        });
        return { message: 'Company workspace deactivated successfully' };
    }
    async impersonateTenant(id, actor, ipAddress) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
            include: {
                users: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'asc' },
                    take: 5,
                },
            },
        });
        if (!tenant)
            throw new common_1.NotFoundException('Company workspace not found');
        if (tenant.isInternal) {
            throw new common_1.ForbiddenException('This is the platform owner company and cannot be managed here.');
        }
        const targetUser = tenant.users.find((u) => u.role === 'tenant_admin' || u.role === 'admin') ||
            tenant.users[0];
        if (!targetUser) {
            throw new common_1.BadRequestException('No active user accounts found in this company workspace.');
        }
        const payload = {
            sub: targetUser.id,
            email: targetUser.email,
            employeeCode: targetUser.employeeCode,
            role: targetUser.role,
            tenantId: tenant.id,
            isImpersonating: true,
            impersonatedTenantName: tenant.name,
            impersonatedTenantCode: tenant.code,
        };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
        try {
            await this.prisma.auditLog.create({
                data: {
                    tenantId: tenant.id,
                    actorId: actor?.sub || actor?.id || 'platform-admin',
                    actorName: actor?.name || 'Platform Administrator',
                    action: 'IMPERSONATION_START',
                    entityName: 'Tenant',
                    entityId: tenant.id,
                    afterState: JSON.stringify({
                        impersonatedUserId: targetUser.id,
                        impersonatedUserEmail: targetUser.email,
                        impersonatedRole: targetUser.role,
                        tenantCode: tenant.code,
                        tenantName: tenant.name,
                    }),
                    ipAddress: ipAddress || '127.0.0.1',
                },
            });
        }
        catch {
        }
        return {
            accessToken,
            user: {
                id: targetUser.id,
                tenantId: tenant.id,
                employeeCode: targetUser.employeeCode,
                name: targetUser.name,
                email: targetUser.email,
                role: targetUser.role,
                isImpersonating: true,
                impersonatedTenantName: tenant.name,
                impersonatedTenantCode: tenant.code,
                tenant: {
                    id: tenant.id,
                    code: tenant.code,
                    name: tenant.name,
                    slug: tenant.slug,
                    status: tenant.status,
                    planTier: tenant.planTier,
                    maxUsers: tenant.maxUsers,
                    logoUrl: tenant.logoUrl,
                    phone: tenant.phone,
                    email: tenant.email,
                    gstin: tenant.gstin,
                    city: tenant.city,
                    state: tenant.state,
                },
            },
        };
    }
    async resetTenantAdminPassword(tenantId, dto) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                users: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!tenant)
            throw new common_1.NotFoundException('Company workspace not found');
        if (tenant.isInternal) {
            throw new common_1.ForbiddenException('This is the platform owner company and cannot be managed here.');
        }
        const adminUser = tenant.users.find((u) => u.role === 'tenant_admin' || u.role === 'admin') ||
            tenant.users[0];
        if (!adminUser) {
            throw new common_1.BadRequestException('No active user accounts found in this company workspace to reset.');
        }
        const targetEmail = (dto?.adminEmail?.trim() || tenant.email || adminUser.email).trim().toLowerCase();
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*()_+';
        let generatedPass = '';
        for (let i = 0; i < 14; i++) {
            generatedPass += chars.charAt(crypto.randomInt(0, chars.length));
        }
        const passwordToSet = dto?.newPassword?.trim() || generatedPass;
        const passwordHash = await bcrypt.hash(passwordToSet, 10);
        await this.prisma.user.update({
            where: { id: adminUser.id },
            data: {
                email: targetEmail,
                passwordHash,
                mustResetPassword: true,
                isActive: true,
                tokenVersion: { increment: 1 },
            },
        });
        try {
            await this.prisma.accountLockout.deleteMany({
                where: {
                    OR: [
                        { identityKey: targetEmail },
                        { identityKey: `${targetEmail}:${tenant.id}` },
                        { identityKey: adminUser.email.toLowerCase() },
                        { identityKey: `${adminUser.email.toLowerCase()}:${tenant.id}` },
                    ],
                },
            });
        }
        catch { }
        if (targetEmail && targetEmail !== tenant.email) {
            await this.prisma.tenant.update({
                where: { id: tenantId },
                data: { email: targetEmail },
            });
        }
        adminUser.email = targetEmail;
        let emailDispatched = false;
        let emailStatusMessage = 'Email not requested';
        if (dto?.sendEmail !== false) {
            const loginUrl = dto?.appUrl || process.env.APP_URL || 'http://localhost:5173/login';
            const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em; }
    .header p { margin: 4px 0 0; font-size: 13px; color: #94a3b8; }
    .body { padding: 28px; }
    .creds-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin: 20px 0; }
    .table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .table td { padding: 8px 4px; vertical-align: middle; }
    .label { width: 140px; color: #64748b; font-weight: 600; }
    .val { color: #0f172a; font-weight: 600; }
    .code-badge { font-family: monospace; font-size: 15px; font-weight: 700; color: #2563eb; }
    .pass-badge { font-family: monospace; font-size: 16px; font-weight: 700; color: #b91c1c; background: #fee2e2; padding: 4px 10px; border-radius: 6px; display: inline-block; }
    .btn-container { text-align: center; margin: 28px 0 10px; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2); }
    .footer { border-top: 1px solid #f1f5f9; padding: 16px 28px; text-align: center; font-size: 12px; color: #94a3b8; background: #fafafa; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Company CRM Access Credentials</h1>
      <p>Super Admin Access for ${tenant.name}</p>
    </div>
    <div class="body">
      <p>Hello <strong>${adminUser.name}</strong>,</p>
      <p>The Super Admin credentials for your company's CRM workspace have been reset. Below are your updated access details to sign in to your dedicated environment:</p>
      
      <div class="creds-box">
        <table class="table">
          <tr>
            <td class="label">Company:</td>
            <td class="val">${tenant.name} (${tenant.code})</td>
          </tr>
          <tr>
            <td class="label">User ID / Code:</td>
            <td><span class="code-badge">${adminUser.employeeCode}</span></td>
          </tr>
          <tr>
            <td class="label">Login Email:</td>
            <td class="val font-mono">${adminUser.email}</td>
          </tr>
          <tr>
            <td class="label">New Password:</td>
            <td><span class="pass-badge">${passwordToSet}</span></td>
          </tr>
          <tr>
            <td class="label">Access Role:</td>
            <td class="val">Company Super Admin</td>
          </tr>
        </table>
      </div>

      <div class="btn-container">
        <a href="${loginUrl}" class="btn">Login to Company CRM</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 4px;">For security, please change your password after logging in.</p>
      <p style="margin: 0;">JNC CRM Multi-Tenant Cloud Platform</p>
    </div>
  </div>
</body>
</html>
      `;
            try {
                await this.notificationsService.sendEmail({
                    to: adminUser.email,
                    subject: `[JNC CRM] Super Admin Access Credentials for ${tenant.name}`,
                    html: emailHtml,
                    text: `Hello ${adminUser.name},\n\nYour Super Admin credentials for ${tenant.name} have been updated:\n\nCompany: ${tenant.name} (${tenant.code})\nUser ID: ${adminUser.employeeCode}\nEmail: ${adminUser.email}\nPassword: ${passwordToSet}\nLogin URL: ${loginUrl}\n\nPlease change your password after logging in.`,
                    tenantId: tenant.id,
                });
                emailDispatched = true;
                emailStatusMessage = `Credentials email sent successfully to ${adminUser.email}`;
            }
            catch (err) {
                emailDispatched = false;
                emailStatusMessage = `Password updated, but email sending failed: ${err?.message || 'SMTP error'}`;
            }
        }
        return {
            success: true,
            message: 'Super Admin password reset successfully',
            emailDispatched,
            emailStatusMessage,
            adminUser: {
                id: adminUser.id,
                employeeCode: adminUser.employeeCode,
                name: adminUser.name,
                email: adminUser.email,
                role: adminUser.role,
            },
            tenant: {
                id: tenant.id,
                code: tenant.code,
                name: tenant.name,
            },
            tempPassword: passwordToSet,
        };
    }
    async listPlatformAdmins() {
        return this.prisma.user.findMany({
            where: {
                role: 'platform_super_admin',
                tenantId: null,
                deletedAt: null,
            },
            select: {
                id: true,
                employeeCode: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                mustResetPassword: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async createPlatformAdmin(dto, actor) {
        const cleanEmail = dto.email.trim().toLowerCase();
        const existing = await this.prisma.user.findFirst({
            where: { email: cleanEmail },
        });
        if (existing) {
            throw new common_1.ConflictException(`User with email '${cleanEmail}' already exists`);
        }
        const count = await this.prisma.user.count({
            where: { role: 'platform_super_admin', tenantId: null },
        });
        const employeeCode = `PSA-${String(count + 1).padStart(3, '0')}`;
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*()_+';
        let tempPassword = '';
        for (let i = 0; i < 14; i++) {
            tempPassword += chars.charAt(crypto.randomInt(0, chars.length));
        }
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        const newUser = await this.prisma.user.create({
            data: {
                name: dto.name.trim(),
                email: cleanEmail,
                phone: dto.phone?.trim() || null,
                employeeCode,
                role: 'platform_super_admin',
                tenantId: null,
                passwordHash,
                isActive: true,
                mustResetPassword: true,
            },
            select: {
                id: true,
                employeeCode: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                mustResetPassword: true,
                createdAt: true,
            },
        });
        return {
            message: 'Platform administrator account created successfully',
            user: newUser,
            tempPassword,
        };
    }
    async togglePlatformAdminActive(id, requestedState) {
        const target = await this.prisma.user.findFirst({
            where: { id, role: 'platform_super_admin', tenantId: null },
        });
        if (!target)
            throw new common_1.NotFoundException('Platform administrator not found');
        const nextState = requestedState !== undefined ? requestedState : !target.isActive;
        if (!nextState) {
            const activeCount = await this.prisma.user.count({
                where: { role: 'platform_super_admin', tenantId: null, isActive: true },
            });
            if (activeCount <= 1) {
                throw new common_1.BadRequestException('Cannot deactivate the last active Platform Administrator.');
            }
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                isActive: nextState,
                tokenVersion: { increment: 1 },
            },
            select: {
                id: true,
                employeeCode: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
            },
        });
        return {
            message: `Platform administrator ${nextState ? 'activated' : 'deactivated'} successfully`,
            user: updated,
        };
    }
    async resetPlatformAdminUserPassword(id) {
        const target = await this.prisma.user.findFirst({
            where: { id, role: 'platform_super_admin', tenantId: null },
        });
        if (!target)
            throw new common_1.NotFoundException('Platform administrator not found');
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*()_+';
        let tempPassword = '';
        for (let i = 0; i < 14; i++) {
            tempPassword += chars.charAt(crypto.randomInt(0, chars.length));
        }
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        await this.prisma.user.update({
            where: { id },
            data: {
                passwordHash,
                mustResetPassword: true,
                tokenVersion: { increment: 1 },
            },
        });
        return {
            message: `Password for platform administrator ${target.name} has been reset.`,
            tempPassword,
            user: target,
        };
    }
};
exports.PlatformService = PlatformService;
exports.PlatformService = PlatformService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        notifications_service_1.NotificationsService])
], PlatformService);
