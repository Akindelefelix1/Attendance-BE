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
exports.PublicHolidaysController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
const public_holidays_service_1 = require("./public-holidays.service");
let PublicHolidaysController = class PublicHolidaysController {
    publicHolidaysService;
    constructor(publicHolidaysService) {
        this.publicHolidaysService = publicHolidaysService;
    }
    assertOrgScope(requestOrgId, user) {
        if (!user) {
            throw new common_1.ForbiddenException("Authentication required");
        }
        if (user.role === "super_admin") {
            return;
        }
        if (!user.orgId || user.orgId !== requestOrgId) {
            throw new common_1.ForbiddenException("Access denied for this organization");
        }
    }
    async findAll(orgId, req) {
        this.assertOrgScope(orgId, req.user);
        return this.publicHolidaysService.findAll(orgId);
    }
    async create(orgId, body, req) {
        this.assertOrgScope(orgId, req.user);
        if (!body.name || !body.dateISO) {
            throw new common_1.BadRequestException("Name and date are required");
        }
        return this.publicHolidaysService.create(orgId, {
            name: body.name,
            dateISO: body.dateISO,
            isRecurring: body.isRecurring ?? false,
            recurrencePattern: body.recurrencePattern,
            description: body.description,
            affectsAllStaff: body.affectsAllStaff ?? true
        });
    }
    async update(orgId, id, body, req) {
        this.assertOrgScope(orgId, req.user);
        const holiday = await this.publicHolidaysService.findOne(orgId, id);
        if (!holiday) {
            throw new common_1.NotFoundException("Holiday not found");
        }
        return this.publicHolidaysService.update(orgId, id, body);
    }
    async delete(orgId, id, req) {
        this.assertOrgScope(orgId, req.user);
        const holiday = await this.publicHolidaysService.findOne(orgId, id);
        if (!holiday) {
            throw new common_1.NotFoundException("Holiday not found");
        }
        return this.publicHolidaysService.delete(orgId, id);
    }
};
exports.PublicHolidaysController = PublicHolidaysController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __param(0, (0, common_1.Param)("orgId")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PublicHolidaysController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("manage_settings"),
    __param(0, (0, common_1.Param)("orgId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PublicHolidaysController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("manage_settings"),
    __param(0, (0, common_1.Param)("orgId")),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], PublicHolidaysController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("manage_settings"),
    __param(0, (0, common_1.Param)("orgId")),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PublicHolidaysController.prototype, "delete", null);
exports.PublicHolidaysController = PublicHolidaysController = __decorate([
    (0, common_1.Controller)("organizations/:orgId/public-holidays"),
    __metadata("design:paramtypes", [public_holidays_service_1.PublicHolidaysService])
], PublicHolidaysController);
//# sourceMappingURL=public-holidays.controller.js.map