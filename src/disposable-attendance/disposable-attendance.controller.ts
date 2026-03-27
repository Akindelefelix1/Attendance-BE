import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
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
  ApiTags
} from "@nestjs/swagger";
import type { Response } from "express";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { DisposableAttendanceService } from "./disposable-attendance.service";

@ApiTags("Disposable Attendance")
@Controller()
export class DisposableAttendanceController {
  constructor(private readonly disposableService: DisposableAttendanceService) {}

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

  @Get("disposable-attendance")
  @ApiCookieAuth("cookieAuth")
  @ApiOperation({ summary: "List disposable attendance forms by organization" })
  @ApiQuery({ name: "orgId", type: String, required: true })
  @ApiOkResponse({ description: "Disposable attendance list returned" })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_attendance")
  list(
    @Query("orgId") orgId: string,
    @Req() req: { user?: { orgId?: string; role?: string } }
  ) {
    this.assertOrgScope(orgId, req.user);
    return this.disposableService.listByOrg(orgId);
  }

  @Post("disposable-attendance")
  @ApiCookieAuth("cookieAuth")
  @ApiOperation({ summary: "Create disposable attendance" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["orgId", "title", "eventDateISO", "fields", "isRecurring", "recurrenceMode"],
      properties: {
        orgId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        location: { type: "string" },
        eventDateISO: { type: "string", example: "2026-04-10" },
        fields: { type: "array", items: { type: "object" } },
        isRecurring: { type: "boolean" },
        recurrenceMode: { type: "string", enum: ["none", "daily", "weekly", "monthly", "custom"] },
        recurrenceEndDateISO: { type: "string", nullable: true },
        recurrenceCustomRule: { type: "string" }
      }
    }
  })
  @ApiOkResponse({ description: "Disposable attendance created" })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_attendance")
  create(
    @Body()
    body: {
      orgId: string;
      title: string;
      description?: string;
      location?: string;
      eventDateISO: string;
      fields: Array<{
        id: string;
        label: string;
        type: "full-name" | "email" | "phone" | "occupation" | "address" | "text";
        required: boolean;
      }>;
      isRecurring: boolean;
      recurrenceMode: "none" | "daily" | "weekly" | "monthly" | "custom";
      recurrenceEndDateISO?: string | null;
      recurrenceCustomRule?: string;
    },
    @Req() req: { user?: { orgId?: string; role?: string } }
  ) {
    this.assertOrgScope(body.orgId, req.user);
    return this.disposableService.create(body);
  }

  @Patch("disposable-attendance/:id")
  @ApiCookieAuth("cookieAuth")
  @ApiOperation({ summary: "Update disposable attendance" })
  @ApiParam({ name: "id", type: String })
  @ApiOkResponse({ description: "Disposable attendance updated" })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_attendance")
  update(
    @Param("id") id: string,
    @Body()
    body: {
      orgId: string;
      title?: string;
      description?: string;
      location?: string;
      eventDateISO?: string;
      fields?: Array<{
        id: string;
        label: string;
        type: "full-name" | "email" | "phone" | "occupation" | "address" | "text";
        required: boolean;
      }>;
      isRecurring?: boolean;
      recurrenceMode?: "none" | "daily" | "weekly" | "monthly" | "custom";
      recurrenceEndDateISO?: string | null;
      recurrenceCustomRule?: string;
      isArchived?: boolean;
    },
    @Req() req: { user?: { orgId?: string; role?: string } }
  ) {
    this.assertOrgScope(body.orgId, req.user);
    return this.disposableService.update(id, body.orgId, body);
  }

  @Delete("disposable-attendance/:id")
  @ApiCookieAuth("cookieAuth")
  @ApiOperation({ summary: "Delete disposable attendance" })
  @ApiParam({ name: "id", type: String })
  @ApiQuery({ name: "orgId", type: String, required: true })
  @ApiOkResponse({ description: "Disposable attendance deleted" })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_attendance")
  remove(
    @Param("id") id: string,
    @Query("orgId") orgId: string,
    @Req() req: { user?: { orgId?: string; role?: string } }
  ) {
    this.assertOrgScope(orgId, req.user);
    return this.disposableService.remove(id, orgId);
  }

  @Get("disposable-attendance/:id/responses")
  @ApiCookieAuth("cookieAuth")
  @ApiOperation({
    summary: "List disposable attendance responses (legacy)",
    description: "Deprecated: use GET /disposable-attendance/:id/responses-table for UI table rendering.",
    deprecated: true
  })
  @ApiParam({ name: "id", type: String })
  @ApiQuery({ name: "orgId", type: String, required: true })
  @ApiOkResponse({ description: "Disposable attendance responses returned" })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_attendance")
  listResponses(
    @Param("id") id: string,
    @Query("orgId") orgId: string,
    @Req() req: { user?: { orgId?: string; role?: string } }
  ) {
    this.assertOrgScope(orgId, req.user);
    return this.disposableService.listResponses(id, orgId);
  }

  @Get("disposable-attendance/:id/responses-table")
  @ApiCookieAuth("cookieAuth")
  @ApiOperation({ summary: "Get disposable attendance responses formatted for table rendering" })
  @ApiParam({ name: "id", type: String })
  @ApiQuery({ name: "orgId", type: String, required: true })
  @ApiOkResponse({ description: "Formatted disposable attendance response table returned" })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_attendance")
  getResponsesTable(
    @Param("id") id: string,
    @Query("orgId") orgId: string,
    @Req() req: { user?: { orgId?: string; role?: string } }
  ) {
    this.assertOrgScope(orgId, req.user);
    return this.disposableService.getResponsesTable(id, orgId);
  }

  @Patch("disposable-attendance/:id/fields")
  @ApiCookieAuth("cookieAuth")
  @ApiOperation({ summary: "Update collected details (fields) for a disposable attendance" })
  @ApiParam({ name: "id", type: String })
  @ApiBody({
    schema: {
      type: "object",
      required: ["orgId", "fields"],
      properties: {
        orgId: { type: "string" },
        fields: {
          type: "array",
          items: {
            type: "object",
            required: ["id", "label", "type", "required"],
            properties: {
              id: { type: "string" },
              label: { type: "string" },
              type: {
                type: "string",
                enum: ["full-name", "email", "phone", "occupation", "address", "text"]
              },
              required: { type: "boolean" }
            }
          }
        }
      }
    }
  })
  @ApiOkResponse({ description: "Collected details updated" })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_attendance")
  updateFields(
    @Param("id") id: string,
    @Body()
    body: {
      orgId: string;
      fields: Array<{
        id: string;
        label: string;
        type: "full-name" | "email" | "phone" | "occupation" | "address" | "text";
        required: boolean;
      }>;
    },
    @Req() req: { user?: { orgId?: string; role?: string } }
  ) {
    this.assertOrgScope(body.orgId, req.user);
    return this.disposableService.updateCollectedFields(id, body.orgId, body.fields);
  }

  @Post("disposable-attendance/:id/responses/admin")
  @ApiCookieAuth("cookieAuth")
  @ApiOperation({ summary: "Submit admin/manual disposable attendance response" })
  @ApiParam({ name: "id", type: String })
  @ApiBody({
    schema: {
      type: "object",
      required: ["orgId", "values"],
      properties: {
        orgId: { type: "string" },
        values: { type: "object", additionalProperties: { type: "string" } }
      }
    }
  })
  @ApiOkResponse({ description: "Admin response submitted" })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_attendance")
  submitAdminResponse(
    @Param("id") id: string,
    @Body() body: { orgId: string; values: Record<string, string> },
    @Req() req: { user?: { orgId?: string; role?: string; id?: string } }
  ) {
    this.assertOrgScope(body.orgId, req.user);
    return this.disposableService.submitAdminResponse(
      id,
      body.orgId,
      body.values,
      req.user?.id ?? ""
    );
  }

  @Get("disposable-attendance/:id/export.csv")
  @ApiCookieAuth("cookieAuth")
  @ApiOperation({ summary: "Export disposable attendance responses as CSV" })
  @ApiParam({ name: "id", type: String })
  @ApiQuery({ name: "orgId", type: String, required: true })
  @ApiOkResponse({ description: "CSV export returned" })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_attendance")
  async exportCsv(
    @Param("id") id: string,
    @Query("orgId") orgId: string,
    @Req() req: { user?: { orgId?: string; role?: string } },
    @Res({ passthrough: true }) res: Response
  ) {
    this.assertOrgScope(orgId, req.user);
    const exported = await this.disposableService.exportCsv(id, orgId);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${exported.filename}"`
    );
    return exported.content;
  }

  @Get("public/disposable-attendance/:publicId")
  @ApiOperation({ summary: "Get public disposable attendance form" })
  @ApiParam({ name: "publicId", type: String })
  @ApiOkResponse({ description: "Public disposable attendance form returned" })
  getPublicForm(@Param("publicId") publicId: string) {
    return this.disposableService.getPublicForm(publicId);
  }

  @Post("public/disposable-attendance/:publicId/check-in")
  @ApiOperation({ summary: "Submit public disposable attendance check-in" })
  @ApiParam({ name: "publicId", type: String })
  @ApiBody({
    schema: {
      type: "object",
      required: ["values"],
      properties: {
        values: { type: "object", additionalProperties: { type: "string" } }
      }
    }
  })
  @ApiOkResponse({ description: "Public check-in submitted" })
  submitPublicResponse(
    @Param("publicId") publicId: string,
    @Body() body: { values: Record<string, string> }
  ) {
    return this.disposableService.submitPublicResponse(publicId, body.values);
  }
}
