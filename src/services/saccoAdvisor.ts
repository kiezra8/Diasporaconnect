// Diaspora Connect — SACCO AI Advisor
// Builds a data snapshot from the shared store and produces a management report.
// The built-in analysis always works offline; when the backend AI endpoint is reachable
// the advisor also asks Claude for a narrative grounded in the same snapshot.

import { SaccoFarmStore, classifyIncome, INCOME_SOURCES, IncomeSource, MONTH_KEYS } from './saccoFarmStore';

export interface SaccoSnapshot {
  generatedAt: string;
  members: {
    total: number; active: number; pending: number; suspended: number;
    kycVerified: number; kycPending: number; kycMissing: number;
    noContributionThisMonth: number; noContributionNames: string[];
  };
  savings: { total: number; average: number; topMemberSharePct: number; topMemberName: string; thisMonth: number; lastMonth: number };
  shares: { totalShares: number; totalValue: number; parValue: number; shareholders: number; belowFourShares: number };
  loans: {
    activeCount: number; outstanding: number; defaultedCount: number; defaultedBalance: number;
    overdueCount: number; overdueBalance: number; overdueNames: string[]; pendingCount: number;
    parPct: number; loanToSavingsPct: number;
  };
  finance: {
    incomeAllTime: number; expenseAllTime: number; netAllTime: number;
    incomeThisMonth: number; expenseThisMonth: number;
    incomeBySource: Record<IncomeSource, number>;
    topExpenses: Array<{ category: string; amount: number }>;
    expenseRatioPct: number; bank: number; pettyCash: number;
    unbankedCount: number; unbankedAmount: number;
  };
  farm: {
    herd: number; milking: number; sick: number; pregnant: number; withCalf: number;
    milkLast7: number; milkPrev7: number; milkTrendPct: number; litresPerMilkingCowDay: number;
    milkRevenueThisMonth: number; feedSpendAllTime: number; vetSpendAllTime: number;
    feedCostToMilkRevenuePct: number; lowFeeds: string[];
  };
  approvals: { paymentRequestsPending: number; shareConversionsPending: number; memberApplicationsPending: number };
}

export type Severity = 'good' | 'watch' | 'critical';

export interface AdvisorSection { area: string; score: number; severity: Severity; findings: string[] }
export interface AdvisorRecommendation { priority: 'High' | 'Medium' | 'Low'; area: string; action: string; why: string }
export interface AdvisorReport { headline: string; healthScore: number; sections: AdvisorSection[]; recommendations: AdvisorRecommendation[] }

const ugx = (n: number) => `UGX ${Math.round(n).toLocaleString()}`;
const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
const iso = (d: Date) => d.toISOString().split('T')[0];

