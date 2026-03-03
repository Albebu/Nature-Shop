import type { RegisterDto } from '@application/dtos/register.dto.js';
import { RegisterUseCase } from '@application/use-cases/register.use-case.js';
import { User } from '@domain/entities/user.js';
import type { Logger } from '@domain/ports/logger.port.js';
import type { PasswordService } from '@domain/ports/password.service.js';
import type { RefreshTokenRepository } from '@domain/ports/refresh-token.repository.js';
import type { TokenService } from '@domain/ports/token.service.js';
import type { UserRepository } from '@domain/ports/user.repository.js';
import { ConflictError } from '@ecommerce/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────
// Cada port tiene su mock. NUNCA usamos la implementación real aquí.
// Estamos testeando el USE CASE, no Prisma, no Argon2, no JWT.
// Si mañana cambias Prisma por MongoDB, estos tests NO cambian.

const mockUserRepository: UserRepository = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  save: vi.fn(),
};

const mockRefreshTokenRepository: RefreshTokenRepository = {
  save: vi.fn(),
  findByToken: vi.fn(),
  revokeByUserId: vi.fn(),
  revokeByToken: vi.fn(),
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

const mockLogger: Logger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};

// ─── Fixtures ───────────────────────────────────────────────────
// Datos reutilizables para no repetir en cada test

const VALID_INPUT: RegisterDto = {
  firstName: 'Alex',
  lastName: 'Bellosta',
  email: 'alex@example.com',
  password: 'SecurePass123',
};

const HASHED_PASSWORD = '$argon2id$hashed_password_mock';
const ACCESS_TOKEN = 'mock-access-token';
const REFRESH_TOKEN_STRING = 'mock-refresh-token';

// ─── Test Suite ─────────────────────────────────────────────────

describe('RegisterUseCase', () => {
  let sut: RegisterUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(mockPasswordService.hashPassword).mockResolvedValue(HASHED_PASSWORD);
    vi.mocked(mockTokenService.generate).mockReturnValue(ACCESS_TOKEN);
    vi.mocked(mockTokenService.generateRefreshToken).mockReturnValue(REFRESH_TOKEN_STRING);

    sut = new RegisterUseCase(
      mockUserRepository,
      mockRefreshTokenRepository,
      mockPasswordService,
      mockTokenService,
      mockLogger,
    );
  });

  // ── Unhappy paths ──────────────────────────────────────────

  describe('when email is already in use', () => {
    it('should throw ConflictError', async () => {
      // Arrange — simulamos que ya existe un usuario con ese email
      const existingUser = User.fromDB({
        id: 'existing-id',
        tenantId: null,
        firstName: 'Other',
        lastName: 'User',
        email: VALID_INPUT.email,
        passwordHash: 'some-hash',
        userType: 'CUSTOMER',
      });
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(existingUser);

      // Act & Assert
      await expect(sut.execute(VALID_INPUT)).rejects.toThrow(ConflictError);
    });

    it('should NOT save any user', async () => {
      const existingUser = User.fromDB({
        id: 'existing-id',
        tenantId: null,
        firstName: 'Other',
        lastName: 'User',
        email: VALID_INPUT.email,
        passwordHash: 'some-hash',
        userType: 'CUSTOMER',
      });
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(existingUser);

      // Act — ejecutamos y dejamos que el error pase
      await sut.execute(VALID_INPUT).catch(() => {});

      // Assert — verificamos que NUNCA se llamó a save
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should NOT generate any tokens', async () => {
      const existingUser = User.fromDB({
        id: 'existing-id',
        tenantId: null,
        firstName: 'Other',
        lastName: 'User',
        email: VALID_INPUT.email,
        passwordHash: 'some-hash',
        userType: 'CUSTOMER',
      });
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(existingUser);

      // Act — ejecutamos y dejamos que el error pase
      await sut.execute(VALID_INPUT).catch(() => {});

      // Assert — verificamos que NUNCA se llamó a generate o generateRefreshToken
      expect(mockTokenService.generate).not.toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).not.toHaveBeenCalled();
    });
  });

  // ── Happy path ─────────────────────────────────────────────

  describe('when input is valid and email is available', () => {
    it('should hash the password before saving', async () => {
      // Act
      await sut.execute(VALID_INPUT);

      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(VALID_INPUT.password);
    });

    it('should save the user with correct data', async () => {
      await sut.execute(VALID_INPUT);

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: VALID_INPUT.firstName,
          lastName: VALID_INPUT.lastName,
          email: VALID_INPUT.email,
          passwordHash: HASHED_PASSWORD,
          userType: 'CUSTOMER',
        }),
      );
    });

    it('should generate an access token with the user payload', async () => {
      await sut.execute(VALID_INPUT);

      expect(mockTokenService.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(String),
          userType: 'CUSTOMER',
          tenantId: expect.any(String),
        }),
      );
    });

    it('should generate and persist a refresh token', async () => {
      await sut.execute(VALID_INPUT);

      expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith(
        expect.any(String), // el ID del usuario
      );

      expect(mockRefreshTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(String), // el ID del usuario
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

    it('should log the registration', async () => {
      await sut.execute(VALID_INPUT);

      expect(mockLogger.info).toHaveBeenCalledWith(
        { id: expect.any(String), email: VALID_INPUT.email },
        'Registering new user',
      );
    });
  });
});
