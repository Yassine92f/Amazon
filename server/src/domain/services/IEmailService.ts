export interface IEmailService {
  sendPasswordReset(to: string, firstName: string, resetUrl: string): Promise<void>;
  sendWelcome(to: string, firstName: string, verificationUrl: string): Promise<void>;
  sendEmailVerification(to: string, firstName: string, verificationUrl: string): Promise<void>;
}
