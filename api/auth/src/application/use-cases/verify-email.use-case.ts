import { NotFoundError } from '@ecommerce/shared';
import { VerificationTokenAlreadyUsedError } from '../../domain/errors/verification-token-already-used.error.js';
import { VerificationTokenExpiredError } from '../../domain/errors/verification-token-expired.error.js';
import { VerificationTokenNotFoundError } from '../../domain/errors/verification-token-not-found.error.js';
import type { Logger } from '../../domain/ports/logger.port.js';
import type { UserRepository } from '../../domain/ports/user.repository.js';
import type { VerificationTokenRepository } from '../../domain/ports/verification-token.repository.js';
import type { VerifyEmailDto } from '../dtos/verify-email.dto.js';

export interface VerifyEmailResponseDto {
  message: string;
}

export class VerifyEmailUseCase {
  constructor(
    private readonly verificationTokenRepository: VerificationTokenRepository,
    private readonly userRepository: UserRepository,
    private readonly logger: Logger,
  ) {}

  async execute(input: VerifyEmailDto): Promise<VerifyEmailResponseDto> {
    const verificationToken = await this.verificationTokenRepository.findByToken(input.token);

    if (!verificationToken) {
      throw new VerificationTokenNotFoundError(input.token);
    }

    if (verificationToken.isExpired()) {
      throw new VerificationTokenExpiredError();
    }

    if (verificationToken.isUsed()) {
      throw new VerificationTokenAlreadyUsedError();
    }

    const user = await this.userRepository.findById(verificationToken.getUserId());

    if (!user) {
      throw new NotFoundError();
    }

    // Throws EmailAlreadyVerifiedError if already verified
    user.markEmailVerified();

    verificationToken.markUsed();

    await this.userRepository.save(user);
    await this.verificationTokenRepository.save(verificationToken);

    this.logger.info(
      { userId: verificationToken.getUserId(), tokenId: verificationToken.getId() },
      'Email verified successfully',
    );

    return { message: 'Email verified successfully' };
  }
}
