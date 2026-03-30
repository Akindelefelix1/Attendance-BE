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
    update(id, payload) {
        return this.prisma.staffMember.update({
            where: { id },
            data: payload
        });
    }
    updateInOrg(id, organizationId, payload) {
        return this.prisma.staffMember.update({
            where: { id, organizationId },
            data: payload
        });
    }
    remove(id) {
        return this.prisma.staffMember.delete({ where: { id } });
    }
    removeInOrg(id, organizationId) {
        return this.prisma.staffMember.delete({
            where: { id, organizationId }
        });
    }
};
exports.StaffService = StaffService;
exports.StaffService = StaffService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], StaffService);
//# sourceMappingURL=staff.service.js.map