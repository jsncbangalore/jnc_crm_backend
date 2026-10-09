import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(payload: any): Promise<{
        tenant: {
            id: string;
            name: string;
            code: string;
            slug: string;
            status: string;
            logoUrl: string;
            currency: string;
            deletedAt: Date;
        };
        team: string;
        id: string;
        tenantId: string;
        name: string;
        email: string;
        isActive: boolean;
        employeeCode: string;
        role: string;
        teamId: string;
        warehouseId: string;
        mustResetPassword: boolean;
        tokenVersion: number;
    }>;
}
export {};
