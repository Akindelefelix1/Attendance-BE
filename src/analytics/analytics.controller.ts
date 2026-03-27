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
  @ApiOperation({ summary: "Get analytics by organization" })
  @ApiQuery({ name: "orgId", type: String, required: true })
  @ApiQuery({ name: "range", required: false, enum: ["week", "month"] })
  @ApiQuery({ name: "filter", required: false, enum: ["all", "late", "early", "absent"] })
  @ApiOkResponse({ description: "Analytics payload returned" })
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
