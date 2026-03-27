type AdminVerificationPayload = {
    email: string;
    token: string;
};
export declare class EmailService {
    private readonly logger;
    private transporter;
    isDeliveryConfigured(): boolean;
    private getFrontendBaseUrl;
    private getAdminVerifyUrl;
    private resolveSmtpTarget;
    private getTransporter;
    private getFromAddress;
    private parseFromAddress;
    private sendViaBrevoApi;
    sendAdminVerificationEmail(payload: AdminVerificationPayload): Promise<{
        readonly verifyUrl: string;
        readonly delivered: false;
        readonly provider: "brevo-api";
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
