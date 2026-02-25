import { DomainError } from './domain.error.js';

export class InvalidExpirationDateError extends DomainError {
  constructor() {
    super('Expiration date must be in the future');
    this.name = 'InvalidExpirationDateError';
  }
}
