import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import type { DisposableRecurrenceMode, Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../notifications/email.service";

type DisposableFieldType =
  | "full-name"
  | "email"
  | "phone"
  | "occupation"
  | "address"
  | "text";

type DisposableField = {
  id: string;
  label: string;
  type: DisposableFieldType;
  required: boolean;
};

type ResponsesTableColumn = {
  key: string;
  label: string;
};

type ResponsesTableRow = {
  id: string;
  submittedAtISO: string;
  source: string;
  status: "preregistered" | "checked-in";
  preRegisteredAtISO: string | null;
  checkedInAtISO: string | null;
  values: Record<string, string>;
};

type CreateDisposablePayload = {
  orgId: string;
  title: string;
  description?: string;
  location?: string;
  postSubmitActionLink?: string;
  postSubmitActionLabel?: string;
  eventDateISO: string;
  fields: DisposableField[];
  isRecurring: boolean;
  recurrenceMode: DisposableRecurrenceMode;
  recurrenceEndDateISO?: string | null;
  recurrenceCustomRule?: string;
  allowPreRegister?: boolean;
};

type UpdateDisposablePayload = Partial<
  Omit<CreateDisposablePayload, "orgId"> & { isArchived: boolean }
>;

const FIELD_TYPES = new Set<DisposableFieldType>([
  "full-name",
  "email",
  "phone",
  "occupation",
  "address",
  "text"
]);

@Injectable()
export class DisposableAttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  private getTierLimit(tier: "free" | "plus" | "pro") {
    if (tier === "pro") return 25;
    if (tier === "plus") return 10;
    return 1;
  }

  private asFieldArray(fields: Prisma.JsonValue): DisposableField[] {
    if (!Array.isArray(fields)) return [];
    return fields.filter((item) => {
      if (!item || typeof item !== "object") return false;
      const value = item as Record<string, unknown>;
      return (
        typeof value.id === "string" &&
        typeof value.label === "string" &&
        typeof value.type === "string" &&
        typeof value.required === "boolean"
      );
    }) as DisposableField[];
  }

  private validateFields(fields: DisposableField[]) {
    if (!Array.isArray(fields) || fields.length === 0) {
      throw new BadRequestException("At least one field is required");
    }

    const seen = new Set<string>();
    let hasFullName = false;

    for (const field of fields) {
      if (!field?.id || !field?.label) {
        throw new BadRequestException("Field id and label are required");
      }
      if (seen.has(field.id)) {
        throw new BadRequestException(`Duplicate field id: ${field.id}`);
      }
      seen.add(field.id);

      if (!FIELD_TYPES.has(field.type)) {
        throw new BadRequestException(`Unsupported field type: ${field.type}`);
      }

      if (field.id === "full-name" && field.required) {
        hasFullName = true;
      }
    }

    if (!hasFullName) {
      throw new BadRequestException("A required full-name field is mandatory");
    }
  }

  private validateRecurring(payload: {
    isRecurring?: boolean;
    recurrenceMode?: DisposableRecurrenceMode;
    recurrenceEndDateISO?: string | null;
    recurrenceCustomRule?: string;
  }) {
    if (!payload.isRecurring) {
      return;
    }

    if (!payload.recurrenceMode || payload.recurrenceMode === "none") {
      throw new BadRequestException("Recurrence mode is required when recurring is enabled");
    }

    if (payload.recurrenceMode === "custom") {
      if (!payload.recurrenceCustomRule?.trim()) {
        throw new BadRequestException("Custom recurrence rule is required");
      }
    }
  }

  private sanitizeResponseValues(
    fields: DisposableField[],
    values: Record<string, string>
  ) {
    const output: Record<string, string> = {};

    for (const field of fields) {
      const raw = values?.[field.id];
      const normalized = typeof raw === "string" ? raw.trim() : "";

      if (field.required && !normalized) {
        throw new BadRequestException(`Missing required field: ${field.label}`);
      }

      output[field.id] = normalized;
    }

    return output;
  }

  private extractNormalizedEmail(values: Record<string, string>) {
    const raw = values.email;
    if (typeof raw !== "string") return "";
    return raw.trim().toLowerCase();
  }

  private todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  private normalizeActionLink(value?: string | null) {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) return null;

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new BadRequestException("Post-submit action link must be a valid URL");
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new BadRequestException(
        "Post-submit action link must start with http:// or https://"
      );
    }

    return parsed.toString();
  }

  private normalizeActionLabel(value?: string | null) {
    const trimmed = value?.trim() ?? "";
    return trimmed || null;
  }

  private toResponseDto(item: {
    id: string;
    attendanceId: string;
    source: string;
    submittedById: string | null;
    status: "preregistered" | "checked_in";
    preRegisteredAt: Date | null;
    checkedInAt: Date | null;
    createdAt: Date;
    values: Prisma.JsonValue;
  }) {
    return {
      id: item.id,
      attendanceId: item.attendanceId,
      source: item.source,
      submittedById: item.submittedById,
      status: item.status === "checked_in" ? "checked-in" : "preregistered",
      preRegisteredAtISO: item.preRegisteredAt?.toISOString() ?? null,
      checkedInAtISO: item.checkedInAt?.toISOString() ?? null,
      submittedAtISO: item.createdAt.toISOString(),
      values: (item.values ?? {}) as Record<string, string>
    };
  }

  private toPublicId() {
    return randomBytes(16).toString("hex");
  }

  private async notifyDisposableAttendeeStatus(params: {
    organizationId: string;
    eventTitle: string;
    eventDateISO: string;
    location: string;
    values: Record<string, string>;
    fallbackEmail?: string | null;
    statusLabel: "Pre-registered" | "Checked in";
    nextStepMessage: string;
  }) {
    const normalizedEmail =
      this.extractNormalizedEmail(params.values) ||
      params.fallbackEmail?.trim().toLowerCase() ||
      "";

    if (!normalizedEmail) {
      return;
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: params.organizationId },
      select: { name: true }
    });

    const attendeeName = params.values["full-name"] || "Attendee";
    await this.emailService.sendDisposableRegistrationSuccessEmail({
      to: normalizedEmail,
      attendeeName,
      eventTitle: params.eventTitle,
      eventDateISO: params.eventDateISO,
      location: params.location,
      organizationName: organization?.name || "Organization",
      statusLabel: params.statusLabel,
      nextStepMessage: params.nextStepMessage
    });
  }

  async listByOrg(orgId: string) {
    const items = await this.prisma.disposableAttendance.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" }
    });

    return items.map((item) => ({
      id: item.id,
      publicId: item.publicId,
      orgId: item.organizationId,
      title: item.title,
      description: item.description,
      location: item.location,
      eventDateISO: item.eventDateISO,
      fields: this.asFieldArray(item.fields),
      isRecurring: item.isRecurring,
      recurrenceMode: item.recurrenceMode,
      recurrenceEndDateISO: item.recurrenceEndDateISO,
      recurrenceCustomRule: item.recurrenceCustomRule,
      allowPreRegister: item.allowPreRegister,
      postSubmitActionLink: item.postSubmitActionLink,
      postSubmitActionLabel: item.postSubmitActionLabel,
      isArchived: item.isArchived,
      createdAtISO: item.createdAt.toISOString(),
      updatedAtISO: item.updatedAt.toISOString()
    }));
  }

  async create(payload: CreateDisposablePayload) {
    if (!payload.title?.trim()) {
      throw new BadRequestException("Title is required");
    }
    if (!payload.eventDateISO?.trim()) {
      throw new BadRequestException("Event date is required");
    }

    this.validateFields(payload.fields);
    this.validateRecurring(payload);
    const normalizedActionLink = this.normalizeActionLink(payload.postSubmitActionLink);
    const normalizedActionLabel = this.normalizeActionLabel(payload.postSubmitActionLabel);
    if (payload.allowPreRegister && !payload.fields.some((field) => field.id === "email")) {
      throw new BadRequestException("Email field is required when pre-register is enabled");
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: payload.orgId },
      select: { id: true, name: true, planTier: true, adminEmails: true }
    });

    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    const limit = this.getTierLimit(organization.planTier);
    const count = await this.prisma.disposableAttendance.count({
      where: { organizationId: payload.orgId }
    });

    if (count >= limit) {
      throw new BadRequestException("Disposable attendance limit reached for current plan tier");
    }

    const created = await this.prisma.disposableAttendance.create({
      data: {
        publicId: this.toPublicId(),
        organizationId: payload.orgId,
        title: payload.title.trim(),
        description: payload.description?.trim() ?? "",
        location: payload.location?.trim() ?? "",
        eventDateISO: payload.eventDateISO,
        fields: payload.fields as unknown as Prisma.InputJsonValue,
        isRecurring: payload.isRecurring,
        recurrenceMode: payload.isRecurring ? payload.recurrenceMode : "none",
        recurrenceEndDateISO:
          payload.isRecurring && payload.recurrenceMode !== "custom"
            ? payload.recurrenceEndDateISO ?? null
            : null,
        recurrenceCustomRule:
          payload.isRecurring && payload.recurrenceMode === "custom"
            ? payload.recurrenceCustomRule?.trim() ?? ""
            : "",
        allowPreRegister: payload.allowPreRegister ?? false,
        postSubmitActionLink: normalizedActionLink,
        postSubmitActionLabel: normalizedActionLabel
      }
    });

    void this.emailService
      .sendOrganizationActivityEmail({
        organizationName: organization.name,
        adminEmails: organization.adminEmails,
        activityType: "Event Created",
        summary: `A new event (${created.title}) was created.`,
        details: [
          { label: "Title", value: created.title },
          { label: "Event Date", value: created.eventDateISO },
          {
            label: "Recurrence",
            value: created.isRecurring ? created.recurrenceMode : "none"
          },
          { label: "Event ID", value: created.id }
        ]
      })
      .catch(() => undefined);

    return {
      id: created.id,
      publicId: created.publicId,
      orgId: created.organizationId,
      title: created.title,
      description: created.description,
      location: created.location,
      eventDateISO: created.eventDateISO,
      fields: this.asFieldArray(created.fields),
      isRecurring: created.isRecurring,
      recurrenceMode: created.recurrenceMode,
      recurrenceEndDateISO: created.recurrenceEndDateISO,
      recurrenceCustomRule: created.recurrenceCustomRule,
      allowPreRegister: created.allowPreRegister,
      postSubmitActionLink: created.postSubmitActionLink,
      postSubmitActionLabel: created.postSubmitActionLabel,
      isArchived: created.isArchived,
      createdAtISO: created.createdAt.toISOString(),
      updatedAtISO: created.updatedAt.toISOString()
    };
  }

  async update(id: string, orgId: string, updates: UpdateDisposablePayload) {
    const existing = await this.prisma.disposableAttendance.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== orgId) {
      throw new NotFoundException("Disposable attendance not found");
    }

    if (updates.fields) {
      this.validateFields(updates.fields);
    }
    const nextAllowPreRegister = updates.allowPreRegister ?? existing.allowPreRegister;
    const nextFields = updates.fields ?? this.asFieldArray(existing.fields);
    if (nextAllowPreRegister && !nextFields.some((field) => field.id === "email")) {
      throw new BadRequestException("Email field is required when pre-register is enabled");
    }
    const normalizedActionLink =
      updates.postSubmitActionLink !== undefined
        ? this.normalizeActionLink(updates.postSubmitActionLink)
        : undefined;
    const normalizedActionLabel =
      updates.postSubmitActionLabel !== undefined
        ? this.normalizeActionLabel(updates.postSubmitActionLabel)
        : undefined;

    this.validateRecurring({
      isRecurring: updates.isRecurring ?? existing.isRecurring,
      recurrenceMode: updates.recurrenceMode ?? existing.recurrenceMode,
      recurrenceEndDateISO: updates.recurrenceEndDateISO ?? existing.recurrenceEndDateISO,
      recurrenceCustomRule: updates.recurrenceCustomRule ?? existing.recurrenceCustomRule
    });

    const next = await this.prisma.disposableAttendance.update({
      where: { id },
      data: {
        title: updates.title?.trim(),
        description: updates.description?.trim(),
        location: updates.location?.trim(),
        eventDateISO: updates.eventDateISO,
        fields: updates.fields
          ? (updates.fields as unknown as Prisma.InputJsonValue)
          : undefined,
        isRecurring: updates.isRecurring,
        recurrenceMode: updates.recurrenceMode,
        recurrenceEndDateISO: updates.recurrenceEndDateISO,
        recurrenceCustomRule:
          updates.recurrenceCustomRule !== undefined
            ? updates.recurrenceCustomRule.trim()
            : undefined,
        allowPreRegister: updates.allowPreRegister,
        postSubmitActionLink: normalizedActionLink,
        postSubmitActionLabel: normalizedActionLabel,
        isArchived: updates.isArchived
      }
    });

    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, adminEmails: true }
    });

    if (organization) {
      void this.emailService
        .sendOrganizationActivityEmail({
          organizationName: organization.name,
          adminEmails: organization.adminEmails,
          activityType: "Event Updated",
          summary: `Event (${next.title}) details were updated.`,
          details: [
            { label: "Title", value: next.title },
            { label: "Event Date", value: next.eventDateISO },
            {
              label: "Recurrence",
              value: next.isRecurring ? next.recurrenceMode : "none"
            },
            { label: "Event ID", value: next.id }
          ]
        })
        .catch(() => undefined);
    }

    return {
      id: next.id,
      publicId: next.publicId,
      orgId: next.organizationId,
      title: next.title,
      description: next.description,
      location: next.location,
      eventDateISO: next.eventDateISO,
      fields: this.asFieldArray(next.fields),
      isRecurring: next.isRecurring,
      recurrenceMode: next.recurrenceMode,
      recurrenceEndDateISO: next.recurrenceEndDateISO,
      recurrenceCustomRule: next.recurrenceCustomRule,
      allowPreRegister: next.allowPreRegister,
      postSubmitActionLink: next.postSubmitActionLink,
      postSubmitActionLabel: next.postSubmitActionLabel,
      isArchived: next.isArchived,
      createdAtISO: next.createdAt.toISOString(),
      updatedAtISO: next.updatedAt.toISOString()
    };
  }

  async remove(id: string, orgId: string) {
    const existing = await this.prisma.disposableAttendance.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== orgId) {
      throw new NotFoundException("Disposable attendance not found");
    }

    await this.prisma.disposableAttendance.delete({ where: { id } });

    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, adminEmails: true }
    });

    if (organization) {
      void this.emailService
        .sendOrganizationActivityEmail({
          organizationName: organization.name,
          adminEmails: organization.adminEmails,
          activityType: "Event Removed",
          summary: `Event (${existing.title}) was removed.`,
          details: [
            { label: "Title", value: existing.title },
            { label: "Event Date", value: existing.eventDateISO },
            { label: "Event ID", value: existing.id }
          ]
        })
        .catch(() => undefined);
    }

    return { ok: true };
  }

  async listResponses(attendanceId: string, orgId: string) {
    const attendance = await this.prisma.disposableAttendance.findUnique({
      where: { id: attendanceId }
    });

    if (!attendance || attendance.organizationId !== orgId) {
      throw new NotFoundException("Disposable attendance not found");
    }

    const responses = await this.prisma.disposableAttendanceResponse.findMany({
      where: { attendanceId },
      orderBy: { createdAt: "desc" }
    });

    return responses.map((item) => this.toResponseDto(item));
  }

  async updateCollectedFields(
    attendanceId: string,
    orgId: string,
    fields: DisposableField[]
  ) {
    this.validateFields(fields);

    const existing = await this.prisma.disposableAttendance.findUnique({
      where: { id: attendanceId }
    });

    if (!existing || existing.organizationId !== orgId) {
      throw new NotFoundException("Disposable attendance not found");
    }
    if (existing.allowPreRegister && !fields.some((field) => field.id === "email")) {
      throw new BadRequestException("Email field is required when pre-register is enabled");
    }

    const updated = await this.prisma.disposableAttendance.update({
      where: { id: attendanceId },
      data: {
        fields: fields as unknown as Prisma.InputJsonValue
      }
    });

    return {
      id: updated.id,
      publicId: updated.publicId,
      orgId: updated.organizationId,
      title: updated.title,
      description: updated.description,
      location: updated.location,
      eventDateISO: updated.eventDateISO,
      fields: this.asFieldArray(updated.fields),
      isRecurring: updated.isRecurring,
      recurrenceMode: updated.recurrenceMode,
      recurrenceEndDateISO: updated.recurrenceEndDateISO,
      recurrenceCustomRule: updated.recurrenceCustomRule,
      allowPreRegister: updated.allowPreRegister,
      isArchived: updated.isArchived,
      createdAtISO: updated.createdAt.toISOString(),
      updatedAtISO: updated.updatedAt.toISOString()
    };
  }

  async getResponsesTable(attendanceId: string, orgId: string) {
    const attendance = await this.prisma.disposableAttendance.findUnique({
      where: { id: attendanceId }
    });

    if (!attendance || attendance.organizationId !== orgId) {
      throw new NotFoundException("Disposable attendance not found");
    }

    const fields = this.asFieldArray(attendance.fields);
    const responses = await this.prisma.disposableAttendanceResponse.findMany({
      where: { attendanceId },
      orderBy: { createdAt: "desc" }
    });

    const columns: ResponsesTableColumn[] = [
      { key: "submittedAtISO", label: "Submitted" },
      { key: "status", label: "Status" },
      { key: "checkedInAtISO", label: "Checked in" },
      ...fields.map((field) => ({ key: field.id, label: field.label }))
    ];

    const rows: ResponsesTableRow[] = responses.map((response) => {
      const saved = (response.values ?? {}) as Record<string, string>;
      const alignedValues = Object.fromEntries(
        fields.map((field) => [field.id, saved[field.id] ?? ""])
      );

      return {
        id: response.id,
        submittedAtISO: response.createdAt.toISOString(),
        source: response.source,
        status: response.status === "checked_in" ? "checked-in" : "preregistered",
        preRegisteredAtISO: response.preRegisteredAt?.toISOString() ?? null,
        checkedInAtISO: response.checkedInAt?.toISOString() ?? null,
        values: alignedValues
      };
    });

    return {
      attendanceId: attendance.id,
      attendanceTitle: attendance.title,
      columns,
      rows
    };
  }

  async submitAdminResponse(
    attendanceId: string,
    orgId: string,
    values: Record<string, string>,
    adminUserId: string
  ) {
    const attendance = await this.prisma.disposableAttendance.findUnique({
      where: { id: attendanceId }
    });

    if (!attendance || attendance.organizationId !== orgId) {
      throw new NotFoundException("Disposable attendance not found");
    }
    if (attendance.isArchived) {
      throw new BadRequestException("This disposable attendance is archived");
    }

    const fields = this.asFieldArray(attendance.fields);
    const sanitized = this.sanitizeResponseValues(fields, values);
    const normalizedEmail = this.extractNormalizedEmail(sanitized) || null;
    const now = new Date();

    if (normalizedEmail) {
      const existing = await this.prisma.disposableAttendanceResponse.findFirst({
        where: {
          attendanceId,
          emailNormalized: normalizedEmail
        }
      });

      if (existing) {
        const mergedValues = {
          ...((existing.values ?? {}) as Record<string, string>),
          ...sanitized
        };
        const updated = await this.prisma.disposableAttendanceResponse.update({
          where: { id: existing.id },
          data: {
            source: "admin",
            submittedById: adminUserId,
            status: "checked_in",
            checkedInAt: now,
            values: mergedValues as unknown as Prisma.InputJsonValue
          }
        });

        void this.notifyDisposableAttendeeStatus({
          organizationId: attendance.organizationId,
          eventTitle: attendance.title,
          eventDateISO: attendance.eventDateISO,
          location: attendance.location,
          values: mergedValues,
          fallbackEmail: normalizedEmail,
          statusLabel: "Checked in",
          nextStepMessage: "Your attendance is confirmed. See you at the event."
        }).catch(() => undefined);

        return {
          id: updated.id,
          attendanceId: updated.attendanceId,
          source: updated.source,
          submittedById: updated.submittedById,
          status: "checked-in",
          preRegisteredAtISO: updated.preRegisteredAt?.toISOString() ?? null,
          checkedInAtISO: updated.checkedInAt?.toISOString() ?? null,
          submittedAtISO: updated.createdAt.toISOString(),
          values: mergedValues
        };
      }
    }

    const created = await this.prisma.disposableAttendanceResponse.create({
      data: {
        attendanceId,
        source: "admin",
        submittedById: adminUserId,
        status: "checked_in",
        emailNormalized: normalizedEmail,
        checkedInAt: now,
        values: sanitized as unknown as Prisma.InputJsonValue
      }
    });

    void this.notifyDisposableAttendeeStatus({
      organizationId: attendance.organizationId,
      eventTitle: attendance.title,
      eventDateISO: attendance.eventDateISO,
      location: attendance.location,
      values: sanitized,
      fallbackEmail: normalizedEmail,
      statusLabel: "Checked in",
      nextStepMessage: "Your attendance is confirmed. See you at the event."
    }).catch(() => undefined);

    return {
      id: created.id,
      attendanceId: created.attendanceId,
      source: created.source,
      submittedById: created.submittedById,
      status: "checked-in",
      preRegisteredAtISO: created.preRegisteredAt?.toISOString() ?? null,
      checkedInAtISO: created.checkedInAt?.toISOString() ?? null,
      submittedAtISO: created.createdAt.toISOString(),
      values: sanitized
    };
  }

  async checkInPreRegisteredResponse(
    attendanceId: string,
    responseId: string,
    orgId: string,
    adminUserId: string
  ) {
    const attendance = await this.prisma.disposableAttendance.findUnique({
      where: { id: attendanceId }
    });

    if (!attendance || attendance.organizationId !== orgId) {
      throw new NotFoundException("Disposable attendance not found");
    }
    if (!attendance.allowPreRegister) {
      throw new BadRequestException(
        "Pre-register must be enabled to use response-level check-in"
      );
    }

    const response = await this.prisma.disposableAttendanceResponse.findFirst({
      where: {
        id: responseId,
        attendanceId
      }
    });

    if (!response) {
      throw new NotFoundException("Response not found");
    }
    if (!response.preRegisteredAt) {
      throw new BadRequestException(
        "Only pre-registered responses can be checked in"
      );
    }

    if (response.status === "checked_in") {
      return {
        ...this.toResponseDto(response),
        action: "checked-in",
        message: "Attendee is already checked in."
      };
    }

    const updated = await this.prisma.disposableAttendanceResponse.update({
      where: { id: response.id },
      data: {
        source: "admin",
        submittedById: adminUserId,
        status: "checked_in",
        checkedInAt: new Date()
      }
    });

    void this.notifyDisposableAttendeeStatus({
      organizationId: attendance.organizationId,
      eventTitle: attendance.title,
      eventDateISO: attendance.eventDateISO,
      location: attendance.location,
      values: (updated.values ?? {}) as Record<string, string>,
      fallbackEmail: updated.emailNormalized,
      statusLabel: "Checked in",
      nextStepMessage: "Your attendance is confirmed. See you at the event."
    }).catch(() => undefined);

    return {
      ...this.toResponseDto(updated),
      action: "checked-in",
      message: "Attendee checked in successfully."
    };
  }

  async updateResponse(
    attendanceId: string,
    responseId: string,
    orgId: string,
    values: Record<string, string>,
    adminUserId: string
  ) {
    const attendance = await this.prisma.disposableAttendance.findUnique({
      where: { id: attendanceId }
    });

    if (!attendance || attendance.organizationId !== orgId) {
      throw new NotFoundException("Disposable attendance not found");
    }

    const response = await this.prisma.disposableAttendanceResponse.findFirst({
      where: {
        id: responseId,
        attendanceId
      }
    });

    if (!response) {
      throw new NotFoundException("Response not found");
    }

    // Validate field values match the attendance fields
    const fields = this.asFieldArray(attendance.fields);
    const fieldIds = new Set(fields.map((f) => f.id));

    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(values)) {
      if (fieldIds.has(key) && typeof value === "string") {
        sanitized[key] = value.trim();
      }
    }

    // Extract email for normalization
    let emailNormalized: string | null = null;
    const emailField = fields.find((f) => f.type === "email");
    if (emailField && sanitized[emailField.id]) {
      emailNormalized = sanitized[emailField.id].toLowerCase().trim();
    }

    const updated = await this.prisma.disposableAttendanceResponse.update({
      where: { id: response.id },
      data: {
        values: sanitized as unknown as Prisma.InputJsonValue,
        emailNormalized,
        submittedById: adminUserId,
        source: "admin"
      }
    });

    return this.toResponseDto(updated);
  }

  async getPublicForm(publicId: string) {
    const item = await this.prisma.disposableAttendance.findUnique({
      where: { publicId }
    });

    if (!item) {
      throw new NotFoundException("Disposable attendance form not found");
    }

    return {
      publicId: item.publicId,
      title: item.title,
      description: item.description,
      location: item.location,
      eventDateISO: item.eventDateISO,
      fields: this.asFieldArray(item.fields),
      isArchived: item.isArchived,
      isRecurring: item.isRecurring,
      recurrenceMode: item.recurrenceMode,
      recurrenceEndDateISO: item.recurrenceEndDateISO,
      recurrenceCustomRule: item.recurrenceCustomRule,
      allowPreRegister: item.allowPreRegister,
      postSubmitActionLink: item.postSubmitActionLink,
      postSubmitActionLabel: item.postSubmitActionLabel
    };
  }

  async submitPublicResponse(
    publicId: string,
    values: Record<string, string>,
    action: "auto" | "preregister" | "checkin" = "auto"
  ) {
    const attendance = await this.prisma.disposableAttendance.findUnique({
      where: { publicId }
    });

    if (!attendance) {
      throw new NotFoundException("Disposable attendance form not found");
    }
    if (attendance.isArchived) {
      throw new BadRequestException("This disposable attendance is closed");
    }

    const fields = this.asFieldArray(attendance.fields);
    const todayISO = this.todayISO();
    const normalizedEmail = this.extractNormalizedEmail(values);

    if (attendance.allowPreRegister) {
      if (!normalizedEmail) {
        throw new BadRequestException("Email is required for pre-register/check-in");
      }

      const existing = await this.prisma.disposableAttendanceResponse.findFirst({
        where: {
          attendanceId: attendance.id,
          emailNormalized: normalizedEmail
        }
      });

      const wantsCheckIn = action === "checkin";
      const isBeforeEvent = todayISO < attendance.eventDateISO;
      const isAfterEvent = todayISO > attendance.eventDateISO;

      if (wantsCheckIn && isBeforeEvent) {
        throw new BadRequestException("Check-in is only available on event day");
      }

      if (isAfterEvent) {
        throw new BadRequestException("This event check-in window has closed");
      }

      if (action === "preregister" || isBeforeEvent) {
        const sanitized = this.sanitizeResponseValues(fields, values);

        if (existing?.status === "checked_in") {
          return {
            id: existing.id,
            attendanceId: existing.attendanceId,
            source: existing.source,
            status: "checked-in",
            preRegisteredAtISO: existing.preRegisteredAt?.toISOString() ?? null,
            checkedInAtISO: existing.checkedInAt?.toISOString() ?? null,
            submittedAtISO: existing.createdAt.toISOString(),
            action: "checked-in",
            message: "This attendee is already checked in.",
            postSubmitActionLink: attendance.postSubmitActionLink,
            postSubmitActionLabel: attendance.postSubmitActionLabel,
            values: (existing.values ?? {}) as Record<string, string>
          };
        }

        if (existing) {
          const updated = await this.prisma.disposableAttendanceResponse.update({
            where: { id: existing.id },
            data: {
              values: sanitized as unknown as Prisma.InputJsonValue,
              status: "preregistered",
              preRegisteredAt: existing.preRegisteredAt ?? new Date(),
              checkedInAt: null
            }
          });

          void this.notifyDisposableAttendeeStatus({
            organizationId: attendance.organizationId,
            eventTitle: attendance.title,
            eventDateISO: attendance.eventDateISO,
            location: attendance.location,
            values: sanitized,
            fallbackEmail: normalizedEmail,
            statusLabel: "Pre-registered",
            nextStepMessage:
              "Please scan the event QR code again on event day to complete your check-in."
          }).catch(() => undefined);

          return {
            id: updated.id,
            attendanceId: updated.attendanceId,
            source: updated.source,
            status: "preregistered",
            preRegisteredAtISO: updated.preRegisteredAt?.toISOString() ?? null,
            checkedInAtISO: updated.checkedInAt?.toISOString() ?? null,
            submittedAtISO: updated.createdAt.toISOString(),
            action: "already-preregistered",
            message: "You are already pre-registered for this event.",
            postSubmitActionLink: attendance.postSubmitActionLink,
            postSubmitActionLabel: attendance.postSubmitActionLabel,
            values: sanitized
          };
        }

        const created = await this.prisma.disposableAttendanceResponse.create({
          data: {
            attendanceId: attendance.id,
            source: "public",
            status: "preregistered",
            emailNormalized: normalizedEmail,
            preRegisteredAt: new Date(),
            values: sanitized as unknown as Prisma.InputJsonValue
          }
        });

        void this.notifyDisposableAttendeeStatus({
          organizationId: attendance.organizationId,
          eventTitle: attendance.title,
          eventDateISO: attendance.eventDateISO,
          location: attendance.location,
          values: sanitized,
          fallbackEmail: normalizedEmail,
          statusLabel: "Pre-registered",
          nextStepMessage:
            "Please scan the event QR code again on event day to complete your check-in."
        }).catch(() => undefined);

        return {
          id: created.id,
          attendanceId: created.attendanceId,
          source: created.source,
          status: "preregistered",
          preRegisteredAtISO: created.preRegisteredAt?.toISOString() ?? null,
          checkedInAtISO: created.checkedInAt?.toISOString() ?? null,
          submittedAtISO: created.createdAt.toISOString(),
          action: "pre-registered",
          message: "Pre-registration successful. Please scan again on event day to check in.",
          postSubmitActionLink: attendance.postSubmitActionLink,
          postSubmitActionLabel: attendance.postSubmitActionLabel,
          values: sanitized
        };
      }

      if (existing) {
        const mergedValues = {
          ...((existing.values ?? {}) as Record<string, string>),
          email: normalizedEmail
        };
        const updated = await this.prisma.disposableAttendanceResponse.update({
          where: { id: existing.id },
          data: {
            status: "checked_in",
            checkedInAt: new Date(),
            values: mergedValues as unknown as Prisma.InputJsonValue
          }
        });

        void this.notifyDisposableAttendeeStatus({
          organizationId: attendance.organizationId,
          eventTitle: attendance.title,
          eventDateISO: attendance.eventDateISO,
          location: attendance.location,
          values: mergedValues,
          fallbackEmail: normalizedEmail,
          statusLabel: "Checked in",
          nextStepMessage: "Your attendance is confirmed. See you at the event."
        }).catch(() => undefined);

        return {
          id: updated.id,
          attendanceId: updated.attendanceId,
          source: updated.source,
          status: "checked-in",
          preRegisteredAtISO: updated.preRegisteredAt?.toISOString() ?? null,
          checkedInAtISO: updated.checkedInAt?.toISOString() ?? null,
          submittedAtISO: updated.createdAt.toISOString(),
          action: "checked-in",
          message: "Welcome back. Your attendance has been checked in.",
          postSubmitActionLink: attendance.postSubmitActionLink,
          postSubmitActionLabel: attendance.postSubmitActionLabel,
          values: (updated.values ?? {}) as Record<string, string>
        };
      }

      throw new BadRequestException(
        "Please register first before checking in."
      );
    }

    const sanitized = this.sanitizeResponseValues(fields, values);
    const normalizedCreatedEmail = this.extractNormalizedEmail(sanitized);
    const created = await this.prisma.disposableAttendanceResponse.create({
      data: {
        attendanceId: attendance.id,
        source: "public",
        status: "checked_in",
        emailNormalized: normalizedCreatedEmail || null,
        checkedInAt: new Date(),
        values: sanitized as unknown as Prisma.InputJsonValue
      }
    });

    if (normalizedCreatedEmail) {
      void this.notifyDisposableAttendeeStatus({
        organizationId: attendance.organizationId,
        eventTitle: attendance.title,
        eventDateISO: attendance.eventDateISO,
        location: attendance.location,
        values: sanitized,
        fallbackEmail: normalizedCreatedEmail,
        statusLabel: "Checked in",
        nextStepMessage: "Your attendance is confirmed. See you at the event."
      }).catch(() => undefined);
    }

    return {
      id: created.id,
      attendanceId: created.attendanceId,
      source: created.source,
      status: "checked-in",
      preRegisteredAtISO: created.preRegisteredAt?.toISOString() ?? null,
      checkedInAtISO: created.checkedInAt?.toISOString() ?? null,
      submittedAtISO: created.createdAt.toISOString(),
      action: "checked-in",
      message: "Check-in submitted successfully.",
      postSubmitActionLink: attendance.postSubmitActionLink,
      postSubmitActionLabel: attendance.postSubmitActionLabel,
      values: sanitized
    };
  }

  async exportCsv(attendanceId: string, orgId: string) {
    const attendance = await this.prisma.disposableAttendance.findUnique({
      where: { id: attendanceId }
    });

    if (!attendance || attendance.organizationId !== orgId) {
      throw new NotFoundException("Disposable attendance not found");
    }

    const fields = this.asFieldArray(attendance.fields);
    const responses = await this.prisma.disposableAttendanceResponse.findMany({
      where: { attendanceId },
      orderBy: { createdAt: "asc" }
    });

    const headers = [
      "submittedAtISO",
      "source",
      "status",
      "preRegisteredAtISO",
      "checkedInAtISO",
      ...fields.map((field) => field.label)
    ];

    const csvRows = responses.map((response) => {
      const values = (response.values ?? {}) as Record<string, string>;
      return [
        response.createdAt.toISOString(),
        response.source,
        response.status,
        response.preRegisteredAt?.toISOString() ?? "",
        response.checkedInAt?.toISOString() ?? "",
        ...fields.map((field) => values[field.id] ?? "")
      ];
    });

    const csv = [headers, ...csvRows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    return {
      filename: `${attendance.title.toLowerCase().replace(/\s+/g, "-")}-disposable-attendance.csv`,
      content: csv
    };
  }
}
