import { Controller, Post, Get, Body, Param, UseGuards, Request, HttpCode } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  /** Start an MTN MoMo / Airtel Money collection (prompt on the payer's phone). */
  @UseGuards(SupabaseAuthGuard)
  @Post('mobile-money/collect')
  collect(@Request() req: any, @Body() body: any) {
    return this.payments.collect(req.user, body);
  }

  /** Poll status; on success the deposit lands in the Admin approval queue already verified. */
  @UseGuards(SupabaseAuthGuard)
  @Get('mobile-money/:id')
  status(@Request() req: any, @Param('id') id: string) {
    return this.payments.refresh(id, req.user);
  }

  /** Provider callbacks (public). The body is only used to find the payment; status is re-checked with the provider. */
  @Post('mtn/callback')
  @HttpCode(200)
  mtnCallback(@Body() body: any) {
    return this.payments.callback('MTN', body);
  }

  @Post('airtel/callback')
  @HttpCode(200)
  airtelCallback(@Body() body: any) {
    return this.payments.callback('AIRTEL', body);
  }
}
