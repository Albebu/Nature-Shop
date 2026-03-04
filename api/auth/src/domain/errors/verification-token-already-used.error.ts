import { DomainError } from '@ecommerce/shared';

export class VerificationTokenAlreadyUsedError extends DomainError {
  constructor() {
    super('Verification token has already been used');
    this.name = 'VerificationTokenAlreadyUsedError';
  }
}
