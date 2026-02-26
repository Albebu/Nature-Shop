import { NotFoundError } from '@ecommerce/shared';
import type { PasswordService } from '../../domain/ports/password.service.js';
import type { UserRepository } from '../../domain/ports/user.repository.js';
import type { ChangePasswordDto } from '../dtos/change-password.dto.js';

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(input: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundError();
    }

    const newPasswordHash = await this.passwordService.hashPassword(input.newPassword);

    user.setPasswordHash(newPasswordHash);

    await this.userRepository.save(user);
  }
}
