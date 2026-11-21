import React, { useEffect, useMemo, useState } from 'react';
import { SaccoFarmStore, AuditEntry } from '../../services/saccoFarmStore';

const input = 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500';

/** Read-only, append-only log of who changed what. */
export default function AuditTrailPanel() {
  const [entries, setEntries] = useState<AuditEntry[]>(() => SaccoFarmStore.getAuditTrail());
  const [q, setQ] = useState('');
  const [entity, setEntity] = useState('All');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [open, setOpen] = useState<string>('');

  useEffect(() => {
    const r = () => setEntries(SaccoFarmStore.getAuditTrail());
    window.addEventListener('dc_audit', r);
    window.addEventListener('dc_storage_update', r);
    return () => { window.removeEventListener('dc_audit', r); window.removeEventListener('dc_storage_update', r); };
  }, []);

  const entities = useMemo(() => ['All', ...Array.from(new Set(entries.map(e => e.entity))).sort()], [entries]);
  const shown = entries.filter(e => {
    if (entity !== 'All' && e.entity !== entity) return false;
    const d = e.at.slice(0, 10);
    if (from && d < from) return false;
    if (to && d > to) return false;
    const s = q.trim().toLowerCase();
    return !s || `${e.actor} ${e.role} ${e.summary} ${e.entityId || ''} ${e.action}`.toLowerCase().includes(s);
  });

  const exportCsv = () => {
    const esc = (v: string) => `"${String(v || '').replace(/"/g, '""')}"`;
    const rows = [['Time', 'User', 'Role', 'Action', 'Entity', 'Entity ID', 'Summary'].join(','),
      ...shown.map(e => [e.at, e.actor, e.role, e.action, e.entity, e.entityId || '', e.summary].map(esc).join(','))];
    const blob = new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Diaspora_Connect_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Audit Trail</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Every change to members, money, loans and the farm — who did it and when. Entries cannot be edited or deleted.</p>
        </div>
        <button onClick={exportCsv} className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold">EXPORT CSV ({shown.length})</button>
      </div>
      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search user, member, action…" className={`${input} w-56`} />
        <select value={entity} onChange={e => setEntity(e.target.value)} className={input}>{entities.map(x => <option key={x}>{x}</option>)}</select>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={input} aria-label="From date" />
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className={input} aria-label="To date" />
      </div>
      <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800/50 sticky top-0">
            <tr><th className="py-2 px-3 uppercase text-[11px] dark:text-slate-300 w-10">#</th>{['Time', 'User', 'Entity', 'What happened'].map(h => <th key={h} className="text-left py-2 px-3 font-bold uppercase text-[11px] text-slate-700 dark:text-slate-300">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {shown.slice(0, 500).map((e, __n) => (
              <React.Fragment key={e.id}>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer" onClick={() => setOpen(open === e.id ? '' : e.id)}><td className="py-1.5 px-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                  <td className="py-1.5 px-3 font-mono text-slate-500 whitespace-nowrap">{new Date(e.at).toLocaleString('en-GB')}</td>
                  <td className="py-1.5 px-3"><span className="font-semibold text-slate-900 dark:text-white">{e.actor}</span><span className="block text-[10px] text-slate-500">{e.role}</span></td>
                  <td className="py-1.5 px-3 text-slate-600 dark:text-slate-300">{e.entity}{e.entityId && <span className="block font-mono text-[10px]">{e.entityId}</span>}</td>
                  <td className="py-1.5 px-3 text-slate-800 dark:text-slate-200">{e.summary}</td>
                </tr>
                {open === e.id && e.details && (
                  <tr><td colSpan={5} className="px-3 pb-2"><pre className="text-[10px] whitespace-pre-wrap break-all bg-slate-50 dark:bg-slate-950 p-2 rounded-lg text-slate-600 dark:text-slate-400">{e.action}: {e.details}</pre></td></tr>
                )}
              </React.Fragment>
            ))}
            {shown.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-slate-400">No audit entries for this filter.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
