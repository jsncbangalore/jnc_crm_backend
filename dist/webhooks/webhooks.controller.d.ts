import { WebhooksService } from './webhooks.service';
import { Response, Request } from 'express';
import { ScopedUser } from '../auth/scoping.service';
export declare class WebhooksController {
    private webhooksService;
    private readonly logger;
    constructor(webhooksService: WebhooksService);
    regenerateWebhookKey(user: ScopedUser): Promise<{
        webhookKey: string;
        message: string;
    }>;
    handleIndiaMartPushWithKey(key: string, payload: any, tokenHeader?: string, queryToken?: string): Promise<{
        status: string;
        message: string;
        leadId: string;
    }>;
    verifyWhatsAppWebhookWithKey(key: string, mode: string, challenge: string, verifyToken: string, res: Response): Promise<Response<any, Record<string, any>>>;
    handleWhatsAppInboundWithKey(key: string, req: Request & {
        rawBody?: Buffer;
    }, payload: any, signatureHeader?: string): Promise<{
        status: string;
        message: string;
        leadId: string;
    }>;
    handleWebsiteContactFormWithKey(key: string, payload: any, tokenHeader?: string): Promise<{
        status: string;
        message: string;
        leadId?: undefined;
    } | {
        status: string;
        message: string;
        leadId: string;
    }>;
    handleIndiaMartPush(req: Request, payload: any, tokenHeader?: string, queryToken?: string): Promise<{
        status: string;
        message: string;
        leadId: string;
    }>;
    verifyWhatsAppWebhook(req: Request, mode: string, challenge: string, verifyToken: string, res: Response): Promise<Response<any, Record<string, any>>>;
    handleWhatsAppInbound(req: Request & {
        rawBody?: Buffer;
    }, payload: any, signatureHeader?: string): Promise<{
        status: string;
        message: string;
        leadId: string;
    }>;
    handleWebsiteContactForm(req: Request, payload: any, tokenHeader?: string): Promise<{
        status: string;
        message: string;
        leadId?: undefined;
    } | {
        status: string;
        message: string;
        leadId: string;
    }>;
    handleGenericWebhook(provider: string, key: string, payload: any, req: Request & {
        rawBody?: Buffer;
    }, indiamartToken?: string, websiteToken?: string, hubSig?: string, queryToken?: string): Promise<{
        status: string;
        message: string;
        leadId: string;
    } | {
        status: string;
        message: string;
        leadId?: undefined;
    }>;
}
