import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, AuthFlowError } from '../services/api';
import { supabase } from '../services/supabase';
import { compressImage } from '../components/kyc/MemberKycPanel';
import { Sun, Moon, CheckCircle2, Clock, Camera, ShieldCheck, User, KeyRound } from 'lucide-react';

const STEPS = [
  { n: 1, label: 'Personal', icon: User },
  { n: 2, label: 'KYC', icon: ShieldCheck },
  { n: 3, label: 'Password', icon: KeyRound },
];

export default function SignIn() {
  const navigate = useNavigate();
  const [themeMode, setThemeMode] = useState('white');
  // signin | signup | complete (signed in, application not finished) | verify | pending_approval
  const [mode, setMode] = useState('signin');
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  // personal details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [chapter, setChapter] = useState('UK Diaspora Chapter');
  const [photoUrl, setPhotoUrl] = useState('');
  // KYC
  const [idType, setIdType] = useState('National ID');
  const [idNumber, setIdNumber] = useState('');
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
  // account
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingUserId, setPendingUserId] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeRegApp, setActiveRegApp] = useState(null);

  const isDark = themeMode === 'dark';
  const inputStyle = { backgroundColor: isDark ? '#020617' : '#f8fafc', borderColor: isDark ? '#334155' : '#cbd5e1', color: isDark ? '#ffffff' : '#0f172a' };
  const labelStyle = { color: isDark ? '#cbd5e1' : '#475569' };
  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 border';
  const btnCls = 'w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold text-xs transition shadow-lg shadow-emerald-600/20 disabled:opacity-60';

  const resetMessages = () => { setErrorMessage(''); setSuccessMessage(''); };

  const pickImage = (setter, maxSide = 900) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage('');
    try { setter(await compressImage(file, maxSide)); } catch (err) { setErrorMessage(err.message || 'Could not use that image.'); }
  };

  const buildApplication = () => ({
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    dob,
    gender,
    chapter,
    photoUrl: photoUrl || selfie,
    kyc: {
      idType, idNumber: idNumber.trim(), dateOfBirth: dob, nationality: nationality.trim(), countryOfResidence: residence.trim(),
      address: address.trim(), occupation: occupation.trim(), sourceOfFunds: sourceOfFunds.trim(),
      nextOfKinName: nokName.trim(), nextOfKinRelationship: nokRel.trim(), nextOfKinPhone: nokPhone.trim(),
      idFrontImage: idFront, idBackImage: idBack || undefined, selfieImage: selfie,
    },
  });

  // ── Sign in ───────────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    setBusy(true);
    try {
      const res = await api.login(email, password);
      navigate(res.redirectTo);
    } catch (err) {
      if (err instanceof AuthFlowError) {
        if (err.code === 'EMAIL_NOT_CONFIRMED') { setMode('verify'); setErrorMessage(err.message); }
        else if (err.code === 'APPLICATION_PENDING') { setActiveRegApp(err.extra.application); setMode('pending_approval'); }
        else if (err.code === 'APPLICATION_REJECTED') setErrorMessage(err.message);
        else if (err.code === 'NO_APPLICATION') {
          setPendingUserId(err.extra.userId);
          setEmail(err.extra.email || email);
          if (err.extra.fullName) setFullName(err.extra.fullName);
          setStep(1);
          setMode('complete');
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage(err?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setBusy(false);
    }
  };

  // ── Sign up: step checks (KYC must be complete before the account is created) ──
  const validateStep = (n) => {
    if (n === 1) {
      if (!fullName.trim() || !email.trim() || !phone.trim() || !dob || !gender) return 'Fill in your name, email, phone, date of birth and gender.';
      const age = (Date.now() - new Date(dob).getTime()) / (365.25 * 86400000);
      if (!(age >= 18)) return 'Members must be at least 18 years old.';
    }
    if (n === 2) {
      if (!idNumber.trim() || !nationality.trim() || !residence.trim() || !address.trim() || !occupation.trim() || !sourceOfFunds.trim()) return 'Fill in every identity and address field.';
      if (!nokName.trim() || !nokRel.trim() || !nokPhone.trim()) return 'Add your next of kin (name, relationship and phone).';
      if (!idFront) return 'Upload a photo of the front of your ID.';
      if (!selfie) return 'Upload a selfie holding your ID.';
      if (!consent) return 'Confirm that the information is true.';
    }
    if (n === 3) {
      if (password.length < 8) return 'Password must be at least 8 characters long.';
      if (password !== confirmPassword) return 'Passwords do not match. Please re-enter.';
    }
    return '';
  };

  const nextStep = (e) => {
    e.preventDefault();
    resetMessages();
    const problem = validateStep(step);
    if (problem) return setErrorMessage(problem);
    // a signed-in applicant finishing their application has no password step
    if (mode === 'complete' && step === 2) return submitCompletion();
    if (step < 3) return setStep(step + 1);
    submitSignUp();
  };

  const submitSignUp = async () => {
    for (const n of [1, 2, 3]) { const p = validateStep(n); if (p) { setStep(n); return setErrorMessage(p); } }
    setBusy(true);
    try {
      const app = buildApplication();
      const res = await api.signUpMember(app, password);
      setActiveRegApp({ ...app, id: res.applicationId, secretaryApproved: false, adminApproved: false });
      setPassword('');
      setConfirmPassword('');
      if (res.needsEmailConfirmation) {
        setMode('verify');
        setSuccessMessage(`Application ${res.applicationId} received. We sent a confirmation code to ${app.email}.`);
      } else {
        setMode('pending_approval');
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Sign up failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitCompletion = async () => {
    for (const n of [1, 2]) { const p = validateStep(n); if (p) { setStep(n); return setErrorMessage(p); } }
    setBusy(true);
    try {
      const app = buildApplication();
      const id = await api.submitApplication(pendingUserId, app);
      await supabase.auth.signOut();
      setActiveRegApp({ ...app, id, secretaryApproved: false, adminApproved: false });
      setMode('pending_approval');
    } catch (err) {
      setErrorMessage(err?.message || 'Could not submit your application.');
    } finally {
      setBusy(false);
    }
  };

  // ── Email confirmation ────────────────────────────────────────────────────
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    setBusy(true);
    try {
      await api.confirmEmail(email, verificationCode);
      if (activeRegApp) setMode('pending_approval');
      else { setMode('signin'); setSuccessMessage('Email confirmed. Sign in with your password.'); }
    } catch (err) {
      setErrorMessage(err?.message || 'Could not confirm your email.');
    } finally {
      setBusy(false);
    }
  };

  const handleResendCode = async () => {
    resetMessages();
    try {
      await api.resendConfirmation(email);
      setSuccessMessage(`New code sent to ${email}.`);
    } catch (err) {
      setErrorMessage(err?.message || 'Could not send a new code.');
    }
  };

  const field = (label, value, setter, props = {}) => (
    <div className={props.wide ? 'col-span-2' : ''}>
      <label className="block text-xs font-bold mb-1" style={labelStyle}>{label}</label>
      <input value={value} onChange={(e) => setter(e.target.value)} className={inputCls} style={inputStyle} {...props} wide={undefined} />
    </div>
  );

  const upload = (label, value, setter, hint) => (
    <div>
      <label className="block text-xs font-bold mb-1" style={labelStyle}>{label}</label>
      <div className="flex items-center gap-3 p-2.5 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5">
        {value
          ? <img src={value} alt="" className="w-12 h-12 rounded-lg object-cover border-2 border-emerald-500 shrink-0" />
          : <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0"><Camera className="w-5 h-5" /></div>}
        <div className="flex-1 min-w-0">
          <input type="file" accept="image/*" onChange={pickImage(setter)} className="w-full text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white cursor-pointer" />
          {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
        </div>
      </div>
    </div>
  );

  const stepCount = mode === 'complete' ? 2 : 3;

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4 transition-colors duration-300 font-sans"
      style={{ backgroundColor: isDark ? '#020617' : '#f8fafc', color: isDark ? '#f1f5f9' : '#0f172a' }}
    >
      {/* Theme switcher */}
      <div className="fixed top-5 right-5 z-20 flex items-center gap-1.5 p-1 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-lg backdrop-blur">
        <button type="button" onClick={() => setThemeMode('white')} title="Switch to White Background"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${!isDark ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
          <Sun className="w-3.5 h-3.5" /><span>Light</span>
        </button>
        <button type="button" onClick={() => setThemeMode('dark')} title="Switch to Dark Background"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${isDark ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
          <Moon className="w-3.5 h-3.5" /><span>Dark</span>
        </button>
      </div>

      <div
        className={`relative z-10 w-full ${mode === 'signup' || mode === 'complete' ? 'max-w-lg' : 'max-w-md'} p-6 sm:p-8 rounded-3xl transition-all duration-300 shadow-2xl border`}
        style={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0' }}
      >
        <div className="flex flex-col items-center text-center mb-6">
          <img src="/images/logo.jpg" alt="Diaspora Connect" className="w-16 h-16 object-cover rounded-2xl mb-1 shadow-md" />
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl text-xs font-medium border"
            style={{ backgroundColor: isDark ? '#450a0a' : '#fef2f2', borderColor: isDark ? '#7f1d1d' : '#fecaca', color: isDark ? '#fca5a5' : '#991b1b' }}>
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl text-xs font-medium border"
            style={{ backgroundColor: isDark ? '#052e16' : '#f0fdf4', borderColor: isDark ? '#166534' : '#bbf7d0', color: isDark ? '#86efac' : '#166534' }}>
            {successMessage}
          </div>
        )}

        {/* ── 1. SIGN IN ── */}
        {mode === 'signin' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {field('Email Address', email, setEmail, { type: 'email', required: true, autoComplete: 'email' })}
            {field('Password', password, setPassword, { type: 'password', required: true, autoComplete: 'current-password' })}
            <button type="submit" disabled={busy} className={btnCls}>{busy ? 'Signing in…' : 'Sign In'}</button>
            <div className="pt-2 text-center text-xs text-slate-500">
              Don't have an account?{' '}
              <button type="button" onClick={() => { setMode('signup'); setStep(1); resetMessages(); }}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">Sign Up</button>
            </div>
          </form>
        )}

        {/* ── 2. SIGN UP (personal → KYC → password) ── */}
        {(mode === 'signup' || mode === 'complete') && (
          <form onSubmit={nextStep} className="space-y-4">
            <div className="text-center">
              <h3 className="text-sm font-extrabold" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>
                {mode === 'complete' ? 'Finish your membership application' : 'Become a member'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">KYC is required. Your account is created only when every step is complete.</p>
            </div>

            {/* step indicator */}
            <div className="flex items-center justify-center gap-2">
              {STEPS.slice(0, stepCount).map(({ n, label, icon: Icon }) => (
                <div key={n} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${step === n ? 'bg-emerald-600 text-white' : step > n ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    {step > n ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                    <span>{n}. {label}</span>
                  </div>
                  {n < stepCount && <span className="w-4 h-px bg-slate-300 dark:bg-slate-700" />}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {field('Full Name', fullName, setFullName, { required: true, placeholder: 'David Mukasa', wide: true })}
                {field('Email Address', email, setEmail, { type: 'email', required: true, autoComplete: 'email', placeholder: 'you@example.com', disabled: mode === 'complete' })}
                {field('Phone Number', phone, setPhone, { type: 'tel', required: true, placeholder: '0772 123 456' })}
                {field('Date of Birth', dob, setDob, { type: 'date', required: true })}
                <div>
                  <label className="block text-xs font-bold mb-1" style={labelStyle}>Gender</label>
                  <select required value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls} style={inputStyle}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold mb-1" style={labelStyle}>Chapter / Region</label>
                  <select value={chapter} onChange={(e) => setChapter(e.target.value)} className={inputCls} style={inputStyle}>
                    {['UK Diaspora Chapter', 'USA Diaspora Chapter', 'Europe Diaspora Chapter', 'Middle East Diaspora Chapter', 'Uganda (Home) Chapter', 'Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-2">{upload('Profile Photo (optional)', photoUrl, setPhotoUrl, 'Clear photo showing your full face')}</div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1" style={labelStyle}>ID Type</label>
                    <select value={idType} onChange={(e) => setIdType(e.target.value)} className={inputCls} style={inputStyle}>
                      <option>National ID</option><option>Passport</option><option>Driving Permit</option>
                    </select>
                  </div>
                  {field('ID / Passport Number', idNumber, setIdNumber, { required: true })}
                  {field('Nationality', nationality, setNationality, { required: true })}
                  {field('Country of Residence', residence, setResidence, { required: true, placeholder: 'United Kingdom' })}
                  {field('Home Address', address, setAddress, { required: true, wide: true })}
                  {field('Occupation', occupation, setOccupation, { required: true })}
                  {field('Source of Funds', sourceOfFunds, setSourceOfFunds, { required: true, placeholder: 'Salary, business…' })}
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pt-1">Next of kin</p>
                <div className="grid grid-cols-3 gap-3">
                  {field('Name', nokName, setNokName, { required: true })}
                  {field('Relationship', nokRel, setNokRel, { required: true })}
                  {field('Phone', nokPhone, setNokPhone, { required: true, type: 'tel' })}
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pt-1">Documents</p>
                {upload('Front of ID *', idFront, setIdFront)}
                {upload('Back of ID (optional)', idBack, setIdBack)}
                {upload('Selfie holding your ID *', selfie, setSelfie, 'Face and ID both clearly visible')}
                <label className="flex items-start gap-2 text-[11px] text-slate-500 cursor-pointer">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-emerald-600" />
                  <span>I confirm this information is true and agree that Diaspora Connect SACCO may verify it.</span>
                </label>
              </div>
            )}

            {step === 3 && mode === 'signup' && (
              <div className="space-y-3">
                {field('Password', password, setPassword, { type: 'password', required: true, autoComplete: 'new-password', placeholder: 'At least 8 characters' })}
                {field('Confirm Password', confirmPassword, setConfirmPassword, { type: 'password', required: true, autoComplete: 'new-password' })}
              </div>
            )}

            <div className="flex gap-2">
              {step > 1 && (
                <button type="button" onClick={() => { resetMessages(); setStep(step - 1); }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">&larr; Back</button>
              )}
              <button type="submit" disabled={busy} className={btnCls}>
                {busy ? 'Submitting…' : step < stepCount ? 'Continue →' : 'Submit Application'}
              </button>
            </div>

            <div className="pt-1 text-center text-xs text-slate-500">
              Already have an account?{' '}
              <button type="button" onClick={async () => { if (mode === 'complete') await supabase.auth.signOut(); setMode('signin'); resetMessages(); }}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">Sign In</button>
            </div>
          </form>
        )}

        {/* ── 3. EMAIL CONFIRMATION ── */}
        {mode === 'verify' && (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-sm font-extrabold" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Confirm Email</h3>
              <p className="text-xs text-slate-500">Enter the 6-digit code sent to <strong>{email}</strong>, or open the link in that email.</p>
            </div>
            <input type="text" inputMode="numeric" maxLength={6} required autoComplete="one-time-code" placeholder="000000"
              value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center font-mono text-xl font-bold tracking-[6px] py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500"
              style={{ backgroundColor: isDark ? '#020617' : '#f8fafc', borderColor: isDark ? '#334155' : '#cbd5e1', color: isDark ? '#34d399' : '#059669' }} />
            <button type="submit" disabled={busy} className={btnCls}>{busy ? 'Checking…' : 'Confirm Email'}</button>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <button type="button" onClick={handleResendCode} className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">Resend Code</button>
              <button type="button" onClick={() => { resetMessages(); setMode(activeRegApp ? 'pending_approval' : 'signin'); }} className="hover:underline">
                {activeRegApp ? 'I used the link →' : '← Back'}
              </button>
            </div>
          </form>
        )}

        {/* ── 4. PENDING APPROVAL (SECRETARY & ADMIN) ── */}
        {mode === 'pending_approval' && (
          <div className="space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                Application Submitted &bull; Pending Dual Approval
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mt-2">Awaiting Official Review</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Your application and KYC are with the <strong>Secretary</strong> and <strong>Admin</strong>. Once both approve, sign in with your email and password.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Applicant Name:</span><span className="font-extrabold text-slate-900 dark:text-white">{activeRegApp?.fullName || fullName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Registered Email:</span><span className="font-mono font-bold text-slate-900 dark:text-white">{activeRegApp?.email || email}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Chapter / Region:</span><span className="font-bold text-emerald-600 dark:text-emerald-400">{activeRegApp?.chapter || chapter}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Application No.:</span><span className="font-mono text-slate-500">{activeRegApp?.id || 'REG-PENDING'}</span></div>
            </div>

            <div className="space-y-2 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Approval steps:</span>
              {[
                { label: '1. Email, Identity & KYC Submitted', done: true, who: '' , doneText: 'Complete', waitText: '' },
                { label: '2. Secretary Vetting', done: !!activeRegApp?.secretaryApproved, who: 'Secretary', doneText: 'Approved', waitText: 'Under Review' },
                { label: '3. Admin Final Authorization', done: !!activeRegApp?.adminApproved, who: 'System Admin', doneText: 'Authorized', waitText: 'Awaiting Authorization' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    {s.done ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Clock className="w-4 h-4 text-amber-500 shrink-0" />}
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{s.label}</span>
                      {s.who && <span className="block text-[10px] text-slate-400">{s.who}</span>}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.done ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : 'text-amber-600 bg-amber-50 dark:bg-amber-950/40'}`}>
                    {s.done ? s.doneText : s.waitText}
                  </span>
                </div>
              ))}
            </div>

            <button type="button"
              onClick={() => { setMode('signin'); setErrorMessage(''); setSuccessMessage('Your application is recorded. Once approved, use your email and password to sign in.'); }}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer">
              Return to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
