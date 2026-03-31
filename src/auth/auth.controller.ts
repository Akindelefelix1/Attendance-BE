import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiCookieAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
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
  @ApiOperation({
    summary: "Admin login",
    description: "Authenticate an admin user and create a session. Returns JWT token in httpOnly cookie."
  })
  @ApiOkResponse({
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
  })
  @ApiUnauthorizedResponse({ description: "Incorrect email or password" })
  @ApiBadRequestResponse({ description: "Invalid request body" })
  async login(
    @Body() body: AdminLoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.login(body.email, body.password, res);
    return result;
  }

  @Post("staff/login")
  @ApiOperation({
    summary: "Staff login",
    description: "Authenticate a staff member and create a session. Returns JWT token in httpOnly cookie."
  })
  @ApiOkResponse({
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
  })
  @ApiUnauthorizedResponse({ description: "Incorrect email or password" })
  @ApiBadRequestResponse({ description: "Invalid request body" })
  async staffLogin(
    @Body() body: StaffLoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.authService.staffLogin(body.email, body.password, res);
  }

  @Post("staff/request-verify")
  @ApiOperation({
    summary: "Request staff verification token",
    description: "Request a verification email for staff account activation. Token is sent via email."
  })
  @ApiOkResponse({
    description: "Verification request accepted",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Verification email sent" }
      }
    }
  })
  @ApiBadRequestResponse({ description: "Invalid email address" })
  requestVerify(@Body() body: RequestEmailDto) {
    return this.authService.requestStaffVerify(body.email);
  }

  @Post("staff/verify")
  @ApiOperation({
    summary: "Verify staff account",
    description: "Verify a staff account using the token received via email"
  })
  @ApiOkResponse({
    description: "Staff account verified",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Account verified successfully" }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: "Invalid or expired token" })
  verify(@Body() body: VerifyTokenDto) {
    return this.authService.verifyStaff(body.token);
  }

  @Post("staff/request-reset")
  @ApiOperation({
    summary: "Request staff password reset token",
    description: "Request a password reset email for a staff account. Does not reveal whether the email exists (for security)."
  })
  @ApiOkResponse({
    description: "Password reset request accepted. Always returns success to avoid user enumeration.",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "If the email exists, you will receive a password reset link" }
      }
    }
  })
  requestReset(@Body() body: RequestEmailDto) {
    return this.authService.requestStaffReset(body.email);
  }

  @Post("staff/reset")
  @ApiOperation({
    summary: "Reset staff password",
    description: "Set a new password using the token received via email"
  })
  @ApiOkResponse({
    description: "Password reset successful",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Password reset successfully" }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: "Invalid or expired token" })
  reset(@Body() body: ResetPasswordDto) {
    return this.authService.resetStaffPassword(body.token, body.password);
  }

  @Post("admin/request-reset")
  @ApiOperation({
    summary: "Request admin password reset token",
    description: "Request a password reset email for an admin account. Does not reveal whether the email exists (for security)."
  })
  @ApiOkResponse({
    description: "Password reset request accepted. Always returns success to avoid user enumeration.",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "If the email exists, you will receive a password reset link" }
      }
    }
  })
  requestAdminReset(@Body() body: RequestEmailDto) {
    return this.authService.requestAdminReset(body.email);
  }

  @Post("admin/reset")
  @ApiOperation({
    summary: "Reset admin password",
    description: "Set a new admin password using the token received via email"
  })
  @ApiOkResponse({
    description: "Admin password reset successful",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Password reset successfully" }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: "Invalid or expired token" })
  resetAdmin(@Body() body: ResetPasswordDto) {
    return this.authService.resetAdminPassword(body.token, body.password);
  }

  @Post("register")
  @ApiOperation({
    summary: "Register organization admin",
    description: "Create a new organization admin account. Admin will need to verify email before full access."
  })
  @ApiOkResponse({
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
  })
  @ApiUnauthorizedResponse({ description: "Organization not found or plan limit reached" })
  @ApiConflictResponse({ description: "Email already exists in organization" })
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
  @ApiOperation({
    summary: "Request admin verification token",
    description: "Request a verification email for admin account activation"
  })
  @ApiOkResponse({
    description: "Verification request accepted",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Verification email sent" }
      }
    }
  })
  @ApiBadRequestResponse({ description: "Invalid email address" })
  requestAdminVerify(@Body() body: RequestAdminVerifyDto) {
    return this.authService.requestAdminVerify(body.email);
  }

  @Post("admin/verify")
  @ApiOperation({
    summary: "Verify admin account",
    description: "Verify an admin account using the token received via email"
  })
  @ApiOkResponse({
    description: "Admin account verified",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Account verified successfully" }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: "Invalid or expired token" })
  verifyAdmin(
    @Body() body: VerifyAdminDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.authService.verifyAdmin(body.token, res);
  }

  @Get("me")
  @ApiOperation({
    summary: "Get current authenticated user",
    description: "Retrieve the profile information of the currently authenticated user"
  })
  @ApiCookieAuth("cookieAuth")
  @ApiOkResponse({
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
  })
  @ApiUnauthorizedResponse({ description: "Authentication required" })
  @UseGuards(AuthGuard("jwt"))
  me(@Req() req: Request) {
    return this.authService.me(req);
  }

  @Post("logout")
  @ApiOperation({
    summary: "Logout current user",
    description: "Clear the session by removing the authentication cookie"
  })
  @ApiCookieAuth("cookieAuth")
  @ApiOkResponse({
    description: "Session cookie cleared",
    schema: {
      type: "object",
      properties: {
        ok: { type: "boolean", example: true },
        message: { type: "string", example: "Logged out successfully" }
      }
    }
  })
  logout(@Res({ passthrough: true }) res: Response) {
    this.authService.clearCookie(res);
    return { ok: true };
  }
}
