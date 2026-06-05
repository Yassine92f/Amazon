export interface OrderConfirmationEmail {
  orderNumber: string;
  totalAmount: number;
  items: { name: string; quantity: number; total: number }[];
  orderUrl: string;
}

export interface IEmailService {
  sendPasswordReset(to: string, firstName: string, resetUrl: string): Promise<void>;
  sendWelcome(to: string, firstName: string, verificationUrl: string): Promise<void>;
  sendEmailVerification(to: string, firstName: string, verificationUrl: string): Promise<void>;
  sendOrderConfirmation(
    to: string,
    firstName: string,
    order: OrderConfirmationEmail,
  ): Promise<void>;
}
