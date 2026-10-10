import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LoginDto, SelectCompanyDto, PlatformLoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/login.dto';
export declare function formatAuthUser(user: any): any;
export declare class AuthService {
    private prisma;
    private jwtService;
    private notificationsService;
    private readonly MAX_FAILED_ATTEMPTS;
    private readonly LOCKOUT_DURATION_MS;
    private readonly PLATFORM_MAX_ATTEMPTS;
    private readonly PLATFORM_WINDOW_MS;
    constructor(prisma: PrismaService, jwtService: JwtService, notificationsService: NotificationsService);
    private checkAccountLockout;
    private recordFailedAttempt;
    private resetFailedAttempts;
    private findCandidates;
    login(loginDto: LoginDto, ipAddress?: string): Promise<{
        user: any;
        redirectPath: string;
        accessToken: string;
        refreshToken: string;
    } | {
        requiresCompanySelection: boolean;
        companies: {
            code: any;
            name: any;
        }[];
        selectionToken: string;
    }>;
    selectCompany(dto: SelectCompanyDto, ipAddress?: string): Promise<{
        user: any;
        redirectPath: string;
        accessToken: string;
        refreshToken: string;
    }>;
    platformLogin(dto: PlatformLoginDto, ipAddress?: string): Promise<{
        user: any;
        redirectPath: string;
        accessToken: string;
        refreshToken: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto, _ipAddress?: string): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    private _performRefresh;
    refreshToken(rawRefreshToken: string, ipAddress?: string): Promise<{
        user: any;
        redirectPath: string;
        accessToken: string;
        refreshToken: string;
    }>;
    refreshPlatformToken(rawRefreshToken: string, ipAddress?: string): Promise<{
        user: any;
        redirectPath: string;
        accessToken: string;
        refreshToken: string;
    }>;
    changePassword(userId: string, currentPass: string, newPass: string): Promise<{
        message: string;
    }>;
    logout(rawToken?: string, userId?: string, ipAddress?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    logoutAll(userId: string, ipAddress?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateProfile(userId: string, data: {
        name?: string;
        phone?: string;
    }): Promise<{
        tenant: {
            id: string;
            name: string;
            code: string;
            slug: string;
            status: string;
            logoUrl: string;
            currency: string;
        };
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
        lastLoginAt: Date;
        teamRef: {
            id: string;
            name: string;
            allowedPages: string;
        };
    }>;
    getRedirectPath(user: any): string;
    private _buildLoginResponse;
    private _auditPlatformLogin;
    private generateTokens;
    private _addArtificialDelay;
}
