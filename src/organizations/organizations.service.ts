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

  update(id: string, data: Prisma.OrganizationUpdateInput) {
    return this.prisma.organization.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.organization.delete({ where: { id } });
  }
}
