import type { EmailSender } from '@domain/ports/email-sender.port.js';
import type { Logger } from '@domain/ports/logger.port.js';

export class ConsoleEmailSender implements EmailSender {
  constructor(
    private readonly verificationUrlBase: string,
    private readonly logger: Logger,
  ) {}

  sendVerificationEmail(to: string, verificationToken: string, firstName: string): Promise<void> {
    const verificationUrl = `${this.verificationUrlBase}?token=${verificationToken}`;

    this.logger.info(
      { email: to, firstName, verificationUrl },
      `Verification email for ${to}: ${verificationUrl}`,
    );

    return Promise.resolve();
  }
}
