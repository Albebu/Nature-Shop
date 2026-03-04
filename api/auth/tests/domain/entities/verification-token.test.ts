import { VerificationToken } from '@domain/entities/verification-token.js';
import { InvalidExpirationDateError } from '@domain/errors/invalidExpirationDate.error.js';
import { VerificationTokenAlreadyUsedError } from '@domain/errors/verification-token-already-used.error.js';
import { describe, expect, it } from 'vitest';

// ─── Helpers ────────────────────────────────────────────────────

const futureDate = (ms: number): Date => new Date(Date.now() + ms);
const pastDate = (ms: number): Date => new Date(Date.now() - ms);

// ─── Test Suite ─────────────────────────────────────────────────

describe('VerificationToken', () => {
  // ── create() ───────────────────────────────────────────────

  describe('create', () => {
    it('should create a token with a future expiration date', () => {
      const expiresAt = futureDate(24 * 60 * 60 * 1000);

      const token = VerificationToken.create({
        id: 'vtoken-123',
        userId: 'user-123',
        token: 'abc-def-ghi',
        expiresAt,
      });

      expect(token.getId()).toBe('vtoken-123');
      expect(token.getUserId()).toBe('user-123');
      expect(token.getToken()).toBe('abc-def-ghi');
      expect(token.getExpiresAt()).toEqual(expiresAt);
    });

    it('should throw InvalidExpirationDateError when expiresAt is in the past', () => {
      expect(() =>
        VerificationToken.create({
          id: 'vtoken-123',
          userId: 'user-123',
          token: 'abc-def-ghi',
          expiresAt: pastDate(1000),
        }),
      ).toThrow(InvalidExpirationDateError);
    });

    it('should throw InvalidExpirationDateError when expiresAt is now', () => {
      expect(() =>
        VerificationToken.create({
          id: 'vtoken-123',
          userId: 'user-123',
          token: 'abc-def-ghi',
          expiresAt: new Date(),
        }),
      ).toThrow(InvalidExpirationDateError);
    });

    it('should start with usedAt as null', () => {
      const token = VerificationToken.create({
        id: 'vtoken-123',
        userId: 'user-123',
        token: 'abc-def-ghi',
        expiresAt: futureDate(1000),
      });

      expect(token.getUsedAt()).toBeNull();
    });
  });

  // ── fromDB() ───────────────────────────────────────────────

  describe('fromDB', () => {
    it('should reconstruct a token preserving all fields including usedAt', () => {
      const usedAt = new Date('2026-01-15T10:00:00Z');

      const token = VerificationToken.fromDB({
        id: 'vtoken-123',
        userId: 'user-123',
        token: 'abc-def-ghi',
        expiresAt: futureDate(1000),
        usedAt,
      });

      expect(token.getUsedAt()).toEqual(usedAt);
    });

    it('should default usedAt to null when not provided', () => {
      const token = VerificationToken.fromDB({
        id: 'vtoken-123',
        userId: 'user-123',
        token: 'abc-def-ghi',
        expiresAt: futureDate(1000),
      });

      expect(token.getUsedAt()).toBeNull();
    });

    it('should allow past expiration dates (tokens already expired in DB)', () => {
      expect(() =>
        VerificationToken.fromDB({
          id: 'vtoken-123',
          userId: 'user-123',
          token: 'abc-def-ghi',
          expiresAt: pastDate(1000),
        }),
      ).not.toThrow();
    });
  });

  // ── isExpired() ────────────────────────────────────────────

  describe('isExpired', () => {
    it('should return false for a token that expires in the future', () => {
      const token = VerificationToken.fromDB({
        id: 'vtoken-123',
        userId: 'user-123',
        token: 'abc-def-ghi',
        expiresAt: futureDate(24 * 60 * 60 * 1000),
      });

      expect(token.isExpired()).toBe(false);
    });

    it('should return true for a token that already expired', () => {
      const token = VerificationToken.fromDB({
        id: 'vtoken-123',
        userId: 'user-123',
        token: 'abc-def-ghi',
        expiresAt: pastDate(1000),
      });

      expect(token.isExpired()).toBe(true);
    });
  });

  // ── isUsed() ───────────────────────────────────────────────

  describe('isUsed', () => {
    it('should return false for an unused token', () => {
      const token = VerificationToken.create({
        id: 'vtoken-123',
        userId: 'user-123',
        token: 'abc-def-ghi',
        expiresAt: futureDate(1000),
      });

      expect(token.isUsed()).toBe(false);
    });

    it('should return true for a used token', () => {
      const token = VerificationToken.fromDB({
        id: 'vtoken-123',
        userId: 'user-123',
        token: 'abc-def-ghi',
        expiresAt: futureDate(1000),
        usedAt: new Date('2026-01-15T10:00:00Z'),
      });

      expect(token.isUsed()).toBe(true);
    });
  });

  // ── markUsed() ─────────────────────────────────────────────

  describe('markUsed', () => {
    it('should mark the token as used', () => {
      const token = VerificationToken.create({
        id: 'vtoken-123',
        userId: 'user-123',
        token: 'abc-def-ghi',
        expiresAt: futureDate(1000),
      });

      expect(token.isUsed()).toBe(false);

      token.markUsed();

      expect(token.isUsed()).toBe(true);
      expect(token.getUsedAt()).toBeInstanceOf(Date);
    });

    it('should throw VerificationTokenAlreadyUsedError if already used', () => {
      const token = VerificationToken.fromDB({
        id: 'vtoken-123',
        userId: 'user-123',
        token: 'abc-def-ghi',
        expiresAt: futureDate(1000),
        usedAt: new Date('2026-01-15T10:00:00Z'),
      });

      expect(() => {
        token.markUsed();
      }).toThrow(VerificationTokenAlreadyUsedError);
    });
  });
});
