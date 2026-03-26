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
exports.DisposableAttendanceController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
const disposable_attendance_service_1 = require("./disposable-attendance.service");
let DisposableAttendanceController = class DisposableAttendanceController {
    disposableService;
    constructor(disposableService) {
        this.disposableService = disposableService;
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
    list(orgId, req) {
        this.assertOrgScope(orgId, req.user);
        return this.disposableService.listByOrg(orgId);
    }
    create(body, req) {
        this.assertOrgScope(body.orgId, req.user);
        return this.disposableService.create(body);
    }
    update(id, body, req) {
        this.assertOrgScope(body.orgId, req.user);
        return this.disposableService.update(id, body.orgId, body);
    }
    remove(id, orgId, req) {
        this.assertOrgScope(orgId, req.user);
        return this.disposableService.remove(id, orgId);
    }
    listResponses(id, orgId, req) {
        this.assertOrgScope(orgId, req.user);
        return this.disposableService.listResponses(id, orgId);
    }
    submitAdminResponse(id, body, req) {
        this.assertOrgScope(body.orgId, req.user);
        return this.disposableService.submitAdminResponse(id, body.orgId, body.values, req.user?.id ?? "");
    }
    async exportCsv(id, orgId, req, res) {
        this.assertOrgScope(orgId, req.user);
        const exported = await this.disposableService.exportCsv(id, orgId);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${exported.filename}"`);
        return exported.content;
    }
    getPublicForm(publicId) {
        return this.disposableService.getPublicForm(publicId);
    }
    submitPublicResponse(publicId, body) {
        return this.disposableService.submitPublicResponse(publicId, body.values);
    }
};
exports.DisposableAttendanceController = DisposableAttendanceController;
__decorate([
    (0, common_1.Get)("disposable-attendance"),
    (0, swagger_1.ApiCookieAuth)("cookieAuth"),
    (0, swagger_1.ApiOperation)({ summary: "List disposable attendance forms by organization" }),
    (0, swagger_1.ApiQuery)({ name: "orgId", type: String, required: true }),
    (0, swagger_1.ApiOkResponse)({ description: "Disposable attendance list returned" }),
    (0, swagger_1.ApiForbiddenResponse)({ description: "Authentication/authorization failed" }),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("manage_attendance"),
    __param(0, (0, common_1.Query)("orgId")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DisposableAttendanceController.prototype, "list", null);
__decorate([
    (0, common_1.Post)("disposable-attendance"),
    (0, swagger_1.ApiCookieAuth)("cookieAuth"),
    (0, swagger_1.ApiOperation)({ summary: "Create disposable attendance" }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            required: ["orgId", "title", "eventDateISO", "fields", "isRecurring", "recurrenceMode"],
            properties: {
                orgId: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                location: { type: "string" },
                eventDateISO: { type: "string", example: "2026-04-10" },
                fields: { type: "array", items: { type: "object" } },
                isRecurring: { type: "boolean" },
                recurrenceMode: { type: "string", enum: ["none", "daily", "weekly", "monthly", "custom"] },
                recurrenceEndDateISO: { type: "string", nullable: true },
                recurrenceCustomRule: { type: "string" }
            }
        }
    }),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("manage_attendance"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], DisposableAttendanceController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)("disposable-attendance/:id"),
    (0, swagger_1.ApiCookieAuth)("cookieAuth"),
    (0, swagger_1.ApiOperation)({ summary: "Update disposable attendance" }),
    (0, swagger_1.ApiParam)({ name: "id", type: String }),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("manage_attendance"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], DisposableAttendanceController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)("disposable-attendance/:id"),
    (0, swagger_1.ApiCookieAuth)("cookieAuth"),
    (0, swagger_1.ApiOperation)({ summary: "Delete disposable attendance" }),
    (0, swagger_1.ApiParam)({ name: "id", type: String }),
    (0, swagger_1.ApiQuery)({ name: "orgId", type: String, required: true }),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("manage_attendance"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("orgId")),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], DisposableAttendanceController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)("disposable-attendance/:id/responses"),
    (0, swagger_1.ApiCookieAuth)("cookieAuth"),
    (0, swagger_1.ApiOperation)({ summary: "List disposable attendance responses" }),
    (0, swagger_1.ApiParam)({ name: "id", type: String }),
    (0, swagger_1.ApiQuery)({ name: "orgId", type: String, required: true }),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("manage_attendance"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("orgId")),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], DisposableAttendanceController.prototype, "listResponses", null);
__decorate([
    (0, common_1.Post)("disposable-attendance/:id/responses/admin"),
    (0, swagger_1.ApiCookieAuth)("cookieAuth"),
    (0, swagger_1.ApiOperation)({ summary: "Submit admin/manual disposable attendance response" }),
    (0, swagger_1.ApiParam)({ name: "id", type: String }),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("manage_attendance"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], DisposableAttendanceController.prototype, "submitAdminResponse", null);
__decorate([
    (0, common_1.Get)("disposable-attendance/:id/export.csv"),
    (0, swagger_1.ApiCookieAuth)("cookieAuth"),
    (0, swagger_1.ApiOperation)({ summary: "Export disposable attendance responses as CSV" }),
    (0, swagger_1.ApiParam)({ name: "id", type: String }),
    (0, swagger_1.ApiQuery)({ name: "orgId", type: String, required: true }),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("manage_attendance"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("orgId")),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], DisposableAttendanceController.prototype, "exportCsv", null);
__decorate([
    (0, common_1.Get)("public/disposable-attendance/:publicId"),
    (0, swagger_1.ApiOperation)({ summary: "Get public disposable attendance form" }),
    (0, swagger_1.ApiParam)({ name: "publicId", type: String }),
    (0, swagger_1.ApiOkResponse)({ description: "Public disposable attendance form returned" }),
    __param(0, (0, common_1.Param)("publicId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DisposableAttendanceController.prototype, "getPublicForm", null);
__decorate([
    (0, common_1.Post)("public/disposable-attendance/:publicId/check-in"),
    (0, swagger_1.ApiOperation)({ summary: "Submit public disposable attendance check-in" }),
    (0, swagger_1.ApiParam)({ name: "publicId", type: String }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            required: ["values"],
            properties: {
                values: { type: "object", additionalProperties: { type: "string" } }
            }
        }
    }),
    __param(0, (0, common_1.Param)("publicId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DisposableAttendanceController.prototype, "submitPublicResponse", null);
exports.DisposableAttendanceController = DisposableAttendanceController = __decorate([
    (0, swagger_1.ApiTags)("Disposable Attendance"),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [disposable_attendance_service_1.DisposableAttendanceService])
], DisposableAttendanceController);
//# sourceMappingURL=disposable-attendance.controller.js.map