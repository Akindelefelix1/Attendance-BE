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
    details?: Array<{
        label: string;
        value: string;
    }>;
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
export declare class EmailService {
    private templateService;
    private readonly logger;
    private transporter;
    constructor(templateService: TemplateService);
    isDeliveryConfigured(): boolean;
    private getFrontendBaseUrl;
    private getAdminVerifyUrl;
    private getAdminResetUrl;
    private getStaffResetUrl;
    private resolveSmtpTarget;
    private getTransporter;
    private getFromAddress;
    private parseFromAddress;
    private normalizeEmails;
    private sendGenericViaSendGrid;
    private sendGenericViaBrevoApi;
    private sendGenericViaSmtp;
    private sendGenericEmail;
    sendOrganizationActivityEmail(payload: OrganizationActivityPayload): Promise<{
        attempted: number;
        delivered: number;
    }>;
    sendStaffOnboardingEmail(payload: StaffOnboardingPayload): Promise<{
        attempted: number;
        delivered: number;
    }>;
    sendStaffPasswordResetEmail(payload: StaffPasswordResetPayload): Promise<{
        attempted: number;
        delivered: number;
    }>;
    private sendViaSendGrid;
    private sendViaBrevoApi;
    sendAdminVerificationEmail(payload: AdminVerificationPayload, userName?: string): Promise<{
        readonly verifyUrl: string;
        readonly delivered: true;
        readonly provider: "sendgrid";
    } | {
        readonly verifyUrl: string;
        readonly delivered: true;
        readonly provider: "brevo-api";
    } | {
        verifyUrl: string;
        delivered: boolean;
        provider: string;
    }>;
    sendAdminPasswordResetEmail(payload: AdminPasswordResetPayload): Promise<{
        resetUrl: string;
        delivered: boolean;
        provider: "sendgrid" | "brevo-api" | "smtp" | "none";
    }>;
}
export {};
