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
        if (user.role === "super_admin" || user.role === "admin") {
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
    getResponsesTable(id, orgId, req) {
        this.assertOrgScope(orgId, req.user);
        return this.disposableService.getResponsesTable(id, orgId);
    }
    updateFields(id, body, req) {
        this.assertOrgScope(body.orgId, req.user);
        return this.disposableService.updateCollectedFields(id, body.orgId, body.fields);
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
    (0, swagger_1.ApiOperation)({
        summary: "List disposable attendance forms by organization",
        description: "Retrieve all custom attendance forms (disposable attendance) created for the organization"
    }),
    (0, swagger_1.ApiQuery)({
        name: "orgId",
        type: String,
        required: true,
        description: "Organization ID",
        example: "org_123abc"
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Disposable attendance list returned",
        schema: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "string", example: "form_123" },
                    organizationId: { type: "string", example: "org_123abc" },
                    title: { type: "string", example: "Team Outing" },
                    description: { type: "string", nullable: true },
                    location: { type: "string", nullable: true },
                    eventDateISO: { type: "string", format: "date" },
                    fields: { type: "array", items: { type: "object" } },
                    isRecurring: { type: "boolean" },
                    recurrenceMode: { type: "string", enum: ["none", "daily", "weekly", "monthly", "custom"] },
                    allowPreRegister: { type: "boolean" },
                    isArchived: { type: "boolean" },
                    publicId: { type: "string", nullable: true },
                    responseCount: { type: "number" }
                }
            }
        }
    }),
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
    (0, swagger_1.ApiOperation)({
        summary: "Create disposable attendance",
        description: "Create a new custom attendance form for collecting staff attendance in special events or situations"
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            required: ["orgId", "title", "eventDateISO", "fields", "isRecurring", "recurrenceMode"],
            properties: {
                orgId: {
                    type: "string",
                    description: "Organization ID",
                    example: "org_123abc"
                },
                title: {
                    type: "string",
                    description: "Title of the attendance form",
                    example: "Team Outing"
                },
                description: {
                    type: "string",
                    nullable: true,
                    description: "Detailed description of the event",
                    example: "Annual team building event"
                },
                location: {
                    type: "string",
                    nullable: true,
                    description: "Location of the event",
                    example: "Conference Hall A"
                },
                eventDateISO: {
                    type: "string",
                    format: "date",
                    description: "Event date in ISO format",
                    example: "2026-04-10"
                },
                fields: {
                    type: "array",
                    description: "Custom fields to collect from respondents",
                    items: {
                        type: "object",
                        required: ["id", "label", "type", "required"],
                        properties: {
                            id: { type: "string", example: "field_1" },
                            label: { type: "string", example: "Full Name" },
                            type: {
                                type: "string",
                                enum: ["full-name", "email", "phone", "occupation", "address", "text"],
                                example: "full-name"
                            },
                            required: { type: "boolean", example: true }
                        }
                    }
                },
                isRecurring: {
                    type: "boolean",
                    description: "Whether this form recurs",
                    example: false
                },
                recurrenceMode: {
                    type: "string",
                    enum: ["none", "daily", "weekly", "monthly", "custom"],
                    description: "Recurrence pattern if isRecurring is true",
                    example: "none"
                },
                recurrenceEndDateISO: {
                    type: "string",
                    format: "date",
                    nullable: true,
                    description: "End date for recurring forms"
                },
                recurrenceCustomRule: {
                    type: "string",
                    nullable: true,
                    description: "Custom RRULE for recurrence"
                },
                allowPreRegister: {
                    type: "boolean",
                    description: "Allow participants to pre-register before event day and check in on event day",
                    example: false
                }
            }
        }
    }),
    (0, swagger_1.ApiCreatedResponse)({
        description: "Disposable attendance created",
        schema: {
            type: "object",
            properties: {
                id: { type: "string" },
                organizationId: { type: "string" },
                title: { type: "string" },
                eventDateISO: { type: "string", format: "date" },
                publicId: { type: "string" }
            }
        }
    }),
    (0, swagger_1.ApiForbiddenResponse)({ description: "Authentication/authorization failed" }),
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
    (0, swagger_1.ApiOperation)({
        summary: "Update disposable attendance",
        description: "Modify an existing custom attendance form"
    }),
    (0, swagger_1.ApiParam)({
        name: "id",
        type: String,
        description: "Form ID",
        example: "form_123"
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            required: ["orgId"],
            properties: {
                orgId: { type: "string" },
                title: { type: "string" },
                description: { type: "string", nullable: true },
                location: { type: "string", nullable: true },
                eventDateISO: { type: "string", format: "date" },
                fields: { type: "array", items: { type: "object" } },
                isRecurring: { type: "boolean" },
                recurrenceMode: { type: "string", enum: ["none", "daily", "weekly", "monthly", "custom"] },
                recurrenceEndDateISO: { type: "string", format: "date", nullable: true },
                recurrenceCustomRule: { type: "string", nullable: true },
                allowPreRegister: { type: "boolean" },
                isArchived: { type: "boolean" }
            }
        }
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Disposable attendance updated"
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: "Form not found" }),
    (0, swagger_1.ApiForbiddenResponse)({ description: "Authentication/authorization failed" }),
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
    (0, swagger_1.ApiOperation)({
        summary: "Delete disposable attendance",
        description: "Remove a custom attendance form from the organization"
    }),
    (0, swagger_1.ApiParam)({
        name: "id",
        type: String,
        description: "Form ID",
        example: "form_123"
    }),
    (0, swagger_1.ApiQuery)({
        name: "orgId",
        type: String,
        required: true,
        description: "Organization ID",
        example: "org_123abc"
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Disposable attendance deleted"
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: "Form not found" }),
    (0, swagger_1.ApiForbiddenResponse)({ description: "Authentication/authorization failed" }),
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
    (0, swagger_1.ApiOperation)({
        summary: "List disposable attendance responses (legacy)",
        description: "Deprecated: use GET /disposable-attendance/:id/responses-table for UI table rendering.",
        deprecated: true
    }),
    (0, swagger_1.ApiParam)({
        name: "id",
        type: String,
        description: "Form ID",
        example: "form_123"
    }),
    (0, swagger_1.ApiQuery)({
        name: "orgId",
        type: String,
        required: true,
        description: "Organization ID",
        example: "org_123abc"
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Disposable attendance responses returned"
    }),
    (0, swagger_1.ApiForbiddenResponse)({ description: "Authentication/authorization failed" }),
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
    (0, common_1.Get)("disposable-attendance/:id/responses-table"),
    (0, swagger_1.ApiCookieAuth)("cookieAuth"),
    (0, swagger_1.ApiOperation)({
        summary: "Get disposable attendance responses formatted for table rendering",
        description: "Retrieve responses in a formatted structure optimized for UI table display"
    }),
    (0, swagger_1.ApiParam)({
        name: "id",
        type: String,
        description: "Form ID",
        example: "form_123"
    }),
    (0, swagger_1.ApiQuery)({
        name: "orgId",
        type: String,
        required: true,
        description: "Organization ID",
        example: "org_123abc"
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Formatted disposable attendance response table returned"
    }),
    (0, swagger_1.ApiForbiddenResponse)({ description: "Authentication/authorization failed" }),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("manage_attendance"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("orgId")),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], DisposableAttendanceController.prototype, "getResponsesTable", null);
