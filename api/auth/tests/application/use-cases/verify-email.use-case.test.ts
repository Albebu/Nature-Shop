import { VerifyEmailUseCase } from '@application/use-cases/verify-email.use-case.js';
import { User } from '@domain/entities/user.js';
import { VerificationToken } from '@domain/entities/verification-token.js';
import { EmailAlreadyVerifiedError } from '@domain/errors/email-already-verified.error.js';
import { VerificationTokenAlreadyUsedError } from '@domain/errors/verification-token-already-used.error.js';
import { VerificationTokenExpiredError } from '@domain/errors/verification-token-expired.error.js';
import { VerificationTokenNotFoundError } from '@domain/errors/verification-token-not-found.error.js';
import type { Logger } from '@domain/ports/logger.port.js';
import type { UserRepository } from '@domain/ports/user.repository.js';
import type { VerificationTokenRepository } from '@domain/ports/verification-token.repository.js';
import { NotFoundError } from '@ecommerce/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────

const mockVerificationTokenRepository: VerificationTokenRepository = {
  save: vi.fn(),
  findByToken: vi.fn(),
};

const mockUserRepository: UserRepository = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  save: vi.fn(),
};

const mockLogger: Logger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};

// ─── Fixtures ───────────────────────────────────────────────────

const VALID_TOKEN_STRING = 'valid-verification-token';
const USER_ID = 'user-123';

const buildValidVerificationToken = (): VerificationToken =>
  VerificationToken.fromDB({
    id: 'vt-1',
    userId: USER_ID,
    token: VALID_TOKEN_STRING,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
  });

const buildExpiredVerificationToken = (): VerificationToken =>
  VerificationToken.fromDB({
    id: 'vt-2',
    userId: USER_ID,
    token: VALID_TOKEN_STRING,
    expiresAt: new Date(Date.now() - 1000), // expired 1s ago
  });

const buildUsedVerificationToken = (): VerificationToken =>
  VerificationToken.fromDB({
    id: 'vt-3',
    userId: USER_ID,
    token: VALID_TOKEN_STRING,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    usedAt: new Date(Date.now() - 1000), // used 1s ago
  });

const buildUnverifiedUser = (): User =>
  User.fromDB({
    id: USER_ID,
    tenantId: 'tenant-456',
    firstName: 'Alex',
    lastName: 'Bellosta',
    email: 'alex@example.com',
    passwordHash: '$argon2id$hashed',
    userType: 'CUSTOMER',
  });

const buildVerifiedUser = (): User =>
  User.fromDB({
    id: USER_ID,
    tenantId: 'tenant-456',
    firstName: 'Alex',
    lastName: 'Bellosta',
    email: 'alex@example.com',
    passwordHash: '$argon2id$hashed',
    userType: 'CUSTOMER',
    emailVerifiedAt: new Date('2026-01-01'),
  });

// ─── Test Suite ─────────────────────────────────────────────────

describe('VerifyEmailUseCase', () => {
  let sut: VerifyEmailUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(mockVerificationTokenRepository.findByToken).mockResolvedValue(
      buildValidVerificationToken(),
    );
    vi.mocked(mockUserRepository.findById).mockResolvedValue(buildUnverifiedUser());

    sut = new VerifyEmailUseCase(mockVerificationTokenRepository, mockUserRepository, mockLogger);
  });

  // ── Happy path ─────────────────────────────────────────────

  describe('when token is valid and email is not yet verified', () => {
    it('should verify email successfully with valid token', async () => {
      const result = await sut.execute({ token: VALID_TOKEN_STRING });

      expect(result).toEqual({ message: 'Email verified successfully' });
    });

    it('should mark token as used after verification', async () => {
      await sut.execute({ token: VALID_TOKEN_STRING });

      expect(mockVerificationTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          usedAt: expect.any(Date),
        }),
      );
    });

    it('should update user emailVerifiedAt', async () => {
      await sut.execute({ token: VALID_TOKEN_STRING });

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          emailVerifiedAt: expect.any(Date),
        }),
      );
    });

    it('should log success', async () => {
      await sut.execute({ token: VALID_TOKEN_STRING });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: USER_ID,
        }),
        'Email verified successfully',
      );
    });
  });

  // ── Unhappy paths ──────────────────────────────────────────

  describe('when token is not found', () => {
    it('should throw VerificationTokenNotFoundError for invalid token', async () => {
      vi.mocked(mockVerificationTokenRepository.findByToken).mockResolvedValue(null);

      await expect(sut.execute({ token: 'non-existent-token' })).rejects.toThrow(
        VerificationTokenNotFoundError,
      );
    });

    it('should NOT save anything', async () => {
      vi.mocked(mockVerificationTokenRepository.findByToken).mockResolvedValue(null);

      await sut.execute({ token: 'non-existent-token' }).catch(() => {});

      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockVerificationTokenRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('when token is expired', () => {
    it('should throw VerificationTokenExpiredError for expired token', async () => {
      vi.mocked(mockVerificationTokenRepository.findByToken).mockResolvedValue(
        buildExpiredVerificationToken(),
      );

      await expect(sut.execute({ token: VALID_TOKEN_STRING })).rejects.toThrow(
        VerificationTokenExpiredError,
      );
    });
  });

  describe('when token is already used', () => {
    it('should throw VerificationTokenAlreadyUsedError for already used token', async () => {
      vi.mocked(mockVerificationTokenRepository.findByToken).mockResolvedValue(
        buildUsedVerificationToken(),
      );

      await expect(sut.execute({ token: VALID_TOKEN_STRING })).rejects.toThrow(
        VerificationTokenAlreadyUsedError,
      );
    });
  });

  describe('when user is not found', () => {
    it('should throw NotFoundError if user not found', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      await expect(sut.execute({ token: VALID_TOKEN_STRING })).rejects.toThrow(NotFoundError);
    });
  });

  describe('when email is already verified', () => {
    it('should throw EmailAlreadyVerifiedError if email already verified', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(buildVerifiedUser());

      await expect(sut.execute({ token: VALID_TOKEN_STRING })).rejects.toThrow(
        EmailAlreadyVerifiedError,
      );
    });
  });
});
