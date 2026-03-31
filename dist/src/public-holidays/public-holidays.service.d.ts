import { PrismaService } from "../prisma/prisma.service";
import { PublicHoliday } from "@prisma/client";
export declare class PublicHolidaysService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private isDuplicateKeyError;
    private isForeignKeyError;
    private isRecordNotFoundError;
    create(orgId: string, data: {
        name: string;
        dateISO: string;
        isRecurring?: boolean;
        recurrencePattern?: string;
        description?: string;
        affectsAllStaff?: boolean;
    }): Promise<PublicHoliday>;
    findAll(orgId: string): Promise<PublicHoliday[]>;
    findOne(orgId: string, id: string): Promise<PublicHoliday | null>;
    update(orgId: string, id: string, data: Partial<{
        name: string;
        dateISO: string;
        isRecurring: boolean;
        recurrencePattern: string;
        description: string;
        affectsAllStaff: boolean;
    }>): Promise<PublicHoliday>;
    delete(orgId: string, id: string): Promise<PublicHoliday>;
    getHolidayDatesForRange(orgId: string, startDateISO: string, endDateISO: string): Promise<Set<string>>;
    isPublicHoliday(orgId: string, dateISO: string): Promise<boolean>;
    private expandRRuleForRange;
    private matchesRRule;
}