__decorate([
    (0, common_1.Patch)("disposable-attendance/:id/fields"),
    (0, swagger_1.ApiCookieAuth)("cookieAuth"),
    (0, swagger_1.ApiOperation)({
        summary: "Update collected details (fields) for a disposable attendance",
        description: "Modify the custom fields that respondents need to fill"
    }),
    (0, swagger_1.ApiParam)({
        name: "id",
        type: String,
        description: "Form ID",
        example: "form_123"
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            required: ["orgId", "fields"],
            properties: {
                orgId: { type: "string" },
                fields: {
                    type: "array",
                    items: {
                        type: "object",
                        required: ["id", "label", "type", "required"],
                        properties: {
                            id: { type: "string" },
                            label: { type: "string" },
                            type: {
                                type: "string",
                                enum: ["full-name", "email", "phone", "occupation", "address", "text"]
                            },
                            required: { type: "boolean" }
                        }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiOkResponse)({ description: "Collected details updated" }),
    (0, swagger_1.ApiForbiddenResponse)({ description: "Authentication/authorization failed" }),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("manage_attendance"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], DisposableAttendanceController.prototype, "updateFields", null);
__decorate([
    (0, common_1.Post)("disposable-attendance/:id/responses/admin"),
    (0, swagger_1.ApiCookieAuth)("cookieAuth"),
    (0, swagger_1.ApiOperation)({
        summary: "Submit admin/manual disposable attendance response",
        description: "Create a response entry for a form as an administrator (manual entry)"
    }),
    (0, swagger_1.ApiParam)({
        name: "id",
        type: String,
        description: "Form ID",
        example: "form_123"
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            required: ["orgId", "values"],
            properties: {
                orgId: { type: "string" },
                values: {
                    type: "object",
                    additionalProperties: { type: "string" },
                    description: "Field values submitted in the form"
                }
            }
        }
    }),
    (0, swagger_1.ApiCreatedResponse)({
        description: "Admin response submitted"
    }),
    (0, swagger_1.ApiForbiddenResponse)({ description: "Authentication/authorization failed" }),
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
    (0, swagger_1.ApiOperation)({
        summary: "Export disposable attendance responses as CSV",
        description: "Download all responses for a form as a CSV file"
    }),
    (0, swagger_1.ApiParam)({
        name: "id",
        type: String,
        description: "Form ID",
        example: "form_123"
    }),
    (0, swagger_1.ApiQuery)({
        name: "orgId",
        type: String,
        required: true,
        description: "Organization ID",
        example: "org_123abc"
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "CSV export returned - binary file content"
    }),
    (0, swagger_1.ApiForbiddenResponse)({ description: "Authentication/authorization failed" }),
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
    (0, swagger_1.ApiOperation)({
        summary: "Get public disposable attendance form",
        description: "Retrieve a publicly accessible attendance form using its public ID (no authentication required)"
    }),
    (0, swagger_1.ApiParam)({
        name: "publicId",
        type: String,
        description: "Public form ID",
        example: "pub_12345"
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Public disposable attendance form returned",
        schema: {
            type: "object",
            properties: {
                id: { type: "string" },
                title: { type: "string" },
                description: { type: "string", nullable: true },
                location: { type: "string", nullable: true },
                eventDateISO: { type: "string", format: "date" },
                allowPreRegister: { type: "boolean" },
                fields: { type: "array", items: { type: "object" } }
            }
        }
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: "Form not found or link expired" }),
    __param(0, (0, common_1.Param)("publicId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DisposableAttendanceController.prototype, "getPublicForm", null);
__decorate([
    (0, common_1.Post)("public/disposable-attendance/:publicId/check-in"),
    (0, swagger_1.ApiOperation)({
        summary: "Submit public disposable attendance check-in",
        description: "Submit a response to a publicly accessible attendance form (no authentication required)"
    }),
    (0, swagger_1.ApiParam)({
        name: "publicId",
        type: String,
        description: "Public form ID",
        example: "pub_12345"
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            required: ["values"],
            properties: {
                values: {
                    type: "object",
                    additionalProperties: { type: "string" },
                    description: "Form field values submitted by the respondent"
                }
            }
        }
    }),
    (0, swagger_1.ApiCreatedResponse)({
        description: "Public check-in submitted",
        schema: {
            type: "object",
            properties: {
                message: { type: "string", example: "Check-in submitted successfully." },
                action: {
                    type: "string",
                    enum: ["pre-registered", "already-preregistered", "checked-in"],
                    example: "checked-in"
                },
                status: {
                    type: "string",
                    enum: ["preregistered", "checked-in"],
                    example: "checked-in"
                }
            }
        }
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: "Form not found or link expired" }),
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