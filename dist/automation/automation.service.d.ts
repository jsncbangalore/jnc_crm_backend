import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InventoryService } from '../inventory/inventory.service';
import { ScopedUser } from '../auth/scoping.service';
export declare const ALLOWED_STEP_TYPES: readonly ["send_email", "send_sms", "create_in_app_task", "update_lead_field", "reassign_record", "wait_then_continue"];
export type StepType = typeof ALLOWED_STEP_TYPES[number];
export declare class AutomationService implements OnModuleInit {
    private prisma;
    private notificationsService;
    private inventoryService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, inventoryService: InventoryService);
    onModuleInit(): Promise<void>;
    migrateLegacyRulesToSteps(): Promise<void>;
    validateStep(step: {
        stepType: string;
        config: any;
        stepOrder?: number;
    }): {
        stepType: StepType;
        config: string;
    };
    getAllRules(user: ScopedUser, filter?: {
        search?: string;
        triggerEvent?: string;
        isActive?: boolean;
    }): Promise<({
        steps: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stepOrder: number;
            stepType: string;
            config: string;
            ruleId: string;
        }[];
    } & {
        name: string;
        id: string;
        tenantId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        triggerEvent: string;
        conditionJson: string;
        actionType: string | null;
        actionPayloadJson: string | null;
    })[]>;
    getRuleById(user: ScopedUser, id: string): Promise<{
        steps: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stepOrder: number;
            stepType: string;
            config: string;
            ruleId: string;
        }[];
    } & {
        name: string;
        id: string;
        tenantId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        triggerEvent: string;
        conditionJson: string;
        actionType: string | null;
        actionPayloadJson: string | null;
    }>;
    createRule(user: ScopedUser, data: {
        name: string;
        triggerEvent: string;
        conditionJson?: string;
        actionType?: string;
        actionPayloadJson?: string;
        steps?: Array<{
            stepType: string;
            config: any;
            stepOrder?: number;
        }>;
        isActive?: boolean;
    }): Promise<{
        steps: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stepOrder: number;
            stepType: string;
            config: string;
            ruleId: string;
        }[];
    } & {
        name: string;
        id: string;
        tenantId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        triggerEvent: string;
        conditionJson: string;
        actionType: string | null;
        actionPayloadJson: string | null;
    }>;
    updateRule(user: ScopedUser, id: string, data: {
        name?: string;
        triggerEvent?: string;
        conditionJson?: string;
        steps?: Array<{
            stepType: string;
            config: any;
            stepOrder?: number;
        }>;
        actionType?: string;
        actionPayloadJson?: string;
        isActive?: boolean;
    }): Promise<{
        steps: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stepOrder: number;
            stepType: string;
            config: string;
            ruleId: string;
        }[];
    } & {
        name: string;
        id: string;
        tenantId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        triggerEvent: string;
        conditionJson: string;
        actionType: string | null;
        actionPayloadJson: string | null;
    }>;
    toggleRuleActive(user: ScopedUser, id: string, targetActive?: boolean): Promise<{
        steps: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stepOrder: number;
            stepType: string;
            config: string;
            ruleId: string;
        }[];
    } & {
        name: string;
        id: string;
        tenantId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        triggerEvent: string;
        conditionJson: string;
        actionType: string | null;
        actionPayloadJson: string | null;
    }>;
    deleteRule(user: ScopedUser, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getMetrics(user: ScopedUser): Promise<{
        totalRules: number;
        activeRules: number;
        pausedRules: number;
        byActionType: Record<string, number>;
        byTrigger: Record<string, number>;
    }>;
    evaluateRules(triggerEvent: string, context: Record<string, any>): Promise<void>;
    executeStepSequence(rule: any, steps: any[], startIndex: number, context: Record<string, any>): Promise<{
        deferred: boolean;
        delayedJobId: string;
        executeAt: Date;
        completed?: undefined;
    } | {
        completed: boolean;
        deferred?: undefined;
        delayedJobId?: undefined;
        executeAt?: undefined;
    }>;
    private executeSingleStep;
    processDelayedJobs(): Promise<{
        processedCount: number;
        jobs: any[];
    }>;
    private evaluateCondition;
    private evaluateSingleCondition;
    private interpolate;
    runNightlyReorderCheck(): Promise<{
        alertsCount: number;
        emailedAdmins?: undefined;
    } | {
        alertsCount: number;
        emailedAdmins: number;
    }>;
}
