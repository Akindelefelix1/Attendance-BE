import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../notifications/email.service";
import * as crypto from "crypto";

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
    let shouldRequireStaffReset = false;
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
      staffLoginPasswordHash?: string | null;
    } = {
      ...rest
    };

    if (typeof staffLoginPassword === "string") {
      const trimmed = staffLoginPassword.trim();
      if (trimmed.length > 0) {
        shouldRequireStaffReset = true;
        updateData.staffLoginPasswordHash = null;
      }
    }

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: updateData
    });

    if (shouldRequireStaffReset) {
      const staffMembers = await this.prisma.staffMember.findMany({
        where: { organizationId },
        select: { id: true, fullName: true, email: true }
      });

      const resetTokenExp = new Date(Date.now() + 1000 * 60 * 30);
      const resets = staffMembers.map((member) => ({
        id: member.id,
        email: member.email,
        fullName: member.fullName,
        token: crypto.randomUUID()
      }));

      await this.prisma.$transaction(
        resets.map((reset) =>
          this.prisma.staffMember.update({
            where: { id: reset.id },
            data: {
              passwordHash: null,
              resetToken: reset.token,
              resetTokenExp
            }
          })
        )
      );

      void Promise.all(
        resets.map((reset) =>
          this.emailService.sendStaffPasswordResetEmail({
            organizationName: updated.name,
            staffEmail: reset.email,
            staffName: reset.fullName,
            resetToken: reset.token,
            reason:
              "Your organization updated staff access policy. Please set a new personal password."
          })
        )
      )
        .catch(() => undefined);
    }

    return updated;
  }
}
