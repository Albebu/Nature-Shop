import amqplib from 'amqplib';
import type { Channel, ChannelModel } from 'amqplib';
import type { Logger } from '../../domain/ports/logger.port.js';

export interface RabbitMQConnection {
  connection: ChannelModel;
  channel: Channel;
}

/**
 * Creates a RabbitMQ connection and channel.
 * Returns null if connection fails — the service should still work without RabbitMQ.
 */
export async function createRabbitMQConnection(
  url: string,
  logger: Logger,
): Promise<RabbitMQConnection | null> {
  try {
    const connection = await amqplib.connect(url);
    const channel = await connection.createChannel();

    logger.info({}, 'RabbitMQ connected');

    connection.on('error', (err: Error) => {
      logger.error({ error: err.message }, 'RabbitMQ connection error');
    });

    connection.on('close', () => {
      logger.warn({}, 'RabbitMQ connection closed');
    });

    return { connection, channel };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.warn(
      { error: message },
      'Failed to connect to RabbitMQ — running without event publishing',
    );
    return null;
  }
}

/**
 * Gracefully closes the RabbitMQ connection.
 */
export async function closeRabbitMQConnection(
  rabbitMQ: RabbitMQConnection | null,
  logger: Logger,
): Promise<void> {
  if (!rabbitMQ) return;

  try {
    await rabbitMQ.channel.close();
    await rabbitMQ.connection.close();
    logger.info({}, 'RabbitMQ connection closed gracefully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error: message }, 'Error closing RabbitMQ connection');
  }
}