export function buildSaccoSnapshot(): SaccoSnapshot {
  const members = SaccoFarmStore.getMembers();
  const loans = SaccoFarmStore.getLoans();
  const txs = SaccoFarmStore.getTransactions();
  const cattle = SaccoFarmStore.getCattle();
  const milk = SaccoFarmStore.getMilkLogs();
  const feeds = SaccoFarmStore.getFeedInventory();
  const fin = SaccoFarmStore.getFinancials();
  const kyc = SaccoFarmStore.getKycSubmissions();
  const par = SaccoFarmStore.getShareParValue();

  const now = new Date();
  const todayStr = iso(now);
  const monthKey = MONTH_KEYS[now.getMonth()];
  const prevMonthKey = MONTH_KEYS[(now.getMonth() + 11) % 12];
  const ym = todayStr.slice(0, 7);

  // KYC — latest submission per member
  const latestKyc = new Map<string, string>();
  kyc.forEach(k => { if (!latestKyc.has(k.memberId)) latestKyc.set(k.memberId, k.status); });
  const kycVerified = members.filter(m => latestKyc.get(m.memberId) === 'VERIFIED').length;
  const kycPending = members.filter(m => latestKyc.get(m.memberId) === 'PENDING').length;

  const activeMembers = members.filter(m => m.status === 'ACTIVE');
  const noContribution = activeMembers.filter(m => !(Number(m[monthKey]) > 0));
  const totalSavings = members.reduce((s, m) => s + (m.savings || 0), 0);
  const top = [...members].sort((a, b) => b.savings - a.savings)[0];

  const active = loans.filter(l => l.status === 'ACTIVE');
  const defaulted = loans.filter(l => l.status === 'DEFAULTED');
  const overdue = active.filter(l => /^\d{4}-\d{2}-\d{2}$/.test(l.nextDueDate) && l.nextDueDate < todayStr);
  const outstanding = active.reduce((s, l) => s + l.outstandingBalance, 0) + defaulted.reduce((s, l) => s + l.outstandingBalance, 0);
  const atRisk = defaulted.reduce((s, l) => s + l.outstandingBalance, 0) + overdue.reduce((s, l) => s + l.outstandingBalance, 0);

  const income = txs.filter(t => t.type === 'Income');
  const expense = txs.filter(t => t.type === 'Expense');
  const incomeBySource = {} as Record<IncomeSource, number>;
  INCOME_SOURCES.forEach(s => (incomeBySource[s] = 0));
  income.forEach(t => (incomeBySource[classifyIncome(t)] += t.amount));
  const expMap = new Map<string, number>();
  expense.forEach(t => expMap.set(t.category, (expMap.get(t.category) || 0) + t.amount));
  const incomeAll = income.reduce((s, t) => s + t.amount, 0);
  const expenseAll = expense.reduce((s, t) => s + t.amount, 0);
  const unbanked = txs.filter(t => !t.isBanked && t.type === 'Income');

  const d7 = iso(new Date(now.getTime() - 7 * 86400000));
  const d14 = iso(new Date(now.getTime() - 14 * 86400000));
  const litres = (l: typeof milk[number]) => l.morning + l.afternoon + l.evening;
  const milkLast7 = milk.filter(l => l.date > d7 && l.date <= todayStr).reduce((s, l) => s + litres(l), 0);
  const milkPrev7 = milk.filter(l => l.date > d14 && l.date <= d7).reduce((s, l) => s + litres(l), 0);
  const milkingCows = cattle.filter(c => c.stage === 'Milking').length;
  const daysWithMilk = new Set(milk.filter(l => l.date > d7 && l.date <= todayStr).map(l => l.date)).size || 1;
  const feedSpend = expense.filter(t => /feed|silage|nutrition|hay/i.test(t.category)).reduce((s, t) => s + t.amount, 0);
  const vetSpend = expense.filter(t => /vet|med|drug|treat/i.test(t.category)).reduce((s, t) => s + t.amount, 0);
  const milkIncome = incomeBySource['Milk Sales (Farm)'];

  let apps: any[] = [];
  try { apps = JSON.parse(localStorage.getItem('dc_member_registrations') || '[]'); } catch {}

  return {
    generatedAt: now.toLocaleString(),
    members: {
      total: members.length,
      active: activeMembers.length,
      pending: members.filter(m => m.status === 'PENDING').length,
      suspended: members.filter(m => m.status === 'SUSPENDED').length,
      kycVerified, kycPending, kycMissing: members.length - kycVerified - kycPending,
      noContributionThisMonth: noContribution.length,
      noContributionNames: noContribution.slice(0, 8).map(m => m.name),
    },
    savings: {
      total: totalSavings,
      average: members.length ? totalSavings / members.length : 0,
      topMemberSharePct: top ? pct(top.savings, totalSavings) : 0,
      topMemberName: top?.name || '—',
      thisMonth: members.reduce((s, m) => s + (Number(m[monthKey]) || 0), 0),
      lastMonth: members.reduce((s, m) => s + (Number(m[prevMonthKey]) || 0), 0),
    },
    shares: {
      totalShares: fin.totalShares, totalValue: fin.totalSharesValue, parValue: par,
      shareholders: members.filter(m => m.shares > 0).length,
      belowFourShares: activeMembers.filter(m => m.shares < 4).length,
    },
    loans: {
      activeCount: active.length, outstanding,
      defaultedCount: defaulted.length, defaultedBalance: defaulted.reduce((s, l) => s + l.outstandingBalance, 0),
      overdueCount: overdue.length, overdueBalance: overdue.reduce((s, l) => s + l.outstandingBalance, 0),
      overdueNames: overdue.map(l => `${l.memberName} (${l.loanNumber})`),
      pendingCount: loans.filter(l => l.status === 'PENDING_APPROVAL').length,
      parPct: pct(atRisk, outstanding),
      loanToSavingsPct: pct(outstanding, totalSavings),
    },
    finance: {
      incomeAllTime: incomeAll, expenseAllTime: expenseAll, netAllTime: incomeAll - expenseAll,
      incomeThisMonth: income.filter(t => t.date.startsWith(ym)).reduce((s, t) => s + t.amount, 0),
      expenseThisMonth: expense.filter(t => t.date.startsWith(ym)).reduce((s, t) => s + t.amount, 0),
      incomeBySource,
      topExpenses: Array.from(expMap.entries()).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount).slice(0, 6),
      expenseRatioPct: pct(expenseAll, incomeAll),
      bank: fin.moneyInBank, pettyCash: fin.pettyCash,
      unbankedCount: unbanked.length, unbankedAmount: unbanked.reduce((s, t) => s + t.amount, 0),
    },
    farm: {
      herd: cattle.length, milking: milkingCows,
      sick: cattle.filter(c => c.status.includes('Sick')).length,
      pregnant: cattle.filter(c => c.status.includes('Pregnant') || c.stage === 'Pregnant').length,
      withCalf: cattle.filter(c => c.hasCalf).length,
      milkLast7, milkPrev7, milkTrendPct: milkPrev7 > 0 ? pct(milkLast7 - milkPrev7, milkPrev7) : 0,
      litresPerMilkingCowDay: milkingCows ? milkLast7 / daysWithMilk / milkingCows : 0,
      milkRevenueThisMonth: milk.filter(l => l.date.startsWith(ym)).reduce((s, l) => s + l.revenue, 0),
      feedSpendAllTime: feedSpend, vetSpendAllTime: vetSpend,
      feedCostToMilkRevenuePct: pct(feedSpend, milkIncome),
      lowFeeds: feeds.filter(f => f.minStock > 0 && f.currentStock <= f.minStock).map(f => `${f.feedType} (${f.currentStock} ${f.unit})`),
    },
    approvals: {
      paymentRequestsPending: SaccoFarmStore.getPaymentRequests().filter(r => r.status === 'PENDING_VERIFICATION' || r.status === 'VERIFIED_AWAITING_ADMIN').length,
      shareConversionsPending: SaccoFarmStore.getShareConversionRequests().filter(r => r.status === 'PENDING').length,
      memberApplicationsPending: apps.filter(a => a.status === 'PENDING_APPROVAL').length,
    },
  };
}

