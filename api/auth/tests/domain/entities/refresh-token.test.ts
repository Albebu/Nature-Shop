import { RefreshToken } from '@domain/entities/refresh-token.js';
import { InvalidExpirationDateError } from '@domain/errors/invalidExpirationDate.error.js';
import { describe, expect, it } from 'vitest';

// ─── Helpers ────────────────────────────────────────────────────

const futureDate = (ms: number): Date => new Date(Date.now() + ms);
const pastDate = (ms: number): Date => new Date(Date.now() - ms);

// ─── Test Suite ─────────────────────────────────────────────────

describe('RefreshToken', () => {
  // ── create() ───────────────────────────────────────────────

  describe('create', () => {
    it('should create a token with a future expiration date', () => {
      const expiresAt = futureDate(7 * 24 * 60 * 60 * 1000);

      const token = RefreshToken.create({
        id: 'token-123',
        userId: 'user-123',
        token: 'raw-token-string',
        expiresAt,
      });

      expect(token.getId()).toBe('token-123');
      expect(token.getUserId()).toBe('user-123');
      expect(token.getToken()).toBe('raw-token-string');
      expect(token.getExpiresAt()).toEqual(expiresAt);
    });

    it('should throw InvalidExpirationDateError when expiresAt is in the past', () => {
      expect(() =>
        RefreshToken.create({
          id: 'token-123',
          userId: 'user-123',
          token: 'raw-token-string',
          expiresAt: pastDate(1000),
        }),
      ).toThrow(InvalidExpirationDateError);
    });

    it('should throw InvalidExpirationDateError when expiresAt is now', () => {
      // La fecha exacta de "ahora" también es inválida — debe ser estrictamente futura
      expect(() =>
        RefreshToken.create({
          id: 'token-123',
          userId: 'user-123',
          token: 'raw-token-string',
          expiresAt: new Date(),
        }),
      ).toThrow(InvalidExpirationDateError);
    });

    it('should start with revokedAt as null', () => {
      const token = RefreshToken.create({
        id: 'token-123',
        userId: 'user-123',
        token: 'raw-token-string',
        expiresAt: futureDate(1000),
      });

      expect(token.getRevokedAt()).toBeNull();
    });
  });

  // ── fromDB() ───────────────────────────────────────────────

  describe('fromDB', () => {
    it('should reconstruct a token preserving all fields including revokedAt', () => {
      const revokedAt = new Date('2026-01-01');

      const token = RefreshToken.fromDB({
        id: 'token-123',
        userId: 'user-123',
        token: 'raw-token-string',
        expiresAt: futureDate(1000),
        revokedAt,
      });

      expect(token.getRevokedAt()).toEqual(revokedAt);
    });

    it('should default revokedAt to null when not provided', () => {
      const token = RefreshToken.fromDB({
        id: 'token-123',
        userId: 'user-123',
        token: 'raw-token-string',
        expiresAt: futureDate(1000),
      });

      expect(token.getRevokedAt()).toBeNull();
    });

    it('should allow past expiration dates (tokens already expired in DB)', () => {
      // fromDB no valida — refleja el estado real de la DB sin restricciones
      expect(() =>
        RefreshToken.fromDB({
          id: 'token-123',
          userId: 'user-123',
          token: 'raw-token-string',
          expiresAt: pastDate(1000),
        }),
      ).not.toThrow();
    });
  });

  // ── isExpired() ────────────────────────────────────────────

  describe('isExpired', () => {
    it('should return false for a token that expires in the future', () => {
      const token = RefreshToken.fromDB({
        id: 'token-123',
        userId: 'user-123',
        token: 'raw-token-string',
        expiresAt: futureDate(7 * 24 * 60 * 60 * 1000),
      });

      expect(token.isExpired()).toBe(false);
    });

    it('should return true for a token that already expired', () => {
      const token = RefreshToken.fromDB({
        id: 'token-123',
        userId: 'user-123',
        token: 'raw-token-string',
        expiresAt: pastDate(1000),
      });

      expect(token.isExpired()).toBe(true);
    });
  });
});
