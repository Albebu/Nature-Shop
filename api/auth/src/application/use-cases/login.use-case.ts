import { SEVEN_DAYS_IN_MS, UnauthorizedError } from '@ecommerce/shared';
import { RefreshToken } from '../../domain/entities/refresh-token.js';
import type { PasswordService } from '../../domain/ports/password.service.js';
import type { RefreshTokenRepository } from '../../domain/ports/refresh-token.repository.js';
import type { TokenService } from '../../domain/ports/token.service.js';
import type { UserRepository } from '../../domain/ports/user.repository.js';
import type { LoginDto, LoginResponseDto } from '../dtos/login.dto.js';

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(input: LoginDto): Promise<LoginResponseDto> {
    const userExists = await this.userRepository.findByEmail(input.email);

    if (!userExists?.getIsActive()) {
      throw new UnauthorizedError();
    }

    const isPasswordValid = await this.passwordService.verifyPassword(
      input.password,
      userExists.getPasswordHash(),
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError();
    }

    const token = this.tokenService.generate(userExists.getTokenPayload());
    const refreshTokenString = this.tokenService.generateRefreshToken(userExists.getId());

    const refreshToken = RefreshToken.create({
      id: crypto.randomUUID(),
      userId: userExists.getId(),
      token: refreshTokenString,
      expiresAt: new Date(Date.now() + SEVEN_DAYS_IN_MS),
    });

    await this.refreshTokenRepository.save(refreshToken);

    return { token, refreshToken: refreshTokenString };
  }
}
