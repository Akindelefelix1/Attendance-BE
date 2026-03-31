import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  BadRequestException,
  NotFoundException,
  ForbiddenException
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiForbiddenResponse
} from "@nestjs/swagger";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { PublicHolidaysService } from "./public-holidays.service";

@ApiTags("Public Holidays")
@ApiCookieAuth("cookieAuth")
@Controller("organizations/:orgId/public-holidays")
export class PublicHolidaysController {
  constructor(private readonly publicHolidaysService: PublicHolidaysService) {}

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
    summary: "List all public holidays for an organization",
    description: "Retrieve all public holidays configured for the specified organization"
  })
  @ApiParam({
    name: "orgId",
    type: String,
    description: "The organization ID",
    example: "org_123abc"
  })
  @ApiOkResponse({
    description: "Public holidays list retrieved successfully",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", example: "holiday_123" },
        organizationId: { type: "string", example: "org_123abc" },
        name: { type: "string", example: "New Year" },
        dateISO: { type: "string", format: "date", example: "2026-01-01" },
        isRecurring: { type: "boolean", example: false },
        recurrencePattern: { type: "string", nullable: true },
        description: { type: "string", nullable: true },
        affectsAllStaff: { type: "boolean", example: true }
      }
    }
  })
  @ApiForbiddenResponse({ description: "Authorization failed - user cannot access this organization" })
  @UseGuards(AuthGuard("jwt"))
  async findAll(@Param("orgId") orgId: string, @Req() req: any) {
    this.assertOrgScope(orgId, req.user);
    return this.publicHolidaysService.findAll(orgId);
  }

  @Post()
  @ApiOperation({
    summary: "Create a new public holiday",
    description: "Create a new public holiday for the organization. Can be one-time or recurring."
  })
  @ApiParam({
    name: "orgId",
    type: String,
    description: "The organization ID",
    example: "org_123abc"
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["name", "dateISO"],
      properties: {
        name: {
          type: "string",
          description: "Name of the public holiday",
          example: "New Year's Day"
        },
        dateISO: {
          type: "string",
          format: "date",
          description: "Date of the public holiday (ISO 8601 format)",
          example: "2026-01-01"
        },
        isRecurring: {
          type: "boolean",
          description: "Whether the holiday recurs every year",
          example: false
        },
        recurrencePattern: {
          type: "string",
          nullable: true,
          description: "RRULE pattern for recurring holidays (RFC 5545)",
          example: null
        },
        description: {
          type: "string",
          nullable: true,
          description: "Optional description of the holiday",
          example: "Celebration of new calendar year"
        },
        affectsAllStaff: {
          type: "boolean",
          description: "Whether the holiday applies to all staff members",
          example: true
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: "Public holiday created successfully",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        organizationId: { type: "string" },
        name: { type: "string" },
        dateISO: { type: "string", format: "date" },
        isRecurring: { type: "boolean" },
        recurrencePattern: { type: "string", nullable: true },
        description: { type: "string", nullable: true },
        affectsAllStaff: { type: "boolean" }
      }
    }
  })
  @ApiForbiddenResponse({ description: "Authorization failed - user cannot access this organization" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_settings")
  async create(
    @Param("orgId") orgId: string,
    @Body()
    body: {
      name: string;
      dateISO: string;
      isRecurring?: boolean;
      recurrencePattern?: string;
      description?: string;
      affectsAllStaff?: boolean;
    },
    @Req() req: any
  ) {
    this.assertOrgScope(orgId, req.user);

    if (!body.name || !body.dateISO) {
      throw new BadRequestException("Name and date are required");
    }

    return this.publicHolidaysService.create(orgId, {
      name: body.name,
      dateISO: body.dateISO,
      isRecurring: body.isRecurring ?? false,
      recurrencePattern: body.recurrencePattern,
      description: body.description,
      affectsAllStaff: body.affectsAllStaff ?? true
    });
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update an existing public holiday",
    description: "Update the details of an existing public holiday"
  })
  @ApiParam({
    name: "orgId",
    type: String,
    description: "The organization ID",
    example: "org_123abc"
  })
  @ApiParam({
    name: "id",
    type: String,
    description: "The public holiday ID",
    example: "holiday_123"
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Updated holiday name",
          example: "New Year's Day"
        },
        dateISO: {
          type: "string",
          format: "date",
          description: "Updated holiday date",
          example: "2026-01-01"
        },
        isRecurring: {
          type: "boolean",
          description: "Update recurring status",
          example: false
        },
        recurrencePattern: {
          type: "string",
          nullable: true,
          description: "Updated RRULE pattern"
        },
        description: {
          type: "string",
          nullable: true,
          description: "Updated holiday description"
        },
        affectsAllStaff: {
          type: "boolean",
          description: "Update staff scope"
        }
      }
    }
  })
  @ApiOkResponse({
    description: "Public holiday updated successfully"
  })
  @ApiNotFoundResponse({ description: "Public holiday not found" })
  @ApiForbiddenResponse({ description: "Authorization failed - user cannot access this organization" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_settings")
  async update(
    @Param("orgId") orgId: string,
    @Param("id") id: string,
    @Body()
    body: Partial<{
      name: string;
      dateISO: string;
      isRecurring: boolean;
      recurrencePattern: string;
      description: string;
      affectsAllStaff: boolean;
    }>,
    @Req() req: any
  ) {
    this.assertOrgScope(orgId, req.user);

    const holiday = await this.publicHolidaysService.findOne(orgId, id);
    if (!holiday) {
      throw new NotFoundException("Holiday not found");
    }

    return this.publicHolidaysService.update(orgId, id, body);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a public holiday",
    description: "Remove a public holiday from the organization"
  })
  @ApiParam({
    name: "orgId",
    type: String,
    description: "The organization ID",
    example: "org_123abc"
  })
  @ApiParam({
    name: "id",
    type: String,
    description: "The public holiday ID",
    example: "holiday_123"
  })
  @ApiOkResponse({
    description: "Public holiday deleted successfully"
  })
  @ApiNotFoundResponse({ description: "Public holiday not found" })
  @ApiForbiddenResponse({ description: "Authorization failed - user cannot access this organization" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_settings")
  async delete(
    @Param("orgId") orgId: string,
    @Param("id") id: string,
    @Req() req: any
  ) {
    this.assertOrgScope(orgId, req.user);

    const holiday = await this.publicHolidaysService.findOne(orgId, id);
    if (!holiday) {
      throw new NotFoundException("Holiday not found");
    }

    return this.publicHolidaysService.delete(orgId, id);
  }
}

