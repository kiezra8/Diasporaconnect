import { Controller, Post, Get, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { SupabaseAuthGuard, Roles } from '../auth/supabase-auth.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { SmsService } from './sms.service';

@Controller('notifications')
@UseGuards(SupabaseAuthGuard)
export class NotificationsController {
  constructor(private sms: SmsService, private supabase: SupabaseService) {}

  /** Staff portals send member alerts here (approvals, KYC, repayments, dividends, broadcasts). */
  @Post('sms')
  @Roles('ADMIN', 'ACCOUNTANT', 'SECRETARY', 'FARM_WORKER')
  async send(@Request() req: any, @Body() body: { id: string; to: string; message: string; event?: string; senderId?: string }) {
    if (!body?.id || !body?.to || !body?.message) throw new BadRequestException('id, to and message are required');
    if (!/^[\w-]{3,80}$/.test(body.id)) throw new BadRequestException('Invalid message id');
    if (!/^\+?\d{10,15}$/.test(body.to)) throw new BadRequestException('Invalid phone number');
    return this.sms.send({ id: body.id, to: body.to, message: String(body.message).slice(0, 459), event: body.event || 'broadcast', senderId: body.senderId });
  }

  @Get('sms')
  @Roles('ADMIN', 'SECRETARY')
  async log() {
    const { data, error } = await this.supabase.db.from('sms_messages').select('seq, data').order('seq', { ascending: false }).limit(500);
    if (error) throw error;
    return (data || []).map(r => ({ no: r.seq, ...r.data }));
  }
}
