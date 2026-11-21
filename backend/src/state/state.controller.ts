import { Controller, Get, Put, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StateService } from './state.service';

/**
 * Shared portal data. Every portal reads and writes the same collections here,
 * stored in Supabase Postgres (table "AppState").
 */
@Controller('state')
@UseGuards(AuthGuard('jwt'))
export class StateController {
  constructor(private state: StateService) {}

  @Get()
  async list(@Request() req: any, @Query('since') since?: string) {
    return { items: await this.state.list(req.user, since) };
  }

  @Put(':key')
  async put(@Request() req: any, @Param('key') key: string, @Body() body: { value: any; baseVersion?: number | null; force?: boolean }) {
    return this.state.put(req.user, key, body?.value, body?.baseVersion ?? null, !!body?.force);
  }
}
