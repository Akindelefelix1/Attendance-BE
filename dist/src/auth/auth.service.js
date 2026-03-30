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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
const email_service_1 = require("../notifications/email.service");
const COOKIE_NAME = "attendance_token";
const ADMIN_PERMISSIONS = [
    "manage_organizations",
    "manage_staff",
    "manage_attendance",
    "view_analytics",
    "manage_settings"
];
const STAFF_PERMISSIONS = ["manage_attendance"];
const ADMIN_VERIFY_TOKEN_EXPIRY_MS = 1000 * 60 * 60 * 24;
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    emailService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService, emailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }
    isDevMode() {
        return (process.env.NODE_ENV ?? "development") !== "production";
    }
    isAdminEmailVerificationRequired() {
        return ((process.env.ADMIN_EMAIL_VERIFICATION_REQUIRED ?? "false").trim().toLowerCase() ===
            "true");
    }
    createAdminVerifyToken() {
        return crypto.randomUUID();
    }
    getVerifyExpiryDate() {
        return new Date(Date.now() + ADMIN_VERIFY_TOKEN_EXPIRY_MS);
    }
    async issueAdminVerifyToken(adminId) {
        const token = this.createAdminVerifyToken();
        const verifyTokenExp = this.getVerifyExpiryDate();
        const admin = await this.prisma.adminUser.update({
            where: { id: adminId },
            data: {
                verifyToken: token,
                verifyTokenExp
            }
        });
        return {
            admin,
            token,
            verifyTokenExp
        };
    }
    getAdminLimit(planTier) {
        if (planTier === "pro")
            return 10;
        if (planTier === "plus")
            return 3;
        return 1;
    }
    normalizeCredentials(email, password) {
        const normalizedEmail = email?.trim().toLowerCase();
        const normalizedPassword = password?.toString();
        if (!normalizedEmail || !normalizedPassword) {
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        return {
            email: normalizedEmail,
            password: normalizedPassword
        };
    }
    getCookieOptions() {
        const isProduction = process.env.NODE_ENV === "production";
        const configuredSameSite = process.env.COOKIE_SAME_SITE;
        const sameSite = configuredSameSite ?? (isProduction ? "none" : "lax");
        const configuredSecure = process.env.COOKIE_SECURE;
        const secure = configuredSecure !== undefined
            ? configuredSecure.toLowerCase() === "true"
            : isProduction || sameSite === "none";
        return {
            httpOnly: true,
            sameSite,
            secure,
            domain: process.env.COOKIE_DOMAIN || undefined,
            path: process.env.COOKIE_PATH || "/",
            maxAge: 1000 * 60 * 60 * 24 * 7
        };
    }
    setCookie(res, token) {
        res.cookie(COOKIE_NAME, token, this.getCookieOptions());
    }
    clearCookie(res) {
        const cookieOptions = this.getCookieOptions();
        res.clearCookie(COOKIE_NAME, {
            httpOnly: cookieOptions.httpOnly,
            sameSite: cookieOptions.sameSite,
            secure: cookieOptions.secure,
            domain: cookieOptions.domain,
            path: cookieOptions.path
        });
    }
    async registerAdmin(orgId, email, password, res) {
        this.clearCookie(res);
        const emailVerificationEnabled = this.isAdminEmailVerificationRequired() && this.emailService.isDeliveryConfigured();
        const organization = await this.prisma.organization.findUnique({
            where: { id: orgId }
        });
        if (!organization) {
            throw new common_1.UnauthorizedException("Organization not found");
        }
        const limit = this.getAdminLimit(organization.planTier);
        const existingAdmins = await this.prisma.adminUser.count({
            where: { organizationId: orgId }
        });
        if (existingAdmins >= limit) {
            throw new common_1.UnauthorizedException("Admin limit reached for plan tier");
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const admin = await this.prisma.adminUser.create({
            data: {
                organization: { connect: { id: orgId } },
                email: email.trim().toLowerCase(),
                passwordHash,
                isVerified: !emailVerificationEnabled,
                verifyToken: null,
                verifyTokenExp: null,
                permissions: [...ADMIN_PERMISSIONS]
            }
        });
        if (emailVerificationEnabled) {
            const { token } = await this.issueAdminVerifyToken(admin.id);
            this.emailService.sendAdminVerificationEmail({
                email: admin.email,
                token
            }).catch((error) => {
                this.logger.error(`[Background] Failed to send verification email to ${admin.email}.`, error instanceof Error ? error.stack : String(error));
            });
            return {
                admin: { id: admin.id, email: admin.email, orgId },
                verificationRequired: true,
                message: "Verification email sent. Please verify your email before login.",
                ...(this.isDevMode() ? { verificationToken: token } : {})
            };
        }
        const jwtToken = this.jwtService.sign({
            sub: admin.id,
            orgId: admin.organizationId,
            email: admin.email,
            role: "admin",
            permissions: [...ADMIN_PERMISSIONS]
        });
        this.setCookie(res, jwtToken);
        return {
            admin: { id: admin.id, email: admin.email, orgId },
            verificationRequired: false,
            message: "Account created successfully."
        };
    }
    async login(email, password, res) {
        const normalized = this.normalizeCredentials(email, password);
        const admins = await this.prisma.adminUser.findMany({
            where: { email: normalized.email },
            orderBy: { createdAt: "desc" }
        });
        if (admins.length === 0) {
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        let matchedAdmin = null;
        for (const admin of admins) {
            let ok = false;
            try {
                ok = await bcrypt.compare(normalized.password, admin.passwordHash);
            }
            catch {
                ok = false;
            }
            if (ok) {
                matchedAdmin = admin;
                break;
            }
        }
        if (!matchedAdmin) {
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        if (!matchedAdmin.isVerified) {
            if (!this.isAdminEmailVerificationRequired() ||
                !this.emailService.isDeliveryConfigured()) {
                matchedAdmin = await this.prisma.adminUser.update({
                    where: { id: matchedAdmin.id },
                    data: {
                        isVerified: true,
                        verifyToken: null,
                        verifyTokenExp: null
                    }
                });
            }
            else {
                const issued = await this.issueAdminVerifyToken(matchedAdmin.id);
                const adminEmail = matchedAdmin.email;
                this.emailService.sendAdminVerificationEmail({
                    email: adminEmail,
                    token: issued.token
                }).catch((error) => {
                    this.logger.error(`[Background] Failed to send verification email to ${adminEmail}.`, error instanceof Error ? error.stack : String(error));
                });
                throw new common_1.UnauthorizedException("Email not verified. We sent a new verification email.");
            }
        }
        const token = this.jwtService.sign({
            sub: matchedAdmin.id,
            orgId: matchedAdmin.organizationId,
            email: matchedAdmin.email,
            role: "admin",
            permissions: Array.isArray(matchedAdmin.permissions) && matchedAdmin.permissions.length > 0
                ? matchedAdmin.permissions
                : ADMIN_PERMISSIONS
        });
        this.setCookie(res, token);
        return {
            admin: {
                id: matchedAdmin.id,
                email: matchedAdmin.email,
                orgId: matchedAdmin.organizationId
            }
        };
    }
    async staffLogin(email, password, res) {
        const normalized = this.normalizeCredentials(email, password);
        const staffCandidates = await this.prisma.staffMember.findMany({
            where: { email: normalized.email },
            include: {
                organization: {
                    select: {
                        id: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        if (staffCandidates.length === 0) {
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        let matchedStaff = null;
        for (const candidate of staffCandidates) {
            if (!candidate.passwordHash) {
                continue;
            }
            let ok = false;
            try {
                ok = await bcrypt.compare(normalized.password, candidate.passwordHash);
            }
            catch {
                ok = false;
            }
            if (ok) {
                matchedStaff = candidate;
                break;
            }
        }
        if (!matchedStaff) {
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        const token = this.jwtService.sign({
            sub: matchedStaff.id,
            orgId: matchedStaff.organizationId,
            email: matchedStaff.email,
            role: "staff",
            permissions: Array.isArray(matchedStaff.permissions) && matchedStaff.permissions.length
                ? matchedStaff.permissions
                : STAFF_PERMISSIONS
        });
        this.setCookie(res, token);
        return {
            staff: {
                id: matchedStaff.id,
                email: matchedStaff.email,
                orgId: matchedStaff.organizationId
            }
        };
    }
    async requestStaffVerify(email) {
        const staff = await this.prisma.staffMember.findFirst({
            where: { email: email.trim().toLowerCase() }
        });
        if (!staff)
            return { ok: true };
        const token = crypto.randomUUID();
        await this.prisma.staffMember.update({
            where: { id: staff.id },
            data: { verifyToken: token }
        });
        return { ok: true, token };
    }
    async verifyStaff(token) {
        const staff = await this.prisma.staffMember.findFirst({
            where: { verifyToken: token }
        });
        if (!staff) {
            throw new common_1.UnauthorizedException("Invalid token");
        }
        await this.prisma.staffMember.update({
            where: { id: staff.id },
            data: { isVerified: true, verifyToken: null }
        });
        return { ok: true };
    }
    async requestAdminVerify(email) {
        const normalizedEmail = email.trim().toLowerCase();
        const admin = await this.prisma.adminUser.findFirst({
            where: { email: normalizedEmail },
            orderBy: { createdAt: "desc" }
        });
        if (!admin || admin.isVerified) {
            return { ok: true };
        }
        const issued = await this.issueAdminVerifyToken(admin.id);
        this.emailService.sendAdminVerificationEmail({
            email: admin.email,
            token: issued.token
        }).catch((error) => {
            this.logger.error(`[Background] Failed to send verification email to ${admin.email}.`, error instanceof Error ? error.stack : String(error));
        });
        return {
            ok: true,
            ...(this.isDevMode() ? { verificationToken: issued.token } : {})
        };
    }
    async verifyAdmin(token, res) {
        const admin = await this.prisma.adminUser.findFirst({
            where: { verifyToken: token }
        });
        if (!admin || !admin.verifyTokenExp || admin.verifyTokenExp < new Date()) {
            throw new common_1.UnauthorizedException("Invalid or expired verification token");
        }
        const updatedAdmin = await this.prisma.adminUser.update({
            where: { id: admin.id },
            data: {
                isVerified: true,
                verifyToken: null,
                verifyTokenExp: null
            }
        });
        const organization = await this.prisma.organization.findUnique({
            where: { id: updatedAdmin.organizationId },
            select: { adminEmails: true }
        });
        if (organization) {
            await this.prisma.organization.update({
                where: { id: updatedAdmin.organizationId },
                data: {
                    adminEmails: Array.from(new Set([...organization.adminEmails, updatedAdmin.email]))
                }
            });
        }
        const jwtToken = this.jwtService.sign({
            sub: updatedAdmin.id,
            orgId: updatedAdmin.organizationId,
            email: updatedAdmin.email,
            role: "admin",
            permissions: Array.isArray(updatedAdmin.permissions) && updatedAdmin.permissions.length > 0
                ? updatedAdmin.permissions
                : ADMIN_PERMISSIONS
        });
        this.setCookie(res, jwtToken);
        return {
            ok: true,
            admin: {
                id: updatedAdmin.id,
                email: updatedAdmin.email,
                orgId: updatedAdmin.organizationId
            }
        };
    }
    async requestStaffReset(email) {
        const staff = await this.prisma.staffMember.findFirst({
            where: { email: email.trim().toLowerCase() },
            include: {
                organization: {
                    select: { name: true }
                }
            }
        });
        if (!staff)
            return { ok: true };
        const token = crypto.randomUUID();
        const resetTokenExp = new Date(Date.now() + 1000 * 60 * 30);
        await this.prisma.staffMember.update({
            where: { id: staff.id },
            data: { resetToken: token, resetTokenExp }
        });
        this.emailService
            .sendStaffPasswordResetEmail({
            organizationName: staff.organization.name,
            staffEmail: staff.email,
            staffName: staff.fullName,
            resetToken: token,
            reason: "A password reset was requested for your account."
        })
            .catch((error) => {
            this.logger.error(`[Background] Failed to send staff reset email to ${staff.email}.`, error instanceof Error ? error.stack : String(error));
        });
        return {
            ok: true,
            ...(this.isDevMode() ? { token } : {})
        };
    }
    async resetStaffPassword(token, password) {
        const staff = await this.prisma.staffMember.findFirst({
            where: { resetToken: token }
        });
        if (!staff || !staff.resetTokenExp || staff.resetTokenExp < new Date()) {
            throw new common_1.UnauthorizedException("Invalid token");
        }
        const passwordHash = await bcrypt.hash(password, 10);
        await this.prisma.staffMember.update({
            where: { id: staff.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExp: null
            }
        });
        return { ok: true };
    }
    me(req) {
        const user = req.user;
        return { user };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map