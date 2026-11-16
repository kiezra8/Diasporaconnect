import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Sun, Moon, Shield, User, FileText, Activity, Briefcase, UserCheck } from 'lucide-react';

export default function SignIn() {
  const navigate = useNavigate();
  const [themeMode, setThemeMode] = useState('white');
  const [mode, setMode] = useState('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('849201');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isDark = themeMode === 'dark';

  // Handle Login Submit -> Real session validation & RBAC redirection
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const res = await api.login(email, password);
      navigate(res.redirectTo);
    } catch (err) {
      setErrorMessage(err?.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleQuickLogin = async (loginEmail) => {
    setEmail(loginEmail);
    setPassword('88888888');
    setErrorMessage('');
    try {
      const res = await api.login(loginEmail, '88888888');
      navigate(res.redirectTo);
    } catch (err) {
      navigate('/member');
    }
  };

  // Handle Sign Up Submit -> sends email code and moves to verification step
  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedCode(code);
    setVerificationCode('');
    setSuccessMessage(`A 6-digit verification code has been sent to ${email}. (Demo Code: ${code})`);
    setMode('verify');
  };

  // Handle Verification Code Submit
  const handleVerifySubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (verificationCode.trim() !== generatedCode && verificationCode.trim() !== '849201') {
      setErrorMessage('Invalid verification code. Please check your email and try again.');
      return;
    }

    alert('Your Diaspora Connect Farmers SACCO account has been confirmed and verified! You can now sign in.');
    setMode('signin');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleResendCode = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedCode(code);
    setSuccessMessage(`New code sent to ${email}! (Demo Code: ${code})`);
    setErrorMessage('');
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4 transition-colors duration-300 font-sans"
      style={{
        backgroundColor: isDark ? '#020617' : '#f8fafc',
        color: isDark ? '#f1f5f9' : '#0f172a',
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. SACCO LOGO / FAVICON WATERMARK IN THE BACKGROUND
         ───────────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="relative flex items-center justify-center">
          <div
            className="absolute rounded-full border border-emerald-500/15 dark:border-emerald-400/15"
            style={{
              width: 'min(75vw, 620px)',
              height: 'min(75vw, 620px)',
            }}
          />
          <img
            src="/images/logo.jpg"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.includes('/images/logo.jpg')) {
                target.src = '/logo.jpg';
              }
            }}
            alt="Diaspora Connect Watermark"
            className="select-none rounded-full object-cover shadow-2xl transition-all duration-300"
            style={{
              maxWidth: '520px',
              maxHeight: '520px',
              width: '60vw',
              height: '60vw',
              opacity: isDark ? 0.16 : 0.13,
              filter: isDark ? 'contrast(1.2) brightness(0.95)' : 'contrast(1.15)',
            }}
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. THEME SWITCHER TOGGLE (WHITE / DARK BACKGROUND)
         ───────────────────────────────────────────────────────────── */}
      <div className="fixed top-5 right-5 z-20 flex items-center gap-1.5 p-1 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() => setThemeMode('white')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            !isDark
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Switch to White Background"
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={() => setThemeMode('dark')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            isDark
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          title="Switch to Dark Background"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Dark</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. LOGIN CARD CONTAINER
         ───────────────────────────────────────────────────────────── */}
      <div
        className="relative z-10 w-full max-w-md p-6 sm:p-8 rounded-3xl transition-all duration-300 shadow-2xl border"
        style={{
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderColor: isDark ? '#1e293b' : '#e2e8f0',
        }}
      >
        {/* Header / Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src="/images/logo.jpg"
            alt="Diaspora Connect"
            className="w-14 h-14 object-cover rounded-2xl mb-3 shadow-md"
          />
          <h1
            className="text-lg font-extrabold tracking-tight"
            style={{ color: isDark ? '#ffffff' : '#0f172a' }}
          >
            Diaspora Connect SACCO
          </h1>
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
            Integrated Agricultural &amp; Cooperative Platform
          </p>
        </div>

        {/* Error & Info Messages */}
        {errorMessage && (
          <div
            className="mb-4 p-3 rounded-xl text-xs font-medium border"
            style={{
              backgroundColor: isDark ? '#450a0a' : '#fef2f2',
              borderColor: isDark ? '#7f1d1d' : '#fecaca',
              color: isDark ? '#fca5a5' : '#991b1b',
            }}
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            className="mb-4 p-3 rounded-xl text-xs font-medium border"
            style={{
              backgroundColor: isDark ? '#052e16' : '#f0fdf4',
              borderColor: isDark ? '#166534' : '#bbf7d0',
              color: isDark ? '#86efac' : '#166534',
            }}
          >
            {successMessage}
          </div>
        )}

        {/* ── 1. SIGN IN FORM ── */}
        {mode === 'signin' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-bold mb-1"
                style={{ color: isDark ? '#cbd5e1' : '#475569' }}
              >
                Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="name@diasporaconnectt.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                style={{
                  backgroundColor: isDark ? '#020617' : '#f8fafc',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  className="block text-xs font-bold"
                  style={{ color: isDark ? '#cbd5e1' : '#475569' }}
                >
                  Password
                </label>
                <Link
                  to="/contact"
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                style={{
                  backgroundColor: isDark ? '#020617' : '#f8fafc',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold text-xs transition shadow-lg shadow-emerald-600/20"
            >
              Sign In to System
            </button>

            {/* Quick Testing Portal Selectors (Clean, No Emojis) */}
            <div
              className="pt-4 border-t space-y-2"
              style={{ borderColor: isDark ? '#1e293b' : '#e2e8f0' }}
            >
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span>Testing Quick Access</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">Development</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('israelezrakisakye@gmail.com')}
                  className="p-2 rounded-xl text-[11px] font-bold text-left transition flex items-center gap-2 border bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border-emerald-600/30"
                >
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span>Admin Suite</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('member@diasporaconnectt.com')}
                  className="p-2 rounded-xl text-[11px] font-bold text-left transition flex items-center gap-2 border bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 dark:text-blue-400 border-blue-600/30"
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span>Member Portal</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('accountant@diasporaconnectt.com')}
                  className="p-2 rounded-xl text-[11px] font-bold text-left transition flex items-center gap-2 border bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>Accountant</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('farm@diasporaconnectt.com')}
                  className="p-2 rounded-xl text-[11px] font-bold text-left transition flex items-center gap-2 border bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border-emerald-600/30"
                >
                  <Activity className="w-3.5 h-3.5 shrink-0" />
                  <span>Farm Manager</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('secretary@diasporaconnectt.com')}
                  className="p-2 rounded-xl text-[11px] font-bold text-left transition flex items-center gap-2 border bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 dark:text-blue-400 border-blue-600/30"
                >
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Secretary</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('board@diasporaconnectt.com')}
                  className="p-2 rounded-xl text-[11px] font-bold text-left transition flex items-center gap-2 border bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700"
                >
                  <Briefcase className="w-3.5 h-3.5 shrink-0" />
                  <span>Board Chair</span>
                </button>
              </div>
            </div>

            <div className="pt-2 text-center text-xs text-slate-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Sign Up
              </button>
            </div>
          </form>
        )}

        {/* ── 2. SIGN UP FORM ── */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUpSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-bold mb-1"
                style={{ color: isDark ? '#cbd5e1' : '#475569' }}
              >
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="David Mukasa"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                style={{
                  backgroundColor: isDark ? '#020617' : '#f8fafc',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-bold mb-1"
                style={{ color: isDark ? '#cbd5e1' : '#475569' }}
              >
                Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="name@diasporaconnectt.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                style={{
                  backgroundColor: isDark ? '#020617' : '#f8fafc',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-bold mb-1"
                style={{ color: isDark ? '#cbd5e1' : '#475569' }}
              >
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                style={{
                  backgroundColor: isDark ? '#020617' : '#f8fafc',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-bold mb-1"
                style={{ color: isDark ? '#cbd5e1' : '#475569' }}
              >
                Confirm Password
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                style={{
                  backgroundColor: isDark ? '#020617' : '#f8fafc',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition shadow-lg shadow-emerald-600/20"
            >
              Continue &rarr; Receive Code
            </button>

            <div className="pt-2 text-center text-xs text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* ── 3. VERIFICATION STEP ── */}
        {mode === 'verify' && (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="text-center space-y-1">
              <h3
                className="text-sm font-extrabold"
                style={{ color: isDark ? '#ffffff' : '#0f172a' }}
              >
                Confirm Email
              </h3>
              <p className="text-xs text-slate-500">
                Enter the 6-digit confirmation code sent to <strong>{email}</strong>
              </p>
            </div>

            <div>
              <input
                type="text"
                maxLength={6}
                required
                autoComplete="one-time-code"
                placeholder="849201"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full text-center font-mono text-xl font-bold tracking-[6px] py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500"
                style={{
                  backgroundColor: isDark ? '#020617' : '#f8fafc',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                  color: isDark ? '#34d399' : '#059669',
                }}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition shadow-lg shadow-emerald-600/20"
            >
              Confirm &amp; Complete Verification
            </button>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <button
                type="button"
                onClick={handleResendCode}
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                Resend Code
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="hover:underline"
              >
                &larr; Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
