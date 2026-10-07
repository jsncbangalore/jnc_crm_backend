import { AuthService } from './auth.service';
import { LoginDto, SelectCompanyDto, ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto, UpdateProfileDto, ChangePasswordDto } from './dto/login.dto';
import { Response, Request } from 'express';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, req: Request, res: Response): Promise<any>;
    selectCompany(dto: SelectCompanyDto, req: Request, res: Response): Promise<any>;
    forgotPassword(dto: ForgotPasswordDto, req: Request): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    refresh(refreshDto: RefreshTokenDto, req: Request, res: Response): Promise<{
        user: any;
        redirectPath: string;
        accessToken: string;
    }>;
    logout(req: Request, res: Response): Promise<{
        success: boolean;
        message: string;
    }>;
    logoutAll(user: any, req: Request, res: Response): Promise<{
        success: boolean;
        message: string;
    }>;
    getProfile(user: any): Promise<any>;
    updateProfile(user: any, body: UpdateProfileDto): Promise<{
        tenant: {
            name: string;
            id: string;
            code: string;
            slug: string;
            status: string;
            logoUrl: string;
            currency: string;
        };
        email: string;
        name: string;
        phone: string;
        id: string;
        tenantId: string;
        employeeCode: string;
        role: string;
        teamId: string;
        warehouseId: string;
        isActive: boolean;
        lastLoginAt: Date;
        createdAt: Date;
        teamRef: {
            name: string;
            id: string;
            allowedPages: string;
        };
    }>;
    changePassword(user: any, body: ChangePasswordDto): Promise<{
        message: string;
    }>;
}
