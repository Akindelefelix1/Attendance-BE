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
exports.RegisterAdminDto = exports.ResetPasswordDto = exports.VerifyTokenDto = exports.RequestEmailDto = exports.StaffLoginDto = exports.AdminLoginDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AdminLoginDto {
    email;
    password;
}
exports.AdminLoginDto = AdminLoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "admin@felix.com" }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], AdminLoginDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "admin123" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AdminLoginDto.prototype, "password", void 0);
class StaffLoginDto {
    email;
    password;
}
exports.StaffLoginDto = StaffLoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "ifeanyi@valetax.io" }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], StaffLoginDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "staff123" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], StaffLoginDto.prototype, "password", void 0);
class RequestEmailDto {
    email;
}
exports.RequestEmailDto = RequestEmailDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "ifeanyi@valetax.io" }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RequestEmailDto.prototype, "email", void 0);
class VerifyTokenDto {
    token;
}
exports.VerifyTokenDto = VerifyTokenDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "97bf5946-74b8-4a99-abcd-b4ee18abbe12" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VerifyTokenDto.prototype, "token", void 0);
class ResetPasswordDto {
    token;
    password;
}
exports.ResetPasswordDto = ResetPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "97bf5946-74b8-4a99-abcd-b4ee18abbe12" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "newPassword123" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "password", void 0);
class RegisterAdminDto {
    orgId;
    email;
    password;
}
exports.RegisterAdminDto = RegisterAdminDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "cm8sz6yvw0000mjk3x4j6iz4m" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterAdminDto.prototype, "orgId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "admin@felix.com" }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterAdminDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "admin123" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], RegisterAdminDto.prototype, "password", void 0);
//# sourceMappingURL=auth.dto.js.map