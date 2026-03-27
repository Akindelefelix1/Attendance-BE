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
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse
} from "@nestjs/swagger";
import { StaffService } from "./staff.service";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";

@ApiTags("Staff")
@ApiCookieAuth("cookieAuth")
@Controller("staff")
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

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

  @Get("organization/:orgId")
  @ApiOperation({ summary: "List staff by organization" })
  @ApiParam({ name: "orgId", type: String })
  @ApiOkResponse({ description: "Staff list returned" })
  @ApiUnauthorizedResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_staff")
  listByOrganization(
    @Param("orgId") orgId: string,
    @Req() req: { user?: { orgId?: string; role?: string } }
  ) {
    this.assertOrgScope(orgId, req.user);
    return this.staffService.listByOrganization(orgId);
  }

  @Post()
  @ApiOperation({ summary: "Create staff member" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["organizationId", "fullName", "role", "email"],
      properties: {
        organizationId: { type: "string" },
        fullName: { type: "string" },
        role: { type: "string" },
        email: { type: "string", format: "email" }
      }
    }
  })
  @ApiOkResponse({ description: "Staff member created" })
  @ApiUnauthorizedResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_staff")
  create(
    @Req() req: { user?: { orgId?: string; role?: string } },
    @Body()
    body: { organizationId: string; fullName: string; role: string; email: string }
  ) {
    this.assertOrgScope(body.organizationId, req.user);
    return this.staffService.create(body.organizationId, {
      fullName: body.fullName,
      role: body.role,
      email: body.email
    });
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update staff member" })
  @ApiParam({ name: "id", type: String })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        fullName: { type: "string" },
        role: { type: "string" },
        email: { type: "string", format: "email" }
      }
    }
  })
  @ApiOkResponse({ description: "Staff member updated" })
  @ApiUnauthorizedResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_staff")
  update(
    @Param("id") id: string,
    @Req() req: { user?: { orgId?: string; role?: string } },
    @Body() body: { fullName?: string; role?: string; email?: string }
  ) {
    if (req.user?.role !== "super_admin" && req.user?.role !== "admin") {
      return this.staffService.updateInOrg(id, req.user?.orgId ?? "", body);
    }
    return this.staffService.update(id, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete staff member" })
  @ApiParam({ name: "id", type: String })
  @ApiOkResponse({ description: "Staff member deleted" })
  @ApiUnauthorizedResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_staff")
  remove(
    @Param("id") id: string,
    @Req() req: { user?: { orgId?: string; role?: string } }
  ) {
    if (req.user?.role !== "super_admin" && req.user?.role !== "admin") {
      return this.staffService.removeInOrg(id, req.user?.orgId ?? "");
    }
    return this.staffService.remove(id);
  }
}
