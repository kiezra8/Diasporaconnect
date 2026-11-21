import React, { useEffect, useMemo, useState } from 'react';
import {
  SaccoFarmStore,
  PettyCashTransaction,
  classifyIncome,
  INCOME_SOURCES,
  IncomeSource,
  toLedgerLines,
  buildTrialBalance,
  MONTH_KEYS,
  MonthKey,
} from '../../services/saccoFarmStore';
import ReportBarChart, { formatValue } from '../charts/ReportBarChart';
import { htmlBarChart, PRINT_CHART_CSS } from '../charts/printBarChart';

export type AccountingSection = 'summary' | 'income' | 'expenses' | 'journal' | 'ledger' | 'report';

interface Props {
  sections?: AccountingSection[];
  actorName: string;
  canPost?: boolean;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

type Period = 'day' | 'week' | 'month' | 'year' | 'all';

export const CHART_OF_ACCOUNTS = [
  '1001 — Cash at Bank',
  '1010 — Petty Cash / Mobile Money Float',
  '1200 — Loans Receivable',
  '1300 — Farm Assets (Cattle & Equipment)',
  '1400 — Feed & Farm Inventory',
  '2001 — Accounts Payable',
  '2100 — Accrued Expenses',
  '3010 — Member Savings',
  '3020 — Share Capital',
  '3030 — Welfare Fund',
  '3100 — Retained Surplus',
  '4010 — Milk Sales Revenue',
  '4020 — Loan Interest Income',
  '4090 — Other Income',
  '5000 — Operating Expenses',
  '5100 — Staff Salaries & Allowances',
  '5200 — Veterinary Costs',
  '5300 — Feeds & Nutrition',
  '5400 — Depreciation',
];

const MAIN_SOURCES: IncomeSource[] = ['Savings', 'Share Purchases', 'Milk Sales (Farm)'];
const inputCls = 'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500';
const labelCls = 'block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1';
const cardCls = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5';
const thCls = 'text-left text-slate-800 dark:text-slate-300 font-bold uppercase text-[11px] py-2 px-3';
const today = () => new Date().toISOString().split('T')[0];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };

/** Inclusive [start, end] ISO dates for the period containing the anchor date. Weeks run Monday–Sunday. */
function periodRange(p: Period, anchor: string): [string, string] {
  const a = parse(anchor);
  if (p === 'day') return [anchor, anchor];
  if (p === 'week') {
    const start = new Date(a); start.setDate(a.getDate() - ((a.getDay() + 6) % 7));
    const end = new Date(start); end.setDate(start.getDate() + 6);
    return [iso(start), iso(end)];
  }
  if (p === 'month') return [iso(new Date(a.getFullYear(), a.getMonth(), 1)), iso(new Date(a.getFullYear(), a.getMonth() + 1, 0))];
  if (p === 'year') return [`${a.getFullYear()}-01-01`, `${a.getFullYear()}-12-31`];
  return ['0000-01-01', '9999-12-31'];
}

function shiftAnchor(p: Period, anchor: string, dir: 1 | -1): string {
  const a = parse(anchor);
  if (p === 'day') a.setDate(a.getDate() + dir);
  else if (p === 'week') a.setDate(a.getDate() + 7 * dir);
  else if (p === 'month') a.setMonth(a.getMonth() + dir, 1);
  else if (p === 'year') a.setFullYear(a.getFullYear() + dir);
  return iso(a);
}

