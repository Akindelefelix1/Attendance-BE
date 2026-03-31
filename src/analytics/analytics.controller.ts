import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags
} from "@nestjs/swagger";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { AnalyticsService } from "./analytics.service";

@ApiTags("Analytics")
@ApiCookieAuth("cookieAuth")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  private assertOrgScope(
    requestOrgId: string,
    user?: { orgId?: string; role?: string }
  ) {
    if (!user) {
      throw new ForbiddenException("Authentication required");
    }
    if (user.role === "super_admin" || user.role === "admin") {
      return;
    }
    if (!user.orgId || user.orgId !== requestOrgId) {
      throw new ForbiddenException("Access denied for this organization");
    }
  }

  @Get()
  @ApiOperation({
    summary: "Get analytics by organization",
    description: "Retrieve attendance analytics and statistics for an organization with optional filtering and date range selection"
  })
  @ApiQuery({
    name: "orgId",
    type: String,
    required: true,
    description: "Organization ID",
    example: "org_123abc"
  })
  @ApiQuery({
    name: "range",
    required: false,
    enum: ["week", "month"],
    description: "Time range for analytics",
    example: "week"
  })
  @ApiQuery({
    name: "filter",
    required: false,
    enum: ["all", "late", "early", "absent"],
    description: "Filter analytics by attendance status",
    example: "all"
  })
  @ApiOkResponse({
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
  })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("view_analytics")
  getAnalytics(
    @Query("orgId") orgId: string,
    @Query("range") range: "week" | "month" = "week",
    @Query("filter") filter: "all" | "late" | "early" | "absent" = "all",
    @Req() req: { user?: { orgId?: string; role?: string } }
  ) {
    this.assertOrgScope(orgId, req.user);
    return this.analyticsService.getAnalytics(orgId, range, filter);
  }
}
