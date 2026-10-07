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
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const leads_service_1 = require("../leads/leads.service");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto = require("crypto");
function stripHtml(val) {
    if (val === null || val === undefined)
        return undefined;
    if (typeof val !== 'string')
        return String(val);
    return val.replace(/<[^>]*>/g, '').trim();
}
let WebhooksService = WebhooksService_1 = class WebhooksService {
    constructor(leadsService, prisma) {
        this.leadsService = leadsService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(WebhooksService_1.name);
    }
    async findTenantByWebhookKey(plainKey) {
        if (!plainKey || typeof plainKey !== 'string') {
            throw new common_1.NotFoundException('Webhook key not provided.');
        }
        const keyHash = crypto.createHash('sha256').update(plainKey.trim()).digest('hex');
        const tenant = await this.prisma.tenant.findUnique({
            where: { webhookKeyHash: keyHash },
        });
        if (!tenant || tenant.deletedAt !== null || tenant.status !== 'active') {
            throw new common_1.NotFoundException('Webhook key not recognized or organization workspace is inactive.');
        }
        return tenant;
    }
    async regenerateWebhookKey(tenantId) {
        const plainKey = 'whk_' + crypto.randomBytes(24).toString('hex');
        const keyHash = crypto.createHash('sha256').update(plainKey).digest('hex');
        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { webhookKeyHash: keyHash },
        });
        return {
            webhookKey: plainKey,
            message: 'Webhook key regenerated successfully. Store this key securely; it will not be displayed again.',
        };
    }
    async getLegacyWebhookTenant() {
        const legacyCode = process.env.LEGACY_WEBHOOK_TENANT_CODE || 'JNC';
        const tenant = await this.prisma.tenant.findFirst({
            where: {
                code: { equals: legacyCode, mode: 'insensitive' },
                deletedAt: null,
            },
            select: { id: true, code: true, name: true },
        });
        if (tenant)
            return tenant;
        const internalTenant = await this.prisma.tenant.findFirst({
            where: { isInternal: true, deletedAt: null },
            select: { id: true, code: true, name: true },
        });
        if (internalTenant)
            return internalTenant;
        const fallback = await this.prisma.tenant.findFirst({
            where: { deletedAt: null },
            select: { id: true, code: true, name: true },
            orderBy: { createdAt: 'asc' },
        });
        if (fallback)
            return fallback;
        throw new common_1.NotFoundException(`No active organization found matching legacy webhook tenant code "${legacyCode}".`);
    }
    async logLegacyWebhookCall(params) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    tenantId: params.tenantId,
                    action: 'LEGACY_WEBHOOK_CALL',
                    entityName: 'Webhook',
                    entityId: params.endpoint,
                    actorName: 'LEGACY_WEBHOOK_FALLBACK',
                    beforeState: JSON.stringify({ sunsetDate: '2026-12-31', status: 'DEPRECATED' }),
                    afterState: JSON.stringify({ endpoint: params.endpoint, summary: params.payloadSummary ?? '' }),
                    ipAddress: params.ipAddress || '127.0.0.1',
                },
            });
        }
        catch (err) {
            this.logger.error(`Failed to record legacy webhook audit log: ${err.message}`);
        }
    }
    async getDefaultInternalTenantId() {
        const tenant = await this.getLegacyWebhookTenant();
        return tenant.id;
    }
    async _unused() {
        const internalTenant = await this.prisma.tenant.findFirst({
            where: { isInternal: true, deletedAt: null },
            select: { id: true },
        });
        if (internalTenant)
            return internalTenant.id;
        const fallback = await this.prisma.tenant.findFirst({
            where: { deletedAt: null },
            select: { id: true },
            orderBy: { createdAt: 'asc' },
        });
        if (fallback)
            return fallback.id;
        throw new common_1.NotFoundException('No active organization found to process incoming webhook.');
    }
    async processIndiaMartLead(payload, tenantId) {
        this.logger.log(`Received IndiaMART webhook payload for tenant ${tenantId}: ${JSON.stringify(payload)}`);
        const queryId = payload.QUERY_ID || payload.query_id || payload.UNIQUE_QUERY_ID || payload.unique_query_id;
        if (queryId) {
            const existing = await this.prisma.lead.findFirst({
                where: {
                    tenantId,
                    rawPayload: { contains: String(queryId) },
                    source: 'indiamart',
                    deletedAt: null,
                },
            });
            if (existing) {
                this.logger.log(`IndiaMART redelivery ignored for queryId=${queryId}. Existing lead: ${existing.leadNumber}`);
                return { isDuplicate: true, lead: existing };
            }
        }
        const customerName = stripHtml(payload.SENDER_NAME || payload.sender_name || payload.name) || 'IndiaMART Prospect';
        const customerPhone = stripHtml(payload.SENDER_MOBILE || payload.sender_mobile || payload.mobile || payload.phone) || '';
        const customerEmail = stripHtml(payload.SENDER_EMAIL || payload.sender_email || payload.email);
        const city = stripHtml(payload.SENDER_CITY || payload.sender_city || payload.city);
        const companyName = stripHtml(payload.GLUSR_USR_COMPANYNAME || payload.company_name || payload.company);
        const productName = stripHtml(payload.PRODUCT_NAME || payload.product_name || payload.subject || payload.SUBJECT);
        const queryMessage = stripHtml(payload.QUERY_MESSAGE || payload.query_message || payload.message || payload.query);
        if (!customerPhone) {
            this.logger.warn('IndiaMART webhook missing customer phone number');
        }
        try {
            const lead = await this.leadsService.createLead({
                customerName,
                customerPhone: customerPhone || '9999999999',
                customerEmail,
                city,
                companyName,
                productName,
                productCategory: productName,
                queryMessage: queryMessage || `Inquiry from IndiaMART regarding ${productName || 'products'}`,
                source: 'indiamart',
                rawPayload: JSON.stringify(payload),
            }, { tenantId, role: 'admin', employeeCode: 'WEBHOOK' });
            return { isDuplicate: false, lead };
        }
        catch (err) {
            if (err?.message?.includes('Duplicate lead detected')) {
                const existing = await this.prisma.lead.findFirst({
                    where: {
                        tenantId,
                        customerPhone: { contains: customerPhone.replace(/[^0-9]/g, '').slice(-10) },
                        deletedAt: null,
                    },
                });
                return { isDuplicate: true, lead: existing };
            }
            throw err;
        }
    }
    async processWhatsAppLead(payload, tenantId) {
        this.logger.log(`Received WhatsApp inbound webhook payload for tenant ${tenantId}: ${JSON.stringify(payload)}`);
        let customerPhone = '';
        let customerName = 'WhatsApp Lead';
        let queryMessage = '';
        let messageId = '';
        if (payload.entry && payload.entry[0]?.changes && payload.entry[0]?.changes[0]?.value) {
            const value = payload.entry[0].changes[0].value;
            const contact = value.contacts?.[0];
            const message = value.messages?.[0];
            customerPhone = contact?.wa_id || message?.from || '';
            customerName = contact?.profile?.name || 'WhatsApp Customer';
            queryMessage = message?.text?.body || message?.caption || 'Inbound WhatsApp Inquiry';
            messageId = message?.id || '';
        }
        else {
            customerPhone = payload.waId || payload.phone || payload.sender || payload.from || payload.mobileNumber || '';
            customerName = payload.senderName || payload.name || payload.userName || 'WhatsApp Prospect';
            queryMessage = payload.text || payload.message || payload.body || 'WhatsApp Message Inquiry';
            messageId = payload.messageId || payload.id || payload.msgId || '';
        }
        if (messageId) {
            const existing = await this.prisma.lead.findFirst({
                where: {
                    tenantId,
                    rawPayload: { contains: messageId },
                    source: 'whatsapp',
                    deletedAt: null,
                },
            });
            if (existing) {
                this.logger.log(`WhatsApp redelivery ignored for messageId=${messageId}. Existing lead: ${existing.leadNumber}`);
                return { isDuplicate: true, lead: existing };
            }
        }
        try {
            const lead = await this.leadsService.createLead({
                customerName: stripHtml(customerName) || 'WhatsApp Lead',
                customerPhone: stripHtml(customerPhone) || '919999999999',
                queryMessage: stripHtml(queryMessage) || 'Inbound WhatsApp Inquiry',
                source: 'whatsapp',
                productCategory: 'General Inquiry',
                rawPayload: JSON.stringify(payload),
            }, { tenantId, role: 'admin', employeeCode: 'WEBHOOK' });
            return { isDuplicate: false, lead };
        }
        catch (err) {
            if (err?.message?.includes('Duplicate lead detected')) {
                const existing = await this.prisma.lead.findFirst({
                    where: {
                        tenantId,
                        customerPhone: { contains: customerPhone.replace(/[^0-9]/g, '').slice(-10) },
                        deletedAt: null,
                    },
                });
                return { isDuplicate: true, lead: existing };
            }
            throw err;
        }
    }
    async processWebsiteLead(payload, tenantId, tokenHeader) {
        this.logger.log(`Received Website form submission for tenant ${tenantId}: ${JSON.stringify(payload)}`);
        const honeypotValues = [
            payload._hp_company_trap,
            payload.website_url_hp,
            payload.hp_fax,
            payload.hp_title,
        ].filter(Boolean);
        if (honeypotValues.length > 0) {
            this.logger.warn(`Bot detected via honeypot field: ${JSON.stringify(honeypotValues)}. Silently dropping.`);
            return { isBot: true, isDuplicate: false, lead: null };
        }
        const configuredToken = process.env.WEBSITE_WEBHOOK_SECRET || process.env.WEBSITE_SUBMISSION_SECRET;
        if (!configuredToken) {
            this.logger.warn('Website webhook integration is not configured on server (WEBSITE_WEBHOOK_SECRET unset).');
            throw new common_1.ServiceUnavailableException('Website webhook integration is not configured on this server.');
        }
        const providedToken = tokenHeader || payload.websiteToken || payload._secret_token || payload.token;
        const configuredHash = crypto.createHash('sha256').update(configuredToken).digest();
        const providedHash = crypto.createHash('sha256').update(providedToken || '').digest();
        if (!providedToken || !crypto.timingSafeEqual(configuredHash, providedHash)) {
            this.logger.warn(`Website inquiry token mismatch or missing: provided="${providedToken}"`);
            throw new common_1.UnauthorizedException('Invalid or missing website submission token.');
        }
        const submissionId = payload.submissionId || payload.rfqId || payload.requestId;
        if (submissionId) {
            const existing = await this.prisma.lead.findFirst({
                where: {
                    tenantId,
                    rawPayload: { contains: String(submissionId) },
                    source: 'web',
                    deletedAt: null,
                },
            });
            if (existing) {
                this.logger.log(`Website form redelivery ignored for submissionId=${submissionId}`);
                return { isBot: false, isDuplicate: true, lead: existing };
            }
        }
        try {
            const lead = await this.leadsService.createLead({
                customerName: stripHtml(payload.name || payload.customerName) || 'Web Inquiry',
                customerPhone: stripHtml(payload.phone || payload.customerPhone) || '',
                customerEmail: stripHtml(payload.email || payload.customerEmail),
                city: stripHtml(payload.city),
                companyName: stripHtml(payload.company || payload.companyName),
                productCategory: stripHtml(payload.category || payload.productCategory),
                productName: stripHtml(payload.product || payload.productName),
                quantity: payload.quantity ? Number(payload.quantity) : 1,
                estimatedValue: payload.estimatedValue ? Number(payload.estimatedValue) : 0,
                queryMessage: stripHtml(payload.message || payload.queryMessage) || 'Website contact form submission',
                source: 'web',
                rawPayload: JSON.stringify(payload),
            }, { tenantId, role: 'admin', employeeCode: 'WEBHOOK' });
            return { isBot: false, isDuplicate: false, lead };
        }
        catch (err) {
            if (err?.message?.includes('Duplicate lead detected')) {
                const phone = payload.phone || payload.customerPhone || '';
                const existing = await this.prisma.lead.findFirst({
                    where: {
                        tenantId,
                        customerPhone: { contains: phone.replace(/[^0-9]/g, '').slice(-10) },
                        deletedAt: null,
                    },
                });
                return { isBot: false, isDuplicate: true, lead: existing };
            }
            throw err;
        }
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [leads_service_1.LeadsService,
        prisma_service_1.PrismaService])
], WebhooksService);
