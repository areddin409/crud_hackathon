import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ArcjetModule, ArcjetGuard, shield, slidingWindow } from '@arcjet/nest';
import { AuthModule } from './lib/auth/auth.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './lib/database/prisma.module.js';
import { UserModule } from './module/user/user.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ArcjetModule.forRootAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        key: config.getOrThrow<string>('ARCJET_KEY'),
        rules: [
          shield({ mode: 'LIVE' }),
          slidingWindow({
            mode: 'LIVE',
            interval: '1m',
            max: parseInt(config.get('ARCJET_RATE_LIMIT_MAX', '60'), 10),
          }),
        ],
      }),
    }),
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ArcjetGuard }],
})
export class AppModule {}