function periodLabel(p: Period, anchor: string): string {
  const [s, e] = periodRange(p, anchor);
  const fmt = (x: string, o: Intl.DateTimeFormatOptions) => parse(x).toLocaleDateString('en-GB', o);
  if (p === 'day') return fmt(s, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  if (p === 'week') return `Week of ${fmt(s, { day: 'numeric', month: 'short' })} – ${fmt(e, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  if (p === 'month') return fmt(s, { month: 'long', year: 'numeric' });
  if (p === 'year') return `Year ${s.slice(0, 4)}`;
  return 'All time';
}

/** Chart buckets: day → the 14 days up to it; week → its 7 days; month → each day; year → each month; all → each month. */
function trendBuckets(p: Period, anchor: string, txs: PettyCashTransaction[]): Array<{ key: string; label: string; match: (d: string) => boolean }> {
  const days = (start: Date, n: number) => Array.from({ length: n }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const k = iso(d);
    return { key: k, label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), match: (x: string) => x === k };
  });
  const a = parse(anchor);
  if (p === 'day') { const s = new Date(a); s.setDate(a.getDate() - 13); return days(s, 14); }
  if (p === 'week') return days(parse(periodRange('week', anchor)[0]), 7);
  if (p === 'month') return days(new Date(a.getFullYear(), a.getMonth(), 1), new Date(a.getFullYear(), a.getMonth() + 1, 0).getDate());
  const months = (y: number, m0: number, n: number) => Array.from({ length: n }, (_, i) => {
    const d = new Date(y, m0 + i, 1);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { key: k, label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }), match: (x: string) => x.startsWith(k) };
  });
  if (p === 'year') return months(a.getFullYear(), 0, 12);
  const first = txs.reduce((m, t) => (t.date < m ? t.date : m), iso(new Date()));
  const f = parse(first);
  const n = Math.min(36, (new Date().getFullYear() - f.getFullYear()) * 12 + new Date().getMonth() - f.getMonth() + 1);
  return months(f.getFullYear(), f.getMonth(), Math.max(1, n));
}

const VIEW_LABELS: Record<Exclude<AccountingSection, 'summary'>, string> = {
  income: 'Income',
  expenses: 'Expenses',
  journal: 'Journal',
  ledger: 'Debit & Credit Ledger',
  report: 'Reports',
};

export default function AccountingWorkspace({ sections = ['summary', 'income', 'expenses', 'journal', 'ledger', 'report'], actorName, canPost = true, onNotify }: Props) {
  const [transactions, setTransactions] = useState<PettyCashTransaction[]>(() => SaccoFarmStore.getTransactions());
  const [period, setPeriod] = useState<Period>('month');
  const [anchor, setAnchor] = useState<string>(today());
  const pages = sections.filter(s => s !== 'summary') as Array<Exclude<AccountingSection, 'summary'>>;
  const [view, setView] = useState<Exclude<AccountingSection, 'summary'>>(pages[0] || 'income');
  const [members, setMembers] = useState(() => SaccoFarmStore.getMembers());
  const canIncome = canPost && SaccoFarmStore.canPerform('record_income');
  const canExpense = canPost && SaccoFarmStore.canPerform('record_expenses');
  const canJournal = canPost && SaccoFarmStore.canPerform('post_journals');

  useEffect(() => {
    const reload = () => { setTransactions(SaccoFarmStore.getTransactions()); setMembers(SaccoFarmStore.getMembers()); };
    window.addEventListener('dc_storage_update', reload);
    return () => window.removeEventListener('dc_storage_update', reload);
  }, []);

  const notify = (m: string, t: 'success' | 'error' = 'success') => (onNotify ? onNotify(m, t) : alert(m));
  // one page at a time when there are several; 'summary' always sits above the page switcher
  const show = (s: AccountingSection) => s === 'summary' ? sections.includes('summary') : pages.length > 1 ? view === s : sections.includes(s);

  const [rangeStart, rangeEnd] = periodRange(period, anchor);
  const periodTx = useMemo(() => transactions.filter(t => t.date >= rangeStart && t.date <= rangeEnd), [transactions, rangeStart, rangeEnd]);
  const incomeTx = periodTx.filter(t => t.type === 'Income');
  const expenseTx = periodTx.filter(t => t.type === 'Expense');
  const totalIncome = incomeTx.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expenseTx.reduce((s, t) => s + t.amount, 0);
  const fin = SaccoFarmStore.getFinancials();

  const incomeBySource = useMemo(() => {
    const m: Record<IncomeSource, { amount: number; count: number }> = {} as any;
    INCOME_SOURCES.forEach(s => (m[s] = { amount: 0, count: 0 }));
    incomeTx.forEach(t => { const s = classifyIncome(t); m[s].amount += t.amount; m[s].count += 1; });
    return m;
  }, [incomeTx]);

  const expenseByCategory = useMemo(() => {
    const m = new Map<string, number>();
    expenseTx.forEach(t => m.set(t.category, (m.get(t.category) || 0) + t.amount));
    return Array.from(m.entries()).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  }, [expenseTx]);

  // money in by source vs money out, bucketed by day or month depending on the period
  const monthly = useMemo(() => trendBuckets(period, anchor, transactions).map(b => {
    const row: Record<string, any> = { month: b.label, savings: 0, shares: 0, milk: 0, other: 0, income: 0, expenses: 0 };
    transactions.filter(t => b.match(t.date)).forEach(t => {
      if (t.type === 'Income') {
        const s = classifyIncome(t);
        row.income += t.amount;
        if (s === 'Savings') row.savings += t.amount;
        else if (s === 'Share Purchases') row.shares += t.amount;
        else if (s === 'Milk Sales (Farm)') row.milk += t.amount;
        else row.other += t.amount;
      } else if (t.type === 'Expense') row.expenses += t.amount;
    });
    return row;
  }), [transactions, period, anchor]);
  const trendTitle = period === 'year' || period === 'all' ? 'by month' : 'by day';

  // ── Manual income (members who don't use their portal) ─────────────────────
  type ManualType = 'savings' | 'shares' | 'welfare' | 'project' | 'loan_repayment' | 'milk' | 'other';
  const [miType, setMiType] = useState<ManualType>('savings');
  const [miMember, setMiMember] = useState('');
  const [miAmount, setMiAmount] = useState('');
  const [miDate, setMiDate] = useState(today());
  const [miMethod, setMiMethod] = useState('Cash');
  const [miRef, setMiRef] = useState('');
  const [miMonth, setMiMonth] = useState<MonthKey>(MONTH_KEYS[new Date().getMonth()]);
  const [miCategory, setMiCategory] = useState('');
  const [miNotes, setMiNotes] = useState('');
  const memberNeeded = !['milk', 'other'].includes(miType);
  const par = SaccoFarmStore.getShareParValue();

  const handleManualIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canIncome) return notify('You are not assigned to record income. Ask the Admin to assign you in Settings → Task Assignments.', 'error');
    const res = SaccoFarmStore.recordManualIncome({
      type: miType, memberId: memberNeeded ? miMember : undefined, amount: Number(miAmount), date: miDate,
      method: miMethod, reference: miRef.trim() || undefined, month: miType === 'savings' ? miMonth : undefined,
      category: miType === 'other' ? miCategory : undefined, notes: miNotes.trim() || undefined,
    });
    notify(res.msg, res.success ? 'success' : 'error');
    if (res.success) { setMiAmount(''); setMiRef(''); setMiNotes(''); setMiCategory(''); }
  };

  // ── Income drill-down ──────────────────────────────────────────────────────
  const [incomeFilter, setIncomeFilter] = useState<IncomeSource | 'All'>('All');
  const shownIncome = incomeTx.filter(t => incomeFilter === 'All' || classifyIncome(t) === incomeFilter);

  // ── Expense form (category is typed by the user — no suggestions) ───────────
  const [exDate, setExDate] = useState(today());
  const [exCategory, setExCategory] = useState('');
  const [exPayee, setExPayee] = useState('');
  const [exAmount, setExAmount] = useState('');
  const [exSource, setExSource] = useState<'Bank' | 'Petty Cash'>('Bank');
  const [exRef, setExRef] = useState('');
  const [exDesc, setExDesc] = useState('');
  const [exSearch, setExSearch] = useState('');

  const handleRecordExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canExpense) return notify('You are not assigned to record expenses. Ask the Admin to assign you in Settings → Task Assignments.', 'error');
    const amt = Number(exAmount);
    const category = exCategory.trim();
    if (!category) return notify('Type the expense category / type.', 'error');
    if (!amt || amt <= 0) return notify('Enter a valid expense amount.', 'error');
    SaccoFarmStore.addTransaction({
      date: exDate || today(),
      type: 'Expense',
      source: exSource,
      category,
      amount: amt,
      payee: exPayee.trim() || undefined,
      description: `${exDesc.trim() || category}${exPayee.trim() ? ` — Payee: ${exPayee.trim()}` : ''}`,
      reference: exRef.trim() || `EXP-${Date.now().toString().slice(-6)}`,
      isBanked: exSource === 'Bank',
      recordedBy: actorName,
    });
    notify(`Expense "${category}" of UGX ${amt.toLocaleString()} posted (Dr Expense / Cr ${exSource}).`);
    setExCategory(''); setExPayee(''); setExAmount(''); setExRef(''); setExDesc('');
  };

  const shownExpenses = expenseTx.filter(t => {
    const q = exSearch.trim().toLowerCase();
    return !q || `${t.category} ${t.description} ${t.reference} ${t.payee || ''}`.toLowerCase().includes(q);
  });

  // ── Journal (explicit Dr / Cr) ─────────────────────────────────────────────
  const [jDr, setJDr] = useState(CHART_OF_ACCOUNTS[0]);
  const [jCr, setJCr] = useState(CHART_OF_ACCOUNTS[7]);
  const [jAmount, setJAmount] = useState('');
  const [jNarration, setJNarration] = useState('');
  const [jDate, setJDate] = useState(today());

  const handlePostJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canJournal) return notify('You are not assigned to post journal entries. Ask the Admin to assign you in Settings → Task Assignments.', 'error');
    const amt = Number(jAmount);
    if (jDr === jCr) return notify('Debit and credit accounts must be different.', 'error');
    if (!amt || amt <= 0) return notify('Enter a valid amount.', 'error');
    if (!jNarration.trim()) return notify('Enter a narration for the entry.', 'error');
    SaccoFarmStore.addTransaction({
      date: jDate || today(),
      type: 'Journal',
      source: 'Bank',
      debitAccount: jDr,
      creditAccount: jCr,
      category: `Journal: Dr ${jDr} / Cr ${jCr}`,
      amount: amt,
      description: jNarration.trim(),
      reference: `JNL-${Date.now().toString().slice(-6)}`,
      isBanked: true,
      recordedBy: actorName,
    });
    notify(`Journal posted: Dr ${jDr} / Cr ${jCr} — UGX ${amt.toLocaleString()}`);
    setJAmount(''); setJNarration('');
  };

  // ── Debit / credit ledger & trial balance ─────────────────────────────────
  const lines = useMemo(() => toLedgerLines(periodTx), [periodTx]);
  const accounts = useMemo(() => Array.from(new Set(lines.map(l => l.account))).sort(), [lines]);
  const [ledgerAccount, setLedgerAccount] = useState<string>('All');
  const shownLines = ledgerAccount === 'All' ? lines : lines.filter(l => l.account === ledgerAccount);
  const lineDr = shownLines.reduce((s, l) => s + l.debit, 0);
  const lineCr = shownLines.reduce((s, l) => s + l.credit, 0);
  const runningLines = useMemo(() => {
    if (ledgerAccount === 'All') return shownLines.map(l => ({ ...l, running: 0 }));
    let bal = 0;
    return [...shownLines].sort((a, b) => a.date.localeCompare(b.date)).map(l => { bal += l.debit - l.credit; return { ...l, running: bal }; });
  }, [shownLines, ledgerAccount]);
  const tb = useMemo(() => buildTrialBalance(periodTx), [periodTx]);

  const handlePrintReport = () => {
    const f = (n: number) => `UGX ${Math.round(n).toLocaleString()}`;
    const srcRows = INCOME_SOURCES.map(s => ({ label: s, value: incomeBySource[s].amount }));
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Debit &amp; Credit Financial Report — Diaspora Connect</title>
      <style>
        @page { size: A4; margin: 14mm; } * { box-sizing: border-box; }
        body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #0f172a; font-size: 9.5pt; padding: 20px; }
        h1 { font-size: 15pt; margin: 0; } h2 { font-size: 10.5pt; margin: 22px 0 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
        .muted { color: #64748b; font-size: 8.5pt; } .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 14px 0; }
        .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; background: #f8fafc; } .kpi b { display: block; font-family: monospace; font-size: 11pt; }
        table { width: 100%; border-collapse: collapse; font-size: 8.5pt; } th { background: #f1f5f9; text-align: left; padding: 6px 8px; font-size: 7.5pt; text-transform: uppercase; }
        td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; } .r { text-align: right; font-family: monospace; }
        tfoot td { font-weight: 800; border-top: 2px solid #cbd5e1; background: #f8fafc; }
        .ok { color: #047857; font-weight: 800; } .bad { color: #b91c1c; font-weight: 800; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        ${PRINT_CHART_CSS}
      </style></head><body>
      <h1>Diaspora Connect Farmers SACCO — Debit &amp; Credit Financial Report</h1>
      <div class="muted">Period: ${periodLabel(period, anchor)} · Generated ${new Date().toLocaleString()} · Prepared by ${actorName}</div>
      <div class="kpis">
        <div class="kpi">Money in<b>${f(totalIncome)}</b></div>
        <div class="kpi">Money out<b>${f(totalExpense)}</b></div>
        <div class="kpi">Net surplus<b>${f(totalIncome - totalExpense)}</b></div>
        <div class="kpi">Trial balance<b class="${tb.balanced ? 'ok' : 'bad'}">${tb.balanced ? 'BALANCED' : 'OUT OF BALANCE'}</b></div>
      </div>
      <div class="grid2">
        ${htmlBarChart('Income by source', srcRows, f, '#2a78d6')}
        ${htmlBarChart('Expenses by category', expenseByCategory.slice(0, 12).map(e => ({ label: e.category, value: e.amount })), f, '#eb6834')}
      </div>
      ${htmlBarChart('Debit totals by account', tb.rows.map(r => ({ label: r.account, value: r.debit })), f, '#1baf7a')}
      ${htmlBarChart('Credit totals by account', tb.rows.map(r => ({ label: r.account, value: r.credit })), f, '#6250d6')}
      <h2>1. Income statement</h2>
      <table><thead><tr><th>#</th><th>Line</th><th class="r">Amount</th></tr></thead><tbody>${INCOME_SOURCES.map((s, __n) => `<tr><td>${__n + 1}</td><td>Income — ${s} (${incomeBySource[s].count} entries)</td><td class="r">${f(incomeBySource[s].amount)}</td></tr>`).join('')}
        <tr><td></td><td><b>Total income</b></td><td class="r"><b>${f(totalIncome)}</b></td></tr>
        ${expenseByCategory.map(e => `<tr><td></td><td>Expense — ${e.category}</td><td class="r">(${f(e.amount)})</td></tr>`).join('')}
        <tr><td></td><td><b>Total expenses</b></td><td class="r"><b>(${f(totalExpense)})</b></td></tr>
      </tbody><tfoot><tr><td></td><td>Net surplus / (deficit)</td><td class="r">${f(totalIncome - totalExpense)}</td></tr></tfoot></table>
      <h2>2. Trial balance</h2>
      <table><thead><tr><th>#</th><th>Account</th><th class="r">Debit</th><th class="r">Credit</th><th class="r">Balance</th></tr></thead><tbody>${tb.rows.map((r, __n) => `<tr><td>${__n + 1}</td><td>${r.account}</td><td class="r">${r.debit ? f(r.debit) : '—'}</td><td class="r">${r.credit ? f(r.credit) : '—'}</td><td class="r">${f(r.balance)} ${r.side}</td></tr>`).join('')}
      </tbody><tfoot><tr><td></td><td>Totals</td><td class="r">${f(tb.totalDebit)}</td><td class="r">${f(tb.totalCredit)}</td><td class="r ${tb.balanced ? 'ok' : 'bad'}">${tb.balanced ? 'Dr = Cr ✓' : 'Difference ' + f(tb.totalDebit - tb.totalCredit)}</td></tr></tfoot></table>
      <h2>3. General ledger (double entry)</h2>
      <table><thead><tr><th>#</th><th>Date</th><th>Ref</th><th>Account</th><th>Narration</th><th class="r">Debit</th><th class="r">Credit</th></tr></thead><tbody>${lines.map((l, __n) => `<tr><td>${__n + 1}</td><td>${l.date}</td><td>${l.reference}</td><td>${l.account}</td><td>${l.narration}</td><td class="r">${l.debit ? f(l.debit) : ''}</td><td class="r">${l.credit ? f(l.credit) : ''}</td></tr>`).join('')}
      </tbody><tfoot><tr><td></td><td colspan="4">Totals</td><td class="r">${f(lines.reduce((s, l) => s + l.debit, 0))}</td><td class="r">${f(lines.reduce((s, l) => s + l.credit, 0))}</td></tr></tfoot></table>
      <p class="muted" style="margin-top:30px">Prepared by: ____________________ &nbsp;&nbsp; Reviewed by (Supervisory Committee): ____________________</p>
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300); }
  };

  const PeriodPicker = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-bold text-slate-500 uppercase">Track by</span>
      {(['day', 'week', 'month', 'year', 'all'] as Period[]).map(p => (
        <button key={p} type="button" onClick={() => setPeriod(p)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${period === p ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
          {p === 'day' ? 'Day' : p === 'week' ? 'Week' : p === 'month' ? 'Month' : p === 'year' ? 'Year' : 'All Time'}
        </button>
      ))}
      {period !== 'all' && (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setAnchor(shiftAnchor(period, anchor, -1))} className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold" aria-label="Previous period">‹</button>
          <input type="date" value={anchor} onChange={e => e.target.value && setAnchor(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-slate-900 dark:text-white" />
          <button type="button" onClick={() => setAnchor(shiftAnchor(period, anchor, 1))} className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold" aria-label="Next period">›</button>
          <button type="button" onClick={() => setAnchor(today())} className="px-2 py-1.5 rounded-lg text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Today</button>
        </div>
      )}
      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{periodLabel(period, anchor)}</span>
    </div>
  );

  const PageSwitcher = pages.length > 1 ? (
    <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit" role="tablist">
      {pages.map(p => (
        <button key={p} type="button" role="tab" aria-selected={view === p} onClick={() => setView(p)}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${view === p ? (p === 'expenses' ? 'bg-rose-600 text-white shadow' : 'bg-emerald-600 text-white shadow') : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'}`}>
          {VIEW_LABELS[p]}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {PeriodPicker}
        {show('report') && (
          <button onClick={handlePrintReport} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md">
            PRINT DEBIT &amp; CREDIT REPORT (PDF)
          </button>
        )}
      </div>

      {PageSwitcher}

      {/* ── SUMMARY ─────────────────────────────────────────────────────── */}
      {show('summary') && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Money In (Income)', value: totalIncome, cls: 'text-emerald-700 dark:text-emerald-400' },
            { label: 'Money Out (Expenses)', value: totalExpense, cls: 'text-rose-600 dark:text-rose-400' },
            { label: 'Net Surplus', value: totalIncome - totalExpense, cls: totalIncome - totalExpense >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400' },
            { label: 'Cash at Bank', value: fin.moneyInBank, cls: 'text-slate-900 dark:text-white' },
            { label: 'Petty Cash / Float', value: fin.pettyCash, cls: 'text-slate-900 dark:text-white' },
          ].map(k => (
            <div key={k.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{k.label}</span>
              <div className={`text-lg font-extrabold font-mono mt-1 ${k.cls}`}>{formatValue(k.value, 'ugx', true)}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── INCOME BY SOURCE ───────────────────────────────────────────── */}
      {show('income') && (
        <div className="space-y-4">
          <div>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Money In — Income by Source</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Every income entry in the ledger for {periodLabel(period, anchor).toLowerCase()}, grouped by where it came from</p>
          </div>
          {canIncome && (
            <div className={cardCls}>
              <h5 className="text-sm font-bold text-slate-900 dark:text-white">Record Income Received</h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">For members who pay in cash, at the bank or by mobile money without using their portal. Savings and shares go straight onto the member’s account.</p>
              <form onSubmit={handleManualIncome} autoComplete="off" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className={labelCls}>Income Type *</label>
                  <select value={miType} onChange={e => setMiType(e.target.value as ManualType)} className={inputCls}>
                    <option value="savings">Member savings</option>
                    <option value="shares">Share purchase</option>
                    <option value="loan_repayment">Loan repayment</option>
                    <option value="welfare">Welfare / emergency fund</option>
                    <option value="project">Farm project contribution</option>
                    <option value="milk">Milk sales (farm)</option>
                    <option value="other">Other income (type category)</option>
                  </select>
                </div>
                {memberNeeded && (
                  <div>
                    <label className={labelCls}>Member *</label>
                    <select required value={miMember} onChange={e => setMiMember(e.target.value)} className={inputCls}>
                      <option value="">Select member…</option>
                      {members.map(m => <option key={m.id} value={m.memberId}>{m.name} ({m.memberId})</option>)}
                    </select>
                  </div>
                )}
                {miType === 'other' && (
                  <div>
                    <label className={labelCls}>Income Category *</label>
                    <input required autoComplete="off" value={miCategory} onChange={e => setMiCategory(e.target.value)} placeholder="Type the category" className={inputCls} />
                  </div>
                )}
                <div>
                  <label className={labelCls}>Amount (UGX) *</label>
                  <input type="number" required min="1" value={miAmount} onChange={e => setMiAmount(e.target.value)} className={`${inputCls} font-mono font-bold`} />
                  {miType === 'shares' && Number(miAmount) > 0 && <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">= {Math.floor(Number(miAmount) / par)} share(s) at UGX {par.toLocaleString()}</p>}
                </div>
                <div>
                  <label className={labelCls}>Date Received *</label>
                  <input type="date" required value={miDate} max={today()} onChange={e => setMiDate(e.target.value)} className={`${inputCls} font-mono`} />
                </div>
                {miType === 'savings' && (
                  <div>
                    <label className={labelCls}>Savings Month</label>
                    <select value={miMonth} onChange={e => setMiMonth(e.target.value as MonthKey)} className={inputCls}>
                      {MONTH_KEYS.map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className={labelCls}>Received Via *</label>
                  <select value={miMethod} onChange={e => setMiMethod(e.target.value)} className={inputCls}>
                    <option>Cash</option><option>MTN Mobile Money</option><option>Airtel Money</option><option>Bank Deposit</option><option>Bank Wire</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Receipt / Reference No.</label>
                  <input autoComplete="off" value={miRef} onChange={e => setMiRef(e.target.value)} className={`${inputCls} font-mono`} />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className={labelCls}>Notes</label>
                  <input autoComplete="off" value={miNotes} onChange={e => setMiNotes(e.target.value)} className={inputCls} />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg">RECORD INCOME</button>
                </div>
              </form>
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {INCOME_SOURCES.map(s => {
              const main = MAIN_SOURCES.includes(s);
              return (
                <button key={s} type="button" onClick={() => setIncomeFilter(incomeFilter === s ? 'All' : s)}
                  className={`text-left rounded-2xl p-4 border-2 transition ${incomeFilter === s ? 'border-emerald-500' : 'border-slate-200 dark:border-slate-800'} ${main ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-950'}`}>
                  <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">{s}</span>
                  <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white mt-1">{formatValue(incomeBySource[s].amount, 'ugx', true)}</div>
                  <span className="text-[10px] text-slate-500">{incomeBySource[s].count} entries · {totalIncome ? Math.round((incomeBySource[s].amount / totalIncome) * 100) : 0}%</span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ReportBarChart
              title="Income by source"
              subtitle={periodLabel(period, anchor)}
              data={INCOME_SOURCES.map(s => ({ source: s, amount: incomeBySource[s].amount }))}
              xKey="source"
              series={[{ key: 'amount', label: 'Income' }]}
              format="ugx"
              horizontal
            />
            <ReportBarChart
              title={`Savings, share purchases & milk income ${trendTitle}`}
              data={monthly}
              xKey="month"
              series={[{ key: 'savings', label: 'Savings' }, { key: 'shares', label: 'Share purchases' }, { key: 'milk', label: 'Milk from the farm' }, { key: 'other', label: 'Other income' }]}
              format="ugx"
            />
          </div>
          <div className={cardCls}>
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-bold text-slate-900 dark:text-white">Income entries {incomeFilter !== 'All' && <span className="text-emerald-600">— {incomeFilter}</span>}</h5>
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">Total: UGX {shownIncome.reduce((s, t) => s + t.amount, 0).toLocaleString()}</span>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/50 sticky top-0"><tr><th className="px-3 py-2 w-10">#</th>{['Date', 'Source', 'Category', 'Reference', 'Received Into', 'Amount (UGX)'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {shownIncome.map((t, __n) => (
                    <tr key={t.id}><td className="py-2 px-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{t.date}</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">{classifyIncome(t)}</span></td>
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">{t.category}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{t.reference}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{t.source}</td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">{t.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {shownIncome.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-slate-400">No income entries for this filter.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── EXPENSES ───────────────────────────────────────────────────── */}
      {show('expenses') && (
        <div className="space-y-4">
          <div>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Money Out — SACCO Expenses</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Record what the SACCO spends. Type the expense category yourself — each new category appears in the reports automatically.</p>
          </div>
          {!canExpense && canPost && <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Recording expenses is assigned to: {SaccoFarmStore.assigneeNames('record_expenses')}</p>}
          <div className={cardCls}>
            <h5 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Record Expense</h5>
            <form onSubmit={handleRecordExpense} autoComplete="off" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Expense Category / Type *</label>
                <input type="text" required autoComplete="off" value={exCategory} onChange={e => setExCategory(e.target.value)} placeholder="Type the category" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Amount (UGX) *</label>
                <input type="number" required min="1" value={exAmount} onChange={e => setExAmount(e.target.value)} className={`${inputCls} font-mono font-bold`} />
              </div>
              <div>
                <label className={labelCls}>Paid From (Credit) *</label>
                <select value={exSource} onChange={e => setExSource(e.target.value as any)} className={inputCls}>
                  <option value="Bank">Cash at Bank</option>
                  <option value="Petty Cash">Petty Cash / Mobile Money</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Date *</label>
                <input type="date" required value={exDate} onChange={e => setExDate(e.target.value)} className={`${inputCls} font-mono`} />
              </div>
              <div>
                <label className={labelCls}>Payee</label>
                <input type="text" autoComplete="off" value={exPayee} onChange={e => setExPayee(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Voucher / Receipt No.</label>
                <input type="text" autoComplete="off" value={exRef} onChange={e => setExRef(e.target.value)} className={`${inputCls} font-mono`} />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className={labelCls}>Description</label>
                <input type="text" autoComplete="off" value={exDesc} onChange={e => setExDesc(e.target.value)} className={inputCls} />
              </div>
              <div className="flex items-end">
                <button type="submit" disabled={!canExpense} className="w-full px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg">POST EXPENSE</button>
              </div>
            </form>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ReportBarChart
              title="Expenses by category"
              subtitle={periodLabel(period, anchor)}
              data={expenseByCategory}
              xKey="category"
              series={[{ key: 'amount', label: 'Expenses' }]}
              format="ugx"
              horizontal
            />
            <ReportBarChart
              title={`Expenses ${trendTitle}`}
              data={monthly}
              xKey="month"
              series={[{ key: 'expenses', label: 'Expenses' }]}
              format="ugx"
            />
          </div>
          <div className={cardCls}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <h5 className="text-sm font-bold text-slate-900 dark:text-white">Expense Register</h5>
              <div className="flex items-center gap-3">
                <input value={exSearch} onChange={e => setExSearch(e.target.value)} placeholder="Search expenses..." className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 w-44" />
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">Total: UGX {shownExpenses.reduce((s, t) => s + t.amount, 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/50 sticky top-0"><tr><th className="px-3 py-2 w-10">#</th>{['Date', 'Voucher', 'Category / Type', 'Description', 'Paid From', 'Amount (UGX)'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {shownExpenses.map((t, __n) => (
                    <tr key={t.id}><td className="py-2 px-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{t.date}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{t.reference}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">{t.category}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{t.description}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{t.source}</td>
                      <td className="py-2 px-3 font-mono font-bold text-rose-600 dark:text-rose-400">{t.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {shownExpenses.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-slate-400">No expenses recorded for this period.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── JOURNAL ────────────────────────────────────────────────────── */}
      {show('journal') && (
        <div className={cardCls}>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Post Journal Entry (Debit / Credit)</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">For non-cash adjustments (accruals, reclassifications, depreciation). Every entry debits one account and credits another by the same amount.</p>
          <form onSubmit={handlePostJournal} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className={labelCls}>Debit Account (DR)</label>
              <select value={jDr} onChange={e => setJDr(e.target.value)} className={inputCls}>{CHART_OF_ACCOUNTS.map(a => <option key={a}>{a}</option>)}</select>
            </div>
            <div>
              <label className={labelCls}>Credit Account (CR)</label>
              <select value={jCr} onChange={e => setJCr(e.target.value)} className={inputCls}>{CHART_OF_ACCOUNTS.map(a => <option key={a}>{a}</option>)}</select>
            </div>
            <div>
              <label className={labelCls}>Amount (UGX) *</label>
              <input type="number" required min="1" value={jAmount} onChange={e => setJAmount(e.target.value)} className={`${inputCls} font-mono font-bold`} />
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={jDate} onChange={e => setJDate(e.target.value)} className={`${inputCls} font-mono`} />
            </div>
            <div>
              <label className={labelCls}>Narration *</label>
              <input required value={jNarration} onChange={e => setJNarration(e.target.value)} className={inputCls} />
            </div>
            <div className="sm:col-span-2 lg:col-span-5 flex items-center justify-between gap-3">
              <p className={`text-xs font-bold ${jDr === jCr ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {jDr === jCr ? 'Debit and credit must be different accounts' : `DR ${jDr}  ⟶  CR ${jCr}  ·  UGX ${(Number(jAmount) || 0).toLocaleString()} each side`}
              </p>
              <button type="submit" disabled={!canJournal || jDr === jCr} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg">POST TO GENERAL LEDGER</button>
            </div>
          </form>
        </div>
      )}

      {/* ── DEBIT / CREDIT LEDGER ──────────────────────────────────────── */}
      {show('ledger') && (
        <div className={cardCls}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">General Ledger — Debit &amp; Credit</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Each transaction shown as its two sides. Pick an account to see its running balance.</p>
            </div>
            <select value={ledgerAccount} onChange={e => setLedgerAccount(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white">
              <option value="All">All accounts</option>
              {accounts.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/50 sticky top-0">
                <tr><th className="px-3 py-2 w-10">#</th>
                  {['Date', 'Ref', 'Account', 'Narration'].map(h => <th key={h} className={thCls}>{h}</th>)}
                  <th className={`${thCls} text-right`}>Debit (UGX)</th>
                  <th className={`${thCls} text-right`}>Credit (UGX)</th>
                  {ledgerAccount !== 'All' && <th className={`${thCls} text-right`}>Balance</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {runningLines.map((l, i) => (
                  <tr key={`${l.txId}-${i}`}><td className="py-1.5 px-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{i + 1}</td>
                    <td className="py-1.5 px-3 font-mono text-slate-500">{l.date}</td>
                    <td className="py-1.5 px-3 font-mono text-slate-500">{l.reference}</td>
                    <td className={`py-1.5 px-3 font-semibold text-slate-900 dark:text-white ${l.credit ? 'pl-8' : ''}`}>{l.account}</td>
                    <td className="py-1.5 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{l.narration}</td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">{l.debit ? l.debit.toLocaleString() : ''}</td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">{l.credit ? l.credit.toLocaleString() : ''}</td>
                    {ledgerAccount !== 'All' && <td className="py-1.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">{Math.abs(l.running).toLocaleString()} {l.running >= 0 ? 'Dr' : 'Cr'}</td>}
                  </tr>
                ))}
                {runningLines.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-slate-400">No postings for this period.</td></tr>}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-950 font-bold">
                <tr>
                  <td colSpan={5} className="py-2 px-3 uppercase text-[11px] text-slate-700 dark:text-slate-300">Totals</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-900 dark:text-white">{lineDr.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-900 dark:text-white">{lineCr.toLocaleString()}</td>
                  {ledgerAccount !== 'All' && <td className="py-2 px-3 text-right font-mono text-slate-900 dark:text-white">{Math.abs(lineDr - lineCr).toLocaleString()} {lineDr >= lineCr ? 'Dr' : 'Cr'}</td>}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── TRIAL BALANCE REPORT ───────────────────────────────────────── */}
      {show('report') && (
        <div className="space-y-4">
          <div className={cardCls}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Trial Balance — {periodLabel(period, anchor)}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Built from every posting in the ledger. Total debits must equal total credits.</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${tb.balanced ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-600'}`}>
                {tb.balanced ? '✓ BALANCED — Dr = Cr' : `✗ OUT OF BALANCE by UGX ${Math.abs(tb.totalDebit - tb.totalCredit).toLocaleString()}`}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/50">
                  <tr><th className="px-3 py-2 w-10">#</th>
                    <th className={thCls}>Account</th>
                    <th className={`${thCls} text-right`}>Total Debit</th>
                    <th className={`${thCls} text-right`}>Total Credit</th>
                    <th className={`${thCls} text-right`}>Closing Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {tb.rows.map((r, __n) => (
                    <tr key={r.account}><td className="py-2 px-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">{r.account}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300">{r.debit ? r.debit.toLocaleString() : '—'}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300">{r.credit ? r.credit.toLocaleString() : '—'}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">{r.balance.toLocaleString()} {r.side}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-950 font-extrabold">
                  <tr><td />
                    <td className="py-2 px-3 uppercase text-[11px] text-slate-700 dark:text-slate-300">Totals</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-900 dark:text-white">{tb.totalDebit.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-900 dark:text-white">{tb.totalCredit.toLocaleString()}</td>
                    <td className="py-2 px-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ReportBarChart
              title="Debits vs credits by account"
              data={tb.rows.map(r => ({ account: r.account.replace(/^\d+ — /, ''), debit: r.debit, credit: r.credit }))}
              xKey="account"
              series={[{ key: 'debit', label: 'Debit' }, { key: 'credit', label: 'Credit' }]}
              format="ugx"
              horizontal
            />
            <ReportBarChart
              title={`Money in vs money out ${trendTitle}`}
              data={monthly}
              xKey="month"
              series={[{ key: 'income', label: 'Money in' }, { key: 'expenses', label: 'Money out' }]}
              format="ugx"
            />
          </div>
        </div>
      )}
    </div>
  );
}
