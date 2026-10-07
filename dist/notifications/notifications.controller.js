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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const notifications_service_1 = require("./notifications.service");
const prisma_service_1 = require("../prisma/prisma.service");
let NotificationsController = class NotificationsController {
    constructor(notificationsService, prisma) {
        this.notificationsService = notificationsService;
        this.prisma = prisma;
    }
    async getNotifications(user, channel, search) {
        const where = {};
        if (channel && channel !== 'all') {
            where.channel = channel;
        }
        if (search) {
            where.OR = [
                { recipient: { contains: search } },
                { subject: { contains: search } },
                { body: { contains: search } },
            ];
        }
        const items = await this.prisma.messageLog.findMany({
            where,
            take: 100,
            orderBy: { sentAt: 'desc' },
        });
        const total = await this.prisma.messageLog.count({ where });
        return { items, total };
    }
    async syncGoDaddy(user) {
        return this.notificationsService.syncGoDaddyInbox();
    }
    async handleInboundEmail(body) {
        const fromEmail = body.from || 'client@example.com';
        const cleanFrom = fromEmail.replace(/.*<([^>]+)>.*/, '$1').trim();
        const lead = await this.prisma.lead.findFirst({
            where: {
                OR: [
                    { customerEmail: { equals: cleanFrom } },
                    body.leadNumber ? { leadNumber: { equals: body.leadNumber } } : undefined,
                ].filter(Boolean),
                deletedAt: null,
            },
            include: { assignedTo: true },
        });
        const content = body.text || body.html || 'Customer email reply received.';
        const messageLog = await this.prisma.messageLog.create({
            data: {
                channel: 'email_inbound',
                recipient: 'jayaraj@jsnc.co.in',
                subject: body.subject || `Reply from ${cleanFrom}`,
                body: content,
                status: 'received',
                relatedEntityType: lead ? 'lead' : undefined,
                relatedEntityId: lead ? lead.id : undefined,
            },
        });
        if (lead) {
            await this.prisma.leadActivity.create({
                data: {
                    leadId: lead.id,
                    userId: lead.assignedToId || undefined,
                    type: 'email',
                    title: `Customer Email Reply: ${body.subject || 'No Subject'}`,
                    description: content,
                    isCompleted: true,
                    completedAt: new Date(),
                },
            });
            if (lead.status === 'new') {
                await this.prisma.lead.updateMany({
                    where: { id: lead.id, tenantId: lead.tenantId },
                    data: { status: 'contacted' },
                });
            }
        }
        return { success: true, messageId: messageLog.id, matchedLead: lead?.leadNumber };
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('channel')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Post)('sync-godaddy'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "syncGoDaddy", null);
__decorate([
    (0, common_1.Post)('inbound-email'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "handleInboundEmail", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService,
        prisma_service_1.PrismaService])
], NotificationsController);
