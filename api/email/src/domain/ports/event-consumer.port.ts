import type { DomainEvent } from '@ecommerce/shared';

export interface EventConsumer {
  subscribe<T>(
    exchange: string,
    queue: string,
    routingKey: string,
    handler: (event: DomainEvent<T>) => Promise<void>,
  ): Promise<void>;
  close(): Promise<void>;
}
