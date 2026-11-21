import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { SupabaseService } from './supabase/supabase.service';
import { SupabaseAuthGuard } from './auth/supabase-auth.guard';

import { AiService } from './ai/ai.service';
import { AiController } from './ai/ai.controller';

import { SmsService } from './notifications/sms.service';
import { NotificationsController } from './notifications/notifications.controller';
import { PaymentsService } from './payments/payments.service';
import { PaymentsController } from './payments/payments.controller';
import { HealthController } from './health.controller';

/**
 * The API on the VPS (Contabo) handles only what needs server-side secrets:
 * mobile money (MTN / Airtel), SMS (Africa's Talking) and the AI advisor.
 * Sign-in and all SACCO data live in Supabase (Auth + Postgres).
 */
@Module({
  imports: [
    // Rate limit per IP address: at most 60 requests a minute (stricter limits on single endpoints)
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
  ],
  controllers: [AiController, NotificationsController, PaymentsController, HealthController],
  providers: [
    SupabaseService,
    SupabaseAuthGuard,
    AiService,
    SmsService,
    PaymentsService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
