import { Injectable, BadRequestException, ForbiddenException, NotFoundException, ServiceUnavailableException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthUser } from '../auth/supabase-auth.guard';
import { SmsService } from '../notifications/sms.service';
import { MtnMomo, AirtelMoney, MobileMoneyProvider } from './providers';

const PURPOSES = ['savings', 'shares', 'welfare', 'project', 'other'];
const normalizeUg = (raw: string) => {
  const d = String(raw || '').replace(/\D/g, '');
  if (/^0\d{9}$/.test(d)) return '256' + d.slice(1);
  if (/^256\d{9}$/.test(d)) return d;
  if (/^7\d{8}$/.test(d)) return '256' + d;
  return '';
};
const STAFF = ['ADMIN', 'ACCOUNTANT', 'SECRETARY', 'BOARD_MEMBER', 'FARM_WORKER'];

@Injectable()
export class PaymentsService {
  private log = new Logger('MobileMoney');
  private providers: Record<string, MobileMoneyProvider> = { MTN: new MtnMomo(), AIRTEL: new AirtelMoney() };

  constructor(private supabase: SupabaseService, private sms: SmsService) {}

  async collect(user: AuthUser, body: { provider: string; phone: string; amount: number; memberId: string; purpose: string; month?: string; otherLabel?: string }) {
    const provider = this.providers[String(body.provider).toUpperCase()];
    if (!provider) throw new BadRequestException('provider must be MTN or AIRTEL');
    if (!provider.configured()) throw new ServiceUnavailableException(`${provider.name} payments are not set up on the server yet.`);
    const amount = Math.round(Number(body.amount));
    if (!amount || amount < 500 || amount > 20_000_000) throw new BadRequestException('Amount must be between UGX 500 and UGX 20,000,000');
    if (!PURPOSES.includes(body.purpose)) throw new BadRequestException('Unknown payment purpose');
    const msisdn = normalizeUg(body.phone);
    if (!msisdn) throw new BadRequestException('Enter a valid Ugandan mobile number (07XX XXX XXX)');

    // members can only pay into their own account
    if (user.role === 'MEMBER' && user.memberId !== body.memberId) throw new ForbiddenException('You can only pay into your own account.');
    const member = await this.supabase.findMember(body.memberId);
    if (!member) throw new NotFoundException('Member not found');

    const externalId = `DCM${Date.now()}`;
    const started = await provider.requestToPay({
      msisdn,
      amount,
      externalId,
      payerMessage: `Diaspora Connect SACCO ${body.purpose}`,
      payeeNote: `${member.memberId} ${body.purpose}`,
    });
    const { data: p, error } = await this.supabase.db.from('mobile_money_payments').insert({
      provider: provider.name, provider_ref: started.providerRef, external_id: externalId, msisdn, amount,
      member_id: member.memberId, purpose: body.purpose, month: body.month || null, other_label: body.otherLabel || null,
      initiated_by: user.email, raw: started.raw ?? null,
    }).select('id').single();
    if (error) throw error;
    return { id: p.id, status: 'PENDING', message: `A ${provider.name === 'MTN' ? 'MTN MoMo' : 'Airtel Money'} prompt was sent to +${msisdn}. Enter your PIN to approve UGX ${amount.toLocaleString()}.` };
  }

  private async find(ref: string) {
    const db = this.supabase.db.from('mobile_money_payments').select('*');
    const isUuid = /^[0-9a-f-]{36}$/i.test(ref);
    const { data, error } = isUuid
      ? await db.or(`id.eq.${ref},provider_ref.eq.${ref}`).limit(1)
      : await db.or(`provider_ref.eq.${ref},external_id.eq.${ref}`).limit(1);
    if (error) throw error;
    return data?.[0] || null;
  }

