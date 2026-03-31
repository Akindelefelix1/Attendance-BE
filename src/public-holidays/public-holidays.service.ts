import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PublicHoliday } from "@prisma/client";
import { EmailService } from "../notifications/email.service";
import { TemplateService } from "../notifications/template.service";

@Injectable()
export class PublicHolidaysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly templateService: TemplateService
  ) {}

  private isDuplicateKeyError(error: unknown) {
    return (
      !!error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    );
  }

  private isForeignKeyError(error: unknown) {
    return (
      !!error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2003"
    );
  }

  private isRecordNotFoundError(error: unknown) {
    return (
      !!error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2025"
    );
  }

  async create(
    orgId: string,
    data: {
      name: string;
      dateISO: string;
      isRecurring?: boolean;
      recurrencePattern?: string;
      description?: string;
      affectsAllStaff?: boolean;
    }
  ): Promise<PublicHoliday> {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true }
      });
      if (!organization) {
        throw new NotFoundException("Organization not found");
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
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException("A holiday already exists for this date");
      }
      if (this.isForeignKeyError(error)) {
        throw new NotFoundException("Organization not found");
      }
      throw new InternalServerErrorException("Failed to create holiday");
    }
  }

  async findAll(orgId: string): Promise<PublicHoliday[]> {
    return this.prisma.publicHoliday.findMany({
      where: { organizationId: orgId },
      orderBy: { dateISO: "asc" }
    });
  }

  async findOne(orgId: string, id: string): Promise<PublicHoliday | null> {
    return this.prisma.publicHoliday.findFirst({
      where: { id, organizationId: orgId }
    });
  }

  async update(
    orgId: string,
    id: string,
    data: Partial<{
      name: string;
      dateISO: string;
      isRecurring: boolean;
      recurrencePattern: string;
      description: string;
      affectsAllStaff: boolean;
    }>
  ): Promise<PublicHoliday> {
    try {
      const existing = await this.prisma.publicHoliday.findFirst({
        where: { id, organizationId: orgId }
      });
      if (!existing) {
        throw new NotFoundException("Holiday not found");
      }

      return await this.prisma.publicHoliday.update({
        where: { id },
        data: {
          ...data
        }
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException("A holiday already exists for this date");
      }
      if (this.isRecordNotFoundError(error)) {
        throw new NotFoundException("Holiday not found");
      }
      throw new InternalServerErrorException("Failed to update holiday");
    }
  }

  async delete(orgId: string, id: string): Promise<PublicHoliday> {
    const existing = await this.prisma.publicHoliday.findFirst({
      where: { id, organizationId: orgId }
    });
    if (!existing) {
      throw new NotFoundException("Holiday not found");
    }

    return this.prisma.publicHoliday.delete({
      where: { id }
    });
  }

  /**
   * Get all public holiday dates for a date range
   * Handles both static holidays and recurring holidays
   */
  async getHolidayDatesForRange(
    orgId: string,
    startDateISO: string,
    endDateISO: string
  ): Promise<Set<string>> {
    const allHolidays = await this.prisma.publicHoliday.findMany({
      where: {
        organizationId: orgId,
        affectsAllStaff: true
      }
    });

    const holidaySet = new Set<string>();

    // Add static holidays within the range
    const staticHolidays = allHolidays.filter((h) => !h.isRecurring);
    staticHolidays.forEach((holiday) => {
      if (holiday.dateISO >= startDateISO && holiday.dateISO <= endDateISO) {
        holidaySet.add(holiday.dateISO);
      }
    });

    // Expand recurring holidays
    const recurringHolidays = allHolidays.filter((h) => h.isRecurring);
    recurringHolidays.forEach((holiday) => {
      const expandedDates = this.expandRRuleForRange(
        holiday.recurrencePattern || "",
        startDateISO,
        endDateISO
      );
      expandedDates.forEach((date) => holidaySet.add(date));
    });

    return holidaySet;
  }

  /**
   * Check if a specific date is a public holiday
   */
  async isPublicHoliday(orgId: string, dateISO: string): Promise<boolean> {
    // Check static holidays
    const staticHoliday = await this.prisma.publicHoliday.findFirst({
      where: {
        organizationId: orgId,
        dateISO,
        isRecurring: false,
        affectsAllStaff: true
      }
    });

    if (staticHoliday) return true;

    // Check recurring holidays
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

  /**
   * Expand RRULE pattern for a date range
   * Supports simple YEARLY patterns like: FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25
   */
  private expandRRuleForRange(
    rrule: string,
    startISO: string,
    endISO: string
  ): string[] {
    if (!rrule) return [];

    const dates: string[] = [];

    try {
      const [startYear, startMonth, startDay] = startISO.split("-").map(Number);
      const [endYear, endMonth, endDay] = endISO.split("-").map(Number);

      // Parse RRULE: extract FREQ, BYMONTHDAY, BYMONTH
      const freqMatch = rrule.match(/FREQ=(\w+)/);
      const byMonthDayMatch = rrule.match(/BYMONTHDAY=(\d+)/);
      const byMonthMatch = rrule.match(/BYMONTH=(\d+)/);

      if (!freqMatch || freqMatch[1] !== "YEARLY") return [];

      const month = byMonthMatch ? parseInt(byMonthMatch[1], 10) : null;
      const day = byMonthDayMatch ? parseInt(byMonthDayMatch[1], 10) : null;

      if (!month || !day) return [];

      // Generate dates for each year in the range
      for (let year = startYear; year <= endYear; year++) {
        const dateISO = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        if (dateISO >= startISO && dateISO <= endISO) {
          dates.push(dateISO);
        }
      }
    } catch (error) {
      console.warn("Failed to parse RRULE:", rrule, error);
    }

    return dates;
  }

  /**
   * Check if a date matches an RRULE pattern
   */
  private matchesRRule(dateISO: string, rrule: string): boolean {
    if (!rrule) return false;

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
    } catch (error) {
      console.warn("Failed to match RRULE:", rrule, error);
      return false;
    }
  }

  /**
   * Notify all staff members about a holiday
   */
  async notifyStaff(
    orgId: string,
    holidayId: string,
    sendMode: "instant" | "scheduled",
    scheduledAt?: string
  ): Promise<{ message: string; notifiedCount: number }> {
    try {
      // Get the holiday
      const holiday = await this.prisma.publicHoliday.findFirst({
        where: { id: holidayId, organizationId: orgId }
      });

      if (!holiday) {
        throw new NotFoundException("Holiday not found");
      }

      // Get the organization
      const organization = await this.prisma.organization.findUnique({
        where: { id: orgId }
      });

      if (!organization) {
        throw new NotFoundException("Organization not found");
      }

      // Get all staff members
      const staff = await this.prisma.staffMember.findMany({
        where: { organizationId: orgId },
        select: { id: true, email: true, fullName: true }
      });

      if (staff.length === 0) {
        return { message: "No staff members to notify", notifiedCount: 0 };
      }

      // Format holiday info
      const holidayDate = new Date(holiday.dateISO);
      const formattedDate = holidayDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });

      const holidayType = holiday.isRecurring ? "Recurring" : "One-time";

      // Prepare email content for each staff
      const emailPromises = staff.map(async (member) => {
        try {
          // Send email based on mode
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
          } else if (sendMode === "scheduled" && scheduledAt) {
            // TODO: Implement job scheduler (e.g., Bull Queue, node-schedule)
            // For now, send immediately
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
        } catch (error) {
          console.error(`Failed to send email to ${member.email}:`, error);
          // Continue with other staff even if one fails
        }
      });

      await Promise.all(emailPromises);

      return {
        message: `Notification sent to ${staff.length} staff members`,
        notifiedCount: staff.length
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException("Failed to notify staff about holiday");
    }
  }
}
