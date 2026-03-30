import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { Prisma } from "@prisma/client";
import { EmailService } from "../notifications/email.service";

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  findAll() {
    return this.prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: { staff: true }
    });
  }

  findAllForOrg(orgId: string) {
    return this.prisma.organization.findMany({
      where: { id: orgId },
      include: { staff: true }
    });
  }

  findOne(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: { staff: true }
    });
  }

  async create(data: Prisma.OrganizationCreateInput) {
    const created = await this.prisma.organization.create({ data });

    void this.emailService
      .sendOrganizationActivityEmail({
        organizationName: created.name,
        adminEmails: created.adminEmails,
        activityType: "Organization Created",
        summary: `A new organization (${created.name}) was created in Attendance.`,
        details: [
          { label: "Location", value: created.location },
          { label: "Plan Tier", value: created.planTier },
          { label: "Organization ID", value: created.id }
        ]
      })
      .catch(() => undefined);

    return created;
  }

  async update(id: string, data: Prisma.OrganizationUpdateInput) {
    const before = await this.prisma.organization.findUnique({
      where: { id },
      select: { name: true, adminEmails: true }
    });

    const updated = await this.prisma.organization.update({ where: { id }, data });
    const adminEmails = Array.from(
      new Set([...(before?.adminEmails ?? []), ...updated.adminEmails])
    );

    void this.emailService
      .sendOrganizationActivityEmail({
        organizationName: updated.name,
        adminEmails,
        activityType: "Organization Updated",
        summary: `Organization settings for ${updated.name} were updated.`,
        details: [
          { label: "Location", value: updated.location },
          { label: "Plan Tier", value: updated.planTier },
          { label: "Organization ID", value: updated.id }
        ]
      })
      .catch(() => undefined);

    return updated;
  }

  async remove(id: string) {
    const removed = await this.prisma.organization.delete({ where: { id } });

    void this.emailService
      .sendOrganizationActivityEmail({
        organizationName: removed.name,
        adminEmails: removed.adminEmails,
        activityType: "Organization Deleted",
        summary: `Organization ${removed.name} was deleted from Attendance.`,
        details: [
          { label: "Location", value: removed.location },
          { label: "Plan Tier", value: removed.planTier },
          { label: "Organization ID", value: removed.id }
        ]
      })
      .catch(() => undefined);

    return removed;
  }
}
