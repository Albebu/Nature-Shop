import type { LoginDto } from '@application/dtos/login.dto.js';
import { LoginUseCase } from '@application/use-cases/login.use-case.js';
import { User } from '@domain/entities/user.js';

import type { PasswordService } from '@domain/ports/password.service.js';
import type { RefreshTokenRepository } from '@domain/ports/refresh-token.repository.js';
import type { TokenService } from '@domain/ports/token.service.js';
import type { UserRepository } from '@domain/ports/user.repository.js';
import { UnauthorizedError } from '@ecommerce/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────
// Testeamos el USE CASE en aislamiento total.
// Prisma, Bcrypt, JWT — nada de eso existe aquí.

const mockUserRepository: UserRepository = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  save: vi.fn(),
};

const mockPasswordService: PasswordService = {
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
};

const mockTokenService: TokenService = {
  generate: vi.fn(),
  generateRefreshToken: vi.fn(),
  verify: vi.fn(),
  decode: vi.fn(),
};

const mockRefreshTokenRepository: RefreshTokenRepository = {
  save: vi.fn(),
  findByToken: vi.fn(),
  revokeByUserId: vi.fn(),
  revokeByToken: vi.fn(),
};

// ─── Fixtures ───────────────────────────────────────────────────

const VALID_INPUT: LoginDto = {
  email: 'alex@example.com',
  password: 'SecurePass123',
};

const EXISTING_USER = User.fromDB({
  id: 'user-123',
  tenantId: 'tenant-456',
  firstName: 'Alex',
  lastName: 'Bellosta',
  email: VALID_INPUT.email,
  passwordHash: '$argon2id$hashed_password_mock',
  userType: 'CUSTOMER',
});

const ACCESS_TOKEN = 'mock-access-token';
const REFRESH_TOKEN_STRING = 'mock-refresh-token';

// ─── Test Suite ─────────────────────────────────────────────────

describe('LoginUseCase', () => {
  let sut: LoginUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    // Happy path por defecto — cada test sobreescribe lo que necesita
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(EXISTING_USER);
    vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
    vi.mocked(mockTokenService.generate).mockReturnValue(ACCESS_TOKEN);
    vi.mocked(mockTokenService.generateRefreshToken).mockReturnValue(REFRESH_TOKEN_STRING);

    sut = new LoginUseCase(
      mockUserRepository,
      mockPasswordService,
      mockTokenService,
      mockRefreshTokenRepository,
    );
  });

  // ── Unhappy paths ──────────────────────────────────────────

  describe('when user does not exist', () => {
    it('should throw UnauthorizedError', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      await expect(sut.execute(VALID_INPUT)).rejects.toThrow(UnauthorizedError);
    });

    it('should NOT verify the password', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      await sut.execute(VALID_INPUT).catch(() => {});

      // Si el usuario no existe no tiene sentido verificar la password —
      // hacerlo filtraría información sobre qué emails están registrados
      expect(mockPasswordService.verifyPassword).not.toHaveBeenCalled();
    });

    it('should NOT generate any tokens', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      await sut.execute(VALID_INPUT).catch(() => {});

      expect(mockTokenService.generate).not.toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('when user is inactive', () => {
    it('should throw UnauthorizedError', async () => {
      const inactiveUser = User.fromDB({
        id: 'user-123',
        tenantId: 'tenant-456',
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: VALID_INPUT.email,
        passwordHash: '$argon2id$hashed',
        userType: 'CUSTOMER',
        isActive: false,
      });
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(inactiveUser);

      await expect(sut.execute(VALID_INPUT)).rejects.toThrow(UnauthorizedError);
    });

    it('should NOT verify the password', async () => {
      const inactiveUser = User.fromDB({
        id: 'user-123',
        tenantId: 'tenant-456',
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: VALID_INPUT.email,
        passwordHash: '$argon2id$hashed',
        userType: 'CUSTOMER',
        isActive: false,
      });
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(inactiveUser);

      await sut.execute(VALID_INPUT).catch(() => {});

      expect(mockPasswordService.verifyPassword).not.toHaveBeenCalled();
    });
  });

  describe('when password is incorrect', () => {
    it('should throw UnauthorizedError', async () => {
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(false);

      await expect(sut.execute(VALID_INPUT)).rejects.toThrow(UnauthorizedError);
    });

    it('should NOT generate any tokens', async () => {
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(false);

      await sut.execute(VALID_INPUT).catch(() => {});

      expect(mockTokenService.generate).not.toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).not.toHaveBeenCalled();
    });
  });

  // ── Happy path ─────────────────────────────────────────────

  describe('when credentials are valid', () => {
    it('should verify the password against the stored hash', async () => {
      await sut.execute(VALID_INPUT);

      expect(mockPasswordService.verifyPassword).toHaveBeenCalledWith(
        VALID_INPUT.password,
        EXISTING_USER.getPasswordHash(),
      );
    });

    it('should generate an access token with the full user payload', async () => {
      await sut.execute(VALID_INPUT);

      expect(mockTokenService.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: EXISTING_USER.getId(),
          userType: 'CUSTOMER',
          tenantId: 'tenant-456',
        }),
      );
    });

    it('should generate a refresh token for the user', async () => {
      await sut.execute(VALID_INPUT);

      expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith(EXISTING_USER.getId());
    });

    it('should persist the refresh token', async () => {
      await sut.execute(VALID_INPUT);

      expect(mockRefreshTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: EXISTING_USER.getId(),
          token: REFRESH_TOKEN_STRING,
          expiresAt: expect.any(Date),
        }),
      );
    });

    it('should return both tokens', async () => {
      const result = await sut.execute(VALID_INPUT);

      expect(result).toEqual({
        token: ACCESS_TOKEN,
        refreshToken: REFRESH_TOKEN_STRING,
      });
    });
  });
});
