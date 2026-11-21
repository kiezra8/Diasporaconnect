import React, { useEffect, useState } from 'react';
import { SaccoFarmStore, MemberPaymentRequest } from '../../services/saccoFarmStore';

interface Props {
  role: 'ACCOUNTANT' | 'ADMIN';
  actorName: string;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
  /** wraps an action in the portal's own permission check (Admin role simulator) */
  guard?: (desc: string, action: () => void) => void;
}

const badge = (s: MemberPaymentRequest['status']) =>
  s === 'PENDING_VERIFICATION' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
  : s === 'VERIFIED_AWAITING_ADMIN' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
  : s === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400';

const statusText = (s: MemberPaymentRequest['status']) =>
  s === 'PENDING_VERIFICATION' ? 'Awaiting Accountant'
  : s === 'VERIFIED_AWAITING_ADMIN' ? 'Awaiting Admin'
  : s === 'APPROVED' ? 'Approved & Posted' : 'Rejected';

/**
 * Member deposits / withdrawals flow:  Member submits → Accountant verifies → Admin approves.
 * On approval the store updates the member's savings / shares and posts the ledger entry,
 * so every portal reads the same numbers.
 */
export default function PaymentRequestQueue({ role, actorName, onNotify, guard }: Props) {
  const [requests, setRequests] = useState<MemberPaymentRequest[]>(() => SaccoFarmStore.getPaymentRequests());
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const reload = () => setRequests(SaccoFarmStore.getPaymentRequests());
    window.addEventListener('dc_storage_update', reload);
    return () => window.removeEventListener('dc_storage_update', reload);
  }, []);

  const notify = (m: string, t: 'success' | 'error' = 'success') => (onNotify ? onNotify(m, t) : alert(m));
  const task = role === 'ACCOUNTANT' ? 'verify_payments' : 'approve_payments';
  const run = (desc: string, fn: () => void) => {
    if (!SaccoFarmStore.canPerform(task)) return notify(`This task is assigned to: ${SaccoFarmStore.assigneeNames(task)}. Ask the Admin to assign you in Settings.`, 'error');
    return guard ? guard(desc, fn) : fn();
  };

  const actionable = requests.filter(r => role === 'ACCOUNTANT' ? r.status === 'PENDING_VERIFICATION' : r.status === 'VERIFIED_AWAITING_ADMIN');
  const waitingOther = requests.filter(r => role === 'ACCOUNTANT' ? r.status === 'VERIFIED_AWAITING_ADMIN' : r.status === 'PENDING_VERIFICATION');
  const history = requests.filter(r => r.status === 'APPROVED' || r.status === 'REJECTED');

  const approve = (r: MemberPaymentRequest) =>
    run(role === 'ACCOUNTANT' ? 'Verifying member payment evidence' : 'Authorizing member payment', () => {
      const res = role === 'ACCOUNTANT'
        ? SaccoFarmStore.verifyPaymentRequest(r.id, actorName)
        : SaccoFarmStore.approvePaymentRequest(r.id, actorName);
      notify(res.msg, res.success ? 'success' : 'error');
    });

  const reject = (r: MemberPaymentRequest) =>
    run('Rejecting member payment request', () => {
      const reason = prompt(`Reason for rejecting ${r.id} (${r.memberName})?`, 'Payment could not be matched to bank / mobile money records');
      if (reason === null) return;
      SaccoFarmStore.rejectPaymentRequest(r.id, reason, actorName);
      notify(`${r.id} rejected.`);
    });

  const Row = ({ r, actions, n }: { r: MemberPaymentRequest; actions: boolean; n: number }) => (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
      <td className="p-3 text-slate-400 font-mono text-[11px]">{n}</td>
      <td className="p-3 font-mono font-bold text-blue-700 dark:text-blue-400">{r.id}</td>
      <td className="p-3">
        <span className="font-bold text-slate-900 dark:text-white">{r.memberName}</span>
        <span className="block text-[10px] font-mono text-slate-500">{r.memberId} · {r.submittedAt}</span>
      </td>
      <td className="p-3">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.kind === 'DEPOSIT' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'}`}>{r.kind}</span>
        <span className="block text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">{r.purposeLabel}{r.shareCount ? ` · ${r.shareCount} share(s)` : ''}</span>
      </td>
      <td className="p-3 text-right font-mono font-extrabold text-slate-900 dark:text-white">UGX {r.amount.toLocaleString()}</td>
      <td className="p-3 text-slate-600 dark:text-slate-300">{r.method}<span className="block font-mono text-[10px] text-slate-500">{r.reference}</span></td>
      <td className="p-3">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge(r.status)}`}>{statusText(r.status)}</span>
        {r.verifiedBy && <span className="block text-[10px] text-slate-500 mt-0.5">Verified: {r.verifiedBy}</span>}
        {r.approvedBy && <span className="block text-[10px] text-slate-500">Approved: {r.approvedBy}</span>}
        {r.rejectionReason && <span className="block text-[10px] text-rose-500">{r.rejectionReason}</span>}
      </td>
      <td className="p-3 text-right">
        {actions && (
          <div className="flex justify-end gap-1.5">
            <button onClick={() => reject(r)} className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold">Reject</button>
            <button onClick={() => approve(r)} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md">
              {role === 'ACCOUNTANT' ? 'Verify' : 'Approve & Post'}
            </button>
          </div>
        )}
      </td>
    </tr>
  );

  const Table = ({ list, actions, empty }: { list: MemberPaymentRequest[]; actions: boolean; empty: string }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
            <th className="p-3 w-10">#</th><th className="p-3">Ref</th><th className="p-3">Member</th><th className="p-3">Request</th><th className="p-3 text-right">Amount</th><th className="p-3">Channel</th><th className="p-3">Status</th><th className="p-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {list.map((r, i) => <Row key={r.id} r={r} actions={actions} n={i + 1} />)}
          {list.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-slate-500">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
            {role === 'ACCOUNTANT' ? 'Step 1: Verify Member Deposits & Withdrawals' : 'Step 2: Final Authorization of Member Payments'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {role === 'ACCOUNTANT'
              ? 'Match each request to the bank / mobile money statement, then forward to Admin.'
              : 'Approving posts the money to the member’s savings or shares and to the general ledger in one step.'}
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 shrink-0">{actionable.length} awaiting you</span>
      </div>
      <Table list={actionable} actions empty={role === 'ACCOUNTANT' ? 'No member payments awaiting verification.' : 'No verified payments awaiting your authorization.'} />

      {waitingOther.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase text-slate-500">{role === 'ACCOUNTANT' ? 'Verified — awaiting Admin' : 'Submitted — awaiting Accountant verification'}</h4>
          <Table list={waitingOther} actions={false} empty="" />
        </div>
      )}

      <button onClick={() => setShowHistory(v => !v)} className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
        {showHistory ? 'Hide' : 'Show'} processed requests ({history.length})
      </button>
      {showHistory && <Table list={history} actions={false} empty="No processed requests yet." />}
    </div>
  );
}
