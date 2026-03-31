import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Req,
  UseGuards
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags
} from "@nestjs/swagger";
import { SettingsService } from "./settings.service";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";

@ApiTags("Settings")
@ApiCookieAuth("cookieAuth")
@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

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

  @Get(":orgId")
  @ApiOperation({
    summary: "Get organization settings",
    description: "Retrieve all configuration settings for an organization including working hours, policies, and plan information"
  })
  @ApiParam({
    name: "orgId",
    type: String,
    description: "Organization ID",
    example: "org_123abc"
  })
  @ApiOkResponse({
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
  })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_settings")
  getSettings(
    @Param("orgId") orgId: string,
    @Req() req: { user?: { orgId?: string; role?: string } }
  ) {
    this.assertOrgScope(orgId, req.user);
    return this.settingsService.getSettings(orgId);
  }

  @Patch(":orgId")
  @ApiOperation({
    summary: "Update organization settings",
    description: "Modify organization configuration. When staffLoginPassword is provided, all staff will be required to reset their passwords via email links."
  })
  @ApiParam({
    name: "orgId",
    type: String,
    description: "Organization ID",
    example: "org_123abc"
  })
  @ApiBody({
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
  })
  @ApiOkResponse({
    description: "Settings updated",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Settings updated successfully" },
        updated: { type: "object" }
      }
    }
  })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_settings")
  updateSettings(
    @Param("orgId") orgId: string,
    @Req() req: { user?: { orgId?: string; role?: string } },
    @Body()
    body: Partial<{
      lateAfterTime: string;
      earlyCheckoutBeforeTime: string;
      officeGeoFenceEnabled: boolean;
      officeLatitude: number | null;
      officeLongitude: number | null;
      officeRadiusMeters: number;
      roles: string[];
      workingDays: number[];
      analyticsIncludeFutureDays: boolean;
      attendanceEditPolicy: "any" | "self_only";
      adminEmails: string[];
      planTier: "free" | "plus" | "pro";
      staffLoginPassword: string;
    }>
  ) {
    this.assertOrgScope(orgId, req.user);
    return this.settingsService.updateSettings(orgId, body);
  }
}
