import { DomainError } from '@ecommerce/shared';

export class VerificationTokenNotFoundError extends DomainError {
  constructor(token: string) {
    super(`Verification token not found: ${token}`, 404);
    this.name = 'VerificationTokenNotFoundError';
  }
}
