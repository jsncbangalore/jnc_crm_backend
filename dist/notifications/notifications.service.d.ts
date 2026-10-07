import { PrismaService } from '../prisma/prisma.service';
export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
    tenantId?: string;
    senderType?: 'primary' | 'invoice' | 'sales';
    attachments?: Array<{
        filename: string;
        content?: any;
        path?: string;
        contentType?: string;
    }>;
    relatedEntityType?: string;
    relatedEntityId?: string;
}
export interface CreateInAppTaskOptions {
    leadId: string;
    userId?: string;
    tenantId?: string;
    title: string;
    description?: string;
    scheduledAt?: Date;
}
export declare class NotificationsService {
    private prisma;
    private readonly logger;
    private transporterCache;
    constructor(prisma: PrismaService);
    private getTenantTransporter;
    private sanitizeBodyForLog;
    getBranding(tenantId?: string): Promise<{
        companyDisplayName: string;
        companyPhone: string;
        companyLogoUrl: string | null;
    }>;
    private resolveNotificationTenantId;
    sendEmail(options: SendEmailOptions): Promise<{
        success: boolean;
        recipient: string;
        messageId: any;
        status: string;
    }>;
    createInAppTask(options: CreateInAppTaskOptions): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    sendSms(phone: string, text: string): Promise<{
        success: boolean;
    }>;
    syncGoDaddyInbox(): Promise<{
        message: string;
        count: number;
    }>;
}
