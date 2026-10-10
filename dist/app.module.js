"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const audit_module_1 = require("./audit/audit.module");
const notifications_module_1 = require("./notifications/notifications.module");
const leads_module_1 = require("./leads/leads.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
const orders_module_1 = require("./orders/orders.module");
const inventory_module_1 = require("./inventory/inventory.module");
const suppliers_module_1 = require("./suppliers/suppliers.module");
const automation_module_1 = require("./automation/automation.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const invoicing_module_1 = require("./invoicing/invoicing.module");
const users_module_1 = require("./users/users.module");
const teams_module_1 = require("./teams/teams.module");
const custom_objects_module_1 = require("./custom-objects/custom-objects.module");
const companies_module_1 = require("./companies/companies.module");
const quotations_module_1 = require("./quotations/quotations.module");
const backup_module_1 = require("./backup/backup.module");
const settings_module_1 = require("./settings/settings.module");
const activities_module_1 = require("./activities/activities.module");
const platform_module_1 = require("./platform/platform.module");
const health_controller_1 = require("./health/health.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([
                {
                    name: 'default',
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            audit_module_1.AuditModule,
            notifications_module_1.NotificationsModule,
            leads_module_1.LeadsModule,
            webhooks_module_1.WebhooksModule,
            orders_module_1.OrdersModule,
            inventory_module_1.InventoryModule,
            suppliers_module_1.SuppliersModule,
            automation_module_1.AutomationModule,
            dashboard_module_1.DashboardModule,
            invoicing_module_1.InvoicingModule,
            users_module_1.UsersModule,
            teams_module_1.TeamsModule,
            custom_objects_module_1.CustomObjectsModule,
            companies_module_1.CompaniesModule,
            quotations_module_1.QuotationsModule,
            backup_module_1.BackupModule,
            settings_module_1.SettingsModule,
            activities_module_1.ActivitiesModule,
            platform_module_1.PlatformModule,
        ],
        controllers: [health_controller_1.HealthController],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
