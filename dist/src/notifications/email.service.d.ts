import { TemplateService } from "./template.service";
type AdminVerificationPayload = {
    email: string;
    token: string;
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
