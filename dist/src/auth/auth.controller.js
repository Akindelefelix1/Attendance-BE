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
    async register(body, res) {
        const result = await this.authService.registerAdmin(body.orgId, body.email, body.password, res);
        return result;
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
    (0, swagger_1.ApiOperation)({ summary: "Admin login" }),
    (0, swagger_1.ApiOkResponse)({ description: "Admin authenticated successfully" }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: "Invalid credentials" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.AdminLoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)("staff/login"),
    (0, swagger_1.ApiOperation)({ summary: "Staff login" }),
    (0, swagger_1.ApiOkResponse)({ description: "Staff authenticated successfully" }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: "Invalid credentials" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.StaffLoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "staffLogin", null);
__decorate([
    (0, common_1.Post)("staff/request-verify"),
    (0, swagger_1.ApiOperation)({ summary: "Request staff verification token" }),
    (0, swagger_1.ApiOkResponse)({ description: "Verification request accepted" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RequestEmailDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "requestVerify", null);
__decorate([
    (0, common_1.Post)("staff/verify"),
    (0, swagger_1.ApiOperation)({ summary: "Verify staff account" }),
    (0, swagger_1.ApiOkResponse)({ description: "Staff account verified" }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: "Invalid token" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.VerifyTokenDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)("staff/request-reset"),
    (0, swagger_1.ApiOperation)({ summary: "Request staff password reset token" }),
    (0, swagger_1.ApiOkResponse)({ description: "Password reset request accepted" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RequestEmailDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "requestReset", null);
__decorate([
    (0, common_1.Post)("staff/reset"),
    (0, swagger_1.ApiOperation)({ summary: "Reset staff password" }),
    (0, swagger_1.ApiOkResponse)({ description: "Password reset successful" }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: "Invalid or expired token" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "reset", null);
__decorate([
    (0, common_1.Post)("register"),
    (0, swagger_1.ApiOperation)({ summary: "Register organization admin" }),
    (0, swagger_1.ApiOkResponse)({ description: "Admin registered successfully" }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: "Organization not found or plan limit reached" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterAdminDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Get)("me"),
    (0, swagger_1.ApiOperation)({ summary: "Get current authenticated user" }),
    (0, swagger_1.ApiCookieAuth)("cookieAuth"),
    (0, swagger_1.ApiOkResponse)({ description: "Authenticated user payload" }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: "Authentication required" }),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Post)("logout"),
    (0, swagger_1.ApiOperation)({ summary: "Logout current user" }),
    (0, swagger_1.ApiCookieAuth)("cookieAuth"),
    (0, swagger_1.ApiOkResponse)({ description: "Session cookie cleared" }),
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