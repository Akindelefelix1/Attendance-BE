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
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { PublicHolidaysService } from "./public-holidays.service";

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
  @UseGuards(AuthGuard("jwt"))
  async findAll(@Param("orgId") orgId: string, @Req() req: any) {
    this.assertOrgScope(orgId, req.user);
    return this.publicHolidaysService.findAll(orgId);
  }

  @Post()
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
