import { ScopedUser } from '../auth/scoping.service';
import { TeamsService, CreateTeamDto, UpdateTeamDto } from './teams.service';
export declare class TeamsController {
    private teamsService;
    constructor(teamsService: TeamsService);
    findAll(user: ScopedUser): Promise<{
        allowedPages: any;
        userCount: number;
        _count: {
            users: number;
        };
        id: string;
        tenantId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    createTeam(user: ScopedUser, dto: CreateTeamDto): Promise<{
        allowedPages: any;
        id: string;
        tenantId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateTeam(user: ScopedUser, id: string, dto: UpdateTeamDto): Promise<{
        allowedPages: any;
        id: string;
        tenantId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
