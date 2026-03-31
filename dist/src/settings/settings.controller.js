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
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const settings_service_1 = require("./settings.service");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
let SettingsController = class SettingsController {
    settingsService;
    constructor(settingsService) {
        this.settingsService = settingsService;
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
    getSettings(orgId, req) {
        this.assertOrgScope(orgId, req.user);
        return this.settingsService.getSettings(orgId);
    }
    updateSettings(orgId, req, body) {
        this.assertOrgScope(orgId, req.user);
        return this.settingsService.updateSettings(orgId, body);
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)(":orgId"),
    (0, swagger_1.ApiOperation)({
        summary: "Get organization settings",
        description: "Retrieve all configuration settings for an organization including working hours, policies, and plan information"
    }),
    (0, swagger_1.ApiParam)({
        name: "orgId",
        type: String,
        description: "Organization ID",
        example: "org_123abc"
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Settings returned",
        schema: {
            type: "object",
            properties: {
                organizationId: { type: "string", example: "org_123abc" },
                lateAfterTime: { type: "string", example: "09:00" },
                earlyCheckoutBeforeTime: { type: "string", example: "17:00" },
                officeGeoFenceEnabled: { type: "boolean", example: false },
                officeLatitude: { type: "number", nullable: true, example: 40.7128 },
                officeLongitude: { type: "number", nullable: true, example: -74.006 },
                officeRadiusMeters: { type: "number", example: 150 },
                roles: { type: "array", items: { type: "string" }, example: ["manager", "staff"] },
                workingDays: {
                    type: "array",
                    items: { type: "number" },
                    description: "0=Sunday, 1=Monday, 2=Tuesday, etc.",
                    example: [1, 2, 3, 4, 5]
                },
                analyticsIncludeFutureDays: { type: "boolean", example: false },
                attendanceEditPolicy: { type: "string", enum: ["any", "self_only"], example: "any" },
                adminEmails: { type: "array", items: { type: "string", format: "email" } },
                planTier: { type: "string", enum: ["free", "plus", "pro"], example: "free" }
            }
        }
    }),
    (0, swagger_1.ApiForbiddenResponse)({ description: "Authentication/authorization failed" }),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("manage_settings"),
    __param(0, (0, common_1.Param)("orgId")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Patch)(":orgId"),
    (0, swagger_1.ApiOperation)({
        summary: "Update organization settings",
        description: "Modify organization configuration. When staffLoginPassword is provided, all staff will be required to reset their passwords via email links."
    }),
    (0, swagger_1.ApiParam)({
        name: "orgId",
        type: String,
        description: "Organization ID",
        example: "org_123abc"
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            properties: {
                lateAfterTime: {
                    type: "string",
                    description: "Time after which staff are marked as late (HH:MM format)",
                    example: "09:00"
                },
                earlyCheckoutBeforeTime: {
                    type: "string",
                    description: "Time before which staff are marked as early checkout (HH:MM format)",
                    example: "17:00"
                },
                officeGeoFenceEnabled: {
                    type: "boolean",
                    description: "Enable geographic fence validation for attendance",
                    example: false
                },
                officeLatitude: {
                    type: "number",
                    nullable: true,
                    description: "Latitude of office location for geofence",
                    example: 40.7128
                },
                officeLongitude: {
                    type: "number",
                    nullable: true,
                    description: "Longitude of office location for geofence",
                    example: -74.006
                },
                officeRadiusMeters: {
                    type: "number",
                    description: "Radius in meters for geofence validation",
                    example: 150
                },
                roles: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of available staff roles in the organization",
                    example: ["manager", "staff", "supervisor"]
                },
                workingDays: {
                    type: "array",
                    items: { type: "number" },
                    description: "Days of week when office operates (0=Sunday, 1=Monday, etc.)",
                    example: [1, 2, 3, 4, 5]
                },
                analyticsIncludeFutureDays: {
                    type: "boolean",
                    description: "Include future days in analytics calculations",
                    example: false
                },
                attendanceEditPolicy: {
                    type: "string",
                    enum: ["any", "self_only"],
                    description: "Whether staff can edit only their own attendance or any attendance",
                    example: "any"
                },
                adminEmails: {
                    type: "array",
                    items: { type: "string", format: "email" },
                    description: "Email addresses of organization administrators",
                    example: ["admin@org.com", "support@org.com"]
                },
                planTier: {
                    type: "string",
                    enum: ["free", "plus", "pro"],
                    description: "Organization subscription plan tier",
                    example: "free"
                },
                staffLoginPassword: {
                    type: "string",
                    description: "Set a new password requirement for all staff. When provided, staff will receive reset links via email.",
                    example: "new-password-requirement"
                }
            }
        }
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Settings updated",
        schema: {
            type: "object",
            properties: {
                message: { type: "string", example: "Settings updated successfully" },
                updated: { type: "object" }
            }
        }
    }),
    (0, swagger_1.ApiForbiddenResponse)({ description: "Authentication/authorization failed" }),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("manage_settings"),
    __param(0, (0, common_1.Param)("orgId")),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "updateSettings", null);
exports.SettingsController = SettingsController = __decorate([
    (0, swagger_1.ApiTags)("Settings"),
    (0, swagger_1.ApiCookieAuth)("cookieAuth"),
    (0, common_1.Controller)("settings"),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map