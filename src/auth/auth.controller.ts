import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from "@nestjs/swagger";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import {
  AdminLoginDto,
  RequestAdminVerifyDto,
  RegisterAdminDto,
  RequestEmailDto,
  ResetPasswordDto,
  StaffLoginDto,
  VerifyAdminDto,
  VerifyTokenDto
} from "./dto/auth.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @ApiOperation({ summary: "Admin login" })
  @ApiOkResponse({ description: "Admin authenticated successfully" })
  @ApiUnauthorizedResponse({ description: "Invalid credentials" })
  async login(
    @Body() body: AdminLoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.login(body.email, body.password, res);
    return result;
  }

  @Post("staff/login")
  @ApiOperation({ summary: "Staff login" })
  @ApiOkResponse({ description: "Staff authenticated successfully" })
  @ApiUnauthorizedResponse({ description: "Invalid credentials" })
  async staffLogin(
    @Body() body: StaffLoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.authService.staffLogin(body.email, body.password, res);
  }

  @Post("staff/request-verify")
  @ApiOperation({ summary: "Request staff verification token" })
  @ApiOkResponse({ description: "Verification request accepted" })
  requestVerify(@Body() body: RequestEmailDto) {
    return this.authService.requestStaffVerify(body.email);
  }

  @Post("staff/verify")
  @ApiOperation({ summary: "Verify staff account" })
  @ApiOkResponse({ description: "Staff account verified" })
  @ApiUnauthorizedResponse({ description: "Invalid token" })
  verify(@Body() body: VerifyTokenDto) {
    return this.authService.verifyStaff(body.token);
  }

  @Post("staff/request-reset")
  @ApiOperation({ summary: "Request staff password reset token" })
  @ApiOkResponse({ description: "Password reset request accepted" })
  requestReset(@Body() body: RequestEmailDto) {
    return this.authService.requestStaffReset(body.email);
  }

  @Post("staff/reset")
  @ApiOperation({ summary: "Reset staff password" })
  @ApiOkResponse({ description: "Password reset successful" })
  @ApiUnauthorizedResponse({ description: "Invalid or expired token" })
  reset(@Body() body: ResetPasswordDto) {
    return this.authService.resetStaffPassword(body.token, body.password);
  }

  @Post("admin/request-reset")
  @ApiOperation({ summary: "Request admin password reset token" })
  @ApiOkResponse({ description: "Password reset request accepted" })
  requestAdminReset(@Body() body: RequestEmailDto) {
    return this.authService.requestAdminReset(body.email);
  }

  @Post("admin/reset")
  @ApiOperation({ summary: "Reset admin password" })
  @ApiOkResponse({ description: "Admin password reset successful" })
  @ApiUnauthorizedResponse({ description: "Invalid or expired token" })
  resetAdmin(@Body() body: ResetPasswordDto) {
    return this.authService.resetAdminPassword(body.token, body.password);
  }

  @Post("register")
  @ApiOperation({ summary: "Register organization admin" })
  @ApiOkResponse({ description: "Admin registered successfully" })
  @ApiUnauthorizedResponse({ description: "Organization not found or plan limit reached" })
  async register(
    @Body() body: RegisterAdminDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.registerAdmin(
      body.orgId,
      body.email,
      body.password,
      res
    );
    return result;
  }

  @Post("admin/request-verify")
  @ApiOperation({ summary: "Request admin verification token" })
  @ApiOkResponse({ description: "Verification request accepted" })
  requestAdminVerify(@Body() body: RequestAdminVerifyDto) {
    return this.authService.requestAdminVerify(body.email);
  }

  @Post("admin/verify")
  @ApiOperation({ summary: "Verify admin account" })
  @ApiOkResponse({ description: "Admin account verified" })
  @ApiUnauthorizedResponse({ description: "Invalid or expired token" })
  verifyAdmin(
    @Body() body: VerifyAdminDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.authService.verifyAdmin(body.token, res);
  }

  @Get("me")
  @ApiOperation({ summary: "Get current authenticated user" })
  @ApiCookieAuth("cookieAuth")
  @ApiOkResponse({ description: "Authenticated user payload" })
  @ApiUnauthorizedResponse({ description: "Authentication required" })
  @UseGuards(AuthGuard("jwt"))
  me(@Req() req: Request) {
    return this.authService.me(req);
  }

  @Post("logout")
  @ApiOperation({ summary: "Logout current user" })
  @ApiCookieAuth("cookieAuth")
  @ApiOkResponse({ description: "Session cookie cleared" })
  logout(@Res({ passthrough: true }) res: Response) {
    this.authService.clearCookie(res);
    return { ok: true };
  }
}
