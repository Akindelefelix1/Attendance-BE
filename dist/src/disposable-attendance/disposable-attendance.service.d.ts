import type { DisposableRecurrenceMode } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
type DisposableFieldType = "full-name" | "email" | "phone" | "occupation" | "address" | "text";
type DisposableField = {
    id: string;
    label: string;
    type: DisposableFieldType;
    required: boolean;
};
type CreateDisposablePayload = {
    orgId: string;
    title: string;
    description?: string;
    location?: string;
    eventDateISO: string;
    fields: DisposableField[];
    isRecurring: boolean;
    recurrenceMode: DisposableRecurrenceMode;
    recurrenceEndDateISO?: string | null;
    recurrenceCustomRule?: string;
};
type UpdateDisposablePayload = Partial<Omit<CreateDisposablePayload, "orgId"> & {
    isArchived: boolean;
}>;
export declare class DisposableAttendanceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getTierLimit;
    private asFieldArray;
    private validateFields;
    private validateRecurring;
    private sanitizeResponseValues;
    private toPublicId;
    listByOrg(orgId: string): Promise<{
        id: string;
        publicId: string;
        orgId: string;
        title: string;
        description: string;
        location: string;
        eventDateISO: string;
        fields: DisposableField[];
        isRecurring: boolean;
        recurrenceMode: import("@prisma/client").$Enums.DisposableRecurrenceMode;
        recurrenceEndDateISO: string | null;
        recurrenceCustomRule: string;
        isArchived: boolean;
        createdAtISO: string;
        updatedAtISO: string;
    }[]>;
    create(payload: CreateDisposablePayload): Promise<{
        id: string;
        publicId: string;
        orgId: string;
        title: string;
        description: string;
        location: string;
        eventDateISO: string;
        fields: DisposableField[];
        isRecurring: boolean;
        recurrenceMode: import("@prisma/client").$Enums.DisposableRecurrenceMode;
        recurrenceEndDateISO: string | null;
        recurrenceCustomRule: string;
        isArchived: boolean;
        createdAtISO: string;
        updatedAtISO: string;
    }>;
    update(id: string, orgId: string, updates: UpdateDisposablePayload): Promise<{
        id: string;
        publicId: string;
        orgId: string;
        title: string;
        description: string;
        location: string;
        eventDateISO: string;
        fields: DisposableField[];
        isRecurring: boolean;
        recurrenceMode: import("@prisma/client").$Enums.DisposableRecurrenceMode;
        recurrenceEndDateISO: string | null;
        recurrenceCustomRule: string;
        isArchived: boolean;
        createdAtISO: string;
        updatedAtISO: string;
    }>;
    remove(id: string, orgId: string): Promise<{
        ok: boolean;
    }>;
    listResponses(attendanceId: string, orgId: string): Promise<{
        id: string;
        attendanceId: string;
        source: string;
        submittedById: string | null;
        submittedAtISO: string;
        values: Record<string, string>;
    }[]>;
    submitAdminResponse(attendanceId: string, orgId: string, values: Record<string, string>, adminUserId: string): Promise<{
        id: string;
        attendanceId: string;
        source: string;
        submittedById: string | null;
        submittedAtISO: string;
        values: Record<string, string>;
    }>;
    getPublicForm(publicId: string): Promise<{
        publicId: string;
        title: string;
        description: string;
        location: string;
        eventDateISO: string;
        fields: DisposableField[];
        isArchived: boolean;
        isRecurring: boolean;
        recurrenceMode: import("@prisma/client").$Enums.DisposableRecurrenceMode;
        recurrenceEndDateISO: string | null;
        recurrenceCustomRule: string;
    }>;
    submitPublicResponse(publicId: string, values: Record<string, string>): Promise<{
        id: string;
        attendanceId: string;
        source: string;
        submittedAtISO: string;
        values: Record<string, string>;
    }>;
    exportCsv(attendanceId: string, orgId: string): Promise<{
        filename: string;
        content: string;
    }>;
}
export {};
