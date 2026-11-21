import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client. Uses the service-role key (never sent to browsers), so it can
 * write records on behalf of mobile-money callbacks and check who is signed in.
 *   SUPABASE_URL               https://<project-ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  Project Settings → API → service_role (secret)
 */
@Injectable()
export class SupabaseService {
  private client: SupabaseClient | null = null;

  configured(): boolean {
    return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  }

  get db(): SupabaseClient {
    if (!this.configured()) throw new ServiceUnavailableException('Supabase is not configured on the server (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
    if (!this.client) {
      this.client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return this.client;
  }

  /** Reads one record body from a portal table (members, payment_requests …). */
  async getData<T = any>(table: string, id: string): Promise<T | null> {
    const { data, error } = await this.db.from(table).select('data').eq('id', id).maybeSingle();
    if (error) throw error;
    return (data?.data as T) ?? null;
  }

  async findMember(memberId: string): Promise<any | null> {
    const { data, error } = await this.db.from('members').select('data').eq('member_id', memberId).maybeSingle();
    if (error) throw error;
    return data?.data ?? null;
  }

  async setting<T = any>(key: string, fallback: T): Promise<T> {
    const { data } = await this.db.from('app_settings').select('value').eq('key', key).maybeSingle();
    return (data?.value as T) ?? fallback;
  }
}
