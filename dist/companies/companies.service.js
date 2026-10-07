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
exports.CompaniesService = exports.CreateContactDto = exports.UpdateCompanyDto = exports.CreateCompanyDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const scoping_service_1 = require("../auth/scoping.service");
const tenant_util_1 = require("../common/tenant.util");
const class_validator_1 = require("class-validator");
class CreateCompanyDto {
}
exports.CreateCompanyDto = CreateCompanyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "gstin", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "industry", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "website", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "billingEmail", void 0);
class UpdateCompanyDto {
}
exports.UpdateCompanyDto = UpdateCompanyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "gstin", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "industry", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "website", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "billingEmail", void 0);
class CreateContactDto {
}
exports.CreateContactDto = CreateContactDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateContactDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateContactDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateContactDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateContactDto.prototype, "designation", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateContactDto.prototype, "isPrimary", void 0);
let CompaniesService = class CompaniesService {
    constructor(prisma, scopingService) {
        this.prisma = prisma;
        this.scopingService = scopingService;
    }
    async create(dto, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        return this.prisma.company.create({
            data: {
                tenantId,
                name: dto.name.trim(),
                gstin: dto.gstin?.trim() || null,
                industry: dto.industry?.trim() || null,
                address: dto.address?.trim() || null,
                city: dto.city?.trim() || null,
                state: dto.state?.trim() || 'Karnataka',
                website: dto.website?.trim() || null,
                billingEmail: dto.billingEmail?.trim().toLowerCase() || null,
                createdById: user.id,
            },
        });
    }
    async findAll(user, query) {
        const scope = this.scopingService.getCompanyScope(user);
        const where = { ...scope, deletedAt: null };
        if (query?.search) {
            const searchOR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { gstin: { contains: query.search, mode: 'insensitive' } },
                { city: { contains: query.search, mode: 'insensitive' } },
                { billingEmail: { contains: query.search, mode: 'insensitive' } },
            ];
            if (scope.OR) {
                where.AND = [{ OR: scope.OR }, { OR: searchOR }];
                delete where.OR;
            }
            else {
                where.OR = searchOR;
            }
        }
        return this.prisma.company.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                contacts: {
                    where: { deletedAt: null, ...this.scopingService.getContactScope(user) },
                    orderBy: { isPrimary: 'desc' },
                },
                _count: {
                    select: { leads: true, contacts: true, invoices: true },
                },
            },
        });
    }
    async findOne(id, user) {
        const scope = this.scopingService.getCompanyScope(user);
        const company = await this.prisma.company.findFirst({
            where: { id, ...scope, deletedAt: null },
            include: {
                contacts: {
                    where: { deletedAt: null, ...this.scopingService.getContactScope(user) },
                    orderBy: { isPrimary: 'desc' },
                },
                leads: {
                    where: { deletedAt: null },
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
                invoices: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!company || company.deletedAt) {
            throw new common_1.NotFoundException('Company not found');
        }
        return company;
    }
    async update(id, dto, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const scope = this.scopingService.getCompanyScope(user);
        const res = await this.prisma.company.updateMany({
            where: { id, tenantId, ...scope, deletedAt: null },
            data: {
                ...(dto.name !== undefined && { name: dto.name.trim() }),
                ...(dto.gstin !== undefined && { gstin: dto.gstin?.trim() || null }),
                ...(dto.industry !== undefined && { industry: dto.industry?.trim() || null }),
                ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
                ...(dto.city !== undefined && { city: dto.city?.trim() || null }),
                ...(dto.state !== undefined && { state: dto.state?.trim() || 'Karnataka' }),
                ...(dto.website !== undefined && { website: dto.website?.trim() || null }),
                ...(dto.billingEmail !== undefined && { billingEmail: dto.billingEmail?.trim().toLowerCase() || null }),
            },
        });
        if (res.count === 0)
            throw new common_1.NotFoundException('Company not found');
        return this.findOne(id, user);
    }
    async delete(id, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const scope = this.scopingService.getCompanyScope(user);
        const res = await this.prisma.company.updateMany({
            where: { id, tenantId, ...scope, deletedAt: null },
            data: { deletedAt: new Date() },
        });
        if (res.count === 0)
            throw new common_1.NotFoundException('Company not found');
        return { success: true };
    }
    async addContact(companyId, dto, user) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const company = await this.prisma.company.findFirst({
            where: { id: companyId, tenantId, deletedAt: null },
        });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        return this.prisma.contact.create({
            data: {
                ...dto,
                name: dto.name?.trim(),
                email: dto.email?.trim().toLowerCase() || null,
                phone: dto.phone?.trim(),
                designation: dto.designation?.trim() || null,
                isPrimary: !!dto.isPrimary,
                tenantId,
                companyId: company.id,
                createdById: user.id,
            },
        });
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        scoping_service_1.ScopingService])
], CompaniesService);
