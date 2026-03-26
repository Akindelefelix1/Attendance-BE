import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { AdminLoginDto, RegisterAdminDto, RequestEmailDto, ResetPasswordDto, StaffLoginDto, VerifyTokenDto } from "./dto/auth.dto";
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
        ok: boolean;
        token?: undefined;
    } | {
        ok: boolean;
        token: `${string}-${string}-${string}-${string}-${string}`;
    }>;
    reset(body: ResetPasswordDto): Promise<{
        ok: boolean;
    }>;
    register(body: RegisterAdminDto, res: Response): Promise<{
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
