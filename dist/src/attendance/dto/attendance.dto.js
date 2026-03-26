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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceMarkDto = exports.AttendanceListQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AttendanceListQueryDto {
    orgId;
    dateISO;
}
exports.AttendanceListQueryDto = AttendanceListQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "cm8sz6yvw0000mjk3x4j6iz4m" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttendanceListQueryDto.prototype, "orgId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-03-26" }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AttendanceListQueryDto.prototype, "dateISO", void 0);
class AttendanceMarkDto {
    organizationId;
    staffId;
    dateISO;
    latitude;
    longitude;
}
exports.AttendanceMarkDto = AttendanceMarkDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "cm8sz6yvw0000mjk3x4j6iz4m" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttendanceMarkDto.prototype, "organizationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "cm8sz7ym10001mjk32q4i8cz8" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttendanceMarkDto.prototype, "staffId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2026-03-26" }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AttendanceMarkDto.prototype, "dateISO", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 6.5244 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AttendanceMarkDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 3.3792 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AttendanceMarkDto.prototype, "longitude", void 0);
//# sourceMappingURL=attendance.dto.js.map