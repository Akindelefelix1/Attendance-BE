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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
const analytics_service_1 = require("./analytics.service");
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
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
    getAnalytics(orgId, range = "week", filter = "all", req) {
        this.assertOrgScope(orgId, req.user);
        return this.analyticsService.getAnalytics(orgId, range, filter);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: "Get analytics by organization",
        description: "Retrieve attendance analytics and statistics for an organization with optional filtering and date range selection"
    }),
    (0, swagger_1.ApiQuery)({
        name: "orgId",
        type: String,
        required: true,
        description: "Organization ID",
        example: "org_123abc"
    }),
    (0, swagger_1.ApiQuery)({
        name: "range",
        required: false,
        enum: ["week", "month"],
        description: "Time range for analytics",
        example: "week"
    }),
    (0, swagger_1.ApiQuery)({
        name: "filter",
        required: false,
        enum: ["all", "late", "early", "absent"],
        description: "Filter analytics by attendance status",
        example: "all"
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Analytics payload returned",
        schema: {
            type: "object",
            properties: {
                organizationId: { type: "string", example: "org_123abc" },
                range: { type: "string", enum: ["week", "month"], example: "week" },
                filter: { type: "string", enum: ["all", "late", "early", "absent"], example: "all" },
                totalStaff: { type: "number", example: 45 },
                presentCount: { type: "number", example: 42 },
                absentCount: { type: "number", example: 3 },
                lateCount: { type: "number", example: 8 },
                earlyCheckoutCount: { type: "number", example: 5 },
                averageArrivalTime: { type: "string", example: "08:45:00" },
                averageDepartureTime: { type: "string", example: "17:30:00" },
                dailyBreakdown: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            dateISO: { type: "string", format: "date" },
                            presentCount: { type: "number" },
                            absentCount: { type: "number" },
                            lateCount: { type: "number" },
                            earlyCheckoutCount: { type: "number" }
                        }
                    }
                },
                staffBreakdown: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            staffId: { type: "string" },
                            fullName: { type: "string" },
                            presentDays: { type: "number" },
                            absentDays: { type: "number" },
                            lateDays: { type: "number" },
                            earlyCheckoutDays: { type: "number" }
                        }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiForbiddenResponse)({ description: "Authentication/authorization failed" }),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("view_analytics"),
    __param(0, (0, common_1.Query)("orgId")),
    __param(1, (0, common_1.Query)("range")),
    __param(2, (0, common_1.Query)("filter")),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getAnalytics", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)("Analytics"),
    (0, swagger_1.ApiCookieAuth)("cookieAuth"),
    (0, common_1.Controller)("analytics"),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map