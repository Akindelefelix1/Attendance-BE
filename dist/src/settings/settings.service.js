"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../notifications/email.service");
const crypto = __importStar(require("crypto"));
let SettingsService = class SettingsService {
    prisma;
    emailService;
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async getSettings(organizationId) {
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
    async updateSettings(organizationId, data) {
        const { staffLoginPassword, ...rest } = data;
        let shouldRequireStaffReset = false;
        const updateData = {
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
            await this.prisma.$transaction(resets.map((reset) => this.prisma.staffMember.update({
                where: { id: reset.id },
                data: {
                    passwordHash: null,
                    resetToken: reset.token,
                    resetTokenExp
                }
            })));
            void Promise.all(resets.map((reset) => this.emailService.sendStaffPasswordResetEmail({
                organizationName: updated.name,
                staffEmail: reset.email,
                staffName: reset.fullName,
                resetToken: reset.token,
                reason: "Your organization updated staff access policy. Please set a new personal password."
            })))
                .catch(() => undefined);
        }
        return updated;
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map