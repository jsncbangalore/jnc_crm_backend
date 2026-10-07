import { PrismaService } from '../prisma/prisma.service';
import { ScopedUser } from '../auth/scoping.service';
import { AuditService } from '../audit/audit.service';
export interface CreateTeamDto {
    name: string;
    allowedPages: string[];
}
export interface UpdateTeamDto {
    name?: string;
    allowedPages?: string[];
}
export declare class TeamsService {
    private prisma;
    private auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    findAll(creator: ScopedUser): Promise<{
        allowedPages: any;
        userCount: number;
        _count: {
            users: number;
        };
        name: string;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    createTeam(dto: CreateTeamDto, creator: ScopedUser): Promise<{
        allowedPages: any;
        name: string;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateTeam(id: string, dto: UpdateTeamDto, creator: ScopedUser): Promise<{
        allowedPages: any;
        name: string;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
