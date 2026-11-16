import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SaccoService {
  constructor(
    private prisma: PrismaService,
    private accounting: AccountingService,
  ) {}

  /**
   * Member submits a deposit request.
   * NOTE: A submitted request is NOT proof of payment. It enters PENDING_VERIFICATION.
   */
  async submitDepositRequest(memberUserId: string, data: {
    amountUGX: number;
    paymentMethod: any;
    externalReference?: string;
    receiptEvidenceUrl?: string;
    notes?: string;
  }) {
    if (data.amountUGX <= 0) {
      throw new BadRequestException('Deposit amount must be strictly greater than 0 UGX.');
    }

    const member = await this.prisma.memberProfile.findUnique({
      where: { userId: memberUserId },
      include: { savingsAccounts: true },
    });

    if (!member || member.savingsAccounts.length === 0) {
      throw new NotFoundException('Member savings account not found.');
    }

    const savingsAccount = member.savingsAccounts[0];

    const tx = await this.prisma.savingsTransaction.create({
      data: {
        savingsAccountId: savingsAccount.id,
        type: 'DEPOSIT',
        amount: data.amountUGX,
        currency: 'UGX',
        amountUGX: data.amountUGX,
        paymentMethod: data.paymentMethod || 'MTN_MOBILE_MONEY',
        externalReference: data.externalReference,
        receiptEvidenceUrl: data.receiptEvidenceUrl,
        notes: data.notes,
        status: 'PENDING_VERIFICATION',
      },
    });

    return {
      message: 'Deposit request recorded. Awaiting verification by the Accountant.',
      transaction: tx,
    };
  }

  /**
   * Dual Control Step 1: Accountant Verifies receipt of external funds.
   */
  async verifyDepositByAccountant(txId: string, accountantUserId: string) {
    const tx = await this.prisma.savingsTransaction.findUnique({
      where: { id: txId },
    });

    if (!tx) throw new NotFoundException('Transaction record not found.');
    if (tx.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException(`Cannot verify transaction with status: ${tx.status}`);
    }

    const updated = await this.prisma.savingsTransaction.update({
      where: { id: txId },
      data: {
        status: 'VERIFIED_ACCOUNTANT',
        verifiedById: accountantUserId,
        verifiedAt: new Date(),
      },
    });

    return {
      message: 'Deposit verified by Accountant. Transferred to Admin queue for final authorization.',
      transaction: updated,
    };
  }

  /**
   * Dual Control Step 2: Admin Gives Final Authorization & Posts Double-Entry Ledger.
   */
  async authorizeDepositByAdmin(txId: string, adminUserId: string) {
    const tx = await this.prisma.savingsTransaction.findUnique({
      where: { id: txId },
      include: { savingsAccount: true },
    });

    if (!tx) throw new NotFoundException('Transaction record not found.');
    if (tx.status !== 'VERIFIED_ACCOUNTANT') {
      throw new BadRequestException('Transaction must be verified by an Accountant prior to Admin authorization.');
    }

    if (tx.verifiedById === adminUserId) {
      throw new ForbiddenException('Separation of duties violation: Verifier and Authorizer cannot be the same user.');
    }

    // Determine target asset account based on payment method
    const assetCode = tx.paymentMethod === 'AIRTEL_MONEY' ? '1030' : '1020'; // Airtel vs MTN
    const assetAccount = await this.prisma.account.findUnique({ where: { code: assetCode } });
    const liabilityAccount = await this.prisma.account.findUnique({ where: { code: '2010' } }); // Member Savings

    if (!assetAccount || !liabilityAccount) {
      throw new BadRequestException('Chart of accounts missing required accounts (1020/1030 or 2010). Please seed chart.');
    }

    return this.prisma.$transaction(async (prismaTx) => {
      // 1. Post to Double-Entry General Ledger
      const journalEntry = await this.accounting.postJournalEntry({
        description: `Member Savings Deposit: Ref ${tx.externalReference || tx.id}`,
        reference: tx.externalReference || tx.id,
        createdById: adminUserId,
        lines: [
          { accountId: assetAccount.id, debit: Number(tx.amountUGX), credit: 0 },
          { accountId: liabilityAccount.id, debit: 0, credit: Number(tx.amountUGX) },
        ],
      });

      // 2. Update Member Savings Balance
      await prismaTx.savingsAccount.update({
        where: { id: tx.savingsAccountId },
        data: {
          balanceUGX: { increment: tx.amountUGX },
        },
      });

      // 3. Mark transaction as POSTED
      const completedTx = await prismaTx.savingsTransaction.update({
        where: { id: tx.id },
        data: {
          status: 'POSTED',
          authorizedById: adminUserId,
          authorizedAt: new Date(),
          journalEntryId: journalEntry.id,
        },
      });

      return {
        message: 'Deposit authorized and posted to immutable double-entry ledger.',
        transaction: completedTx,
        journalEntryNumber: journalEntry.entryNumber,
      };
    });
  }

  /**
   * Member submits a withdrawal request with available balance enforcement.
   */
  async submitWithdrawalRequest(memberUserId: string, data: {
    amountUGX: number;
    payoutDestination: string; // Mobile money number or bank account
    notes?: string;
  }) {
    if (data.amountUGX <= 0) {
      throw new BadRequestException('Withdrawal amount must be strictly greater than 0 UGX.');
    }

    const member = await this.prisma.memberProfile.findUnique({
      where: { userId: memberUserId },
      include: { savingsAccounts: true },
    });

    if (!member || member.savingsAccounts.length === 0) {
      throw new NotFoundException('Member savings account not found.');
    }

    const savingsAccount = member.savingsAccounts[0];

    if (new Prisma.Decimal(savingsAccount.balanceUGX).lessThan(data.amountUGX)) {
      throw new BadRequestException(
        `Insufficient available savings balance. Current balance is UGX ${Number(savingsAccount.balanceUGX).toLocaleString()}.`
      );
    }

    const tx = await this.prisma.savingsTransaction.create({
      data: {
        savingsAccountId: savingsAccount.id,
        type: 'WITHDRAWAL',
        amount: data.amountUGX,
        currency: 'UGX',
        amountUGX: data.amountUGX,
        payoutDestination: data.payoutDestination,
        notes: data.notes,
        status: 'PENDING_VERIFICATION',
      },
    });

    return {
      message: 'Withdrawal request submitted. Routed to Accountant for compliance and verification.',
      transaction: tx,
    };
  }

  /**
   * Get full audited statement for a member
   */
  async getMemberStatement(memberUserId: string) {
    const member = await this.prisma.memberProfile.findUnique({
      where: { userId: memberUserId },
      include: {
        savingsAccounts: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              include: { journalEntry: true },
            },
          },
        },
        shareHoldings: { include: { shareClass: true } },
        investments: { include: { project: true } },
      },
    });

    if (!member) throw new NotFoundException('Member profile not found.');

    const primarySavings = member.savingsAccounts[0];
    const totalShares = member.shareHoldings.reduce((sum, s) => sum + s.sharesCount, 0);
    const totalShareValue = member.shareHoldings.reduce((sum, s) => sum + Number(s.totalValueUGX), 0);
    const totalInvestments = member.investments.reduce((sum, inv) => sum + Number(inv.amountInvestedUGX), 0);

    return {
      memberNumber: member.memberNumber,
      countryOfResidence: member.countryOfResidence,
      chapter: member.chapter,
      savingsBalanceUGX: primarySavings ? Number(primarySavings.balanceUGX) : 0,
      totalShares,
      totalShareValueUGX: totalShareValue,
      totalInvestmentsUGX: totalInvestments,
      transactions: primarySavings ? primarySavings.transactions : [],
      shareHoldings: member.shareHoldings,
      investments: member.investments,
    };
  }
}

