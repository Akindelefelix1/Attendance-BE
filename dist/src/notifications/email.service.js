"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer_1 = __importDefault(require("nodemailer"));
let EmailService = EmailService_1 = class EmailService {
    logger = new common_1.Logger(EmailService_1.name);
    transporter = null;
    isDeliveryConfigured() {
        const host = process.env.SMTP_HOST?.trim();
        const portRaw = process.env.SMTP_PORT?.trim();
        const user = process.env.SMTP_USER?.trim();
        const pass = process.env.SMTP_PASS;
        if (!host || !portRaw || !user || !pass) {
            return false;
        }
        const port = Number(portRaw);
        return Number.isFinite(port);
    }
    getFrontendBaseUrl() {
        const configuredOrigin = (process.env.FRONTEND_ORIGIN ?? "")
            .split(",")
            .map((value) => value.trim().replace(/\/$/, ""))
            .find(Boolean);
        return configuredOrigin || "http://localhost:5173";
    }
    getAdminVerifyUrl(token) {
        return `${this.getFrontendBaseUrl()}/#/verify-email?token=${encodeURIComponent(token)}`;
    }
    getTransporter() {
        if (this.transporter) {
            return this.transporter;
        }
        if (!this.isDeliveryConfigured()) {
            return null;
        }
        const host = process.env.SMTP_HOST.trim();
        const port = Number(process.env.SMTP_PORT.trim());
        const user = process.env.SMTP_USER.trim();
        const pass = process.env.SMTP_PASS;
        const configuredSecure = process.env.SMTP_SECURE?.trim().toLowerCase();
        const secure = configuredSecure !== undefined ? configuredSecure === "true" : port === 465;
        const configuredFamily = Number(process.env.SMTP_FAMILY?.trim() ?? "4");
        const family = configuredFamily === 4 || configuredFamily === 6 ? configuredFamily : 4;
        this.transporter = nodemailer_1.default.createTransport({
            host,
            port,
            secure,
            family,
            auth: {
                user,
                pass
            }
        });
        return this.transporter;
    }
    getFromAddress() {
        return process.env.SMTP_FROM?.trim() || "Attendance <no-reply@attendance.local>";
    }
    async sendAdminVerificationEmail(payload) {
        const verifyUrl = this.getAdminVerifyUrl(payload.token);
        const transporter = this.getTransporter();
        if (!transporter) {
            this.logger.log(`SMTP not configured. Verification link for ${payload.email}: ${verifyUrl}`);
            return { verifyUrl };
        }
        await transporter.sendMail({
            from: this.getFromAddress(),
            to: payload.email,
            subject: "Verify your Attendance admin email",
            text: `Welcome to Attendance. Verify your admin email with this link: ${verifyUrl}`,
            html: `<p>Welcome to Attendance.</p><p>Please verify your admin email by clicking <a href="${verifyUrl}">this link</a>.</p><p>If you did not request this, you can ignore this email.</p>`
        });
        return { verifyUrl };
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)()
], EmailService);
//# sourceMappingURL=email.service.js.map