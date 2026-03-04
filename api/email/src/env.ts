import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  RABBITMQ_URL: z.string().min(1),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  VERIFICATION_URL_BASE: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  FROM_EMAIL: z.string().min(1).default('Nature Shop <onboarding@resend.dev>'),
});

export const ENV = envSchema.parse(process.env);
