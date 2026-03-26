import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBody,
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
  RegisterAdminDto,
  RequestEmailDto,
  ResetPasswordDto,
  StaffLoginDto,
  VerifyTokenDto
} from "./dto/auth.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @ApiOperation({ summary: "Admin login" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string" }
      }
    }
  })
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
  @ApiBody({
    schema: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string" }
      }
    }
  })
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
  @ApiBody({
    schema: {
      type: "object",
      required: ["email"],
      properties: {
        email: { type: "string", format: "email" }
      }
    }
  })
  @ApiOkResponse({ description: "Verification request accepted" })
  requestVerify(@Body() body: RequestEmailDto) {
    return this.authService.requestStaffVerify(body.email);
  }

  @Post("staff/verify")
  @ApiOperation({ summary: "Verify staff account" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["token"],
      properties: {
        token: { type: "string" }
      }
    }
  })
  @ApiOkResponse({ description: "Staff account verified" })
  @ApiUnauthorizedResponse({ description: "Invalid token" })
  verify(@Body() body: VerifyTokenDto) {
    return this.authService.verifyStaff(body.token);
  }

  @Post("staff/request-reset")
  @ApiOperation({ summary: "Request staff password reset token" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["email"],
      properties: {
        email: { type: "string", format: "email" }
      }
    }
  })
  @ApiOkResponse({ description: "Password reset request accepted" })
  requestReset(@Body() body: RequestEmailDto) {
    return this.authService.requestStaffReset(body.email);
  }

  @Post("staff/reset")
  @ApiOperation({ summary: "Reset staff password" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["token", "password"],
      properties: {
        token: { type: "string" },
        password: { type: "string" }
      }
    }
  })
  @ApiOkResponse({ description: "Password reset successful" })
  @ApiUnauthorizedResponse({ description: "Invalid or expired token" })
  reset(@Body() body: ResetPasswordDto) {
    return this.authService.resetStaffPassword(body.token, body.password);
  }

  @Post("register")
  @ApiOperation({ summary: "Register organization admin" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["orgId", "email", "password"],
      properties: {
        orgId: { type: "string" },
        email: { type: "string", format: "email" },
        password: { type: "string" }
      }
    }
  })
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
