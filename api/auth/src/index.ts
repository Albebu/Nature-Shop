import { createLogger } from '@ecommerce/shared';
import { createApp } from './app.js';
import { ENV } from './env.js';
import { initLogger } from './infrastructure/driven/logger.instance.js';
import { PinoLoggerAdapter } from './infrastructure/driven/pino-logger.adapter.js';
import {
  closeRabbitMQConnection,
  createRabbitMQConnection,
} from './infrastructure/driven/rabbitmq.client.js';
import type { RabbitMQConnection } from './infrastructure/driven/rabbitmq.client.js';

const logger = createLogger({ service: 'auth-service', level: ENV.LOG_LEVEL });
initLogger(logger);

const loggerAdapter = new PinoLoggerAdapter(logger);

async function bootstrap(): Promise<void> {
  let rabbitMQ: RabbitMQConnection | null = null;

  if (ENV.RABBITMQ_URL) {
    rabbitMQ = await createRabbitMQConnection(ENV.RABBITMQ_URL, loggerAdapter);
  } else {
    logger.warn('RABBITMQ_URL not set — running without event publishing');
  }

  const app = createApp({ channel: rabbitMQ?.channel ?? null });

  const server = app.listen(ENV.PORT, () => {
    logger.info({ port: ENV.PORT }, 'Auth service started');
  });

  const shutdown = async (): Promise<void> => {
    logger.info({}, 'Shutting down gracefully...');
    server.close();
    await closeRabbitMQConnection(rabbitMQ, loggerAdapter);
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
}

void bootstrap();
