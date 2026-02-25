import pino from 'pino';

export interface LoggerOptions {
  service: string;
  level: pino.Level;
}

export function createLogger({ service, level }: LoggerOptions): pino.Logger {
  return pino({
    level: level,
    base: { service },
  });
}
