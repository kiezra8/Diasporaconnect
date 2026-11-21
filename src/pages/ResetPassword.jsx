import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';
import { supabase } from '../services/supabase';
import { ArrowLeft, KeyRound, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';

// Forgot password: email → code → (staff: authenticator code) → new password → done
const inputCls = 'w-full px-4 py-3.5 rounded-2xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500';
const codeCls = 'w-full text-center font-mono text-3xl font-bold tracking-[10px] py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500';
const btn = 'w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold text-sm transition disabled:opacity-60';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  // opened from the link in the email: the person is already confirmed
  useEffect(() => {
    const fromLink = /type=recovery/.test(window.location.hash) || new URLSearchParams(window.location.search).has('code');
    const goOn = async () => setStep((await api.needsMfaStepUp()) ? 'mfa' : 'new');
    const { data: sub } = supabase.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') goOn(); });
    if (fromLink) supabase.auth.getSession().then(({ data }) => { if (data.session) goOn(); });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => { setError(''); window.scrollTo(0, 0); }, [step]);

  const run = (fn) => async (e) => {
    e?.preventDefault?.();
    setError(''); setNote('');
    setBusy(true);
    try { await fn(); } catch (err) { setError(err?.message || 'Something went wrong. Please try again.'); } finally { setBusy(false); }
  };

  const sendCode = run(async () => { await api.sendPasswordReset(email); setCode(''); setStep('code'); });
  const resend = run(async () => { await api.sendPasswordReset(email); setNote('New code sent.'); });
  const checkCode = run(async () => { const needsMfa = await api.verifyResetCode(email, code); setStep(needsMfa ? 'mfa' : 'new'); });
  const checkMfa = run(async () => { await api.mfaStepUp(mfaCode); setStep('new'); });
  const save = run(async () => {
    if (password !== confirm) throw new Error('The passwords do not match.');
    await api.setNewPassword(password);
    setPassword(''); setConfirm('');
    setStep('done');
  });

  const page = {
    email: { icon: KeyRound, title: 'Forgot password', sub: 'We will email you a code.' },
    code:  { icon: Mail, title: 'Check your email', sub: <>Enter the 6-digit code sent to <strong className="text-slate-700 dark:text-slate-200">{email}</strong>.</> },
    mfa:   { icon: ShieldCheck, title: 'Two-step login', sub: 'Enter the code from your authenticator app.' },
    new:   { icon: KeyRound, title: 'New password', sub: 'At least 10 characters, with letters and numbers.' },
    done:  { icon: CheckCircle2, title: 'Password changed', sub: 'Sign in with your new password.' },
  }[step];
  const Icon = page.icon;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <header className="px-5 pt-5 pb-3 max-w-xl w-full mx-auto flex items-center justify-between">
        <Link to="/signin" className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white" aria-label="Back to sign in"><ArrowLeft className="w-5 h-5" /></Link>
        <img src="/images/logo.jpg" alt="Diaspora Connect" className="w-9 h-9 rounded-xl object-cover" />
        <span className="w-9" />
      </header>

      <main key={step} className="dc-step-in flex-1 flex flex-col px-5 pb-8 max-w-xl w-full mx-auto">
        <form onSubmit={step === 'email' ? sendCode : step === 'code' ? checkCode : step === 'mfa' ? checkMfa : step === 'new' ? save : (e) => { e.preventDefault(); navigate('/signin'); }}
          className="flex-1 flex flex-col">
          <div className="pt-6 pb-6">
            <Icon className="w-10 h-10 text-emerald-600 mb-4" />
            <h1 className="text-3xl font-black tracking-tight">{page.title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{page.sub}</p>
          </div>

          <div className="flex-1 space-y-4">
            {step === 'email' && (
              <input type="email" required autoFocus autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            )}
            {step === 'code' && (
              <>
                <input type="text" inputMode="numeric" maxLength={6} required autoFocus autoComplete="one-time-code" placeholder="000000"
                  value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))} className={codeCls} />
                <div className="flex justify-between text-sm">
                  <button type="button" onClick={resend} className="font-bold text-emerald-600 dark:text-emerald-400">Send a new code</button>
                  <button type="button" onClick={() => setStep('email')} className="text-slate-500">Change email</button>
                </div>
                <p className="text-xs text-slate-400">No email? Check spam. It only arrives if this email has an account.</p>
              </>
            )}
            {step === 'mfa' && (
              <input type="text" inputMode="numeric" maxLength={6} required autoFocus autoComplete="one-time-code" placeholder="000000"
                value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, ''))} className={codeCls} />
            )}
            {step === 'new' && (
              <>
                <input type="password" required autoFocus autoComplete="new-password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
                <input type="password" required autoComplete="new-password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
              </>
            )}
            {note && <p className="text-sm font-semibold text-emerald-600">{note}</p>}
          </div>

          {error && <p className="mt-5 text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
          <div className="pt-6">
            <button type="submit" disabled={busy || ((step === 'code' && code.length !== 6) || (step === 'mfa' && mfaCode.length !== 6))} className={btn}>
              {busy ? 'Please wait…' : { email: 'Send code', code: 'Continue', mfa: 'Continue', new: 'Save password', done: 'Sign in' }[step]}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
