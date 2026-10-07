"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const scoping_service_1 = require("../auth/scoping.service");
const roles_1 = require("../auth/roles");
let DashboardService = class DashboardService {
    constructor(prisma, scopingService) {
        this.prisma = prisma;
        this.scopingService = scopingService;
    }
    async getKpis(user) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const leadScope = this.scopingService.getLeadScope(user);
        const orderScope = this.scopingService.getOrderScope(user);
        const tenantScope = this.scopingService.getTenantScope(user);
        const platformOwner = (0, roles_1.isPlatformOwner)(user);
        let platformMetrics = null;
        if (platformOwner) {
            const [totalCompanies, activeCompanies, totalUsers] = await Promise.all([
                this.prisma.tenant.count({ where: { deletedAt: null } }),
                this.prisma.tenant.count({ where: { status: 'active', deletedAt: null } }),
                this.prisma.user.count({ where: { deletedAt: null } }),
            ]);
            platformMetrics = { totalCompanies, activeCompanies, totalUsers };
        }
        let clientTenantInfo = null;
        if (user.tenantId) {
            const tenantRecord = await this.prisma.tenant.findUnique({
                where: { id: user.tenantId },
                select: { id: true, code: true, name: true, isOnboarded: true, gstin: true, city: true },
            });
            if (tenantRecord) {
                clientTenantInfo = tenantRecord;
            }
        }
        const [leadsToday, leadsIndiamart, leadsWeb, leadsWhatsapp, leadsManual] = await Promise.all([
            this.prisma.lead.count({
                where: { ...leadScope, createdAt: { gte: today, lte: todayEnd }, deletedAt: null },
            }),
            this.prisma.lead.count({
                where: { ...leadScope, source: 'indiamart', createdAt: { gte: today, lte: todayEnd }, deletedAt: null },
            }),
            this.prisma.lead.count({
                where: { ...leadScope, source: 'web', createdAt: { gte: today, lte: todayEnd }, deletedAt: null },
            }),
            this.prisma.lead.count({
                where: { ...leadScope, source: 'whatsapp', createdAt: { gte: today, lte: todayEnd }, deletedAt: null },
            }),
            this.prisma.lead.count({
                where: { ...leadScope, source: 'manual', createdAt: { gte: today, lte: todayEnd }, deletedAt: null },
            }),
        ]);
        const pendingFollowUps = await this.prisma.leadActivity.count({
            where: {
                isCompleted: false,
                type: { in: ['task', 'reminder', 'call'] },
                lead: { ...leadScope, deletedAt: null },
            },
        });
        const ordersInTransit = await this.prisma.order.count({
            where: {
                ...orderScope,
                status: { in: ['confirmed', 'processing', 'dispatched'] },
                deletedAt: null,
            },
        });
        let lowStockCount = 0;
        try {
            const invScope = this.scopingService.getInventoryScope(user);
            const allSkus = await this.prisma.sku.findMany({
                where: { ...invScope, deletedAt: null },
                include: { stockItems: true },
            });
            lowStockCount = allSkus.filter((sku) => {
                const totalOnHand = sku.stockItems.reduce((s, si) => s + si.quantityOnHand, 0);
                return totalOnHand <= sku.reorderPoint;
            }).length;
        }
        catch {
            lowStockCount = 0;
        }
        let activeSuppliersCount = 0;
        try {
            const supplierScope = this.scopingService.getSupplierScope(user);
            activeSuppliersCount = await this.prisma.supplier.count({
                where: { ...supplierScope, isActive: true, deletedAt: null },
            });
        }
        catch {
            activeSuppliersCount = 0;
        }
        const leadsByStatus = await this.prisma.lead.groupBy({
            by: ['status'],
            where: { ...leadScope, deletedAt: null },
            _count: true,
        });
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const recentLeads = await this.prisma.lead.findMany({
            where: {
                ...leadScope,
                createdAt: { gte: sevenDaysAgo },
                deletedAt: null,
            },
            select: { createdAt: true, source: true },
        });
        const leadTrend = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i);
            const key = d.toISOString().split('T')[0];
            leadTrend[key] = { date: key, indiamart: 0, web: 0, whatsapp: 0, manual: 0, total: 0 };
        }
        for (const lead of recentLeads) {
            const key = lead.createdAt.toISOString().split('T')[0];
            if (leadTrend[key]) {
                leadTrend[key][lead.source]++;
                leadTrend[key].total++;
            }
        }
        const recentOrders = await this.prisma.order.findMany({
            where: { ...orderScope, deletedAt: null },
            take: 5,
            orderBy: { confirmedAt: 'desc' },
            select: {
                id: true, orderNumber: true, customerName: true,
                totalAmount: true, status: true, confirmedAt: true,
            },
        });
        return {
            isPlatformOwner: roles_1.isPlatformOwner,
            platformMetrics,
            clientTenantInfo,
            leadsToday: {
                total: leadsToday,
                breakdown: {
                    indiamart: leadsIndiamart,
                    web: leadsWeb,
                    whatsapp: leadsWhatsapp,
                    manual: leadsManual,
                },
            },
            pendingFollowUps,
            ordersInTransit,
            lowStockSkus: lowStockCount,
            activeSuppliers: activeSuppliersCount,
            leadsByStatus: leadsByStatus.reduce((acc, row) => {
                acc[row.status] = row._count;
                return acc;
            }, {}),
            leadTrend: Object.values(leadTrend),
            recentOrders,
        };
    }
    async getLeadConversionStats(user) {
        const leadScope = this.scopingService.getLeadScope(user);
        const totalLeads = await this.prisma.lead.count({ where: { ...leadScope, deletedAt: null } });
        const wonLeads = await this.prisma.lead.count({ where: { ...leadScope, status: 'won', deletedAt: null } });
        const lostLeads = await this.prisma.lead.count({ where: { ...leadScope, status: 'lost', deletedAt: null } });
        return {
            totalLeads,
            wonLeads,
            lostLeads,
            conversionRate: totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0',
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        scoping_service_1.ScopingService])
], DashboardService);
