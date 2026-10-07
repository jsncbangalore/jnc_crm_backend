import { ScopedUser } from '../auth/scoping.service';
import { ActivitiesService } from './activities.service';
import { CreateProjectDto, UpdateProjectDto, AssignMembersDto, UploadLogDto } from './dto/project.dto';
export declare class ActivitiesController {
    private readonly activitiesService;
    constructor(activitiesService: ActivitiesService);
    listProjects(user: ScopedUser): Promise<({
        createdBy: {
            name: string;
            id: string;
            employeeCode: string;
        };
        _count: {
            dailyLogs: number;
        };
        assignments: ({
            user: {
                name: string;
                id: string;
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
        name: string;
        id: string;
        tenantId: string;
        createdById: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string | null;
    })[]>;
    createProject(body: CreateProjectDto, user: ScopedUser): Promise<{
        createdBy: {
            name: string;
            id: string;
            employeeCode: string;
        };
        assignments: ({
            user: {
                name: string;
                id: string;
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
        name: string;
        id: string;
        tenantId: string;
        createdById: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string | null;
    }>;
    updateProject(id: string, body: UpdateProjectDto, user: ScopedUser): Promise<{
        name: string;
        id: string;
        tenantId: string;
        createdById: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string | null;
    }>;
    deleteProject(id: string, user: ScopedUser): Promise<{
        success: boolean;
    }>;
    getAssignableUsers(user: ScopedUser): Promise<{
        email: string;
        name: string;
        id: string;
        employeeCode: string;
        role: string;
    }[]>;
    assignMembers(projectId: string, body: AssignMembersDto, user: ScopedUser): Promise<{
        assignments: ({
            user: {
                name: string;
                id: string;
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
        name: string;
        id: string;
        tenantId: string;
        createdById: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string | null;
    }>;
    listLogs(projectId: string, user: ScopedUser): Promise<({
        uploadedBy: {
            name: string;
            id: string;
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
    uploadLog(projectId: string, file: Express.Multer.File | undefined, body: UploadLogDto, user: ScopedUser): Promise<{
        uploadedBy: {
            name: string;
            id: string;
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
    deleteLog(projectId: string, logId: string, user: ScopedUser): Promise<{
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
}