  /** Polls the provider (also called from callbacks — callback bodies are never trusted on their own). */
  async refresh(id: string, user?: AuthUser) {
    if (!/^[\w-]{6,80}$/.test(id)) throw new BadRequestException('Invalid payment reference');
    const p = await this.find(id);
    if (!p) throw new NotFoundException('Payment not found');
    if (user && !STAFF.includes(user.role) && user.memberId !== p.member_id) throw new ForbiddenException();
    if (p.status !== 'PENDING') return this.view(p);

    const st = await this.providers[p.provider].status(p.provider_ref);
    if (st.status === 'PENDING') return this.view(p);

    // claim the state change atomically so a callback and a poll can't both post it
    const { data: claimed, error } = await this.supabase.db.from('mobile_money_payments')
      .update({ status: st.status, reason: st.reason ?? null, financial_txn_id: st.financialTxnId ?? null, raw: st.raw ?? null })
      .eq('id', p.id).eq('status', 'PENDING').select('*');
    if (error) throw error;
    if (claimed?.length === 1 && st.status === 'SUCCESSFUL') await this.onPaid(claimed[0]);
    const latest = await this.find(p.id);
    return this.view(latest || p);
  }

  private view(p: any) {
    return { id: p.id, status: p.status, reason: p.reason, requestId: p.request_id, amount: Number(p.amount), provider: p.provider };
  }

  /** Money confirmed by the provider → straight to the Admin approval queue, already verified. */
  private async onPaid(p: any) {
    const amount = Number(p.amount);
    const member = await this.supabase.findMember(p.member_id);
    const par = Number(await this.supabase.setting<any>('share_par_value', 250000)) || 250000;
    const requestId = `PRQ-MM${String(Date.now()).slice(-6)}`;
    const providerLabel = p.provider === 'MTN' ? 'MTN Mobile Money' : 'Airtel Money';
    const purposeLabel = p.purpose === 'savings' ? `Monthly Savings${p.month ? ` (${String(p.month).toUpperCase()})` : ''}`
      : p.purpose === 'shares' ? 'Buying Shares'
      : p.purpose === 'welfare' ? 'Welfare & Emergency Fund'
      : p.purpose === 'project' ? 'Special Farm Project'
      : (p.other_label || 'Other Special Deposit');
    const now = new Date().toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kampala' });

    const request: any = {
      id: requestId,
      memberId: p.member_id,
      memberName: member?.name || p.member_id,
      kind: 'DEPOSIT',
      purpose: p.purpose,
      purposeLabel,
      amount,
      method: providerLabel,
      reference: p.financial_txn_id || p.provider_ref,
      notes: `Paid from +${p.msisdn}`,
      submittedAt: now,
      status: 'VERIFIED_AWAITING_ADMIN',
      verifiedBy: `${providerLabel} (confirmed by provider)`,
      verifiedAt: now,
    };
    if (p.purpose === 'savings' && p.month) request.month = p.month;
    if (p.purpose === 'shares') request.shareCount = Math.floor(amount / par);

    const db = this.supabase.db;
    const { error } = await db.from('payment_requests').insert({ id: requestId, data: request });
    if (error) throw error;
    await db.from('mobile_money_payments').update({ request_id: requestId }).eq('id', p.id);

    const auditId = `MM-${p.id}`;
    await db.from('audit_log').upsert({
      id: auditId,
      data: {
        id: auditId, at: new Date().toISOString(), actor: providerLabel, role: 'SYSTEM', action: 'mobileMoneyReceived', entity: 'PaymentRequest',
        entityId: requestId, summary: `${providerLabel} payment of UGX ${amount.toLocaleString()} from ${p.member_id} confirmed (${p.financial_txn_id || p.provider_ref})`,
      },
    }, { onConflict: 'id', ignoreDuplicates: true });

    if (member?.phone) {
      const smsId = `SMS-MM-${String(p.id).slice(0, 8)}`;
      const message = `Diaspora Connect: we received UGX ${amount.toLocaleString()} via ${providerLabel} for ${purposeLabel}. It will show on your account after Admin approval.`;
      await this.sms.send({ id: smsId, to: normalizeUg(member.phone) || member.phone, message, event: 'payment_received', memberId: p.member_id });
    }
    this.log.log(`Payment ${p.id} confirmed → request ${requestId}`);
  }

  async callback(provider: 'MTN' | 'AIRTEL', body: any) {
    const ref = provider === 'MTN' ? body?.externalId || body?.referenceId : body?.transaction?.id;
    if (!ref) return { received: true };
    try { await this.refresh(String(ref)); } catch (e: any) { this.log.warn(`callback for ${ref}: ${e?.message}`); }
    return { received: true };
  }
}
