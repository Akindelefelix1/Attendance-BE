import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";
import { EmailService } from "../notifications/email.service";

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  async getSettings(organizationId: string) {
    return this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        lateAfterTime: true,
        earlyCheckoutBeforeTime: true,
        officeGeoFenceEnabled: true,
        officeLatitude: true,
        officeLongitude: true,
        officeRadiusMeters: true,
        roles: true,
        workingDays: true,
        analyticsIncludeFutureDays: true,
        attendanceEditPolicy: true,
        adminEmails: true,
        planTier: true
      }
    });
  }

  async updateSettings(
    organizationId: string,
    data: Partial<{
      lateAfterTime: string;
      earlyCheckoutBeforeTime: string;
      officeGeoFenceEnabled: boolean;
      officeLatitude: number | null;
      officeLongitude: number | null;
      officeRadiusMeters: number;
      roles: string[];
      workingDays: number[];
      analyticsIncludeFutureDays: boolean;
      attendanceEditPolicy: "any" | "self_only";
      adminEmails: string[];
      planTier: "free" | "plus" | "pro";
      staffLoginPassword: string;
    }>
  ) {
    const { staffLoginPassword, ...rest } = data;
    let plainStaffLoginPassword: string | null = null;
    const updateData: {
      lateAfterTime?: string;
      earlyCheckoutBeforeTime?: string;
      officeGeoFenceEnabled?: boolean;
      officeLatitude?: number | null;
      officeLongitude?: number | null;
      officeRadiusMeters?: number;
      roles?: string[];
      workingDays?: number[];
      analyticsIncludeFutureDays?: boolean;
      attendanceEditPolicy?: "any" | "self_only";
      adminEmails?: string[];
      planTier?: "free" | "plus" | "pro";
      staffLoginPasswordHash?: string;
    } = {
      ...rest
    };

    if (typeof staffLoginPassword === "string") {
      const trimmed = staffLoginPassword.trim();
      if (trimmed.length > 0) {
        plainStaffLoginPassword = trimmed;
        updateData.staffLoginPasswordHash = await bcrypt.hash(trimmed, 10);
      }
    }

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: updateData
    });

    if (plainStaffLoginPassword) {
      const staffMembers = await this.prisma.staffMember.findMany({
        where: { organizationId },
        select: { email: true }
      });

      void this.emailService
        .sendStaffLoginPasswordUpdatedEmail({
          organizationName: updated.name,
          staffEmails: staffMembers.map((member) => member.email),
          staffLoginPassword: plainStaffLoginPassword
        })
        .catch(() => undefined);
    }

    return updated;
  }
}
