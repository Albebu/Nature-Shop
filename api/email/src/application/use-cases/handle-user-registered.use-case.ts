import type { DomainEvent, UserRegisteredPayload } from '@ecommerce/shared';
import type { EmailSender } from '@domain/ports/email-sender.port.js';
import type { Logger } from '@domain/ports/logger.port.js';

export class HandleUserRegisteredUseCase {
  constructor(
    private readonly emailSender: EmailSender,
    private readonly logger: Logger,
  ) {}

  async execute(event: DomainEvent<UserRegisteredPayload>): Promise<void> {
    const { email, firstName, verificationToken, userId } = event.payload;

    try {
      await this.emailSender.sendVerificationEmail(email, verificationToken, firstName);

      this.logger.info(
        { email, userId, correlationId: event.correlationId },
        'Verification email sent successfully',
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        { email, userId, correlationId: event.correlationId, error: errorMessage },
        'Failed to send verification email',
      );

      throw error;
    }
  }
}
