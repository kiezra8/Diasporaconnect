import { randomUUID } from 'crypto';

/**
 * Mobile-money collection clients.
 *
 * IMPORTANT: endpoint paths, header names and status codes below follow the providers' published
 * Collection APIs, but they could not be re-verified against the live docs while this was written
 * (both portals render docs with JavaScript). Every URL/path is overridable from the environment —
 * confirm them in each provider's sandbox before switching to production.
 */

export type CollectStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED';
export interface CollectStart { providerRef: string; raw?: any }
export interface CollectState { status: CollectStatus; reason?: string; financialTxnId?: string; raw?: any }

export interface MobileMoneyProvider {
  name: 'MTN' | 'AIRTEL';
  configured(): boolean;
  requestToPay(a: { msisdn: string; amount: number; externalId: string; payerMessage: string; payeeNote: string }): Promise<CollectStart>;
  status(providerRef: string): Promise<CollectState>;
}

const env = (k: string, d = '') => process.env[k] || d;

// ── MTN MoMo (Collection product) ────────────────────────────────────────────
// MTN_BASE_URL                       sandbox: https://sandbox.momodeveloper.mtn.com
// MTN_TARGET_ENVIRONMENT             sandbox: "sandbox" · production: as issued by MTN Uganda (e.g. "mtnuganda")
// MTN_CURRENCY                       sandbox uses EUR; production UGX
// MTN_COLLECTION_SUBSCRIPTION_KEY    Ocp-Apim-Subscription-Key for the Collection product
// MTN_API_USER / MTN_API_KEY         API user (UUID) and its key
// MTN_CALLBACK_URL                   optional, e.g. https://api.diasporaconnectt.com/payments/mtn/callback
export class MtnMomo implements MobileMoneyProvider {
  name = 'MTN' as const;
  private token: { value: string; exp: number } | null = null;

  configured() {
    return !!(env('MTN_COLLECTION_SUBSCRIPTION_KEY') && env('MTN_API_USER') && env('MTN_API_KEY'));
  }

  private base() { return env('MTN_BASE_URL', 'https://sandbox.momodeveloper.mtn.com').replace(/\/$/, ''); }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.exp > Date.now() + 30_000) return this.token.value;
    const basic = Buffer.from(`${env('MTN_API_USER')}:${env('MTN_API_KEY')}`).toString('base64');
    const res = await fetch(`${this.base()}${env('MTN_TOKEN_PATH', '/collection/token/')}`, {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Ocp-Apim-Subscription-Key': env('MTN_COLLECTION_SUBSCRIPTION_KEY') },
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) throw new Error(`MTN token request failed (${res.status})`);
    this.token = { value: data.access_token, exp: Date.now() + (Number(data.expires_in) || 3600) * 1000 };
    return this.token.value;
  }

  async requestToPay(a: { msisdn: string; amount: number; externalId: string; payerMessage: string; payeeNote: string }): Promise<CollectStart> {
    const ref = randomUUID();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${await this.accessToken()}`,
      'X-Reference-Id': ref,
      'X-Target-Environment': env('MTN_TARGET_ENVIRONMENT', 'sandbox'),
      'Ocp-Apim-Subscription-Key': env('MTN_COLLECTION_SUBSCRIPTION_KEY'),
      'Content-Type': 'application/json',
    };
    if (env('MTN_CALLBACK_URL')) headers['X-Callback-Url'] = env('MTN_CALLBACK_URL');
    const res = await fetch(`${this.base()}${env('MTN_REQUEST_TO_PAY_PATH', '/collection/v1_0/requesttopay')}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount: String(Math.round(a.amount)),
        currency: env('MTN_CURRENCY', 'UGX'),
        externalId: a.externalId,
        payer: { partyIdType: 'MSISDN', partyId: a.msisdn },
        payerMessage: a.payerMessage.slice(0, 160),
        payeeNote: a.payeeNote.slice(0, 160),
      }),
    });
    if (res.status !== 202 && !res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`MTN rejected the payment request (${res.status}) ${text.slice(0, 200)}`);
    }
    return { providerRef: ref };
  }

  async status(ref: string): Promise<CollectState> {
    const res = await fetch(`${this.base()}${env('MTN_REQUEST_TO_PAY_PATH', '/collection/v1_0/requesttopay')}/${ref}`, {
      headers: {
        Authorization: `Bearer ${await this.accessToken()}`,
        'X-Target-Environment': env('MTN_TARGET_ENVIRONMENT', 'sandbox'),
        'Ocp-Apim-Subscription-Key': env('MTN_COLLECTION_SUBSCRIPTION_KEY'),
      },
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) return { status: 'PENDING', reason: `status check HTTP ${res.status}`, raw: data };
    const s = String(data.status || '').toUpperCase();
    return {
      status: s === 'SUCCESSFUL' ? 'SUCCESSFUL' : s === 'FAILED' || s === 'REJECTED' || s === 'TIMEOUT' ? 'FAILED' : 'PENDING',
      reason: typeof data.reason === 'string' ? data.reason : data.reason?.message,
      financialTxnId: data.financialTransactionId,
      raw: data,
    };
  }
}

