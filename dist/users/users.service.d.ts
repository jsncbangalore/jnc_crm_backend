import { PrismaService } from '../prisma/prisma.service';
import { ScopedUser } from '../auth/scoping.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export { CreateUserDto, UpdateUserDto };
export declare function generateSecurePassword(length?: number): string;
export declare class UsersService {
    private prisma;
    private notificationsService;
    private auditService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, auditService: AuditService);
    generateTempPassword(): string;
    generateEmployeeCode(tenantId: string | null, role: string, tx?: any): Promise<string>;
    createUser(dto: CreateUserDto, creator: ScopedUser): Promise<{
        user: any;
        tempPassword: string;
        message: string;
    }>;
    findAll(creator: ScopedUser, query?: {
        search?: string;
        role?: string;
        isActive?: string;
    }): Promise<{
        items: {
            id: string;
            tenantId: string;
            name: string;
            email: string;
            isActive: boolean;
            createdAt: Date;
            phone: string;
            employeeCode: string;
            role: string;
            teamId: string;
            warehouseId: string;
            mustResetPassword: boolean;
            lastLoginAt: Date;
            teamRef: {
                id: string;
                name: string;
                allowedPages: string;
            };
        }[];
        total: number;
    }>;
    findOne(id: string, creator: ScopedUser): Promise<{
        id: string;
        tenantId: string;
        name: string;
        email: string;
        isActive: boolean;
        createdAt: Date;
        phone: string;
        employeeCode: string;
        role: string;
        teamId: string;
        warehouseId: string;
        mustResetPassword: boolean;
        lastLoginAt: Date;
        teamRef: {
            id: string;
            name: string;
            allowedPages: string;
        };
    }>;
    updateUser(id: string, dto: UpdateUserDto, modifier: ScopedUser): Promise<{
        id: string;
        tenantId: string;
        name: string;
        email: string;
        isActive: boolean;
        createdAt: Date;
        phone: string;
        employeeCode: string;
        role: string;
        teamId: string;
        warehouseId: string;
        mustResetPassword: boolean;
        lastLoginAt: Date;
        teamRef: {
            id: string;
            name: string;
            allowedPages: string;
        };
    }>;
    resetCredentials(id: string, modifier: ScopedUser): Promise<{
        message: string;
        tempPassword: string;
    }>;
    toggleActive(id: string, modifier: ScopedUser): Promise<{
        id: string;
        isActive: boolean;
    }>;
    deleteUser(id: string, modifier: ScopedUser): Promise<{
        message: string;
    }>;
}
