import type { ChangePasswordDto } from '@application/dtos/change-password.dto.js';
import { ChangePasswordUseCase } from '@application/use-cases/change-password.use-case.js';
import { User } from '@domain/entities/user.js';
import type { PasswordService } from '@domain/ports/password.service.js';
import type { UserRepository } from '@domain/ports/user.repository.js';
import { NotFoundError, UnauthorizedError } from '@ecommerce/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────

const mockUserRepository: UserRepository = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  save: vi.fn(),
};

const mockPasswordService: PasswordService = {
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
};

// ─── Fixtures ───────────────────────────────────────────────────

// Factory para evitar mutación entre tests — User.setPasswordHash muta el objeto
const buildExistingUser = (): User =>
  User.fromDB({
    id: 'user-123',
    tenantId: 'tenant-456',
    firstName: 'Alex',
    lastName: 'Bellosta',
    email: 'alex@example.com',
    passwordHash: '$argon2id$old_hash',
    userType: 'CUSTOMER',
  });

const VALID_INPUT: ChangePasswordDto = {
  userId: 'user-123',
  currentPassword: 'OldPass123',
  newPassword: 'NewPass456',
};

const NEW_HASH = '$argon2id$new_hash';

// ─── Test Suite ─────────────────────────────────────────────────

describe('ChangePasswordUseCase', () => {
  let sut: ChangePasswordUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    // Fresh instance per test — prevents mutation leaking between tests
    vi.mocked(mockUserRepository.findById).mockResolvedValue(buildExistingUser());
    vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(true);
    vi.mocked(mockPasswordService.hashPassword).mockResolvedValue(NEW_HASH);

    sut = new ChangePasswordUseCase(mockUserRepository, mockPasswordService);
  });

  // ── Unhappy paths ──────────────────────────────────────────

  describe('when user does not exist', () => {
    it('should throw NotFoundError', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      await expect(sut.execute(VALID_INPUT)).rejects.toThrow(NotFoundError);
    });

    it('should NOT hash or save anything', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      await sut.execute(VALID_INPUT).catch(() => {});

      expect(mockPasswordService.hashPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('when current password is incorrect', () => {
    it('should throw UnauthorizedError', async () => {
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(false);

      await expect(sut.execute(VALID_INPUT)).rejects.toThrow(UnauthorizedError);
    });

    it('should NOT hash or save anything', async () => {
      vi.mocked(mockPasswordService.verifyPassword).mockResolvedValue(false);

      await sut.execute(VALID_INPUT).catch(() => {});

      expect(mockPasswordService.hashPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  // ── Happy path ─────────────────────────────────────────────

  describe('when user exists and current password is correct', () => {
    it('should verify the current password against the stored hash', async () => {
      await sut.execute(VALID_INPUT);

      expect(mockPasswordService.verifyPassword).toHaveBeenCalledWith(
        VALID_INPUT.currentPassword,
        buildExistingUser().getPasswordHash(),
      );
    });

    it('should hash the new password', async () => {
      await sut.execute(VALID_INPUT);

      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(VALID_INPUT.newPassword);
    });

    it('should save the user with the new password hash', async () => {
      await sut.execute(VALID_INPUT);

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ passwordHash: NEW_HASH }),
      );
    });

    it('should look up the user by id', async () => {
      await sut.execute(VALID_INPUT);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(VALID_INPUT.userId);
    });
  });
});
