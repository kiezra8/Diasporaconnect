import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('accounting')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AccountingController {
  constructor(private accountingService: AccountingService) {}

  @Roles(UserRole.ACCOUNTANT, UserRole.ADMIN, UserRole.BOARD_MEMBER)
  @Get('trial-balance')
  async getTrialBalance() {
    return this.accountingService.getTrialBalance();
  }

  @Roles(UserRole.ACCOUNTANT, UserRole.ADMIN)
  @Post('journal-entries')
  async createJournalEntry(@Request() req: any, @Body() body: any) {
    return this.accountingService.postJournalEntry({
      ...body,
      createdById: req.user.id,
    });
  }

  @Roles(UserRole.ADMIN)
  @Post('journal-entries/:id/reverse')
  async reverseJournalEntry(
    @Request() req: any,
    @Param('id') id: string,
    @Body('reason') reason: string
  ) {
    return this.accountingService.reverseJournalEntry(id, req.user.id, reason || 'Administrative correction');
  }

  @Roles(UserRole.ADMIN)
  @Post('seed-chart-of-accounts')
  async seedChart() {
    return this.accountingService.seedStandardChartOfAccounts();
  }
}

