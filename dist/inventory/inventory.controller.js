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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const page_access_decorator_1 = require("../auth/page-access.decorator");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const inventory_service_1 = require("./inventory.service");
const platform_express_1 = require("@nestjs/platform-express");
const tenant_util_1 = require("../common/tenant.util");
const file_validator_1 = require("../common/file-validator");
const inventory_dto_1 = require("./dto/inventory.dto");
const Papa = require("papaparse");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
let InventoryController = class InventoryController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    getStockLevels(user, warehouseId, search, lowStock, page, limit) {
        return this.inventoryService.getStockLevels(user, {
            warehouseId,
            search,
            lowStock: lowStock === 'true',
            page,
            limit,
        });
    }
    recordMovement(data, user) {
        return this.inventoryService.recordMovement(data, user);
    }
    getMovements(user, warehouseId, skuId, type, page, limit) {
        return this.inventoryService.getMovements(user, { warehouseId, skuId, type, page, limit });
    }
    getReorderAlerts(user) {
        return this.inventoryService.getReorderAlerts(user);
    }
    getWarehouses(user) {
        return this.inventoryService.getWarehouses(user);
    }
    createWarehouse(data, user) {
        return this.inventoryService.createWarehouse(data, user);
    }
    getSkus(user, search) {
        return this.inventoryService.getSkus(user, search);
    }
    getSku(id, user) {
        return this.inventoryService.getSkuById(id, user);
    }
    createSku(data, user) {
        return this.inventoryService.createSku(data, user);
    }
    updateSku(id, data, user) {
        return this.inventoryService.updateSku(id, data, user);
    }
    deleteSku(id, user) {
        return this.inventoryService.deleteSku(id, user);
    }
    bulkDeleteSkus(body, user) {
        return this.inventoryService.bulkDeleteSkus(body.ids, user);
    }
    async importCsv(file, user, warehouseCode) {
        if (!file) {
            throw new common_1.BadRequestException('Spreadsheet/CSV file is required');
        }
        let records = [];
        const lowerName = file.originalname.toLowerCase();
        if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
            try {
                const workbook = XLSX.read(file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
                if (!rawRows || rawRows.length === 0) {
                    throw new common_1.BadRequestException('Spreadsheet is empty');
                }
                let headerRowIndex = -1;
                const keywords = ['sku', 'item', 'code', 'part', 'component', 'description', 'specs', 'project', 'unit', 'price', 'rate', 'quantity', 'qty', 'stock'];
                for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
                    const row = rawRows[i];
                    if (!Array.isArray(row))
                        continue;
                    const rowText = row.map((c) => String(c || '').toLowerCase().trim()).join(' ');
                    let matches = 0;
                    for (const kw of keywords) {
                        if (rowText.includes(kw))
                            matches++;
                    }
                    if (matches >= 2) {
                        headerRowIndex = i;
                        break;
                    }
                }
                if (headerRowIndex === -1) {
                    headerRowIndex = 0;
                }
                const headers = rawRows[headerRowIndex].map((h) => String(h || '').trim());
                for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
                    const row = rawRows[r];
                    if (!Array.isArray(row) || row.every((c) => c === '' || c === null || c === undefined)) {
                        continue;
                    }
                    const obj = {};
                    let hasData = false;
                    for (let c = 0; c < headers.length; c++) {
                        const h = headers[c];
                        if (h) {
                            obj[h] = row[c];
                            if (row[c] !== '' && row[c] !== null && row[c] !== undefined) {
                                hasData = true;
                            }
                        }
                    }
                    if (hasData) {
                        records.push(obj);
                    }
                }
            }
            catch (err) {
                throw new common_1.BadRequestException(`Excel parsing error: ${err.message}`);
            }
        }
        else {
            const csvContent = file.buffer.toString('utf-8');
            const parsed = Papa.parse(csvContent, { header: false, skipEmptyLines: true });
            const rawRows = parsed.data;
            if (!rawRows || rawRows.length === 0) {
                throw new common_1.BadRequestException('CSV file is empty');
            }
            let headerRowIndex = -1;
            const keywords = ['sku', 'item', 'code', 'part', 'component', 'description', 'specs', 'project', 'unit', 'price', 'rate', 'quantity', 'qty', 'stock'];
            for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
                const row = rawRows[i];
                if (!Array.isArray(row))
                    continue;
                const rowText = row.map((c) => String(c || '').toLowerCase().trim()).join(' ');
                let matches = 0;
                for (const kw of keywords) {
                    if (rowText.includes(kw))
                        matches++;
                }
                if (matches >= 2) {
                    headerRowIndex = i;
                    break;
                }
            }
            if (headerRowIndex === -1) {
                headerRowIndex = 0;
            }
            const headers = rawRows[headerRowIndex].map((h) => String(h || '').trim());
            for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
                const row = rawRows[r];
                if (!Array.isArray(row) || row.every((c) => c === '' || c === null || c === undefined)) {
                    continue;
                }
                const obj = {};
                let hasData = false;
                for (let c = 0; c < headers.length; c++) {
                    const h = headers[c];
                    if (h) {
                        obj[h] = row[c];
                        if (row[c] !== '' && row[c] !== null && row[c] !== undefined) {
                            hasData = true;
                        }
                    }
                }
                if (hasData) {
                    records.push(obj);
                }
            }
        }
        return this.inventoryService.importSpreadsheet(records, user, warehouseCode);
    }
    async importJson(body, user) {
        if (!body.records || !Array.isArray(body.records)) {
            throw new common_1.BadRequestException('Records array is required');
        }
        return this.inventoryService.importSpreadsheet(body.records, user, body.warehouseCode);
    }
    downloadTemplate(res) {
        const csvContent = `SKU Code,Name,Category,HSN Code,Package Type,Unit Price,Cost Price,Reorder Point,Reorder Qty,Quantity,Supplier Name,Bin
PA-AMP-240W,240W Commercial PA Mixer Amplifier 100V,PA System,85184000,Unit,14500.00,9800.00,5,20,12,Ahuja / Bosch Sound India,BLR-A-01-B01
PA-SPK-CLG-6W,6W Fast-Clamp Ceiling Speaker 100V,PA System,85182100,Unit,850.00,480.00,25,100,80,Ahuja / Bosch Sound India,BLR-A-01-B02
PA-SPK-HRN-30W,30W Reflex Horn Weatherproof Speaker,PA System,85182900,Unit,2200.00,1400.00,10,50,35,Ahuja / Bosch Sound India,BLR-A-01-B03
TB-MST-10Z,10-Zone Master Intercom Control Station,Talk Back System,85176290,Unit,18500.00,12000.00,3,10,8,JSNC In-House Integration,BLR-A-02-A01
TB-SUB-FLUSH,Flush Mount Heavy-Duty Sub-station Intercom,Talk Back System,85176290,Unit,1850.00,1100.00,15,50,42,JSNC In-House Integration,BLR-A-02-A02
ATB-CTRL-2LP,2-Loop Addressable Talk Back Master Controller,Addressable Talk Back,85176290,Unit,34000.00,23500.00,2,5,4,JSNC Systems R&D,BLR-A-02-B01
ATB-ZMD-01,Addressable Zone Interface Module,Addressable Talk Back,85176290,Unit,2400.00,1550.00,20,50,45,JSNC Systems R&D,BLR-A-02-B02
FAS-PNL-16Z,16-Zone Microprocessor Fire Alarm Control Panel,Fire Alarm System,85311010,Unit,22500.00,15000.00,3,10,6,Honeywell / GST Fire India,BLR-B-01-A01
FAS-DET-SMK-OPT,Optical Smoke Detector with Standard Base,Fire Alarm System,85311090,Unit,950.00,550.00,50,200,140,Honeywell / GST Fire India,BLR-B-01-A02
FAS-MCP-RED,Resettable Manual Call Point with LED Indicator,Fire Alarm System,85319000,Unit,650.00,380.00,30,100,65,Honeywell / GST Fire India,BLR-B-01-A03
FAS-SND-HTR,Dual-Tone Electronic Fire Alarm Hooter with Strobe,Fire Alarm System,85318000,Unit,1200.00,720.00,20,80,50,Honeywell / GST Fire India,BLR-B-01-A04
NCS-PANEL-32,32-Bed Digital Nurse Call Station Display,Nurse Call System,85176990,Unit,28000.00,19000.00,2,5,5,JSNC Medical Systems,BLR-B-02-A01
NCS-CALL-BED,Bedside Emergency Call Button with Cord,Nurse Call System,85319000,Unit,1150.00,680.00,25,100,75,JSNC Medical Systems,BLR-B-02-A02
PBX-IP-16EXT,IP-PBX Hybrid 16 Extension VoIP Gateway,EPABX / IPABX,85176210,Unit,19500.00,13200.00,4,15,10,Matrix Comsec / Grandstream,BLR-C-01-A01
PBX-PHONE-SIP,HD Executive SIP IP Phone with Color Screen,EPABX / IPABX,85171810,Unit,4200.00,2750.00,10,30,22,Matrix Comsec / Grandstream,BLR-C-01-A02
PAS-BTN-HOLDUP,Dual-Action Bank Under-Desk Panic Switch,Panic Alarm System,85319000,Unit,450.00,220.00,25,100,60,JSNC Security Controls,BLR-C-02-A01
CCTV-CAM-4MP-DOM,4MP IR Turret Dome IP Camera 30m PoE,CCTV Surveillance,85258900,Unit,3200.00,2100.00,15,50,38,Hikvision / Dahua India,BLR-D-01-A01
CCTV-NVR-16CH-4K,16-Channel 4K Ultra HD NVR with 16-PoE,CCTV Surveillance,85285900,Unit,16500.00,11000.00,3,10,7,Hikvision / Dahua India,BLR-D-01-A02
ACS-BIO-FP-FACE,Biometric Facial Recognition & Fingerprint Terminal,Access Control,85437099,Unit,12500.00,8200.00,5,20,14,ZKTeco / eSSL Security,BLR-E-01-A01
ACS-LOCK-EM-600,Electromagnetic Lock 600 lbs with ZL Bracket,Access Control,83014090,Set,2800.00,1750.00,10,40,26,ZKTeco / eSSL Security,BLR-E-01-A02
NET-SW-24POE-GIG,24-Port Gigabit Managed PoE+ Network Switch 370W,Network Infrastructure,85176290,Unit,18500.00,12500.00,4,15,9,D-Link / Cisco Systems,BLR-F-01-A01
NET-CAB-CAT6-305,Cat6 UTP 4-Pair Solid Bare Copper 305m Drum,Network Infrastructure,85444999,Drum,8800.00,6200.00,5,20,18,Schneider / D-Link India,BLR-F-01-A02
`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="inventory_import_template.csv"');
        return res.send(csvContent);
    }
    async initiateTransfer(body, user) {
        return this.inventoryService.initiateTransfer(body, user);
    }
    async getTransfers(user, page, limit, status, warehouseId, search) {
        return this.inventoryService.getTransfers(user, { page, limit, status, warehouseId, search });
    }
    async getTransfersSummary(user) {
        return this.inventoryService.getInTransitSummary(user);
    }
    async receiveTransfer(id, user) {
        return this.inventoryService.receiveTransfer(id, user);
    }
    async cancelTransfer(id, user) {
        return this.inventoryService.cancelTransfer(id, user);
    }
    async getProjectStock(user, project, search, status, shortageOnly) {
        return this.inventoryService.getProjectStockPositions(user, {
            project,
            search,
            status,
            shortageOnly: shortageOnly === 'true',
        });
    }
    async getProjectStockSummary(user) {
        return this.inventoryService.getProjectStockSummary(user);
    }
    async createProjectStock(data, user) {
        return this.inventoryService.createProjectStockPosition(data, user);
    }
    async updateProjectStock(id, data, user) {
        return this.inventoryService.updateProjectStockPosition(id, data, user);
    }
    async recordProjectStockPurchase(id, body, user) {
        return this.inventoryService.recordProjectStockPurchase(id, body, user);
    }
    async deleteProjectStock(id, user) {
        return this.inventoryService.deleteProjectStockPosition(id, user);
    }
    async bulkImportProjectStock(body, user) {
        if (!body.rows || !Array.isArray(body.rows)) {
            throw new common_1.BadRequestException('Invalid payload: rows array required');
        }
        return this.inventoryService.bulkImportProjectStockPositions(body.rows, user);
    }
    async clearAllInventory(user) {
        return this.inventoryService.clearAllInventory(user);
    }
    downloadProjectStockTemplate(res) {
        const csvContent = `Project,Reference,Quantity,Item Code,Part Value,Package,Unit,BOM Qty / Unit,Batch Qty,Planned Requirement,Opening Stock,Inflow,Outflow,Present Stock,Shortage,Status,Notes
Bangalore Metro Phase-2 PA System,AMP-RACK-01,10,PA-AMP-240W,240W 100V RMS,2U 19-inch Rack,Nos,2,10,20,30,0,8,22,0,Sufficient,Main concourse & platform distribution amplifiers
Bangalore Metro Phase-2 PA System,SPK-CLG-01,10,PA-SPK-CLG-6W,6W 100V Fast Clamp,Ceiling Flush Mount,Nos,24,10,240,180,100,60,220,20,Shortage,Underground ticketing concourse speakers
CyberTech IT Park Surveillance & Access Control,CCTV-CAM-EXT,4,CCTV-CAM-4MP-DOM,4MP IR 30m PoE H.265+,Vandal Dome IP67,Nos,16,4,64,45,25,10,60,4,Shortage,Corridor and perimeter optical surveillance
CyberTech IT Park Surveillance & Access Control,ACS-FACE-01,4,ACS-BIO-FP-FACE,Face + FP + RFID TCP/IP,Wall Mount Touch,Nos,6,4,24,12,0,0,12,12,Critical Shortage,Turnstile & server room access
Aster Hospital Nurse Call & Talkback Integration,NCS-STN-ICU,2,NCS-PANEL-32,32-Bed Digital LCD Station,Nurse Station Console,Nos,2,2,4,5,0,1,4,0,Sufficient,ICU & Emergency ward central monitoring console
`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="project_stock_position_template.csv"');
        return res.send(csvContent);
    }
    async getProducts(user) {
        return this.inventoryService.getProducts(user);
    }
    async seedProducts(user) {
        return this.inventoryService.seedFinishedProducts(user);
    }
    async getInventoryDashboard(user) {
        return this.inventoryService.getInventoryDashboard(user);
    }
    async uploadPurchaseDocument(file, user) {
        if (!file)
            throw new common_1.BadRequestException('File is required');
        (0, file_validator_1.validateUploadedFile)(file, 'document_or_image', 10 * 1024 * 1024);
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        const tenantDir = path.resolve(process.cwd(), '../../purchase-documents', tenantId);
        if (!fs.existsSync(tenantDir))
            fs.mkdirSync(tenantDir, { recursive: true });
        const ext = path.extname(file.originalname).toLowerCase();
        const randomName = `${crypto.randomUUID()}${ext}`;
        const destinationPath = path.resolve(tenantDir, randomName);
        fs.writeFileSync(destinationPath, file.buffer);
        const fileUrl = `/api/v1/inventory/purchase-documents/${tenantId}/${randomName}`;
        return {
            success: true,
            url: fileUrl,
            filename: randomName,
            tenantId,
            originalName: file.originalname,
        };
    }
    async streamPurchaseDoc(filename, user, res) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        return this.serveSafeTenantDoc(tenantId, filename, user, res);
    }
    async streamPurchaseDocWithTenant(targetTenantId, filename, user, res) {
        return this.serveSafeTenantDoc(targetTenantId, filename, user, res);
    }
    async streamLegacyPurchaseDoc(filename, user, res) {
        const tenantId = (0, tenant_util_1.requireTenantId)(user);
        return this.serveSafeTenantDoc(tenantId, filename, user, res);
    }
    serveSafeTenantDoc(targetTenantId, filename, user, res) {
        const userTenantId = (0, tenant_util_1.requireTenantId)(user);
        if (user.role !== 'platform_super_admin' && userTenantId !== targetTenantId) {
            throw new common_1.ForbiddenException('Access denied to cross-tenant documents.');
        }
        const possibleDirs = [
            path.resolve(process.cwd(), '../../purchase-documents', targetTenantId),
            path.resolve(process.cwd(), '../purchase-documents', targetTenantId),
            path.resolve(process.cwd(), 'purchase-documents', targetTenantId),
            path.resolve(process.cwd(), '../../purchase-documents'),
            path.resolve(process.cwd(), '../purchase-documents'),
            path.resolve(process.cwd(), 'purchase-documents'),
        ];
        let safePath = '';
        for (const dir of possibleDirs) {
            const candidate = path.resolve(dir, path.basename(filename));
            if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
                safePath = candidate;
                break;
            }
        }
        if (!safePath) {
            throw new common_1.NotFoundException('Requested document was not found.');
        }
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'private, no-store');
        return res.sendFile(safePath);
    }
    async getSupplierPurchases(supplierId, user) {
        return this.inventoryService.getSupplierPurchases(supplierId, user);
    }
    async recordSupplierPurchase(supplierId, body, user) {
        return this.inventoryService.recordSupplierPurchase(supplierId, body, user);
    }
    async getPurchaseBills(user, query) {
        return this.inventoryService.getPurchaseBills(user, query);
    }
    async getPurchaseBill(id, user) {
        return this.inventoryService.getPurchaseBill(id, user);
    }
    async createPurchaseBill(body, user) {
        return this.inventoryService.createPurchaseBill(body, user);
    }
    async deletePurchaseBill(id, user) {
        return this.inventoryService.deletePurchaseBill(id, user);
    }
    async scanBillOcr(body) {
        return this.inventoryService.scanBillOcr(body);
    }
    async bulkEditComponents(body, user) {
        return this.inventoryService.bulkEditComponents(body, user);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)('stock'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('warehouseId')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('lowStock')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, Number, Number]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getStockLevels", null);
