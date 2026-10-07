export declare class ResetTenantAdminPasswordDto {
    newPassword?: string;
    adminEmail?: string;
    sendEmail?: boolean;
    appUrl?: string;
}
export declare class CreatePlatformAdminDto {
    email: string;
    name: string;
    fullName?: string;
    phone?: string;
    password?: string;
}
export declare class TogglePlatformAdminActiveDto {
    isActive?: boolean;
}
