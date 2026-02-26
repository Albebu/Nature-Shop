import { InvalidExpirationDateError } from '../errors/invalidExpirationDate.error.js';

export class RefreshToken {
  private id: string;
  private userId: string;
  private token: string;
  private expiresAt: Date;
  private revokedAt: Date | null;

  private constructor({
    id,
    userId,
    token,
    expiresAt,
    revokedAt = null,
  }: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    revokedAt?: Date | null;
  }) {
    this.id = id;
    this.userId = userId;
    this.token = token;
    this.expiresAt = expiresAt;
    this.revokedAt = revokedAt;
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
  }): RefreshToken {
    if (expiresAt <= new Date()) {
      throw new InvalidExpirationDateError();
    }

    return new RefreshToken({ id, userId, token, expiresAt });
  }

  static fromDB({
    id,
    userId,
    token,
    expiresAt,
    revokedAt = null,
  }: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    revokedAt?: Date | null;
  }): RefreshToken {
    return new RefreshToken({ id, userId, token, expiresAt, revokedAt });
  }

  isExpired(): boolean {
    return this.expiresAt <= new Date();
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

  getRevokedAt(): Date | null {
    return this.revokedAt;
  }
}
