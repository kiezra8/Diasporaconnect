import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';
import { supabase } from '../services/supabase';
import { compressImage } from '../components/kyc/MemberKycPanel';
import { ArrowLeft, Camera, CheckCircle2, Mail, Clock } from 'lucide-react';

// One step per page: /signup/details → id → kin → photos → password → verify → done
const STEPS = [
  { slug: 'details',  title: 'About you',         sub: 'Your basic details.' },
  { slug: 'id',       title: 'Your ID',           sub: 'As shown on your document.' },
  { slug: 'kin',      title: 'Next of kin',       sub: 'Someone we can contact.' },
  { slug: 'photos',   title: 'Photos',            sub: 'Clear, well-lit pictures.' },
  { slug: 'password', title: 'Create a password', sub: 'At least 10 characters, with letters and numbers.' },
];

const inputCls = 'w-full px-4 py-3.5 rounded-2xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500';
const labelCls = 'block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5';

export default function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { step = 'details' } = useParams();

  // signed in but application not finished (sent here from the sign-in page)
  const [complete] = useState(() => location.state?.complete ? location.state : null);
  const steps = complete ? STEPS.filter(s => s.slug !== 'password') : STEPS;

  const [f, setF] = useState({
    fullName: complete?.fullName || '', email: complete?.email || '', phone: '', dob: '', gender: '', chapter: 'UK Diaspora Chapter', photoUrl: '',
    idType: 'National ID', idNumber: '', nationality: 'Ugandan', residence: '', address: '', occupation: '', sourceOfFunds: '',
    nokName: '', nokRel: '', nokPhone: '',
    idFront: '', idBack: '', selfie: '', consent: false,
    password: '', confirm: '',
  });
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e }));
  const [code, setCode] = useState('');
  const [appId, setAppId] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const index = steps.findIndex(s => s.slug === step);
  const current = steps[index];

  // a page opened directly (or after a reload) starts again from the first step
  useEffect(() => {
    setError(''); setNote('');
    window.scrollTo(0, 0);
    if (index < 0 && step !== 'verify' && step !== 'done') navigate('/signup/details', { replace: true });
    if (index > 0 && !f.fullName) navigate('/signup/details', { replace: true });
    if ((step === 'verify' || step === 'done') && !f.email) navigate('/signup/details', { replace: true });
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (k) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try { const url = await compressImage(file); setF(p => ({ ...p, [k]: url })); } catch (err) { setError(err.message || 'Could not use that image.'); }
  };

  const problem = (slug) => {
    if (slug === 'details') {
      if (!f.fullName.trim() || !f.email.trim() || !f.phone.trim() || !f.dob || !f.gender) return 'Fill in every field.';
      if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return 'Enter a valid email address.';
      if (!((Date.now() - new Date(f.dob).getTime()) / (365.25 * 86400000) >= 18)) return 'Members must be 18 or older.';
    }
    if (slug === 'id' && [f.idNumber, f.nationality, f.residence, f.address, f.occupation, f.sourceOfFunds].some(v => !v.trim())) return 'Fill in every field.';
    if (slug === 'kin' && [f.nokName, f.nokRel, f.nokPhone].some(v => !v.trim())) return 'Fill in every field.';
    if (slug === 'photos') {
      if (!f.idFront) return 'Add the front of your ID.';
      if (!f.selfie) return 'Add a selfie holding your ID.';
      if (!f.consent) return 'Tick the box to confirm.';
    }
    if (slug === 'password') {
      if (f.password.length < 10 || !/[A-Za-z]/.test(f.password) || !/[0-9]/.test(f.password)) return 'Use at least 10 characters, with letters and numbers.';
      if (f.password !== f.confirm) return 'The passwords do not match.';
    }
    return '';
  };

  const application = () => ({
    fullName: f.fullName.trim(), email: f.email.trim().toLowerCase(), phone: f.phone.trim(), dob: f.dob, gender: f.gender, chapter: f.chapter,
    photoUrl: f.photoUrl || f.selfie,
    kyc: {
      idType: f.idType, idNumber: f.idNumber.trim(), dateOfBirth: f.dob, nationality: f.nationality.trim(), countryOfResidence: f.residence.trim(),
      address: f.address.trim(), occupation: f.occupation.trim(), sourceOfFunds: f.sourceOfFunds.trim(),
      nextOfKinName: f.nokName.trim(), nextOfKinRelationship: f.nokRel.trim(), nextOfKinPhone: f.nokPhone.trim(),
      idFrontImage: f.idFront, idBackImage: f.idBack || undefined, selfieImage: f.selfie,
    },
  });

  const next = async (e) => {
    e.preventDefault();
    setError('');
    const p = problem(step);
    if (p) return setError(p);
    const last = index === steps.length - 1;
    if (!last) return navigate(`/signup/${steps[index + 1].slug}`);

    for (const s of steps) { const q = problem(s.slug); if (q) { navigate(`/signup/${s.slug}`); return setError(q); } }
    setBusy(true);
    try {
      if (complete) {
        const id = await api.submitApplication(complete.userId, application());
        await supabase.auth.signOut();
        setAppId(id);
        navigate('/signup/done');
      } else {
        const res = await api.signUpMember(application(), f.password);
        setAppId(res.applicationId);
        setF(p => ({ ...p, password: '', confirm: '' }));
        navigate(res.needsEmailConfirmation ? '/signup/verify' : '/signup/done');
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try { await api.confirmEmail(f.email, code); navigate('/signup/done'); }
    catch (err) { setError(err?.message || 'Could not confirm the code.'); }
    finally { setBusy(false); }
  };

  const resend = async () => {
    setError(''); setNote('');
    try { await api.resendConfirmation(f.email); setNote('New code sent.'); } catch (err) { setError(err?.message || 'Could not send a new code.'); }
  };

  const field = (label, k, props = {}) => (
    <div className={props.wide ? 'sm:col-span-2' : ''}>
      <label className={labelCls}>{label}</label>
      <input value={f[k]} onChange={set(k)} className={inputCls} {...props} wide={undefined} />
    </div>
  );
  const select = (label, k, options) => (
    <div>
      <label className={labelCls}>{label}</label>
      <select value={f[k]} onChange={set(k)} className={inputCls}>
        {options.map(o => <option key={o} value={o === 'Select' ? '' : o}>{o}</option>)}
      </select>
    </div>
  );
  const photo = (label, k, optional) => (
    <label className="block cursor-pointer">
      <span className={labelCls}>{label}{optional ? ' (optional)' : ''}</span>
      <div className="h-36 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden hover:border-emerald-500 transition">
        {f[k] ? <img src={f[k]} alt={label} className="h-full w-full object-cover" /> : <Camera className="w-7 h-7 text-slate-400" />}
      </div>
      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={pick(k)} />
    </label>
  );

  const total = steps.length;
  const progress = step === 'verify' || step === 'done' ? 100 : Math.round(((index + 1) / total) * 100);
  const btn = 'w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold text-sm transition disabled:opacity-60';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      {/* top bar */}
      <header className="px-5 pt-5 pb-3 max-w-xl w-full mx-auto">
        <div className="flex items-center justify-between">
          {index > 0 && step !== 'verify' && step !== 'done'
            ? <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white" aria-label="Back"><ArrowLeft className="w-5 h-5" /></button>
            : <Link to="/signin" className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white" aria-label="Back to sign in"><ArrowLeft className="w-5 h-5" /></Link>}
          <img src="/images/logo.jpg" alt="Diaspora Connect" className="w-9 h-9 rounded-xl object-cover" />
          <span className="text-xs font-bold text-slate-400 w-9 text-right">{current ? `${index + 1}/${total}` : ''}</span>
        </div>
        <div className="mt-4 h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main key={step} className="dc-step-in flex-1 flex flex-col px-5 pb-8 max-w-xl w-full mx-auto">
        {current && (
          <form onSubmit={next} className="flex-1 flex flex-col">
            <div className="pt-6 pb-6">
              <h1 className="text-3xl font-black tracking-tight">{current.title}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{current.sub}</p>
            </div>

            <div className="flex-1 space-y-4">
              {step === 'details' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {field('Full name', 'fullName', { autoComplete: 'name', wide: true })}
                  {field('Email', 'email', { type: 'email', autoComplete: 'email', disabled: !!complete })}
                  {field('Phone', 'phone', { type: 'tel', autoComplete: 'tel' })}
                  {field('Date of birth', 'dob', { type: 'date' })}
                  {select('Gender', 'gender', ['Select', 'Female', 'Male'])}
                  <div className="sm:col-span-2">
                    {select('Chapter', 'chapter', ['UK Diaspora Chapter', 'USA Diaspora Chapter', 'Europe Diaspora Chapter', 'Middle East Diaspora Chapter', 'Uganda (Home) Chapter', 'Other'])}
                  </div>
                </div>
              )}

              {step === 'id' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {select('ID type', 'idType', ['National ID', 'Passport', 'Driving Permit'])}
                  {field('ID number', 'idNumber')}
                  {field('Nationality', 'nationality')}
                  {field('Country you live in', 'residence')}
                  {field('Home address', 'address', { wide: true, autoComplete: 'street-address' })}
                  {field('Occupation', 'occupation')}
                  {field('Source of funds', 'sourceOfFunds', { placeholder: 'e.g. salary, business' })}
                </div>
              )}

              {step === 'kin' && (
                <div className="grid grid-cols-1 gap-4">
                  {field('Name', 'nokName')}
                  {field('Relationship', 'nokRel', { placeholder: 'e.g. sister' })}
                  {field('Phone', 'nokPhone', { type: 'tel' })}
                </div>
              )}

              {step === 'photos' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {photo('ID front', 'idFront')}
                    {photo('ID back', 'idBack', true)}
                  </div>
                  {photo('Selfie holding your ID', 'selfie')}
                  <label className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300 cursor-pointer pt-2">
                    <input type="checkbox" checked={f.consent} onChange={set('consent')} className="mt-1 w-4 h-4 accent-emerald-600" />
                    <span>My details are true and may be checked.</span>
                  </label>
                </div>
              )}

              {step === 'password' && (
                <div className="grid grid-cols-1 gap-4">
                  {field('Password', 'password', { type: 'password', autoComplete: 'new-password' })}
                  {field('Confirm password', 'confirm', { type: 'password', autoComplete: 'new-password' })}
                </div>
              )}
            </div>

            {error && <p className="mt-5 text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
            <div className="pt-6">
              <button type="submit" disabled={busy} className={btn}>
                {busy ? 'Please wait…' : index === total - 1 ? 'Submit' : 'Continue'}
              </button>
              {index === 0 && (
                <p className="text-center text-sm text-slate-500 mt-4">
                  Have an account? <Link to="/signin" className="font-bold text-emerald-600 dark:text-emerald-400">Sign in</Link>
                </p>
              )}
            </div>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={verify} className="flex-1 flex flex-col">
            <div className="pt-6 pb-6">
              <Mail className="w-10 h-10 text-emerald-600 mb-4" />
              <h1 className="text-3xl font-black tracking-tight">Check your email</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">We sent a 6-digit code to <strong className="text-slate-700 dark:text-slate-200">{f.email}</strong>.</p>
            </div>
            <div className="flex-1">
              <input type="text" inputMode="numeric" maxLength={6} required autoFocus autoComplete="one-time-code" placeholder="000000"
                value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full text-center font-mono text-3xl font-bold tracking-[10px] py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <div className="flex justify-between text-sm mt-4">
                <button type="button" onClick={resend} className="font-bold text-emerald-600 dark:text-emerald-400">Send a new code</button>
                <button type="button" onClick={() => navigate('/signup/done')} className="text-slate-500">I used the link</button>
              </div>
              {note && <p className="mt-4 text-sm font-semibold text-emerald-600">{note}</p>}
            </div>
            {error && <p className="mt-5 text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
            <div className="pt-6"><button type="submit" disabled={busy || code.length !== 6} className={btn}>{busy ? 'Checking…' : 'Confirm'}</button></div>
          </form>
        )}

        {step === 'done' && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 flex items-center justify-center mb-5">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-black tracking-tight">Application sent</h1>
              {appId && <p className="text-sm font-mono text-slate-500 mt-2">{appId}</p>}
              <div className="mt-8 w-full max-w-sm space-y-2 text-left">
                {[['Details and KYC', true], ['Secretary review', false], ['Admin approval', false]].map(([label, done]) => (
                  <div key={label} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm">
                    {done ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Clock className="w-5 h-5 text-amber-500" />}
                    <span className="font-semibold">{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-6">We'll let you know when you can sign in.</p>
            </div>
            <div className="pt-6"><Link to="/signin" className={`${btn} block text-center`}>Back to sign in</Link></div>
          </div>
        )}
      </main>
    </div>
  );
}
