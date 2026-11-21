import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, AuthFlowError } from '../services/api';
import { supabase } from '../services/supabase';
import { Sun, Moon, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

export default function SignIn() {
  const navigate = useNavigate();
  const [themeMode, setThemeMode] = useState('white');
  // signin | verify (email not confirmed) | pending_approval | mfa_verify | mfa_enroll   (sign-up is on /signup/…)
  const [mode, setMode] = useState('signin');
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState('');
  // account
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  // two-step login (staff)
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaQr, setMfaQr] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeRegApp, setActiveRegApp] = useState(null);

  const isDark = themeMode === 'dark';
  const inputStyle = { backgroundColor: isDark ? '#020617' : '#f8fafc', borderColor: isDark ? '#334155' : '#cbd5e1', color: isDark ? '#ffffff' : '#0f172a' };
  const labelStyle = { color: isDark ? '#cbd5e1' : '#475569' };
  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 border';
  const btnCls = 'w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold text-xs transition shadow-lg shadow-emerald-600/20 disabled:opacity-60';

  const resetMessages = () => { setErrorMessage(''); setSuccessMessage(''); };

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
        else if (err.code === 'MFA_REQUIRED') { setMfaFactorId(err.extra.factorId); setMfaCode(''); setMode('mfa_verify'); }
        else if (err.code === 'MFA_ENROLL') {
          try {
            const f = await api.startMfaEnrollment();
            setMfaFactorId(f.factorId); setMfaQr(f.qrCode); setMfaSecret(f.secret); setMfaCode('');
            setMode('mfa_enroll');
          } catch (e2) {
            await supabase.auth.signOut();
            setErrorMessage(e2?.message || 'Could not start two-step login set-up.');
          }
        }
        else if (err.code === 'NO_APPLICATION') {
          navigate('/signup/details', { state: { complete: true, userId: err.extra.userId, email: err.extra.email || email, fullName: err.extra.fullName || '' } });
        }
      } else {
        setErrorMessage(err?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setBusy(false);
    }
  };

  // ── Two-step login (staff) ────────────────────────────────────────────────
  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    setBusy(true);
    try {
      const res = await api.verifyMfa(mfaFactorId, mfaCode);
      setMfaQr(''); setMfaSecret(''); setMfaCode(''); setPassword('');
      navigate(res.redirectTo);
    } catch (err) {
      setErrorMessage(err?.message || 'Could not check the code.');
    } finally {
      setBusy(false);
    }
  };

  const cancelMfa = async () => {
    await supabase.auth.signOut();
    setMfaFactorId(''); setMfaQr(''); setMfaSecret(''); setMfaCode('');
    setMode('signin');
    resetMessages();
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
        className={`relative z-10 w-full max-w-md p-6 sm:p-8 rounded-3xl transition-all duration-300 shadow-2xl border`}
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
            <div className="text-right -mt-2">
              <button type="button" onClick={() => navigate('/reset-password', { state: { email } })} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">Forgot password?</button>
            </div>
            <button type="submit" disabled={busy} className={btnCls}>{busy ? 'Signing in…' : 'Sign In'}</button>
            <div className="pt-2 text-center text-xs text-slate-500">
              Don't have an account?{' '}
              <button type="button" onClick={() => navigate('/signup/details')}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">Sign Up</button>
            </div>
          </form>
        )}

        {/* ── TWO-STEP LOGIN: code ── */}
        {mode === 'mfa_verify' && (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div className="text-center space-y-1">
              <ShieldCheck className="w-8 h-8 mx-auto text-emerald-600" />
              <h3 className="text-sm font-extrabold" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Two-step login</h3>
              <p className="text-xs text-slate-500">Open your authenticator app and enter the 6-digit code for Diaspora Connect.</p>
            </div>
            <input type="text" inputMode="numeric" maxLength={6} required autoFocus autoComplete="one-time-code" placeholder="000000"
              value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full text-center font-mono text-xl font-bold tracking-[6px] py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500"
              style={{ backgroundColor: isDark ? '#020617' : '#f8fafc', borderColor: isDark ? '#334155' : '#cbd5e1', color: isDark ? '#34d399' : '#059669' }} />
            <button type="submit" disabled={busy} className={btnCls}>{busy ? 'Checking…' : 'Continue'}</button>
            <div className="text-center text-xs text-slate-500">
              Lost your phone? Ask the Admin to reset your two-step login.{' '}
              <button type="button" onClick={cancelMfa} className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">Cancel</button>
            </div>
          </form>
        )}

        {/* ── TWO-STEP LOGIN: first-time set-up ── */}
        {mode === 'mfa_enroll' && (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div className="text-center space-y-1">
              <ShieldCheck className="w-8 h-8 mx-auto text-emerald-600" />
              <h3 className="text-sm font-extrabold" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Set up two-step login</h3>
              <p className="text-xs text-slate-500">Staff accounts need a code from your phone at every sign-in.</p>
            </div>
            <ol className="text-xs text-slate-500 space-y-1 list-decimal pl-4">
              <li>Install an authenticator app (Google Authenticator, Microsoft Authenticator or Authy).</li>
              <li>In the app, add an account and scan this code.</li>
              <li>Enter the 6-digit code the app shows.</li>
            </ol>
            {mfaQr && (
              <div className="flex justify-center">
                <img src={mfaQr} alt="Two-step login QR code" className="w-44 h-44 bg-white p-2 rounded-xl border border-slate-200" />
              </div>
            )}
            {mfaSecret && (
              <p className="text-[11px] text-center text-slate-500">
                Can't scan? Type this key in the app:<br />
                <span className="font-mono font-bold break-all select-all" style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>{mfaSecret}</span>
              </p>
            )}
            <input type="text" inputMode="numeric" maxLength={6} required autoFocus autoComplete="one-time-code" placeholder="000000"
              value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full text-center font-mono text-xl font-bold tracking-[6px] py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500"
              style={{ backgroundColor: isDark ? '#020617' : '#f8fafc', borderColor: isDark ? '#334155' : '#cbd5e1', color: isDark ? '#34d399' : '#059669' }} />
            <button type="submit" disabled={busy} className={btnCls}>{busy ? 'Checking…' : 'Turn on two-step login'}</button>
            <div className="text-center text-xs">
              <button type="button" onClick={cancelMfa} className="font-bold text-slate-500 hover:underline">Cancel</button>
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
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Applicant Name:</span><span className="font-extrabold text-slate-900 dark:text-white">{activeRegApp?.fullName || ''}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Registered Email:</span><span className="font-mono font-bold text-slate-900 dark:text-white">{activeRegApp?.email || email}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Chapter / Region:</span><span className="font-bold text-emerald-600 dark:text-emerald-400">{activeRegApp?.chapter || ''}</span></div>
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
