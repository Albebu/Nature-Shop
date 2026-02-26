import { createLogger } from '@ecommerce/shared';
import { createApp } from './app.js';
import { ENV } from './env.js';
import { initLogger } from './infrastructure/driven/logger.instance.js';

const logger = createLogger({ service: 'auth-service', level: ENV.LOG_LEVEL });
initLogger(logger);

const app = createApp();

app.listen(ENV.PORT, () => {
  logger.info({ port: ENV.PORT }, 'Auth service started');
});
