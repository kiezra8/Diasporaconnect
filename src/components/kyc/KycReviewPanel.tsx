import React, { useEffect, useState } from 'react';
import { SaccoFarmStore, KycSubmission } from '../../services/saccoFarmStore';

interface Props {
  reviewerName: string;
  onNotify?: (msg: string) => void;
  guard?: (desc: string, action: () => void) => void;
}

/** Officer view: review member KYC submissions and verify or reject them. */
export default function KycReviewPanel({ reviewerName, onNotify, guard }: Props) {
  const [list, setList] = useState<KycSubmission[]>(() => SaccoFarmStore.getKycSubmissions());
  const [open, setOpen] = useState<KycSubmission | null>(null);
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING');
  const [zoom, setZoom] = useState('');

  useEffect(() => {
    const reload = () => setList(SaccoFarmStore.getKycSubmissions());
    window.addEventListener('dc_storage_update', reload);
    return () => window.removeEventListener('dc_storage_update', reload);
  }, []);

  const run = (desc: string, fn: () => void) => {
    if (!SaccoFarmStore.canPerform('kyc_review')) { onNotify?.(`KYC review is assigned to: ${SaccoFarmStore.assigneeNames('kyc_review')}.`); return; }
    return guard ? guard(desc, fn) : fn();
  };
  const shown = list.filter(k => filter === 'ALL' || k.status === 'PENDING');
  const pending = list.filter(k => k.status === 'PENDING').length;

  const decide = (k: KycSubmission, decision: 'VERIFIED' | 'REJECTED') =>
    run(decision === 'VERIFIED' ? 'Verifying member KYC' : 'Rejecting member KYC', () => {
      let reason: string | undefined;
      if (decision === 'REJECTED') {
        const r = prompt(`Reason for rejecting ${k.memberName}'s KYC (shown to the member):`, 'ID photo is unclear — please upload a sharper image');
        if (r === null) return;
        reason = r;
      }
      if (SaccoFarmStore.reviewKyc(k.id, decision, reviewerName, reason)) {
        onNotify?.(`${k.memberName}'s KYC ${decision === 'VERIFIED' ? 'verified' : 'rejected'}.`);
        setOpen(null);
      }
    });

  const statusCls = (s: KycSubmission['status']) =>
    s === 'VERIFIED' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : s === 'PENDING' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Member KYC Verification</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Identity documents members submitted from their portal. Verifying updates the member record (NIN / ID number).</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">{pending} pending</span>
          <select value={filter} onChange={e => setFilter(e.target.value as any)} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white">
            <option value="PENDING">Pending only</option>
            <option value="ALL">All submissions</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]"><th className="p-3 w-10">#</th>
              <th className="p-3">Member</th><th className="p-3">Document</th><th className="p-3">Residence</th><th className="p-3">Submitted</th><th className="p-3">Status</th><th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {shown.map((k, __n) => (
              <tr key={k.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30"><td className="p-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                <td className="p-3"><span className="font-bold text-slate-900 dark:text-white">{k.memberName}</span><span className="block font-mono text-[10px] text-slate-500">{k.memberId}</span></td>
                <td className="p-3 text-slate-700 dark:text-slate-300">{k.idType}<span className="block font-mono text-[10px]">{k.idNumber}</span></td>
                <td className="p-3 text-slate-700 dark:text-slate-300">{k.countryOfResidence}</td>
                <td className="p-3 font-mono text-slate-500">{k.submittedAt}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCls(k.status)}`}>{k.status}</span></td>
                <td className="p-3 text-right"><button onClick={() => setOpen(k)} className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs">Review</button></td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-500">{filter === 'PENDING' ? 'No KYC submissions waiting for review.' : 'No members have submitted KYC yet.'}</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setOpen(null)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{open.memberName} <span className="font-mono text-xs text-slate-500">{open.memberId}</span></h3>
                <p className="text-xs text-slate-500">{open.id} · submitted {open.submittedAt}</p>
              </div>
              <button onClick={() => setOpen(null)} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold">CLOSE</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[['ID front', open.idFrontImage], ['ID back', open.idBackImage], ['Selfie with ID', open.selfieImage]].map(([label, src]) => (
                <div key={label as string}>
                  <p className="text-[11px] font-bold uppercase text-slate-500 mb-1">{label}</p>
                  {src ? (
                    <button type="button" onClick={() => setZoom(src as string)} className="block w-full h-40 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                      <img src={src as string} alt={label as string} className="w-full h-full object-cover" />
                    </button>
                  ) : <div className="h-40 rounded-xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-[11px] text-slate-400">Not provided</div>}
                </div>
              ))}
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
              {[
                ['Document', `${open.idType} — ${open.idNumber}`],
                ['Date of birth', open.dateOfBirth],
                ['Nationality', open.nationality],
                ['Country of residence', open.countryOfResidence],
                ['Address', open.address],
                ['Occupation', open.occupation],
                ['Source of funds', open.sourceOfFunds],
                ['Next of kin', `${open.nextOfKinName} (${open.nextOfKinRelationship}) · ${open.nextOfKinPhone}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-slate-100 dark:border-slate-800 py-1">
                  <dt className="text-slate-500">{k}</dt><dd className="font-semibold text-slate-900 dark:text-white text-right">{v || '—'}</dd>
                </div>
              ))}
            </dl>
            {open.status === 'PENDING' ? (
              <div className="flex justify-end gap-2">
                <button onClick={() => decide(open, 'REJECTED')} className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs">Reject</button>
                <button onClick={() => decide(open, 'VERIFIED')} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs">Verify Identity</button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-right">{open.status} by {open.reviewedBy} on {open.reviewedAt}{open.rejectionReason ? ` — ${open.rejectionReason}` : ''}</p>
            )}
          </div>
        </div>
      )}
      {zoom && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4" onClick={() => setZoom('')}>
          <img src={zoom} alt="Document" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </div>
  );
}
