import { DomainError } from './domain.error.js';

export class NotFoundError extends DomainError {
  constructor() {
    super('Resource not found', 404);
    this.name = 'NotFoundError';
  }
}
