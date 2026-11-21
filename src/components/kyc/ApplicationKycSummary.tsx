import React, { useState } from 'react';

/** KYC captured at sign-up, shown on the Secretary / Admin approval cards. */
export default function ApplicationKycSummary({ app }: { app: any }) {
  const [open, setOpen] = useState(false);
  const k = app?.kyc;
  if (!k) return <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">No KYC on this application.</p>;
  const rows: [string, string][] = [
    ['ID', `${k.idType || ''} ${k.idNumber || ''}`.trim()],
    ['Date of birth', k.dateOfBirth || app.dob || ''],
    ['Gender', app.gender || ''],
    ['Nationality', k.nationality || ''],
    ['Lives in', k.countryOfResidence || ''],
    ['Address', k.address || ''],
    ['Occupation', k.occupation || ''],
    ['Source of funds', k.sourceOfFunds || ''],
    ['Next of kin', [k.nextOfKinName, k.nextOfKinRelationship, k.nextOfKinPhone].filter(Boolean).join(' · ')],
  ];
  const images: [string, string | undefined][] = [['ID front', k.idFrontImage], ['ID back', k.idBackImage], ['Selfie with ID', k.selfieImage]];
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs">
      <button type="button" onClick={() => setOpen(o => !o)} className="font-bold text-emerald-600 dark:text-emerald-400">
        {open ? 'Hide KYC' : 'View KYC'} · {k.idType} {k.idNumber}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            {rows.map(([label, value]) => (
              <div key={label}><span className="text-slate-400">{label}:</span> <span className="text-slate-700 dark:text-slate-200 font-medium">{value || '—'}</span></div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {images.filter(([, src]) => !!src && src.startsWith('data:')).map(([label, src]) => (
              <a key={label} href={src} target="_blank" rel="noreferrer" className="block">
                <img src={src} alt={label} className="w-24 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                <span className="block text-[10px] text-slate-400 mt-0.5">{label}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
