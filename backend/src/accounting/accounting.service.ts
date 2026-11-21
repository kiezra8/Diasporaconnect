import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface JournalLineDto {
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface CreateJournalEntryDto {
  description: string;
  reference?: string;
  createdById: string;
  lines: JournalLineDto[];
}

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Post a balanced double-entry transaction.
   * INVARIANT: SUM(Debits) MUST EQUAL SUM(Credits) and be > 0.
   */
  async postJournalEntry(dto: CreateJournalEntryDto) {
    if (!dto.lines || dto.lines.length < 2) {
      throw new BadRequestException('A valid journal entry must contain at least 2 lines (double-entry requirement).');
    }

    let totalDebit = new Prisma.Decimal(0);
    let totalCredit = new Prisma.Decimal(0);

    for (const line of dto.lines) {
      const d = new Prisma.Decimal(line.debit || 0);
      const c = new Prisma.Decimal(line.credit || 0);
      if (d.isNegative() || c.isNegative()) {
        throw new BadRequestException('Debit and credit line amounts cannot be negative.');
      }
      totalDebit = totalDebit.plus(d);
      totalCredit = totalCredit.plus(c);
    }

    if (!totalDebit.equals(totalCredit)) {
      throw new BadRequestException(
        `Double-entry imbalance: Total Debits (${totalDebit.toString()} UGX) must exactly equal Total Credits (${totalCredit.toString()} UGX).`
      );
    }

    if (totalDebit.equals(0)) {
      throw new BadRequestException('Transaction entry value cannot be zero.');
    }

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.journalEntry.count();
      const entryNumber = `JE-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

      const entry = await tx.journalEntry.create({
        data: {
          entryNumber,
          description: dto.description,
          reference: dto.reference,
          status: 'POSTED',
          createdById: dto.createdById,
          postedAt: new Date(),
          lines: {
            create: dto.lines.map((l) => ({
              accountId: l.accountId,
              debit: l.debit,
              credit: l.credit,
              description: l.description || dto.description,
            })),
          },
        },
        include: {
          lines: {
            include: { account: true },
          },
        },
      });

      return entry;
    });
  }

  /**
   * Reverse an existing posted journal entry immutably.
   */
  async reverseJournalEntry(entryId: string, authorizerId: string, reason: string) {
    const original = await this.prisma.journalEntry.findUnique({
      where: { id: entryId },
      include: { lines: true },
    });

    if (!original) {
      throw new NotFoundException(`Journal entry ${entryId} not found.`);
    }

    if (original.status !== 'POSTED') {
      throw new BadRequestException('Only POSTED journal entries can be reversed.');
    }

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.journalEntry.count();
      const reversalNumber = `REV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

      const reversal = await tx.journalEntry.create({
        data: {
          entryNumber: reversalNumber,
          description: `REVERSAL of ${original.entryNumber}: ${reason}`,
          reference: original.entryNumber,
          status: 'POSTED',
          createdById: authorizerId,
          postedAt: new Date(),
          reversalOfId: original.id,
          lines: {
            create: original.lines.map((l) => ({
              accountId: l.accountId,
              debit: l.credit, // Invert credits to debits
              credit: l.debit, // Invert debits to credits
              description: `Reversal line: ${l.description || ''}`,
            })),
          },
        },
      });

      await tx.journalEntry.update({
        where: { id: original.id },
        data: { status: 'REVERSED' },
      });

      return reversal;
    });
  }

  /**
   * Generate live Trial Balance derived strictly from posted journal lines.
   */
  async getTrialBalance() {
    const accounts = await this.prisma.account.findMany({
      where: { isActive: true },
      include: {
        journalLines: {
          where: { journalEntry: { status: 'POSTED' } },
        },
      },
      orderBy: { code: 'asc' },
    });

    let totalDebits = 0;
    let totalCredits = 0;

    const report = accounts.map((acc) => {
      let accDebits = 0;
      let accCredits = 0;

      for (const line of acc.journalLines) {
        accDebits += Number(line.debit);
        accCredits += Number(line.credit);
      }

      totalDebits += accDebits;
      totalCredits += accCredits;

      // Net balance determination according to normal account balance convention
      let netBalance = 0;
      if (acc.category === 'ASSET' || acc.category === 'EXPENSE') {
        netBalance = accDebits - accCredits;
      } else {
        netBalance = accCredits - accDebits;
      }

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        category: acc.category,
        totalDebit: accDebits,
        totalCredit: accCredits,
        netBalance,
      };
    });

    return {
      report,
      summary: {
        totalDebits,
        totalCredits,
        isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
      },
    };
  }

  /**
   * Standard Chart of Accounts seed for Diaspora Connect
   */
  async seedStandardChartOfAccounts() {
    const standardAccounts = [
      // 1000 - ASSETS
      { code: '1010', name: 'Operating Cash & Bank (Centenary / Stanbic)', category: 'ASSET' as const },
      { code: '1020', name: 'MTN Mobile Money Merchant Holding', category: 'ASSET' as const },
      { code: '1030', name: 'Airtel Money Merchant Holding', category: 'ASSET' as const },
      { code: '1050', name: 'Member Loan Portfolio Receivable', category: 'ASSET' as const },
      { code: '1100', name: 'Luwero Commercial Cattle Herd Asset', category: 'ASSET' as const },
      { code: '1120', name: 'Farm Land & Pasture Improvement Asset', category: 'ASSET' as const },

      // 2000 - LIABILITIES
      { code: '2010', name: 'Ordinary Member Savings Deposits', category: 'LIABILITY' as const },
      { code: '2020', name: 'Fixed Term Member Deposits', category: 'LIABILITY' as const },
      { code: '2030', name: 'Unallocated Clearing Deposits', category: 'LIABILITY' as const },

      // 3000 - EQUITY
      { code: '3010', name: 'Member Share Capital (UGX 250,000/share)', category: 'EQUITY' as const },
      { code: '3020', name: 'Agricultural Project Investment Capital', category: 'EQUITY' as const },
      { code: '3030', name: 'Statutory Reserve Fund (10%)', category: 'EQUITY' as const },
      { code: '3040', name: 'Retained Surplus / Dividends Payable', category: 'EQUITY' as const },

      // 4000 - REVENUE
      { code: '4010', name: 'Commercial Dairy Milk Sales Revenue', category: 'REVENUE' as const },
      { code: '4030', name: 'SACCO Member Loan Interest Income', category: 'REVENUE' as const },
      { code: '4040', name: 'Member Registration & Entrance Fees', category: 'REVENUE' as const },

      // 5000 - EXPENSES
      { code: '5010', name: 'Farm Veterinary & Feed Operating Expenses', category: 'EXPENSE' as const },
      { code: '5030', name: 'SACCO Administrative & Audit Expenses', category: 'EXPENSE' as const },
      { code: '5040', name: 'Statutory Taxes & Regulatory Licenses', category: 'EXPENSE' as const },
    ];

    for (const acc of standardAccounts) {
      await this.prisma.account.upsert({
        where: { code: acc.code },
        update: { name: acc.name, category: acc.category },
        create: acc,
      });
    }

    return { message: 'Standard Chart of Accounts successfully initialized.' };
  }
}

