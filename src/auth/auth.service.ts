import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request, Response } from "express";
import { JwtService } from "@nestjs/jwt";
import type { Permission } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import * as crypto from "crypto";
import type { CookieOptions } from "express";

const COOKIE_NAME = "attendance_token";
const ADMIN_PERMISSIONS = [
  "manage_organizations",
  "manage_staff",
  "manage_attendance",
  "view_analytics",
  "manage_settings"
] as const satisfies readonly Permission[];
const STAFF_PERMISSIONS = ["manage_attendance"] as const satisfies readonly Permission[];

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

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
        permissions: [...ADMIN_PERMISSIONS]
      }
    });
    await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        adminEmails: Array.from(
          new Set([...organization.adminEmails, admin.email])
        )
      }
    });
    const token = this.jwtService.sign({
      sub: admin.id,
      orgId,
      email: admin.email,
      role: "admin",
      permissions: admin.permissions.length ? admin.permissions : ADMIN_PERMISSIONS
    });
    this.setCookie(res, token);
    return { admin: { id: admin.id, email: admin.email, orgId } };
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
