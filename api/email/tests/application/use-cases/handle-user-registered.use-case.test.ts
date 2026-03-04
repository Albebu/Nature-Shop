import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DomainEvent, UserRegisteredPayload } from '@ecommerce/shared';
import { HandleUserRegisteredUseCase } from '@application/use-cases/handle-user-registered.use-case.js';
import type { EmailSender } from '@domain/ports/email-sender.port.js';
import type { Logger } from '@domain/ports/logger.port.js';

function createMockEmailSender(): EmailSender {
  return {
    sendVerificationEmail: vi.fn<EmailSender['sendVerificationEmail']>(),
  };
}

function createMockLogger(): Logger {
  return {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  };
}

function createUserRegisteredEvent(
  overrides: Partial<UserRegisteredPayload> = {},
): DomainEvent<UserRegisteredPayload> {
  return {
    type: 'user.registered',
    occurredAt: new Date().toISOString(),
    correlationId: 'test-correlation-id',
    payload: {
      userId: 'user-123',
      email: 'john@example.com',
      firstName: 'John',
      verificationToken: 'token-abc-123',
      ...overrides,
    },
  };
}

describe('HandleUserRegisteredUseCase', () => {
  let useCase: HandleUserRegisteredUseCase;
  let emailSender: EmailSender;
  let logger: Logger;

  beforeEach(() => {
    emailSender = createMockEmailSender();
    logger = createMockLogger();
    useCase = new HandleUserRegisteredUseCase(emailSender, logger);
  });

  it('should call emailSender.sendVerificationEmail with correct arguments', async () => {
    const event = createUserRegisteredEvent();

    await useCase.execute(event);

    expect(emailSender.sendVerificationEmail).toHaveBeenCalledWith(
      'john@example.com',
      'token-abc-123',
      'John',
    );
  });

  it('should call emailSender.sendVerificationEmail exactly once', async () => {
    const event = createUserRegisteredEvent();

    await useCase.execute(event);

    expect(emailSender.sendVerificationEmail).toHaveBeenCalledOnce();
  });

  it('should log success after sending email', async () => {
    const event = createUserRegisteredEvent();

    await useCase.execute(event);

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'john@example.com',
        userId: 'user-123',
      }),
      expect.stringContaining('Verification email sent'),
    );
  });

  it('should handle different user data correctly', async () => {
    const event = createUserRegisteredEvent({
      email: 'jane@test.org',
      firstName: 'Jane',
      verificationToken: 'different-token',
      userId: 'user-456',
    });

    await useCase.execute(event);

    expect(emailSender.sendVerificationEmail).toHaveBeenCalledWith(
      'jane@test.org',
      'different-token',
      'Jane',
    );
  });

  it('should log error and rethrow when emailSender fails', async () => {
    const event = createUserRegisteredEvent();
    const error = new Error('SMTP connection failed');
    vi.mocked(emailSender.sendVerificationEmail).mockRejectedValueOnce(error);

    await expect(useCase.execute(event)).rejects.toThrow('SMTP connection failed');

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'john@example.com',
        userId: 'user-123',
        error: 'SMTP connection failed',
      }),
      expect.stringContaining('Failed to send verification email'),
    );
  });

  it('should log "Unknown error" when emailSender rejects with non-Error value', async () => {
    const event = createUserRegisteredEvent();
    vi.mocked(emailSender.sendVerificationEmail).mockRejectedValueOnce('string-error');

    await expect(useCase.execute(event)).rejects.toBe('string-error');

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'john@example.com',
        userId: 'user-123',
        error: 'Unknown error',
      }),
      expect.stringContaining('Failed to send verification email'),
    );
  });

  it('should include correlationId in success log', async () => {
    const event = createUserRegisteredEvent();

    await useCase.execute(event);

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: 'test-correlation-id',
      }),
      expect.any(String),
    );
  });
});
