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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const page_access_decorator_1 = require("../auth/page-access.decorator");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const orders_service_1 = require("./orders.service");
let OrdersController = class OrdersController {
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    create(dto, user) {
        return this.ordersService.createOrder(dto, user);
    }
    findAll(user, status, search, page, limit) {
        return this.ordersService.findAll(user, { status, search, page, limit });
    }
    findOne(id, user) {
        return this.ordersService.findOne(id, user);
    }
    updateOrder(id, dto, user) {
        return this.ordersService.updateOrder(id, dto, user);
    }
    recordPayment(id, body, user) {
        return this.ordersService.recordPayment(id, body, user);
    }
    updateStatus(id, dto, user) {
        return this.ordersService.updateStatus(id, dto, user);
    }
    listShipments(user, status, search, page, limit) {
        return this.ordersService.listShipments(user, { status, search, page, limit });
    }
    createShipment(dto, user) {
        return this.ordersService.createShipment(dto, user);
    }
    updateShipmentStatus(id, body, user) {
        return this.ordersService.updateShipmentStatus(id, body.status, user);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin', 'employee'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [orders_service_1.CreateOrderDto, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Number, Number]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin', 'employee'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, orders_service_1.UpdateOrderDto, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateOrder", null);
__decorate([
    (0, common_1.Post)(':id/payments'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin', 'employee'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, orders_service_1.RecordOrderPaymentDto, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "recordPayment", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin', 'employee'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, orders_service_1.UpdateOrderStatusDto, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)('shipments/list'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin', 'employee'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Number, Number]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "listShipments", null);
__decorate([
    (0, common_1.Post)('shipments'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [orders_service_1.CreateShipmentDto, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "createShipment", null);
__decorate([
    (0, common_1.Patch)('shipments/:id/status'),
    (0, roles_decorator_1.Roles)('tenant_admin', 'admin', 'sub_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, orders_service_1.UpdateShipmentStatusDto, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateShipmentStatus", null);
exports.OrdersController = OrdersController = __decorate([
    (0, common_1.Controller)('orders'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, page_access_decorator_1.PageAccess)('orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
