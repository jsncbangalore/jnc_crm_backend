import { ScopedUser } from '../auth/scoping.service';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadStatusDto, CreateLeadActivityDto, ShareLeadDto, ImportLeadsDto } from './dto/create-lead.dto';
import { Response } from 'express';
export declare class LeadsController {
    private leadsService;
    constructor(leadsService: LeadsService);
    createLead(dto: CreateLeadDto, user: ScopedUser): Promise<{
        company: {
            name: string;
            id: string;
            tenantId: string;
            createdById: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            address: string | null;
            city: string | null;
            state: string | null;
            website: string | null;
            gstin: string | null;
            industry: string | null;
            billingEmail: string | null;
        };
        assignedTo: {
            email: string;
            name: string;
            id: string;
            employeeCode: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdById: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        status: string;
        city: string | null;
        leadNumber: string;
        source: string;
        companyId: string | null;
        contactId: string | null;
        assignedToId: string | null;
        customerName: string;
        customerPhone: string;
        customerEmail: string | null;
        productCategory: string | null;
        productName: string | null;
        quantity: number | null;
        estimatedValue: number | null;
        urgency: string | null;
        queryMessage: string | null;
        rawPayload: string | null;
        isDuplicate: boolean;
        lostReason: string | null;
        capturedAt: Date;
    }>;
    getLeads(user: ScopedUser, status?: string, source?: string, assignedToId?: string, search?: string, startDate?: string, endDate?: string, page?: number, limit?: number): Promise<{
        items: ({
            company: {
                name: string;
                id: string;
                tenantId: string;
                createdById: string | null;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                address: string | null;
                city: string | null;
                state: string | null;
                website: string | null;
                gstin: string | null;
                industry: string | null;
                billingEmail: string | null;
            };
            contact: {
                email: string | null;
                name: string;
                phone: string;
                id: string;
                tenantId: string | null;
                createdById: string | null;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                companyId: string | null;
                designation: string | null;
                isPrimary: boolean;
            };
            assignedTo: {
                email: string;
                name: string;
                id: string;
                employeeCode: string;
            };
            activities: {
                id: string;
                createdAt: Date;
                userId: string | null;
                type: string;
                title: string;
                description: string | null;
                scheduledAt: Date | null;
                completedAt: Date | null;
                isCompleted: boolean;
                leadId: string;
            }[];
        } & {
            id: string;
            tenantId: string;
            createdById: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: string;
            city: string | null;
            leadNumber: string;
            source: string;
            companyId: string | null;
            contactId: string | null;
            assignedToId: string | null;
            customerName: string;
            customerPhone: string;
            customerEmail: string | null;
            productCategory: string | null;
            productName: string | null;
            quantity: number | null;
            estimatedValue: number | null;
            urgency: string | null;
            queryMessage: string | null;
            rawPayload: string | null;
            isDuplicate: boolean;
            lostReason: string | null;
            capturedAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    downloadTemplate(res: Response): Response<any, Record<string, any>>;
    getLead(id: string, user: ScopedUser): Promise<{
        company: {
            name: string;
            id: string;
            tenantId: string;
            createdById: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            address: string | null;
            city: string | null;
            state: string | null;
            website: string | null;
            gstin: string | null;
            industry: string | null;
            billingEmail: string | null;
        };
        contact: {
            email: string | null;
            name: string;
            phone: string;
            id: string;
            tenantId: string | null;
            createdById: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            companyId: string | null;
            designation: string | null;
            isPrimary: boolean;
        };
        quotations: ({
            lines: ({
                sku: {
                    name: string;
                    id: string;
                    tenantId: string;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                    taxRate: number;
                    unitPrice: number;
                    productId: string | null;
                    skuCode: string;
                    category: string;
                    hsnCode: string | null;
                    packageType: string | null;
                    costPrice: number;
                    reorderPoint: number;
                    reorderQty: number;
                    datasheetUrl: string | null;
                    preferredSupplierId: string | null;
                };
            } & {
                id: string;
                quantity: number;
                notes: string | null;
                quotationId: string;
                skuId: string;
                unitPrice: number;
                discount: number;
                totalPrice: number;
            })[];
        } & {
            id: string;
            tenantId: string;
            createdById: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: string;
            leadId: string | null;
            contactId: string | null;
            quoteNumber: string;
            subtotal: number;
            taxRate: number;
            taxAmount: number;
            totalAmount: number;
            validUntil: Date;
            notes: string | null;
            terms: string | null;
        })[];
        assignedTo: {
            email: string;
            name: string;
            id: string;
            employeeCode: string;
        };
        activities: ({
            performedBy: {
                name: string;
                id: string;
                employeeCode: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string | null;
            type: string;
            title: string;
            description: string | null;
            scheduledAt: Date | null;
            completedAt: Date | null;
            isCompleted: boolean;
            leadId: string;
        })[];
    } & {
        id: string;
        tenantId: string;
        createdById: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        status: string;
        city: string | null;
        leadNumber: string;
        source: string;
        companyId: string | null;
        contactId: string | null;
        assignedToId: string | null;
        customerName: string;
        customerPhone: string;
        customerEmail: string | null;
        productCategory: string | null;
        productName: string | null;
        quantity: number | null;
        estimatedValue: number | null;
        urgency: string | null;
        queryMessage: string | null;
        rawPayload: string | null;
        isDuplicate: boolean;
        lostReason: string | null;
        capturedAt: Date;
    }>;
    updateStatus(id: string, dto: UpdateLeadStatusDto, user: ScopedUser): Promise<{
        company: {
            name: string;
            id: string;
            tenantId: string;
            createdById: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            address: string | null;
            city: string | null;
            state: string | null;
            website: string | null;
            gstin: string | null;
            industry: string | null;
            billingEmail: string | null;
        };
        contact: {
            email: string | null;
            name: string;
            phone: string;
            id: string;
            tenantId: string | null;
            createdById: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            companyId: string | null;
            designation: string | null;
            isPrimary: boolean;
        };
        quotations: ({
            lines: ({
                sku: {
                    name: string;
                    id: string;
                    tenantId: string;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                    taxRate: number;
                    unitPrice: number;
                    productId: string | null;
                    skuCode: string;
                    category: string;
                    hsnCode: string | null;
                    packageType: string | null;
                    costPrice: number;
                    reorderPoint: number;
                    reorderQty: number;
                    datasheetUrl: string | null;
                    preferredSupplierId: string | null;
                };
            } & {
                id: string;
                quantity: number;
                notes: string | null;
                quotationId: string;
                skuId: string;
                unitPrice: number;
                discount: number;
                totalPrice: number;
            })[];
        } & {
            id: string;
            tenantId: string;
            createdById: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: string;
            leadId: string | null;
            contactId: string | null;
            quoteNumber: string;
            subtotal: number;
            taxRate: number;
            taxAmount: number;
            totalAmount: number;
            validUntil: Date;
            notes: string | null;
            terms: string | null;
        })[];
        assignedTo: {
            email: string;
            name: string;
            id: string;
            employeeCode: string;
        };
        activities: ({
            performedBy: {
                name: string;
                id: string;
                employeeCode: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string | null;
            type: string;
            title: string;
            description: string | null;
            scheduledAt: Date | null;
            completedAt: Date | null;
            isCompleted: boolean;
            leadId: string;
        })[];
    } & {
        id: string;
        tenantId: string;
        createdById: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        status: string;
        city: string | null;
        leadNumber: string;
        source: string;
        companyId: string | null;
        contactId: string | null;
        assignedToId: string | null;
        customerName: string;
        customerPhone: string;
        customerEmail: string | null;
        productCategory: string | null;
        productName: string | null;
        quantity: number | null;
        estimatedValue: number | null;
        urgency: string | null;
        queryMessage: string | null;
        rawPayload: string | null;
        isDuplicate: boolean;
        lostReason: string | null;
        capturedAt: Date;
    }>;
    addActivity(id: string, dto: CreateLeadActivityDto, user: ScopedUser): Promise<{
        performedBy: {
            name: string;
            id: string;
            employeeCode: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string | null;
        type: string;
        title: string;
        description: string | null;
        scheduledAt: Date | null;
        completedAt: Date | null;
        isCompleted: boolean;
        leadId: string;
    }>;
    shareLead(id: string, dto: ShareLeadDto, user: ScopedUser): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        userId: string;
        leadId: string;
        sharedById: string | null;
    }>;
    previewSpreadsheet(file: Express.Multer.File, user: ScopedUser): Promise<{
        totalCount: number;
        duplicateCount: number;
        validCount: number;
        rows: any[];
    }>;
    previewJson(body: ImportLeadsDto, user: ScopedUser): Promise<{
        totalCount: number;
        duplicateCount: number;
        validCount: number;
        rows: any[];
    }>;
    commitImport(body: ImportLeadsDto, user: ScopedUser): Promise<{
        totalRows: number;
        importedCount: number;
        errors: string[];
        createdLeadNumbers: string[];
    }>;
}
