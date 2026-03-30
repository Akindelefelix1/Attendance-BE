import { TemplateService } from "./template.service";
type AdminVerificationPayload = {
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
};
type StaffPasswordBroadcastPayload = {
    organizationName: string;
    staffEmails: string[];
    staffLoginPassword: string;
};
export declare class EmailService {
    private templateService;
    private readonly logger;
    private transporter;
    constructor(templateService: TemplateService);
    isDeliveryConfigured(): boolean;
    private getFrontendBaseUrl;
    private getAdminVerifyUrl;
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
    sendStaffLoginPasswordUpdatedEmail(payload: StaffPasswordBroadcastPayload): Promise<{
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
}
export {};
