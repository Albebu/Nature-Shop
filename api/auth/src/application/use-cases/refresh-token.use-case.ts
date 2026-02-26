import { ForbiddenError, UnauthorizedError } from '@ecommerce/shared';
import type { RefreshTokenRepository } from '../../domain/ports/refresh-token.repository.js';
import type { TokenService } from '../../domain/ports/token.service.js';
import type { UserRepository } from '../../domain/ports/user.repository.js';
import type { RefreshTokenResponseDto } from '../dtos/refresh-token.dto.js';

export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenService: TokenService,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(refreshToken: string): Promise<RefreshTokenResponseDto> {
    const tokenExists = await this.refreshTokenRepository.findByToken(refreshToken);

    if (!tokenExists) {
      throw new UnauthorizedError();
    }

    if (tokenExists.isExpired()) {
      throw new ForbiddenError();
    }

    const user = await this.userRepository.findById(tokenExists.getUserId());

    if (!user) {
      throw new UnauthorizedError();
    }

    const newToken = this.tokenService.generate(user.getTokenPayload());
    const newRefreshToken = this.tokenService.generateRefreshToken(tokenExists.getUserId());

    await this.refreshTokenRepository.revokeByToken(tokenExists.getToken());

    return {
      token: newToken,
      refreshToken: newRefreshToken,
    };
  }
}
