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
  @ApiOperation({ summary: "Get organization settings" })
  @ApiParam({ name: "orgId", type: String })
  @ApiOkResponse({ description: "Settings returned" })
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
    description:
      "When staffLoginPassword is provided, the backend invalidates existing staff passwords and sends per-staff password reset links."
  })
  @ApiParam({ name: "orgId", type: String })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        lateAfterTime: { type: "string", example: "09:00" },
        earlyCheckoutBeforeTime: { type: "string", example: "17:00" },
        officeGeoFenceEnabled: { type: "boolean" },
        officeLatitude: { type: "number", nullable: true },
        officeLongitude: { type: "number", nullable: true },
        officeRadiusMeters: { type: "number" },
        roles: { type: "array", items: { type: "string" } },
        workingDays: { type: "array", items: { type: "number" } },
        analyticsIncludeFutureDays: { type: "boolean" },
        attendanceEditPolicy: { type: "string", enum: ["any", "self_only"] },
        adminEmails: { type: "array", items: { type: "string", format: "email" } },
        planTier: { type: "string", enum: ["free", "plus", "pro"] },
        staffLoginPassword: {
          type: "string",
          description:
            "Trigger for mandatory staff password reset links (plaintext value is not used for login)."
        }
      }
    }
  })
  @ApiOkResponse({ description: "Settings updated" })
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
