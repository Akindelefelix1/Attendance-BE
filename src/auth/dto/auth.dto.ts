import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class AdminLoginDto {
  @ApiProperty({ example: "admin@felix.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "admin123" })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class StaffLoginDto {
  @ApiProperty({ example: "ifeanyi@valetax.io" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "staff123" })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RequestEmailDto {
  @ApiProperty({ example: "ifeanyi@valetax.io" })
  @IsEmail()
  email!: string;
}

export class VerifyTokenDto {
  @ApiProperty({ example: "97bf5946-74b8-4a99-abcd-b4ee18abbe12" })
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: "97bf5946-74b8-4a99-abcd-b4ee18abbe12" })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: "newPassword123" })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class RegisterAdminDto {
  @ApiProperty({ example: "cm8sz6yvw0000mjk3x4j6iz4m" })
  @IsString()
  @IsNotEmpty()
  orgId!: string;

  @ApiProperty({ example: "admin@felix.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "admin123" })
  @IsString()
  @MinLength(6)
  password!: string;
}