import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../notifications/email.service";

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  listByOrganization(organizationId: string) {
    return this.prisma.staffMember.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" }
    });
  }

  async create(
    organizationId: string,
    payload: { fullName: string; role: string; email: string }
  ) {
    const created = await this.prisma.staffMember.create({
      data: {
        organization: { connect: { id: organizationId } },
        fullName: payload.fullName,
        role: payload.role,
        email: payload.email.trim().toLowerCase(),
        isVerified: true,
        verifyToken: null,
        permissions: ["manage_attendance"]
      }
    });

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, adminEmails: true }
    });

    if (organization) {
      void this.emailService
        .sendOrganizationActivityEmail({
          organizationName: organization.name,
          adminEmails: organization.adminEmails,
          activityType: "Staff Member Created",
          summary: `A new staff member (${created.fullName}) was added.`,
          details: [
            { label: "Staff Name", value: created.fullName },
            { label: "Role", value: created.role },
            { label: "Email", value: created.email },
            { label: "Staff ID", value: created.id }
          ]
        })
        .catch(() => undefined);
    }

    return created;
  }

  update(id: string, payload: { fullName?: string; role?: string; email?: string }) {
    return this.prisma.staffMember.update({
      where: { id },
      data: payload
    });
  }

  updateInOrg(
    id: string,
    organizationId: string,
    payload: { fullName?: string; role?: string; email?: string }
  ) {
    return this.prisma.staffMember.update({
      where: { id, organizationId },
      data: payload
    });
  }

  remove(id: string) {
    return this.prisma.staffMember.delete({ where: { id } });
  }

  removeInOrg(id: string, organizationId: string) {
    return this.prisma.staffMember.delete({
      where: { id, organizationId }
    });
  }
}
