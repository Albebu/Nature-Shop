import type { Logger as PinoLogger } from 'pino';
import type { Logger } from '../../domain/ports/logger.port.js';

export class PinoLoggerAdapter implements Logger {
  constructor(private readonly pino: PinoLogger) {}

  info(obj: Record<string, unknown>, msg: string): void {
    this.pino.info(obj, msg);
  }

  error(obj: Record<string, unknown>, msg: string): void {
    this.pino.error(obj, msg);
  }

  warn(obj: Record<string, unknown>, msg: string): void {
    this.pino.warn(obj, msg);
  }

  debug(obj: Record<string, unknown>, msg: string): void {
    this.pino.debug(obj, msg);
  }
}
