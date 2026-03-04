import { DomainError } from '@ecommerce/shared';

export class EmailAlreadyVerifiedError extends DomainError {
  constructor() {
    super('Email is already verified');
    this.name = 'EmailAlreadyVerifiedError';
  }
}
