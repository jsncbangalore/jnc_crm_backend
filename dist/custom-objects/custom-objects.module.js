"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomObjectsModule = void 0;
const common_1 = require("@nestjs/common");
const custom_objects_service_1 = require("./custom-objects.service");
const custom_objects_controller_1 = require("./custom-objects.controller");
let CustomObjectsModule = class CustomObjectsModule {
};
exports.CustomObjectsModule = CustomObjectsModule;
exports.CustomObjectsModule = CustomObjectsModule = __decorate([
    (0, common_1.Module)({
        controllers: [custom_objects_controller_1.CustomObjectsController],
        providers: [custom_objects_service_1.CustomObjectsService],
        exports: [custom_objects_service_1.CustomObjectsService],
    })
], CustomObjectsModule);
