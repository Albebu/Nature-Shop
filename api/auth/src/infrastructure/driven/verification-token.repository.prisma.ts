import { VerificationToken } from '../../domain/entities/verification-token.js';
import type { VerificationTokenRepository } from '../../domain/ports/verification-token.repository.js';
import type { PrismaClient } from '../../generated/prisma/client.js';

export class VerificationTokenRepositoryPrisma implements VerificationTokenRepository {
  constructor(private readonly db: PrismaClient) {}

  async save(verificationToken: VerificationToken): Promise<void> {
    await this.db.verificationToken.upsert({
      where: { id: verificationToken.getId() },
      update: {
        usedAt: verificationToken.getUsedAt(),
      },
      create: {
        id: verificationToken.getId(),
        userId: verificationToken.getUserId(),
        token: verificationToken.getToken(),
        expiresAt: verificationToken.getExpiresAt(),
        usedAt: verificationToken.getUsedAt(),
      },
    });
  }

  async findByToken(token: string): Promise<VerificationToken | null> {
    const record = await this.db.verificationToken.findUnique({
      where: { token },
    });

    if (!record) return null;

    return VerificationToken.fromDB({
      id: record.id,
      userId: record.userId,
      token: record.token,
      expiresAt: record.expiresAt,
      usedAt: record.usedAt,
    });
  }
}
