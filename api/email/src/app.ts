import { USER_EVENTS_EXCHANGE, USER_REGISTERED_ROUTING_KEY } from '@ecommerce/shared';
import type { UserRegisteredPayload, DomainEvent } from '@ecommerce/shared';
import { HandleUserRegisteredUseCase } from './application/use-cases/handle-user-registered.use-case.js';
import { ResendEmailSender } from './infrastructure/driven/resend-email-sender.js';
import { PinoLoggerAdapter } from './infrastructure/driven/pino-logger.adapter.js';
import { RabbitMQEventConsumer } from './infrastructure/driven/rabbitmq-event-consumer.js';
import { createRabbitMQConnection } from './infrastructure/driven/rabbitmq.client.js';
import type { RabbitMQClient } from './infrastructure/driven/rabbitmq.client.js';
import type { Logger as PinoLogger } from 'pino';

const EMAIL_QUEUE = 'email.user.registered';

export interface EmailApp {
  readonly rabbitmq: RabbitMQClient;
  close(): Promise<void>;
}

export interface CreateAppOptions {
  logger: PinoLogger;
  rabbitmqUrl: string;
  verificationUrlBase: string;
  resendApiKey: string;
  fromEmail: string;
}

export async function createApp(options: CreateAppOptions): Promise<EmailApp> {
  const loggerAdapter = new PinoLoggerAdapter(options.logger);

  // Infrastructure
  const rabbitmq = await createRabbitMQConnection(options.rabbitmqUrl);
  const emailSender = new ResendEmailSender(
    options.resendApiKey,
    options.fromEmail,
    options.verificationUrlBase,
    loggerAdapter,
  );
  const eventConsumer = new RabbitMQEventConsumer(rabbitmq.channel, loggerAdapter);

  // Use cases
  const handleUserRegistered = new HandleUserRegisteredUseCase(emailSender, loggerAdapter);

  // Subscribe to events
  await eventConsumer.subscribe<UserRegisteredPayload>(
    USER_EVENTS_EXCHANGE,
    EMAIL_QUEUE,
    USER_REGISTERED_ROUTING_KEY,
    async (event: DomainEvent<UserRegisteredPayload>): Promise<void> => {
      await handleUserRegistered.execute(event);
    },
  );

  loggerAdapter.info({}, 'Email service started — listening for events');

  return {
    rabbitmq,
    async close(): Promise<void> {
      await eventConsumer.close();
      await rabbitmq.channelModel.close();
      loggerAdapter.info({}, 'Email service stopped');
    },
  };
}
