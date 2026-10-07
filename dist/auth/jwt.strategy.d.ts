import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(payload: any): Promise<{
        tenant: {
            name: string;
            id: string;
            deletedAt: Date;
            code: string;
            slug: string;
            status: string;
            logoUrl: string;
            currency: string;
        };
        team: string;
        email: string;
        name: string;
        id: string;
        tenantId: string;
        employeeCode: string;
        role: string;
        teamId: string;
        warehouseId: string;
        isActive: boolean;
        mustResetPassword: boolean;
        tokenVersion: number;
    }>;
}
export {};
