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
  ApiCreatedResponse,
  ApiNotFoundResponse,
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
  @ApiOperation({
    summary: "List disposable attendance forms by organization",
    description: "Retrieve all custom attendance forms (disposable attendance) created for the organization"
  })
  @ApiQuery({
    name: "orgId",
    type: String,
    required: true,
    description: "Organization ID",
    example: "org_123abc"
  })
  @ApiOkResponse({
    description: "Disposable attendance list returned",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", example: "form_123" },
          organizationId: { type: "string", example: "org_123abc" },
          title: { type: "string", example: "Team Outing" },
          description: { type: "string", nullable: true },
          location: { type: "string", nullable: true },
          eventDateISO: { type: "string", format: "date" },
          fields: { type: "array", items: { type: "object" } },
          isRecurring: { type: "boolean" },
          recurrenceMode: { type: "string", enum: ["none", "daily", "weekly", "monthly", "custom"] },
          allowPreRegister: { type: "boolean" },
          postSubmitActionLink: { type: "string", nullable: true },
          postSubmitActionLabel: { type: "string", nullable: true },
          isArchived: { type: "boolean" },
          publicId: { type: "string", nullable: true },
          responseCount: { type: "number" }
        }
      }
    }
  })
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
  @ApiOperation({
    summary: "Create disposable attendance",
    description: "Create a new custom attendance form for collecting staff attendance in special events or situations"
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["orgId", "title", "eventDateISO", "fields", "isRecurring", "recurrenceMode"],
      properties: {
        orgId: {
          type: "string",
          description: "Organization ID",
          example: "org_123abc"
        },
        title: {
          type: "string",
          description: "Title of the attendance form",
          example: "Team Outing"
        },
        description: {
          type: "string",
          nullable: true,
          description: "Detailed description of the event",
          example: "Annual team building event"
        },
        location: {
          type: "string",
          nullable: true,
          description: "Location of the event",
          example: "Conference Hall A"
        },
        postSubmitActionLink: {
          type: "string",
          nullable: true,
          description:
            "Optional URL shown after successful public pre-register/check-in for next action",
          example: "https://chat.whatsapp.com/abc123"
        },
        postSubmitActionLabel: {
          type: "string",
          nullable: true,
          description: "Optional action button label shown with the post-submit link",
          example: "Join WhatsApp group"
        },
        eventDateISO: {
          type: "string",
          format: "date",
          description: "Event date in ISO format",
          example: "2026-04-10"
        },
        fields: {
          type: "array",
          description: "Custom fields to collect from respondents",
          items: {
            type: "object",
            required: ["id", "label", "type", "required"],
            properties: {
              id: { type: "string", example: "field_1" },
              label: { type: "string", example: "Full Name" },
              type: {
                type: "string",
                enum: ["full-name", "email", "phone", "occupation", "address", "text"],
                example: "full-name"
              },
              required: { type: "boolean", example: true }
            }
          }
        },
        isRecurring: {
          type: "boolean",
          description: "Whether this form recurs",
          example: false
        },
        recurrenceMode: {
          type: "string",
          enum: ["none", "daily", "weekly", "monthly", "custom"],
          description: "Recurrence pattern if isRecurring is true",
          example: "none"
        },
        recurrenceEndDateISO: {
          type: "string",
          format: "date",
          nullable: true,
          description: "End date for recurring forms"
        },
        recurrenceCustomRule: {
          type: "string",
          nullable: true,
          description: "Custom RRULE for recurrence"
        },
        allowPreRegister: {
          type: "boolean",
          description: "Allow participants to pre-register before event day and check in on event day",
          example: false
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: "Disposable attendance created",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        organizationId: { type: "string" },
        title: { type: "string" },
        eventDateISO: { type: "string", format: "date" },
        publicId: { type: "string" }
      }
    }
  })
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
      postSubmitActionLink?: string;
      postSubmitActionLabel?: string;
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
      allowPreRegister?: boolean;
    },
    @Req() req: { user?: { orgId?: string; role?: string } }
  ) {
    this.assertOrgScope(body.orgId, req.user);
    return this.disposableService.create(body);
  }

  @Patch("disposable-attendance/:id")
  @ApiCookieAuth("cookieAuth")
  @ApiOperation({
    summary: "Update disposable attendance",
    description: "Modify an existing custom attendance form"
  })
  @ApiParam({
    name: "id",
    type: String,
    description: "Form ID",
    example: "form_123"
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["orgId"],
      properties: {
        orgId: { type: "string" },
        title: { type: "string" },
        description: { type: "string", nullable: true },
        location: { type: "string", nullable: true },
        postSubmitActionLink: { type: "string", nullable: true },
        postSubmitActionLabel: { type: "string", nullable: true },
        eventDateISO: { type: "string", format: "date" },
        fields: { type: "array", items: { type: "object" } },
        isRecurring: { type: "boolean" },
        recurrenceMode: { type: "string", enum: ["none", "daily", "weekly", "monthly", "custom"] },
        recurrenceEndDateISO: { type: "string", format: "date", nullable: true },
        recurrenceCustomRule: { type: "string", nullable: true },
        allowPreRegister: { type: "boolean" },
        isArchived: { type: "boolean" }
      }
    }
  })
  @ApiOkResponse({
    description: "Disposable attendance updated"
  })
  @ApiNotFoundResponse({ description: "Form not found" })
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
      postSubmitActionLink?: string;
      postSubmitActionLabel?: string;
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
      allowPreRegister?: boolean;
      isArchived?: boolean;
    },
    @Req() req: { user?: { orgId?: string; role?: string } }
  ) {
    this.assertOrgScope(body.orgId, req.user);
    return this.disposableService.update(id, body.orgId, body);
  }

  @Delete("disposable-attendance/:id")
  @ApiCookieAuth("cookieAuth")
  @ApiOperation({
    summary: "Delete disposable attendance",
    description: "Remove a custom attendance form from the organization"
  })
  @ApiParam({
    name: "id",
    type: String,
    description: "Form ID",
    example: "form_123"
  })
  @ApiQuery({
    name: "orgId",
    type: String,
    required: true,
    description: "Organization ID",
    example: "org_123abc"
  })
  @ApiOkResponse({
    description: "Disposable attendance deleted"
  })
  @ApiNotFoundResponse({ description: "Form not found" })
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
  @ApiParam({
    name: "id",
    type: String,
    description: "Form ID",
    example: "form_123"
  })
  @ApiQuery({
    name: "orgId",
    type: String,
    required: true,
    description: "Organization ID",
    example: "org_123abc"
  })
  @ApiOkResponse({
    description: "Disposable attendance responses returned"
  })
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
  @ApiOperation({
    summary: "Get disposable attendance responses formatted for table rendering",
    description: "Retrieve responses in a formatted structure optimized for UI table display"
  })
  @ApiParam({
    name: "id",
    type: String,
    description: "Form ID",
    example: "form_123"
  })
  @ApiQuery({
    name: "orgId",
    type: String,
    required: true,
    description: "Organization ID",
    example: "org_123abc"
  })
  @ApiOkResponse({
    description: "Formatted disposable attendance response table returned"
  })
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
  @ApiOperation({
    summary: "Update collected details (fields) for a disposable attendance",
    description: "Modify the custom fields that respondents need to fill"
  })
  @ApiParam({
    name: "id",
    type: String,
    description: "Form ID",
    example: "form_123"
  })
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
  @ApiOperation({
    summary: "Submit admin/manual disposable attendance response",
    description: "Create a response entry for a form as an administrator (manual entry)"
  })
  @ApiParam({
    name: "id",
    type: String,
    description: "Form ID",
    example: "form_123"
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["orgId", "values"],
      properties: {
        orgId: { type: "string" },
        values: {
          type: "object",
          additionalProperties: { type: "string" },
          description: "Field values submitted in the form"
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: "Admin response submitted"
  })
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

  @Post("disposable-attendance/:id/responses/:responseId/check-in")
  @ApiCookieAuth("cookieAuth")
  @ApiOperation({
    summary: "Check in a pre-registered attendee by response",
    description:
      "For pre-register enabled events, admin can check in an attendee directly from response rows"
  })
  @ApiParam({ name: "id", type: String, description: "Form ID", example: "form_123" })
  @ApiParam({
    name: "responseId",
    type: String,
    description: "Response ID",
    example: "resp_123"
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["orgId"],
      properties: {
        orgId: { type: "string" }
      }
    }
  })
  @ApiCreatedResponse({ description: "Attendee checked in" })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_attendance")
  checkInPreRegisteredResponse(
    @Param("id") id: string,
    @Param("responseId") responseId: string,
    @Body() body: { orgId: string },
    @Req() req: { user?: { orgId?: string; role?: string; id?: string } }
  ) {
    this.assertOrgScope(body.orgId, req.user);
    return this.disposableService.checkInPreRegisteredResponse(
      id,
      responseId,
      body.orgId,
      req.user?.id ?? ""
    );
  }

  @Patch("disposable-attendance/:id/responses/:responseId")
  @ApiCookieAuth("cookieAuth")
  @ApiOperation({
    summary: "Update disposable attendance response details",
    description: "Edit the collected details/values for an existing attendee response"
  })
  @ApiParam({ name: "id", type: String, description: "Form ID", example: "form_123" })
  @ApiParam({
    name: "responseId",
    type: String,
    description: "Response ID",
    example: "resp_123"
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["orgId", "values"],
      properties: {
        orgId: { type: "string" },
        values: {
          type: "object",
          additionalProperties: { type: "string" },
          description: "Updated field values"
        }
      }
    }
  })
  @ApiOkResponse({ description: "Response updated" })
  @ApiNotFoundResponse({ description: "Response not found" })
  @ApiForbiddenResponse({ description: "Authentication/authorization failed" })
  @UseGuards(AuthGuard("jwt"), PermissionsGuard)
  @Permissions("manage_attendance")
  updateResponse(
    @Param("id") id: string,
    @Param("responseId") responseId: string,
    @Body() body: { orgId: string; values: Record<string, string> },
    @Req() req: { user?: { orgId?: string; role?: string; id?: string } }
  ) {
    this.assertOrgScope(body.orgId, req.user);
    return this.disposableService.updateResponse(
      id,
      responseId,
      body.orgId,
      body.values,
      req.user?.id ?? ""
    );
  }

  @Get("disposable-attendance/:id/export.csv")
  @ApiCookieAuth("cookieAuth")
  @ApiOperation({
    summary: "Export disposable attendance responses as CSV",
    description: "Download all responses for a form as a CSV file"
  })
  @ApiParam({
    name: "id",
    type: String,
    description: "Form ID",
    example: "form_123"
  })
  @ApiQuery({
    name: "orgId",
    type: String,
    required: true,
    description: "Organization ID",
    example: "org_123abc"
  })
  @ApiOkResponse({
    description: "CSV export returned - binary file content"
  })
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
  @ApiOperation({
    summary: "Get public disposable attendance form",
    description: "Retrieve a publicly accessible attendance form using its public ID (no authentication required)"
  })
  @ApiParam({
    name: "publicId",
    type: String,
    description: "Public form ID",
    example: "pub_12345"
  })
  @ApiOkResponse({
    description: "Public disposable attendance form returned",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        description: { type: "string", nullable: true },
        location: { type: "string", nullable: true },
        eventDateISO: { type: "string", format: "date" },
        allowPreRegister: { type: "boolean" },
        postSubmitActionLink: { type: "string", nullable: true },
        postSubmitActionLabel: { type: "string", nullable: true },
        fields: { type: "array", items: { type: "object" } }
      }
    }
  })
  @ApiNotFoundResponse({ description: "Form not found or link expired" })
  getPublicForm(@Param("publicId") publicId: string) {
    return this.disposableService.getPublicForm(publicId);
  }

  @Post("public/disposable-attendance/:publicId/check-in")
  @ApiOperation({
    summary: "Submit public disposable attendance check-in",
    description: "Submit a response to a publicly accessible attendance form (no authentication required)"
  })
  @ApiParam({
    name: "publicId",
    type: String,
    description: "Public form ID",
    example: "pub_12345"
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["values"],
      properties: {
        action: {
          type: "string",
          enum: ["auto", "preregister", "checkin"],
          description: "Optional submit action to force pre-register or check-in flow"
        },
        values: {
          type: "object",
          additionalProperties: { type: "string" },
          description: "Form field values submitted by the respondent"
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: "Public check-in submitted",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Check-in submitted successfully." },
        action: {
          type: "string",
          enum: ["pre-registered", "already-preregistered", "checked-in"],
          example: "checked-in"
        },
        status: {
          type: "string",
          enum: ["preregistered", "checked-in"],
          example: "checked-in"
        },
        postSubmitActionLink: {
          type: "string",
          nullable: true,
          example: "https://chat.whatsapp.com/abc123"
        },
        postSubmitActionLabel: {
          type: "string",
          nullable: true,
          example: "Join WhatsApp group"
        }
      }
    }
  })
  @ApiNotFoundResponse({ description: "Form not found or link expired" })
  submitPublicResponse(
    @Param("publicId") publicId: string,
    @Body()
    body: {
      values: Record<string, string>;
      action?: "auto" | "preregister" | "checkin";
    }
  ) {
    return this.disposableService.submitPublicResponse(
      publicId,
      body.values,
      body.action ?? "auto"
    );
  }
}
