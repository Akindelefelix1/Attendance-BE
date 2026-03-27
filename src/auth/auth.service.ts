import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request, Response } from "express";
import { JwtService } from "@nestjs/jwt";
import type { Permission } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import * as crypto from "crypto";
import type { CookieOptions } from "express";
import { EmailService } from "../notifications/email.service";

const COOKIE_NAME = "attendance_token";
const ADMIN_PERMISSIONS = [
  "manage_organizations",
  "manage_staff",
  "manage_attendance",
  "view_analytics",
  "manage_settings"
] as const satisfies readonly Permission[];
const STAFF_PERMISSIONS = ["manage_attendance"] as const satisfies readonly Permission[];
const ADMIN_VERIFY_TOKEN_EXPIRY_MS = 1000 * 60 * 60 * 24;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService
  ) {}

  private isDevMode() {
    return (process.env.NODE_ENV ?? "development") !== "production";
  }

  private createAdminVerifyToken() {
    return crypto.randomUUID();
  }

  private getVerifyExpiryDate() {
    return new Date(Date.now() + ADMIN_VERIFY_TOKEN_EXPIRY_MS);
  }

  private async issueAdminVerifyToken(adminId: string) {
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

  private getAdminLimit(planTier: "free" | "plus" | "pro") {
    if (planTier === "pro") return 10;
    if (planTier === "plus") return 3;
    return 1;
  }

  private normalizeCredentials(email: string, password: string) {
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPassword = password?.toString();

    if (!normalizedEmail || !normalizedPassword) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return {
      email: normalizedEmail,
      password: normalizedPassword
    };
  }

  private getCookieOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === "production";
    const configuredSameSite = process.env.COOKIE_SAME_SITE as
      | "lax"
      | "strict"
      | "none"
      | undefined;
    const sameSite = configuredSameSite ?? (isProduction ? "none" : "lax");

    const configuredSecure = process.env.COOKIE_SECURE;
    const secure =
      configuredSecure !== undefined
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

  private setCookie(res: Response, token: string) {
    res.cookie(COOKIE_NAME, token, this.getCookieOptions());
  }

  clearCookie(res: Response) {
    const cookieOptions = this.getCookieOptions();
    res.clearCookie(COOKIE_NAME, {
      httpOnly: cookieOptions.httpOnly,
      sameSite: cookieOptions.sameSite,
      secure: cookieOptions.secure,
      domain: cookieOptions.domain,
      path: cookieOptions.path
    });
  }

  async registerAdmin(orgId: string, email: string, password: string, res: Response) {
    this.clearCookie(res);
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId }
    });
    if (!organization) {
      throw new UnauthorizedException("Organization not found");
    }
    const limit = this.getAdminLimit(organization.planTier);
    const existingAdmins = await this.prisma.adminUser.count({
      where: { organizationId: orgId }
    });
    if (existingAdmins >= limit) {
      throw new UnauthorizedException("Admin limit reached for plan tier");
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await this.prisma.adminUser.create({
      data: {
        organization: { connect: { id: orgId } },
        email: email.trim().toLowerCase(),
        passwordHash,
        isVerified: false,
        permissions: [...ADMIN_PERMISSIONS]
      }
    });

    const { token } = await this.issueAdminVerifyToken(admin.id);
    await this.emailService.sendAdminVerificationEmail({
      email: admin.email,
      token
    });

    return {
      admin: { id: admin.id, email: admin.email, orgId },
      verificationRequired: true,
      message: "Verification email sent. Please verify your email before login.",
      ...(this.isDevMode() ? { verificationToken: token } : {})
    };
  }

  async login(email: string, password: string, res: Response) {
    const normalized = this.normalizeCredentials(email, password);
    const admins = await this.prisma.adminUser.findMany({
      where: { email: normalized.email },
      orderBy: { createdAt: "desc" }
    });
    if (admins.length === 0) {
      throw new UnauthorizedException("Invalid credentials");
    }

    let matchedAdmin: (typeof admins)[number] | null = null;
    for (const admin of admins) {
      let ok = false;
      try {
        ok = await bcrypt.compare(normalized.password, admin.passwordHash);
      } catch {
        ok = false;
      }
      if (ok) {
        matchedAdmin = admin;
        break;
      }
    }

    if (!matchedAdmin) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!matchedAdmin.isVerified) {
      const issued = await this.issueAdminVerifyToken(matchedAdmin.id);
      await this.emailService.sendAdminVerificationEmail({
        email: matchedAdmin.email,
        token: issued.token
      });
      throw new UnauthorizedException(
        "Email not verified. We sent a new verification email."
      );
    }

    const token = this.jwtService.sign({
      sub: matchedAdmin.id,
      orgId: matchedAdmin.organizationId,
      email: matchedAdmin.email,
      role: "admin",
      permissions:
        Array.isArray(matchedAdmin.permissions) && matchedAdmin.permissions.length > 0
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

  async staffLogin(email: string, password: string, res: Response) {
    const normalized = this.normalizeCredentials(email, password);
    const staffCandidates = await this.prisma.staffMember.findMany({
      where: { email: normalized.email },
      include: {
        organization: {
          select: {
            id: true,
            staffLoginPasswordHash: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    if (staffCandidates.length === 0) {
      throw new UnauthorizedException("Invalid credentials");
    }

    let matchedStaff: (typeof staffCandidates)[number] | null = null;
    for (const candidate of staffCandidates) {
      const orgPasswordHash = candidate.organization.staffLoginPasswordHash;
      if (!orgPasswordHash) {
        continue;
      }
      let ok = false;
      try {
        ok = await bcrypt.compare(normalized.password, orgPasswordHash);
      } catch {
        ok = false;
      }
      if (ok) {
        matchedStaff = candidate;
        break;
      }
    }

    if (!matchedStaff) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const token = this.jwtService.sign({
      sub: matchedStaff.id,
      orgId: matchedStaff.organizationId,
      email: matchedStaff.email,
      role: "staff",
      permissions:
        Array.isArray(matchedStaff.permissions) && matchedStaff.permissions.length
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

  async requestStaffVerify(email: string) {
    const staff = await this.prisma.staffMember.findFirst({
      where: { email: email.trim().toLowerCase() }
    });
    if (!staff) return { ok: true };
    const token = crypto.randomUUID();
    await this.prisma.staffMember.update({
      where: { id: staff.id },
      data: { verifyToken: token }
    });
    return { ok: true, token };
  }

  async verifyStaff(token: string) {
    const staff = await this.prisma.staffMember.findFirst({
      where: { verifyToken: token }
    });
    if (!staff) {
      throw new UnauthorizedException("Invalid token");
    }
    await this.prisma.staffMember.update({
      where: { id: staff.id },
      data: { isVerified: true, verifyToken: null }
    });
    return { ok: true };
  }

  async requestAdminVerify(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const admin = await this.prisma.adminUser.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: "desc" }
    });
    if (!admin || admin.isVerified) {
      return { ok: true };
    }

    const issued = await this.issueAdminVerifyToken(admin.id);
    await this.emailService.sendAdminVerificationEmail({
      email: admin.email,
      token: issued.token
    });

    return {
      ok: true,
      ...(this.isDevMode() ? { verificationToken: issued.token } : {})
    };
  }

  async verifyAdmin(token: string, res: Response) {
    const admin = await this.prisma.adminUser.findFirst({
      where: { verifyToken: token }
    });

    if (!admin || !admin.verifyTokenExp || admin.verifyTokenExp < new Date()) {
      throw new UnauthorizedException("Invalid or expired verification token");
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
      permissions:
        Array.isArray(updatedAdmin.permissions) && updatedAdmin.permissions.length > 0
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

  async requestStaffReset(email: string) {
    const staff = await this.prisma.staffMember.findFirst({
      where: { email: email.trim().toLowerCase() }
    });
    if (!staff) return { ok: true };
    const token = crypto.randomUUID();
    await this.prisma.staffMember.update({
      where: { id: staff.id },
      data: { resetToken: token, resetTokenExp: new Date(Date.now() + 1000 * 60 * 30) }
    });
    return { ok: true, token };
  }

  async resetStaffPassword(token: string, password: string) {
    const staff = await this.prisma.staffMember.findFirst({
      where: { resetToken: token }
    });
    if (!staff || !staff.resetTokenExp || staff.resetTokenExp < new Date()) {
      throw new UnauthorizedException("Invalid token");
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

  me(req: Request) {
    const user = (req as Request & { user?: unknown }).user;
    return { user };
  }
}
