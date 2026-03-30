import type { Request, Response } from "express";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../notifications/email.service";
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly emailService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, emailService: EmailService);
    private isDevMode;
    private isAdminEmailVerificationRequired;
    private createAdminVerifyToken;
    private getVerifyExpiryDate;
    private issueAdminVerifyToken;
    private getAdminLimit;
    private normalizeCredentials;
    private getCookieOptions;
    private setCookie;
    clearCookie(res: Response): void;
    registerAdmin(orgId: string, email: string, password: string, res: Response): Promise<{
        verificationToken?: `${string}-${string}-${string}-${string}-${string}` | undefined;
        admin: {
            id: string;
            email: string;
            orgId: string;
        };
        verificationRequired: boolean;
        message: string;
    }>;
    login(email: string, password: string, res: Response): Promise<{
        admin: {
            id: string;
            email: string;
            orgId: string;
        };
    }>;
    staffLogin(email: string, password: string, res: Response): Promise<{
        staff: {
            id: string;
            email: string;
            orgId: string;
        };
    }>;
    requestStaffVerify(email: string): Promise<{
        ok: boolean;
        token?: undefined;
    } | {
        ok: boolean;
        token: `${string}-${string}-${string}-${string}-${string}`;
    }>;
    verifyStaff(token: string): Promise<{
        ok: boolean;
    }>;
    requestAdminVerify(email: string): Promise<{
        verificationToken?: `${string}-${string}-${string}-${string}-${string}` | undefined;
        ok: boolean;
    }>;
    verifyAdmin(token: string, res: Response): Promise<{
        ok: boolean;
        admin: {
            id: string;
            email: string;
            orgId: string;
        };
    }>;
    requestStaffReset(email: string): Promise<{
        token?: `${string}-${string}-${string}-${string}-${string}` | undefined;
        ok: boolean;
    }>;
    resetStaffPassword(token: string, password: string): Promise<{
        ok: boolean;
    }>;
    me(req: Request): {
        user: Express.User | undefined;
    };
}
