import { createLogger } from '@ecommerce/shared';
import { createApp } from './app.js';
import { ENV } from './env.js';

const logger = createLogger({ service: 'email-service', level: ENV.LOG_LEVEL });

async function main(): Promise<void> {
  const app = await createApp({
    logger,
    rabbitmqUrl: ENV.RABBITMQ_URL,
    verificationUrlBase: ENV.VERIFICATION_URL_BASE,
    resendApiKey: ENV.RESEND_API_KEY,
    fromEmail: ENV.FROM_EMAIL,
  });

  const shutdown = async (): Promise<void> => {
    logger.info('Shutting down email service...');
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

main().catch((error: unknown) => {
  logger.fatal({ error }, 'Email service failed to start');
  process.exit(1);
});
