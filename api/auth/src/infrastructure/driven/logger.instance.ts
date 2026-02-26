import type { Logger } from 'pino';

let _logger: Logger | undefined;

export function initLogger(logger: Logger): void {
  _logger = logger;
}

export function getLogger(): Logger {
  if (!_logger) {
    throw new Error('Logger not initialized. Call initLogger() in index.ts before using it.');
  }
  return _logger;
}
