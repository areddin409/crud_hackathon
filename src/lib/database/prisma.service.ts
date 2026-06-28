import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client.js';
import { prismaClient } from './prisma-client.js';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly db: InstanceType<typeof PrismaClient>;

  constructor() {
    this.db = prismaClient;
  }

  async onModuleInit(): Promise<void> {
    await this.db.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.db.$disconnect();
  }
}
