import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { SupabaseAuthGuard, Roles } from '../auth/supabase-auth.guard';

@Controller('ai')
@UseGuards(SupabaseAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  /**
   * Admin-only SACCO advisor: management report or a question answered from the data snapshot.
   */
  @Roles('ADMIN')
  @Post('sacco-advisor')
  async saccoAdvisor(@Body() body: { mode?: 'report' | 'question'; question?: string; snapshot?: unknown }) {
    return this.aiService.advise(body.mode === 'question' ? 'question' : 'report', body.snapshot, body.question);
  }
}
