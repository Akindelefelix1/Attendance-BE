import type { DisposableRecurrenceMode } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../notifications/email.service";
type DisposableFieldType = "full-name" | "email" | "phone" | "occupation" | "address" | "text";
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
    values: Record<string, string>;
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
    private readonly emailService;
    constructor(prisma: PrismaService, emailService: EmailService);
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
    updateCollectedFields(attendanceId: string, orgId: string, fields: DisposableField[]): Promise<{
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
    getResponsesTable(attendanceId: string, orgId: string): Promise<{
        attendanceId: string;
        attendanceTitle: string;
        columns: ResponsesTableColumn[];
        rows: ResponsesTableRow[];
    }>;
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
