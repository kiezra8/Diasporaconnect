import React, { useEffect, useMemo, useState } from 'react';
import { SaccoFarmStore, PeriodClose, DividendDeclaration, DividendParams } from '../../services/saccoFarmStore';
import ReportBarChart from '../charts/ReportBarChart';

interface Props {
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

const ugx = (n: number) => `UGX ${Math.round(n).toLocaleString()}`;
const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5';
const th = 'text-left text-slate-800 dark:text-slate-300 font-bold uppercase text-[11px] py-2 px-3';
const input = 'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-500';

/** Month-end close (freezes a month's figures) and annual dividend calculation & payment. */
export default function PeriodCloseDividends({ onNotify }: Props) {
  const [tick, setTick] = useState(0);
  const [tab, setTab] = useState<'close' | 'dividends'>('close');
  useEffect(() => {
    const r = () => setTick(t => t + 1);
    window.addEventListener('dc_storage_update', r);
    return () => window.removeEventListener('dc_storage_update', r);
  }, []);
  const notify = (m: string, t: 'success' | 'error' = 'success') => (onNotify ? onNotify(m, t) : alert(m));
  const canClose = SaccoFarmStore.canPerform('month_end_close');
  const canDividends = SaccoFarmStore.canPerform('dividends');
  const isAdmin = SaccoFarmStore.getActor().role === 'ADMIN';

  // ── months that have activity, newest first ──
  const closes = useMemo(() => SaccoFarmStore.getPeriodCloses(), [tick]);
  const months = useMemo(() => {
    const set = new Set(SaccoFarmStore.getTransactions().map(t => t.date.slice(0, 7)));
    const now = new Date();
    for (let i = 1; i <= 6; i++) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); }
    set.add(now.toISOString().slice(0, 7));
    return Array.from(set).sort().reverse().map(m => ({ month: m, ...SaccoFarmStore.summarizePeriod(m), close: closes.find(c => c.month === m) }));
  }, [tick, closes]);
  const current = new Date().toISOString().slice(0, 7);

  const close = (m: string) => {
    if (!confirm(`Close ${m}? Entries dated in ${m} will then be posted as adjustments in the current month.`)) return;
    const res = SaccoFarmStore.closePeriod(m);
    notify(res.msg, res.success ? 'success' : 'error');
  };
  const reopen = (c: PeriodClose) => {
    const reason = prompt(`Reason for reopening ${c.month} (kept in the audit trail):`);
    if (!reason) return;
    if (SaccoFarmStore.reopenPeriod(c.month, reason)) notify(`${c.month} reopened.`);
  };

  // ── dividends ──
  const thisYear = new Date().getFullYear();
  const [params, setParams] = useState<DividendParams>({ year: thisYear - 1, reservePct: 20, educationPct: 5, payoutPct: 100, method: 'share-months' });
  const preview = useMemo(() => SaccoFarmStore.computeDividend(params), [params, tick]);
  const declarations = useMemo(() => SaccoFarmStore.getDividends(), [tick]);
  const existing = declarations.find(d => d.year === params.year);
  const yearMonths = Array.from({ length: 12 }, (_, i) => `${params.year}-${String(i + 1).padStart(2, '0')}`).filter(m => m < current);
  const openMonths = yearMonths.filter(m => !closes.some(c => c.month === m && c.status === 'CLOSED'));

  const declare = () => {
    if (openMonths.length && !confirm(`${openMonths.length} month(s) of ${params.year} are not closed (${openMonths.join(', ')}). Figures could still change. Declare anyway?`)) return;
    const res = SaccoFarmStore.declareDividend(params);
    notify(res.msg, res.success ? 'success' : 'error');
  };
  const pay = (d: DividendDeclaration) => {
    if (!confirm(`Credit ${ugx(d.pool)} to ${d.rows.filter(r => r.amount > 0).length} members' savings now?`)) return;
    const res = SaccoFarmStore.payDividend(d.id);
    notify(res.msg, res.success ? 'success' : 'error');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit">
        {(['close', 'dividends'] as const).map(k => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-xl text-xs font-extrabold ${tab === k ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}>
            {k === 'close' ? 'Month-End Close' : 'Dividends'}
          </button>
        ))}
      </div>

      {tab === 'close' && (
        <div className="space-y-4">
          <div className={card}>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Month-End Close</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Closing a month freezes its totals. Anything recorded later with a date in that month is posted as an adjustment in the current month, so closed reports never change.
              {!canClose && <span className="block mt-1 font-bold text-amber-700 dark:text-amber-300">Month-end close is assigned to: {SaccoFarmStore.assigneeNames('month_end_close')}</span>}
            </p>
          </div>
          <ReportBarChart
            title="Revenue vs operating expenses by month"
            subtitle="Revenue = milk sales, loan interest and other earnings (member savings, shares and loan principal are not revenue)"
            data={[...months].reverse().slice(-12).map(m => ({ month: m.month, revenue: m.revenue, expenses: m.expenses }))}
            xKey="month"
            series={[{ key: 'revenue', label: 'Revenue' }, { key: 'expenses', label: 'Operating expenses' }]}
            format="ugx"
          />
          <div className={`${card} overflow-x-auto`}>
            <table className="w-full text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/50">
                <tr><th className="px-3 py-2 w-10">#</th>{['Month', 'Money in', 'Revenue', 'Expenses', 'Surplus', 'Trial balance', 'Status', ''].map(h => <th key={h} className={th}>{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {months.map((m, __n) => {
                  const closed = m.close?.status === 'CLOSED';
                  return (
                    <tr key={m.month}><td className="py-2 px-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">{m.month}</td>
                      <td className="py-2 px-3 font-mono">{ugx(closed ? m.close!.income : m.income)}</td>
                      <td className="py-2 px-3 font-mono text-emerald-700 dark:text-emerald-400">{ugx(closed ? m.close!.revenue : m.revenue)}</td>
                      <td className="py-2 px-3 font-mono text-rose-600 dark:text-rose-400">{ugx(closed ? m.close!.expenses : m.expenses)}</td>
                      <td className="py-2 px-3 font-mono font-bold">{ugx(closed ? m.close!.surplus : m.surplus)}</td>
                      <td className="py-2 px-3">{m.trialBalanced ? <span className="text-emerald-700 dark:text-emerald-400 font-bold">Dr = Cr</span> : <span className="text-rose-600 font-bold">Out of balance</span>}</td>
                      <td className="py-2 px-3">
                        {closed ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">CLOSED · {m.close!.closedBy}</span>
                          : m.month >= current ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300">CURRENT</span>
                          : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">OPEN</span>}
                        {m.close?.status === 'REOPENED' && <span className="block text-[10px] text-slate-500 mt-0.5">Reopened: {m.close.reopenReason}</span>}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {!closed && m.month < current && canClose && <button onClick={() => close(m.month)} className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]">CLOSE MONTH</button>}
                        {closed && isAdmin && <button onClick={() => reopen(m.close!)} className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">REOPEN</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'dividends' && (
        <div className="space-y-4">
          <div className={card}>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Dividend Calculation</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Surplus = revenue − operating expenses for the year. Statutory reserve and education fund are set aside first; the payout share of what remains is shared by shares held{params.method === 'share-months' ? ', weighted by the months each member was in the SACCO that year' : ''}.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div><label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Financial Year</label>
                <input type="number" min="2000" max={thisYear} value={params.year} onChange={e => setParams({ ...params, year: Number(e.target.value) })} className={input} /></div>
              <div><label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Statutory Reserve %</label>
                <input type="number" min="0" max="100" value={params.reservePct} onChange={e => setParams({ ...params, reservePct: Number(e.target.value) })} className={input} /></div>
              <div><label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Education Fund %</label>
                <input type="number" min="0" max="100" value={params.educationPct} onChange={e => setParams({ ...params, educationPct: Number(e.target.value) })} className={input} /></div>
              <div><label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Payout % of Remainder</label>
                <input type="number" min="0" max="100" value={params.payoutPct} onChange={e => setParams({ ...params, payoutPct: Number(e.target.value) })} className={input} /></div>
              <div><label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Share By</label>
                <select value={params.method} onChange={e => setParams({ ...params, method: e.target.value as any })} className={input}>
                  <option value="share-months">Shares × months held</option>
                  <option value="shares">Shares held</option>
                </select></div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {[
              ['Revenue', preview.revenue], ['Operating expenses', preview.expenses], ['Surplus', preview.surplus],
              ['Statutory reserve', preview.reserve], ['Education fund', preview.education], ['Dividend pool', preview.pool],
            ].map(([l, v]) => (
              <div key={l as string} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase">{l}</span>
                <div className="text-sm font-extrabold font-mono text-slate-900 dark:text-white mt-1">{ugx(v as number)}</div>
              </div>
            ))}
          </div>

          <ReportBarChart
            title={`Dividend by member — ${params.year}`}
            subtitle={`≈ UGX ${preview.ratePerShare.toLocaleString()} per share`}
            data={preview.rows.filter(r => r.amount > 0).sort((a, b) => b.amount - a.amount).map(r => ({ member: r.memberName, amount: r.amount }))}
            xKey="member"
            series={[{ key: 'amount', label: 'Dividend' }]}
            format="ugx"
            horizontal
            emptyText="No distributable surplus for this year."
          />

          <div className={`${card} space-y-3`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h5 className="text-sm font-bold text-slate-900 dark:text-white">Members ({preview.rows.length})</h5>
              {existing ? (
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{params.year} already {existing.status === 'PAID' ? `paid on ${new Date(existing.paidAt!).toLocaleDateString()}` : 'declared — see below'}</span>
              ) : canDividends ? (
                <button onClick={declare} disabled={preview.pool <= 0} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs">DECLARE {params.year} DIVIDEND</button>
              ) : (
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Dividends are assigned to: {SaccoFarmStore.assigneeNames('dividends')}</span>
              )}
            </div>
            {openMonths.length > 0 && <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300">Not yet closed for {params.year}: {openMonths.join(', ')}</p>}
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/50 sticky top-0"><tr><th className="px-3 py-2 w-10">#</th>{['Member', 'Shares', 'Weight', 'Dividend'].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {preview.rows.map((r, __n) => (
                    <tr key={r.memberId}><td className="py-1.5 px-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                      <td className="py-1.5 px-3 font-semibold text-slate-900 dark:text-white">{r.memberName} <span className="font-mono text-slate-500">{r.memberId}</span></td>
                      <td className="py-1.5 px-3 font-mono">{r.shares}</td>
                      <td className="py-1.5 px-3 font-mono">{Math.round(r.weight * 100) / 100}</td>
                      <td className="py-1.5 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">{ugx(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {declarations.length > 0 && (
            <div className={`${card} space-y-2`}>
              <h5 className="text-sm font-bold text-slate-900 dark:text-white">Declared Dividends</h5>
              {declarations.map(d => (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">{d.year} — {ugx(d.pool)} ({ugx(d.ratePerShare)}/share)</p>
                    <p className="text-slate-500">Declared by {d.declaredBy} on {new Date(d.declaredAt).toLocaleDateString()}{d.paidAt ? ` · paid by ${d.paidBy} on ${new Date(d.paidAt).toLocaleDateString()}` : ''}</p>
                  </div>
                  {d.status === 'DECLARED' && canDividends
                    ? <button onClick={() => pay(d)} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs">PAY INTO SAVINGS</button>
                    : <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${d.status === 'PAID' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-700'}`}>{d.status}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
