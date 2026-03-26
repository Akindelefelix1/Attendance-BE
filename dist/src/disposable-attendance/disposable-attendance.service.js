"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisposableAttendanceService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const FIELD_TYPES = new Set([
    "full-name",
    "email",
    "phone",
    "occupation",
    "address",
    "text"
]);
let DisposableAttendanceService = class DisposableAttendanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getTierLimit(tier) {
        if (tier === "pro")
            return 25;
        if (tier === "plus")
            return 10;
        return 1;
    }
    asFieldArray(fields) {
        if (!Array.isArray(fields))
            return [];
        return fields.filter((item) => {
            if (!item || typeof item !== "object")
                return false;
            const value = item;
            return (typeof value.id === "string" &&
                typeof value.label === "string" &&
                typeof value.type === "string" &&
                typeof value.required === "boolean");
        });
    }
    validateFields(fields) {
        if (!Array.isArray(fields) || fields.length === 0) {
            throw new common_1.BadRequestException("At least one field is required");
        }
        const seen = new Set();
        let hasFullName = false;
        for (const field of fields) {
            if (!field?.id || !field?.label) {
                throw new common_1.BadRequestException("Field id and label are required");
            }
            if (seen.has(field.id)) {
                throw new common_1.BadRequestException(`Duplicate field id: ${field.id}`);
            }
            seen.add(field.id);
            if (!FIELD_TYPES.has(field.type)) {
                throw new common_1.BadRequestException(`Unsupported field type: ${field.type}`);
            }
            if (field.id === "full-name" && field.required) {
                hasFullName = true;
            }
        }
        if (!hasFullName) {
            throw new common_1.BadRequestException("A required full-name field is mandatory");
        }
    }
    validateRecurring(payload) {
        if (!payload.isRecurring) {
            return;
        }
        if (!payload.recurrenceMode || payload.recurrenceMode === "none") {
            throw new common_1.BadRequestException("Recurrence mode is required when recurring is enabled");
        }
        if (payload.recurrenceMode === "custom") {
            if (!payload.recurrenceCustomRule?.trim()) {
                throw new common_1.BadRequestException("Custom recurrence rule is required");
            }
        }
    }
    sanitizeResponseValues(fields, values) {
        const output = {};
        for (const field of fields) {
            const raw = values?.[field.id];
            const normalized = typeof raw === "string" ? raw.trim() : "";
            if (field.required && !normalized) {
                throw new common_1.BadRequestException(`Missing required field: ${field.label}`);
            }
            output[field.id] = normalized;
        }
        return output;
    }
    toPublicId() {
        return (0, crypto_1.randomBytes)(16).toString("hex");
    }
    async listByOrg(orgId) {
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
            isArchived: item.isArchived,
            createdAtISO: item.createdAt.toISOString(),
            updatedAtISO: item.updatedAt.toISOString()
        }));
    }
    async create(payload) {
        if (!payload.title?.trim()) {
            throw new common_1.BadRequestException("Title is required");
        }
        if (!payload.eventDateISO?.trim()) {
            throw new common_1.BadRequestException("Event date is required");
        }
        this.validateFields(payload.fields);
        this.validateRecurring(payload);
        const organization = await this.prisma.organization.findUnique({
            where: { id: payload.orgId },
            select: { id: true, planTier: true }
        });
        if (!organization) {
            throw new common_1.NotFoundException("Organization not found");
        }
        const limit = this.getTierLimit(organization.planTier);
        const count = await this.prisma.disposableAttendance.count({
            where: { organizationId: payload.orgId }
        });
        if (count >= limit) {
            throw new common_1.BadRequestException("Disposable attendance limit reached for current plan tier");
        }
        const created = await this.prisma.disposableAttendance.create({
            data: {
                publicId: this.toPublicId(),
                organizationId: payload.orgId,
                title: payload.title.trim(),
                description: payload.description?.trim() ?? "",
                location: payload.location?.trim() ?? "",
                eventDateISO: payload.eventDateISO,
                fields: payload.fields,
                isRecurring: payload.isRecurring,
                recurrenceMode: payload.isRecurring ? payload.recurrenceMode : "none",
                recurrenceEndDateISO: payload.isRecurring && payload.recurrenceMode !== "custom"
                    ? payload.recurrenceEndDateISO ?? null
                    : null,
                recurrenceCustomRule: payload.isRecurring && payload.recurrenceMode === "custom"
                    ? payload.recurrenceCustomRule?.trim() ?? ""
                    : ""
            }
        });
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
            isArchived: created.isArchived,
            createdAtISO: created.createdAt.toISOString(),
            updatedAtISO: created.updatedAt.toISOString()
        };
    }
    async update(id, orgId, updates) {
        const existing = await this.prisma.disposableAttendance.findUnique({ where: { id } });
        if (!existing || existing.organizationId !== orgId) {
            throw new common_1.NotFoundException("Disposable attendance not found");
        }
        if (updates.fields) {
            this.validateFields(updates.fields);
        }
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
                    ? updates.fields
                    : undefined,
                isRecurring: updates.isRecurring,
                recurrenceMode: updates.recurrenceMode,
                recurrenceEndDateISO: updates.recurrenceEndDateISO,
                recurrenceCustomRule: updates.recurrenceCustomRule !== undefined
                    ? updates.recurrenceCustomRule.trim()
                    : undefined,
                isArchived: updates.isArchived
            }
        });
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
            isArchived: next.isArchived,
            createdAtISO: next.createdAt.toISOString(),
            updatedAtISO: next.updatedAt.toISOString()
        };
    }
    async remove(id, orgId) {
        const existing = await this.prisma.disposableAttendance.findUnique({ where: { id } });
        if (!existing || existing.organizationId !== orgId) {
            throw new common_1.NotFoundException("Disposable attendance not found");
        }
        await this.prisma.disposableAttendance.delete({ where: { id } });
        return { ok: true };
    }
    async listResponses(attendanceId, orgId) {
        const attendance = await this.prisma.disposableAttendance.findUnique({
            where: { id: attendanceId }
        });
        if (!attendance || attendance.organizationId !== orgId) {
            throw new common_1.NotFoundException("Disposable attendance not found");
        }
        const responses = await this.prisma.disposableAttendanceResponse.findMany({
            where: { attendanceId },
            orderBy: { createdAt: "desc" }
        });
        return responses.map((item) => ({
            id: item.id,
            attendanceId: item.attendanceId,
            source: item.source,
            submittedById: item.submittedById,
            submittedAtISO: item.createdAt.toISOString(),
            values: (item.values ?? {})
        }));
    }
    async updateCollectedFields(attendanceId, orgId, fields) {
        this.validateFields(fields);
        const existing = await this.prisma.disposableAttendance.findUnique({
            where: { id: attendanceId }
        });
        if (!existing || existing.organizationId !== orgId) {
            throw new common_1.NotFoundException("Disposable attendance not found");
        }
        const updated = await this.prisma.disposableAttendance.update({
            where: { id: attendanceId },
            data: {
                fields: fields
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
            isArchived: updated.isArchived,
            createdAtISO: updated.createdAt.toISOString(),
            updatedAtISO: updated.updatedAt.toISOString()
        };
    }
    async getResponsesTable(attendanceId, orgId) {
        const attendance = await this.prisma.disposableAttendance.findUnique({
            where: { id: attendanceId }
        });
        if (!attendance || attendance.organizationId !== orgId) {
            throw new common_1.NotFoundException("Disposable attendance not found");
        }
        const fields = this.asFieldArray(attendance.fields);
        const responses = await this.prisma.disposableAttendanceResponse.findMany({
            where: { attendanceId },
            orderBy: { createdAt: "desc" }
        });
        const columns = [
            { key: "submittedAtISO", label: "Submitted" },
            ...fields.map((field) => ({ key: field.id, label: field.label }))
        ];
        const rows = responses.map((response) => {
            const saved = (response.values ?? {});
            const alignedValues = Object.fromEntries(fields.map((field) => [field.id, saved[field.id] ?? ""]));
            return {
                id: response.id,
                submittedAtISO: response.createdAt.toISOString(),
                source: response.source,
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
    async submitAdminResponse(attendanceId, orgId, values, adminUserId) {
        const attendance = await this.prisma.disposableAttendance.findUnique({
            where: { id: attendanceId }
        });
        if (!attendance || attendance.organizationId !== orgId) {
            throw new common_1.NotFoundException("Disposable attendance not found");
        }
        if (attendance.isArchived) {
            throw new common_1.BadRequestException("This disposable attendance is archived");
        }
        const fields = this.asFieldArray(attendance.fields);
        const sanitized = this.sanitizeResponseValues(fields, values);
        const created = await this.prisma.disposableAttendanceResponse.create({
            data: {
                attendanceId,
                source: "admin",
                submittedById: adminUserId,
                values: sanitized
            }
        });
        return {
            id: created.id,
            attendanceId: created.attendanceId,
            source: created.source,
            submittedById: created.submittedById,
            submittedAtISO: created.createdAt.toISOString(),
            values: sanitized
        };
    }
    async getPublicForm(publicId) {
        const item = await this.prisma.disposableAttendance.findUnique({
            where: { publicId }
        });
        if (!item) {
            throw new common_1.NotFoundException("Disposable attendance form not found");
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
            recurrenceCustomRule: item.recurrenceCustomRule
        };
    }
    async submitPublicResponse(publicId, values) {
        const attendance = await this.prisma.disposableAttendance.findUnique({
            where: { publicId }
        });
        if (!attendance) {
            throw new common_1.NotFoundException("Disposable attendance form not found");
        }
        if (attendance.isArchived) {
            throw new common_1.BadRequestException("This disposable attendance is closed");
        }
        const fields = this.asFieldArray(attendance.fields);
        const sanitized = this.sanitizeResponseValues(fields, values);
        const created = await this.prisma.disposableAttendanceResponse.create({
            data: {
                attendanceId: attendance.id,
                source: "public",
                values: sanitized
            }
        });
        return {
            id: created.id,
            attendanceId: created.attendanceId,
            source: created.source,
            submittedAtISO: created.createdAt.toISOString(),
            values: sanitized
        };
    }
    async exportCsv(attendanceId, orgId) {
        const attendance = await this.prisma.disposableAttendance.findUnique({
            where: { id: attendanceId }
        });
        if (!attendance || attendance.organizationId !== orgId) {
            throw new common_1.NotFoundException("Disposable attendance not found");
        }
        const fields = this.asFieldArray(attendance.fields);
        const responses = await this.prisma.disposableAttendanceResponse.findMany({
            where: { attendanceId },
            orderBy: { createdAt: "asc" }
        });
        const headers = ["submittedAtISO", "source", ...fields.map((field) => field.label)];
        const csvRows = responses.map((response) => {
            const values = (response.values ?? {});
            return [
                response.createdAt.toISOString(),
                response.source,
                ...fields.map((field) => values[field.id] ?? "")
            ];
        });
        const csv = [headers, ...csvRows]
            .map((row) => row
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(","))
            .join("\n");
        return {
            filename: `${attendance.title.toLowerCase().replace(/\s+/g, "-")}-disposable-attendance.csv`,
            content: csv
        };
    }
};
exports.DisposableAttendanceService = DisposableAttendanceService;
exports.DisposableAttendanceService = DisposableAttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DisposableAttendanceService);
//# sourceMappingURL=disposable-attendance.service.js.map