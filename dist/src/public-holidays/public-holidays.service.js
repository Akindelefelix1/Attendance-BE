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
exports.PublicHolidaysService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../notifications/email.service");
const template_service_1 = require("../notifications/template.service");
let PublicHolidaysService = class PublicHolidaysService {
    prisma;
    emailService;
    templateService;
    constructor(prisma, emailService, templateService) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.templateService = templateService;
    }
    isDuplicateKeyError(error) {
        return (!!error &&
            typeof error === "object" &&
            "code" in error &&
            error.code === "P2002");
    }
    isForeignKeyError(error) {
        return (!!error &&
            typeof error === "object" &&
            "code" in error &&
            error.code === "P2003");
    }
    isRecordNotFoundError(error) {
        return (!!error &&
            typeof error === "object" &&
            "code" in error &&
            error.code === "P2025");
    }
    async create(orgId, data) {
        try {
            const organization = await this.prisma.organization.findUnique({
                where: { id: orgId },
                select: { id: true }
            });
            if (!organization) {
                throw new common_1.NotFoundException("Organization not found");
            }
            return await this.prisma.publicHoliday.create({
                data: {
                    organizationId: orgId,
                    name: data.name,
                    dateISO: data.dateISO,
                    isRecurring: data.isRecurring ?? false,
                    recurrencePattern: data.recurrencePattern,
                    description: data.description ?? "",
                    affectsAllStaff: data.affectsAllStaff ?? true
                }
            });
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            if (this.isDuplicateKeyError(error)) {
                throw new common_1.ConflictException("A holiday already exists for this date");
            }
            if (this.isForeignKeyError(error)) {
                throw new common_1.NotFoundException("Organization not found");
            }
            throw new common_1.InternalServerErrorException("Failed to create holiday");
        }
    }
    async findAll(orgId) {
        return this.prisma.publicHoliday.findMany({
            where: { organizationId: orgId },
            orderBy: { dateISO: "asc" }
        });
    }
    async findOne(orgId, id) {
        return this.prisma.publicHoliday.findFirst({
            where: { id, organizationId: orgId }
        });
    }
    async update(orgId, id, data) {
        try {
            const existing = await this.prisma.publicHoliday.findFirst({
                where: { id, organizationId: orgId }
            });
            if (!existing) {
                throw new common_1.NotFoundException("Holiday not found");
            }
            return await this.prisma.publicHoliday.update({
                where: { id },
                data: {
                    ...data
                }
            });
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            if (this.isDuplicateKeyError(error)) {
                throw new common_1.ConflictException("A holiday already exists for this date");
            }
            if (this.isRecordNotFoundError(error)) {
                throw new common_1.NotFoundException("Holiday not found");
            }
            throw new common_1.InternalServerErrorException("Failed to update holiday");
        }
    }
    async delete(orgId, id) {
        const existing = await this.prisma.publicHoliday.findFirst({
            where: { id, organizationId: orgId }
        });
        if (!existing) {
            throw new common_1.NotFoundException("Holiday not found");
        }
        return this.prisma.publicHoliday.delete({
            where: { id }
        });
    }
    async getHolidayDatesForRange(orgId, startDateISO, endDateISO) {
        const allHolidays = await this.prisma.publicHoliday.findMany({
            where: {
                organizationId: orgId,
                affectsAllStaff: true
            }
        });
        const holidaySet = new Set();
        const staticHolidays = allHolidays.filter((h) => !h.isRecurring);
        staticHolidays.forEach((holiday) => {
            if (holiday.dateISO >= startDateISO && holiday.dateISO <= endDateISO) {
                holidaySet.add(holiday.dateISO);
            }
        });
        const recurringHolidays = allHolidays.filter((h) => h.isRecurring);
        recurringHolidays.forEach((holiday) => {
            const expandedDates = this.expandRRuleForRange(holiday.recurrencePattern || "", startDateISO, endDateISO);
            expandedDates.forEach((date) => holidaySet.add(date));
        });
        return holidaySet;
    }
    async isPublicHoliday(orgId, dateISO) {
        const staticHoliday = await this.prisma.publicHoliday.findFirst({
            where: {
                organizationId: orgId,
                dateISO,
                isRecurring: false,
                affectsAllStaff: true
            }
        });
        if (staticHoliday)
            return true;
        const recurringHolidays = await this.prisma.publicHoliday.findMany({
            where: {
                organizationId: orgId,
                isRecurring: true,
                affectsAllStaff: true
            }
        });
        return recurringHolidays.some((holiday) => {
            return this.matchesRRule(dateISO, holiday.recurrencePattern || "");
        });
    }
    expandRRuleForRange(rrule, startISO, endISO) {
        if (!rrule)
            return [];
        const dates = [];
        try {
            const [startYear, startMonth, startDay] = startISO.split("-").map(Number);
            const [endYear, endMonth, endDay] = endISO.split("-").map(Number);
            const freqMatch = rrule.match(/FREQ=(\w+)/);
            const byMonthDayMatch = rrule.match(/BYMONTHDAY=(\d+)/);
            const byMonthMatch = rrule.match(/BYMONTH=(\d+)/);
            if (!freqMatch || freqMatch[1] !== "YEARLY")
                return [];
            const month = byMonthMatch ? parseInt(byMonthMatch[1], 10) : null;
            const day = byMonthDayMatch ? parseInt(byMonthDayMatch[1], 10) : null;
            if (!month || !day)
                return [];
            for (let year = startYear; year <= endYear; year++) {
                const dateISO = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                if (dateISO >= startISO && dateISO <= endISO) {
                    dates.push(dateISO);
                }
            }
        }
        catch (error) {
            console.warn("Failed to parse RRULE:", rrule, error);
        }
        return dates;
    }
    matchesRRule(dateISO, rrule) {
        if (!rrule)
            return false;
        try {
            const [year, month, day] = dateISO.split("-").map(Number);
            const byMonthDayMatch = rrule.match(/BYMONTHDAY=(\d+)/);
            const byMonthMatch = rrule.match(/BYMONTH=(\d+)/);
            const targetMonth = byMonthMatch ? parseInt(byMonthMatch[1], 10) : null;
            const targetDay = byMonthDayMatch ? parseInt(byMonthDayMatch[1], 10) : null;
            if (targetMonth && targetDay) {
                return month === targetMonth && day === targetDay;
            }
            return false;
        }
        catch (error) {
            console.warn("Failed to match RRULE:", rrule, error);
            return false;
        }
    }
    async notifyStaff(orgId, holidayId, sendMode, scheduledAt) {
        try {
            const holiday = await this.prisma.publicHoliday.findFirst({
                where: { id: holidayId, organizationId: orgId }
            });
            if (!holiday) {
                throw new common_1.NotFoundException("Holiday not found");
            }
            const organization = await this.prisma.organization.findUnique({
                where: { id: orgId }
            });
            if (!organization) {
                throw new common_1.NotFoundException("Organization not found");
            }
            const staff = await this.prisma.staffMember.findMany({
                where: { organizationId: orgId },
                select: { id: true, email: true, fullName: true }
            });
            if (staff.length === 0) {
                return { message: "No staff members to notify", notifiedCount: 0 };
            }
            const holidayDate = new Date(holiday.dateISO);
            const formattedDate = holidayDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            });
            const holidayType = holiday.isRecurring ? "Recurring" : "One-time";
            const emailPromises = staff.map(async (member) => {
                try {
                    if (sendMode === "instant") {
                        await this.emailService.sendHolidayNotificationEmail({
                            to: member.email,
                            staffName: member.fullName,
                            holidayName: holiday.name,
                            holidayDate: formattedDate,
                            holidayType: holidayType,
                            holidayDescription: holiday.description || "",
                            organizationName: organization.name
                        });
                    }
                    else if (sendMode === "scheduled" && scheduledAt) {
                        await this.emailService.sendHolidayNotificationEmail({
                            to: member.email,
                            staffName: member.fullName,
                            holidayName: holiday.name,
                            holidayDate: formattedDate,
                            holidayType: holidayType,
                            holidayDescription: holiday.description || "",
                            organizationName: organization.name
                        });
                    }
                }
                catch (error) {
                    console.error(`Failed to send email to ${member.email}:`, error);
                }
            });
            await Promise.all(emailPromises);
            return {
                message: `Notification sent to ${staff.length} staff members`,
                notifiedCount: staff.length
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException("Failed to notify staff about holiday");
        }
    }
};
exports.PublicHolidaysService = PublicHolidaysService;
exports.PublicHolidaysService = PublicHolidaysService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        template_service_1.TemplateService])
], PublicHolidaysService);
//# sourceMappingURL=public-holidays.service.js.map