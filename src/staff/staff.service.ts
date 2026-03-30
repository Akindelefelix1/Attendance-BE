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

      void this.emailService
        .sendStaffOnboardingEmail({
          organizationName: organization.name,
          staffEmail: created.email,
          staffName: created.fullName
        })
        .catch(() => undefined);
    }

    return created;
  }

  async update(id: string, payload: { fullName?: string; role?: string; email?: string }) {
    const updated = await this.prisma.staffMember.update({
      where: { id },
      data: {
        ...payload,
        email: payload.email?.trim().toLowerCase()
      },
      include: {
        organization: {
          select: { name: true, adminEmails: true }
        }
      }
    });

    void this.emailService
      .sendOrganizationActivityEmail({
        organizationName: updated.organization.name,
        adminEmails: updated.organization.adminEmails,
        activityType: "Staff Member Updated",
        summary: `Staff member (${updated.fullName}) details were updated.`,
        details: [
          { label: "Staff Name", value: updated.fullName },
          { label: "Role", value: updated.role },
          { label: "Email", value: updated.email },
          { label: "Staff ID", value: updated.id }
        ]
      })
      .catch(() => undefined);

    const { organization, ...result } = updated;
    return result;
  }

  async updateInOrg(
    id: string,
    organizationId: string,
    payload: { fullName?: string; role?: string; email?: string }
  ) {
    const updated = await this.prisma.staffMember.update({
      where: { id, organizationId },
      data: {
        ...payload,
        email: payload.email?.trim().toLowerCase()
      },
      include: {
        organization: {
          select: { name: true, adminEmails: true }
        }
      }
    });

    void this.emailService
      .sendOrganizationActivityEmail({
        organizationName: updated.organization.name,
        adminEmails: updated.organization.adminEmails,
        activityType: "Staff Member Updated",
        summary: `Staff member (${updated.fullName}) details were updated.`,
        details: [
          { label: "Staff Name", value: updated.fullName },
          { label: "Role", value: updated.role },
          { label: "Email", value: updated.email },
          { label: "Staff ID", value: updated.id }
        ]
      })
      .catch(() => undefined);

    const { organization, ...result } = updated;
    return result;
  }

  async remove(id: string) {
    const removed = await this.prisma.staffMember.delete({
      where: { id },
      include: {
        organization: {
          select: { name: true, adminEmails: true }
        }
      }
    });

    void this.emailService
      .sendOrganizationActivityEmail({
        organizationName: removed.organization.name,
        adminEmails: removed.organization.adminEmails,
        activityType: "Staff Member Removed",
        summary: `Staff member (${removed.fullName}) was removed from the organization.`,
        details: [
          { label: "Staff Name", value: removed.fullName },
          { label: "Role", value: removed.role },
          { label: "Email", value: removed.email },
          { label: "Staff ID", value: removed.id }
        ]
      })
      .catch(() => undefined);

    const { organization, ...result } = removed;
    return result;
  }

  async removeInOrg(id: string, organizationId: string) {
    const removed = await this.prisma.staffMember.delete({
      where: { id, organizationId },
      include: {
        organization: {
          select: { name: true, adminEmails: true }
        }
      }
    });

    void this.emailService
      .sendOrganizationActivityEmail({
        organizationName: removed.organization.name,
        adminEmails: removed.organization.adminEmails,
        activityType: "Staff Member Removed",
        summary: `Staff member (${removed.fullName}) was removed from the organization.`,
        details: [
          { label: "Staff Name", value: removed.fullName },
          { label: "Role", value: removed.role },
          { label: "Email", value: removed.email },
          { label: "Staff ID", value: removed.id }
        ]
      })
      .catch(() => undefined);

    const { organization, ...result } = removed;
    return result;
  }
}
