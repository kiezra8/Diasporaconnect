import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from './supabase/supabase.service';

@Controller('health')
export class HealthController {
  constructor(private supabase: SupabaseService) {}

  /** Used by Docker / uptime monitors on the VPS. */
  @Get()
  async health() {
    let database = 'ok';
    try {
      const { error } = await this.supabase.db.from('app_settings').select('key', { head: true, count: 'exact' });
      if (error) database = `error: ${error.message}`;
    } catch {
      database = 'unreachable';
    }
    return {
      status: database === 'ok' ? 'ok' : 'degraded',
      database,
      sms: !!(process.env.AT_USERNAME && process.env.AT_API_KEY),
      mtn: !!process.env.MTN_COLLECTION_SUBSCRIPTION_KEY,
      airtel: !!process.env.AIRTEL_CLIENT_ID,
      ai: !!process.env.ANTHROPIC_API_KEY,
      time: new Date().toISOString(),
    };
  }
}