// ── Airtel Money Africa (Collection API) ─────────────────────────────────────
// AIRTEL_BASE_URL       UAT: https://openapiuat.airtel.africa · production: https://openapi.airtel.africa
// AIRTEL_CLIENT_ID / AIRTEL_CLIENT_SECRET
// AIRTEL_COUNTRY=UG  AIRTEL_CURRENCY=UGX
export class AirtelMoney implements MobileMoneyProvider {
  name = 'AIRTEL' as const;
  private token: { value: string; exp: number } | null = null;

  configured() { return !!(env('AIRTEL_CLIENT_ID') && env('AIRTEL_CLIENT_SECRET')); }
  private base() { return env('AIRTEL_BASE_URL', 'https://openapiuat.airtel.africa').replace(/\/$/, ''); }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.exp > Date.now() + 30_000) return this.token.value;
    const res = await fetch(`${this.base()}${env('AIRTEL_TOKEN_PATH', '/auth/oauth2/token')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: '*/*' },
      body: JSON.stringify({ client_id: env('AIRTEL_CLIENT_ID'), client_secret: env('AIRTEL_CLIENT_SECRET'), grant_type: 'client_credentials' }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) throw new Error(`Airtel token request failed (${res.status})`);
    this.token = { value: data.access_token, exp: Date.now() + (Number(data.expires_in) || 3600) * 1000 };
    return this.token.value;
  }

  private headers(tok: string) {
    return {
      Authorization: `Bearer ${tok}`,
      'X-Country': env('AIRTEL_COUNTRY', 'UG'),
      'X-Currency': env('AIRTEL_CURRENCY', 'UGX'),
      'Content-Type': 'application/json',
      Accept: '*/*',
    };
  }

  async requestToPay(a: { msisdn: string; amount: number; externalId: string; payerMessage: string; payeeNote: string }): Promise<CollectStart> {
    const id = a.externalId.replace(/[^A-Za-z0-9]/g, '').slice(0, 30);
    const res = await fetch(`${this.base()}${env('AIRTEL_COLLECT_PATH', '/merchant/v1/payments/')}`, {
      method: 'POST',
      headers: this.headers(await this.accessToken()),
      body: JSON.stringify({
        reference: a.payeeNote.slice(0, 60),
        // Airtel expects the subscriber number without the country code
        subscriber: { country: env('AIRTEL_COUNTRY', 'UG'), currency: env('AIRTEL_CURRENCY', 'UGX'), msisdn: a.msisdn.replace(/^256/, '') },
        transaction: { amount: Math.round(a.amount), country: env('AIRTEL_COUNTRY', 'UG'), currency: env('AIRTEL_CURRENCY', 'UGX'), id },
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || data?.status?.success === false) throw new Error(`Airtel rejected the payment request (${res.status}) ${data?.status?.message || ''}`);
    return { providerRef: id, raw: data };
  }

  async status(id: string): Promise<CollectState> {
    const res = await fetch(`${this.base()}${env('AIRTEL_STATUS_PATH', '/standard/v1/payments/')}${id}`, { headers: this.headers(await this.accessToken()) });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) return { status: 'PENDING', reason: `status check HTTP ${res.status}`, raw: data };
    const t = data?.data?.transaction || {};
    const code = String(t.status || '').toUpperCase(); // TS = success, TF = failed, TIP / TA = in progress
    return {
      status: code === 'TS' ? 'SUCCESSFUL' : code === 'TF' || code === 'TE' ? 'FAILED' : 'PENDING',
      reason: t.message || data?.status?.message,
      financialTxnId: t.airtel_money_id,
      raw: data,
    };
  }
}
