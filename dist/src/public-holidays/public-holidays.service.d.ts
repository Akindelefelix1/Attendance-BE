import { PrismaService } from "../prisma/prisma.service";
import { PublicHoliday } from "@prisma/client";
import { EmailService } from "../notifications/email.service";
import { TemplateService } from "../notifications/template.service";
export declare class PublicHolidaysService {
    private readonly prisma;
    private readonly emailService;
    private readonly templateService;
    constructor(prisma: PrismaService, emailService: EmailService, templateService: TemplateService);
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
    notifyStaff(orgId: string, holidayId: string, sendMode: "instant" | "scheduled", scheduledAt?: string): Promise<{
        message: string;
        notifiedCount: number;
    }>;
}
