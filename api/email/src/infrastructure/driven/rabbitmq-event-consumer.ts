import type { Channel, ConsumeMessage } from 'amqplib';
import type { DomainEvent } from '@ecommerce/shared';
import type { EventConsumer } from '@domain/ports/event-consumer.port.js';
import type { Logger } from '@domain/ports/logger.port.js';

export class RabbitMQEventConsumer implements EventConsumer {
  constructor(
    private readonly channel: Channel,
    private readonly logger: Logger,
  ) {}

  async subscribe<T>(
    exchange: string,
    queue: string,
    routingKey: string,
    handler: (event: DomainEvent<T>) => Promise<void>,
  ): Promise<void> {
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, exchange, routingKey);

    this.logger.info(
      { exchange, queue, routingKey },
      `Subscribed to ${exchange}/${routingKey} via queue ${queue}`,
    );

    await this.channel.consume(queue, (msg) => {
      if (!msg) return;

      void this.handleMessage(msg, handler, { exchange, queue, routingKey });
    });
  }

  private async handleMessage<T>(
    msg: ConsumeMessage,
    handler: (event: DomainEvent<T>) => Promise<void>,
    context: { exchange: string; queue: string; routingKey: string },
  ): Promise<void> {
    try {
      const event = JSON.parse(msg.content.toString()) as DomainEvent<T>;

      try {
        await handler(event);
        this.channel.ack(msg);
      } catch (handlerError: unknown) {
        const errorMessage =
          handlerError instanceof Error ? handlerError.message : 'Unknown handler error';
        this.logger.error(
          { ...context, error: errorMessage },
          'Handler error processing message — nacking without requeue',
        );
        this.channel.nack(msg, false, false);
      }
    } catch (parseError: unknown) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
      this.logger.error(
        { ...context, error: errorMessage },
        'Failed to parse message — acking poison pill',
      );
      this.channel.ack(msg);
    }
  }

  async close(): Promise<void> {
    await this.channel.close();
  }
}
