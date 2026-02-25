import { createLogger } from '@ecommerce/shared';
import { createApp } from './app.js';
import { ENV } from './env.js';

const logger = createLogger({ service: 'auth-service', level: ENV.LOG_LEVEL });

const app = createApp();

app.listen(ENV.PORT, () => {
  logger.info({ port: ENV.PORT }, 'Auth service started');
});
