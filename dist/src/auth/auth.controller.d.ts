import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { AdminLoginDto, RequestAdminVerifyDto, RegisterAdminDto, RequestEmailDto, ResetPasswordDto, StaffLoginDto, VerifyAdminDto, VerifyTokenDto } from "./dto/auth.dto";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: AdminLoginDto, res: Response): Promise<{
        admin: {
            id: string;
            email: string;
            orgId: string;
        };
    }>;
    staffLogin(body: StaffLoginDto, res: Response): Promise<{
        staff: {
            id: string;
            email: string;
            orgId: string;
        };
    }>;
    requestVerify(body: RequestEmailDto): Promise<{
        ok: boolean;
        token?: undefined;
    } | {
        ok: boolean;
        token: `${string}-${string}-${string}-${string}-${string}`;
    }>;
    verify(body: VerifyTokenDto): Promise<{
        ok: boolean;
    }>;
    requestReset(body: RequestEmailDto): Promise<{
        token?: `${string}-${string}-${string}-${string}-${string}` | undefined;
        ok: boolean;
    }>;
    reset(body: ResetPasswordDto): Promise<{
        ok: boolean;
    }>;
    register(body: RegisterAdminDto, res: Response): Promise<{
        verificationToken?: `${string}-${string}-${string}-${string}-${string}` | undefined;
        admin: {
            id: string;
            email: string;
            orgId: string;
        };
        verificationRequired: boolean;
        message: string;
    }>;
    requestAdminVerify(body: RequestAdminVerifyDto): Promise<{
        verificationToken?: `${string}-${string}-${string}-${string}-${string}` | undefined;
        ok: boolean;
    }>;
    verifyAdmin(body: VerifyAdminDto, res: Response): Promise<{
        ok: boolean;
        admin: {
            id: string;
            email: string;
            orgId: string;
        };
    }>;
    me(req: Request): {
        user: Express.User | undefined;
    };
    logout(res: Response): {
        ok: boolean;
    };
}