const sev = (score: number): Severity => (score >= 75 ? 'good' : score >= 50 ? 'watch' : 'critical');
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function generateLocalReport(s: SaccoSnapshot): AdvisorReport {
  const recs: AdvisorRecommendation[] = [];
  const sections: AdvisorSection[] = [];

  // Members & compliance
  {
    let score = 100;
    const f: string[] = [];
    f.push(`${s.members.active} of ${s.members.total} members are active (${s.members.pending} pending, ${s.members.suspended} suspended).`);
    f.push(`KYC: ${s.members.kycVerified} verified, ${s.members.kycPending} awaiting review, ${s.members.kycMissing} not yet submitted.`);
    const kycCover = pct(s.members.kycVerified, s.members.total);
    score -= (100 - kycCover) * 0.4;
    if (s.members.kycMissing > 0) recs.push({ priority: kycCover < 50 ? 'High' : 'Medium', area: 'Compliance', action: `Ask the ${s.members.kycMissing} member(s) without KYC to complete "Verify My Identity" in the Member Portal, and hold withdrawals/loans until they do.`, why: `Only ${kycCover.toFixed(0)}% of members are KYC-verified; unverified accounts are a regulatory and fraud risk.` });
    if (s.members.kycPending > 0) recs.push({ priority: 'Medium', area: 'Compliance', action: `Review the ${s.members.kycPending} pending KYC submission(s) in Approvals.`, why: 'Members are waiting on verification to transact.' });
    if (s.members.noContributionThisMonth > 0) {
      score -= pct(s.members.noContributionThisMonth, s.members.active || 1) * 0.3;
      f.push(`${s.members.noContributionThisMonth} active member(s) have not saved this month${s.members.noContributionNames.length ? `: ${s.members.noContributionNames.join(', ')}` : ''}.`);
      recs.push({ priority: 'Medium', area: 'Member engagement', action: `Send savings reminders to the ${s.members.noContributionThisMonth} member(s) with no deposit this month; consider standing orders via mobile money.`, why: 'Regular monthly savings are the SACCO’s main funding source.' });
    }
    sections.push({ area: 'Members & KYC', score: clamp(score), severity: sev(score), findings: f });
  }

  // Savings & shares
  {
    let score = 100;
    const f: string[] = [];
    f.push(`Pooled savings ${ugx(s.savings.total)} (average ${ugx(s.savings.average)} per member).`);
    const trend = s.savings.lastMonth > 0 ? pct(s.savings.thisMonth - s.savings.lastMonth, s.savings.lastMonth) : 0;
    f.push(`Savings this month ${ugx(s.savings.thisMonth)} vs last month ${ugx(s.savings.lastMonth)}${s.savings.lastMonth ? ` (${trend >= 0 ? '+' : ''}${trend.toFixed(0)}%)` : ''}.`);
    if (trend < -20) { score -= 25; recs.push({ priority: 'High', area: 'Savings', action: 'Investigate the drop in monthly savings and run a savings drive (e.g. matched contribution or recognition for consistent savers).', why: `Savings are down ${Math.abs(trend).toFixed(0)}% month on month.` }); }
    if (s.savings.topMemberSharePct > 35) { score -= 20; f.push(`Concentration risk: ${s.savings.topMemberName} holds ${s.savings.topMemberSharePct.toFixed(0)}% of all savings.`); recs.push({ priority: 'Medium', area: 'Liquidity', action: 'Keep a liquidity reserve covering the largest saver’s balance and grow the member base to reduce concentration.', why: `One member holds ${s.savings.topMemberSharePct.toFixed(0)}% of savings; a single large withdrawal could strain cash.` }); }
    f.push(`Share capital ${ugx(s.shares.totalValue)} — ${s.shares.totalShares} shares at ${ugx(s.shares.parValue)} held by ${s.shares.shareholders} members.`);
    if (s.shares.belowFourShares > 0) { score -= 10; recs.push({ priority: 'Low', area: 'Share capital', action: `Encourage the ${s.shares.belowFourShares} active member(s) holding fewer than 4 shares to top up (savings-to-shares conversion is available in the Member Portal).`, why: 'More share capital strengthens the SACCO’s institutional capital and lending capacity.' }); }
    sections.push({ area: 'Savings & Shares', score: clamp(score), severity: sev(score), findings: f });
  }

  // Loans
  {
    let score = 100;
    const f: string[] = [];
    f.push(`${s.loans.activeCount} active loan(s), outstanding ${ugx(s.loans.outstanding)}; ${s.loans.pendingCount} awaiting approval.`);
    f.push(`Portfolio at risk (defaulted + overdue): ${s.loans.parPct.toFixed(1)}%.`);
    f.push(`Loans equal ${s.loans.loanToSavingsPct.toFixed(0)}% of member savings.`);
    if (s.loans.parPct > 5) { score -= Math.min(50, s.loans.parPct * 3); recs.push({ priority: 'High', area: 'Credit risk', action: `Start recovery on overdue/defaulted loans${s.loans.overdueNames.length ? ` (${s.loans.overdueNames.slice(0, 4).join(', ')})` : ''}: call the borrower and guarantor, agree a repayment plan, and stop new lending to those members.`, why: `PAR is ${s.loans.parPct.toFixed(1)}%, above the 5% prudential guide.` }); }
    if (s.loans.defaultedCount > 0) f.push(`${s.loans.defaultedCount} defaulted loan(s) with ${ugx(s.loans.defaultedBalance)} outstanding.`);
    if (s.loans.loanToSavingsPct > 80) { score -= 20; recs.push({ priority: 'Medium', area: 'Liquidity', action: 'Slow new loan approvals until savings grow, or cap individual loans at a multiple of the member’s savings.', why: `Lending is ${s.loans.loanToSavingsPct.toFixed(0)}% of savings, leaving thin cash for withdrawals.` }); }
    if (s.loans.pendingCount > 0) recs.push({ priority: 'Low', area: 'Loans', action: `Decide the ${s.loans.pendingCount} pending loan application(s).`, why: 'Long waits push members to informal lenders.' });
    sections.push({ area: 'Loans & Credit', score: clamp(score), severity: sev(score), findings: f });
  }

  // Finance
  {
    let score = 100;
    const f: string[] = [];
    f.push(`All-time income ${ugx(s.finance.incomeAllTime)}, expenses ${ugx(s.finance.expenseAllTime)}, net ${ugx(s.finance.netAllTime)}.`);
    f.push(`Income mix — savings ${ugx(s.finance.incomeBySource['Savings'])}, share purchases ${ugx(s.finance.incomeBySource['Share Purchases'])}, milk ${ugx(s.finance.incomeBySource['Milk Sales (Farm)'])}, loan repayments ${ugx(s.finance.incomeBySource['Loan Repayments'])}.`);
    if (s.finance.topExpenses.length) f.push(`Largest costs: ${s.finance.topExpenses.slice(0, 3).map(e => `${e.category} ${ugx(e.amount)}`).join('; ')}.`);
    if (s.finance.expenseRatioPct > 80) { score -= 30; recs.push({ priority: 'High', area: 'Cost control', action: `Review the top cost lines (${s.finance.topExpenses.slice(0, 2).map(e => e.category).join(', ')}) and set a monthly budget per category with Accountant sign-off above a threshold.`, why: `Expenses are ${s.finance.expenseRatioPct.toFixed(0)}% of income.` }); }
    if (s.finance.netAllTime < 0) { score -= 25; f.push('The ledger shows a net deficit.'); }
    if (s.finance.unbankedCount > 0) { score -= 10; f.push(`${s.finance.unbankedCount} income item(s) worth ${ugx(s.finance.unbankedAmount)} are not yet banked.`); recs.push({ priority: 'Medium', area: 'Cash control', action: `Bank the ${ugx(s.finance.unbankedAmount)} held as petty cash / mobile money and reconcile daily.`, why: 'Unbanked cash is the most common source of SACCO losses.' }); }
    if (s.finance.pettyCash < 0) { score -= 15; f.push(`Petty cash shows a negative balance (${ugx(s.finance.pettyCash)}) — some cash payments were recorded without a matching float.`); recs.push({ priority: 'High', area: 'Cash control', action: 'Record a Bank → Petty Cash transfer for the float actually issued, then reconcile petty cash vouchers.', why: 'A negative cash balance means the books do not match physical cash.' }); }
    sections.push({ area: 'Finance & Cash', score: clamp(score), severity: sev(score), findings: f });
  }

  // Farm
  {
    let score = 100;
    const f: string[] = [];
    f.push(`Herd of ${s.farm.herd}: ${s.farm.milking} milking, ${s.farm.pregnant} in-calf, ${s.farm.withCalf} with calf, ${s.farm.sick} sick.`);
    f.push(`Milk last 7 days ${s.farm.milkLast7.toFixed(0)} L vs previous 7 days ${s.farm.milkPrev7.toFixed(0)} L${s.farm.milkPrev7 ? ` (${s.farm.milkTrendPct >= 0 ? '+' : ''}${s.farm.milkTrendPct.toFixed(0)}%)` : ''}.`);
    if (s.farm.litresPerMilkingCowDay > 0) f.push(`Average ${s.farm.litresPerMilkingCowDay.toFixed(1)} L per milking cow per day.`);
    if (s.farm.milkTrendPct < -10) { score -= 25; recs.push({ priority: 'High', area: 'Dairy', action: 'Check feeding, water and udder health for the milking herd — compare per-cow records to find the cows whose yield fell.', why: `Milk output fell ${Math.abs(s.farm.milkTrendPct).toFixed(0)}% week on week.` }); }
    if (s.farm.litresPerMilkingCowDay > 0 && s.farm.litresPerMilkingCowDay < 12) { score -= 15; recs.push({ priority: 'Medium', area: 'Dairy', action: 'Improve ration quality (silage + dairy meal per litre produced) and review breeding of low-yield cows.', why: `Yield of ${s.farm.litresPerMilkingCowDay.toFixed(1)} L/cow/day is low for Friesian crosses.` }); }
    if (s.farm.sick > 0) { score -= Math.min(30, pct(s.farm.sick, s.farm.herd) * 2); recs.push({ priority: s.farm.sick > 1 ? 'High' : 'Medium', area: 'Herd health', action: `Follow up treatment of the ${s.farm.sick} sick animal(s) and discard milk from cows on antibiotics.`, why: 'Sick cows lose yield and can spread disease to the herd.' }); }
    if (s.farm.feedCostToMilkRevenuePct > 60) { score -= 20; recs.push({ priority: 'Medium', area: 'Farm costs', action: 'Grow more farm-made silage/hay and buy concentrates in bulk to cut the feed bill.', why: `Feed spending equals ${s.farm.feedCostToMilkRevenuePct.toFixed(0)}% of milk revenue.` }); }
    if (s.farm.lowFeeds.length) { score -= 10; f.push(`Feeds at or below minimum stock: ${s.farm.lowFeeds.join(', ')}.`); recs.push({ priority: 'Medium', area: 'Feeds', action: `Re-stock ${s.farm.lowFeeds.join(', ')} this week.`, why: 'Running out of feed immediately cuts milk output.' }); }
    sections.push({ area: 'Farm & Dairy', score: clamp(score), severity: sev(score), findings: f });
  }

  // Operations / approvals
  {
    const pending = s.approvals.paymentRequestsPending + s.approvals.shareConversionsPending + s.approvals.memberApplicationsPending;
    const score = clamp(100 - pending * 8);
    sections.push({ area: 'Approvals & Operations', score, severity: sev(score), findings: [
      `${s.approvals.paymentRequestsPending} member payment request(s), ${s.approvals.shareConversionsPending} share conversion(s) and ${s.approvals.memberApplicationsPending} membership application(s) are waiting.`,
    ] });
    if (pending > 0) recs.push({ priority: pending > 5 ? 'High' : 'Low', area: 'Operations', action: 'Clear the approvals queue — members only see deposits and shares on their account after approval.', why: `${pending} item(s) are waiting.` });
  }

  const order = { High: 0, Medium: 1, Low: 2 } as const;
  recs.sort((a, b) => order[a.priority] - order[b.priority]);
  const healthScore = clamp(sections.reduce((t, x) => t + x.score, 0) / sections.length);
  const worst = [...sections].sort((a, b) => a.score - b.score)[0];
  const headline = `Overall SACCO health ${healthScore}/100. Strongest area: ${[...sections].sort((a, b) => b.score - a.score)[0].area}. Needs most attention: ${worst.area} (${worst.score}/100). ${recs.filter(r => r.priority === 'High').length} high-priority action(s).`;
  return { headline, healthScore, sections, recommendations: recs };
}

