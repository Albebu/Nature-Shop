import { PrismaPg } from '@prisma/adapter-pg';
import { ENV } from '../../env.js';
import { PrismaClient } from '../../generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: ENV.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
