import React, { useEffect, useState } from 'react';
import { SaccoFarmStore, TASK_CATALOG, StaffUser, TaskAssignment } from '../../services/saccoFarmStore';

interface Props { onNotify?: (msg: string) => void }

const ROLES = ['ADMIN', 'ACCOUNTANT', 'SECRETARY', 'BOARD_MEMBER', 'FARM_WORKER'];
const input = 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500';

/** Admin chooses which staff member does each SACCO and farm task. */
export default function TaskAssignmentsPanel({ onNotify }: Props) {
  const [staff, setStaff] = useState<StaffUser[]>(() => SaccoFarmStore.getStaff());
  const [assignments, setAssignments] = useState<TaskAssignment[]>(() => SaccoFarmStore.getTaskAssignments());
  const [area, setArea] = useState<'SACCO' | 'Farm'>('SACCO');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('ACCOUNTANT');

  useEffect(() => {
    const r = () => { setStaff(SaccoFarmStore.getStaff()); setAssignments(SaccoFarmStore.getTaskAssignments()); };
    window.addEventListener('dc_storage_update', r);
    return () => window.removeEventListener('dc_storage_update', r);
  }, []);

  const toggle = (taskId: string, email: string) => {
    const a = assignments.find(x => x.taskId === taskId);
    const current = a?.assigneeEmails || [];
    const next = current.includes(email) ? current.filter(e => e !== email) : [...current, email];
    SaccoFarmStore.saveTaskAssignment(taskId, next, a?.notes, a?.dueRule);
  };

  const saveMeta = (taskId: string, field: 'notes' | 'dueRule', value: string) => {
    const a = assignments.find(x => x.taskId === taskId);
    SaccoFarmStore.saveTaskAssignment(taskId, a?.assigneeEmails || [], field === 'notes' ? value : a?.notes, field === 'dueRule' ? value : a?.dueRule);
  };

  const addStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    SaccoFarmStore.saveStaffUser({ name: newName.trim(), email: newEmail.trim(), phone: newPhone.trim() || undefined, role: newRole, active: true });
    onNotify?.(`${newName} added to staff. Assign them tasks below.`);
    setNewName(''); setNewEmail(''); setNewPhone('');
  };

  const activeStaff = staff.filter(s => s.active);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
      <div>
        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Task Assignments</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">Choose who does each job. Only the people ticked (and the Admin) can perform that task; it appears under “My Tasks” in their portal.</p>
      </div>

      <form onSubmit={addStaff} className="grid grid-cols-1 sm:grid-cols-5 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <input required placeholder="Staff name" value={newName} onChange={e => setNewName(e.target.value)} className={input} />
        <input required type="email" placeholder="Email (their login)" value={newEmail} onChange={e => setNewEmail(e.target.value)} className={input} />
        <input placeholder="Phone (SMS)" value={newPhone} onChange={e => setNewPhone(e.target.value)} className={input} />
        <select value={newRole} onChange={e => setNewRole(e.target.value)} className={input}>{ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}</select>
        <button type="submit" className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">ADD STAFF</button>
      </form>

      <div className="flex gap-1.5">
        {(['SACCO', 'Farm'] as const).map(a => (
          <button key={a} onClick={() => setArea(a)} className={`px-4 py-1.5 rounded-xl text-xs font-extrabold ${area === a ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>{a} tasks</button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800/50">
            <tr><th className="py-2 px-3 uppercase text-[11px] dark:text-slate-300 w-10">#</th>
              <th className="text-left py-2 px-3 font-bold uppercase text-[11px] text-slate-700 dark:text-slate-300">Task</th>
              {activeStaff.map(s => (
                <th key={s.id} className="py-2 px-2 text-center font-bold text-[10px] text-slate-700 dark:text-slate-300 min-w-[90px]">
                  {s.name.split(' ').slice(-1)[0]}<span className="block font-normal text-slate-500">{s.role.replace('_', ' ')}</span>
                </th>
              ))}
              <th className="text-left py-2 px-3 font-bold uppercase text-[11px] text-slate-700 dark:text-slate-300">Schedule / Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {TASK_CATALOG.filter(t => t.area === area).map((t, __n) => {
              const a = assignments.find(x => x.taskId === t.id);
              return (
                <tr key={t.id}><td className="py-2 px-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                  <td className="py-2 px-3">
                    <p className="font-bold text-slate-900 dark:text-white">{t.label}</p>
                    <p className="text-[10px] text-slate-500">{t.description}</p>
                    {(a?.assigneeEmails.length || 0) === 0 && <p className="text-[10px] font-bold text-rose-600">Nobody assigned — only Admin can do this</p>}
                  </td>
                  {activeStaff.map(s => (
                    <td key={s.id} className="py-2 px-2 text-center">
                      <input
                        type="checkbox"
                        aria-label={`${s.name} does ${t.label}`}
                        checked={s.role === 'ADMIN' || !!a?.assigneeEmails.includes(s.email)}
                        disabled={s.role === 'ADMIN'}
                        onChange={() => toggle(t.id, s.email)}
                        className="w-4 h-4 accent-emerald-600"
                      />
                    </td>
                  ))}
                  <td className="py-2 px-3 space-y-1 min-w-[200px]">
                    <input defaultValue={a?.dueRule || ''} onBlur={e => e.target.value !== (a?.dueRule || '') && saveMeta(t.id, 'dueRule', e.target.value)} placeholder="When (e.g. daily by 9am)" className={`${input} w-full py-1.5`} />
                    <input defaultValue={a?.notes || ''} onBlur={e => e.target.value !== (a?.notes || '') && saveMeta(t.id, 'notes', e.target.value)} placeholder="Notes" className={`${input} w-full py-1.5`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
