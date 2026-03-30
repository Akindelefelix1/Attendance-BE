import { Injectable, Logger } from "@nestjs/common";
import { resolve4 } from "node:dns/promises";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import sgMail from "@sendgrid/mail";
import { TemplateService } from "./template.service";

type AdminVerificationPayload = {
  email: string;
  token: string;
};

type AdminPasswordResetPayload = {
  email: string;
  token: string;
};

type OrganizationActivityPayload = {
  organizationName: string;
  adminEmails: string[];
  activityType: string;
  summary: string;
  actor?: string;
  details?: Array<{ label: string; value: string }>;
};

type StaffOnboardingPayload = {
  organizationName: string;
  staffEmail: string;
  staffName: string;
  resetToken: string;
};

type StaffPasswordResetPayload = {
  organizationName: string;
  staffEmail: string;
  staffName: string;
  resetToken: string;
  reason?: string;
};

type EmailDeliveryResult = {
  verifyUrl: string;
  delivered: boolean;
  provider: "sendgrid" | "brevo-api" | "smtp" | "none";
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private templateService: TemplateService) {
    const sendGridApiKey = process.env.SENDGRID_API_KEY?.trim();
    if (sendGridApiKey) {
      sgMail.setApiKey(sendGridApiKey);
    }
  }

  isDeliveryConfigured() {
    // Check SendGrid first (highest priority)
    const sendGridApiKey = process.env.SENDGRID_API_KEY?.trim();
    if (sendGridApiKey) {
      return true;
    }

    // Then check Brevo
    const brevoApiKey = process.env.BREVO_API_KEY?.trim();
    if (brevoApiKey) {
      return true;
    }

    // Finally check SMTP
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

  private getAdminResetUrl(token: string) {
    return `${this.getFrontendBaseUrl()}/#/admin-reset-password?token=${encodeURIComponent(token)}`;
  }

  private getStaffResetUrl(token: string) {
    return `${this.getFrontendBaseUrl()}/#/staff-reset-password?token=${encodeURIComponent(token)}`;
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

  private normalizeEmails(emails: string[]) {
    return Array.from(
      new Set(
        emails
          .map((email) => email.trim().toLowerCase())
          .filter((email) => email.length > 3 && email.includes("@"))
      )
    );
  }

  private async sendGenericViaSendGrid(
    to: string,
    subject: string,
    html: string,
    text: string
  ) {
    const apiKey = process.env.SENDGRID_API_KEY?.trim();
    if (!apiKey) {
      return null;
    }

    try {
      const from = this.parseFromAddress();
      await sgMail.send({
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

      return { delivered: true, provider: "sendgrid" } as const;
    } catch (error) {
      const sendGridStatus =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: unknown }).code ?? "")
          : "";
      const sendGridBody =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { body?: unknown } }).response?.body
          ? JSON.stringify((error as { response: { body: unknown } }).response.body)
          : "";

      this.logger.error(
        `SendGrid generic email send failed for ${to}. ${sendGridStatus ? `Code: ${sendGridStatus}.` : ""} ${sendGridBody ? `Response: ${sendGridBody}` : ""}`,
        error instanceof Error ? error.stack : String(error)
      );
      return { delivered: false, provider: "sendgrid" } as const;
    }
  }

  private async sendGenericViaBrevoApi(
    to: string,
    subject: string,
    html: string,
    text: string
  ) {
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
        this.logger.error(
          `Brevo API generic email send failed with status ${response.status}: ${body}`
        );
        return { delivered: false, provider: "brevo-api" } as const;
      }

      return { delivered: true, provider: "brevo-api" } as const;
    } catch (error) {
      this.logger.error(
        `Brevo API generic email send failed for ${to}.`,
        error instanceof Error ? error.stack : String(error)
      );
      return { delivered: false, provider: "brevo-api" } as const;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async sendGenericViaSmtp(
    to: string,
    subject: string,
    html: string,
    text: string
  ) {
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
      return { delivered: true, provider: "smtp" } as const;
    } catch (error) {
      this.logger.error(
        `SMTP generic email send failed for ${to}.`,
        error instanceof Error ? error.stack : String(error)
      );
      return { delivered: false, provider: "smtp" } as const;
    }
  }

  private async sendGenericEmail(
    to: string,
    subject: string,
    html: string,
    text: string
  ) {
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

    return { delivered: false, provider: "none" } as const;
  }

  async sendOrganizationActivityEmail(payload: OrganizationActivityPayload) {
    const recipients = this.normalizeEmails(payload.adminEmails);
    if (recipients.length === 0) {
      this.logger.log(
        `No admin recipients configured for organization activity: ${payload.organizationName}`
      );
      return { attempted: 0, delivered: 0 };
    }

    const details = payload.details ?? [];
    const detailsText =
      details.length === 0
        ? "- No additional details"
        : details.map((item) => `- ${item.label}: ${item.value}`).join("\n");
    const subject = `[Attendance] ${payload.activityType} - ${payload.organizationName}`;

    const results = await Promise.all(
      recipients.map(async (to) => {
        const htmlContent = this.templateService.renderTemplate(
          "organization-activity.html",
          {
            organizationName: payload.organizationName,
            activityType: payload.activityType,
            summary: payload.summary,
            actor: payload.actor || "System",
            details,
            happenedAtISO: new Date().toISOString()
          }
        );

        const textContent = this.templateService.renderTemplate(
          "organization-activity.txt",
          {
            organizationName: payload.organizationName,
            activityType: payload.activityType,
            summary: payload.summary,
            actor: payload.actor || "System",
            detailsText,
            happenedAtISO: new Date().toISOString()
          }
        );

        const delivery = await this.sendGenericEmail(to, subject, htmlContent, textContent);
        return delivery.delivered;
      })
    );

    const delivered = results.filter(Boolean).length;
    this.logger.log(
      `Organization activity notifications sent: ${delivered}/${recipients.length} delivered for ${payload.organizationName}`
    );

    return {
      attempted: recipients.length,
      delivered
    };
  }

  async sendStaffOnboardingEmail(payload: StaffOnboardingPayload) {
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

    const delivery = await this.sendGenericEmail(
      recipients[0],
      subject,
      htmlContent,
      textContent
    );

    return {
      attempted: 1,
      delivered: delivery.delivered ? 1 : 0
    };
  }

  async sendStaffPasswordResetEmail(payload: StaffPasswordResetPayload) {
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

    const delivery = await this.sendGenericEmail(
      recipients[0],
      subject,
      htmlContent,
      textContent
    );

    return {
      attempted: 1,
      delivered: delivery.delivered ? 1 : 0
    };
  }

  private async sendViaSendGrid(
    payload: AdminVerificationPayload,
    verifyUrl: string,
    userName?: string
  ) {
    const apiKey = process.env.SENDGRID_API_KEY?.trim();
    if (!apiKey) {
      return null;
    }

    try {
      const from = this.parseFromAddress();
      const htmlContent = this.templateService.renderTemplate(
        "admin-verification.html",
        { verifyUrl, name: userName || "Admin" }
      );
      const textContent = this.templateService.renderTemplate(
        "admin-verification.txt",
        { verifyUrl, name: userName || "Admin" }
      );

      await sgMail.send({
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

      this.logger.log(
        `Verification email sent to ${payload.email} via SendGrid`
      );
      return { verifyUrl, delivered: true, provider: "sendgrid" } as const;
    } catch (error) {
      const sendGridStatus =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: unknown }).code ?? "")
          : "";
      const sendGridBody =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { body?: unknown } }).response?.body
          ? JSON.stringify((error as { response: { body: unknown } }).response.body)
          : "";

      this.logger.error(
        `SendGrid email send failed for ${payload.email}. ${sendGridStatus ? `Code: ${sendGridStatus}.` : ""} ${sendGridBody ? `Response: ${sendGridBody}` : ""}`,
        error instanceof Error ? error.stack : String(error)
      );
      return { verifyUrl, delivered: false, provider: "sendgrid" } as const;
    }
  }

  private async sendViaBrevoApi(
    payload: AdminVerificationPayload,
    verifyUrl: string,
    userName?: string
  ) {
    const apiKey = process.env.BREVO_API_KEY?.trim();
    if (!apiKey) {
      return null;
    }

    const from = this.parseFromAddress();
    const htmlContent = this.templateService.renderTemplate(
      "admin-verification.html",
      { verifyUrl, name: userName || "Admin" }
    );
    const textContent = this.templateService.renderTemplate(
      "admin-verification.txt",
      { verifyUrl, name: userName || "Admin" }
    );

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
        this.logger.error(
          `Brevo API email send failed with status ${response.status}: ${body}`
        );
        return { verifyUrl, delivered: false, provider: "brevo-api" } as const;
      }

      this.logger.log(
        `Verification email sent to ${payload.email} via Brevo API`
      );
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

  async sendAdminVerificationEmail(payload: AdminVerificationPayload, userName?: string) {
    const verifyUrl = this.getAdminVerifyUrl(payload.token);

    // Try SendGrid first (highest priority)
    const sendGridResult = await this.sendViaSendGrid(payload, verifyUrl, userName);
    if (sendGridResult?.delivered) {
      return sendGridResult;
    }

    // Then try Brevo
    const brevoApiResult = await this.sendViaBrevoApi(payload, verifyUrl, userName);
    if (brevoApiResult?.delivered) {
      return brevoApiResult;
    }

    // Finally try SMTP
    const transporter = await this.getTransporter();

    if (!transporter) {
      this.logger.log(
        `No email provider configured. Verification link for ${payload.email}: ${verifyUrl}`
      );
      return { verifyUrl, delivered: false, provider: "none" };
    }

    try {
      const htmlContent = this.templateService.renderTemplate(
        "admin-verification.html",
        { verifyUrl, name: userName || "Admin" }
      );
      const textContent = this.templateService.renderTemplate(
        "admin-verification.txt",
        { verifyUrl, name: userName || "Admin" }
      );

      await transporter.sendMail({
        from: this.getFromAddress(),
        to: payload.email,
        subject: "Verify your Attendance admin email",
        text: textContent,
        html: htmlContent
      });

      this.logger.log(
        `Verification email sent to ${payload.email} via SMTP`
      );
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${payload.email}.`,
        error instanceof Error ? error.stack : String(error)
      );
      return { verifyUrl, delivered: false, provider: "smtp" };
    }

    return { verifyUrl, delivered: true, provider: "smtp" };
  }

  async sendAdminPasswordResetEmail(payload: AdminPasswordResetPayload) {
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

    const delivery = await this.sendGenericEmail(
      payload.email,
      subject,
      htmlContent,
      textContent
    );

    return {
      resetUrl,
      delivered: delivery.delivered,
      provider: delivery.provider
    };
  }
}
