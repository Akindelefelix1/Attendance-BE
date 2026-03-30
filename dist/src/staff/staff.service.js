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
exports.StaffService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../notifications/email.service");
let StaffService = class StaffService {
    prisma;
    emailService;
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    listByOrganization(organizationId) {
        return this.prisma.staffMember.findMany({
            where: { organizationId },
            orderBy: { createdAt: "desc" }
        });
    }
    async create(organizationId, payload) {
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
    async update(id, payload) {
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
    async updateInOrg(id, organizationId, payload) {
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
    async remove(id) {
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
    async removeInOrg(id, organizationId) {
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
};
exports.StaffService = StaffService;
exports.StaffService = StaffService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], StaffService);
//# sourceMappingURL=staff.service.js.map