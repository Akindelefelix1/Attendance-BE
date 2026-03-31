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

  private normalizeDateISO(input: string) {
    const raw = (input ?? "").trim();
    if (!raw) {
      throw new BadRequestException("Date is required");
    }

    // Already ISO yyyy-mm-dd.
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return raw;
    }

    // Accept dd/mm/yyyy or mm/dd/yyyy and normalize to yyyy-mm-dd.
    const slashParts = raw.split("/");
    if (slashParts.length === 3) {
      const [first, second, yearRaw] = slashParts;
      const year = Number(yearRaw);
      const a = Number(first);
      const b = Number(second);
      if (
        Number.isInteger(year) &&
        Number.isInteger(a) &&
        Number.isInteger(b) &&
        year >= 1900 &&
        year <= 9999 &&
        a >= 1 &&
        a <= 31 &&
        b >= 1 &&
        b <= 31
      ) {
        // Resolve ambiguity with a pragmatic default: day/month/year.
        const day = String(a).padStart(2, "0");
        const month = String(b).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    }

    throw new BadRequestException("Invalid date format. Use YYYY-MM-DD.");
  }

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
      name?: string;
      holidayName?: string;
      dateISO?: string;
      date?: string;
      isRecurring?: boolean;
      recurrencePattern?: string;
      description?: string;
      affectsAllStaff?: boolean;
    },
    @Req() req: any
  ) {
    this.assertOrgScope(orgId, req.user);

    const resolvedName = (body.name ?? body.holidayName ?? "").trim();
    const resolvedDateISO = body.dateISO ?? body.date;

    if (!resolvedName || !resolvedDateISO) {
      throw new BadRequestException("Name and date are required");
    }

    const normalizedDateISO = this.normalizeDateISO(resolvedDateISO);

    return this.publicHolidaysService.create(orgId, {
      name: resolvedName,
      dateISO: normalizedDateISO,
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

    const normalizedPayload = {
      ...body,
      ...(body.dateISO ? { dateISO: this.normalizeDateISO(body.dateISO) } : {})
    };

    return this.publicHolidaysService.update(orgId, id, normalizedPayload);
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

