import { SEVEN_DAYS_IN_MS } from '@ecommerce/shared';
import { RefreshToken } from '../../domain/entities/refresh-token.js';
import { User } from '../../domain/entities/user.js';
import { ConflictError } from '../../domain/errors/conflict.error.js';
import type { PasswordService } from '../../domain/ports/password.service.js';
import type { RefreshTokenRepository } from '../../domain/ports/refresh-token.repository.js';
import type { TokenService } from '../../domain/ports/token.service.js';
import type { UserRepository } from '../../domain/ports/user.repository.js';
import type { RegisterDto, RegisterResponseDto } from '../dtos/register.dto.js';

export class RegisterUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: RegisterDto): Promise<RegisterResponseDto> {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('Email already in use');
    }

    const passwordHash = await this.passwordService.hashPassword(input.password);
    const userObject = User.create({
      id: crypto.randomUUID(),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
    });

    await this.userRepository.save(userObject);

    const token = this.tokenService.generate({
      id: userObject.getId(),
      userType: 'CUSTOMER',
    });

    const refreshTokenString = this.tokenService.generateRefreshToken(userObject.getId());
    const refreshToken = RefreshToken.create({
      id: crypto.randomUUID(),
      userId: userObject.getId(),
      token: refreshTokenString,
      expiresAt: new Date(Date.now() + SEVEN_DAYS_IN_MS),
    });

    await this.refreshTokenRepository.save(refreshToken);

    return { token, refreshToken: refreshToken.getToken() };
  }
}
