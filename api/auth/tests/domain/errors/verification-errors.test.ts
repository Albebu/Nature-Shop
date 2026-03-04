import { DomainError } from '@ecommerce/shared';
import { VerificationTokenExpiredError } from '@domain/errors/verification-token-expired.error.js';
import { VerificationTokenNotFoundError } from '@domain/errors/verification-token-not-found.error.js';
import { describe, expect, it } from 'vitest';

// ─── Test Suite ─────────────────────────────────────────────────
// Domain error constructors — validates message, name, and hierarchy.

describe('VerificationTokenExpiredError', () => {
  it('should have correct name and message', () => {
    const error = new VerificationTokenExpiredError();

    expect(error).toBeInstanceOf(DomainError);
    expect(error.name).toBe('VerificationTokenExpiredError');
    expect(error.message).toBe('Verification token has expired');
  });
});

describe('VerificationTokenNotFoundError', () => {
  it('should have correct name, message and statusCode', () => {
    const error = new VerificationTokenNotFoundError('abc-123');

    expect(error).toBeInstanceOf(DomainError);
    expect(error.name).toBe('VerificationTokenNotFoundError');
    expect(error.message).toBe('Verification token not found: abc-123');
    expect(error.statusCode).toBe(404);
  });
});
