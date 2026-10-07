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
var AutomationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationService = exports.ALLOWED_STEP_TYPES = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const inventory_service_1 = require("../inventory/inventory.service");
const tenant_util_1 = require("../common/tenant.util");
const brand_1 = require("../common/brand");
exports.ALLOWED_STEP_TYPES = [
    'send_email',
    'send_sms',
    'create_in_app_task',
    'update_lead_field',
    'reassign_record',
    'wait_then_continue',
];
let AutomationService = AutomationService_1 = class AutomationService {
    constructor(prisma, notificationsService, inventoryService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.inventoryService = inventoryService;
        this.logger = new common_1.Logger(AutomationService_1.name);
    }
    async onModuleInit() {
        await this.migrateLegacyRulesToSteps();
    }
    async migrateLegacyRulesToSteps() {
        try {
            const rulesWithoutSteps = await this.prisma.automationRule.findMany({
                where: {
                    steps: {
                        none: {},
                    },
                },
            });
            if (rulesWithoutSteps.length > 0) {
                this.logger.log(`Migrating ${rulesWithoutSteps.length} legacy automation rules to multi-step pipeline...`);
                for (const rule of rulesWithoutSteps) {
                    let stepType = 'send_email';
                    if (rule.actionType === 'sms')
                        stepType = 'send_sms';
                    else if (rule.actionType === 'in_app_task')
                        stepType = 'create_in_app_task';
                    await this.prisma.automationStep.create({
                        data: {
                            ruleId: rule.id,
                            stepOrder: 1,
                            stepType,
                            config: rule.actionPayloadJson || '{}',
                        },
                    });
                }
                this.logger.log(`Successfully migrated ${rulesWithoutSteps.length} rules to multi-step architecture.`);
            }
        }
        catch (err) {
            this.logger.warn(`Migration check failed: ${err.message}`);
        }
    }
    validateStep(step) {
        const stepType = (step.stepType || '').toLowerCase().trim();
        if (stepType === 'whatsapp') {
            throw new common_1.BadRequestException('Step type "whatsapp" is strictly prohibited by system security policy.');
        }
        if (!exports.ALLOWED_STEP_TYPES.includes(stepType)) {
            throw new common_1.BadRequestException(`Invalid step type "${stepType}". Allowed types: ${exports.ALLOWED_STEP_TYPES.join(', ')}`);
        }
        let parsedConfig = {};
        if (typeof step.config === 'string') {
            try {
                parsedConfig = JSON.parse(step.config);
            }
            catch {
                throw new common_1.BadRequestException(`Config for step "${stepType}" must be valid JSON.`);
            }
        }
        else if (typeof step.config === 'object' && step.config !== null) {
            parsedConfig = step.config;
        }
        if (stepType === 'wait_then_continue') {
            const hours = Number(parsedConfig.duration_hours || parsedConfig.durationHours || parsedConfig.duration_seconds || parsedConfig.durationSeconds);
            if (isNaN(hours) || hours <= 0) {
                throw new common_1.BadRequestException('wait_then_continue step requires a positive duration (duration_hours > 0).');
            }
        }
        if (stepType === 'reassign_record') {
            const mode = parsedConfig.mode || 'round_robin';
            if (mode === 'specific_user' && !parsedConfig.user_id && !parsedConfig.userId) {
                throw new common_1.BadRequestException('reassign_record with mode "specific_user" requires a valid "user_id".');
            }
        }
        if (stepType === 'update_lead_field') {
            const allowedFields = ['status', 'urgency', 'notes'];
            if (!parsedConfig.field || !allowedFields.includes(parsedConfig.field)) {
                throw new common_1.BadRequestException(`update_lead_field requires field to be one of: ${allowedFields.join(', ')}`);
            }
        }
        return {
            stepType: stepType,
            config: JSON.stringify(parsedConfig),
        };
    }
    async getAllRules(user, filter) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const where = { tenantId };
        if (filter?.search) {
            where.OR = [
                { name: { contains: filter.search } },
                { triggerEvent: { contains: filter.search } },
            ];
        }
        if (filter?.triggerEvent) {
            where.triggerEvent = filter.triggerEvent;
        }
        if (filter?.isActive !== undefined) {
            where.isActive = filter.isActive;
        }
        const rules = await this.prisma.automationRule.findMany({
            where,
            include: {
                steps: {
                    orderBy: { stepOrder: 'asc' },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        return rules;
    }
    async getRuleById(user, id) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const rule = await this.prisma.automationRule.findFirst({
            where: { id, tenantId },
            include: {
                steps: {
                    orderBy: { stepOrder: 'asc' },
                },
            },
        });
        if (!rule) {
            throw new common_1.NotFoundException(`Automation rule with ID "${id}" not found`);
        }
        return rule;
    }
    async createRule(user, data) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        if (!data.name || !data.name.trim()) {
            throw new common_1.BadRequestException('Rule name is required');
        }
        if (!data.triggerEvent || !data.triggerEvent.trim()) {
            throw new common_1.BadRequestException('Trigger event is required');
        }
        let conditionJson = '{}';
        if (data.conditionJson) {
            try {
                JSON.parse(data.conditionJson);
                conditionJson = data.conditionJson;
            }
            catch {
                throw new common_1.BadRequestException('conditionJson must be valid JSON');
            }
        }
        let stepsToCreate = [];
        if (data.steps && Array.isArray(data.steps) && data.steps.length > 0) {
            stepsToCreate = data.steps.map((step, idx) => {
                const validated = this.validateStep(step);
                return {
                    stepOrder: step.stepOrder !== undefined ? step.stepOrder : idx + 1,
                    stepType: validated.stepType,
                    config: validated.config,
                };
            });
        }
        else if (data.actionType) {
            const validated = this.validateStep({
                stepType: data.actionType === 'email' ? 'send_email' : data.actionType === 'sms' ? 'send_sms' : data.actionType,
                config: data.actionPayloadJson || '{}',
            });
            stepsToCreate = [
                {
                    stepOrder: 1,
                    stepType: validated.stepType,
                    config: validated.config,
                },
            ];
        }
        else {
            throw new common_1.BadRequestException('Rule must contain at least one step in the pipeline.');
        }
        const firstStep = stepsToCreate[0];
        const rule = await this.prisma.automationRule.create({
            data: {
                tenantId,
                name: data.name.trim(),
                triggerEvent: data.triggerEvent.trim(),
                conditionJson,
                actionType: firstStep.stepType,
                actionPayloadJson: firstStep.config,
                isActive: data.isActive !== undefined ? data.isActive : true,
                steps: {
                    create: stepsToCreate,
                },
            },
            include: {
                steps: {
                    orderBy: { stepOrder: 'asc' },
                },
            },
        });
        this.logger.log(`Created multi-step automation rule: "${rule.name}" with ${rule.steps.length} steps [ID: ${rule.id}]`);
        return rule;
    }
    async updateRule(user, id, data) {
        await this.getRuleById(user, id);
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name.trim();
        if (data.triggerEvent !== undefined)
            updateData.triggerEvent = data.triggerEvent.trim();
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        if (data.conditionJson !== undefined) {
            try {
                JSON.parse(data.conditionJson);
                updateData.conditionJson = data.conditionJson;
            }
            catch {
                throw new common_1.BadRequestException('conditionJson must be valid JSON');
            }
        }
        if (data.steps && Array.isArray(data.steps)) {
            if (data.steps.length === 0) {
                throw new common_1.BadRequestException('Rule must contain at least one step in the pipeline.');
            }
            const stepsToCreate = data.steps.map((step, idx) => {
                const validated = this.validateStep(step);
                return {
                    stepOrder: step.stepOrder !== undefined ? step.stepOrder : idx + 1,
                    stepType: validated.stepType,
                    config: validated.config,
                };
            });
            await this.prisma.automationStep.deleteMany({ where: { ruleId: id } });
            for (const s of stepsToCreate) {
                await this.prisma.automationStep.create({
                    data: {
                        ruleId: id,
                        stepOrder: s.stepOrder,
                        stepType: s.stepType,
                        config: s.config,
                    },
                });
            }
            updateData.actionType = stepsToCreate[0].stepType;
            updateData.actionPayloadJson = stepsToCreate[0].config;
        }
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        await this.prisma.automationRule.updateMany({
            where: { id, tenantId },
            data: updateData,
        });
        const updated = await this.getRuleById(user, id);
        this.logger.log(`Updated automation rule: "${updated.name}" [ID: ${id}]`);
        return updated;
    }
    async toggleRuleActive(user, id, targetActive) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const existing = await this.getRuleById(user, id);
        const newActiveState = targetActive !== undefined ? targetActive : !existing.isActive;
        await this.prisma.automationRule.updateMany({
            where: { id, tenantId },
            data: { isActive: newActiveState },
        });
        const updated = await this.getRuleById(user, id);
        this.logger.log(`Toggled rule "${updated.name}" active state -> ${newActiveState}`);
        return updated;
    }
    async deleteRule(user, id) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const existing = await this.getRuleById(user, id);
        await this.prisma.automationRule.deleteMany({ where: { id, tenantId } });
        this.logger.log(`Deleted automation rule: "${existing.name}" [ID: ${id}]`);
        return { success: true, message: `Rule "${existing.name}" deleted successfully` };
    }
    async getMetrics(user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const rules = await this.prisma.automationRule.findMany({
            where: { tenantId },
            include: { steps: true },
        });
        const totalRules = rules.length;
        const activeRules = rules.filter((r) => r.isActive).length;
        const pausedRules = totalRules - activeRules;
        const byActionType = {
            send_email: 0,
            send_sms: 0,
            create_in_app_task: 0,
            update_lead_field: 0,
            reassign_record: 0,
            wait_then_continue: 0,
        };
        rules.forEach((r) => {
            r.steps.forEach((s) => {
                byActionType[s.stepType] = (byActionType[s.stepType] || 0) + 1;
            });
        });
        const byTrigger = rules.reduce((acc, r) => {
            acc[r.triggerEvent] = (acc[r.triggerEvent] || 0) + 1;
            return acc;
        }, {});
        return {
            totalRules,
            activeRules,
            pausedRules,
            byActionType,
            byTrigger,
        };
    }
    async evaluateRules(triggerEvent, context) {
        const currentDepth = context._depth || 0;
        const MAX_AUTOMATION_DEPTH = 3;
        if (currentDepth >= MAX_AUTOMATION_DEPTH) {
            this.logger.warn(`AUTOMATION CASCADE GUARD: Aborted rule evaluation for "${triggerEvent}" at depth ${currentDepth} on entity "${context.leadId || context.entityId}" to prevent recursive infinite loops.`);
            return;
        }
        const tenantId = context.tenantId;
        if (!tenantId) {
            this.logger.warn(`AUTOMATION GUARD: Trigger event "${triggerEvent}" aborted: missing tenantId in context`);
            return;
        }
        const where = { triggerEvent, isActive: true, tenantId };
        const rules = await this.prisma.automationRule.findMany({
            where,
            include: {
                steps: {
                    orderBy: { stepOrder: 'asc' },
                },
            },
        });
        for (const rule of rules) {
            try {
                if (context._visitedRuleIds && context._visitedRuleIds.includes(rule.id)) {
                    this.logger.warn(`AUTOMATION CYCLE GUARD: Skipping rule "${rule.name}" [ID: ${rule.id}] to prevent self-trigger loop.`);
                    continue;
                }
                let condition = {};
                try {
                    condition = JSON.parse(rule.conditionJson);
                }
                catch { }
                const matches = this.evaluateCondition(condition, context);
                if (!matches)
                    continue;
                const executionContext = {
                    ...context,
                    _depth: currentDepth + 1,
                    _visitedRuleIds: [...(context._visitedRuleIds || []), rule.id],
                };
                this.logger.log(`Rule "${rule.name}" triggered by event "${triggerEvent}" (depth: ${currentDepth}) -> executing ${rule.steps.length} steps`);
                await this.executeStepSequence(rule, rule.steps, 0, executionContext);
            }
            catch (err) {
                this.logger.error(`Rule "${rule.name}" execution failed: ${err.message}`);
            }
        }
    }
    async executeStepSequence(rule, steps, startIndex, context) {
        for (let i = startIndex; i < steps.length; i++) {
            const step = steps[i];
            let config = {};
            try {
                config = JSON.parse(step.config);
            }
            catch { }
            this.logger.log(`Executing Step #${step.stepOrder} (${step.stepType}) for rule "${rule.name}"`);
            if (step.stepType === 'wait_then_continue') {
                const hours = Number(config.duration_hours || config.durationHours || 0);
                const seconds = Number(config.duration_seconds || config.durationSeconds || 0);
                const msDelay = hours > 0 ? hours * 3600 * 1000 : (seconds > 0 ? seconds * 1000 : 3600 * 1000);
                const executeAt = new Date(Date.now() + msDelay);
                const delayedJob = await this.prisma.delayedAutomationJob.create({
                    data: {
                        ruleId: rule.id,
                        stepIndex: i + 1,
                        entityType: context.entityType || 'Lead',
                        entityId: context.leadId || context.entityId || 'general',
                        contextJson: JSON.stringify(context),
                        executeAt,
                        status: 'pending',
                    },
                });
                this.logger.log(`Step #${step.stepOrder} wait_then_continue -> scheduled DelayedJob [ID: ${delayedJob.id}] to execute at ${executeAt.toISOString()}`);
                return {
                    deferred: true,
                    delayedJobId: delayedJob.id,
                    executeAt,
                };
            }
            await this.executeSingleStep(step.stepType, config, context, rule);
        }
        return { completed: true };
    }
    async executeSingleStep(stepType, config, context, rule) {
        const tenantId = context.tenantId || rule?.tenantId;
        if (!tenantId) {
            throw new common_1.ForbiddenException('Tenant context required for automated workflow step execution');
        }
        switch (stepType) {
            case 'send_email': {
                let recipientEmail = config.to;
                if (!recipientEmail) {
                    if (config.recipient === 'admin') {
                        const admin = await this.prisma.user.findFirst({
                            where: {
                                role: { in: ['tenant_admin', 'admin'] },
                                isActive: true,
                                tenantId,
                            },
                        });
                        recipientEmail = admin?.email || 'admin@jsnc.co.in';
                    }
                    else if (config.recipient === 'assigned_employee') {
                        if (context.assignedToId) {
                            const rep = await this.prisma.user.findFirst({
                                where: { id: context.assignedToId, tenantId },
                            });
                            recipientEmail = rep?.email;
                        }
                    }
                    else {
                        recipientEmail = context.customerEmail || context.email;
                    }
                }
                if (recipientEmail) {
                    await this.notificationsService.sendEmail({
                        to: recipientEmail,
                        subject: this.interpolate(config.subject || 'Notification from JNC CRM', context),
                        html: this.interpolate(config.html || config.body || 'No message body', context),
                        relatedEntityType: context.entityType,
                        relatedEntityId: context.entityId || context.leadId,
                    });
                }
                break;
            }
            case 'send_sms': {
                let phone = config.phone || context.customerPhone || context.phone;
                if (config.recipient === 'assigned_employee' && context.assignedToId) {
                    const rep = await this.prisma.user.findFirst({
                        where: { id: context.assignedToId, tenantId },
                    });
                    phone = rep?.phone || phone;
                }
                const messageText = this.interpolate(config.message || config.body || '', context);
                if (phone && messageText) {
                    await this.notificationsService.sendSms(phone, messageText);
                }
                break;
            }
            case 'create_in_app_task': {
                const leadId = context.leadId || context.entityId;
                if (leadId) {
                    let assigneeId = config.assigneeId || config.user_id || config.userId;
                    if (!assigneeId) {
                        if (config.recipient === 'admin') {
                            const admin = await this.prisma.user.findFirst({
                                where: {
                                    role: { in: ['tenant_admin', 'admin'] },
                                    isActive: true,
                                    tenantId,
                                },
                            });
                            assigneeId = admin?.id;
                        }
                        else {
                            assigneeId = context.assignedToId;
                        }
                    }
                    await this.notificationsService.createInAppTask({
                        leadId,
                        userId: assigneeId,
                        title: this.interpolate(config.title || 'Automation Follow-up Task', context),
                        description: this.interpolate(config.description || '', context),
                    });
                }
                break;
            }
            case 'update_lead_field': {
                const leadId = context.leadId || context.entityId;
                if (leadId && config.field) {
                    const field = config.field;
                    const value = this.interpolate(String(config.value ?? ''), context);
                    if (field === 'status' || field === 'urgency' || field === 'notes') {
                        const currentLead = await this.prisma.lead.findFirst({
                            where: { id: leadId, tenantId },
                        });
                        const previousValue = currentLead?.[field] ?? '';
                        await this.prisma.lead.updateMany({
                            where: { id: leadId, tenantId },
                            data: { [field]: value },
                        });
                        context[field] = value;
                        await this.prisma.auditLog.create({
                            data: {
                                action: 'AUTOMATION_UPDATE',
                                entityName: 'Lead',
                                entityId: leadId,
                                actorName: 'Automation Engine',
                                beforeState: JSON.stringify({ [field]: previousValue }),
                                afterState: JSON.stringify({ [field]: value }),
                            },
                        });
                        await this.prisma.leadActivity.create({
                            data: {
                                leadId,
                                type: 'system',
                                title: `Automated Lead Update [${rule?.name || 'Workflow Rule'}]: ${field} set to "${value}"`,
                                description: `Field "${field}" changed from "${previousValue}" to "${value}" via automated workflow step.`,
                                isCompleted: true,
                            },
                        });
                        this.logger.log(`Updated Lead [ID: ${leadId}] field "${field}" -> "${value}" (AuditLog & LeadActivity persisted)`);
                    }
                }
                break;
            }
            case 'reassign_record': {
                const leadId = context.leadId || context.entityId;
                if (leadId) {
                    const mode = config.mode || 'round_robin';
                    let targetUserId = null;
                    const currentLead = await this.prisma.lead.findFirst({
                        where: { id: leadId, tenantId },
                    });
                    const prevAssignedId = currentLead?.assignedToId;
                    if (mode === 'specific_user') {
                        targetUserId = config.user_id || config.userId;
                    }
                    else if (mode === 'round_robin') {
                        const employees = await this.prisma.user.findMany({
                            where: {
                                role: 'employee',
                                isActive: true,
                                deletedAt: null,
                                tenantId,
                            },
                            orderBy: { createdAt: 'asc' },
                        });
                        if (employees.length > 0) {
                            const currIdx = employees.findIndex((e) => e.id === context.assignedToId || e.id === prevAssignedId);
                            const nextIdx = (currIdx + 1) % employees.length;
                            targetUserId = employees[nextIdx].id;
                        }
                    }
                    if (targetUserId) {
                        const targetUser = await this.prisma.user.findFirst({
                            where: { id: targetUserId, tenantId },
                        });
                        await this.prisma.lead.updateMany({
                            where: { id: leadId, tenantId },
                            data: { assignedToId: targetUserId },
                        });
                        context.assignedToId = targetUserId;
                        await this.prisma.auditLog.create({
                            data: {
                                action: 'AUTOMATION_REASSIGN',
                                entityName: 'Lead',
                                entityId: leadId,
                                actorName: 'Automation Engine',
                                beforeState: JSON.stringify({ assignedToId: prevAssignedId }),
                                afterState: JSON.stringify({ assignedToId: targetUserId, targetUserName: targetUser?.name }),
                            },
                        });
                        await this.prisma.leadActivity.create({
                            data: {
                                leadId,
                                type: 'system',
                                title: `Automated Lead Reassignment [${rule?.name || 'Workflow Rule'}]: Reassigned to ${targetUser?.name || targetUserId}`,
                                description: `Lead reassigned via "${mode}" strategy.`,
                                isCompleted: true,
                            },
                        });
                        this.logger.log(`Reassigned Lead [ID: ${leadId}] to User [ID: ${targetUserId}] via mode "${mode}" (AuditLog persisted)`);
                    }
                }
                break;
            }
        }
    }
    async processDelayedJobs() {
        const now = new Date();
        const dueJobs = await this.prisma.delayedAutomationJob.findMany({
            where: {
                status: 'pending',
                executeAt: { lte: now },
            },
        });
        const results = [];
        for (const job of dueJobs) {
            try {
                const rule = await this.prisma.automationRule.findUnique({
                    where: { id: job.ruleId },
                    include: { steps: { orderBy: { stepOrder: 'asc' } } },
                });
                if (!rule || !rule.isActive) {
                    await this.prisma.delayedAutomationJob.update({
                        where: { id: job.id },
                        data: { status: 'cancelled' },
                    });
                    continue;
                }
                let context = {};
                try {
                    context = JSON.parse(job.contextJson);
                }
                catch { }
                this.logger.log(`Resuming DelayedJob [ID: ${job.id}] for rule "${rule.name}" from step #${job.stepIndex}`);
                await this.executeStepSequence(rule, rule.steps, job.stepIndex, context);
                await this.prisma.delayedAutomationJob.update({
                    where: { id: job.id },
                    data: { status: 'completed', completedAt: new Date() },
                });
                results.push({ id: job.id, status: 'completed' });
            }
            catch (err) {
                this.logger.error(`Failed to process delayed job ${job.id}: ${err.message}`);
                await this.prisma.delayedAutomationJob.update({
                    where: { id: job.id },
                    data: { status: 'failed' },
                });
            }
        }
        return { processedCount: results.length, jobs: results };
    }
    evaluateCondition(condition, context) {
        if (!condition || Object.keys(condition).length === 0) {
            return true;
        }
        if (Array.isArray(condition)) {
            return condition.every((cond) => this.evaluateSingleCondition(cond.field, cond.operator, cond.value, context));
        }
        for (const [key, value] of Object.entries(condition)) {
            if (typeof value === 'object' && value !== null && 'operator' in value) {
                const valObj = value;
                if (!this.evaluateSingleCondition(key, valObj.operator, valObj.value, context))
                    return false;
            }
            else if (typeof value === 'object' && value !== null && '$gt' in value) {
                if (Number(context[key]) <= Number(value.$gt))
                    return false;
            }
            else if (typeof value === 'object' && value !== null && '$gte' in value) {
                if (Number(context[key]) < Number(value.$gte))
                    return false;
            }
            else if (typeof value === 'object' && value !== null && '$lt' in value) {
                if (Number(context[key]) >= Number(value.$lt))
                    return false;
            }
            else if (typeof value === 'object' && value !== null && '$lte' in value) {
                if (Number(context[key]) > Number(value.$lte))
                    return false;
            }
            else if (context[key] !== value && String(context[key]) !== String(value)) {
                return false;
            }
        }
        return true;
    }
    evaluateSingleCondition(field, operator, value, context) {
        const actual = context[field];
        const op = (operator || 'equals').toLowerCase();
        switch (op) {
            case 'equals':
            case 'eq':
            case '==':
                return String(actual ?? '').toLowerCase() === String(value ?? '').toLowerCase();
            case 'not_equals':
            case 'ne':
            case '!=':
                return String(actual ?? '').toLowerCase() !== String(value ?? '').toLowerCase();
            case 'greater_than':
            case 'gt':
            case '>':
                return Number(actual) > Number(value);
            case 'greater_than_or_equal':
            case 'gte':
            case '>=':
                return Number(actual) >= Number(value);
            case 'less_than':
            case 'lt':
            case '<':
                return Number(actual) < Number(value);
            case 'less_than_or_equal':
            case 'lte':
            case '<=':
                return Number(actual) <= Number(value);
            case 'contains':
                return String(actual ?? '').toLowerCase().includes(String(value ?? '').toLowerCase());
            case 'not_contains':
                return !String(actual ?? '').toLowerCase().includes(String(value ?? '').toLowerCase());
            case 'in':
                if (Array.isArray(value)) {
                    return value.map(String).includes(String(actual));
                }
                return String(value).split(',').map((s) => s.trim()).includes(String(actual));
            default:
                return String(actual) === String(value);
        }
    }
    interpolate(template, context) {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(context[key] || ''));
    }
    async runNightlyReorderCheck() {
        this.logger.log('Running nightly reorder check...');
        const alerts = await this.inventoryService.getReorderAlerts();
        if (alerts.length === 0) {
            this.logger.log('All SKUs are above reorder threshold. No alerts to send.');
            return { alertsCount: 0 };
        }
        const admins = await this.prisma.user.findMany({
            where: { role: { in: ['tenant_admin', 'admin'] }, isActive: true },
            select: { email: true, name: true },
        });
        const alertTableRows = alerts
            .map((a) => `
        <tr>
          <td style="padding:8px; border:1px solid #eee;">${a.sku.skuCode}</td>
          <td style="padding:8px; border:1px solid #eee;">${a.sku.name}</td>
          <td style="padding:8px; border:1px solid #eee;">${a.totalOnHand}</td>
          <td style="padding:8px; border:1px solid #eee;">${a.sku.reorderPoint}</td>
          <td style="padding:8px; border:1px solid #eee;">${a.sku.reorderQty}</td>
          <td style="padding:8px; border:1px solid #eee;">${a.sku.preferredSupplier?.name || 'No preferred supplier'}</td>
          <td style="padding:8px; border:1px solid #eee;">${a.sku.preferredSupplier?.phone || '-'}</td>
        </tr>
      `)
            .join('');
        const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="background: #FF5A5F; color: white; padding: 20px;">
          <h2>JNC-CRM: Low Stock Alert — ${new Date().toLocaleDateString('en-IN')}</h2>
        </div>
        <div style="padding: 20px;">
          <p><strong>${alerts.length} SKU(s)</strong> are below their reorder point and require attention.</p>
          <table style="width:100%; border-collapse:collapse; margin-top:16px;">
            <thead>
              <tr style="background:#f0f0f0;">
                <th style="padding:8px; border:1px solid #eee; text-align:left;">SKU Code</th>
                <th style="padding:8px; border:1px solid #eee; text-align:left;">Name</th>
                <th style="padding:8px; border:1px solid #eee; text-align:left;">On Hand</th>
                <th style="padding:8px; border:1px solid #eee; text-align:left;">Reorder Point</th>
                <th style="padding:8px; border:1px solid #eee; text-align:left;">Reorder Qty</th>
                <th style="padding:8px; border:1px solid #eee; text-align:left;">Preferred Supplier</th>
                <th style="padding:8px; border:1px solid #eee; text-align:left;">Supplier Phone</th>
              </tr>
            </thead>
            <tbody>${alertTableRows}</tbody>
          </table>
          <p style="margin-top:20px;">Please contact suppliers directly via phone or email to place orders.</p>
          <p><strong>${brand_1.BRAND_CONFIG.displayName} CRM — Automated Inventory Alert</strong></p>
        </div>
      </div>
    `;
        for (const admin of admins) {
            await this.notificationsService.sendEmail({
                to: admin.email,
                subject: `[JNC-CRM] Low Stock Alert — ${alerts.length} SKUs require reorder`,
                html: emailHtml,
                relatedEntityType: 'inventory',
                relatedEntityId: 'reorder_check',
            });
        }
        return { alertsCount: alerts.length, emailedAdmins: admins.length };
    }
};
exports.AutomationService = AutomationService;
exports.AutomationService = AutomationService = AutomationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        inventory_service_1.InventoryService])
], AutomationService);
