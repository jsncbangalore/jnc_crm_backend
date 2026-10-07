import { UserRole } from '../../auth/roles';
export declare class UpdateUserDto {
    name?: string;
    email?: string;
    phone?: string;
    role?: UserRole;
    teamId?: string | null;
    warehouseId?: string | null;
    isActive?: boolean;
}
