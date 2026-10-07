import { ScopedUser } from '../auth/scoping.service';
import { CustomObjectsService } from './custom-objects.service';
import { CreateCustomObjectDto, UpdateCustomObjectDto, CreateCustomFieldDto, UpdateCustomFieldDto } from './dto/custom-objects.dto';
export declare class CustomObjectsController {
    private customObjectsService;
    constructor(customObjectsService: CustomObjectsService);
    getAllObjects(user: ScopedUser): Promise<{
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
    getObjectById(id: string, user: ScopedUser): Promise<{
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
    createObject(data: CreateCustomObjectDto, user: ScopedUser): Promise<{
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
    updateObject(id: string, data: UpdateCustomObjectDto, user: ScopedUser): Promise<{
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
    deleteObject(id: string, user: ScopedUser): Promise<{
        success: boolean;
        message: string;
    }>;
    getObjectFields(objectId: string, includeDeleted: string | undefined, user: ScopedUser): Promise<{
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
    createField(objectId: string, data: CreateCustomFieldDto, user: ScopedUser): Promise<{
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
    updateField(objectId: string, fieldId: string, data: UpdateCustomFieldDto, user: ScopedUser): Promise<{
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
    softDeleteField(objectId: string, fieldId: string, user: ScopedUser): Promise<{
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
    restoreField(objectId: string, fieldId: string, user: ScopedUser): Promise<{
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
    getLookupOptions(targetObject: string, search: string | undefined, user: ScopedUser): Promise<{
        id: string;
        label: string;
        subLabel: string;
    }[]>;
    getRecords(objectApiName: string, page: string | undefined, limit: string | undefined, search: string | undefined, sortBy: string | undefined, sortOrder: 'asc' | 'desc' | undefined, includeArchived: string | undefined, user: ScopedUser): Promise<{
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
    getRecordById(objectApiName: string, recordId: string, user: ScopedUser): Promise<{
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
}
