import { AuditService } from './audit.service';
export declare class AuditController {
    private auditService;
    constructor(auditService: AuditService);
    getLogs(page?: number, limit?: number, entityName?: string, actorId?: string, search?: string): Promise<{
        items: ({
            actor: {
                id: string;
                name: string;
                email: string;
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
