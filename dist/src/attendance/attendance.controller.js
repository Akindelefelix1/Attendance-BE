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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const attendance_service_1 = require("./attendance.service");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
const attendance_dto_1 = require("./dto/attendance.dto");
let AttendanceController = class AttendanceController {
    attendanceService;
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
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
    list(query, req) {
        const { orgId, dateISO } = query;
        this.assertOrgScope(orgId, req.user);
        return this.attendanceService.listByOrganizationAndDate(orgId, dateISO);
    }
    listForOrganization(orgId, req) {
        this.assertOrgScope(orgId, req.user);
        return this.attendanceService.listByOrganization(orgId);
    }
    signIn(body, req) {
        if (req.user?.role === "staff" && req.user.id !== body.staffId) {
            return null;
        }
        this.assertOrgScope(body.organizationId, req.user);
        return this.attendanceService.signIn(body.organizationId, body.staffId, body.dateISO, req.user?.role, body.latitude, body.longitude);
    }
    signOut(body, req) {
        if (req.user?.role === "staff" && req.user.id !== body.staffId) {
            return null;
        }
        this.assertOrgScope(body.organizationId, req.user);
        return this.attendanceService.signOut(body.organizationId, body.staffId, body.dateISO, req.user?.role, body.latitude, body.longitude);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: "List attendance by organization and date",
        description: "Retrieve attendance records for a specific organization on a specific date"
    }),
    (0, swagger_1.ApiQuery)({ name: "orgId", type: String, required: true, description: "Organization ID", example: "org_123abc" }),
    (0, swagger_1.ApiQuery)({ name: "dateISO", type: String, required: true, description: "Date in ISO format (YYYY-MM-DD)", example: "2026-03-31" }),
    (0, swagger_1.ApiOkResponse)({
        description: "Attendance records returned",
        schema: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "string", example: "att_123" },
                    staffId: { type: "string", example: "staff_123" },
                    organizationId: { type: "string", example: "org_123abc" },
                    dateISO: { type: "string", format: "date", example: "2026-03-31" },
                    signInTime: { type: "string", format: "date-time", nullable: true },
                    signOutTime: { type: "string", format: "date-time", nullable: true },
                    isLate: { type: "boolean", example: false },
                    isEarlyCheckout: { type: "boolean", example: false },
                    status: { type: "string", enum: ["present", "absent", "leave"] }
                }
            }
        }
    }),
    (0, swagger_1.ApiForbiddenResponse)({ description: "Authentication/authorization failed" }),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("manage_attendance"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_dto_1.AttendanceListQueryDto, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "list", null);
__decorate([
    (0, common_1.Get)("organization/:orgId"),
    (0, swagger_1.ApiOperation)({
        summary: "List attendance for organization",
        description: "Retrieve all attendance records for an organization (across all dates)"
    }),
    (0, swagger_1.ApiParam)({ name: "orgId", type: String, description: "Organization ID", example: "org_123abc" }),
    (0, swagger_1.ApiOkResponse)({
        description: "Attendance records returned",
        schema: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    staffId: { type: "string" },
                    organizationId: { type: "string" },
                    dateISO: { type: "string", format: "date" },
                    signInTime: { type: "string", format: "date-time", nullable: true },
                    signOutTime: { type: "string", format: "date-time", nullable: true }
                }
            }
        }
    }),
    (0, swagger_1.ApiForbiddenResponse)({ description: "Authentication/authorization failed" }),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("manage_attendance"),
    __param(0, (0, common_1.Param)("orgId")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "listForOrganization", null);
__decorate([
    (0, common_1.Post)("sign-in"),
    (0, swagger_1.ApiOperation)({
        summary: "Sign in staff attendance",
        description: "Record a staff member's sign-in (arrival). Can include GPS location for geofence validation."
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            required: ["organizationId", "staffId", "dateISO"],
            properties: {
                organizationId: {
                    type: "string",
                    description: "Organization ID",
                    example: "org_123abc"
                },
                staffId: {
                    type: "string",
                    description: "Staff member ID",
                    example: "staff_123"
                },
                dateISO: {
                    type: "string",
                    format: "date",
                    description: "Attendance date in ISO format",
                    example: "2026-03-31"
                },
                latitude: {
                    type: "number",
                    nullable: true,
                    description: "GPS latitude for geofence validation",
                    example: 40.7128
                },
                longitude: {
                    type: "number",
                    nullable: true,
                    description: "GPS longitude for geofence validation",
                    example: -74.006
                }
            }
        }
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Sign-in recorded",
        schema: {
            type: "object",
            properties: {
                id: { type: "string" },
                staffId: { type: "string" },
                signInTime: { type: "string", format: "date-time" },
                isLate: { type: "boolean" },
                isOutsideGeofence: { type: "boolean" }
            }
        }
    }),
    (0, swagger_1.ApiForbiddenResponse)({ description: "Authentication/authorization failed" }),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("manage_attendance"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_dto_1.AttendanceMarkDto, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "signIn", null);
__decorate([
    (0, common_1.Post)("sign-out"),
    (0, swagger_1.ApiOperation)({
        summary: "Sign out staff attendance",
        description: "Record a staff member's sign-out (departure). Can include GPS location for geofence validation."
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            required: ["organizationId", "staffId", "dateISO"],
            properties: {
                organizationId: {
                    type: "string",
                    description: "Organization ID",
                    example: "org_123abc"
                },
                staffId: {
                    type: "string",
                    description: "Staff member ID",
                    example: "staff_123"
                },
                dateISO: {
                    type: "string",
                    format: "date",
                    description: "Attendance date in ISO format",
                    example: "2026-03-31"
                },
                latitude: {
                    type: "number",
                    nullable: true,
                    description: "GPS latitude for geofence validation",
                    example: 40.7128
                },
                longitude: {
                    type: "number",
                    nullable: true,
                    description: "GPS longitude for geofence validation",
                    example: -74.006
                }
            }
        }
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Sign-out recorded",
        schema: {
            type: "object",
            properties: {
                id: { type: "string" },
                staffId: { type: "string" },
                signOutTime: { type: "string", format: "date-time" },
                isEarlyCheckout: { type: "boolean" },
                isOutsideGeofence: { type: "boolean" }
            }
        }
    }),
    (0, swagger_1.ApiForbiddenResponse)({ description: "Authentication/authorization failed" }),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("manage_attendance"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_dto_1.AttendanceMarkDto, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "signOut", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, swagger_1.ApiTags)("Attendance"),
    (0, swagger_1.ApiCookieAuth)("cookieAuth"),
    (0, common_1.Controller)("attendance"),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map