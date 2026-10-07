import { PrismaService } from '../prisma/prisma.service';
import { ScopedUser } from '../auth/scoping.service';
import { ScopingService } from '../auth/scoping.service';
import { isPlatformOwner } from '../auth/roles';
export declare class DashboardService {
    private prisma;
    private scopingService;
    constructor(prisma: PrismaService, scopingService: ScopingService);
    getKpis(user: ScopedUser): Promise<{
        isPlatformOwner: typeof isPlatformOwner;
        platformMetrics: {
            totalCompanies: number;
            activeCompanies: number;
            totalUsers: number;
        };
        clientTenantInfo: {
            id: string;
            code: string;
            name: string;
            isOnboarded: boolean;
            gstin: string | null;
            city: string | null;
        };
        leadsToday: {
            total: number;
            breakdown: {
                indiamart: number;
                web: number;
                whatsapp: number;
                manual: number;
            };
        };
        pendingFollowUps: number;
        ordersInTransit: number;
        lowStockSkus: number;
        activeSuppliers: number;
        leadsByStatus: Record<string, number>;
        leadTrend: {
            date: string;
            indiamart: number;
            web: number;
            whatsapp: number;
            manual: number;
            total: number;
        }[];
        recentOrders: {
            id: string;
            status: string;
            customerName: string;
            totalAmount: number;
            orderNumber: string;
            confirmedAt: Date;
        }[];
    }>;
    getLeadConversionStats(user: ScopedUser): Promise<{
        totalLeads: number;
        wonLeads: number;
        lostLeads: number;
        conversionRate: string;
    }>;
}