const REC_AREAS: Record<string, string[]> = {
  'Members & KYC': ['Compliance', 'Member engagement'],
  'Savings & Shares': ['Savings', 'Liquidity', 'Share capital'],
  'Loans & Credit': ['Credit risk', 'Liquidity', 'Loans'],
  'Finance & Cash': ['Cost control', 'Cash control'],
  'Farm & Dairy': ['Dairy', 'Herd health', 'Farm costs', 'Feeds'],
  'Approvals & Operations': ['Operations'],
};

/** Offline answer to a free-text question, routed to the relevant part of the analysis. */
export function answerLocally(question: string, s: SaccoSnapshot, r: AdvisorReport): string {
  const q = question.toLowerCase();
  const pick = (re: RegExp, area: string) => (re.test(q) ? r.sections.find(x => x.area === area) : undefined);
  const sec =
    pick(/loan|credit|default|overdue|borrow/, 'Loans & Credit') ||
    pick(/milk|cow|dairy|herd|farm|feed|calf|sick|vet/, 'Farm & Dairy') ||
    pick(/share|saving|deposit|withdraw/, 'Savings & Shares') ||
    pick(/kyc|member|identity|verify|compliance/, 'Members & KYC') ||
    pick(/income|expense|cost|cash|bank|profit|surplus|money/, 'Finance & Cash') ||
    pick(/approv|pending|queue/, 'Approvals & Operations');
  if (!sec) {
    return `${r.headline}\n\nTop actions:\n${r.recommendations.slice(0, 4).map((x, i) => `${i + 1}. [${x.priority}] ${x.action}`).join('\n')}`;
  }
  const related = r.recommendations.filter(x => (REC_AREAS[sec.area] || []).includes(x.area));
  return `${sec.area} — ${sec.score}/100 (${sec.severity}).\n\n${sec.findings.map(x => `• ${x}`).join('\n')}${related.length ? `\n\nWhat to do:\n${related.slice(0, 3).map((x, i) => `${i + 1}. ${x.action} — ${x.why}`).join('\n')}` : ''}`;
}
