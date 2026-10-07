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
exports.CustomObjectsService = exports.STANDARD_OBJECTS = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_util_1 = require("../common/tenant.util");
const ALLOWED_FIELD_TYPES = [
    'text',
    'textarea',
    'number',
    'currency',
    'date',
    'checkbox',
    'picklist',
    'lookup',
    'email',
    'phone',
    'url',
];
const RESERVED_NAMES = [
    'lead',
    'contact',
    'company',
    'order',
    'invoice',
    'sku',
    'warehouse',
    'supplier',
    'user',
    'id',
    'created_at',
    'createdat',
    'updated_at',
    'updatedat',
    'deleted_at',
    'deletedat',
    'created_by',
    'createdby',
    'created_by_id',
    'createdbyid',
    'object_id',
    'objectid',
    'custom_object_id',
    'customobjectid',
    'record_id',
    'recordid',
    'type',
    'object',
    'field',
    'system',
    'name',
    'status',
    'data',
    'metadata',
    'custom_object',
    'custom_field',
];
exports.STANDARD_OBJECTS = [
    {
        id: 'std-lead',
        apiName: 'lead',
        label: 'Lead',
        pluralLabel: 'Leads',
        type: 'Standard Object',
        description: 'Inbound prospect inquiries from IndiaMART, WhatsApp, Web, and manual entries',
        isStandard: true,
        fieldsCount: 16,
        lastModified: 'System Built-In',
    },
    {
        id: 'std-contact',
        apiName: 'contact',
        label: 'Contact',
        pluralLabel: 'Contacts',
        type: 'Standard Object',
        description: 'Individual customer contacts, project coordinators, and site representatives',
        isStandard: true,
        fieldsCount: 8,
        lastModified: 'System Built-In',
    },
    {
        id: 'std-company',
        apiName: 'company',
        label: 'Company / Account',
        pluralLabel: 'Companies',
        type: 'Standard Object',
        description: 'Corporate client entities, contractor firms, and enterprise accounts',
        isStandard: true,
        fieldsCount: 10,
        lastModified: 'System Built-In',
    },
    {
        id: 'std-order',
        apiName: 'order',
        label: 'Order',
        pluralLabel: 'Orders',
        type: 'Standard Object',
        description: 'Sales orders, reserved stock allocations, and fulfillment lifecycles',
        isStandard: true,
        fieldsCount: 14,
        lastModified: 'System Built-In',
    },
    {
        id: 'std-invoice',
        apiName: 'invoice',
        label: 'Invoice',
        pluralLabel: 'Invoices',
        type: 'Standard Object',
        description: 'Commercial tax invoices with GST breakdowns and payment tracking',
        isStandard: true,
        fieldsCount: 18,
        lastModified: 'System Built-In',
    },
    {
        id: 'std-sku',
        apiName: 'sku',
        label: 'Equipment SKU',
        pluralLabel: 'Equipment SKUs',
        type: 'Standard Object',
        description: 'Master equipment catalog items, technical specifications, and HSN codes',
        isStandard: true,
        fieldsCount: 15,
        lastModified: 'System Built-In',
    },
    {
        id: 'std-warehouse',
        apiName: 'warehouse',
        label: 'Warehouse',
        pluralLabel: 'Warehouses',
        type: 'Standard Object',
        description: 'Physical inventory locations, integration hubs, and storage bins',
        isStandard: true,
        fieldsCount: 7,
        lastModified: 'System Built-In',
    },
    {
        id: 'std-supplier',
        apiName: 'supplier',
        label: 'Supplier',
        pluralLabel: 'Suppliers',
        type: 'Standard Object',
        description: 'Equipment manufacturers, authorized OEM distributors, and vendors',
        isStandard: true,
        fieldsCount: 9,
        lastModified: 'System Built-In',
    },
    {
        id: 'std-user',
        apiName: 'user',
        label: 'User / Staff',
        pluralLabel: 'Users',
        type: 'Standard Object',
        description: 'Employee profiles, roles, permissions, and regional warehouse scopes',
        isStandard: true,
        fieldsCount: 12,
        lastModified: 'System Built-In',
    },
];
let CustomObjectsService = class CustomObjectsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    validateApiName(apiName, entityLabel = 'API Name') {
        if (!apiName || typeof apiName !== 'string') {
            throw new common_1.BadRequestException(`${entityLabel} is required`);
        }
        const clean = apiName.trim().toLowerCase();
        const regex = /^[a-z][a-z0-9_]*$/;
        if (!regex.test(clean)) {
            throw new common_1.BadRequestException(`${entityLabel} "${apiName}" is invalid. Must start with a lowercase letter and contain only lowercase letters, digits, and underscores (e.g. amc_contract, site_visit).`);
        }
        return clean;
    }
    async getAllObjects(user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const customObjects = await this.prisma.customObject.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: {
                fields: {
                    where: { deletedAt: null },
                    select: { id: true },
                },
                createdBy: {
                    select: { id: true, name: true, employeeCode: true },
                },
            },
        });
        const formattedCustom = customObjects.map((obj) => ({
            id: obj.id,
            apiName: obj.apiName,
            label: obj.label,
            pluralLabel: obj.pluralLabel,
            type: 'Custom Object',
            description: obj.description || 'No description provided',
            isStandard: false,
            fieldsCount: obj.fields.length,
            createdAt: obj.createdAt,
            updatedAt: obj.updatedAt,
            lastModified: obj.updatedAt.toISOString(),
            createdBy: obj.createdBy,
        }));
        return {
            standardObjects: exports.STANDARD_OBJECTS,
            customObjects: formattedCustom,
            totalCount: exports.STANDARD_OBJECTS.length + formattedCustom.length,
        };
    }
    async getObjectById(idOrApiName, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const object = await this.prisma.customObject.findFirst({
            where: {
                tenantId,
                OR: [{ id: idOrApiName }, { apiName: idOrApiName.toLowerCase() }],
            },
            include: {
                fields: {
                    orderBy: { displayOrder: 'asc' },
                },
                createdBy: {
                    select: { id: true, name: true, employeeCode: true },
                },
            },
        });
        if (!object) {
            const std = exports.STANDARD_OBJECTS.find((s) => s.id === idOrApiName || s.apiName === idOrApiName.toLowerCase());
            if (std) {
                return {
                    ...std,
                    fields: [],
                };
            }
            throw new common_1.NotFoundException(`Custom object "${idOrApiName}" not found`);
        }
        return {
            ...object,
            isStandard: false,
            type: 'Custom Object',
        };
    }
    async createObject(data, user) {
        const apiName = this.validateApiName(data.apiName, 'Object API Name');
        if (RESERVED_NAMES.includes(apiName)) {
            throw new common_1.BadRequestException(`Cannot create custom object with reserved API Name "${apiName}". This name is reserved for system standard objects.`);
        }
        if (!data.label || !data.label.trim()) {
            throw new common_1.BadRequestException('Object Label is required');
        }
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const existing = await this.prisma.customObject.findFirst({
            where: { apiName, tenantId },
        });
        if (existing) {
            throw new common_1.ConflictException(`A custom object with API Name "${apiName}" already exists.`);
        }
        const label = data.label.trim();
        const pluralLabel = data.pluralLabel?.trim() || `${label}s`;
        const customObject = await this.prisma.customObject.create({
            data: {
                tenantId,
                apiName,
                label,
                pluralLabel,
                description: data.description?.trim() || undefined,
                createdById: user.id,
            },
            include: {
                fields: true,
            },
        });
        return customObject;
    }
    async updateObject(id, data, user) {
        const object = await this.findObjectOrThrow(id, user);
        const updateData = {};
        if (data.label !== undefined)
            updateData.label = data.label.trim();
        if (data.pluralLabel !== undefined)
            updateData.pluralLabel = data.pluralLabel.trim();
        if (data.description !== undefined)
            updateData.description = data.description.trim();
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        await this.prisma.customObject.updateMany({
            where: { id: object.id, tenantId },
            data: updateData,
        });
        return this.findObjectOrThrow(id, user);
    }
    async deleteObject(id, user) {
        const object = await this.findObjectOrThrow(id, user);
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        await this.prisma.customObject.deleteMany({
            where: { id: object.id, tenantId },
        });
        return { success: true, message: `Custom object "${object.label}" (${object.apiName}) deleted successfully` };
    }
    async getObjectFields(objectId, includeDeleted = false, user) {
        const object = await this.findObjectOrThrow(objectId, user);
        const where = { objectId: object.id };
        if (!includeDeleted) {
            where.deletedAt = null;
        }
        const fields = await this.prisma.customField.findMany({
            where,
            orderBy: { displayOrder: 'asc' },
        });
        return fields;
    }
    async createField(objectId, data, user) {
        const object = await this.findObjectOrThrow(objectId, user);
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const apiName = this.validateApiName(data.apiName, 'Field API Name');
        if (RESERVED_NAMES.includes(apiName)) {
            throw new common_1.BadRequestException(`Field API Name "${apiName}" is a reserved keyword and cannot be used.`);
        }
        if (!data.label || !data.label.trim()) {
            throw new common_1.BadRequestException('Field Label is required');
        }
        const fieldType = data.fieldType?.toLowerCase().trim();
        if (!ALLOWED_FIELD_TYPES.includes(fieldType)) {
            throw new common_1.BadRequestException(`Invalid field type "${fieldType}". Allowed types: ${ALLOWED_FIELD_TYPES.join(', ')}`);
        }
        const existing = await this.prisma.customField.findFirst({
            where: { objectId, apiName },
        });
        if (existing) {
            if (existing.deletedAt) {
                throw new common_1.ConflictException(`A field with API Name "${apiName}" is currently archived in this object. You can restore it instead of creating a new one.`);
            }
            throw new common_1.ConflictException(`A field with API Name "${apiName}" already exists on object "${object.label}".`);
        }
        let picklistValues = undefined;
        if (fieldType === 'picklist') {
            if (!data.picklistValues) {
                throw new common_1.BadRequestException('picklistValues are required when fieldType is "picklist"');
            }
            let parsed = [];
            if (Array.isArray(data.picklistValues)) {
                parsed = data.picklistValues.map((s) => String(s).trim()).filter(Boolean);
            }
            else if (typeof data.picklistValues === 'string') {
                try {
                    const arr = JSON.parse(data.picklistValues);
                    if (Array.isArray(arr))
                        parsed = arr.map((s) => String(s).trim()).filter(Boolean);
                }
                catch {
                    parsed = data.picklistValues.split(',').map((s) => s.trim()).filter(Boolean);
                }
            }
            if (parsed.length === 0) {
                throw new common_1.BadRequestException('At least one picklist option value is required');
            }
            picklistValues = JSON.stringify(parsed);
        }
        let lookupTargetObject = undefined;
        if (fieldType === 'lookup') {
            if (!data.lookupTargetObject || !data.lookupTargetObject.trim()) {
                throw new common_1.BadRequestException('lookupTargetObject is required when fieldType is "lookup"');
            }
            const target = data.lookupTargetObject.trim();
            const isStd = exports.STANDARD_OBJECTS.some((s) => s.apiName.toLowerCase() === target.toLowerCase() || s.label.toLowerCase() === target.toLowerCase());
            const isCustom = await this.prisma.customObject.findFirst({
                where: {
                    tenantId,
                    OR: [{ apiName: target.toLowerCase() }, { label: target }],
                },
            });
            if (!isStd && !isCustom) {
                throw new common_1.BadRequestException(`Target object "${target}" does not exist in standard or custom objects.`);
            }
            lookupTargetObject = isCustom ? isCustom.apiName : target;
        }
        let displayOrder = data.displayOrder;
        if (displayOrder === undefined) {
            const count = await this.prisma.customField.count({ where: { objectId } });
            displayOrder = count + 1;
        }
        const field = await this.prisma.customField.create({
            data: {
                objectId,
                apiName,
                label: data.label.trim(),
                fieldType,
                isRequired: !!data.isRequired,
                isUnique: !!data.isUnique,
                picklistValues,
                lookupTargetObject,
                displayOrder,
            },
        });
        await this.prisma.customObject.updateMany({
            where: { id: objectId, tenantId },
            data: { updatedAt: new Date() },
        });
        return field;
    }
    async updateField(objectId, fieldId, data, user) {
        const object = await this.findObjectOrThrow(objectId, user);
        const field = await this.prisma.customField.findFirst({
            where: { id: fieldId, objectId: object.id },
        });
        if (!field) {
            throw new common_1.NotFoundException(`Custom field with ID "${fieldId}" not found on this object`);
        }
        const updateData = {};
        if (data.label !== undefined)
            updateData.label = data.label.trim();
        if (data.isRequired !== undefined)
            updateData.isRequired = !!data.isRequired;
        if (data.isUnique !== undefined)
            updateData.isUnique = !!data.isUnique;
        if (data.displayOrder !== undefined)
            updateData.displayOrder = data.displayOrder;
        if (data.fieldType !== undefined) {
            const fieldType = data.fieldType.toLowerCase().trim();
            if (!ALLOWED_FIELD_TYPES.includes(fieldType)) {
                throw new common_1.BadRequestException(`Invalid field type "${fieldType}". Allowed types: ${ALLOWED_FIELD_TYPES.join(', ')}`);
            }
            updateData.fieldType = fieldType;
        }
        const effectiveType = updateData.fieldType || field.fieldType;
        if (effectiveType === 'picklist' && data.picklistValues !== undefined) {
            let parsed = [];
            if (Array.isArray(data.picklistValues)) {
                parsed = data.picklistValues.map((s) => String(s).trim()).filter(Boolean);
            }
            else if (typeof data.picklistValues === 'string') {
                try {
                    const arr = JSON.parse(data.picklistValues);
                    if (Array.isArray(arr))
                        parsed = arr.map((s) => String(s).trim()).filter(Boolean);
                }
                catch {
                    parsed = data.picklistValues.split(',').map((s) => s.trim()).filter(Boolean);
                }
            }
            if (parsed.length > 0) {
                updateData.picklistValues = JSON.stringify(parsed);
            }
        }
        if (effectiveType === 'lookup' && data.lookupTargetObject !== undefined) {
            const target = data.lookupTargetObject.trim();
            const isStd = exports.STANDARD_OBJECTS.some((s) => s.apiName.toLowerCase() === target.toLowerCase() || s.label.toLowerCase() === target.toLowerCase());
            const tenantId = (0, tenant_util_1.requireTenantId)(user);
            const isCustom = await this.prisma.customObject.findFirst({
                where: {
                    tenantId,
                    OR: [{ apiName: target.toLowerCase() }, { label: target }],
                },
            });
            if (!isStd && !isCustom) {
                throw new common_1.BadRequestException(`Target object "${target}" does not exist in standard or custom objects.`);
            }
            updateData.lookupTargetObject = isCustom ? isCustom.apiName : target;
        }
        const updated = await this.prisma.customField.update({
            where: { id: fieldId },
            data: updateData,
        });
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        await this.prisma.customObject.updateMany({
            where: { id: object.id, tenantId },
            data: { updatedAt: new Date() },
        });
        return updated;
    }
    async softDeleteField(objectId, fieldId, user) {
        const object = await this.findObjectOrThrow(objectId, user);
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const field = await this.prisma.customField.findFirst({
            where: { id: fieldId, objectId: object.id },
        });
        if (!field) {
            throw new common_1.NotFoundException(`Custom field with ID "${fieldId}" not found on this object`);
        }
        const updated = await this.prisma.customField.update({
            where: { id: fieldId },
            data: { deletedAt: new Date() },
        });
        await this.prisma.customObject.updateMany({
            where: { id: object.id, tenantId },
            data: { updatedAt: new Date() },
        });
        return {
            success: true,
            message: `Field "${field.label}" (${field.apiName}) archived successfully`,
            field: updated,
        };
    }
    async restoreField(objectId, fieldId, user) {
        const object = await this.findObjectOrThrow(objectId, user);
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const field = await this.prisma.customField.findFirst({
            where: { id: fieldId, objectId: object.id },
        });
        if (!field) {
            throw new common_1.NotFoundException(`Custom field with ID "${fieldId}" not found on this object`);
        }
        const updated = await this.prisma.customField.update({
            where: { id: fieldId },
            data: { deletedAt: null },
        });
        await this.prisma.customObject.updateMany({
            where: { id: object.id, tenantId },
            data: { updatedAt: new Date() },
        });
        return {
            success: true,
            message: `Field "${field.label}" restored successfully`,
            field: updated,
        };
    }
    async findObjectOrThrow(objectApiNameOrId, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const clean = objectApiNameOrId.trim().toLowerCase();
        const object = await this.prisma.customObject.findFirst({
            where: {
                tenantId,
                OR: [{ apiName: clean }, { id: objectApiNameOrId }],
            },
            include: {
                fields: {
                    orderBy: { displayOrder: 'asc' },
                },
            },
        });
        if (!object) {
            throw new common_1.NotFoundException(`Custom object "${objectApiNameOrId}" not found in system schema.`);
        }
        return object;
    }
    async validateRecordData(object, fields, submittedData, isUpdate = false, existingRecordId) {
        const errors = [];
        const activeFields = fields.filter((f) => !f.deletedAt);
        const activeFieldMap = new Map(activeFields.map((f) => [f.apiName, f]));
        for (const key of Object.keys(submittedData)) {
            if (!activeFieldMap.has(key)) {
                errors.push({
                    field: key,
                    error: `Field "${key}" is not defined on custom object "${object.label}".`,
                });
            }
        }
        for (const field of activeFields) {
            const value = submittedData[field.apiName];
            const isProvided = value !== undefined && value !== null && value !== '';
            if (field.isRequired && !isProvided) {
                if (!isUpdate || submittedData.hasOwnProperty(field.apiName)) {
                    errors.push({
                        field: field.apiName,
                        error: `Field "${field.label}" (${field.apiName}) is required.`,
                    });
                    continue;
                }
            }
            if (!isProvided)
                continue;
            switch (field.fieldType) {
                case 'number':
                case 'currency': {
                    const num = Number(value);
                    if (isNaN(num) || typeof value === 'boolean') {
                        errors.push({
                            field: field.apiName,
                            error: `Field "${field.label}" must be a valid numeric value. Received: "${value}"`,
                        });
                    }
                    break;
                }
                case 'checkbox': {
                    if (typeof value !== 'boolean' && value !== 'true' && value !== 'false' && value !== 1 && value !== 0) {
                        errors.push({
                            field: field.apiName,
                            error: `Field "${field.label}" must be a boolean (true/false).`,
                        });
                    }
                    break;
                }
                case 'date': {
                    const parsed = Date.parse(String(value));
                    if (isNaN(parsed)) {
                        errors.push({
                            field: field.apiName,
                            error: `Field "${field.label}" must be a valid date (e.g. YYYY-MM-DD). Received: "${value}"`,
                        });
                    }
                    break;
                }
                case 'picklist': {
                    let allowedValues = [];
                    try {
                        allowedValues = JSON.parse(field.picklistValues || '[]');
                    }
                    catch { }
                    if (!allowedValues.includes(String(value))) {
                        errors.push({
                            field: field.apiName,
                            error: `Invalid picklist value "${value}" for "${field.label}". Allowed values: ${allowedValues.join(', ')}`,
                        });
                    }
                    break;
                }
                case 'email': {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(String(value))) {
                        errors.push({
                            field: field.apiName,
                            error: `Field "${field.label}" must be a valid email address. Received: "${value}"`,
                        });
                    }
                    break;
                }
                case 'lookup': {
                    const target = (field.lookupTargetObject || '').toLowerCase().trim();
                    const targetId = String(value).trim();
                    const exists = await this.verifyLookupTargetExists(target, targetId, object.tenantId);
                    if (!exists) {
                        errors.push({
                            field: field.apiName,
                            error: `Referenced record in "${field.lookupTargetObject}" (ID: "${targetId}") does not exist or has been archived.`,
                        });
                    }
                    break;
                }
            }
            if (field.isUnique && isProvided) {
                const isDuplicate = await this.checkFieldDuplicate(object.id, field.apiName, value, existingRecordId);
                if (isDuplicate) {
                    errors.push({
                        field: field.apiName,
                        error: `Value "${value}" for field "${field.label}" already exists and must be unique.`,
                    });
                }
            }
        }
        if (errors.length > 0) {
            throw new common_1.BadRequestException({
                message: `Validation failed for custom object "${object.label}"`,
                errors,
            });
        }
    }
    async checkFieldDuplicate(objectId, fieldApiName, value, excludeRecordId) {
        const records = await this.prisma.customObjectRecord.findMany({
            where: {
                objectId,
                deletedAt: null,
                ...(excludeRecordId ? { id: { not: excludeRecordId } } : {}),
            },
            select: { id: true, data: true },
        });
        const targetVal = String(value).trim().toLowerCase();
        for (const r of records) {
            try {
                const parsed = JSON.parse(r.data);
                if (parsed[fieldApiName] !== undefined && String(parsed[fieldApiName]).trim().toLowerCase() === targetVal) {
                    return true;
                }
            }
            catch { }
        }
        return false;
    }
    async verifyLookupTargetExists(targetObject, targetId, tenantId) {
        if (!targetId || !targetObject)
            return false;
        if (!tenantId) {
            throw new common_1.ForbiddenException('Tenant context is required to verify lookup targets');
        }
        const tgt = targetObject.toLowerCase();
        try {
            if (tgt === 'company') {
                const r = await this.prisma.company.findFirst({ where: { id: targetId, tenantId, deletedAt: null } });
                return !!r;
            }
            if (tgt === 'lead') {
                const r = await this.prisma.lead.findFirst({ where: { id: targetId, tenantId, deletedAt: null } });
                return !!r;
            }
            if (tgt === 'contact') {
                const r = await this.prisma.contact.findFirst({ where: { id: targetId, tenantId, deletedAt: null } });
                return !!r;
            }
            if (tgt === 'order') {
                const r = await this.prisma.order.findFirst({ where: { id: targetId, tenantId } });
                return !!r;
            }
            if (tgt === 'invoice') {
                const r = await this.prisma.invoice.findFirst({ where: { id: targetId, tenantId } });
                return !!r;
            }
            if (tgt === 'sku') {
                const r = await this.prisma.sku.findFirst({ where: { id: targetId, tenantId, deletedAt: null } });
                return !!r;
            }
            if (tgt === 'warehouse') {
                const r = await this.prisma.warehouse.findFirst({ where: { id: targetId, tenantId, isActive: true } });
                return !!r;
            }
            if (tgt === 'supplier') {
                const r = await this.prisma.supplier.findFirst({ where: { id: targetId, tenantId, isActive: true } });
                return !!r;
            }
            if (tgt === 'user') {
                const r = await this.prisma.user.findFirst({ where: { id: targetId, tenantId, deletedAt: null } });
                return !!r;
            }
            const customObj = await this.prisma.customObject.findFirst({
                where: { tenantId, OR: [{ apiName: tgt }, { id: targetObject }] },
            });
            if (customObj) {
                const rec = await this.prisma.customObjectRecord.findFirst({
                    where: { id: targetId, objectId: customObj.id, tenantId, deletedAt: null },
                });
                return !!rec;
            }
            return false;
        }
        catch {
            return false;
        }
    }
    async resolveLookupLabels(fields, records, tenantId) {
        if (!tenantId) {
            throw new common_1.ForbiddenException('Tenant context is required for resolving custom object lookups');
        }
        const lookupFields = fields.filter((f) => f.fieldType === 'lookup');
        if (lookupFields.length === 0 || records.length === 0)
            return records;
        for (const record of records) {
            record._lookups = {};
            for (const lf of lookupFields) {
                const targetId = record.data?.[lf.apiName];
                if (!targetId)
                    continue;
                const targetObj = (lf.lookupTargetObject || '').toLowerCase().trim();
                let displayLabel = targetId;
                let isArchived = false;
                try {
                    if (targetObj === 'company') {
                        const row = await this.prisma.company.findFirst({ where: { id: targetId, tenantId } });
                        if (row) {
                            isArchived = !!row.deletedAt;
                            displayLabel = isArchived ? `[Archived: ${row.name}]` : row.name;
                        }
                    }
                    else if (targetObj === 'lead') {
                        const row = await this.prisma.lead.findFirst({ where: { id: targetId, tenantId }, include: { contact: true, company: true } });
                        if (row) {
                            isArchived = !!row.deletedAt;
                            const name = row.contact?.name || row.company?.name || row.leadNumber;
                            displayLabel = isArchived ? `[Archived: ${row.leadNumber} - ${name}]` : `${row.leadNumber} (${name})`;
                        }
                    }
                    else if (targetObj === 'contact') {
                        const row = await this.prisma.contact.findFirst({ where: { id: targetId, tenantId } });
                        if (row) {
                            isArchived = !!row.deletedAt;
                            displayLabel = isArchived ? `[Archived: ${row.name}]` : row.name;
                        }
                    }
                    else if (targetObj === 'order') {
                        const row = await this.prisma.order.findFirst({ where: { id: targetId, tenantId } });
                        if (row) {
                            displayLabel = row.orderNumber;
                        }
                    }
                    else if (targetObj === 'invoice') {
                        const row = await this.prisma.invoice.findFirst({ where: { id: targetId, tenantId } });
                        if (row) {
                            displayLabel = row.invoiceNumber;
                        }
                    }
                    else if (targetObj === 'sku') {
                        const row = await this.prisma.sku.findFirst({ where: { id: targetId, tenantId } });
                        if (row) {
                            isArchived = !!row.deletedAt;
                            displayLabel = isArchived ? `[Archived: ${row.skuCode} - ${row.name}]` : `${row.skuCode} (${row.name})`;
                        }
                    }
                    else if (targetObj === 'warehouse') {
                        const row = await this.prisma.warehouse.findFirst({ where: { id: targetId, tenantId } });
                        if (row) {
                            isArchived = !row.isActive;
                            displayLabel = isArchived ? `[Archived: ${row.name}]` : row.name;
                        }
                    }
                    else if (targetObj === 'supplier') {
                        const row = await this.prisma.supplier.findFirst({ where: { id: targetId, tenantId } });
                        if (row) {
                            isArchived = !row.isActive;
                            displayLabel = isArchived ? `[Archived: ${row.name}]` : row.name;
                        }
                    }
                    else if (targetObj === 'user') {
                        const row = await this.prisma.user.findFirst({ where: { id: targetId, tenantId } });
                        if (row) {
                            isArchived = !!row.deletedAt;
                            displayLabel = isArchived ? `[Archived: ${row.name}]` : row.name;
                        }
                    }
                    else {
                        const customObj = await this.prisma.customObject.findFirst({
                            where: { tenantId, OR: [{ apiName: targetObj }, { id: targetObj }] },
                        });
                        if (customObj) {
                            const rec = await this.prisma.customObjectRecord.findFirst({
                                where: { id: targetId, objectId: customObj.id, tenantId },
                            });
                            if (rec) {
                                isArchived = !!rec.deletedAt;
                                try {
                                    const p = JSON.parse(rec.data);
                                    const firstVal = Object.values(p).find((v) => typeof v === 'string' && v.trim() !== '');
                                    const label = firstVal || rec.id.slice(0, 8);
                                    displayLabel = isArchived ? `[Archived: ${label}]` : String(label);
                                }
                                catch {
                                    displayLabel = isArchived ? `[Archived: ${rec.id.slice(0, 8)}]` : rec.id.slice(0, 8);
                                }
                            }
                        }
                    }
                }
                catch { }
                record._lookups[lf.apiName] = {
                    id: targetId,
                    label: displayLabel,
                    isArchived,
                };
            }
        }
        return records;
    }
    async getRecords(objectApiName, query, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const object = await this.findObjectOrThrow(objectApiName, user);
        const page = Math.max(1, Number(query.page || 1));
        const limit = Math.max(1, Math.min(100, Number(query.limit || 25)));
        const skip = (page - 1) * limit;
        const where = { objectId: object.id, tenantId };
        if (!query.includeArchived) {
            where.deletedAt = null;
        }
        const [total, dbRecords] = await Promise.all([
            this.prisma.customObjectRecord.count({ where }),
            this.prisma.customObjectRecord.findMany({
                where,
                orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
                skip,
                take: limit,
                include: {
                    createdBy: { select: { id: true, name: true, employeeCode: true } },
                    updatedBy: { select: { id: true, name: true, employeeCode: true } },
                },
            }),
        ]);
        const formatted = dbRecords.map((r) => {
            let parsedData = {};
            try {
                parsedData = JSON.parse(r.data);
            }
            catch { }
            return {
                id: r.id,
                objectId: r.objectId,
                data: parsedData,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
                deletedAt: r.deletedAt,
                createdBy: r.createdBy,
                updatedBy: r.updatedBy,
            };
        });
        const withLookups = await this.resolveLookupLabels(object.fields, formatted, tenantId);
        let filteredRecords = withLookups;
        if (query.search && query.search.trim()) {
            const q = query.search.trim().toLowerCase();
            filteredRecords = withLookups.filter((r) => {
                return (Object.values(r.data).some((val) => String(val).toLowerCase().includes(q)) ||
                    (r._lookups && Object.values(r._lookups).some((l) => l.label.toLowerCase().includes(q))));
            });
        }
        return {
            object: {
                id: object.id,
                apiName: object.apiName,
                label: object.label,
                pluralLabel: object.pluralLabel,
                description: object.description,
                fields: object.fields.filter((f) => query.includeArchived || !f.deletedAt),
            },
            records: filteredRecords,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getRecordById(objectApiName, recordId, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const object = await this.findObjectOrThrow(objectApiName, user);
        const record = await this.prisma.customObjectRecord.findFirst({
            where: { id: recordId, objectId: object.id, tenantId },
            include: {
                createdBy: { select: { id: true, name: true, employeeCode: true } },
                updatedBy: { select: { id: true, name: true, employeeCode: true } },
            },
        });
        if (!record) {
            throw new common_1.NotFoundException(`Record with ID "${recordId}" not found on custom object "${object.label}".`);
        }
        let parsedData = {};
        try {
            parsedData = JSON.parse(record.data);
        }
        catch { }
        const formatted = [
            {
                id: record.id,
                objectId: record.objectId,
                data: parsedData,
                createdAt: record.createdAt,
                updatedAt: record.updatedAt,
                deletedAt: record.deletedAt,
                createdBy: record.createdBy,
                updatedBy: record.updatedBy,
            },
        ];
        const withLookups = await this.resolveLookupLabels(object.fields, formatted, tenantId);
        return {
            object: {
                id: object.id,
                apiName: object.apiName,
                label: object.label,
                pluralLabel: object.pluralLabel,
                description: object.description,
                fields: object.fields,
            },
            record: withLookups[0],
        };
    }
    async createRecord(objectApiName, submittedData, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const object = await this.findObjectOrThrow(objectApiName, user);
        await this.validateRecordData(object, object.fields, submittedData, false);
        const cleanedData = {};
        for (const field of object.fields.filter((f) => !f.deletedAt)) {
            const val = submittedData[field.apiName];
            if (val !== undefined && val !== null) {
                if (field.fieldType === 'number' || field.fieldType === 'currency') {
                    cleanedData[field.apiName] = Number(val);
                }
                else if (field.fieldType === 'checkbox') {
                    cleanedData[field.apiName] = val === true || val === 'true' || val === 1;
                }
                else {
                    cleanedData[field.apiName] = val;
                }
            }
        }
        const record = await this.prisma.customObjectRecord.create({
            data: {
                objectId: object.id,
                tenantId,
                data: JSON.stringify(cleanedData),
                createdById: user.id,
                updatedById: user.id,
            },
            include: {
                createdBy: { select: { id: true, name: true, employeeCode: true } },
            },
        });
        await this.prisma.customObject.updateMany({
            where: { id: object.id, tenantId },
            data: { updatedAt: new Date() },
        });
        return {
            id: record.id,
            objectId: record.objectId,
            data: cleanedData,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            createdBy: record.createdBy,
        };
    }
    async updateRecord(objectApiName, recordId, submittedData, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const object = await this.findObjectOrThrow(objectApiName, user);
        const existing = await this.prisma.customObjectRecord.findFirst({
            where: { id: recordId, objectId: object.id, tenantId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Record with ID "${recordId}" not found on custom object "${object.label}".`);
        }
        await this.validateRecordData(object, object.fields, submittedData, true, recordId);
        let currentData = {};
        try {
            currentData = JSON.parse(existing.data);
        }
        catch { }
        const mergedData = { ...currentData };
        for (const [key, val] of Object.entries(submittedData)) {
            const field = object.fields.find((f) => f.apiName === key);
            if (field) {
                if (field.fieldType === 'number' || field.fieldType === 'currency') {
                    mergedData[key] = val !== null && val !== '' ? Number(val) : null;
                }
                else if (field.fieldType === 'checkbox') {
                    mergedData[key] = val === true || val === 'true' || val === 1;
                }
                else {
                    mergedData[key] = val;
                }
            }
        }
        await this.prisma.customObjectRecord.updateMany({
            where: { id: recordId, objectId: object.id, tenantId },
            data: {
                data: JSON.stringify(mergedData),
                updatedById: user.id,
            },
        });
        const updated = await this.prisma.customObjectRecord.findFirst({
            where: { id: recordId, objectId: object.id, tenantId },
            include: {
                createdBy: { select: { id: true, name: true, employeeCode: true } },
                updatedBy: { select: { id: true, name: true, employeeCode: true } },
            },
        });
        if (!updated)
            throw new common_1.NotFoundException('Record not found');
        await this.prisma.customObject.updateMany({
            where: { id: object.id, tenantId },
            data: { updatedAt: new Date() },
        });
        return {
            id: updated.id,
            objectId: updated.objectId,
            data: mergedData,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
            createdBy: updated.createdBy,
            updatedBy: updated.updatedBy,
        };
    }
    async deleteRecord(objectApiName, recordId, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const object = await this.findObjectOrThrow(objectApiName, user);
        const existing = await this.prisma.customObjectRecord.findFirst({
            where: { id: recordId, objectId: object.id, tenantId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Record with ID "${recordId}" not found on custom object "${object.label}".`);
        }
        await this.prisma.customObjectRecord.updateMany({
            where: { id: recordId, objectId: object.id, tenantId },
            data: {
                deletedAt: new Date(),
                updatedById: user.id,
            },
        });
        const updated = await this.prisma.customObjectRecord.findFirst({
            where: { id: recordId, objectId: object.id, tenantId },
        });
        await this.prisma.customObject.updateMany({
            where: { id: object.id, tenantId },
            data: { updatedAt: new Date() },
        });
        return {
            success: true,
            message: `Record ${recordId} from "${object.label}" archived successfully.`,
            record: updated,
        };
    }
    async getLookupOptions(targetObjectApiName, search, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const tgt = targetObjectApiName.toLowerCase().trim();
        const s = search ? search.trim().toLowerCase() : '';
        try {
            if (tgt === 'company') {
                const companies = await this.prisma.company.findMany({
                    where: { deletedAt: null, tenantId, ...(s ? { name: { contains: s, mode: 'insensitive' } } : {}) },
                    take: 50,
                    orderBy: { name: 'asc' },
                });
                return companies.map((c) => ({ id: c.id, label: c.name, subLabel: c.city || c.industry || 'Client Account' }));
            }
            if (tgt === 'lead') {
                const leads = await this.prisma.lead.findMany({
                    where: { deletedAt: null, tenantId },
                    include: { contact: true, company: true },
                    take: 50,
                    orderBy: { createdAt: 'desc' },
                });
                return leads.map((l) => ({
                    id: l.id,
                    label: `${l.leadNumber} — ${l.contact?.name || l.company?.name || 'Prospect'}`,
                    subLabel: `Status: ${l.status}`,
                }));
            }
            if (tgt === 'contact') {
                const contacts = await this.prisma.contact.findMany({
                    where: {
                        deletedAt: null,
                        tenantId,
                        ...(s ? { name: { contains: s, mode: 'insensitive' } } : {}),
                    },
                    take: 50,
                    orderBy: { name: 'asc' },
                });
                return contacts.map((c) => ({ id: c.id, label: c.name, subLabel: c.phone || c.email || 'Contact' }));
            }
            if (tgt === 'order') {
                const orders = await this.prisma.order.findMany({
                    where: { tenantId },
                    take: 50,
                    orderBy: { createdAt: 'desc' },
                });
                return orders.map((o) => ({ id: o.id, label: o.orderNumber, subLabel: `₹${o.totalAmount.toLocaleString('en-IN')}` }));
            }
            if (tgt === 'invoice') {
                const invoices = await this.prisma.invoice.findMany({
                    where: { tenantId },
                    take: 50,
                    orderBy: { createdAt: 'desc' },
                });
                return invoices.map((i) => ({ id: i.id, label: i.invoiceNumber, subLabel: `Total: ₹${(i.totalAmount || 0).toLocaleString('en-IN')}` }));
            }
            if (tgt === 'sku') {
                const skus = await this.prisma.sku.findMany({
                    where: { deletedAt: null, tenantId, ...(s ? { OR: [{ skuCode: { contains: s, mode: 'insensitive' } }, { name: { contains: s, mode: 'insensitive' } }] } : {}) },
                    take: 50,
                    orderBy: { skuCode: 'asc' },
                });
                return skus.map((sku) => ({ id: sku.id, label: `${sku.skuCode} — ${sku.name}`, subLabel: sku.category || 'SKU' }));
            }
            if (tgt === 'warehouse') {
                const warehouses = await this.prisma.warehouse.findMany({
                    where: { isActive: true, tenantId },
                    take: 50,
                    orderBy: { name: 'asc' },
                });
                return warehouses.map((w) => ({ id: w.id, label: w.name, subLabel: w.code }));
            }
            if (tgt === 'supplier') {
                const suppliers = await this.prisma.supplier.findMany({
                    where: { isActive: true, tenantId },
                    take: 50,
                    orderBy: { name: 'asc' },
                });
                return suppliers.map((sup) => ({ id: sup.id, label: sup.name, subLabel: sup.contactPerson || 'Vendor' }));
            }
            if (tgt === 'user') {
                const users = await this.prisma.user.findMany({
                    where: { deletedAt: null, isActive: true, tenantId },
                    take: 50,
                    orderBy: { name: 'asc' },
                });
                return users.map((u) => ({ id: u.id, label: u.name, subLabel: `${u.employeeCode} (${u.role})` }));
            }
            const customObj = await this.prisma.customObject.findFirst({
                where: { tenantId, OR: [{ apiName: tgt }, { id: targetObjectApiName }] },
            });
            if (customObj) {
                const recs = await this.prisma.customObjectRecord.findMany({
                    where: { objectId: customObj.id, tenantId, deletedAt: null },
                    take: 50,
                    orderBy: { createdAt: 'desc' },
                });
                return recs.map((r) => {
                    try {
                        const p = JSON.parse(r.data);
                        const firstVal = Object.values(p).find((v) => typeof v === 'string' && v.trim() !== '');
                        return {
                            id: r.id,
                            label: String(firstVal || r.id.slice(0, 8)),
                            subLabel: customObj.label,
                        };
                    }
                    catch {
                        return { id: r.id, label: r.id.slice(0, 8), subLabel: customObj.label };
                    }
                });
            }
            return [];
        }
        catch {
            return [];
        }
    }
};
exports.CustomObjectsService = CustomObjectsService;
exports.CustomObjectsService = CustomObjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomObjectsService);
