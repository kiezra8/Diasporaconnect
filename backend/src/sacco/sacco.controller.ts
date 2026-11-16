import { Controller, Post, Body, Get, UseGuards, Request, Param } from '@nestjs/common';
import { SaccoService } from './sacco.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('sacco')
export class SaccoController {
  constructor(private saccoService: SaccoService) {}

  /**
   * Member submits deposit request
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MEMBER, UserRole.ADMIN)
  @Post('deposit')
  async submitDeposit(@Request() req: any, @Body() body: any) {
    return this.saccoService.submitDepositRequest(req.user.id, body);
  }

  /**
   * Member submits withdrawal request
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MEMBER, UserRole.ADMIN)
  @Post('withdraw')
  async submitWithdrawal(@Request() req: any, @Body() body: any) {
    return this.saccoService.submitWithdrawalRequest(req.user.id, body);
  }

  /**
   * Member views personal audited statement
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MEMBER)
  @Get('my-statement')
  async getMyStatement(@Request() req: any) {
    return this.saccoService.getMemberStatement(req.user.id);
  }

  /**
   * Dual Control Step 1: Accountant Verifies Deposit
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ACCOUNTANT, UserRole.ADMIN)
  @Post('transactions/:id/verify')
  async verifyTransaction(@Request() req: any, @Param('id') txId: string) {
    return this.saccoService.verifyDepositByAccountant(txId, req.user.id);
  }

  /**
   * Dual Control Step 2: Admin Gives Final Authorization & Posts Double-Entry Ledger
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('transactions/:id/authorize')
  async authorizeTransaction(@Request() req: any, @Param('id') txId: string) {
    return this.saccoService.authorizeDepositByAdmin(txId, req.user.id);
  }
}

