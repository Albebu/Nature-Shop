import { DomainError } from './domain.error.js';

export class UnauthorizedError extends DomainError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}
