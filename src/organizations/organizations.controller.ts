import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags
} from "@nestjs/swagger";
import { OrganizationsService } from "./organizations.service";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";

@ApiTags("Organizations")
@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  private assertOrgScope(
    requestOrgId: string,
    user?: { orgId?: string; role?: string }
  ) {
    if (!user) {
      throw new ForbiddenException("Authentication required");
    }
    if (user.role === "super_admin") {
      return;
    }
    if (!user.orgId || user.orgId !== requestOrgId) {
      throw new ForbiddenException("Access denied for this organization");
    }
  }

  @Get()
  @ApiOperation({
    summary: "List organizations",
    description: "Get a list of all organizations. Super admins see all organizations, regular admins see only their own."
  })
  @ApiCookieAuth("cookieAuth")
  @ApiOkResponse({
    description: "Organizations returned",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", example: "org_123abc" },
          name: { type: "string", example: "Company A" },
          location: { type: "string", example: "New York" },
          lateAfterTime: { type: "string", example: "09:00" },
          earlyCheckoutBeforeTime: { type: "string", example: "17:00" },
          officeGeoFenceEnabled: { type: "boolean", example: false },
          officeLatitude: { type: "number", nullable: true },
          officeLongitude: { type: "number", nullable: true },
          officeRadiusMeters: { type: "number", example: 150 },
          roles: { type: "array", items: { type: "string" } },
          workingDays: { type: "array", items: { type: "number" } },
          analyticsIncludeFutureDays: { type: "boolean", example: false },
          attendanceEditPolicy: { type: "string", enum: ["any", "self_only"], example: "any" },
          adminEmails: { type: "array", items: { type: "string", format: "email" } },
          planTier: { type: "string", enum: ["free", "plus", "pro"], example: "free" }
        }
      }
    }
  })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"))
  findAll(@Req() req: { user?: { orgId?: string; role?: string } }) {
    if (req.user?.role === "super_admin") {
      return this.organizationsService.findAll();
    }
    if (!req.user?.orgId) {
      throw new ForbiddenException("Access denied for this organization");
    }
    return this.organizationsService.findAllForOrg(req.user.orgId);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get organization by id",
    description: "Retrieve detailed information about a specific organization"
  })
  @ApiCookieAuth("cookieAuth")
  @ApiParam({ name: "id", type: String, description: "Organization ID", example: "org_123abc" })
  @ApiOkResponse({
    description: "Organization returned",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", example: "org_123abc" },
        name: { type: "string", example: "Company A" },
        location: { type: "string", example: "New York" },
        lateAfterTime: { type: "string", example: "09:00" },
        earlyCheckoutBeforeTime: { type: "string", example: "17:00" },
        officeGeoFenceEnabled: { type: "boolean", example: false },
        officeLatitude: { type: "number", nullable: true },
        officeLongitude: { type: "number", nullable: true },
        officeRadiusMeters: { type: "number", example: 150 },
        roles: { type: "array", items: { type: "string" } },
        workingDays: { type: "array", items: { type: "number" } },
        analyticsIncludeFutureDays: { type: "boolean", example: false },
        attendanceEditPolicy: { type: "string", enum: ["any", "self_only"], example: "any" },
        adminEmails: { type: "array", items: { type: "string", format: "email" } },
        planTier: { type: "string", enum: ["free", "plus", "pro"], example: "free" }
      }
    }
  })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"))
  findOne(
    @Param("id") id: string,
    @Req() req: { user?: { orgId?: string; role?: string } }
  ) {
    this.assertOrgScope(id, req.user);
    return this.organizationsService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: "Create organization",
    description: "Create a new organization. Requires super_admin role or organization creation permission."
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["name", "location"],
      properties: {
        name: {
          type: "string",
          description: "Organization name",
          example: "Company A"
        },
        location: {
          type: "string",
          description: "Organization location/city",
          example: "New York"
        },
        lateAfterTime: {
          type: "string",
          description: "Time after which staff are marked as late (HH:MM format)",
          example: "09:00"
        },
        earlyCheckoutBeforeTime: {
          type: "string",
          description: "Time before which early checkout is recorded (HH:MM format)",
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
          description: "Office latitude for geofence",
          example: 40.7128
        },
        officeLongitude: {
          type: "number",
          nullable: true,
          description: "Office longitude for geofence",
          example: -74.006
        },
        officeRadiusMeters: {
          type: "number",
          description: "Geofence radius in meters",
          example: 150
        },
        roles: {
          type: "array",
          items: { type: "string" },
          description: "Available staff roles",
          example: ["manager", "staff"]
        },
        workingDays: {
          type: "array",
          items: { type: "number" },
          description: "Working days (0=Sunday, 1=Monday, etc.)",
          example: [1, 2, 3, 4, 5]
        },
        analyticsIncludeFutureDays: {
          type: "boolean",
          description: "Include future days in analytics",
          example: false
        },
        attendanceEditPolicy: {
          type: "string",
          enum: ["any", "self_only"],
          description: "Who can edit attendance records",
          example: "any"
        },
        adminEmails: {
          type: "array",
          items: { type: "string", format: "email" },
          description: "Initial admin email addresses",
          example: ["admin@org.com"]
        },
        planTier: {
          type: "string",
          enum: ["free", "plus", "pro"],
          description: "Subscription plan tier",
          example: "free"
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: "Organization created",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        location: { type: "string" },
        planTier: { type: "string" }
      }
    }
  })
  create(
    @Body()
    body: {
      name: string;
      location: string;
      lateAfterTime?: string;
      earlyCheckoutBeforeTime?: string;
      officeGeoFenceEnabled?: boolean;
      officeLatitude?: number | null;
      officeLongitude?: number | null;
      officeRadiusMeters?: number;
      roles?: string[];
      workingDays?: number[];
      analyticsIncludeFutureDays?: boolean;
      attendanceEditPolicy?: "any" | "self_only";
      adminEmails?: string[];
      planTier?: "free" | "plus" | "pro";
    }
  ) {
    return this.organizationsService.create({
      name: body.name,
      location: body.location,
      lateAfterTime: body.lateAfterTime ?? undefined,
      earlyCheckoutBeforeTime: body.earlyCheckoutBeforeTime ?? undefined,
      officeGeoFenceEnabled: body.officeGeoFenceEnabled ?? false,
      officeLatitude: body.officeLatitude ?? null,
      officeLongitude: body.officeLongitude ?? null,
      officeRadiusMeters: body.officeRadiusMeters ?? 150,
      roles: body.roles ?? [],
      workingDays: body.workingDays ?? [1, 2, 3, 4, 5],
      analyticsIncludeFutureDays: body.analyticsIncludeFutureDays ?? false,
      attendanceEditPolicy: body.attendanceEditPolicy ?? "any",
      adminEmails: body.adminEmails ?? [],
      planTier: body.planTier ?? "free"
    });
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update organization",
    description: "Modify organization configuration and settings"
  })
  @ApiCookieAuth("cookieAuth")
  @ApiParam({
    name: "id",
    type: String,
    description: "Organization ID",
    example: "org_123abc"
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        location: { type: "string" },
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
        planTier: { type: "string", enum: ["free", "plus", "pro"] }
      }
    }
  })
  @ApiOkResponse({
    description: "Organization updated"
  })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_organizations")
  update(
    @Param("id") id: string,
    @Req() req: { user?: { orgId?: string; role?: string } },
    @Body()
    body: Partial<{
      name: string;
      location: string;
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
    }>
  ) {
    this.assertOrgScope(id, req.user);
    return this.organizationsService.update(id, {
      ...body
    });
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete organization",
    description: "Permanently remove an organization and all associated data"
  })
  @ApiCookieAuth("cookieAuth")
  @ApiParam({
    name: "id",
    type: String,
    description: "Organization ID",
    example: "org_123abc"
  })
  @ApiOkResponse({
    description: "Organization deleted"
  })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_organizations")
  remove(
    @Param("id") id: string,
    @Req() req: { user?: { orgId?: string; role?: string } }
  ) {
    this.assertOrgScope(id, req.user);
    return this.organizationsService.remove(id);
  }
}
