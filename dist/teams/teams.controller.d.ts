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
        name: string;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    createTeam(user: ScopedUser, dto: CreateTeamDto): Promise<{
        allowedPages: any;
        name: string;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateTeam(user: ScopedUser, id: string, dto: UpdateTeamDto): Promise<{
        allowedPages: any;
        name: string;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
