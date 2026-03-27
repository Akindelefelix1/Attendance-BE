type AdminVerificationPayload = {
    email: string;
    token: string;
};
export declare class EmailService {
    private readonly logger;
    private transporter;
    private getFrontendBaseUrl;
    private getAdminVerifyUrl;
    private getTransporter;
    private getFromAddress;
    sendAdminVerificationEmail(payload: AdminVerificationPayload): Promise<{
        verifyUrl: string;
    }>;
}
export {};
