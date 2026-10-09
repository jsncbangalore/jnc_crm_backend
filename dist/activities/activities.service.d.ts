import { PrismaService } from '../prisma/prisma.service';
import { ScopedUser } from '../auth/scoping.service';
export declare class ActivitiesService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    listProjects(user: ScopedUser): Promise<({
        _count: {
            dailyLogs: number;
        };
        createdBy: {
            id: string;
            name: string;
            employeeCode: string;
        };
        assignments: ({
            user: {
                id: string;
                name: string;
                employeeCode: string;
                role: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            projectId: string;
            roleInProject: string | null;
            assignedById: string | null;
        })[];
    } & {
        id: string;
        tenantId: string;
        name: string;
        createdById: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string | null;
    })[]>;
    createProject(user: ScopedUser, dto: {
        name: string;
        description?: string;
        status?: string;
    }): Promise<{
        createdBy: {
            id: string;
            name: string;
            employeeCode: string;
        };
        assignments: ({
            user: {
                id: string;
                name: string;
                employeeCode: string;
                role: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            projectId: string;
            roleInProject: string | null;
            assignedById: string | null;
        })[];
    } & {
        id: string;
        tenantId: string;
        name: string;
        createdById: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string | null;
    }>;
    updateProject(user: ScopedUser, id: string, dto: {
        name?: string;
        description?: string;
        status?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        name: string;
        createdById: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string | null;
    }>;
    deleteProject(user: ScopedUser, id: string): Promise<{
        success: boolean;
    }>;
    getAssignableUsers(user: ScopedUser): Promise<{
        id: string;
        name: string;
        email: string;
        employeeCode: string;
        role: string;
    }[]>;
    assignMembers(user: ScopedUser, projectId: string, memberIds: string[]): Promise<{
        assignments: ({
            user: {
                id: string;
                name: string;
                employeeCode: string;
                role: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            projectId: string;
            roleInProject: string | null;
            assignedById: string | null;
        })[];
    } & {
        id: string;
        tenantId: string;
        name: string;
        createdById: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string | null;
    }>;
    listLogs(user: ScopedUser, projectId: string): Promise<({
        uploadedBy: {
            id: string;
            name: string;
            employeeCode: string;
            role: string;
        };
    } & {
        id: string;
        createdAt: Date;
        rawPayload: string | null;
        projectId: string;
        logDate: Date;
        uploadedById: string | null;
        fileName: string | null;
        taskSummary: string | null;
        recordsJson: string;
    })[]>;
    createLog(user: ScopedUser, projectId: string, dto: {
        fileName?: string;
        taskSummary?: string;
        records: any[];
    }): Promise<{
        uploadedBy: {
            id: string;
            name: string;
            employeeCode: string;
            role: string;
        };
    } & {
        id: string;
        createdAt: Date;
        rawPayload: string | null;
        projectId: string;
        logDate: Date;
        uploadedById: string | null;
        fileName: string | null;
        taskSummary: string | null;
        recordsJson: string;
    }>;
    deleteLog(user: ScopedUser, projectId: string, logId: string): Promise<{
        id: string;
        createdAt: Date;
        rawPayload: string | null;
        projectId: string;
        logDate: Date;
        uploadedById: string | null;
        fileName: string | null;
        taskSummary: string | null;
        recordsJson: string;
    }>;
    private requireProjectAccessRole;
    private requireProjectCreationRole;
    private requireAssignmentRole;
    private requireSuperAdminOrAdmin;
    private findProjectOrFail;
}
