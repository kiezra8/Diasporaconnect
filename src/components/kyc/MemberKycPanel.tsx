import React, { useEffect, useState } from 'react';
import { SaccoFarmStore, SaccoMember, KycSubmission } from '../../services/saccoFarmStore';
import { reviewerLabel } from './KycReviewPanel';

/** Shrinks a photo to a small JPEG data URL so several fit in browser storage. */
export function compressImage(file: File, maxSide = 900, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file (JPG or PNG).'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not open the image.'));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Image processing is not supported in this browser.'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const inputCls = 'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500';
const labelCls = 'block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1';

interface Props {
  member: SaccoMember;
  onNotify?: (msg: string) => void;
}

export default function MemberKycPanel({ member, onNotify }: Props) {
  const [latest, setLatest] = useState<KycSubmission | null>(() => SaccoFarmStore.getLatestKyc(member.memberId));
  const [resubmit, setResubmit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [idType, setIdType] = useState<KycSubmission['idType']>('National ID');
  const [idNumber, setIdNumber] = useState(member.nin || '');
  const [dob, setDob] = useState('');
  const [nationality, setNationality] = useState('Ugandan');
  const [residence, setResidence] = useState('');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [sourceOfFunds, setSourceOfFunds] = useState('');
  const [nokName, setNokName] = useState('');
  const [nokRel, setNokRel] = useState('');
  const [nokPhone, setNokPhone] = useState('');
  const [idFront, setIdFront] = useState('');
  const [idBack, setIdBack] = useState('');
  const [selfie, setSelfie] = useState('');
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    const reload = () => setLatest(SaccoFarmStore.getLatestKyc(member.memberId));
    reload();
    window.addEventListener('dc_storage_update', reload);
    return () => window.removeEventListener('dc_storage_update', reload);
  }, [member.memberId]);

  const pick = (setter: (v: string) => void) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError('');
    try {
      setter(await compressImage(f));
    } catch (err: any) {
      setError(err.message || 'Could not use that image.');
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!idFront || !selfie) return setError('Upload the front of your ID and a selfie holding the ID.');
    if (idType !== 'Passport' && !idBack) return setError('Upload the back of your ID.');
    if (!consent) return setError('Please confirm the declaration.');
    setBusy(true);
    const res = SaccoFarmStore.submitKyc({
      memberId: member.memberId,
      memberName: member.name,
      idType,
      idNumber: idNumber.trim(),
      dateOfBirth: dob,
      nationality: nationality.trim(),
      countryOfResidence: residence.trim(),
      address: address.trim(),
      occupation: occupation.trim(),
      sourceOfFunds: sourceOfFunds.trim(),
      nextOfKinName: nokName.trim(),
      nextOfKinRelationship: nokRel.trim(),
      nextOfKinPhone: nokPhone.trim(),
      idFrontImage: idFront,
      idBackImage: idBack || undefined,
      selfieImage: selfie,
    });
    setBusy(false);
    if (!res.success) return setError(res.msg);
    setResubmit(false);
    onNotify?.(res.msg);
  };

  const status = latest?.status || 'NOT_SUBMITTED';
  const showForm = status === 'NOT_SUBMITTED' || (status === 'REJECTED' && resubmit);

  const UploadBox = ({ label, value, onChange, hint }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; hint: string }) => (
    <label className="block cursor-pointer">
      <span className={labelCls}>{label}</span>
      <div className="h-32 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden hover:border-emerald-500 transition">
        {value ? <img src={value} alt={label} className="h-full w-full object-cover" /> : <span className="text-[11px] text-slate-500 px-3 text-center">{hint}</span>}
      </div>
      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onChange} />
    </label>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Verify My Identity (KYC)</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Needed before withdrawals and loans.</p>
      </div>

      <div className={`rounded-2xl p-4 border-2 ${
        status === 'VERIFIED' ? 'border-emerald-500/50 bg-emerald-500/10'
        : status === 'PENDING' ? 'border-amber-500/50 bg-amber-500/10'
        : status === 'REJECTED' ? 'border-rose-500/50 bg-rose-500/10'
        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
        <p className="text-xs font-bold uppercase text-slate-500">KYC Status</p>
        <p className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
          {status === 'VERIFIED' ? '✓ Verified' : status === 'PENDING' ? 'Under review' : status === 'REJECTED' ? '✗ Not approved' : 'Not yet submitted'}
        </p>
        {latest && (
          <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">
            {status === 'PENDING' && (latest.reviewingBy
              ? <>Being reviewed by <strong>{reviewerLabel(latest.reviewingBy, latest.reviewingRole)}</strong></>
              : <>Waiting for the <strong>Secretary</strong> or <strong>Admin</strong></>)}
            {status === 'VERIFIED' && <>Verified by <strong>{reviewerLabel(latest.reviewedBy, latest.reviewedByRole)}</strong></>}
            {status === 'REJECTED' && <>Returned by <strong>{reviewerLabel(latest.reviewedBy, latest.reviewedByRole)}</strong></>}
          </p>
        )}
        {latest && <p className="text-[11px] text-slate-500 mt-0.5">{latest.idType} · {latest.reviewedAt || latest.submittedAt}</p>}
        {status === 'REJECTED' && latest?.rejectionReason && <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-1">Reason: {latest.rejectionReason}</p>}
        {status === 'REJECTED' && !resubmit && (
          <button onClick={() => setResubmit(true)} className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">Submit again</button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">1. Identity document</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Document Type *</label>
                <select value={idType} onChange={e => setIdType(e.target.value as any)} className={inputCls}>
                  <option>National ID</option><option>Passport</option><option>Driving Permit</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>{idType === 'National ID' ? 'NIN' : 'Document Number'} *</label>
                <input required value={idNumber} onChange={e => setIdNumber(e.target.value)} className={`${inputCls} font-mono uppercase`} />
              </div>
              <div>
                <label className={labelCls}>Date of Birth *</label>
                <input required type="date" value={dob} onChange={e => setDob(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Nationality *</label>
                <input required value={nationality} onChange={e => setNationality(e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">2. Residence &amp; income</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Country of Residence *</label>
                <input required value={residence} onChange={e => setResidence(e.target.value)} className={inputCls} />
              </div>
              <div className="lg:col-span-2">
                <label className={labelCls}>Residential Address *</label>
                <input required value={address} onChange={e => setAddress(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Occupation *</label>
                <input required value={occupation} onChange={e => setOccupation(e.target.value)} className={inputCls} />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <label className={labelCls}>Source of Funds *</label>
                <input required value={sourceOfFunds} onChange={e => setSourceOfFunds(e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">3. Next of kin</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className={labelCls}>Full Name *</label><input required value={nokName} onChange={e => setNokName(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Relationship *</label><input required value={nokRel} onChange={e => setNokRel(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Phone *</label><input required value={nokPhone} onChange={e => setNokPhone(e.target.value)} className={inputCls} /></div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">4. Photos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <UploadBox label="ID — Front *" value={idFront} onChange={pick(setIdFront)} hint="Tap to photograph or upload the front of your ID" />
              <UploadBox label={`ID — Back${idType === 'Passport' ? '' : ' *'}`} value={idBack} onChange={pick(setIdBack)} hint={idType === 'Passport' ? 'Optional for passports' : 'Tap to photograph or upload the back'} />
              <UploadBox label="Selfie holding your ID *" value={selfie} onChange={pick(setSelfie)} hint="Your face and the ID must both be clearly visible" />
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" />
            <span>I confirm the information and documents are true and belong to me, and I consent to Diaspora Connect SACCO verifying them.</span>
          </label>

          {error && <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2">
            {resubmit && <button type="button" onClick={() => setResubmit(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">Cancel</button>}
            <button type="submit" disabled={busy} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg">
              {busy ? 'Submitting…' : 'SUBMIT FOR VERIFICATION'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
