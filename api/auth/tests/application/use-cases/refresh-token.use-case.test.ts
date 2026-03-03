import { RefreshTokenUseCase } from '@application/use-cases/refresh-token.use-case.js';
import { RefreshToken } from '@domain/entities/refresh-token.js';
import { User } from '@domain/entities/user.js';
import type { RefreshTokenRepository } from '@domain/ports/refresh-token.repository.js';
import type { TokenService } from '@domain/ports/token.service.js';
import type { UserRepository } from '@domain/ports/user.repository.js';
import { ForbiddenError, UnauthorizedError } from '@ecommerce/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────

const mockRefreshTokenRepository: RefreshTokenRepository = {
  save: vi.fn(),
  findByToken: vi.fn(),
  revokeByUserId: vi.fn(),
  revokeByToken: vi.fn(),
};

const mockTokenService: TokenService = {
  generate: vi.fn(),
  generateRefreshToken: vi.fn(),
  verify: vi.fn(),
  decode: vi.fn(),
};

const mockUserRepository: UserRepository = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  save: vi.fn(),
};

// ─── Fixtures ───────────────────────────────────────────────────

const EXISTING_USER = User.fromDB({
  id: 'user-123',
  tenantId: 'tenant-456',
  firstName: 'Alex',
  lastName: 'Bellosta',
  email: 'alex@example.com',
  passwordHash: '$argon2id$hashed',
  userType: 'CUSTOMER',
});

const VALID_REFRESH_TOKEN = RefreshToken.fromDB({
  id: 'token-id-123',
  userId: 'user-123',
  token: 'valid-refresh-token-string',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días en el futuro
  revokedAt: null,
});

const EXPIRED_REFRESH_TOKEN = RefreshToken.fromDB({
  id: 'token-id-456',
  userId: 'user-123',
  token: 'expired-refresh-token-string',
  expiresAt: new Date(Date.now() - 1000), // ya expiró
  revokedAt: null,
});

const NEW_ACCESS_TOKEN = 'new-mock-access-token';
const NEW_REFRESH_TOKEN = 'new-mock-refresh-token';

// ─── Test Suite ─────────────────────────────────────────────────

describe('RefreshTokenUseCase', () => {
  let sut: RefreshTokenUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(mockRefreshTokenRepository.findByToken).mockResolvedValue(VALID_REFRESH_TOKEN);
    vi.mocked(mockUserRepository.findById).mockResolvedValue(EXISTING_USER);
    vi.mocked(mockTokenService.generate).mockReturnValue(NEW_ACCESS_TOKEN);
    vi.mocked(mockTokenService.generateRefreshToken).mockReturnValue(NEW_REFRESH_TOKEN);

    sut = new RefreshTokenUseCase(mockRefreshTokenRepository, mockTokenService, mockUserRepository);
  });

  // ── Unhappy paths ──────────────────────────────────────────

  describe('when refresh token does not exist', () => {
    it('should throw UnauthorizedError', async () => {
      vi.mocked(mockRefreshTokenRepository.findByToken).mockResolvedValue(null);

      await expect(sut.execute('unknown-token')).rejects.toThrow(UnauthorizedError);
    });

    it('should NOT generate new tokens', async () => {
      vi.mocked(mockRefreshTokenRepository.findByToken).mockResolvedValue(null);

      await sut.execute('unknown-token').catch(() => {});

      expect(mockTokenService.generate).not.toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('when refresh token is expired', () => {
    it('should throw ForbiddenError', async () => {
      vi.mocked(mockRefreshTokenRepository.findByToken).mockResolvedValue(EXPIRED_REFRESH_TOKEN);

      await expect(sut.execute(EXPIRED_REFRESH_TOKEN.getToken())).rejects.toThrow(ForbiddenError);
    });

    it('should NOT generate new tokens', async () => {
      vi.mocked(mockRefreshTokenRepository.findByToken).mockResolvedValue(EXPIRED_REFRESH_TOKEN);

      await sut.execute(EXPIRED_REFRESH_TOKEN.getToken()).catch(() => {});

      expect(mockTokenService.generate).not.toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('when the user linked to the token no longer exists', () => {
    it('should throw UnauthorizedError', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      await expect(sut.execute(VALID_REFRESH_TOKEN.getToken())).rejects.toThrow(UnauthorizedError);
    });

    it('should NOT generate new tokens', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      await sut.execute(VALID_REFRESH_TOKEN.getToken()).catch(() => {});

      expect(mockTokenService.generate).not.toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).not.toHaveBeenCalled();
    });
  });

  // ── Happy path ─────────────────────────────────────────────

  describe('when refresh token is valid', () => {
    it('should generate a new access token with the full user payload', async () => {
      await sut.execute(VALID_REFRESH_TOKEN.getToken());

      expect(mockTokenService.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: EXISTING_USER.getId(),
          userType: 'CUSTOMER',
          tenantId: 'tenant-456',
        }),
      );
    });

    it('should generate a new refresh token', async () => {
      await sut.execute(VALID_REFRESH_TOKEN.getToken());

      expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith(EXISTING_USER.getId());
    });

    it('should revoke the old refresh token', async () => {
      await sut.execute(VALID_REFRESH_TOKEN.getToken());

      // Token rotation: el viejo se invalida para que no se pueda reusar
      expect(mockRefreshTokenRepository.revokeByToken).toHaveBeenCalledWith(
        VALID_REFRESH_TOKEN.getToken(),
      );
    });

    it('should persist the new refresh token', async () => {
      await sut.execute(VALID_REFRESH_TOKEN.getToken());

      // El nuevo token tiene que guardarse en DB — si no, el cliente no
      // podrá volver a refrescarlo la próxima vez
      expect(mockRefreshTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: VALID_REFRESH_TOKEN.getUserId(),
          token: NEW_REFRESH_TOKEN,
          expiresAt: expect.any(Date),
        }),
      );
    });

    it('should return both new tokens', async () => {
      const result = await sut.execute(VALID_REFRESH_TOKEN.getToken());

      expect(result).toEqual({
        token: NEW_ACCESS_TOKEN,
        refreshToken: NEW_REFRESH_TOKEN,
      });
    });
  });
});
