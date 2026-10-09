import { ScopedUser } from '../auth/scoping.service';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsController {
    private notificationsService;
    private prisma;
    constructor(notificationsService: NotificationsService, prisma: PrismaService);
    getNotifications(user: ScopedUser, channel?: string, search?: string): Promise<{
        items: {
            id: string;
            tenantId: string;
            subject: string | null;
            status: string;
            channel: string;
            recipient: string;
            body: string;
            errorMessage: string | null;
            relatedEntityType: string | null;
            relatedEntityId: string | null;
            sentAt: Date;
        }[];
        total: number;
    }>;
    syncGoDaddy(user: ScopedUser): Promise<{
        message: string;
        count: number;
    }>;
    handleInboundEmail(body: {
        from: string;
        to?: string;
        subject: string;
        text?: string;
        html?: string;
        leadNumber?: string;
    }): Promise<{
        success: boolean;
        messageId: string;
        matchedLead: string;
    }>;
}
