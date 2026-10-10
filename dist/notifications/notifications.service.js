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
                };
            }
        }
        const primaryUser = process.env.SMTP_USER || '';
        const primaryPass = process.env.SMTP_PASS || '';
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
            const primaryFrom = process.env.EMAIL_FROM || process.env.SMTP_FROM || primaryUser;
            if (process.env.SMTP_FROM && !process.env.EMAIL_FROM) {
                this.logger.warn("[ENV WARNING] 'SMTP_FROM' is deprecated, please use canonical 'EMAIL_FROM'.");
            }
            return {
                transporter,
                fromEmail: primaryFrom,
                senderName: brand_1.BRAND_CONFIG.displayName,
            };
        }
        return {
            transporter: null,
            fromEmail: 'noreply@jsnc.co.in',
            senderName: 'System Notification',
        };
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
    async sendViaResend(apiKey, options, defaultFrom, displayName) {
        return new Promise((resolve) => {
            const https = require('https');
            const configuredFrom = process.env.RESEND_FROM || defaultFrom;
            let fromAddr = 'JNC CRM <onboarding@resend.dev>';
            if (configuredFrom && !configuredFrom.toLowerCase().includes('@gmail.com')) {
                fromAddr = configuredFrom.includes('<') ? configuredFrom : `"${displayName || 'JNC CRM'}" <${configuredFrom}>`;
            }
            const payload = JSON.stringify({
                from: fromAddr,
                to: Array.isArray(options.to) ? options.to : [options.to],
                subject: options.subject,
                html: options.html || undefined,
                text: options.text || undefined,
            });
            const req = https.request({
                hostname: 'api.resend.com',
                path: '/emails',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey.trim()}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                },
                timeout: 10000,
            }, (res) => {
                let resBody = '';
                res.on('data', (d) => resBody += d);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(resBody);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve({ success: true, messageId: parsed.id });
                        } else {
                            resolve({ success: false, errorMessage: parsed.message || `Resend error (${res.statusCode})` });
                        }
                    } catch (e) {
                        resolve({ success: false, errorMessage: `Resend parse error (${res.statusCode})` });
                    }
                });
            });
            req.on('error', (err) => resolve({ success: false, errorMessage: err.message || 'Resend network error' }));
            req.on('timeout', () => {
                req.destroy();
                resolve({ success: false, errorMessage: 'Resend request timeout' });
            });
            req.write(payload);
            req.end();
        });
    }
    async sendEmail(options) {
        const tenantId = await this.resolveNotificationTenantId(options.tenantId);
        const isInvoice = options.senderType === 'invoice' || options.relatedEntityType === 'invoice';
        const branding = await this.getBranding(tenantId);
        const { transporter, fromEmail, senderName } = await this.getTenantTransporter(tenantId, isInvoice ? 'invoice' : (options.senderType || 'primary'));
        const fromAddress = options.from || fromEmail;
        const senderDisplayName = options.from ? branding.companyDisplayName : senderName;
        this.logger.log(`[TENANT EMAIL] Tenant: ${tenantId} | From: ${fromAddress} | To: ${options.to} | Subject: ${options.subject}`);
        let status = 'failed';
        let errorMessage = null;
        let transportInfo = null;
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey && resendApiKey.trim()) {
            this.logger.log(`[RESEND DISPATCH] Sending to ${options.to} via Resend HTTPS API`);
            const resendResult = await this.sendViaResend(resendApiKey, options, fromAddress, senderDisplayName);
            if (resendResult.success) {
                status = 'sent';
                transportInfo = { messageId: resendResult.messageId };
                this.logger.log(`[RESEND SUCCESS] MessageId: ${resendResult.messageId} | To: ${options.to}`);
            } else {
                this.logger.warn(`[RESEND FAILED] ${resendResult.errorMessage}. Falling back to SMTP...`);
                errorMessage = resendResult.errorMessage;
            }
        }
        if (status !== 'sent') {
            if (!transporter) {
                if (!errorMessage) {
                    this.logger.warn(`No SMTP account registered for tenant ${tenantId}. Message logged without outward SMTP transmission.`);
                    status = 'queued';
                    errorMessage = 'No tenant SMTP account configured. Message stored in in-app log.';
                }
            }
            else {
                try {
                    transportInfo = await transporter.sendMail({
                        from: `"${senderDisplayName}" <${fromAddress}>`,
                        to: options.to,
                        subject: options.subject,
                        html: options.html,
                        text: options.text,
                        attachments: options.attachments,
                    });
                    if (transportInfo && (transportInfo.accepted?.length > 0 || transportInfo.messageId)) {
                        status = 'sent';
                        errorMessage = null;
                        this.logger.log(`[EMAIL DISPATCH SUCCESS] MessageId: ${transportInfo.messageId} | To: ${options.to}`);
                    }
                    else {
                        status = 'failed';
                        errorMessage = `SMTP server rejected recipient: ${JSON.stringify(transportInfo?.rejected || 'Unknown rejection')}`;
                        this.logger.error(errorMessage);
                    }
                }
                catch (err) {
                    this.logger.error(`Failed to send email to ${options.to}: ${err.message}`);
                    status = 'failed';
                    errorMessage = err.message || 'SMTP network or authentication failure';
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
        });
        return {
            success: status === 'sent',
            recipient: options.to,
            messageId: transportInfo?.messageId || null,
            status,
            errorMessage,
        };
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
            await this.prisma.messageLog.create({
                data: {
                    tenantId,
                    channel: 'in_app',
                    recipient: options.userId || 'Unassigned',
                    subject: options.title,
                    body: options.description || options.title,
                    status: 'sent',
                    relatedEntityType: 'lead',
                    relatedEntityId: options.leadId,
                },
            });
            return { success: true };
        }
        catch (err) {
            this.logger.error(`Failed to create in-app task: ${err.message}`);
            return { success: false, error: err.message };
        }
    }
    async sendSms(phone, text) {
        this.logger.log(`[SMS DISPATCH] Simulated SMS to ${phone}: ${text}`);
        return { success: true };
    }
    async syncGoDaddyInbox() {
        this.logger.log(`[IMAP SYNC] Synchronizing inbox`);
        return { message: 'Inbox synchronized successfully', count: 0 };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
