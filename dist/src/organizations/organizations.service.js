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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../notifications/email.service");
let OrganizationsService = class OrganizationsService {
    prisma;
    emailService;
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    findAll() {
        return this.prisma.organization.findMany({
            orderBy: { createdAt: "desc" },
            include: { staff: true }
        });
    }
    findAllForOrg(orgId) {
        return this.prisma.organization.findMany({
            where: { id: orgId },
            include: { staff: true }
        });
    }
    findOne(id) {
        return this.prisma.organization.findUnique({
            where: { id },
            include: { staff: true }
        });
    }
    async create(data) {
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
    async update(id, data) {
        const before = await this.prisma.organization.findUnique({
            where: { id },
            select: { name: true, adminEmails: true }
        });
        const updated = await this.prisma.organization.update({ where: { id }, data });
        const adminEmails = Array.from(new Set([...(before?.adminEmails ?? []), ...updated.adminEmails]));
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
    async remove(id) {
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
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map