export declare class AdminLoginDto {
    email: string;
    password: string;
}
export declare class StaffLoginDto {
    email: string;
    password: string;
}
export declare class RequestEmailDto {
    email: string;
}
export declare class VerifyTokenDto {
    token: string;
}
export declare class ResetPasswordDto {
    token: string;
    password: string;
}
export declare class RegisterAdminDto {
    orgId: string;
    email: string;
    password: string;
}
