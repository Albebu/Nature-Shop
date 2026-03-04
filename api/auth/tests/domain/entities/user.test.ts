import { User } from '@domain/entities/user.js';
import { EmailAlreadyVerifiedError } from '@domain/errors/email-already-verified.error.js';
import { InvalidEmailError } from '@domain/errors/invalid-email.error.js';
import { describe, expect, it } from 'vitest';

// ─── Test Suite ─────────────────────────────────────────────────
// La entidad User es el núcleo del dominio — sin dependencias externas,
// sin mocks. Si esto falla, todo lo demás falla.

describe('User', () => {
  // ── create() ───────────────────────────────────────────────

  describe('create', () => {
    it('should create a user with valid data', () => {
      const user = User.create({
        id: 'user-123',
        tenantId: 'tenant-456',
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: 'alex@example.com',
        passwordHash: '$argon2id$hash',
        userType: 'CUSTOMER',
      });

      expect(user.getId()).toBe('user-123');
      expect(user.getEmail()).toBe('alex@example.com');
      expect(user.getFirstName()).toBe('Alex');
      expect(user.getLastName()).toBe('Bellosta');
      expect(user.getPasswordHash()).toBe('$argon2id$hash');
      expect(user.getTenantId()).toBe('tenant-456');
    });

    it('should always set userType to CUSTOMER regardless of input', () => {
      const user = User.create({
        id: 'user-123',
        tenantId: null,
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: 'alex@example.com',
        passwordHash: '$argon2id$hash',
        userType: 'EMPLOYEE',
      });

      // create() hardcodea CUSTOMER — para crear empleados habrá otro factory
      expect(user.getTokenPayload().userType).toBe('CUSTOMER');
    });

    it('should throw InvalidEmailError for an invalid email', () => {
      expect(() =>
        User.create({
          id: 'user-123',
          tenantId: null,
          firstName: 'Alex',
          lastName: 'Bellosta',
          email: 'not-an-email',
          passwordHash: '$argon2id$hash',
          userType: 'CUSTOMER',
        }),
      ).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for an email without domain', () => {
      expect(() =>
        User.create({
          id: 'user-123',
          tenantId: null,
          firstName: 'Alex',
          lastName: 'Bellosta',
          email: 'alex@',
          passwordHash: '$argon2id$hash',
          userType: 'CUSTOMER',
        }),
      ).toThrow(InvalidEmailError);
    });

    it('should default tenantId to null when not provided', () => {
      const user = User.create({
        id: 'user-123',
        tenantId: null,
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: 'alex@example.com',
        passwordHash: '$argon2id$hash',
        userType: 'CUSTOMER',
      });

      expect(user.getTenantId()).toBeNull();
    });

    it('should always be active when created', () => {
      const user = User.create({
        id: 'user-123',
        tenantId: null,
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: 'alex@example.com',
        passwordHash: '$argon2id$hash',
        userType: 'CUSTOMER',
      });

      expect(user.getIsActive()).toBe(true);
    });

    it('should default emailVerifiedAt to null when created', () => {
      const user = User.create({
        id: 'user-123',
        tenantId: null,
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: 'alex@example.com',
        passwordHash: '$argon2id$hash',
        userType: 'CUSTOMER',
      });

      expect(user.getEmailVerifiedAt()).toBeNull();
      expect(user.isEmailVerified()).toBe(false);
    });
  });

  // ── fromDB() ───────────────────────────────────────────────

  describe('fromDB', () => {
    it('should reconstruct a user preserving all fields', () => {
      const user = User.fromDB({
        id: 'user-123',
        tenantId: 'tenant-456',
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: 'alex@example.com',
        passwordHash: '$argon2id$hash',
        userType: 'EMPLOYEE',
      });

      expect(user.getId()).toBe('user-123');
      expect(user.getTenantId()).toBe('tenant-456');
      expect(user.getTokenPayload().userType).toBe('EMPLOYEE');
    });

    it('should handle null tenantId from DB', () => {
      const user = User.fromDB({
        id: 'user-123',
        tenantId: null,
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: 'alex@example.com',
        passwordHash: '$argon2id$hash',
        userType: 'CUSTOMER',
      });

      expect(user.getTenantId()).toBeNull();
    });

    it('should preserve isActive false from DB', () => {
      const user = User.fromDB({
        id: 'user-123',
        tenantId: null,
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: 'alex@example.com',
        passwordHash: '$argon2id$hash',
        userType: 'CUSTOMER',
        isActive: false,
      });

      expect(user.getIsActive()).toBe(false);
    });

    it('should default isActive to true when not provided', () => {
      const user = User.fromDB({
        id: 'user-123',
        tenantId: null,
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: 'alex@example.com',
        passwordHash: '$argon2id$hash',
        userType: 'CUSTOMER',
      });

      expect(user.getIsActive()).toBe(true);
    });

    it('should preserve emailVerifiedAt from DB', () => {
      const verifiedAt = new Date('2026-01-15T10:00:00Z');
      const user = User.fromDB({
        id: 'user-123',
        tenantId: null,
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: 'alex@example.com',
        passwordHash: '$argon2id$hash',
        userType: 'CUSTOMER',
        emailVerifiedAt: verifiedAt,
      });

      expect(user.getEmailVerifiedAt()).toEqual(verifiedAt);
      expect(user.isEmailVerified()).toBe(true);
    });

    it('should default emailVerifiedAt to null when not provided from DB', () => {
      const user = User.fromDB({
        id: 'user-123',
        tenantId: null,
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: 'alex@example.com',
        passwordHash: '$argon2id$hash',
        userType: 'CUSTOMER',
      });

      expect(user.getEmailVerifiedAt()).toBeNull();
      expect(user.isEmailVerified()).toBe(false);
    });
  });

  // ── getTokenPayload() ──────────────────────────────────────

  describe('getTokenPayload', () => {
    it('should return userId, userType and tenantId', () => {
      const user = User.fromDB({
        id: 'user-123',
        tenantId: 'tenant-456',
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: 'alex@example.com',
        passwordHash: '$argon2id$hash',
        userType: 'CUSTOMER',
      });

      expect(user.getTokenPayload()).toEqual({
        userId: 'user-123',
        userType: 'CUSTOMER',
        tenantId: 'tenant-456',
      });
    });

    it('should NOT expose sensitive fields like passwordHash', () => {
      const user = User.fromDB({
        id: 'user-123',
        tenantId: null,
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: 'alex@example.com',
        passwordHash: '$argon2id$super_secret',
        userType: 'CUSTOMER',
      });

      const payload = user.getTokenPayload();

      expect(payload).not.toHaveProperty('passwordHash');
      expect(payload).not.toHaveProperty('email');
      expect(payload).not.toHaveProperty('firstName');
    });
  });

  // ── getUserType() ──────────────────────────────────────────

  describe('getUserType', () => {
    it('should return the user type', () => {
      const user = User.fromDB({
        id: 'user-123',
        tenantId: null,
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: 'alex@example.com',
        passwordHash: '$argon2id$hash',
        userType: 'EMPLOYEE',
      });

      expect(user.getUserType()).toBe('EMPLOYEE');
    });
  });

  // ── setPasswordHash() ──────────────────────────────────────

  describe('setPasswordHash', () => {
    it('should update the password hash', () => {
      const user = User.fromDB({
        id: 'user-123',
        tenantId: null,
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: 'alex@example.com',
        passwordHash: '$argon2id$old_hash',
        userType: 'CUSTOMER',
      });

      user.setPasswordHash('$argon2id$new_hash');

      expect(user.getPasswordHash()).toBe('$argon2id$new_hash');
    });
  });

  // ── markEmailVerified() ────────────────────────────────────

  describe('markEmailVerified', () => {
    it('should mark the email as verified', () => {
      const user = User.create({
        id: 'user-123',
        tenantId: null,
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: 'alex@example.com',
        passwordHash: '$argon2id$hash',
        userType: 'CUSTOMER',
      });

      expect(user.isEmailVerified()).toBe(false);

      user.markEmailVerified();

      expect(user.isEmailVerified()).toBe(true);
      expect(user.getEmailVerifiedAt()).toBeInstanceOf(Date);
    });

    it('should throw EmailAlreadyVerifiedError if already verified', () => {
      const user = User.fromDB({
        id: 'user-123',
        tenantId: null,
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: 'alex@example.com',
        passwordHash: '$argon2id$hash',
        userType: 'CUSTOMER',
        emailVerifiedAt: new Date('2026-01-15T10:00:00Z'),
      });

      expect(user.isEmailVerified()).toBe(true);

      expect(() => {
        user.markEmailVerified();
      }).toThrow(EmailAlreadyVerifiedError);
    });
  });

  // ── isEmailVerified() ──────────────────────────────────────

  describe('isEmailVerified', () => {
    it('should return false for unverified user', () => {
      const user = User.create({
        id: 'user-123',
        tenantId: null,
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: 'alex@example.com',
        passwordHash: '$argon2id$hash',
        userType: 'CUSTOMER',
      });

      expect(user.isEmailVerified()).toBe(false);
    });

    it('should return true for verified user', () => {
      const user = User.fromDB({
        id: 'user-123',
        tenantId: null,
        firstName: 'Alex',
        lastName: 'Bellosta',
        email: 'alex@example.com',
        passwordHash: '$argon2id$hash',
        userType: 'CUSTOMER',
        emailVerifiedAt: new Date('2026-01-15T10:00:00Z'),
      });

      expect(user.isEmailVerified()).toBe(true);
    });
  });
});
