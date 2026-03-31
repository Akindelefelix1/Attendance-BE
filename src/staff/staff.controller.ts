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
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse
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
  @ApiOperation({
    summary: "List staff by organization",
    description: "Retrieve all staff members for a specific organization"
  })
  @ApiParam({
    name: "orgId",
    type: String,
    description: "Organization ID",
    example: "org_123abc"
  })
  @ApiOkResponse({
    description: "Staff list returned",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", example: "staff_123" },
          organizationId: { type: "string", example: "org_123abc" },
          fullName: { type: "string", example: "John Doe" },
          email: { type: "string", format: "email", example: "john@org.com" },
          role: { type: "string", example: "manager" },
          verified: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time", nullable: true }
        }
      }
    }
  })
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
  @ApiOperation({
    summary: "Create staff member",
    description: "Add a new staff member to an organization. A verification email will be sent to the new staff member."
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["organizationId", "fullName", "role", "email"],
      properties: {
        organizationId: {
          type: "string",
          description: "Organization ID",
          example: "org_123abc"
        },
        fullName: {
          type: "string",
          description: "Full name of the staff member",
          example: "John Doe"
        },
        role: {
          type: "string",
          description: "Role/position in the organization",
          example: "manager"
        },
        email: {
          type: "string",
          format: "email",
          description: "Email address for staff member login and communication",
          example: "john@org.com"
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: "Staff member created",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        organizationId: { type: "string" },
        fullName: { type: "string" },
        email: { type: "string", format: "email" },
        role: { type: "string" },
        verified: { type: "boolean" }
      }
    }
  })
  @ApiConflictResponse({
    description: "This staff email has already been added for this organization"
  })
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
  @ApiOperation({
    summary: "Update staff member",
    description: "Modify staff member information. Staff can only update their own information unless they are an admin."
  })
  @ApiParam({
    name: "id",
    type: String,
    description: "Staff member ID",
    example: "staff_123"
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        fullName: {
          type: "string",
          description: "Updated full name",
          example: "John Doe"
        },
        role: {
          type: "string",
          description: "Updated role",
          example: "senior_manager"
        },
        email: {
          type: "string",
          format: "email",
          description: "Updated email address",
          example: "john.doe@org.com"
        }
      }
    }
  })
  @ApiOkResponse({
    description: "Staff member updated"
  })
  @ApiConflictResponse({
    description: "This staff email has already been added for this organization"
  })
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
  @ApiOperation({
    summary: "Delete staff member",
    description: "Remove a staff member from the organization. Staff can only delete themselves unless they are an admin."
  })
  @ApiParam({
    name: "id",
    type: String,
    description: "Staff member ID",
    example: "staff_123"
  })
  @ApiOkResponse({
    description: "Staff member deleted"
  })
  @ApiNotFoundResponse({ description: "Staff member not found" })
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
