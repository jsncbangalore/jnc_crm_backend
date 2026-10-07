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
var LeadsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const scoping_service_1 = require("../auth/scoping.service");
const notifications_service_1 = require("../notifications/notifications.service");
const audit_service_1 = require("../audit/audit.service");
const tenant_util_1 = require("../common/tenant.util");
let LeadsService = LeadsService_1 = class LeadsService {
    constructor(prisma, scopingService, notificationsService, auditService) {
        this.prisma = prisma;
        this.scopingService = scopingService;
        this.notificationsService = notificationsService;
        this.auditService = auditService;
        this.logger = new common_1.Logger(LeadsService_1.name);
        this.roundRobinIndex = 0;
    }
    normalizePhone(phone) {
        const cleaned = phone.replace(/[^0-9]/g, '');
        if (cleaned.length === 10)
            return `91${cleaned}`;
        if (cleaned.startsWith('0') && cleaned.length === 11)
            return `91${cleaned.substring(1)}`;
        return cleaned;
    }
    async getNextAssigneeId(tenantId) {
        let employees = await this.prisma.user.findMany({
            where: {
                tenantId,
                role: 'employee',
                isActive: true,
                deletedAt: null,
            },
            orderBy: { employeeCode: 'asc' },
        });
        if (employees.length === 0) {
            employees = await this.prisma.user.findMany({
                where: {
                    tenantId,
                    role: { in: ['sub_admin', 'tenant_admin', 'admin'] },
                    isActive: true,
                    deletedAt: null,
                },
                orderBy: { employeeCode: 'asc' },
            });
        }
        if (employees.length === 0)
            return null;
        const assignee = employees[this.roundRobinIndex % employees.length];
        this.roundRobinIndex++;
        return assignee.id;
    }
    async createLead(dto, actor) {
        const tenantId = (0, tenant_util_1.requireTenantId)(actor);
        const normPhone = this.normalizePhone(dto.customerPhone);
        const existingLead = await this.prisma.lead.findFirst({
            where: {
                tenantId,
                OR: [
                    { customerPhone: { contains: normPhone.slice(-10) } },
                    dto.customerEmail ? { customerEmail: { equals: dto.customerEmail.trim(), mode: 'insensitive' } } : undefined,
                ].filter(Boolean),
                deletedAt: null,
            },
            orderBy: { createdAt: 'desc' },
            include: { assignedTo: true },
        });
        if (existingLead) {
            throw new common_1.BadRequestException(`Duplicate lead detected: A record with phone ${dto.customerPhone} already exists (${existingLead.leadNumber} - ${existingLead.customerName}). Duplicate lead creation is not allowed.`);
        }
        let assignedToId = dto.assignedToId;
        if (!assignedToId) {
            assignedToId = await this.getNextAssigneeId(tenantId);
        }
        let companyId = null;
        if (dto.companyName) {
            let company = await this.prisma.company.findFirst({
                where: { tenantId, name: { equals: dto.companyName.trim(), mode: 'insensitive' } },
            });
            if (!company) {
                company = await this.prisma.company.create({
                    data: {
                        tenantId,
                        name: dto.companyName.trim(),
                        city: dto.city,
                    },
                });
            }
            companyId = company.id;
        }
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { code: true } });
        const prefix = tenant?.code ? `${tenant.code}-LD` : 'LD';
        const count = await this.prisma.lead.count({ where: { tenantId } });
        const leadNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;
        const lead = await this.prisma.lead.create({
            data: {
                tenantId,
                leadNumber,
                source: dto.source || 'manual',
                status: 'new',
                customerName: dto.customerName,
                customerPhone: dto.customerPhone,
                customerEmail: dto.customerEmail,
                city: dto.city,
                productCategory: dto.productCategory,
                productName: dto.productName,
                quantity: dto.quantity ? Number(dto.quantity) : 1,
                estimatedValue: dto.estimatedValue ? Number(dto.estimatedValue) : 0,
                urgency: dto.urgency || 'standard',
                queryMessage: dto.queryMessage,
                rawPayload: dto.rawPayload,
                isDuplicate: false,
                companyId,
                assignedToId,
                createdById: actor?.id && actor.id !== 'system-webhook' ? actor.id : null,
            },
            include: {
                assignedTo: {
                    select: { id: true, name: true, employeeCode: true, email: true },
                },
                company: true,
            },
        });
        if (assignedToId) {
            await this.notificationsService.createInAppTask({
                tenantId,
                leadId: lead.id,
                userId: assignedToId,
                title: `New Lead ${lead.leadNumber} assigned: ${lead.customerName}`,
                description: `Source: ${lead.source.toUpperCase()} | Product: ${lead.productCategory || lead.productName || 'N/A'} | City: ${lead.city || 'N/A'}. Follow up manually via call/email.`,
            });
        }
        await this.auditService.log({
            tenantId,
            actorId: actor?.id,
            actorName: actor ? actor.employeeCode : 'System Webhook',
            action: 'CREATE',
            entityName: 'Lead',
            entityId: lead.id,
            afterState: lead,
        });
        return lead;
    }
    async previewImport(records, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const evaluatedRows = [];
        const seenInSheet = new Map();
        let duplicateCount = 0;
        let validCount = 0;
        for (let i = 0; i < records.length; i++) {
            const r = records[i];
            const customerName = (r.contact_name || r.contactName || r.customer_name || r.customerName || r.name || r.Name || '').toString().trim();
            const companyName = (r.company_name || r.companyName || r.company || r.Company || '').toString().trim();
            const rawPhone = (r.phone || r.customerPhone || r.mobile || r.Mobile || r.contact || '').toString().trim();
            const customerPhone = this.normalizePhone(rawPhone);
            const customerEmail = (r.email || r.customerEmail || r.Email || '').toString().trim();
            const productCategory = (r.product_interest || r.productCategory || r.product || r.Product || r.sku || r.SKU || r.component || '').toString().trim();
            const city = (r.city || r.City || r.location || '').toString().trim();
            const estimatedValue = parseFloat(r.estimated_value || r.estimatedValue || r.value || r.Value || 0) || 0;
            const assignedTo = (r.assigned_to || r.assignedTo || r.rep || r.agent || '').toString().trim();
            const source = (r.source || r.Source || 'manual').toString().trim().toLowerCase();
            if (!customerName && !customerPhone && !companyName) {
                continue;
            }
            const phoneKey = customerPhone.slice(-10);
            let isDuplicate = false;
            let duplicateReason = '';
            let matchedLead = null;
            if (phoneKey && seenInSheet.has(phoneKey)) {
                isDuplicate = true;
                duplicateReason = `Duplicate of Row ${seenInSheet.get(phoneKey)} in this sheet`;
                duplicateCount++;
            }
            else if (customerPhone && customerPhone.length >= 7) {
                matchedLead = await this.prisma.lead.findFirst({
                    where: {
                        tenantId,
                        customerPhone: { contains: phoneKey },
                        createdAt: { gte: thirtyDaysAgo },
                        deletedAt: null,
                    },
                    include: {
                        assignedTo: { select: { id: true, name: true, employeeCode: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                });
                if (matchedLead) {
                    isDuplicate = true;
                    duplicateReason = `Active in CRM (${matchedLead.leadNumber} — ${matchedLead.assignedTo?.name || 'Assigned'})`;
                    duplicateCount++;
                }
                else {
                    validCount++;
                }
            }
            else {
                validCount++;
            }
            if (phoneKey && !seenInSheet.has(phoneKey)) {
                seenInSheet.set(phoneKey, i + 1);
            }
            evaluatedRows.push({
                rowIndex: i + 1,
                customerName: customerName || 'Unnamed Contact',
                companyName,
                customerPhone,
                customerEmail,
                productCategory: productCategory || 'Electronic Components',
                city,
                estimatedValue,
                assignedTo,
                source: source || 'manual',
                isDuplicate,
                duplicateReason,
                matchedLeadNumber: matchedLead?.leadNumber,
                matchedAt: matchedLead?.createdAt,
                matchedAssignee: matchedLead?.assignedTo?.name,
                isValid: !!customerName && !!customerPhone,
            });
        }
        return {
            totalCount: evaluatedRows.length,
            duplicateCount,
            validCount,
            rows: evaluatedRows,
        };
    }
    async findAll(user, query = {}) {
        const scopeWhere = this.scopingService.getLeadScope(user);
        const where = {
            ...scopeWhere,
            deletedAt: null,
        };
        if (query.status) {
            where.status = query.status;
        }
        if (query.source) {
            where.source = query.source;
        }
        if (query.urgency) {
            where.urgency = query.urgency;
        }
        if (query.assignedToId) {
            where.assignedToId = query.assignedToId;
        }
        if (query.startDate && query.endDate) {
            where.createdAt = {
                gte: new Date(query.startDate),
                lte: new Date(query.endDate),
            };
        }
        if (query.search) {
            const searchOR = [
                { leadNumber: { contains: query.search, mode: 'insensitive' } },
                { customerName: { contains: query.search, mode: 'insensitive' } },
                { customerPhone: { contains: query.search, mode: 'insensitive' } },
                { customerEmail: { contains: query.search, mode: 'insensitive' } },
                { city: { contains: query.search, mode: 'insensitive' } },
                { productCategory: { contains: query.search, mode: 'insensitive' } },
                { productName: { contains: query.search, mode: 'insensitive' } },
            ];
            if (scopeWhere.OR) {
                where.AND = [{ OR: scopeWhere.OR }, { OR: searchOR }];
                delete where.OR;
            }
            else {
                where.OR = searchOR;
            }
        }
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 100;
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.prisma.lead.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    assignedTo: {
                        select: { id: true, name: true, employeeCode: true, email: true },
                    },
                    company: true,
                    contact: true,
                    activities: {
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                    },
                },
            }),
            this.prisma.lead.count({ where }),
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const scopeWhere = this.scopingService.getLeadScope(user);
        const lead = await this.prisma.lead.findFirst({
            where: { id, tenantId, ...scopeWhere, deletedAt: null },
            include: {
                assignedTo: {
                    select: { id: true, name: true, employeeCode: true, email: true },
                },
                company: true,
                contact: true,
                activities: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        performedBy: {
                            select: { id: true, name: true, employeeCode: true },
                        },
                    },
                },
                quotations: {
                    include: {
                        lines: {
                            include: { sku: true },
                        },
                    },
                },
            },
        });
        if (!lead) {
            throw new common_1.NotFoundException('Lead not found');
        }
        return lead;
    }
    async updateStatus(id, dto, user) {
        const lead = await this.findOne(id, user);
        const oldStatus = lead.status;
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const updateRes = await this.prisma.lead.updateMany({
            where: { id, tenantId, deletedAt: null },
            data: {
                status: dto.status,
                lostReason: dto.status === 'lost' ? dto.lostReason : null,
            },
        });
        if (updateRes.count === 0) {
            throw new common_1.NotFoundException('Lead not found');
        }
        const updated = await this.findOne(id, user);
        await this.prisma.statusHistory.create({
            data: {
                entityType: 'lead',
                entityId: id,
                fromStatus: oldStatus,
                toStatus: dto.status,
                changedById: user.id,
                note: dto.note || `Status changed from ${oldStatus} to ${dto.status}`,
            },
        });
        await this.prisma.leadActivity.create({
            data: {
                leadId: id,
                userId: user.id,
                type: 'status_change',
                title: `Status updated to ${dto.status.toUpperCase()}`,
                description: dto.note || (dto.lostReason ? `Reason: ${dto.lostReason}` : undefined),
                isCompleted: true,
                completedAt: new Date(),
            },
        });
        await this.auditService.log({
            tenantId: (0, tenant_util_1.requireTenantId)(user),
            actorId: user.id,
            actorName: user.employeeCode,
            action: 'STATUS_CHANGE',
            entityName: 'Lead',
            entityId: id,
            beforeState: { status: oldStatus },
            afterState: { status: dto.status, note: dto.note },
        });
        return updated;
    }
    async addActivity(leadId, dto, user) {
        const lead = await this.findOne(leadId, user);
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        if (dto.type === 'email' && dto.sendEmailToCustomer && lead.customerEmail) {
            if (user.role !== 'platform_super_admin' && user.role !== 'tenant_admin' && user.role !== 'admin') {
                throw new common_1.ForbiddenException('Only Administrators are authorized to send direct outward emails from the CRM.');
            }
            try {
                const branding = await this.notificationsService.getBranding(tenantId);
                await this.notificationsService.sendEmail({
                    tenantId,
                    to: lead.customerEmail,
                    subject: dto.title || `Update regarding your inquiry with ${branding.companyDisplayName}`,
                    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <div style="background: #2E5EFF; color: white; padding: 16px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">${branding.companyDisplayName}</h2>
              </div>
              <p>Dear <strong>${lead.customerName}</strong>,</p>
              <div style="background: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid #2E5EFF; margin: 16px 0; font-size: 14px; line-height: 1.6; color: #1e293b;">
                ${(dto.description || '').replace(/\n/g, '<br/>')}
              </div>
              <p style="font-size: 13px; color: #64748b;">
                Reference Inquiry: <strong>${lead.leadNumber}</strong>
              </p>
            </div>
          `,
                    relatedEntityType: 'lead',
                    relatedEntityId: leadId,
                });
            }
            catch (err) {
                this.logger.error(`Failed to send direct lead email: ${err.message}`);
            }
        }
        const activity = await this.prisma.leadActivity.create({
            data: {
                leadId,
                userId: user.id,
                type: dto.type,
                title: dto.title,
                description: dto.description,
                scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
                isCompleted: dto.isCompleted !== undefined ? dto.isCompleted : true,
                completedAt: dto.isCompleted ? new Date() : null,
            },
            include: {
                performedBy: {
                    select: { id: true, name: true, employeeCode: true },
                },
            },
        });
        return activity;
    }
    async commitImport(records, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const results = {
            totalRows: records.length,
            importedCount: 0,
            errors: [],
            createdLeadNumbers: [],
        };
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { code: true } });
        const prefix = tenant?.code ? `${tenant.code}-LD` : 'LD';
        for (let i = 0; i < records.length; i++) {
            const r = records[i];
            try {
                if (!r.customerName || !r.customerPhone) {
                    results.errors.push(`Row ${i + 1}: Missing customer name or phone`);
                    continue;
                }
                const normPhone = this.normalizePhone(r.customerPhone);
                const existing = await this.prisma.lead.findFirst({
                    where: {
                        tenantId,
                        OR: [
                            { customerPhone: { contains: normPhone.slice(-10) } },
                            r.customerEmail ? { customerEmail: { equals: r.customerEmail.trim(), mode: 'insensitive' } } : undefined,
                        ].filter(Boolean),
                        deletedAt: null,
                    },
                });
                if (existing) {
                    results.errors.push(`Row ${i + 1} (${r.customerName} - ${r.customerPhone}): Skipped duplicate (Already exists as ${existing.leadNumber})`);
                    continue;
                }
                let companyId = null;
                if (r.companyName) {
                    let comp = await this.prisma.company.findFirst({
                        where: { tenantId, name: { equals: r.companyName.trim(), mode: 'insensitive' } },
                    });
                    if (!comp) {
                        comp = await this.prisma.company.create({
                            data: {
                                tenantId,
                                name: r.companyName.trim(),
                                city: r.city,
                            },
                        });
                    }
                    companyId = comp.id;
                }
                let assignedToId = null;
                if (r.assignedTo) {
                    const matchedUser = await this.prisma.user.findFirst({
                        where: {
                            tenantId,
                            OR: [
                                { name: { contains: r.assignedTo, mode: 'insensitive' } },
                                { employeeCode: { equals: r.assignedTo, mode: 'insensitive' } },
                                { email: { equals: r.assignedTo, mode: 'insensitive' } },
                            ],
                            isActive: true,
                            deletedAt: null,
                        },
                    });
                    if (matchedUser) {
                        assignedToId = matchedUser.id;
                    }
                }
                if (!assignedToId) {
                    assignedToId = await this.getNextAssigneeId(tenantId);
                }
                const count = await this.prisma.lead.count({ where: { tenantId } });
                const leadNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;
                const lead = await this.prisma.lead.create({
                    data: {
                        tenantId,
                        leadNumber,
                        source: r.source || 'manual',
                        status: 'new',
                        customerName: r.customerName.trim(),
                        customerPhone: this.normalizePhone(r.customerPhone),
                        customerEmail: r.customerEmail?.trim() || undefined,
                        city: r.city?.trim() || undefined,
                        productCategory: r.productCategory?.trim() || 'Electronic Components',
                        estimatedValue: Number(r.estimatedValue) || 0,
                        queryMessage: r.queryMessage || `[Bulk Imported via Excel/CSV by ${user.employeeCode || user.id || 'Admin'}]`,
                        isDuplicate: !!r.isDuplicate,
                        companyId,
                        assignedToId,
                    },
                });
                await this.prisma.leadActivity.create({
                    data: {
                        leadId: lead.id,
                        userId: user.id,
                        type: 'note',
                        title: 'Lead Bulk-Imported from Spreadsheet',
                        description: `Imported via spreadsheet batch by ${user.employeeCode || user.id || 'Admin'}. Assigned to ${assignedToId}.`,
                        isCompleted: true,
                        completedAt: new Date(),
                    },
                });
                results.importedCount++;
                results.createdLeadNumbers.push(leadNumber);
            }
            catch (err) {
                results.errors.push(`Row ${i + 1}: ${err.message}`);
            }
        }
        return results;
    }
    async shareLead(leadId, targetUserId, actor) {
        const tenantId = (0, tenant_util_1.requireTenantId)(actor);
        const lead = await this.prisma.lead.findFirst({
            where: { id: leadId, tenantId },
        });
        if (!lead) {
            throw new common_1.NotFoundException(`Lead with ID ${leadId} not found in your company.`);
        }
        if (actor.role !== 'platform_super_admin' &&
            actor.role !== 'tenant_admin' &&
            actor.role !== 'admin' &&
            lead.assignedToId !== actor.id) {
            throw new common_1.ForbiddenException('Only the lead owner or an Administrator can share this lead.');
        }
        const share = await this.prisma.leadShare.upsert({
            where: {
                leadId_userId: {
                    leadId,
                    userId: targetUserId,
                },
            },
            create: {
                tenantId,
                leadId,
                userId: targetUserId,
                sharedById: actor.id,
            },
            update: {},
        });
        await this.auditService.log({
            tenantId,
            actorId: actor.id,
            action: 'SHARE',
            entityName: 'Lead',
            entityId: leadId,
            afterState: { sharedWithUserId: targetUserId },
        });
        return share;
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = LeadsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        scoping_service_1.ScopingService,
        notifications_service_1.NotificationsService,
        audit_service_1.AuditService])
], LeadsService);
