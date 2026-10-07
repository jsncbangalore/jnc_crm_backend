import { ScopedUser } from '../auth/scoping.service';
import { AutomationService } from './automation.service';
export declare class AutomationController {
    private automationService;
    constructor(automationService: AutomationService);
    getAllRules(user: ScopedUser, search?: string, triggerEvent?: string, isActive?: string): Promise<({
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
    getMetrics(user: ScopedUser): Promise<{
        totalRules: number;
        activeRules: number;
        pausedRules: number;
        byActionType: Record<string, number>;
        byTrigger: Record<string, number>;
    }>;
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
    toggleRule(user: ScopedUser, id: string, isActive?: boolean): Promise<{
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
    runNightlyReorderCheck(): Promise<{
        alertsCount: number;
        emailedAdmins?: undefined;
    } | {
        alertsCount: number;
        emailedAdmins: number;
    }>;
    processDelayedJobs(): Promise<{
        processedCount: number;
        jobs: any[];
    }>;
}
