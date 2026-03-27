import { Injectable, Logger } from "@nestjs/common";
import { resolve4 } from "node:dns/promises";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

type AdminVerificationPayload = {
  email: string;
  token: string;
};

type EmailDeliveryResult = {
  verifyUrl: string;
  delivered: boolean;
  provider: "brevo-api" | "smtp" | "none";
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  isDeliveryConfigured() {
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

  private async resolveSmtpTarget(host: string, family: 4 | 6) {
    if (family !== 4) {
      return { host, tlsServername: host };
    }

    try {
      const ipv4Records = await resolve4(host);
      if (ipv4Records.length > 0) {
        return { host: ipv4Records[0], tlsServername: host };
      }
    } catch (error) {
      this.logger.warn(
        `Could not resolve IPv4 for SMTP host ${host}. Falling back to default DNS resolution.`
      );
      this.logger.debug(String(error));
    }

    return { host, tlsServername: host };
  }

  private async getTransporter() {
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
    const family = (configuredFamily === 4 || configuredFamily === 6
      ? configuredFamily
      : 4) as 4 | 6;
    const target = await this.resolveSmtpTarget(host, family);

    this.transporter = nodemailer.createTransport({
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

  private getFromAddress() {
    return process.env.SMTP_FROM?.trim() || "Attendance <no-reply@attendance.local>";
  }

  private parseFromAddress() {
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

  private async sendViaBrevoApi(payload: AdminVerificationPayload, verifyUrl: string) {
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
          to: [{ email: payload.email }],
          subject: "Verify your Attendance admin email",
          textContent: `Welcome to Attendance. Verify your admin email with this link: ${verifyUrl}`,
          htmlContent: `<p>Welcome to Attendance.</p><p>Please verify your admin email by clicking <a href=\"${verifyUrl}\">this link</a>.</p><p>If you did not request this, you can ignore this email.</p>`
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(
          `Brevo API email send failed with status ${response.status}: ${body}`
        );
        return { verifyUrl, delivered: false, provider: "brevo-api" } as const;
      }

      return { verifyUrl, delivered: true, provider: "brevo-api" } as const;
    } catch (error) {
      this.logger.error(
        `Brevo API email send failed for ${payload.email}.`,
        error instanceof Error ? error.stack : String(error)
      );
      return { verifyUrl, delivered: false, provider: "brevo-api" } as const;
    } finally {
      clearTimeout(timeout);
    }
  }

  async sendAdminVerificationEmail(payload: AdminVerificationPayload) {
    const verifyUrl = this.getAdminVerifyUrl(payload.token);
    const brevoApiResult = await this.sendViaBrevoApi(payload, verifyUrl);
    if (brevoApiResult) {
      return brevoApiResult;
    }

    const transporter = await this.getTransporter();

    if (!transporter) {
      this.logger.log(
        `SMTP not configured. Verification link for ${payload.email}: ${verifyUrl}`
      );
      return { verifyUrl, delivered: false, provider: "none" };
    }

    try {
      await transporter.sendMail({
        from: this.getFromAddress(),
        to: payload.email,
        subject: "Verify your Attendance admin email",
        text: `Welcome to Attendance. Verify your admin email with this link: ${verifyUrl}`,
        html: `<p>Welcome to Attendance.</p><p>Please verify your admin email by clicking <a href="${verifyUrl}">this link</a>.</p><p>If you did not request this, you can ignore this email.</p>`
      });
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${payload.email}.`,
        error instanceof Error ? error.stack : String(error)
      );
      return { verifyUrl, delivered: false, provider: "smtp" };
    }

    return { verifyUrl, delivered: true, provider: "smtp" };
  }
}
