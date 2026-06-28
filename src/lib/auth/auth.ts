import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prismaClient } from '../database/prisma-client.js';

export const auth = betterAuth({
  baseURL: process.env['BETTER_AUTH_URL'] ?? 'http://localhost:3000',
  trustedOrigins: (process.env['BETTER_AUTH_TRUSTED_ORIGINS'] ?? 'http://localhost:3000').split(',').map(o => o.trim()),
  database: prismaAdapter(prismaClient, { provider: 'postgresql' }),
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
