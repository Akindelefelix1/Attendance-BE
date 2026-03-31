import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
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
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse
} from "@nestjs/swagger";
import { AttendanceService } from "./attendance.service";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { AttendanceListQueryDto, AttendanceMarkDto } from "./dto/attendance.dto";

@ApiTags("Attendance")
@ApiCookieAuth("cookieAuth")
@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

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
    summary: "List attendance by organization and date",
    description: "Retrieve attendance records for a specific organization on a specific date"
  })
  @ApiQuery({ name: "orgId", type: String, required: true, description: "Organization ID", example: "org_123abc" })
  @ApiQuery({ name: "dateISO", type: String, required: true, description: "Date in ISO format (YYYY-MM-DD)", example: "2026-03-31" })
  @ApiOkResponse({
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
  })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_attendance")
  list(
    @Query() query: AttendanceListQueryDto,
    @Req() req: { user?: { orgId?: string; role?: string } }
  ) {
    const { orgId, dateISO } = query;
    this.assertOrgScope(orgId, req.user);
    return this.attendanceService.listByOrganizationAndDate(orgId, dateISO);
  }

  @Get("organization/:orgId")
  @ApiOperation({
    summary: "List attendance for organization",
    description: "Retrieve all attendance records for an organization (across all dates)"
  })
  @ApiParam({ name: "orgId", type: String, description: "Organization ID", example: "org_123abc" })
  @ApiOkResponse({
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
  })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_attendance")
  listForOrganization(
    @Param("orgId") orgId: string,
    @Req() req: { user?: { orgId?: string; role?: string } }
  ) {
    this.assertOrgScope(orgId, req.user);
    return this.attendanceService.listByOrganization(orgId);
  }

  @Post("sign-in")
  @ApiOperation({
    summary: "Sign in staff attendance",
    description: "Record a staff member's sign-in (arrival). Can include GPS location for geofence validation."
  })
  @ApiBody({
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
  })
  @ApiOkResponse({
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
  })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_attendance")
  signIn(
    @Body() body: AttendanceMarkDto,
    @Req() req: { user?: { role?: string; id?: string } }
  ) {
    if (req.user?.role === "staff" && req.user.id !== body.staffId) {
      return null;
    }
    this.assertOrgScope(body.organizationId, req.user);
    return this.attendanceService.signIn(
      body.organizationId,
      body.staffId,
      body.dateISO,
      req.user?.role,
      body.latitude,
      body.longitude
    );
  }

  @Post("sign-out")
  @ApiOperation({
    summary: "Sign out staff attendance",
    description: "Record a staff member's sign-out (departure). Can include GPS location for geofence validation."
  })
  @ApiBody({
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
  })
  @ApiOkResponse({
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
  })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_attendance")
  signOut(
    @Body() body: AttendanceMarkDto,
    @Req() req: { user?: { role?: string; id?: string } }
  ) {
    if (req.user?.role === "staff" && req.user.id !== body.staffId) {
      return null;
    }
    this.assertOrgScope(body.organizationId, req.user);
    return this.attendanceService.signOut(
      body.organizationId,
      body.staffId,
      body.dateISO,
      req.user?.role,
      body.latitude,
      body.longitude
    );
  }
}