__decorate([
    (0, common_1.Post)('movements'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.RecordMovementDto, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "recordMovement", null);
__decorate([
    (0, common_1.Get)('movements'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('warehouseId')),
    __param(2, (0, common_1.Query)('skuId')),
    __param(3, (0, common_1.Query)('type')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, Number, Number]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getMovements", null);
__decorate([
    (0, common_1.Get)('reorder-alerts'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getReorderAlerts", null);
__decorate([
    (0, common_1.Get)('warehouses'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getWarehouses", null);
__decorate([
    (0, common_1.Post)('warehouses'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateWarehouseDto, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createWarehouse", null);
__decorate([
    (0, common_1.Get)('skus'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getSkus", null);
__decorate([
    (0, common_1.Get)('skus/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getSku", null);
__decorate([
    (0, common_1.Post)('skus'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateSkuDto, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createSku", null);
__decorate([
    (0, common_1.Patch)('skus/:id'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_dto_1.UpdateSkuDto, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "updateSku", null);
__decorate([
    (0, common_1.Delete)('skus/:id'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "deleteSku", null);
__decorate([
    (0, common_1.Post)('skus/bulk-delete'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.BulkDeleteSkusDto, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "bulkDeleteSkus", null);
__decorate([
    (0, common_1.Post)('import-csv'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 50 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('warehouseCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "importCsv", null);
__decorate([
    (0, common_1.Post)('import-json'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.ImportInventoryDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "importJson", null);
__decorate([
    (0, common_1.Get)('template-csv'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "downloadTemplate", null);
__decorate([
    (0, common_1.Post)('transfers'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.TransferStockDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "initiateTransfer", null);
__decorate([
    (0, common_1.Get)('transfers'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('warehouseId')),
    __param(5, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getTransfers", null);
__decorate([
    (0, common_1.Get)('transfers/summary'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getTransfersSummary", null);
__decorate([
    (0, common_1.Patch)('transfers/:id/receive'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "receiveTransfer", null);
__decorate([
    (0, common_1.Patch)('transfers/:id/cancel'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "cancelTransfer", null);
__decorate([
    (0, common_1.Get)('project-stock'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('project')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('shortageOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getProjectStock", null);
__decorate([
    (0, common_1.Get)('project-stock/summary'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getProjectStockSummary", null);
__decorate([
    (0, common_1.Post)('project-stock'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateProjectStockDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createProjectStock", null);
__decorate([
    (0, common_1.Patch)('project-stock/:id'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_dto_1.UpdateProjectStockDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "updateProjectStock", null);
__decorate([
    (0, common_1.Post)('project-stock/:id/purchase'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "recordProjectStockPurchase", null);
__decorate([
    (0, common_1.Delete)('project-stock/:id'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "deleteProjectStock", null);
__decorate([
    (0, common_1.Post)('project-stock/bulk'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.BulkImportProjectStockDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "bulkImportProjectStock", null);
__decorate([
    (0, common_1.Delete)('clear-all'),
    (0, roles_decorator_1.Roles)('tenant_admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "clearAllInventory", null);
__decorate([
    (0, common_1.Get)('project-stock/template-csv'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "downloadProjectStockTemplate", null);
__decorate([
    (0, common_1.Get)('products'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getProducts", null);
__decorate([
    (0, common_1.Post)('seed-products'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "seedProducts", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getInventoryDashboard", null);
__decorate([
    (0, common_1.Post)('purchase-documents/upload'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "uploadPurchaseDocument", null);
__decorate([
    (0, common_1.Get)('purchase-documents/:filename'),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "streamPurchaseDoc", null);
__decorate([
    (0, common_1.Get)('purchase-documents/:tenantId/:filename'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('filename')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "streamPurchaseDocWithTenant", null);
__decorate([
    (0, common_1.Get)('uploads/purchase-docs/:filename'),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "streamLegacyPurchaseDoc", null);
__decorate([
    (0, common_1.Get)('suppliers/:supplierId/purchases'),
    __param(0, (0, common_1.Param)('supplierId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getSupplierPurchases", null);
__decorate([
    (0, common_1.Post)('suppliers/:supplierId/purchase'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    __param(0, (0, common_1.Param)('supplierId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_dto_1.RecordPurchaseDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "recordSupplierPurchase", null);
__decorate([
    (0, common_1.Get)('purchase-bills'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getPurchaseBills", null);
__decorate([
    (0, common_1.Get)('purchase-bills/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getPurchaseBill", null);
__decorate([
    (0, common_1.Post)('purchase-bills'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreatePurchaseBillDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createPurchaseBill", null);
__decorate([
    (0, common_1.Delete)('purchase-bills/:id'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "deletePurchaseBill", null);
__decorate([
    (0, common_1.Post)('purchase-bills/scan-ocr'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.ScanBillOcrDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "scanBillOcr", null);
__decorate([
    (0, common_1.Post)('bulk-edit'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.BulkEditComponentsDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "bulkEditComponents", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)('inventory'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, page_access_decorator_1.PageAccess)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
