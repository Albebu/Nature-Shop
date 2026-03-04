import type { DomainEvent } from '@ecommerce/shared';

export interface EventPublisher {
  publish<T>(event: DomainEvent<T>): Promise<void>;
}
