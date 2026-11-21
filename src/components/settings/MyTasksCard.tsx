import React, { useEffect, useState } from 'react';
import { SaccoFarmStore, Actor } from '../../services/saccoFarmStore';

/** Shows a staff member the tasks the Admin has assigned to them. */
export default function MyTasksCard({ actor, compact = false }: { actor: Actor; compact?: boolean }) {
  const [tasks, setTasks] = useState(() => SaccoFarmStore.getMyTasks(actor));
  useEffect(() => {
    const r = () => setTasks(SaccoFarmStore.getMyTasks(actor));
    r();
    window.addEventListener('dc_storage_update', r);
    return () => window.removeEventListener('dc_storage_update', r);
  }, [actor.email, actor.role]);

  if (compact) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-extrabold text-slate-900 dark:text-white mr-1">My Tasks</span>
        {tasks.length === 0
          ? <span className="text-xs text-slate-500">None assigned</span>
          : tasks.map((t, i) => (
            <span key={t.id} title={t.description} className="text-[11px] font-bold px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
              {i + 1}. {t.label}
            </span>
          ))}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">My Tasks</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Assigned to you by the Administrator</p>
      {tasks.length === 0 ? (
        <p className="text-xs text-slate-500">No tasks are assigned to you yet.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {tasks.map(t => (
            <li key={t.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">{t.label}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">{t.area}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">{t.description}</p>
              {t.assignment.dueRule && <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 mt-1">When: {t.assignment.dueRule}</p>}
              {t.assignment.notes && <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{t.assignment.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
