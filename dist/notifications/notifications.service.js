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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const encryption_util_1 = require("../common/encryption.util");
const brand_1 = require("../common/brand");
const nodemailer = require("nodemailer");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(NotificationsService_1.name);
        this.transporterCache = new Map();
    }
    getMailProvider() {
        const raw = (process.env.MAIL_PROVIDER || '').trim().toLowerCase();
        if (raw === 'brevo')
            return 'brevo';
        if (raw === 'resend')
            return 'resend';
        if (raw === 'smtp')
            return 'smtp';
        if (process.env.RESEND_API_KEY)
            return 'resend';
        if (process.env.BREVO_API_KEY)
            return 'brevo';
        return 'smtp';
    }
    async getTenantTransporter(tenantId, senderType = 'primary') {
        const targetTenantId = tenantId;
        if (targetTenantId) {
            const mailAccount = await this.prisma.mailAccount.findFirst({
                where: {
                    tenantId: targetTenantId,
                    isActive: true,
                    OR: [
                        { purpose: senderType === 'invoice' ? 'BILLING_INVOICES' : 'PRIMARY_ALERTS' },
                        { purpose: 'PRIMARY_ALERTS' },
                        { purpose: 'SALES_OUTBOUND' },
                    ],
                },
                orderBy: { createdAt: 'desc' },
            });
            if (mailAccount) {
                const cacheKey = `${mailAccount.id}_${mailAccount.smtpHost}_${mailAccount.smtpUser}`;
                let transporter = this.transporterCache.get(cacheKey);
                if (!transporter) {
                    transporter = nodemailer.createTransport({
                        host: mailAccount.smtpHost,
                        port: mailAccount.smtpPort,
                        secure: mailAccount.isSecure || mailAccount.smtpPort === 465,
                        pool: true,
                        maxConnections: 5,
                        maxMessages: 100,
                        auth: {
                            user: mailAccount.smtpUser,
                            pass: (0, encryption_util_1.decryptAtRest)(mailAccount.smtpPass) || mailAccount.smtpPass,
                        },
                        tls: { rejectUnauthorized: false },
                        connectionTimeout: 5000,
                        greetingTimeout: 5000,
                        socketTimeout: 8000,
                    });
                    this.transporterCache.set(cacheKey, transporter);
                }
                return {
                    transporter,
                    fromEmail: mailAccount.email,
                    senderName: mailAccount.senderName || mailAccount.name,
                    isCustomTenantAccount: true,
                };
            }
        }
        const primaryUser = process.env.SMTP_USER || '';
        const primaryPass = process.env.SMTP_PASS || '';
        const primaryFrom = process.env.EMAIL_FROM || process.env.PRIMARY_EMAIL_FROM || primaryUser || 'noreply@jsnc.co.in';
        if (primaryUser && primaryPass) {
            const isGmail = primaryUser.toLowerCase().includes('@gmail.com');
            const host = process.env.SMTP_HOST || (isGmail ? 'smtp.gmail.com' : 'smtpout.secureserver.net');
            const port = Number(process.env.SMTP_PORT) || (isGmail ? 465 : 587);
            let transporter = this.transporterCache.get('default_root_smtp');
            if (!transporter) {
                transporter = nodemailer.createTransport({
                    host,
                    port,
                    secure: port === 465,
                    pool: true,
                    maxConnections: 5,
                    maxMessages: 100,
                    auth: { user: primaryUser, pass: primaryPass },
                    tls: { rejectUnauthorized: false },
                    connectionTimeout: 5000,
                    greetingTimeout: 5000,
                    socketTimeout: 8000,
                });
                this.transporterCache.set('default_root_smtp', transporter);
            }
            return {
                transporter,
                fromEmail: primaryFrom,
                senderName: brand_1.BRAND_CONFIG.displayName,
                isCustomTenantAccount: false,
            };
        }
        return {
            transporter: null,
            fromEmail: primaryFrom,
            senderName: brand_1.BRAND_CONFIG.displayName,
            isCustomTenantAccount: false,
        };
    }
    async sendViaBrevo(options, fromEmail, senderName) {
        const apiKey = process.env.BREVO_API_KEY;
        if (!apiKey || !apiKey.trim()) {
            return { success: false, error: 'BREVO_API_KEY environment variable is not configured' };
        }
        const payload = {
            sender: { name: senderName, email: fromEmail },
            to: [{ email: options.to }],
            subject: options.subject,
            htmlContent: options.html,
            textContent: options.text || undefined,
        };
        try {
            const res = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'api-key': apiKey.trim(),
                    'accept': 'application/json',
                    'content-type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && (data.messageId || data.messageIds)) {
                return { success: true, messageId: data.messageId || (data.messageIds && data.messageIds[0]) || 'brevo-sent' };
            }
            const errMsg = data.message || data.code || `Brevo HTTP ${res.status}`;
            return { success: false, error: errMsg };
        }
        catch (err) {
            return { success: false, error: err.message || 'Brevo HTTPS network request failed' };
        }
    }
    async sendViaResend(options, fromEmail, senderName) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey || !apiKey.trim()) {
            return { success: false, error: 'RESEND_API_KEY environment variable is not configured' };
        }
        const configuredFrom = process.env.RESEND_FROM;
        let effectiveFrom = configuredFrom || fromEmail || 'crm@admin.jsnc.co.in';
        if (effectiveFrom.toLowerCase().includes('@gmail.com')) {
            effectiveFrom = configuredFrom || 'crm@admin.jsnc.co.in';
        }
        const fromFormatted = effectiveFrom.includes('<')
            ? effectiveFrom
            : `"${senderName || 'JNC CRM'}" <${effectiveFrom}>`;
        const replyTo = process.env.REPLY_TO || process.env.EMAIL_FROM || 'jsnccrm@gmail.com';
        const payload = {
            from: fromFormatted,
            to: Array.isArray(options.to) ? options.to : [options.to],
            subject: options.subject,
            html: options.html,
            text: options.text || undefined,
            reply_to: replyTo,
        };
        try {
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey.trim()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.id) {
                return { success: true, messageId: data.id };
            }
            const errMsg = data.message || data.name || `Resend HTTP ${res.status}`;
            return { success: false, error: errMsg };
        }
        catch (err) {
            return { success: false, error: err.message || 'Resend HTTPS network request failed' };
        }
    }
    sanitizeBodyForLog(rawBody) {
        if (!rawBody)
            return '';
        return rawBody
            .replace(/(Temporary Password:\s*(?:<\/strong>\s*)?<code>)([^<]+)(<\/code>)/gi, '$1[REDACTED_FOR_SECURITY]$3')
            .replace(/(Password:\s*(?:<\/strong>\s*)?<code>)([^<]+)(<\/code>)/gi, '$1[REDACTED_FOR_SECURITY]$3')
            .replace(/(Temporary Password:\s*)([^\s<]+)/gi, '$1[REDACTED_FOR_SECURITY]')
            .replace(/(Password:\s*)([^\s<]+)/gi, '$1[REDACTED_FOR_SECURITY]');
    }
    async getBranding(tenantId) {
        if (tenantId) {
            try {
                const tenant = await this.prisma.tenant.findUnique({
                    where: { id: tenantId },
                    select: { name: true, phone: true, logoUrl: true },
                });
                if (tenant) {
                    return {
                        companyDisplayName: tenant.name || 'JNC CRM',
                        companyPhone: tenant.phone || '+91 9663421455',
                        companyLogoUrl: tenant.logoUrl || '/jnc-logo.jpg',
                    };
                }
            }
            catch { }
        }
        return {
            companyDisplayName: brand_1.BRAND_CONFIG.displayName,
            companyPhone: '+91 9663421455',
            companyLogoUrl: '/jnc-logo.jpg',
        };
    }
    async resolveNotificationTenantId(tenantId) {
        if (tenantId && tenantId.trim())
            return tenantId;
        const jnc = await this.prisma.tenant.findFirst({
            where: { code: 'JNC' },
            select: { id: true },
        });
        if (jnc)
            return jnc.id;
        const anyTenant = await this.prisma.tenant.findFirst({ select: { id: true } });
        return anyTenant?.id || '';
    }
    async sendEmail(options) {
        const tenantId = await this.resolveNotificationTenantId(options.tenantId);
        const isInvoice = options.senderType === 'invoice' || options.relatedEntityType === 'invoice';
        const branding = await this.getBranding(tenantId);
        const reqId = options.requestId || 'no-req-id';
        const tenantTransporterInfo = await this.getTenantTransporter(tenantId, isInvoice ? 'invoice' : (options.senderType || 'primary'));
        const fromEmail = options.from || process.env.EMAIL_FROM || process.env.PRIMARY_EMAIL_FROM || tenantTransporterInfo.fromEmail;
        const senderName = options.from ? branding.companyDisplayName : tenantTransporterInfo.senderName;
        const mailProvider = this.getMailProvider();
        let status = 'failed';
        let errorMessage = null;
        let messageId = null;
        let providerUsed = mailProvider;
        if (tenantTransporterInfo.isCustomTenantAccount && tenantTransporterInfo.transporter) {
            providerUsed = 'smtp-tenant';
            try {
                const info = await tenantTransporterInfo.transporter.sendMail({
                    from: `"${senderName}" <${fromEmail}>`,
                    to: options.to,
                    subject: options.subject,
                    html: options.html,
                    text: options.text,
                    attachments: options.attachments,
                });
                if (info && (info.accepted?.length > 0 || info.messageId)) {
                    status = 'sent';
                    messageId = info.messageId;
                    this.logger.log(`[MAIL DISPATCH SUCCESS] ReqId: ${reqId} | Provider: smtp-tenant | To: ${options.to} | MessageId: ${messageId}`);
                }
                else {
                    status = 'failed';
                    errorMessage = 'Tenant SMTP rejected recipient';
                    this.logger.error(`[MAIL ERROR] ReqId: ${reqId} | Provider: smtp-tenant | To: ${options.to} | Reason: ${errorMessage}`);
                }
            }
            catch (err) {
                status = 'failed';
                errorMessage = err.message || 'Tenant SMTP connection failed';
                this.logger.error(`[MAIL ERROR] ReqId: ${reqId} | Provider: smtp-tenant | To: ${options.to} | Reason: ${errorMessage}`);
            }
        }
        else if (mailProvider === 'brevo') {
            const result = await this.sendViaBrevo(options, fromEmail, senderName);
            if (result.success) {
                status = 'sent';
                messageId = result.messageId || null;
                this.logger.log(`[MAIL DISPATCH SUCCESS] ReqId: ${reqId} | Provider: brevo | To: ${options.to} | MessageId: ${messageId}`);
            }
            else {
                status = 'failed';
                errorMessage = result.error || 'Brevo API sending failed';
                this.logger.error(`[MAIL ERROR] ReqId: ${reqId} | Provider: brevo | To: ${options.to} | Reason: ${errorMessage}`);
            }
        }
        else if (mailProvider === 'resend') {
            const result = await this.sendViaResend(options, fromEmail, senderName);
            if (result.success) {
                status = 'sent';
                messageId = result.messageId || null;
                this.logger.log(`[MAIL DISPATCH SUCCESS] ReqId: ${reqId} | Provider: resend | To: ${options.to} | MessageId: ${messageId}`);
            }
            else {
                status = 'failed';
                errorMessage = result.error || 'Resend API sending failed';
                this.logger.error(`[MAIL ERROR] ReqId: ${reqId} | Provider: resend | To: ${options.to} | Reason: ${errorMessage}`);
            }
        }
        else {
            if (!tenantTransporterInfo.transporter) {
                const isMissingPass = !process.env.SMTP_PASS;
                status = 'queued';
                errorMessage = isMissingPass
                    ? 'SMTP_PASS missing in server environment variables. Configure SMTP_PASS or set MAIL_PROVIDER=brevo/resend.'
                    : 'No system SMTP transporter configured.';
                this.logger.warn(`[MAIL ERROR] ReqId: ${reqId} | Provider: smtp | To: ${options.to} | Reason: ${errorMessage}`);
            }
            else {
                try {
                    const info = await tenantTransporterInfo.transporter.sendMail({
                        from: `"${senderName}" <${fromEmail}>`,
                        to: options.to,
                        subject: options.subject,
                        html: options.html,
                        text: options.text,
                        attachments: options.attachments,
                    });
                    if (info && (info.accepted?.length > 0 || info.messageId)) {
                        status = 'sent';
                        messageId = info.messageId;
                        this.logger.log(`[MAIL DISPATCH SUCCESS] ReqId: ${reqId} | Provider: smtp | To: ${options.to} | MessageId: ${messageId}`);
                    }
                    else {
                        status = 'failed';
                        errorMessage = 'System SMTP rejected recipient';
                        this.logger.error(`[MAIL ERROR] ReqId: ${reqId} | Provider: smtp | To: ${options.to} | Reason: ${errorMessage}`);
                    }
                }
                catch (err) {
                    status = 'failed';
                    errorMessage = err.message || 'System SMTP connection failed';
                    this.logger.error(`[MAIL ERROR] ReqId: ${reqId} | Provider: smtp | To: ${options.to} | Reason: ${errorMessage}`);
                }
            }
        }
        const sanitizedBody = this.sanitizeBodyForLog(options.html || options.text || '');
        await this.prisma.messageLog.create({
            data: {
                tenantId,
                channel: 'email',
                recipient: options.to,
                subject: options.subject,
                body: sanitizedBody,
                status,
                errorMessage,
                relatedEntityType: options.relatedEntityType,
                relatedEntityId: options.relatedEntityId,
            },
        }).catch(() => { });
        if (status === 'failed') {
            throw new common_1.BadRequestException(errorMessage || `Failed to deliver email to ${options.to}`);
        }
        return { success: true, recipient: options.to, messageId, status, provider: providerUsed };
    }
    async sendTestMail(targetEmail, requestId) {
        const provider = this.getMailProvider();
        const testSubject = `[JNC CRM] Mail Provider Test (${provider.toUpperCase()})`;
        const testHtml = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2>Mail Provider Operational Test</h2>
        <p>This test email was sent using provider: <strong>${provider.toUpperCase()}</strong>.</p>
        <p>Time: ${new Date().toISOString()}</p>
      </div>
    `;
        try {
            const res = await this.sendEmail({
                to: targetEmail,
                subject: testSubject,
                html: testHtml,
                text: `Mail Provider Test (${provider.toUpperCase()}) - ${new Date().toISOString()}`,
                requestId,
            });
            return {
                provider,
                status: 'sent',
                messageId: res.messageId || undefined,
            };
        }
        catch (err) {
            return {
                provider,
                status: 'failed',
                errorText: err.message || 'Test email dispatch failed',
            };
        }
    }
    async createInAppTask(options) {
        const tenantId = options.tenantId || 'unassigned';
        this.logger.log(`[IN-APP TASK] Tenant: ${tenantId} | Lead: ${options.leadId} | Task: ${options.title} | User: ${options.userId || 'Unassigned'}`);
        try {
            await this.prisma.leadActivity.create({
                data: {
                    leadId: options.leadId,
                    userId: options.userId || null,
                    type: 'reminder',
                    title: options.title,
                    description: options.description || null,
                    scheduledAt: options.scheduledAt || new Date(),
                    isCompleted: false,
                },
            });
            return { success: true };
        }
        catch (err) {
            this.logger.error(`Failed to create in-app task: ${err.message}`);
            return { success: false, error: err.message };
        }
    }
    async sendSms(phone, message) {
        this.logger.log(`[SMS DISPATCH] To: ${phone} | Content: ${message.slice(0, 50)}...`);
        return { success: true, status: 'sent' };
    }
    async syncGoDaddyInbox() {
        this.logger.log(`[GODADDY SYNC] Syncing GoDaddy IMAP inbox...`);
        return { success: true, syncedCount: 0 };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
