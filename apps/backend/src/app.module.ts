import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';
import { UploadsModule } from './uploads/uploads.module';
import { SettingsModule } from './settings/settings.module';
import { ServicesModule } from './services/services.module';
import { AdvantagesModule } from './advantages/advantages.module';
import { TeamModule } from './team/team.module';
import { ObjectsModule } from './objects/objects.module';
import { ReviewsModule } from './reviews/reviews.module';
import { LeadsModule } from './leads/leads.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL_MS ?? 60000),
        limit: Number(process.env.THROTTLE_LIMIT ?? 10),
      },
    ]),
    AuthModule,
    UploadsModule,
    SettingsModule,
    ServicesModule,
    AdvantagesModule,
    TeamModule,
    ObjectsModule,
    TelegramModule,
    ReviewsModule,
    LeadsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
