import { User } from '../../domain/entities/user.js';
import type { UserRepository } from '../../domain/ports/user.repository.js';
import type { PrismaClient } from '../../generated/prisma/client.js';

export class UserRepositoryPrisma implements UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.db.user.findUnique({
      where: { id, isActive: true, deletedAt: null },
    });
    return user ? User.fromDB(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.db.user.findUnique({
      where: { email, isActive: true, deletedAt: null },
    });
    return user ? User.fromDB(user) : null;
  }

  async save(user: User): Promise<void> {
    await this.db.user.upsert({
      where: { id: user.getId() },
      update: {
        tenantId: user.getTenantId() ?? null,
        firstName: user.getFirstName(),
        lastName: user.getLastName(),
        email: user.getEmail(),
        passwordHash: user.getPasswordHash(),
        userType: user.getUserType(),
        emailVerifiedAt: user.getEmailVerifiedAt(),
      },
      create: {
        id: user.getId(),
        tenantId: user.getTenantId() ?? null,
        firstName: user.getFirstName(),
        lastName: user.getLastName(),
        email: user.getEmail(),
        passwordHash: user.getPasswordHash(),
        userType: user.getUserType(),
        emailVerifiedAt: user.getEmailVerifiedAt(),
      },
    });
  }
}
