import { LogoutUseCase } from '@application/use-cases/logout.use-case.js';
import { RefreshToken } from '@domain/entities/refresh-token.js';
import type { RefreshTokenRepository } from '@domain/ports/refresh-token.repository.js';
import { UnauthorizedError } from '@ecommerce/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────

const mockRefreshTokenRepository: RefreshTokenRepository = {
  save: vi.fn(),
  findByToken: vi.fn(),
  revokeByUserId: vi.fn(),
  revokeByToken: vi.fn(),
};

// ─── Fixtures ───────────────────────────────────────────────────

const VALID_REFRESH_TOKEN = RefreshToken.fromDB({
  id: 'token-id-123',
  userId: 'user-123',
  token: 'valid-refresh-token-string',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  revokedAt: null,
});

// ─── Test Suite ─────────────────────────────────────────────────

describe('LogoutUseCase', () => {
  let sut: LogoutUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(mockRefreshTokenRepository.findByToken).mockResolvedValue(VALID_REFRESH_TOKEN);

    sut = new LogoutUseCase(mockRefreshTokenRepository);
  });

  // ── Unhappy path ───────────────────────────────────────────

  describe('when refresh token does not exist', () => {
    it('should throw UnauthorizedError', async () => {
      vi.mocked(mockRefreshTokenRepository.findByToken).mockResolvedValue(null);

      await expect(sut.execute('unknown-token')).rejects.toThrow(UnauthorizedError);
    });

    it('should NOT revoke anything', async () => {
      vi.mocked(mockRefreshTokenRepository.findByToken).mockResolvedValue(null);

      await sut.execute('unknown-token').catch(() => {});

      expect(mockRefreshTokenRepository.revokeByToken).not.toHaveBeenCalled();
      expect(mockRefreshTokenRepository.revokeByUserId).not.toHaveBeenCalled();
    });
  });

  // ── Happy path ─────────────────────────────────────────────

  describe('when refresh token exists', () => {
    it('should revoke ALL tokens for the user — not just the provided one', async () => {
      await sut.execute(VALID_REFRESH_TOKEN.getToken());

      // revokeByUserId closes all sessions across all devices
      expect(mockRefreshTokenRepository.revokeByUserId).toHaveBeenCalledWith(
        VALID_REFRESH_TOKEN.getUserId(),
      );
    });

    it('should NOT call revokeByToken — all sessions are revoked at once', async () => {
      await sut.execute(VALID_REFRESH_TOKEN.getToken());

      expect(mockRefreshTokenRepository.revokeByToken).not.toHaveBeenCalled();
    });

    it('should revoke only once', async () => {
      await sut.execute(VALID_REFRESH_TOKEN.getToken());

      expect(mockRefreshTokenRepository.revokeByUserId).toHaveBeenCalledTimes(1);
    });
  });
});
