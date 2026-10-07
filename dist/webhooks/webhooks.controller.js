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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhooksController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const webhooks_service_1 = require("./webhooks.service");
const crypto = require("crypto");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const tenant_util_1 = require("../common/tenant.util");
function timingSafeTokenMatch(provided, expected) {
    if (!provided || !expected)
        return false;
    const h1 = crypto.createHash('sha256').update(provided).digest();
    const h2 = crypto.createHash('sha256').update(expected).digest();
    return crypto.timingSafeEqual(h1, h2);
}
function checkPayloadSize(payload, maxBytes = 100 * 1024) {
    const size = Buffer.byteLength(typeof payload === 'string' ? payload : JSON.stringify(payload || ''));
    if (size > maxBytes) {
        throw new common_1.PayloadTooLargeException(`Webhook payload exceeds maximum size limit of ${maxBytes / 1024}KB.`);
    }
}
let WebhooksController = WebhooksController_1 = class WebhooksController {
    constructor(webhooksService) {
        this.webhooksService = webhooksService;
        this.logger = new common_1.Logger(WebhooksController_1.name);
    }
    async regenerateWebhookKey(user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        return this.webhooksService.regenerateWebhookKey(tenantId);
    }
    async handleIndiaMartPushWithKey(key, payload, tokenHeader, queryToken) {
        checkPayloadSize(payload);
        const tenant = await this.webhooksService.findTenantByWebhookKey(key);
        const configuredToken = process.env.INDIAMART_WEBHOOK_SECRET;
        if (!configuredToken) {
            this.logger.warn('IndiaMART webhook integration is not configured on server (INDIAMART_WEBHOOK_SECRET unset).');
            throw new common_1.ServiceUnavailableException('IndiaMART webhook integration is not configured on this server.');
        }
        const providedToken = tokenHeader || queryToken;
        if (!timingSafeTokenMatch(providedToken, configuredToken)) {
            this.logger.warn(`Unauthorized IndiaMART push attempt for tenant ${tenant.code}: invalid or missing token.`);
            throw new common_1.UnauthorizedException('Invalid or missing IndiaMART webhook secret token.');
        }
        const ts = payload?.QUERY_TIME || payload?.TIMESTAMP || payload?.timestamp;
        if (ts) {
            const parsed = new Date(ts).getTime();
            if (!isNaN(parsed) && (Date.now() - parsed > 24 * 3600 * 1000 || parsed - Date.now() > 5 * 60 * 1000)) {
                throw new common_1.BadRequestException('Webhook payload timestamp expired or invalid.');
            }
        }
        const result = await this.webhooksService.processIndiaMartLead(payload, tenant.id);
        return {
            status: result.isDuplicate ? 'DUPLICATE_IGNORED' : 'SUCCESS',
            message: result.isDuplicate ? 'Lead already recorded (idempotent ignore)' : 'Lead captured successfully',
            leadId: result.lead?.id,
        };
    }
    async verifyWhatsAppWebhookWithKey(key, mode, challenge, verifyToken, res) {
        await this.webhooksService.findTenantByWebhookKey(key);
        const configuredToken = process.env.WHATSAPP_VERIFY_TOKEN;
        if (!configuredToken) {
            this.logger.warn('WhatsApp webhook verification is not configured on server (WHATSAPP_VERIFY_TOKEN unset).');
            return res.status(common_1.HttpStatus.SERVICE_UNAVAILABLE).send('WhatsApp webhook integration is not configured on this server.');
        }
        if (mode === 'subscribe') {
            if (verifyToken && verifyToken === configuredToken) {
                this.logger.log('WhatsApp webhook verified successfully for tenant key. Returning hub.challenge.');
                return res.status(common_1.HttpStatus.OK).send(challenge || 'OK');
            }
            else {
                this.logger.warn(`WhatsApp verification token mismatch: received="${verifyToken}"`);
                return res.status(common_1.HttpStatus.FORBIDDEN).send('Forbidden: Token mismatch');
            }
        }
        return res.status(common_1.HttpStatus.OK).send(challenge || 'OK');
    }
    async handleWhatsAppInboundWithKey(key, req, payload, signatureHeader) {
        checkPayloadSize(payload);
        const tenant = await this.webhooksService.findTenantByWebhookKey(key);
        const appSecret = process.env.WHATSAPP_APP_SECRET;
        if (!appSecret) {
            this.logger.warn('WhatsApp webhook integration is not configured on server (WHATSAPP_APP_SECRET unset).');
            throw new common_1.ServiceUnavailableException('WhatsApp webhook integration is not configured on this server.');
        }
        if (!signatureHeader) {
            this.logger.warn(`WhatsApp webhook rejected for tenant ${tenant.code}: Missing signature`);
            throw new common_1.UnauthorizedException('Missing X-Hub-Signature-256 header');
        }
        const parts = signatureHeader.split('=');
        const signatureHash = parts.length === 2 && parts[0] === 'sha256' ? parts[1] : signatureHeader;
        const rawBuffer = req.rawBody || Buffer.from(JSON.stringify(payload));
        const computedHmac = crypto.createHmac('sha256', appSecret).update(rawBuffer).digest('hex');
        const sigBuffer = Buffer.from(signatureHash, 'hex');
        const computedBuffer = Buffer.from(computedHmac, 'hex');
        let isValid = false;
        if (sigBuffer.length === computedBuffer.length && sigBuffer.length > 0) {
            isValid = crypto.timingSafeEqual(sigBuffer, computedBuffer);
        }
        if (!isValid) {
            this.logger.warn(`WhatsApp signature verification failed for tenant ${tenant.code}`);
            throw new common_1.UnauthorizedException('Invalid X-Hub-Signature-256 signature');
        }
        const result = await this.webhooksService.processWhatsAppLead(payload, tenant.id);
        return {
            status: result.isDuplicate ? 'DUPLICATE_IGNORED' : 'SUCCESS',
            message: result.isDuplicate ? 'WhatsApp message already processed' : 'WhatsApp lead captured',
            leadId: result.lead?.id,
        };
    }
    async handleWebsiteContactFormWithKey(key, payload, tokenHeader) {
        const tenant = await this.webhooksService.findTenantByWebhookKey(key);
        const result = await this.webhooksService.processWebsiteLead(payload, tenant.id, tokenHeader);
        if (result.isBot) {
            return { status: 'SUCCESS', message: 'Inquiry registered' };
        }
        return {
            status: result.isDuplicate ? 'DUPLICATE_IGNORED' : 'SUCCESS',
            message: result.isDuplicate ? 'Inquiry already registered' : 'Website inquiry registered',
            leadId: result.lead?.id,
        };
    }
    async handleIndiaMartPush(req, payload, tokenHeader, queryToken) {
        const legacyTenant = await this.webhooksService.getLegacyWebhookTenant();
        this.logger.warn(`[DEPRECATION WARNING] Legacy unkeyed /webhooks/indiamart called. Pinned strictly to tenant "${legacyTenant.code}" with hard sunset date 2026-12-31. Migrate to /webhooks/indiamart/<tenant-webhook-key>.`);
        await this.webhooksService.logLegacyWebhookCall({
            tenantId: legacyTenant.id,
            endpoint: '/webhooks/indiamart',
            ipAddress: (req.ip || (req.headers && req.headers['x-forwarded-for']) || '127.0.0.1'),
            payloadSummary: `queryId=${payload?.QUERY_ID || payload?.query_id || 'unknown'}, mobile=${payload?.SENDER_MOBILE || payload?.mobile || 'unknown'}`,
        });
        checkPayloadSize(payload);
        const configuredToken = process.env.INDIAMART_WEBHOOK_SECRET;
        if (!configuredToken) {
            this.logger.warn('IndiaMART webhook integration is not configured on server (INDIAMART_WEBHOOK_SECRET unset).');
            throw new common_1.ServiceUnavailableException('IndiaMART webhook integration is not configured on this server.');
        }
        const providedToken = tokenHeader || queryToken;
        if (!timingSafeTokenMatch(providedToken, configuredToken)) {
            this.logger.warn('Unauthorized IndiaMART push attempt: invalid or missing token.');
            throw new common_1.UnauthorizedException('Invalid or missing IndiaMART webhook secret token.');
        }
        const ts = payload?.QUERY_TIME || payload?.TIMESTAMP || payload?.timestamp;
        if (ts) {
            const parsed = new Date(ts).getTime();
            if (!isNaN(parsed) && (Date.now() - parsed > 24 * 3600 * 1000 || parsed - Date.now() > 5 * 60 * 1000)) {
                throw new common_1.BadRequestException('Webhook payload timestamp expired or invalid.');
            }
        }
        const result = await this.webhooksService.processIndiaMartLead(payload, legacyTenant.id);
        return {
            status: result.isDuplicate ? 'DUPLICATE_IGNORED' : 'SUCCESS',
            message: result.isDuplicate ? 'Lead already recorded (idempotent ignore)' : 'Lead captured successfully',
            leadId: result.lead?.id,
        };
    }
    async verifyWhatsAppWebhook(req, mode, challenge, verifyToken, res) {
        const legacyTenant = await this.webhooksService.getLegacyWebhookTenant();
        this.logger.warn(`[DEPRECATION WARNING] Legacy unkeyed /webhooks/whatsapp handshake called. Pinned strictly to tenant "${legacyTenant.code}" with hard sunset date 2026-12-31. Migrate to /webhooks/whatsapp/<tenant-webhook-key>.`);
        await this.webhooksService.logLegacyWebhookCall({
            tenantId: legacyTenant.id,
            endpoint: '/webhooks/whatsapp (handshake)',
            ipAddress: (req.ip || (req.headers && req.headers['x-forwarded-for']) || '127.0.0.1'),
            payloadSummary: `mode=${mode}`,
        });
        const configuredToken = process.env.WHATSAPP_VERIFY_TOKEN;
        if (!configuredToken) {
            this.logger.warn('WhatsApp webhook verification is not configured on server (WHATSAPP_VERIFY_TOKEN unset).');
            return res.status(common_1.HttpStatus.SERVICE_UNAVAILABLE).send('WhatsApp webhook integration is not configured on this server.');
        }
        if (mode === 'subscribe') {
            if (verifyToken && verifyToken === configuredToken) {
                return res.status(common_1.HttpStatus.OK).send(challenge || 'OK');
            }
            else {
                return res.status(common_1.HttpStatus.FORBIDDEN).send('Forbidden: Token mismatch');
            }
        }
        return res.status(common_1.HttpStatus.OK).send(challenge || 'OK');
    }
    async handleWhatsAppInbound(req, payload, signatureHeader) {
        const legacyTenant = await this.webhooksService.getLegacyWebhookTenant();
        this.logger.warn(`[DEPRECATION WARNING] Legacy unkeyed /webhooks/whatsapp inbound called. Pinned strictly to tenant "${legacyTenant.code}" with hard sunset date 2026-12-31. Migrate to /webhooks/whatsapp/<tenant-webhook-key>.`);
        await this.webhooksService.logLegacyWebhookCall({
            tenantId: legacyTenant.id,
            endpoint: '/webhooks/whatsapp',
            ipAddress: (req.ip || (req.headers && req.headers['x-forwarded-for']) || '127.0.0.1'),
            payloadSummary: 'whatsapp_message',
        });
        checkPayloadSize(payload);
        const appSecret = process.env.WHATSAPP_APP_SECRET;
        if (!appSecret) {
            this.logger.warn('WhatsApp webhook integration is not configured on server (WHATSAPP_APP_SECRET unset).');
            throw new common_1.ServiceUnavailableException('WhatsApp webhook integration is not configured on this server.');
        }
        if (!signatureHeader) {
            throw new common_1.UnauthorizedException('Missing X-Hub-Signature-256 header');
        }
        const parts = signatureHeader.split('=');
        const signatureHash = parts.length === 2 && parts[0] === 'sha256' ? parts[1] : signatureHeader;
        const rawBuffer = req.rawBody || Buffer.from(JSON.stringify(payload));
        const computedHmac = crypto.createHmac('sha256', appSecret).update(rawBuffer).digest('hex');
        const sigBuffer = Buffer.from(signatureHash, 'hex');
        const computedBuffer = Buffer.from(computedHmac, 'hex');
        let isValid = false;
        if (sigBuffer.length === computedBuffer.length && sigBuffer.length > 0) {
            isValid = crypto.timingSafeEqual(sigBuffer, computedBuffer);
        }
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid X-Hub-Signature-256 signature');
        }
        const result = await this.webhooksService.processWhatsAppLead(payload, legacyTenant.id);
        return {
            status: result.isDuplicate ? 'DUPLICATE_IGNORED' : 'SUCCESS',
            message: result.isDuplicate ? 'WhatsApp message already processed' : 'WhatsApp lead captured',
            leadId: result.lead?.id,
        };
    }
    async handleWebsiteContactForm(req, payload, tokenHeader) {
        const legacyTenant = await this.webhooksService.getLegacyWebhookTenant();
        this.logger.warn(`[DEPRECATION WARNING] Legacy unkeyed /webhooks/website called. Pinned strictly to tenant "${legacyTenant.code}" with hard sunset date 2026-12-31. Migrate to /webhooks/website/<tenant-webhook-key>.`);
        await this.webhooksService.logLegacyWebhookCall({
            tenantId: legacyTenant.id,
            endpoint: '/webhooks/website',
            ipAddress: (req.ip || (req.headers && req.headers['x-forwarded-for']) || '127.0.0.1'),
            payloadSummary: 'website_form',
        });
        const result = await this.webhooksService.processWebsiteLead(payload, legacyTenant.id, tokenHeader);
        if (result.isBot) {
            return { status: 'SUCCESS', message: 'Inquiry registered' };
        }
        return {
            status: result.isDuplicate ? 'DUPLICATE_IGNORED' : 'SUCCESS',
            message: result.isDuplicate ? 'Inquiry already registered' : 'Website inquiry registered',
            leadId: result.lead?.id,
        };
    }
    async handleGenericWebhook(provider, key, payload, req, indiamartToken, websiteToken, hubSig, queryToken) {
        if (provider === 'indiamart') {
            return this.handleIndiaMartPushWithKey(key, payload, indiamartToken, queryToken);
        }
        if (provider === 'whatsapp') {
            return this.handleWhatsAppInboundWithKey(key, req, payload, hubSig);
        }
        if (provider === 'website') {
            return this.handleWebsiteContactFormWithKey(key, payload, websiteToken);
        }
        await this.webhooksService.findTenantByWebhookKey(key);
        throw new common_1.NotFoundException(`Unsupported webhook provider '${provider}'. Supported: indiamart, whatsapp, website`);
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('regenerate-key'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "regenerateWebhookKey", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 60, ttl: 60000 } }),
    (0, common_1.Post)('indiamart/:key'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-indiamart-token')),
    __param(3, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleIndiaMartPushWithKey", null);
__decorate([
    (0, common_1.Get)('whatsapp/:key'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Query)('hub.mode')),
    __param(2, (0, common_1.Query)('hub.challenge')),
    __param(3, (0, common_1.Query)('hub.verify_token')),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "verifyWhatsAppWebhookWithKey", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 60, ttl: 60000 } }),
    (0, common_1.Post)('whatsapp/:key'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Headers)('x-hub-signature-256')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleWhatsAppInboundWithKey", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 60, ttl: 60000 } }),
    (0, common_1.Post)('website/:key'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-website-token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleWebsiteContactFormWithKey", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 60, ttl: 60000 } }),
    (0, common_1.Post)('indiamart'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-indiamart-token')),
    __param(3, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleIndiaMartPush", null);
__decorate([
    (0, common_1.Get)('whatsapp'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('hub.mode')),
    __param(2, (0, common_1.Query)('hub.challenge')),
    __param(3, (0, common_1.Query)('hub.verify_token')),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "verifyWhatsAppWebhook", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 60, ttl: 60000 } }),
    (0, common_1.Post)('whatsapp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-hub-signature-256')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleWhatsAppInbound", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 60, ttl: 60000 } }),
    (0, common_1.Post)('website'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-website-token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleWebsiteContactForm", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 60, ttl: 60000 } }),
    (0, common_1.Post)(':provider/:key'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Param)('key')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __param(4, (0, common_1.Headers)('x-indiamart-token')),
    __param(5, (0, common_1.Headers)('x-website-token')),
    __param(6, (0, common_1.Headers)('x-hub-signature-256')),
    __param(7, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleGenericWebhook", null);
exports.WebhooksController = WebhooksController = WebhooksController_1 = __decorate([
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [webhooks_service_1.WebhooksService])
], WebhooksController);
