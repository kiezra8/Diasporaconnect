import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Search approved knowledge base documents (RAG grounded assistant).
   * STRICT PRINCIPLE: Only answer from approved policies; never hallucinate financial balances or unauthorized rules.
   */
  async answerQuery(queryText: string, memberUserId?: string) {
    const q = queryText.toLowerCase().trim();

    // Query approved knowledge base articles
    const articles = await this.prisma.knowledgeBaseArticle.findMany({
      where: { isPublished: true },
    });

    // Score and rank matching policy documents
    const matched = articles.filter((art) => {
      const inTitle = art.title.toLowerCase().includes(q);
      const inContent = art.content.toLowerCase().includes(q);
      const inTags = art.tags.some((t) => t.toLowerCase().includes(q) || q.includes(t.toLowerCase()));
      return inTitle || inContent || inTags;
    });

    if (matched.length > 0) {
      return {
        isGrounded: true,
        answer: matched[0].content,
        sourceArticle: matched[0].title,
        category: matched[0].category,
        confidence: 'HIGH',
      };
    }

    // If query asks for personal balances, ensure authentication & retrieve real statement only
    if (memberUserId && (q.includes('balance') || q.includes('my shares') || q.includes('my savings'))) {
      const member = await this.prisma.memberProfile.findUnique({
        where: { userId: memberUserId },
        include: {
          savingsAccounts: true,
          shareHoldings: true,
        },
      });

      if (member) {
        const bal = member.savingsAccounts[0] ? Number(member.savingsAccounts[0].balanceUGX) : 0;
        const shares = member.shareHoldings.reduce((s, h) => s + h.sharesCount, 0);
        return {
          isGrounded: true,
          answer: `Your verified Diaspora Connect account records show an available savings balance of UGX ${bal.toLocaleString()} and a total of ${shares} active shares.`,
          sourceArticle: 'Audited Member Ledger',
          confidence: 'VERIFIED_RECORD',
        };
      }
    }

    // Fallback: Do not guess or hallucinate; recommend submitting a ticket
    return {
      isGrounded: false,
      answer: "I could not find an approved cooperative policy matching your inquiry. To ensure accurate assistance, I have routed this to our member support desk. Would you like me to submit an official support ticket for you?",
      sourceArticle: null,
      confidence: 'UNRESOLVED_ESCALATE',
    };
  }

  /**
   * Create an official support ticket
   */
  async createTicket(memberUserId: string, data: {
    subject: string;
    category: string;
    initialMessage: string;
    priority?: any;
  }) {
    const member = await this.prisma.memberProfile.findUnique({
      where: { userId: memberUserId },
    });

    if (!member) throw new NotFoundException('Member profile not found.');

    const count = await this.prisma.supportTicket.count();
    const ticketNumber = `TKT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        memberId: member.id,
        subject: data.subject,
        category: data.category,
        priority: data.priority || 'MEDIUM',
        status: 'OPEN',
        messages: {
          create: {
            senderId: memberUserId,
            message: data.initialMessage,
          },
        },
      },
      include: { messages: true },
    });
  }

  /**
   * Seed Official Diaspora Connect Knowledge Base Policies
   */
  async seedKnowledgeBase() {
    const defaultArticles = [
      {
        title: 'Membership Eligibility & Registration Process',
        category: 'SACCO Policies',
        tags: ['membership', 'registration', 'join', 'eligibility', 'nin', 'passport'],
        content: 'Any Ugandan residing in the diaspora or at home with valid national identification (NIN or Passport) is eligible. Registration requires submitting proof of residence, selecting an initial savings plan, and obtaining at least 1 ordinary share. All memberships undergo Secretary compliance verification.',
      },
      {
        title: 'Share Capital & Ownership Policies',
        category: 'Shares',
        tags: ['shares', 'share price', 'dividends', 'nominal value', 'equity'],
        content: 'Diaspora Connect ordinary shares have a nominal value of UGX 250,000 per share. Shares confer democratic voting rights in the Annual General Meeting and represent equity ownership. Dividends are declared annually from verified net operating surpluses (commercial dairy operations and loan interest) after statutory reserve deductions.',
      },
      {
        title: 'Commercial Dairy Cattle Investment ("Money Maker")',
        category: 'Dairy Cattle Terms',
        tags: ['cows', 'cattle', 'dairy', 'money maker', 'returns', 'investment'],
        content: 'The Money Maker cattle investment unit represents co-ownership of pedigree dairy cows (Friesian and Fleckvieh crosses) managed on our Luwero farm. Each 8,000,000 UGX unit funds 2 cows under veterinary supervision and bulk milk sales to off-takers like Brookside Dairy Uganda. Returns depend on actual milk yields and market off-take prices; past performance is not a guarantee of future returns.',
      },
      {
        title: 'Deposit Verification & Official Payment Channels',
        category: 'Deposit Instructions',
        tags: ['deposit', 'pay', 'mtn', 'airtel', 'bank', 'payment'],
        content: 'Deposits can be executed via MTN Mobile Money, Airtel Money merchant codes, or direct bank transfer to our official co-operative accounts. Submitting a deposit request in the portal requires an external payment reference and receipt upload. Funds are verified by the Accountant and authorized by the Admin before being credited to your ledger.',
      },
      {
        title: 'Savings Withdrawal Procedure & Dual Control',
        category: 'Withdrawal Instructions',
        tags: ['withdraw', 'withdrawal', 'payout', 'timeline'],
        content: 'Members may submit withdrawal requests for unencumbered savings directly through their portal dashboard. To prevent fraud, withdrawals undergo strict dual control: the Accountant verifies payout instructions and available ledger balance, and the Admin grants final authorization before funds are dispatched.',
      },
    ];

    for (const art of defaultArticles) {
      await this.prisma.knowledgeBaseArticle.upsert({
        where: { id: art.title }, // will create or update
        update: art,
        create: art,
      });
    }

    return { message: 'Knowledge base articles seeded successfully.' };
  }
}

