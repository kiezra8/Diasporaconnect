import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { SupportService } from './support.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('support')
export class SupportController {
  constructor(private supportService: SupportService) {}

  /**
   * RAG Knowledge Base Query (Open to visitors and authenticated members)
   */
  @Post('query')
  async queryAssistant(@Body('query') query: string, @Request() req: any) {
    const memberId = req.user?.id;
    return this.supportService.answerQuery(query, memberId);
  }

  /**
   * Submit Support Ticket
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('tickets')
  async createTicket(@Request() req: any, @Body() body: any) {
    return this.supportService.createTicket(req.user.id, body);
  }

  /**
   * Seed Knowledge Base
   */
  @Post('seed-kb')
  async seedKb() {
    return this.supportService.seedKnowledgeBase();
  }
}

