import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { buildSaccoSnapshot, generateLocalReport, answerLocally, AdvisorReport, SaccoSnapshot } from '../../services/saccoAdvisor';
import ReportBarChart from '../charts/ReportBarChart';
import { htmlBarChart, PRINT_CHART_CSS } from '../charts/printBarChart';

interface ChatMsg { from: 'admin' | 'advisor'; text: string; live?: boolean }

const sevCls = {
  good: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  watch: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  critical: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
};
const prioCls = {
  High: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  Medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  Low: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
};

export default function SaccoAIAdvisor() {
  const [snapshot, setSnapshot] = useState<SaccoSnapshot>(() => buildSaccoSnapshot());
  const [report, setReport] = useState<AdvisorReport>(() => generateLocalReport(snapshot));
  const [narrative, setNarrative] = useState('');
  const [narrativeModel, setNarrativeModel] = useState('');
  const [loadingNarrative, setLoadingNarrative] = useState(false);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [chat, setChat] = useState<ChatMsg[]>([]);

  const refresh = () => {
    const s = buildSaccoSnapshot();
    setSnapshot(s);
    setReport(generateLocalReport(s));
    return s;
  };

  useEffect(() => {
    window.addEventListener('dc_storage_update', refresh);
    return () => window.removeEventListener('dc_storage_update', refresh);
  }, []);

  const requestNarrative = async () => {
    const s = refresh();
    setLoadingNarrative(true);
    const res = await api.querySaccoAdvisor({ mode: 'report', snapshot: s });
    setLoadingNarrative(false);
    if (res) { setNarrative(res.answer); setNarrativeModel(res.model || 'Claude'); }
    else { setNarrative(''); setNarrativeModel('offline'); }
  };

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    setQuestion('');
    setChat(c => [...c, { from: 'admin', text: q }]);
    setAsking(true);
    const s = refresh();
    const res = await api.querySaccoAdvisor({ mode: 'question', question: q, snapshot: s });
    setAsking(false);
    setChat(c => [...c, res ? { from: 'advisor', text: res.answer, live: true } : { from: 'advisor', text: answerLocally(q, s, generateLocalReport(s)) }]);
  };

  const printReport = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>SACCO AI Management Report</title>
      <style>body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;font-size:10pt;padding:24px}
      h1{font-size:15pt;margin:0}h2{font-size:11pt;margin:20px 0 6px;border-bottom:1px solid #cbd5e1;padding-bottom:3px}
      .muted{color:#64748b;font-size:8.5pt}li{margin:3px 0}table{width:100%;border-collapse:collapse;font-size:9pt}
      th{background:#f1f5f9;text-align:left;padding:5px 8px}td{padding:5px 8px;border-bottom:1px solid #f1f5f9;vertical-align:top}
      pre{white-space:pre-wrap;font-family:inherit}${PRINT_CHART_CSS}</style></head><body>
      <h1>Diaspora Connect SACCO — AI Management Report</h1>
      <div class="muted">Generated ${snapshot.generatedAt}</div>
      <p><b>${report.headline}</b></p>
      ${htmlBarChart('Health score by area (out of 100)', report.sections.map(s => ({ label: s.area, value: s.score })), n => `${n}/100`, '#2a78d6')}
      ${report.sections.map(s => `<h2>${s.area} — ${s.score}/100</h2><ul>${s.findings.map(f => `<li>${f}</li>`).join('')}</ul>`).join('')}
      <h2>Recommended improvements</h2>
      <table><thead><tr><th>#</th><th>Priority</th><th>Area</th><th>Action</th><th>Why</th></tr></thead><tbody>${report.recommendations.map((r, __n) => `<tr><td>${__n + 1}</td><td>${r.priority}</td><td>${r.area}</td><td>${r.action}</td><td>${r.why}</td></tr>`).join('')}
      </tbody></table>
      ${narrative ? `<h2>AI narrative (${narrativeModel})</h2><pre>${narrative.replace(/</g, '&lt;')}</pre>` : ''}
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">SACCO AI Advisor</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">A report on everything happening in the SACCO, built from your SACCO data, with what to improve. Updated {snapshot.generatedAt}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={requestNarrative} disabled={loadingNarrative} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-extrabold shadow-md">
            {loadingNarrative ? 'Asking the AI…' : 'GENERATE AI REPORT'}
          </button>
          <button onClick={printReport} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md">PRINT REPORT</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-center">
          <span className="text-xs font-bold uppercase text-slate-500">Overall health</span>
          <div className="text-5xl font-black font-mono text-slate-900 dark:text-white mt-1">{report.healthScore}<span className="text-lg text-slate-400">/100</span></div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-3">{report.headline}</p>
        </div>
        <ReportBarChart
          className="lg:col-span-2"
          title="Health score by area"
          subtitle="0–100 — higher is better"
          data={report.sections.map(s => ({ area: s.area, score: s.score }))}
          xKey="area"
          series={[{ key: 'score', label: 'Score' }]}
          horizontal
          height={220}
        />
      </div>

      {(narrative || narrativeModel === 'offline') && (
        <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">AI narrative</h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{narrativeModel === 'offline' ? 'AI service offline' : narrativeModel}</span>
          </div>
          {narrative
            ? <div className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{narrative}</div>
            : <p className="text-xs text-slate-500">The AI service could not be reached, so the report below comes from the built-in analysis of your SACCO data. Set ANTHROPIC_API_KEY on the backend to enable AI narratives.</p>}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {report.sections.map(s => (
          <div key={s.area} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{s.area}</h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${sevCls[s.severity]}`}>{s.severity === 'good' ? 'Healthy' : s.severity === 'watch' ? 'Watch' : 'Act now'} · {s.score}</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc pl-4">
              {s.findings.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">How to improve — recommended actions</h4>
        <div className="space-y-2">
          {report.recommendations.map((r, i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${prioCls[r.priority]}`}>{r.priority}</span>
                <span className="text-[11px] font-bold text-slate-500 uppercase">{r.area}</span>
              </div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">{r.action}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{r.why}</p>
            </div>
          ))}
          {report.recommendations.length === 0 && <p className="text-xs text-slate-500">No issues found in the current data.</p>}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Ask the advisor</h4>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {chat.length === 0 && <p className="text-xs text-slate-500">Ask about loans, savings, milk production, costs, KYC or anything else in the SACCO data.</p>}
          {chat.map((m, i) => (
            <div key={i} className={`p-3 rounded-xl text-xs whitespace-pre-wrap ${m.from === 'admin' ? 'bg-emerald-600 text-white ml-10' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mr-10'}`}>
              {m.text}
              {m.from === 'advisor' && <span className="block mt-1 text-[10px] opacity-60">{m.live ? 'AI (Claude)' : 'Built-in analysis'}</span>}
            </div>
          ))}
          {asking && <p className="text-xs text-slate-500">Thinking…</p>}
        </div>
        <form onSubmit={ask} className="flex gap-2">
          <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="e.g. Why is milk income down and what should we do?" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" />
          <button type="submit" disabled={asking} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold">ASK</button>
        </form>
      </div>
    </div>
  );
}
