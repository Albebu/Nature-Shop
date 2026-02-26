import { ConflictError, SEVEN_DAYS_IN_MS } from '@ecommerce/shared';
import { RefreshToken } from '../../domain/entities/refresh-token.js';
import { User } from '../../domain/entities/user.js';
import type { Logger } from '../../domain/ports/logger.port.js';
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
    private readonly logger: Logger,
  ) {}

  async execute(input: RegisterDto): Promise<RegisterResponseDto> {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('Email already in use');
    }

    const passwordHash = await this.passwordService.hashPassword(input.password);
    const userObject = User.create({
      id: crypto.randomUUID(),
      tenantId: crypto.randomUUID(),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
      userType: 'CUSTOMER',
    });

    this.logger.info({ id: userObject.getId(), email: input.email }, 'Registering new user');

    await this.userRepository.save(userObject);

    this.logger.info({ userId: userObject.getId(), email: input.email }, 'User registered');

    const token = this.tokenService.generate(userObject.getTokenPayload());

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
