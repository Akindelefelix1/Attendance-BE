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
    if (user.role === "super_admin") {
      return;
    }
    if (!user.orgId || user.orgId !== requestOrgId) {
      throw new ForbiddenException("Access denied for this organization");
    }
  }

  @Get()
  @ApiOperation({ summary: "List attendance by organization and date" })
  @ApiQuery({ name: "orgId", type: String, required: true })
  @ApiQuery({ name: "dateISO", type: String, required: true })
  @ApiOkResponse({ description: "Attendance records returned" })
  @ApiUnauthorizedResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_attendance")
  list(
    @Query("orgId") orgId: string,
    @Query("dateISO") dateISO: string,
    @Req() req: { user?: { orgId?: string; role?: string } }
  ) {
    this.assertOrgScope(orgId, req.user);
    return this.attendanceService.listByOrganizationAndDate(orgId, dateISO);
  }

  @Get("organization/:orgId")
  @ApiOperation({ summary: "List attendance for organization" })
  @ApiParam({ name: "orgId", type: String })
  @ApiOkResponse({ description: "Attendance records returned" })
  @ApiUnauthorizedResponse({ description: "Authentication/authorization failed" })
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
  @ApiOperation({ summary: "Sign in staff attendance" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["organizationId", "staffId", "dateISO"],
      properties: {
        organizationId: { type: "string" },
        staffId: { type: "string" },
        dateISO: { type: "string", example: "2026-03-25" },
        latitude: { type: "number" },
        longitude: { type: "number" }
      }
    }
  })
  @ApiOkResponse({ description: "Sign-in recorded" })
  @ApiUnauthorizedResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_attendance")
  signIn(
    @Body()
    body: {
      organizationId: string;
      staffId: string;
      dateISO: string;
      latitude?: number;
      longitude?: number;
    },
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
  @ApiOperation({ summary: "Sign out staff attendance" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["organizationId", "staffId", "dateISO"],
      properties: {
        organizationId: { type: "string" },
        staffId: { type: "string" },
        dateISO: { type: "string", example: "2026-03-25" },
        latitude: { type: "number" },
        longitude: { type: "number" }
      }
    }
  })
  @ApiOkResponse({ description: "Sign-out recorded" })
  @ApiUnauthorizedResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_attendance")
  signOut(
    @Body()
    body: {
      organizationId: string;
      staffId: string;
      dateISO: string;
      latitude?: number;
      longitude?: number;
    },
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
