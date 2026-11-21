import React, { useEffect, useState } from 'react';
import { SaccoFarmStore, SmsSettings, SmsMessage, SMS_EVENT_LABELS, SmsEvent } from '../../services/saccoFarmStore';
import { database } from '../../services/database';

interface Props { onNotify?: (msg: string) => void }

/** SMS alert settings, broadcast, and the delivery log. Messages are sent through the backend gateway (Africa's Talking). */
export default function SmsCenterPanel({ onNotify }: Props) {
  const [settings, setSettings] = useState<SmsSettings>(() => SaccoFarmStore.getSmsSettings());
  const [log, setLog] = useState<SmsMessage[]>(() => SaccoFarmStore.getSmsLog());
  const [broadcast, setBroadcast] = useState('');
  const canBroadcast = SaccoFarmStore.canPerform('sms_broadcast');

  useEffect(() => {
    const r = () => { setLog(SaccoFarmStore.getSmsLog()); setSettings(SaccoFarmStore.getSmsSettings()); };
    window.addEventListener('dc_storage_update', r);
    return () => window.removeEventListener('dc_storage_update', r);
  }, []);

  const save = (s: SmsSettings) => { setSettings(s); SaccoFarmStore.saveSmsSettings(s); };

  const sendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    const text = broadcast.trim();
    if (!text) return;
    const active = SaccoFarmStore.getMembers().filter(m => m.status === 'ACTIVE');
    if (!confirm(`Send this SMS to ${active.length} active members?`)) return;
    let n = 0;
    active.forEach(m => { if (SaccoFarmStore.queueSms('broadcast', m.memberId, `Diaspora Connect: ${text}`)) n++; });
    SaccoFarmStore.audit('smsBroadcast', 'SMS', undefined, `Broadcast SMS to ${n} members: "${text.slice(0, 80)}"`);
    onNotify?.(`${n} SMS queued for sending.`);
    setBroadcast('');
  };

  const statusCls = (s: SmsMessage['status']) => s === 'SENT' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : s === 'FAILED' ? 'bg-rose-500/15 text-rose-600' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
  const queued = log.filter(m => m.status !== 'SENT').length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">SMS Alerts</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Members get an SMS for the events ticked below. Sent through the server’s SMS gateway{database.isConnected() ? '' : ' — no connection right now, so messages wait in the queue'}.</p>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={settings.enabled} onChange={e => save({ ...settings, enabled: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
          SMS alerts on
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {(Object.keys(SMS_EVENT_LABELS) as SmsEvent[]).map(ev => (
          <label key={ev} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
            <input type="checkbox" disabled={!settings.enabled} checked={settings.events[ev]} onChange={e => save({ ...settings, events: { ...settings.events, [ev]: e.target.checked } })} className="accent-emerald-600" />
            {SMS_EVENT_LABELS[ev]}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Sender ID</label>
          <input value={settings.senderId} maxLength={11} onChange={e => setSettings({ ...settings, senderId: e.target.value })} onBlur={() => save(settings)} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white w-40" />
        </div>
        <button onClick={() => database.flushSms().then(n => onNotify?.(n ? `${n} queued SMS sent.` : 'Nothing sent — the SMS gateway is not reachable.'))} disabled={!queued} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold disabled:opacity-50">
          RETRY QUEUE ({queued})
        </button>
      </div>

      {canBroadcast && (
        <form onSubmit={sendBroadcast} className="flex flex-col sm:flex-row gap-2">
          <input value={broadcast} onChange={e => setBroadcast(e.target.value)} maxLength={300} placeholder="Message to all active members (e.g. AGM on Saturday at 10am)" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white" />
          <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs">SEND SMS BROADCAST</button>
        </form>
      )}

      <div className="overflow-x-auto max-h-72 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800/50 sticky top-0">
            <tr><th className="py-2 px-3 uppercase text-[11px] dark:text-slate-300 w-10">#</th>{['Time', 'To', 'Event', 'Message', 'Status'].map(h => <th key={h} className="text-left py-2 px-3 font-bold uppercase text-[11px] text-slate-700 dark:text-slate-300">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {log.slice(0, 200).map((m, __n) => (
              <tr key={m.id}><td className="py-1.5 px-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                <td className="py-1.5 px-3 font-mono text-slate-500 whitespace-nowrap">{new Date(m.createdAt).toLocaleString('en-GB')}</td>
                <td className="py-1.5 px-3 font-mono">+{m.to}</td>
                <td className="py-1.5 px-3 text-slate-600 dark:text-slate-300">{SMS_EVENT_LABELS[m.event]}</td>
                <td className="py-1.5 px-3 text-slate-800 dark:text-slate-200 max-w-md">{m.message}</td>
                <td className="py-1.5 px-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCls(m.status)}`}>{m.status}</span>{m.error && <span className="block text-[10px] text-rose-500">{m.error}</span>}</td>
              </tr>
            ))}
            {log.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-slate-400">No SMS sent yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
