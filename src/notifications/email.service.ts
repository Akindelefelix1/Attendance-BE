import { Injectable, Logger } from "@nestjs/common";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

type AdminVerificationPayload = {
  email: string;
  token: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

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

  private getFrontendBaseUrl() {
    const configuredOrigin = (process.env.FRONTEND_ORIGIN ?? "")
      .split(",")
      .map((value) => value.trim().replace(/\/$/, ""))
      .find(Boolean);

    return configuredOrigin || "http://localhost:5173";
  }

  private getAdminVerifyUrl(token: string) {
    return `${this.getFrontendBaseUrl()}/#/verify-email?token=${encodeURIComponent(token)}`;
  }

  private getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    if (!this.isDeliveryConfigured()) {
      return null;
    }

    const host = process.env.SMTP_HOST!.trim();
    const port = Number(process.env.SMTP_PORT!.trim());
    const user = process.env.SMTP_USER!.trim();
    const pass = process.env.SMTP_PASS!;
    const configuredSecure = process.env.SMTP_SECURE?.trim().toLowerCase();
    const secure =
      configuredSecure !== undefined ? configuredSecure === "true" : port === 465;
    const configuredFamily = Number(process.env.SMTP_FAMILY?.trim() ?? "4");
    const family = configuredFamily === 4 || configuredFamily === 6 ? configuredFamily : 4;

    this.transporter = nodemailer.createTransport({
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

  private getFromAddress() {
    return process.env.SMTP_FROM?.trim() || "Attendance <no-reply@attendance.local>";
  }

  async sendAdminVerificationEmail(payload: AdminVerificationPayload) {
    const verifyUrl = this.getAdminVerifyUrl(payload.token);
    const transporter = this.getTransporter();

    if (!transporter) {
      this.logger.log(
        `SMTP not configured. Verification link for ${payload.email}: ${verifyUrl}`
      );
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
}
