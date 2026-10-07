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
exports.LeadsController = void 0;
const common_1 = require("@nestjs/common");
const page_access_decorator_1 = require("../auth/page-access.decorator");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const leads_service_1 = require("./leads.service");
const create_lead_dto_1 = require("./dto/create-lead.dto");
const file_validator_1 = require("../common/file-validator");
const csv_sanitize_util_1 = require("../common/csv-sanitize.util");
const platform_express_1 = require("@nestjs/platform-express");
const Papa = require("papaparse");
const XLSX = require("xlsx");
let LeadsController = class LeadsController {
    constructor(leadsService) {
        this.leadsService = leadsService;
    }
    async createLead(dto, user) {
        return this.leadsService.createLead(dto, user);
    }
    async getLeads(user, status, source, assignedToId, search, startDate, endDate, page, limit) {
        return this.leadsService.findAll(user, {
            status,
            source,
            assignedToId,
            search,
            startDate,
            endDate,
            page,
            limit,
        });
    }
    downloadTemplate(res) {
        const csvContent = `company_name,contact_name,phone,email,product_interest,city,estimated_value,assigned_to,source
Apex Robotics Pvt Ltd,Rajesh Sharma,9845012345,rajesh@apexrobotics.in,STM32F401RET6 MCU,Bengaluru,75000,,manual
Quantron Automation,Pooja Patel,9820055443,pooja@quantron.com,ESP32-S3 Dual-Core Module,Pune,45000,,web
Voltrix Embedded,Anand Verma,9811122334,anand@voltrix.in,ATmega328P DIP-28,Hyderabad,28000,,trade_show
Nexus Power Electronics,Siddharth Rao,9876543210,siddharth@nexuspower.in,IRFZ44N Power MOSFET,Chennai,120000,,manual
`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="jnc_leads_import_template.csv"');
        return res.send(csvContent);
    }
    async getLead(id, user) {
        return this.leadsService.findOne(id, user);
    }
    async updateStatus(id, dto, user) {
        return this.leadsService.updateStatus(id, dto, user);
    }
    async addActivity(id, dto, user) {
        return this.leadsService.addActivity(id, dto, user);
    }
    async shareLead(id, dto, user) {
        if (!dto.targetUserId) {
            throw new common_1.BadRequestException('targetUserId is required for sharing.');
        }
        return this.leadsService.shareLead(id, dto.targetUserId, user);
    }
    async previewSpreadsheet(file, user) {
        if (!file) {
            throw new common_1.BadRequestException('Spreadsheet file is required');
        }
        (0, file_validator_1.validateUploadedFile)(file, 'spreadsheet', 50 * 1024 * 1024);
        let records = [];
        const lowerName = file.originalname.toLowerCase();
        if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
            try {
                const workbook = XLSX.read(file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                records = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            }
            catch (err) {
                throw new common_1.BadRequestException(`Excel parsing error: ${err.message}`);
            }
        }
        else {
            const csvContent = file.buffer.toString('utf-8');
            const parseResult = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
            if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
                throw new common_1.BadRequestException(`CSV parse error: ${parseResult.errors[0].message}`);
            }
            records = parseResult.data;
        }
        const sanitized = records.map((r) => (0, csv_sanitize_util_1.sanitizeRowForImport)(r));
        return this.leadsService.previewImport(sanitized, user);
    }
    async previewJson(body, user) {
        if (!body.records || !Array.isArray(body.records)) {
            throw new common_1.BadRequestException('Records array is required');
        }
        const sanitized = body.records.map((r) => (0, csv_sanitize_util_1.sanitizeRowForImport)(r));
        return this.leadsService.previewImport(sanitized, user);
    }
    async commitImport(body, user) {
        if (!body.records || !Array.isArray(body.records)) {
            throw new common_1.BadRequestException('Records array is required');
        }
        const sanitized = body.records.map((r) => (0, csv_sanitize_util_1.sanitizeRowForImport)(r));
        return this.leadsService.commitImport(sanitized, user);
    }
};
exports.LeadsController = LeadsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin', 'employee'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lead_dto_1.CreateLeadDto, Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "createLead", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('source')),
    __param(3, (0, common_1.Query)('assignedToId')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('startDate')),
    __param(6, (0, common_1.Query)('endDate')),
    __param(7, (0, common_1.Query)('page')),
    __param(8, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "getLeads", null);
__decorate([
    (0, common_1.Get)('template-csv'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "downloadTemplate", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "getLead", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_lead_dto_1.UpdateLeadStatusDto, Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/activities'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_lead_dto_1.CreateLeadActivityDto, Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "addActivity", null);
__decorate([
    (0, common_1.Post)(':id/share'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin', 'employee'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_lead_dto_1.ShareLeadDto, Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "shareLead", null);
__decorate([
    (0, common_1.Post)('import-preview'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 50 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "previewSpreadsheet", null);
__decorate([
    (0, common_1.Post)('import-preview-json'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lead_dto_1.ImportLeadsDto, Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "previewJson", null);
__decorate([
    (0, common_1.Post)('import-commit'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lead_dto_1.ImportLeadsDto, Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "commitImport", null);
exports.LeadsController = LeadsController = __decorate([
    (0, common_1.Controller)('leads'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, page_access_decorator_1.PageAccess)('leads'),
    __metadata("design:paramtypes", [leads_service_1.LeadsService])
], LeadsController);
