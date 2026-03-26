import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsNumber, IsOptional, IsString } from "class-validator";

export class AttendanceListQueryDto {
  @ApiProperty({ example: "cm8sz6yvw0000mjk3x4j6iz4m" })
  @IsString()
  orgId!: string;

  @ApiProperty({ example: "2026-03-26" })
  @IsDateString()
  dateISO!: string;
}

export class AttendanceMarkDto {
  @ApiProperty({ example: "cm8sz6yvw0000mjk3x4j6iz4m" })
  @IsString()
  organizationId!: string;

  @ApiProperty({ example: "cm8sz7ym10001mjk32q4i8cz8" })
  @IsString()
  staffId!: string;

  @ApiProperty({ example: "2026-03-26" })
  @IsDateString()
  dateISO!: string;

  @ApiPropertyOptional({ example: 6.5244 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 3.3792 })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}