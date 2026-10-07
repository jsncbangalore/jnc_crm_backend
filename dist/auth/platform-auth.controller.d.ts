import { AuthService } from './auth.service';
import { PlatformLoginDto, RefreshTokenDto } from './dto/login.dto';
import { Response, Request } from 'express';
export declare class PlatformAuthController {
    private authService;
    constructor(authService: AuthService);
    login(dto: PlatformLoginDto, req: Request, res: Response): Promise<any>;
    refresh(refreshDto: RefreshTokenDto, req: Request, res: Response): Promise<{
        user: any;
        redirectPath: string;
        accessToken: string;
    }>;
    logout(req: Request, res: Response): Promise<{
        success: boolean;
        message: string;
    }>;
}
