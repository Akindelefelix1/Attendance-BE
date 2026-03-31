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
const swagger_1 = require("@nestjs/swagger");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
const public_holidays_service_1 = require("./public-holidays.service");
let PublicHolidaysController = class PublicHolidaysController {
    publicHolidaysService;
    constructor(publicHolidaysService) {
        this.publicHolidaysService = publicHolidaysService;
    }
    normalizeDateISO(input) {
        const raw = (input ?? "").trim();
        if (!raw) {
            throw new common_1.BadRequestException("Date is required");
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
            return raw;
        }
        const slashParts = raw.split("/");
        if (slashParts.length === 3) {
            const [first, second, yearRaw] = slashParts;
            const year = Number(yearRaw);
            const a = Number(first);
            const b = Number(second);
            if (Number.isInteger(year) &&
                Number.isInteger(a) &&
                Number.isInteger(b) &&
                year >= 1900 &&
                year <= 9999 &&
                a >= 1 &&
                a <= 31 &&
                b >= 1 &&
                b <= 31) {
                const day = String(a).padStart(2, "0");
                const month = String(b).padStart(2, "0");
                return `${year}-${month}-${day}`;
            }
        }
        throw new common_1.BadRequestException("Invalid date format. Use YYYY-MM-DD.");
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
        const resolvedName = (body.name ?? body.holidayName ?? "").trim();
        const resolvedDateISO = body.dateISO ?? body.date;
        if (!resolvedName || !resolvedDateISO) {
            throw new common_1.BadRequestException("Name and date are required");
        }
        const normalizedDateISO = this.normalizeDateISO(resolvedDateISO);
        return this.publicHolidaysService.create(orgId, {
            name: resolvedName,
            dateISO: normalizedDateISO,
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
        const normalizedPayload = {
            ...body,
            ...(body.dateISO ? { dateISO: this.normalizeDateISO(body.dateISO) } : {})
        };
        return this.publicHolidaysService.update(orgId, id, normalizedPayload);
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
    (0, swagger_1.ApiOperation)({
        summary: "List all public holidays for an organization",
        description: "Retrieve all public holidays configured for the specified organization"
    }),
    (0, swagger_1.ApiParam)({
        name: "orgId",
        type: String,
        description: "The organization ID",
        example: "org_123abc"
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Public holidays list retrieved successfully",
        schema: {
            type: "object",
            properties: {
                id: { type: "string", example: "holiday_123" },
                organizationId: { type: "string", example: "org_123abc" },
                name: { type: "string", example: "New Year" },
                dateISO: { type: "string", format: "date", example: "2026-01-01" },
                isRecurring: { type: "boolean", example: false },
                recurrencePattern: { type: "string", nullable: true },
                description: { type: "string", nullable: true },
                affectsAllStaff: { type: "boolean", example: true }
            }
        }
    }),
    (0, swagger_1.ApiForbiddenResponse)({ description: "Authorization failed - user cannot access this organization" }),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __param(0, (0, common_1.Param)("orgId")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PublicHolidaysController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: "Create a new public holiday",
        description: "Create a new public holiday for the organization. Can be one-time or recurring."
    }),
    (0, swagger_1.ApiParam)({
        name: "orgId",
        type: String,
        description: "The organization ID",
        example: "org_123abc"
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            required: ["name", "dateISO"],
            properties: {
                name: {
                    type: "string",
                    description: "Name of the public holiday",
                    example: "New Year's Day"
                },
                dateISO: {
                    type: "string",
                    format: "date",
                    description: "Date of the public holiday (ISO 8601 format)",
                    example: "2026-01-01"
                },
                isRecurring: {
                    type: "boolean",
                    description: "Whether the holiday recurs every year",
                    example: false
                },
                recurrencePattern: {
                    type: "string",
                    nullable: true,
                    description: "RRULE pattern for recurring holidays (RFC 5545)",
                    example: null
                },
                description: {
                    type: "string",
                    nullable: true,
                    description: "Optional description of the holiday",
                    example: "Celebration of new calendar year"
                },
                affectsAllStaff: {
                    type: "boolean",
                    description: "Whether the holiday applies to all staff members",
                    example: true
                }
            }
        }
    }),
    (0, swagger_1.ApiCreatedResponse)({
        description: "Public holiday created successfully",
        schema: {
            type: "object",
            properties: {
                id: { type: "string" },
                organizationId: { type: "string" },
                name: { type: "string" },
                dateISO: { type: "string", format: "date" },
                isRecurring: { type: "boolean" },
                recurrencePattern: { type: "string", nullable: true },
                description: { type: "string", nullable: true },
                affectsAllStaff: { type: "boolean" }
            }
        }
    }),
    (0, swagger_1.ApiForbiddenResponse)({ description: "Authorization failed - user cannot access this organization" }),
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
    (0, swagger_1.ApiOperation)({
        summary: "Update an existing public holiday",
        description: "Update the details of an existing public holiday"
    }),
    (0, swagger_1.ApiParam)({
        name: "orgId",
        type: String,
        description: "The organization ID",
        example: "org_123abc"
    }),
    (0, swagger_1.ApiParam)({
        name: "id",
        type: String,
        description: "The public holiday ID",
        example: "holiday_123"
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "Updated holiday name",
                    example: "New Year's Day"
                },
                dateISO: {
                    type: "string",
                    format: "date",
                    description: "Updated holiday date",
                    example: "2026-01-01"
                },
                isRecurring: {
                    type: "boolean",
                    description: "Update recurring status",
                    example: false
                },
                recurrencePattern: {
                    type: "string",
                    nullable: true,
                    description: "Updated RRULE pattern"
                },
                description: {
                    type: "string",
                    nullable: true,
                    description: "Updated holiday description"
                },
                affectsAllStaff: {
                    type: "boolean",
                    description: "Update staff scope"
                }
            }
        }
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Public holiday updated successfully"
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: "Public holiday not found" }),
    (0, swagger_1.ApiForbiddenResponse)({ description: "Authorization failed - user cannot access this organization" }),
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
    (0, swagger_1.ApiOperation)({
        summary: "Delete a public holiday",
        description: "Remove a public holiday from the organization"
    }),
    (0, swagger_1.ApiParam)({
        name: "orgId",
        type: String,
        description: "The organization ID",
        example: "org_123abc"
    }),
    (0, swagger_1.ApiParam)({
        name: "id",
        type: String,
        description: "The public holiday ID",
        example: "holiday_123"
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Public holiday deleted successfully"
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: "Public holiday not found" }),
    (0, swagger_1.ApiForbiddenResponse)({ description: "Authorization failed - user cannot access this organization" }),
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
    (0, swagger_1.ApiTags)("Public Holidays"),
    (0, swagger_1.ApiCookieAuth)("cookieAuth"),
    (0, common_1.Controller)("organizations/:orgId/public-holidays"),
    __metadata("design:paramtypes", [public_holidays_service_1.PublicHolidaysService])
], PublicHolidaysController);
//# sourceMappingURL=public-holidays.controller.js.map