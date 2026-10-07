import { PrismaService } from '../prisma/prisma.service';
export interface CreateAuditLogDto {
    tenantId?: string;
    actorId?: string;
    actorName?: string;
    action: string;
    entityName: string;
    entityId: string;
    beforeState?: any;
    afterState?: any;
    ipAddress?: string;
}
export declare function extractClientIp(req: any): string;
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(dto: CreateAuditLogDto): Promise<{
        id: string;
        tenantId: string;
        actorName: string | null;
        action: string;
        entityName: string;
        entityId: string;
        beforeState: string | null;
        afterState: string | null;
        ipAddress: string | null;
        timestamp: Date;
        actorId: string | null;
    }>;
    getLogs(query: {
        tenantId?: string;
        entityName?: string;
        entityId?: string;
        actorId?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        items: ({
            actor: {
                email: string;
                name: string;
                id: string;
                employeeCode: string;
            };
        } & {
            id: string;
            tenantId: string;
            actorName: string | null;
            action: string;
            entityName: string;
            entityId: string;
            beforeState: string | null;
            afterState: string | null;
            ipAddress: string | null;
            timestamp: Date;
            actorId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
