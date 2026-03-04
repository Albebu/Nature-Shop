import { InvalidExpirationDateError } from '../errors/invalidExpirationDate.error.js';
import { VerificationTokenAlreadyUsedError } from '../errors/verification-token-already-used.error.js';

export class VerificationToken {
  private id: string;
  private userId: string;
  private token: string;
  private expiresAt: Date;
  private usedAt: Date | null;

  private constructor({
    id,
    userId,
    token,
    expiresAt,
    usedAt = null,
  }: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    usedAt?: Date | null;
  }) {
    this.id = id;
    this.userId = userId;
    this.token = token;
    this.expiresAt = expiresAt;
    this.usedAt = usedAt;
  }

  static create({
    id,
    userId,
    token,
    expiresAt,
  }: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
  }): VerificationToken {
    if (expiresAt <= new Date()) {
      throw new InvalidExpirationDateError();
    }

    return new VerificationToken({ id, userId, token, expiresAt });
  }

  static fromDB({
    id,
    userId,
    token,
    expiresAt,
    usedAt = null,
  }: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    usedAt?: Date | null;
  }): VerificationToken {
    return new VerificationToken({ id, userId, token, expiresAt, usedAt });
  }

  isExpired(): boolean {
    return this.expiresAt <= new Date();
  }

  isUsed(): boolean {
    return this.usedAt !== null;
  }

  markUsed(): void {
    if (this.usedAt !== null) {
      throw new VerificationTokenAlreadyUsedError();
    }
    this.usedAt = new Date();
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getToken(): string {
    return this.token;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }

  getUsedAt(): Date | null {
    return this.usedAt;
  }
}
