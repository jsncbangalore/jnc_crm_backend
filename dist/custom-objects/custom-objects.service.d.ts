import { PrismaService } from '../prisma/prisma.service';
import { ScopedUser } from '../auth/scoping.service';
export declare const STANDARD_OBJECTS: {
    id: string;
    apiName: string;
    label: string;
    pluralLabel: string;
    type: string;
    description: string;
    isStandard: boolean;
    fieldsCount: number;
    lastModified: string;
}[];
export declare class CustomObjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    private validateApiName;
    getAllObjects(user?: ScopedUser): Promise<{
        standardObjects: {
            id: string;
            apiName: string;
            label: string;
            pluralLabel: string;
            type: string;
            description: string;
            isStandard: boolean;
            fieldsCount: number;
            lastModified: string;
        }[];
        customObjects: {
            id: string;
            apiName: string;
            label: string;
            pluralLabel: string;
            type: string;
            description: string;
            isStandard: boolean;
            fieldsCount: number;
            createdAt: Date;
            updatedAt: Date;
            lastModified: string;
            createdBy: {
                name: string;
                id: string;
                employeeCode: string;
            };
        }[];
        totalCount: number;
    }>;
    getObjectById(idOrApiName: string, user?: ScopedUser): Promise<{
        fields: any[];
        id: string;
        apiName: string;
        label: string;
        pluralLabel: string;
        type: string;
        description: string;
        isStandard: boolean;
        fieldsCount: number;
        lastModified: string;
    } | {
        isStandard: boolean;
        type: string;
        createdBy: {
            name: string;
            id: string;
            employeeCode: string;
        };
        fields: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            apiName: string;
            label: string;
            objectId: string;
            fieldType: string;
            isRequired: boolean;
            isUnique: boolean;
            picklistValues: string | null;
            lookupTargetObject: string | null;
            displayOrder: number;
        }[];
        id: string;
        tenantId: string;
        createdById: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        apiName: string;
        label: string;
        pluralLabel: string;
    }>;
    createObject(data: {
        apiName: string;
        label: string;
        pluralLabel?: string;
        description?: string;
    }, user: ScopedUser): Promise<{
        fields: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            apiName: string;
            label: string;
            objectId: string;
            fieldType: string;
            isRequired: boolean;
            isUnique: boolean;
            picklistValues: string | null;
            lookupTargetObject: string | null;
            displayOrder: number;
        }[];
    } & {
        id: string;
        tenantId: string;
        createdById: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        apiName: string;
        label: string;
        pluralLabel: string;
    }>;
    updateObject(id: string, data: {
        label?: string;
        pluralLabel?: string;
        description?: string;
    }, user?: ScopedUser): Promise<{
        fields: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            apiName: string;
            label: string;
            objectId: string;
            fieldType: string;
            isRequired: boolean;
            isUnique: boolean;
            picklistValues: string | null;
            lookupTargetObject: string | null;
            displayOrder: number;
        }[];
    } & {
        id: string;
        tenantId: string;
        createdById: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        apiName: string;
        label: string;
        pluralLabel: string;
    }>;
    deleteObject(id: string, user?: ScopedUser): Promise<{
        success: boolean;
        message: string;
    }>;
    getObjectFields(objectId: string, includeDeleted?: boolean, user?: ScopedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        apiName: string;
        label: string;
        objectId: string;
        fieldType: string;
        isRequired: boolean;
        isUnique: boolean;
        picklistValues: string | null;
        lookupTargetObject: string | null;
        displayOrder: number;
    }[]>;
    createField(objectId: string, data: {
        apiName: string;
        label: string;
        fieldType: string;
        isRequired?: boolean;
        isUnique?: boolean;
        picklistValues?: string[] | string;
        lookupTargetObject?: string;
        displayOrder?: number;
    }, user?: ScopedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        apiName: string;
        label: string;
        objectId: string;
        fieldType: string;
        isRequired: boolean;
        isUnique: boolean;
        picklistValues: string | null;
        lookupTargetObject: string | null;
        displayOrder: number;
    }>;
    updateField(objectId: string, fieldId: string, data: {
        label?: string;
        fieldType?: string;
        isRequired?: boolean;
        isUnique?: boolean;
        picklistValues?: string[] | string;
        lookupTargetObject?: string;
        displayOrder?: number;
    }, user?: ScopedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        apiName: string;
        label: string;
        objectId: string;
        fieldType: string;
        isRequired: boolean;
        isUnique: boolean;
        picklistValues: string | null;
        lookupTargetObject: string | null;
        displayOrder: number;
    }>;
    softDeleteField(objectId: string, fieldId: string, user?: ScopedUser): Promise<{
        success: boolean;
        message: string;
        field: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            apiName: string;
            label: string;
            objectId: string;
            fieldType: string;
            isRequired: boolean;
            isUnique: boolean;
            picklistValues: string | null;
            lookupTargetObject: string | null;
            displayOrder: number;
        };
    }>;
    restoreField(objectId: string, fieldId: string, user?: ScopedUser): Promise<{
        success: boolean;
        message: string;
        field: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            apiName: string;
            label: string;
            objectId: string;
            fieldType: string;
            isRequired: boolean;
            isUnique: boolean;
            picklistValues: string | null;
            lookupTargetObject: string | null;
            displayOrder: number;
        };
    }>;
    private findObjectOrThrow;
    private validateRecordData;
    private checkFieldDuplicate;
    private verifyLookupTargetExists;
    private resolveLookupLabels;
    getRecords(objectApiName: string, query: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        includeArchived?: boolean;
    }, user?: ScopedUser): Promise<{
        object: {
            id: string;
            apiName: string;
            label: string;
            pluralLabel: string;
            description: string;
            fields: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                apiName: string;
                label: string;
                objectId: string;
                fieldType: string;
                isRequired: boolean;
                isUnique: boolean;
                picklistValues: string | null;
                lookupTargetObject: string | null;
                displayOrder: number;
            }[];
        };
        records: any[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getRecordById(objectApiName: string, recordId: string, user?: ScopedUser): Promise<{
        object: {
            id: string;
            apiName: string;
            label: string;
            pluralLabel: string;
            description: string;
            fields: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                apiName: string;
                label: string;
                objectId: string;
                fieldType: string;
                isRequired: boolean;
                isUnique: boolean;
                picklistValues: string | null;
                lookupTargetObject: string | null;
                displayOrder: number;
            }[];
        };
        record: any;
    }>;
    createRecord(objectApiName: string, submittedData: Record<string, any>, user: ScopedUser): Promise<{
        id: string;
        objectId: string;
        data: Record<string, any>;
        createdAt: Date;
        updatedAt: Date;
        createdBy: {
            name: string;
            id: string;
            employeeCode: string;
        };
    }>;
    updateRecord(objectApiName: string, recordId: string, submittedData: Record<string, any>, user: ScopedUser): Promise<{
        id: string;
        objectId: string;
        data: {
            [x: string]: any;
        };
        createdAt: Date;
        updatedAt: Date;
        createdBy: {
            name: string;
            id: string;
            employeeCode: string;
        };
        updatedBy: {
            name: string;
            id: string;
            employeeCode: string;
        };
    }>;
    deleteRecord(objectApiName: string, recordId: string, user: ScopedUser): Promise<{
        success: boolean;
        message: string;
        record: {
            data: string;
            id: string;
            tenantId: string;
            createdById: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            objectId: string;
            updatedById: string | null;
        };
    }>;
    getLookupOptions(targetObjectApiName: string, search?: string, user?: ScopedUser): Promise<{
        id: string;
        label: string;
        subLabel: string;
    }[]>;
}
