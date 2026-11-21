import { Injectable, ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are the management advisor for Diaspora Connect Farmers SACCO, a Ugandan savings and credit cooperative whose members (many in the diaspora) save monthly, buy shares, borrow, and co-own a dairy farm that sells milk.

You receive a JSON snapshot of the SACCO's live data: members and KYC status, savings and shares, the loan book, income by source (savings, share purchases, milk sales, loan repayments), expenses by category, cash positions, herd and milk production, feeds, and pending approvals. All money is in Uganda Shillings (UGX).

Base every statement on the numbers in the snapshot. Quote the figures you rely on. If something the user asks about is not in the snapshot, say so plainly instead of guessing. Write for a SACCO administrator, not an accountant: short paragraphs, plain words, and concrete actions someone can take this week. Use standard SACCO prudential guides where useful (portfolio at risk under 5%, liquidity enough to meet withdrawals, expenses well below income) and say when you are applying one.`;

@Injectable()
export class AiService {
  private client: Anthropic | null = null;

  private getClient(): Anthropic {
    if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
      throw new ServiceUnavailableException('AI advisor is not configured (set ANTHROPIC_API_KEY on the server).');
    }
    if (!this.client) this.client = new Anthropic();
    return this.client;
  }

  async advise(mode: 'report' | 'question', snapshot: unknown, question?: string): Promise<{ answer: string; model: string }> {
    if (!snapshot || typeof snapshot !== 'object') throw new BadRequestException('snapshot is required');
    if (mode === 'question' && !question?.trim()) throw new BadRequestException('question is required');

    const task =
      mode === 'report'
        ? `Write a management report on everything going on in the SACCO. Structure it as:
1. Overall picture (3–4 sentences).
2. What is going well.
3. Risks and problems, most serious first.
4. Recommended improvements — a numbered list, each with the action, who should do it (Admin, Accountant, Secretary, Farm Manager or Board) and the expected effect.
Keep it under 600 words.`
        : `Answer this question from the administrator, using the snapshot: ${question!.trim()}
If an improvement would help, end with up to three concrete recommended actions.`;

    const client = this.getClient();
    const response = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `<sacco_snapshot>\n${JSON.stringify(snapshot, null, 2)}\n</sacco_snapshot>\n\n${task}`,
        },
      ],
    } as any);

    if (response.stop_reason === 'refusal') {
      throw new ServiceUnavailableException('The AI advisor declined this request.');
    }
    const answer = response.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n')
      .trim();
    if (!answer) throw new ServiceUnavailableException('The AI advisor returned an empty response.');
    return { answer, model: response.model };
  }
}
