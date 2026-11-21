import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface SmsResult { status: 'SENT' | 'FAILED'; providerRef?: string; cost?: string; error?: string }

/**
 * SMS through Africa's Talking (widely used in Uganda).
 *   AT_USERNAME  — your Africa's Talking app username ("sandbox" for testing)
 *   AT_API_KEY   — API key for that app
 *   AT_SENDER_ID — optional approved alphanumeric sender id
 *   AT_SMS_URL   — override the endpoint if Africa's Talking changes it
 * Every message is recorded in the Supabase `sms_messages` table; a message already SENT is never sent twice.
 */
@Injectable()
export class SmsService {
  private log = new Logger('SMS');
  constructor(private supabase: SupabaseService) {}

  configured(): boolean {
    return !!(process.env.AT_USERNAME && process.env.AT_API_KEY);
  }

  private endpoint(): string {
    if (process.env.AT_SMS_URL) return process.env.AT_SMS_URL;
    return process.env.AT_USERNAME === 'sandbox'
      ? 'https://api.sandbox.africastalking.com/version1/messaging'
      : 'https://api.africastalking.com/version1/messaging';
  }

  async send(args: { id: string; to: string; message: string; event: string; senderId?: string; memberId?: string }): Promise<SmsResult> {
    const existing = await this.supabase.getData<any>('sms_messages', args.id).catch(() => null);
    if (existing?.status === 'SENT') return { status: 'SENT', providerRef: existing.providerRef }; // idempotent

    let result: SmsResult;
    if (!this.configured()) {
      result = { status: 'FAILED', error: 'SMS gateway not configured on the server (AT_USERNAME / AT_API_KEY).' };
    } else {
      try {
        const to = args.to.startsWith('+') ? args.to : `+${args.to}`;
        const form = new URLSearchParams({ username: process.env.AT_USERNAME!, to, message: args.message });
        const from = process.env.AT_SENDER_ID || args.senderId;
        if (from && process.env.AT_USERNAME !== 'sandbox') form.set('from', from);
        const res = await fetch(this.endpoint(), {
          method: 'POST',
          headers: { apiKey: process.env.AT_API_KEY!, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
          body: form.toString(),
        });
        const data: any = await res.json().catch(() => ({}));
        const rcpt = data?.SMSMessageData?.Recipients?.[0];
        const ok = res.ok && rcpt && (rcpt.status === 'Success' || [100, 101, 102].includes(Number(rcpt.statusCode)));
        result = ok
          ? { status: 'SENT', providerRef: rcpt.messageId, cost: rcpt.cost }
          : { status: 'FAILED', error: rcpt?.status || data?.SMSMessageData?.Message || `HTTP ${res.status}` };
      } catch (e: any) {
        result = { status: 'FAILED', error: e?.message || 'Network error' };
      }
    }

    const record = {
      ...(existing || {}),
      id: args.id,
      event: args.event,
      to: args.to,
      memberId: args.memberId ?? existing?.memberId,
      message: args.message,
      createdAt: existing?.createdAt || new Date().toISOString(),
      status: result.status,
      providerRef: result.providerRef,
      error: result.error,
    };
    const { error } = await this.supabase.db.from('sms_messages').upsert({ id: args.id, data: record }, { onConflict: 'id' });
    if (error) this.log.warn(`Could not record SMS ${args.id}: ${error.message}`);
    if (result.status === 'FAILED') this.log.warn(`SMS ${args.id} to ${args.to} failed: ${result.error}`);
    return result;
  }
}
