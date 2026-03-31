import { PublicHolidaysService } from "./public-holidays.service";
export declare class PublicHolidaysController {
    private readonly publicHolidaysService;
    constructor(publicHolidaysService: PublicHolidaysService);
    private normalizeDateISO;
    private assertOrgScope;
    findAll(orgId: string, req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        dateISO: string;
        description: string;
        isRecurring: boolean;
        recurrencePattern: string | null;
        affectsAllStaff: boolean;
    }[]>;
    create(orgId: string, body: {
        name?: string;
        holidayName?: string;
        dateISO?: string;
        date?: string;
        isRecurring?: boolean;
        recurrencePattern?: string;
        description?: string;
        affectsAllStaff?: boolean;
    }, req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        dateISO: string;
        description: string;
        isRecurring: boolean;
        recurrencePattern: string | null;
        affectsAllStaff: boolean;
    }>;
    update(orgId: string, id: string, body: Partial<{
        name: string;
        dateISO: string;
        isRecurring: boolean;
        recurrencePattern: string;
        description: string;
        affectsAllStaff: boolean;
    }>, req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        dateISO: string;
        description: string;
        isRecurring: boolean;
        recurrencePattern: string | null;
        affectsAllStaff: boolean;
    }>;
    delete(orgId: string, id: string, req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        dateISO: string;
        description: string;
        isRecurring: boolean;
        recurrencePattern: string | null;
        affectsAllStaff: boolean;
    }>;
    notifyStaff(orgId: string, id: string, body: {
        sendMode?: string;
        scheduledAt?: string;
    }, req: any): Promise<{
        message: string;
        notifiedCount: number;
    }>;
}
