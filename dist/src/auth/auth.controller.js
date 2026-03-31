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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./dto/auth.dto");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async login(body, res) {
        const result = await this.authService.login(body.email, body.password, res);
        return result;
    }
    async staffLogin(body, res) {
        return this.authService.staffLogin(body.email, body.password, res);
    }
    requestVerify(body) {
        return this.authService.requestStaffVerify(body.email);
    }
    verify(body) {
        return this.authService.verifyStaff(body.token);
    }
    requestReset(body) {
        return this.authService.requestStaffReset(body.email);
    }
    reset(body) {
        return this.authService.resetStaffPassword(body.token, body.password);
    }
    requestAdminReset(body) {
        return this.authService.requestAdminReset(body.email);
    }
    resetAdmin(body) {
        return this.authService.resetAdminPassword(body.token, body.password);
    }
    async register(body, res) {
        const result = await this.authService.registerAdmin(body.orgId, body.email, body.password, res);
        return result;
    }
    requestAdminVerify(body) {
        return this.authService.requestAdminVerify(body.email);
    }
    verifyAdmin(body, res) {
        return this.authService.verifyAdmin(body.token, res);
    }
    me(req) {
        return this.authService.me(req);
    }
    logout(res) {
        this.authService.clearCookie(res);
        return { ok: true };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)("login"),
    (0, swagger_1.ApiOperation)({
        summary: "Admin login",
        description: "Authenticate an admin user and create a session. Returns JWT token in httpOnly cookie."
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Admin authenticated successfully",
        schema: {
            type: "object",
            properties: {
                user: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "admin_123" },
                        email: { type: "string", format: "email", example: "admin@org.com" },
                        role: { type: "string", example: "admin" },
                        orgId: { type: "string", example: "org_123abc" }
                    }
                },
                verified: { type: "boolean", example: true }
            }
        }
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: "Incorrect email or password" }),
    (0, swagger_1.ApiBadRequestResponse)({ description: "Invalid request body" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.AdminLoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)("staff/login"),
    (0, swagger_1.ApiOperation)({
        summary: "Staff login",
        description: "Authenticate a staff member and create a session. Returns JWT token in httpOnly cookie."
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Staff authenticated successfully",
        schema: {
            type: "object",
            properties: {
                user: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "staff_123" },
                        fullName: { type: "string", example: "John Doe" },
                        email: { type: "string", format: "email", example: "john@org.com" },
                        role: { type: "string", example: "staff" },
                        orgId: { type: "string", example: "org_123abc" }
                    }
                },
                verified: { type: "boolean", example: true }
            }
        }
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: "Incorrect email or password" }),
    (0, swagger_1.ApiBadRequestResponse)({ description: "Invalid request body" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.StaffLoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "staffLogin", null);
__decorate([
    (0, common_1.Post)("staff/request-verify"),
    (0, swagger_1.ApiOperation)({
        summary: "Request staff verification token",
        description: "Request a verification email for staff account activation. Token is sent via email."
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Verification request accepted",
        schema: {
            type: "object",
            properties: {
                message: { type: "string", example: "Verification email sent" }
            }
        }
    }),
    (0, swagger_1.ApiBadRequestResponse)({ description: "Invalid email address" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RequestEmailDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "requestVerify", null);
__decorate([
    (0, common_1.Post)("staff/verify"),
    (0, swagger_1.ApiOperation)({
        summary: "Verify staff account",
        description: "Verify a staff account using the token received via email"
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Staff account verified",
        schema: {
            type: "object",
            properties: {
                message: { type: "string", example: "Account verified successfully" }
            }
        }
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: "Invalid or expired token" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.VerifyTokenDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)("staff/request-reset"),
    (0, swagger_1.ApiOperation)({
        summary: "Request staff password reset token",
        description: "Request a password reset email for a staff account. Does not reveal whether the email exists (for security)."
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Password reset request accepted. Always returns success to avoid user enumeration.",
        schema: {
            type: "object",
            properties: {
                message: { type: "string", example: "If the email exists, you will receive a password reset link" }
            }
        }
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RequestEmailDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "requestReset", null);
__decorate([
    (0, common_1.Post)("staff/reset"),
    (0, swagger_1.ApiOperation)({
        summary: "Reset staff password",
        description: "Set a new password using the token received via email"
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Password reset successful",
        schema: {
            type: "object",
            properties: {
                message: { type: "string", example: "Password reset successfully" }
            }
        }
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: "Invalid or expired token" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "reset", null);
__decorate([
    (0, common_1.Post)("admin/request-reset"),
    (0, swagger_1.ApiOperation)({
        summary: "Request admin password reset token",
        description: "Request a password reset email for an admin account. Does not reveal whether the email exists (for security)."
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Password reset request accepted. Always returns success to avoid user enumeration.",
        schema: {
            type: "object",
            properties: {
                message: { type: "string", example: "If the email exists, you will receive a password reset link" }
            }
        }
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RequestEmailDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "requestAdminReset", null);
__decorate([
    (0, common_1.Post)("admin/reset"),
    (0, swagger_1.ApiOperation)({
        summary: "Reset admin password",
        description: "Set a new admin password using the token received via email"
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Admin password reset successful",
        schema: {
            type: "object",
            properties: {
                message: { type: "string", example: "Password reset successfully" }
            }
        }
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: "Invalid or expired token" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "resetAdmin", null);
__decorate([
    (0, common_1.Post)("register"),
    (0, swagger_1.ApiOperation)({
        summary: "Register organization admin",
        description: "Create a new organization admin account. Admin will need to verify email before full access."
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Admin registered successfully - verification email sent",
        schema: {
            type: "object",
            properties: {
                user: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "admin_123" },
                        email: { type: "string", format: "email", example: "admin@org.com" },
                        role: { type: "string", example: "admin" },
                        orgId: { type: "string", example: "org_123abc" }
                    }
                },
                verified: { type: "boolean", example: false },
                message: { type: "string", example: "Verification email sent" }
            }
        }
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: "Organization not found or plan limit reached" }),
    (0, swagger_1.ApiConflictResponse)({ description: "Email already exists in organization" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterAdminDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)("admin/request-verify"),
    (0, swagger_1.ApiOperation)({
        summary: "Request admin verification token",
        description: "Request a verification email for admin account activation"
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Verification request accepted",
        schema: {
            type: "object",
            properties: {
                message: { type: "string", example: "Verification email sent" }
            }
        }
    }),
    (0, swagger_1.ApiBadRequestResponse)({ description: "Invalid email address" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RequestAdminVerifyDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "requestAdminVerify", null);
__decorate([
    (0, common_1.Post)("admin/verify"),
    (0, swagger_1.ApiOperation)({
        summary: "Verify admin account",
        description: "Verify an admin account using the token received via email"
    }),
    (0, swagger_1.ApiOkResponse)({
        description: "Admin account verified",
        schema: {
            type: "object",
            properties: {
                message: { type: "string", example: "Account verified successfully" }
            }
        }
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: "Invalid or expired token" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.VerifyAdminDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyAdmin", null);
__decorate([
    (0, common_1.Get)("me"),
    (0, swagger_1.ApiOperation)({
        summary: "Get current authenticated user",
        description: "Retrieve the profile information of the currently authenticated user"
    }),
    (0, swagger_1.ApiCookieAuth)("cookieAuth"),
    (0, swagger_1.ApiOkResponse)({
        description: "Authenticated user payload",
        schema: {
            type: "object",
            properties: {
                id: { type: "string", example: "admin_123" },
                email: { type: "string", format: "email", example: "admin@org.com" },
                role: { type: "string", example: "admin" },
                orgId: { type: "string", example: "org_123abc" },
                verified: { type: "boolean", example: true }
            }
        }
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: "Authentication required" }),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Post)("logout"),
    (0, swagger_1.ApiOperation)({
        summary: "Logout current user",
        description: "Clear the session by removing the authentication cookie"
    }),
    (0, swagger_1.ApiCookieAuth)("cookieAuth"),
    (0, swagger_1.ApiOkResponse)({
        description: "Session cookie cleared",
        schema: {
            type: "object",
            properties: {
                ok: { type: "boolean", example: true },
                message: { type: "string", example: "Logged out successfully" }
            }
        }
    }),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)("Auth"),
    (0, common_1.Controller)("auth"),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map