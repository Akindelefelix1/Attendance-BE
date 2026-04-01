import type { Response } from "express";
import { DisposableAttendanceService } from "./disposable-attendance.service";
export declare class DisposableAttendanceController {
    private readonly disposableService;
    constructor(disposableService: DisposableAttendanceService);
    private assertOrgScope;
    list(orgId: string, req: {
        user?: {
            orgId?: string;
            role?: string;
        };
    }): Promise<{
        id: string;
        publicId: string;
        orgId: string;
        title: string;
        description: string;
        location: string;
        eventDateISO: string;
        fields: {
            id: string;
            label: string;
            type: "email" | "text" | "full-name" | "phone" | "occupation" | "address";
            required: boolean;
        }[];
        isRecurring: boolean;
        recurrenceMode: import("@prisma/client").$Enums.DisposableRecurrenceMode;
        recurrenceEndDateISO: string | null;
        recurrenceCustomRule: string;
        allowPreRegister: boolean;
        isArchived: boolean;
        createdAtISO: string;
        updatedAtISO: string;
    }[]>;
    create(body: {
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
        allowPreRegister?: boolean;
    }, req: {
        user?: {
            orgId?: string;
            role?: string;
        };
    }): Promise<{
        id: string;
        publicId: string;
        orgId: string;
        title: string;
        description: string;
        location: string;
        eventDateISO: string;
        fields: {
            id: string;
            label: string;
            type: "email" | "text" | "full-name" | "phone" | "occupation" | "address";
            required: boolean;
        }[];
        isRecurring: boolean;
        recurrenceMode: import("@prisma/client").$Enums.DisposableRecurrenceMode;
        recurrenceEndDateISO: string | null;
        recurrenceCustomRule: string;
        allowPreRegister: boolean;
        isArchived: boolean;
        createdAtISO: string;
        updatedAtISO: string;
    }>;
    update(id: string, body: {
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
        allowPreRegister?: boolean;
        isArchived?: boolean;
    }, req: {
        user?: {
            orgId?: string;
            role?: string;
        };
    }): Promise<{
        id: string;
        publicId: string;
        orgId: string;
        title: string;
        description: string;
        location: string;
        eventDateISO: string;
        fields: {
            id: string;
            label: string;
            type: "email" | "text" | "full-name" | "phone" | "occupation" | "address";
            required: boolean;
        }[];
        isRecurring: boolean;
        recurrenceMode: import("@prisma/client").$Enums.DisposableRecurrenceMode;
        recurrenceEndDateISO: string | null;
        recurrenceCustomRule: string;
        allowPreRegister: boolean;
        isArchived: boolean;
        createdAtISO: string;
        updatedAtISO: string;
    }>;
    remove(id: string, orgId: string, req: {
        user?: {
            orgId?: string;
            role?: string;
        };
    }): Promise<{
        ok: boolean;
    }>;
    listResponses(id: string, orgId: string, req: {
        user?: {
            orgId?: string;
            role?: string;
        };
    }): Promise<{
        id: string;
        attendanceId: string;
        source: string;
        submittedById: string | null;
        status: string;
        preRegisteredAtISO: string | null;
        checkedInAtISO: string | null;
        submittedAtISO: string;
        values: Record<string, string>;
    }[]>;
    getResponsesTable(id: string, orgId: string, req: {
        user?: {
            orgId?: string;
            role?: string;
        };
    }): Promise<{
        attendanceId: string;
        attendanceTitle: string;
        columns: {
            key: string;
            label: string;
        }[];
        rows: {
            id: string;
            submittedAtISO: string;
            source: string;
            status: "preregistered" | "checked-in";
            preRegisteredAtISO: string | null;
            checkedInAtISO: string | null;
            values: Record<string, string>;
        }[];
    }>;
    updateFields(id: string, body: {
        orgId: string;
        fields: Array<{
            id: string;
            label: string;
            type: "full-name" | "email" | "phone" | "occupation" | "address" | "text";
            required: boolean;
        }>;
    }, req: {
        user?: {
            orgId?: string;
            role?: string;
        };
    }): Promise<{
        id: string;
        publicId: string;
        orgId: string;
        title: string;
        description: string;
        location: string;
        eventDateISO: string;
        fields: {
            id: string;
            label: string;
            type: "email" | "text" | "full-name" | "phone" | "occupation" | "address";
            required: boolean;
        }[];
        isRecurring: boolean;
        recurrenceMode: import("@prisma/client").$Enums.DisposableRecurrenceMode;
        recurrenceEndDateISO: string | null;
        recurrenceCustomRule: string;
        allowPreRegister: boolean;
        isArchived: boolean;
        createdAtISO: string;
        updatedAtISO: string;
    }>;
    submitAdminResponse(id: string, body: {
        orgId: string;
        values: Record<string, string>;
    }, req: {
        user?: {
            orgId?: string;
            role?: string;
            id?: string;
        };
    }): Promise<{
        id: string;
        attendanceId: string;
        source: string;
        submittedById: string | null;
        status: string;
        preRegisteredAtISO: string | null;
        checkedInAtISO: string | null;
        submittedAtISO: string;
        values: {
            [x: string]: string;
        };
    }>;
    checkInPreRegisteredResponse(id: string, responseId: string, body: {
        orgId: string;
    }, req: {
        user?: {
            orgId?: string;
            role?: string;
            id?: string;
        };
    }): Promise<{
        action: string;
        message: string;
        id: string;
        attendanceId: string;
        source: string;
        submittedById: string | null;
        status: string;
        preRegisteredAtISO: string | null;
        checkedInAtISO: string | null;
        submittedAtISO: string;
        values: Record<string, string>;
    }>;
    updateResponse(id: string, responseId: string, body: {
        orgId: string;
        values: Record<string, string>;
    }, req: {
        user?: {
            orgId?: string;
            role?: string;
            id?: string;
        };
    }): Promise<{
        id: string;
        attendanceId: string;
        source: string;
        submittedById: string | null;
        status: string;
        preRegisteredAtISO: string | null;
        checkedInAtISO: string | null;
        submittedAtISO: string;
        values: Record<string, string>;
    }>;
    exportCsv(id: string, orgId: string, req: {
        user?: {
            orgId?: string;
            role?: string;
        };
    }, res: Response): Promise<string>;
    getPublicForm(publicId: string): Promise<{
        publicId: string;
        title: string;
        description: string;
        location: string;
        eventDateISO: string;
        fields: {
            id: string;
            label: string;
            type: "email" | "text" | "full-name" | "phone" | "occupation" | "address";
            required: boolean;
        }[];
        isArchived: boolean;
        isRecurring: boolean;
        recurrenceMode: import("@prisma/client").$Enums.DisposableRecurrenceMode;
        recurrenceEndDateISO: string | null;
        recurrenceCustomRule: string;
        allowPreRegister: boolean;
    }>;
    submitPublicResponse(publicId: string, body: {
        values: Record<string, string>;
        action?: "auto" | "preregister" | "checkin";
    }): Promise<{
        id: string;
        attendanceId: string;
        source: string;
        status: string;
        preRegisteredAtISO: string | null;
        checkedInAtISO: string | null;
        submittedAtISO: string;
        action: string;
        message: string;
        values: Record<string, string>;
    }>;
}
