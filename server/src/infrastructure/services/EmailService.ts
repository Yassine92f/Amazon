import nodemailer, { Transporter } from 'nodemailer';
import { IEmailService } from '../../domain/services/IEmailService';
import { config } from '../../config';

export class EmailService implements IEmailService {
  private transporter: Transporter | null = null;
  private initialized = false;
  private readonly fromAddress: string;

  constructor() {
    this.fromAddress = config.email.from;
  }

  async sendPasswordReset(to: string, firstName: string, resetUrl: string): Promise<void> {
    const subject = 'Réinitialisation de votre mot de passe';
    const html = passwordResetTemplate(firstName, resetUrl);
    await this.send(to, subject, html);
  }

  async sendWelcome(to: string, firstName: string, verificationUrl: string): Promise<void> {
    const subject = 'Bienvenue sur Abracadabra — vérifiez votre email';
    const html = welcomeTemplate(firstName, verificationUrl);
    await this.send(to, subject, html);
  }

  async sendEmailVerification(
    to: string,
    firstName: string,
    verificationUrl: string,
  ): Promise<void> {
    const subject = 'Vérifiez votre adresse email';
    const html = verificationTemplate(firstName, verificationUrl);
    await this.send(to, subject, html);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const transporter = await this.getTransporter();
    const info = await transporter.sendMail({
      from: this.fromAddress,
      to,
      subject,
      html,
    });

    if (config.env !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[email] Preview URL: ${previewUrl}`);
      } else {
        console.log(`[email] Sent to ${to}: ${subject}`);
      }
    }
  }

  private async getTransporter(): Promise<Transporter> {
    if (this.initialized && this.transporter) return this.transporter;

    if (config.env === 'production' || config.email.user) {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465,
        auth: config.email.user ? { user: config.email.user, pass: config.email.pass } : undefined,
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      console.log(`[email] Ethereal test account ready: ${testAccount.user}`);
    }

    this.initialized = true;
    return this.transporter;
  }
}

function shell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
        <tr><td style="padding:32px 40px;border-bottom:1px solid #ebebe6;">
          <h1 style="margin:0;font-size:20px;font-weight:600;color:#1a1a1a;">Abracadabra</h1>
        </td></tr>
        <tr><td style="padding:32px 40px;color:#333;line-height:1.6;font-size:15px;">
          ${body}
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #ebebe6;color:#999;font-size:12px;">
          Abracadabra — Plateforme e-commerce. Si vous n'êtes pas à l'origine de cet email, ignorez-le.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500;">${label}</a>`;
}

function passwordResetTemplate(firstName: string, resetUrl: string): string {
  return shell(
    'Réinitialisation',
    `<p>Bonjour ${escapeHtml(firstName)},</p>
     <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien expire dans 1 heure.</p>
     <p style="margin:24px 0;">${button(resetUrl, 'Réinitialiser mon mot de passe')}</p>
     <p style="color:#666;font-size:13px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>`,
  );
}

function welcomeTemplate(firstName: string, verificationUrl: string): string {
  return shell(
    'Bienvenue',
    `<p>Bonjour ${escapeHtml(firstName)},</p>
     <p>Bienvenue sur Abracadabra ! Pour activer pleinement votre compte, vérifiez votre adresse email :</p>
     <p style="margin:24px 0;">${button(verificationUrl, 'Vérifier mon email')}</p>
     <p style="color:#666;font-size:13px;">Ce lien expire dans 24 heures.</p>`,
  );
}

function verificationTemplate(firstName: string, verificationUrl: string): string {
  return shell(
    'Vérification',
    `<p>Bonjour ${escapeHtml(firstName)},</p>
     <p>Veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous. Le lien expire dans 24 heures.</p>
     <p style="margin:24px 0;">${button(verificationUrl, 'Vérifier mon email')}</p>`,
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
