import { Resend } from 'resend';
import type { EmailSender } from '@domain/ports/email-sender.port.js';
import type { Logger } from '@domain/ports/logger.port.js';

export class ResendEmailSender implements EmailSender {
  private readonly resend: Resend;

  constructor(
    apiKey: string,
    private readonly fromEmail: string,
    private readonly verificationUrlBase: string,
    private readonly logger: Logger,
  ) {
    this.resend = new Resend(apiKey);
  }

  async sendVerificationEmail(
    to: string,
    verificationToken: string,
    firstName: string,
  ): Promise<void> {
    const verificationUrl = `${this.verificationUrlBase}?token=${verificationToken}`;

    const { data, error } = await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Verify your email — Nature Shop',
      html: this.buildVerificationHtml(firstName, verificationUrl),
    });

    if (error) {
      this.logger.error({ error, to }, 'Failed to send verification email via Resend');
      throw new Error(`Resend API error: ${error.message}`);
    }

    this.logger.info({ emailId: data.id, to }, 'Verification email sent via Resend');
  }

  private buildVerificationHtml(firstName: string, verificationUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2d5016;">Welcome to Nature Shop!</h2>
        <p>Hi ${firstName},</p>
        <p>Thanks for signing up. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}"
             style="background-color: #2d5016; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">
            Verify Email
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link in your browser:<br/>
          <a href="${verificationUrl}" style="color: #2d5016;">${verificationUrl}</a>
        </p>
        <p style="color: #666; font-size: 12px;">This link expires in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">Nature Shop — Eco-friendly products for a better world.</p>
      </div>
    `;
  }
}
