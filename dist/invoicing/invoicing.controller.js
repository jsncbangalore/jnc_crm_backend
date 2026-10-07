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
exports.InvoicingController = void 0;
const common_1 = require("@nestjs/common");
const page_access_decorator_1 = require("../auth/page-access.decorator");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const invoicing_service_1 = require("./invoicing.service");
const invoicing_dto_1 = require("./dto/invoicing.dto");
let InvoicingController = class InvoicingController {
    constructor(invoicingService) {
        this.invoicingService = invoicingService;
    }
    async getInvoices(user, page, limit, search, status, docType) {
        return this.invoicingService.findAll(user, { page, limit, search, status, docType });
    }
    async getNextNumber(user, docType, prefix) {
        const number = await this.invoicingService.getNextDocumentNumber(docType || 'tax_invoice', prefix, user);
        return { number };
    }
    async createDirect(body, user) {
        return this.invoicingService.createDirectDocument(user, body);
    }
    async getCompanyProfile(user) {
        return this.invoicingService.getCompanyProfile(user);
    }
    async updateCompanyProfile(body, user) {
        return this.invoicingService.updateCompanyProfile(user, body);
    }
    async getSettingsCompanyProfile(user) {
        return this.invoicingService.getCompanyProfile(user);
    }
    async updateSettingsCompanyProfile(body, user) {
        return this.invoicingService.updateCompanyProfile(user, body);
    }
    async getSignatorySettings(user) {
        return this.invoicingService.getSignatorySettings(user);
    }
    async updateSignatorySettings(body, user) {
        return this.invoicingService.updateSignatorySettings(user, body);
    }
    async getInvoice(id, user) {
        return this.invoicingService.findOne(id, user);
    }
    async downloadPdf(id, templateType, user, res) {
        const { buffer, filename } = await this.invoicingService.getPdf(id, user, templateType);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
    async generateFromOrder(orderId, body, user) {
        return this.invoicingService.generateInvoiceForOrder(orderId, user, body);
    }
    async updateInvoice(id, body, user) {
        return this.invoicingService.updateDocument(id, user, body);
    }
    async voidInvoice(id, body, user) {
        return this.invoicingService.voidInvoice(id, body?.reason || '', user);
    }
    async recordPayment(id, body, user) {
        return this.invoicingService.recordPayment(id, body, user);
    }
    async emailInvoice(id, body, user) {
        return this.invoicingService.emailInvoice(id, user, body);
    }
};
exports.InvoicingController = InvoicingController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('docType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String, String]),
    __metadata("design:returntype", Promise)
], InvoicingController.prototype, "getInvoices", null);
__decorate([
    (0, common_1.Get)('generate-number'),
    (0, roles_decorator_1.Roles)('platform_super_admin', 'tenant_admin', 'admin', 'sub_admin', 'employee'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('docType')),
    __param(2, (0, common_1.Query)('prefix')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], InvoicingController.prototype, "getNextNumber", null);
__decorate([
    (0, common_1.Post)('create-direct'),
    (0, roles_decorator_1.Roles)('platform_super_admin', 'tenant_admin', 'admin', 'sub_admin', 'employee'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [invoicing_dto_1.CreateDirectInvoiceDto, Object]),
    __metadata("design:returntype", Promise)
], InvoicingController.prototype, "createDirect", null);
__decorate([
    (0, common_1.Get)('company-profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvoicingController.prototype, "getCompanyProfile", null);
__decorate([
    (0, common_1.Post)('company-profile'),
    (0, roles_decorator_1.Roles)('platform_super_admin', 'tenant_admin', 'admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [invoicing_dto_1.CompanyProfileDto, Object]),
    __metadata("design:returntype", Promise)
], InvoicingController.prototype, "updateCompanyProfile", null);
__decorate([
    (0, common_1.Get)('settings/company-profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvoicingController.prototype, "getSettingsCompanyProfile", null);
__decorate([
    (0, common_1.Post)('settings/company-profile'),
    (0, roles_decorator_1.Roles)('platform_super_admin', 'tenant_admin', 'admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [invoicing_dto_1.CompanyProfileDto, Object]),
    __metadata("design:returntype", Promise)
], InvoicingController.prototype, "updateSettingsCompanyProfile", null);
__decorate([
    (0, common_1.Get)('settings/signatory'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvoicingController.prototype, "getSignatorySettings", null);
__decorate([
    (0, common_1.Post)('settings/signatory'),
    (0, roles_decorator_1.Roles)('platform_super_admin', 'tenant_admin', 'admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [invoicing_dto_1.SignatorySettingsDto, Object]),
    __metadata("design:returntype", Promise)
], InvoicingController.prototype, "updateSignatorySettings", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvoicingController.prototype, "getInvoice", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('templateType')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], InvoicingController.prototype, "downloadPdf", null);
__decorate([
    (0, common_1.Post)('order/:orderId/generate'),
    (0, roles_decorator_1.Roles)('platform_super_admin', 'tenant_admin', 'admin', 'sub_admin', 'employee'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, invoicing_dto_1.GenerateFromOrderDto, Object]),
    __metadata("design:returntype", Promise)
], InvoicingController.prototype, "generateFromOrder", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('platform_super_admin', 'tenant_admin', 'admin', 'sub_admin', 'employee'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, invoicing_dto_1.UpdateInvoiceDto, Object]),
    __metadata("design:returntype", Promise)
], InvoicingController.prototype, "updateInvoice", null);
__decorate([
    (0, common_1.Patch)(':id/void'),
    (0, roles_decorator_1.Roles)('platform_super_admin', 'tenant_admin', 'admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, invoicing_dto_1.VoidInvoiceDto, Object]),
    __metadata("design:returntype", Promise)
], InvoicingController.prototype, "voidInvoice", null);
__decorate([
    (0, common_1.Post)(':id/payments'),
    (0, roles_decorator_1.Roles)('platform_super_admin', 'tenant_admin', 'admin', 'sub_admin', 'employee'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, invoicing_dto_1.RecordInvoicePaymentDto, Object]),
    __metadata("design:returntype", Promise)
], InvoicingController.prototype, "recordPayment", null);
__decorate([
    (0, common_1.Post)(':id/email'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, invoicing_dto_1.EmailInvoiceDto, Object]),
    __metadata("design:returntype", Promise)
], InvoicingController.prototype, "emailInvoice", null);
exports.InvoicingController = InvoicingController = __decorate([
    (0, common_1.Controller)('invoices'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, page_access_decorator_1.PageAccess)('invoices'),
    __metadata("design:paramtypes", [invoicing_service_1.InvoicingService])
], InvoicingController);
