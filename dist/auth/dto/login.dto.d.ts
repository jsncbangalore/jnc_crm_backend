export declare class LoginDto {
    identifier?: string;
    username?: string;
    password: string;
    companyCode?: string;
}
export declare class SelectCompanyDto {
    selectionToken: string;
    companyCode: string;
}
export declare class PlatformLoginDto {
    email: string;
    password: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
}
export declare class RefreshTokenDto {
    refreshToken?: string;
}
export declare class UpdateProfileDto {
    name?: string;
    phone?: string;
}
export declare class ChangePasswordDto {
    currentPass: string;
    newPass: string;
}
