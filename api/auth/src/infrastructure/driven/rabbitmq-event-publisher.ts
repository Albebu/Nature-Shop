import type { Channel } from 'amqplib';
import type { DomainEvent } from '@ecommerce/shared';
import { USER_EVENTS_EXCHANGE } from '@ecommerce/shared';
import type { EventPublisher } from '../../domain/ports/event-publisher.port.js';
import type { Logger } from '../../domain/ports/logger.port.js';

export class RabbitMQEventPublisher implements EventPublisher {
  constructor(
    private readonly channel: Channel,
    private readonly logger: Logger,
  ) {}

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    try {
      await this.channel.assertExchange(USER_EVENTS_EXCHANGE, 'topic', { durable: true });

      const message = Buffer.from(JSON.stringify(event));

      this.channel.publish(USER_EVENTS_EXCHANGE, event.type, message, {
        persistent: true,
        contentType: 'application/json',
      });

      this.logger.info(
        { eventType: event.type, correlationId: event.correlationId },
        'Event published to RabbitMQ',
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        { error: errorMessage, eventType: event.type },
        'Failed to publish event to RabbitMQ',
      );
    }
  }
}
