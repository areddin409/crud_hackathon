import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

const pgAdapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});
const prisma = new PrismaClient({ adapter: pgAdapter });

export const auth = betterAuth({
  baseURL: process.env['BETTER_AUTH_URL'] ?? 'http://localhost:3000',
  trustedOrigins: (process.env['BETTER_AUTH_TRUSTED_ORIGINS'] ?? 'http://localhost:3000').split(','),
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'PARTICIPANT',
        input: false,
      },
    },
  },
});
