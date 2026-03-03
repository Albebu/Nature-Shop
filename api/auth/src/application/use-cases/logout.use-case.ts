import { UnauthorizedError } from '@ecommerce/shared';
import type { RefreshTokenRepository } from '../../domain/ports/refresh-token.repository.js';

export class LogoutUseCase {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepository) {}

  async execute(refreshToken: string): Promise<void> {
    const tokenExists = await this.refreshTokenRepository.findByToken(refreshToken);
    if (!tokenExists) {
      throw new UnauthorizedError();
    }

    await this.refreshTokenRepository.revokeByToken(refreshToken);
  }
}
