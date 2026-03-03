import { RefreshToken } from '../../domain/entities/refresh-token.js';
import type { RefreshTokenRepository } from '../../domain/ports/refresh-token.repository.js';
import type { PrismaClient } from '../../generated/prisma/client.js';

export class RefreshTokenRepositoryPrisma implements RefreshTokenRepository {
  constructor(private readonly db: PrismaClient) {}

  async save(refreshToken: RefreshToken): Promise<void> {
    await this.db.refreshToken.create({
      data: {
        id: refreshToken.getId(),
        userId: refreshToken.getUserId(),
        token: refreshToken.getToken(),
        expiresAt: refreshToken.getExpiresAt(),
      },
    });
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const record = await this.db.refreshToken.findUnique({
      where: { token, revokedAt: null },
    });

    if (!record) return null;

    return RefreshToken.fromDB({
      id: record.id,
      userId: record.userId,
      token: record.token,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
    });
  }

  async revokeByUserId(userId: string): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeByToken(token: string): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
