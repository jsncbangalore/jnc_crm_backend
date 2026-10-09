import { ScopedUser } from '../auth/scoping.service';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(user: ScopedUser, search?: string, role?: string, isActive?: string): Promise<{
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
    findOne(user: ScopedUser, id: string): Promise<{
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
    createUser(user: ScopedUser, dto: CreateUserDto): Promise<{
        user: any;
        tempPassword: string;
        message: string;
    }>;
    updateUser(user: ScopedUser, id: string, dto: UpdateUserDto): Promise<{
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
    resetCredentials(user: ScopedUser, id: string): Promise<{
        message: string;
        tempPassword: string;
    }>;
    toggleActive(user: ScopedUser, id: string): Promise<{
        id: string;
        isActive: boolean;
    }>;
    deleteUser(user: ScopedUser, id: string): Promise<{
        message: string;
    }>;
}
