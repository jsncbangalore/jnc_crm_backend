import { PrismaService } from '../prisma/prisma.service';
export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
    tenantId?: string;
    senderType?: 'primary' | 'invoice' | 'sales';
    requestId?: string;
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
export interface MailTestResult {
    provider: string;
    status: 'sent' | 'failed';
    errorText?: string;
    messageId?: string;
}
export declare class NotificationsService {
    private prisma;
    private readonly logger;
    private transporterCache;
    constructor(prisma: PrismaService);
    getMailProvider(): 'smtp' | 'brevo' | 'resend';
    private getTenantTransporter;
    private sendViaBrevo;
    private sendViaResend;
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
        messageId: string;
        status: string;
        provider: string;
    }>;
    sendTestMail(targetEmail: string, requestId?: string): Promise<MailTestResult>;
    createInAppTask(options: CreateInAppTaskOptions): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    sendSms(phone: string, message: string): Promise<{
        success: boolean;
        status: string;
    }>;
    syncGoDaddyInbox(): Promise<{
        success: boolean;
        syncedCount: number;
    }>;
}
