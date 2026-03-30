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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const promises_1 = require("node:dns/promises");
const nodemailer_1 = __importDefault(require("nodemailer"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
const template_service_1 = require("./template.service");
let EmailService = EmailService_1 = class EmailService {
    templateService;
    logger = new common_1.Logger(EmailService_1.name);
    transporter = null;
    constructor(templateService) {
        this.templateService = templateService;
        const sendGridApiKey = process.env.SENDGRID_API_KEY?.trim();
        if (sendGridApiKey) {
            mail_1.default.setApiKey(sendGridApiKey);
        }
    }
    isDeliveryConfigured() {
        const sendGridApiKey = process.env.SENDGRID_API_KEY?.trim();
        if (sendGridApiKey) {
            return true;
        }
        const brevoApiKey = process.env.BREVO_API_KEY?.trim();
        if (brevoApiKey) {
            return true;
        }
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
    getAdminResetUrl(token) {
        return `${this.getFrontendBaseUrl()}/#/admin-reset-password?token=${encodeURIComponent(token)}`;
    }
    getStaffResetUrl(token) {
        return `${this.getFrontendBaseUrl()}/#/staff-reset-password?token=${encodeURIComponent(token)}`;
    }
    async resolveSmtpTarget(host, family) {
        if (family !== 4) {
            return { host, tlsServername: host };
        }
        try {
            const ipv4Records = await (0, promises_1.resolve4)(host);
            if (ipv4Records.length > 0) {
                return { host: ipv4Records[0], tlsServername: host };
            }
        }
        catch (error) {
            this.logger.warn(`Could not resolve IPv4 for SMTP host ${host}. Falling back to default DNS resolution.`);
            this.logger.debug(String(error));
        }
        return { host, tlsServername: host };
    }
    async getTransporter() {
        if (this.transporter) {
            return this.transporter;
        }
        const host = process.env.SMTP_HOST?.trim();
        const portRaw = process.env.SMTP_PORT?.trim();
        const user = process.env.SMTP_USER?.trim();
        const pass = process.env.SMTP_PASS;
        if (!host || !portRaw || !user || !pass) {
            return null;
        }
        const port = Number(portRaw);
        if (!Number.isFinite(port)) {
            return null;
        }
        const configuredSecure = process.env.SMTP_SECURE?.trim().toLowerCase();
        const secure = configuredSecure !== undefined ? configuredSecure === "true" : port === 465;
        const configuredFamily = Number(process.env.SMTP_FAMILY?.trim() ?? "4");
        const family = (configuredFamily === 4 || configuredFamily === 6
            ? configuredFamily
            : 4);
        const target = await this.resolveSmtpTarget(host, family);
        this.transporter = nodemailer_1.default.createTransport({
            host: target.host,
            port,
            secure,
            family,
            tls: {
                servername: target.tlsServername
            },
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
    parseFromAddress() {
        const from = this.getFromAddress();
        const matched = from.match(/^(.*)<([^>]+)>$/);
        if (!matched) {
            return {
                name: "Attendance",
                email: from.trim()
            };
        }
        return {
            name: matched[1].trim().replace(/^"|"$/g, "") || "Attendance",
            email: matched[2].trim()
        };
    }
    normalizeEmails(emails) {
        return Array.from(new Set(emails
            .map((email) => email.trim().toLowerCase())
            .filter((email) => email.length > 3 && email.includes("@"))));
    }
    async sendGenericViaSendGrid(to, subject, html, text) {
        const apiKey = process.env.SENDGRID_API_KEY?.trim();
        if (!apiKey) {
            return null;
        }
        try {
            const from = this.parseFromAddress();
            await mail_1.default.send({
                to,
                from: {
                    email: from.email,
                    name: from.name
                },
                subject,
                text,
                html,
                replyTo: from.email
            });
            return { delivered: true, provider: "sendgrid" };
        }
        catch (error) {
            const sendGridStatus = typeof error === "object" && error !== null && "code" in error
                ? String(error.code ?? "")
                : "";
            const sendGridBody = typeof error === "object" &&
                error !== null &&
                "response" in error &&
                error.response?.body
                ? JSON.stringify(error.response.body)
                : "";
            this.logger.error(`SendGrid generic email send failed for ${to}. ${sendGridStatus ? `Code: ${sendGridStatus}.` : ""} ${sendGridBody ? `Response: ${sendGridBody}` : ""}`, error instanceof Error ? error.stack : String(error));
            return { delivered: false, provider: "sendgrid" };
        }
    }
    async sendGenericViaBrevoApi(to, subject, html, text) {
        const apiKey = process.env.BREVO_API_KEY?.trim();
        if (!apiKey) {
            return null;
        }
        const from = this.parseFromAddress();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
            const response = await fetch("https://api.brevo.com/v3/smtp/email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": apiKey
                },
                body: JSON.stringify({
                    sender: {
                        name: from.name,
                        email: from.email
                    },
                    to: [{ email: to }],
                    subject,
                    textContent: text,
                    htmlContent: html
                }),
                signal: controller.signal
            });
            if (!response.ok) {
                const body = await response.text();
                this.logger.error(`Brevo API generic email send failed with status ${response.status}: ${body}`);
                return { delivered: false, provider: "brevo-api" };
            }
            return { delivered: true, provider: "brevo-api" };
        }
        catch (error) {
            this.logger.error(`Brevo API generic email send failed for ${to}.`, error instanceof Error ? error.stack : String(error));
            return { delivered: false, provider: "brevo-api" };
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async sendGenericViaSmtp(to, subject, html, text) {
        const transporter = await this.getTransporter();
        if (!transporter) {
            return null;
        }
        try {
            await transporter.sendMail({
                from: this.getFromAddress(),
                to,
                subject,
                text,
                html
            });
            return { delivered: true, provider: "smtp" };
        }
        catch (error) {
            this.logger.error(`SMTP generic email send failed for ${to}.`, error instanceof Error ? error.stack : String(error));
            return { delivered: false, provider: "smtp" };
        }
    }
    async sendGenericEmail(to, subject, html, text) {
        const sendGridResult = await this.sendGenericViaSendGrid(to, subject, html, text);
        if (sendGridResult?.delivered) {
            return sendGridResult;
        }
        const brevoResult = await this.sendGenericViaBrevoApi(to, subject, html, text);
        if (brevoResult?.delivered) {
            return brevoResult;
        }
        const smtpResult = await this.sendGenericViaSmtp(to, subject, html, text);
        if (smtpResult) {
            return smtpResult;
        }
        return { delivered: false, provider: "none" };
    }
    async sendOrganizationActivityEmail(payload) {
        const recipients = this.normalizeEmails(payload.adminEmails);
        if (recipients.length === 0) {
            this.logger.log(`No admin recipients configured for organization activity: ${payload.organizationName}`);
            return { attempted: 0, delivered: 0 };
        }
        const details = payload.details ?? [];
        const detailsText = details.length === 0
            ? "- No additional details"
            : details.map((item) => `- ${item.label}: ${item.value}`).join("\n");
        const subject = `[Attendance] ${payload.activityType} - ${payload.organizationName}`;
        const results = await Promise.all(recipients.map(async (to) => {
            const htmlContent = this.templateService.renderTemplate("organization-activity.html", {
                organizationName: payload.organizationName,
                activityType: payload.activityType,
                summary: payload.summary,
                actor: payload.actor || "System",
                details,
                happenedAtISO: new Date().toISOString()
            });
            const textContent = this.templateService.renderTemplate("organization-activity.txt", {
                organizationName: payload.organizationName,
                activityType: payload.activityType,
                summary: payload.summary,
                actor: payload.actor || "System",
                detailsText,
                happenedAtISO: new Date().toISOString()
            });
            const delivery = await this.sendGenericEmail(to, subject, htmlContent, textContent);
            return delivery.delivered;
        }));
        const delivered = results.filter(Boolean).length;
        this.logger.log(`Organization activity notifications sent: ${delivered}/${recipients.length} delivered for ${payload.organizationName}`);
        return {
            attempted: recipients.length,
            delivered
        };
    }
    async sendStaffOnboardingEmail(payload) {
        const recipients = this.normalizeEmails([payload.staffEmail]);
        if (recipients.length === 0) {
            return { attempted: 0, delivered: 0 };
        }
        const happenedAtISO = new Date().toISOString();
        const subject = `[Attendance] Welcome to ${payload.organizationName}`;
        const htmlContent = this.templateService.renderTemplate("staff-onboarded.html", {
            organizationName: payload.organizationName,
            staffName: payload.staffName,
            setupUrl: this.getStaffResetUrl(payload.resetToken),
            happenedAtISO
        });
        const textContent = this.templateService.renderTemplate("staff-onboarded.txt", {
            organizationName: payload.organizationName,
            staffName: payload.staffName,
            setupUrl: this.getStaffResetUrl(payload.resetToken),
            happenedAtISO
        });
        const delivery = await this.sendGenericEmail(recipients[0], subject, htmlContent, textContent);
        return {
            attempted: 1,
            delivered: delivery.delivered ? 1 : 0
        };
    }
    async sendStaffPasswordResetEmail(payload) {
        const recipients = this.normalizeEmails([payload.staffEmail]);
        if (recipients.length === 0) {
            return { attempted: 0, delivered: 0 };
        }
        const happenedAtISO = new Date().toISOString();
        const resetUrl = this.getStaffResetUrl(payload.resetToken);
        const subject = `[Attendance] Password Reset Required - ${payload.organizationName}`;
        const htmlContent = this.templateService.renderTemplate("staff-password-reset.html", {
            organizationName: payload.organizationName,
            staffName: payload.staffName,
            resetUrl,
            reason: payload.reason || "Your account requires a password reset.",
            happenedAtISO
        });
        const textContent = this.templateService.renderTemplate("staff-password-reset.txt", {
            organizationName: payload.organizationName,
            staffName: payload.staffName,
            resetUrl,
            reason: payload.reason || "Your account requires a password reset.",
            happenedAtISO
        });
        const delivery = await this.sendGenericEmail(recipients[0], subject, htmlContent, textContent);
        return {
            attempted: 1,
            delivered: delivery.delivered ? 1 : 0
        };
    }
    async sendViaSendGrid(payload, verifyUrl, userName) {
        const apiKey = process.env.SENDGRID_API_KEY?.trim();
        if (!apiKey) {
            return null;
        }
        try {
            const from = this.parseFromAddress();
            const htmlContent = this.templateService.renderTemplate("admin-verification.html", { verifyUrl, name: userName || "Admin" });
            const textContent = this.templateService.renderTemplate("admin-verification.txt", { verifyUrl, name: userName || "Admin" });
            await mail_1.default.send({
                to: payload.email,
                from: {
                    email: from.email,
                    name: from.name
                },
                subject: "Verify your Attendance admin email",
                text: textContent,
                html: htmlContent,
                replyTo: from.email
            });
            this.logger.log(`Verification email sent to ${payload.email} via SendGrid`);
            return { verifyUrl, delivered: true, provider: "sendgrid" };
        }
        catch (error) {
            const sendGridStatus = typeof error === "object" && error !== null && "code" in error
                ? String(error.code ?? "")
                : "";
            const sendGridBody = typeof error === "object" &&
                error !== null &&
                "response" in error &&
                error.response?.body
                ? JSON.stringify(error.response.body)
                : "";
            this.logger.error(`SendGrid email send failed for ${payload.email}. ${sendGridStatus ? `Code: ${sendGridStatus}.` : ""} ${sendGridBody ? `Response: ${sendGridBody}` : ""}`, error instanceof Error ? error.stack : String(error));
            return { verifyUrl, delivered: false, provider: "sendgrid" };
        }
    }
    async sendViaBrevoApi(payload, verifyUrl, userName) {
        const apiKey = process.env.BREVO_API_KEY?.trim();
        if (!apiKey) {
            return null;
        }
        const from = this.parseFromAddress();
        const htmlContent = this.templateService.renderTemplate("admin-verification.html", { verifyUrl, name: userName || "Admin" });
        const textContent = this.templateService.renderTemplate("admin-verification.txt", { verifyUrl, name: userName || "Admin" });
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
            const response = await fetch("https://api.brevo.com/v3/smtp/email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": apiKey
                },
                body: JSON.stringify({
                    sender: {
                        name: from.name,
                        email: from.email
                    },
                    to: [{ email: payload.email }],
                    subject: "Verify your Attendance admin email",
                    textContent,
                    htmlContent
                }),
                signal: controller.signal
            });
            if (!response.ok) {
                const body = await response.text();
                this.logger.error(`Brevo API email send failed with status ${response.status}: ${body}`);
                return { verifyUrl, delivered: false, provider: "brevo-api" };
            }
            this.logger.log(`Verification email sent to ${payload.email} via Brevo API`);
            return { verifyUrl, delivered: true, provider: "brevo-api" };
        }
        catch (error) {
            this.logger.error(`Brevo API email send failed for ${payload.email}.`, error instanceof Error ? error.stack : String(error));
            return { verifyUrl, delivered: false, provider: "brevo-api" };
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async sendAdminVerificationEmail(payload, userName) {
        const verifyUrl = this.getAdminVerifyUrl(payload.token);
        const sendGridResult = await this.sendViaSendGrid(payload, verifyUrl, userName);
        if (sendGridResult?.delivered) {
            return sendGridResult;
        }
        const brevoApiResult = await this.sendViaBrevoApi(payload, verifyUrl, userName);
        if (brevoApiResult?.delivered) {
            return brevoApiResult;
        }
        const transporter = await this.getTransporter();
        if (!transporter) {
            this.logger.log(`No email provider configured. Verification link for ${payload.email}: ${verifyUrl}`);
            return { verifyUrl, delivered: false, provider: "none" };
        }
        try {
            const htmlContent = this.templateService.renderTemplate("admin-verification.html", { verifyUrl, name: userName || "Admin" });
            const textContent = this.templateService.renderTemplate("admin-verification.txt", { verifyUrl, name: userName || "Admin" });
            await transporter.sendMail({
                from: this.getFromAddress(),
                to: payload.email,
                subject: "Verify your Attendance admin email",
                text: textContent,
                html: htmlContent
            });
            this.logger.log(`Verification email sent to ${payload.email} via SMTP`);
        }
        catch (error) {
            this.logger.error(`Failed to send verification email to ${payload.email}.`, error instanceof Error ? error.stack : String(error));
            return { verifyUrl, delivered: false, provider: "smtp" };
        }
        return { verifyUrl, delivered: true, provider: "smtp" };
    }
    async sendAdminPasswordResetEmail(payload) {
        const resetUrl = this.getAdminResetUrl(payload.token);
        const subject = "Reset your Attendance admin password";
        const htmlContent = this.templateService.renderTemplate("admin-password-reset.html", {
            resetUrl,
            happenedAtISO: new Date().toISOString()
        });
        const textContent = this.templateService.renderTemplate("admin-password-reset.txt", {
            resetUrl,
            happenedAtISO: new Date().toISOString()
        });
        const delivery = await this.sendGenericEmail(payload.email, subject, htmlContent, textContent);
        return {
            resetUrl,
            delivered: delivery.delivered,
            provider: delivery.provider
        };
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [template_service_1.TemplateService])
], EmailService);
//# sourceMappingURL=email.service.js.map