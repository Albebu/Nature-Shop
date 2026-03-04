import { DomainError } from '@ecommerce/shared';

export class VerificationTokenExpiredError extends DomainError {
  constructor() {
    super('Verification token has expired');
    this.name = 'VerificationTokenExpiredError';
  }
}
