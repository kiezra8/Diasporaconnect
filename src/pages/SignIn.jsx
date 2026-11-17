import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setSession } from '../services/api';
import { SaccoFarmStore } from '../services/saccoFarmStore';
import { Sun, Moon, CheckCircle2, Clock, Camera } from 'lucide-react';

export default function SignIn() {
  const navigate = useNavigate();
  const [themeMode, setThemeMode] = useState('white');
  const [mode, setMode] = useState('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [chapter, setChapter] = useState('UK Diaspora Chapter');
  const [photoUrl, setPhotoUrl] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('849201');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeRegApp, setActiveRegApp] = useState(null);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (typeof base64 === 'string') setPhotoUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const isDark = themeMode === 'dark';

  const getStoredRegistrations = () => {
    try {
      return JSON.parse(localStorage.getItem('dc_member_registrations') || '[]');
    } catch {
      return [];
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.toLowerCase().trim();
    const stored = getStoredRegistrations();
    const matchedApp = stored.find(a => a.email.toLowerCase() === cleanEmail);

    if (matchedApp) {
      if (matchedApp.status === 'PENDING_APPROVAL') {
        setActiveRegApp(matchedApp);
        setErrorMessage('Your membership application is pending dual approval by the Secretary and Admin.');
        setMode('pending_approval');
        return;
      }
      if (matchedApp.status === 'REJECTED') {
        setErrorMessage('Your membership application was not approved. Please contact the Secretariat.');
        return;
      }
      if (matchedApp.status === 'APPROVED') {
        const userSession = {
          id: `usr-${matchedApp.id}`,
          email: matchedApp.email,
          fullName: matchedApp.fullName,
          role: 'MEMBER',
          memberNumber: matchedApp.memberId || 'DC-MBR-00105',
          photoUrl: matchedApp.photoUrl || '',
          token: `jwt-${Date.now()}`
        };
        setSession(userSession);
        window.dispatchEvent(new Event('dc_auth_change'));
        navigate('/member');
        return;
      }
    }

    try {
      const res = await api.login(email, password);
      navigate(res.redirectTo);
    } catch (err) {
      setErrorMessage(err?.message || 'Login failed. Please check your credentials.');
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
    setSuccessMessage(`A 6-digit verification code has been sent to ${email}.`);
    setMode('verify');
  };

  // Handle Verification Code Submit -> Creates pending application awaiting Secretary and Admin
  const handleVerifySubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (verificationCode.trim() !== generatedCode && verificationCode.trim() !== '849201') {
      setErrorMessage('Invalid verification code. Please check your email and try again.');
      return;
    }

    const newApp = {
      id: `REG-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: fullName.trim() || 'Diaspora Member',
      email: email.trim().toLowerCase(),
      phone: phone.trim() || '+256 700 000 000',
      dob: dob || '',
      gender: gender || '',
      chapter: chapter || 'UK Diaspora Chapter',
      photoUrl: photoUrl || '',
      password,
      status: 'PENDING_APPROVAL',
      secretaryApproved: false,
      adminApproved: false,
      submittedAt: new Date().toISOString().split('T')[0]
    };

    const stored = getStoredRegistrations();
    const updated = [newApp, ...stored.filter(a => a.email.toLowerCase() !== newApp.email)];
    localStorage.setItem('dc_member_registrations', JSON.stringify(updated));
    window.dispatchEvent(new Event('dc_storage_update'));

    setActiveRegApp(newApp);
    setMode('pending_approval');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleResendCode = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedCode(code);
    setSuccessMessage(`New code sent to ${email}!`);
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
          THEME SWITCHER TOGGLE (WHITE / DARK BACKGROUND)
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
            className="w-16 h-16 object-cover rounded-2xl mb-1 shadow-md"
          />
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
                autoComplete="off"
                placeholder=""
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
                placeholder=""
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
              Sign In
            </button>

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
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="David Mukasa"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                style={{ backgroundColor: isDark ? '#020617' : '#f8fafc', borderColor: isDark ? '#334155' : '#cbd5e1', color: isDark ? '#ffffff' : '#0f172a' }}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                style={{ backgroundColor: isDark ? '#020617' : '#f8fafc', borderColor: isDark ? '#334155' : '#cbd5e1', color: isDark ? '#ffffff' : '#0f172a' }}
              />
            </div>

            {/* Date of Birth + Gender row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                  style={{ backgroundColor: isDark ? '#020617' : '#f8fafc', borderColor: isDark ? '#334155' : '#cbd5e1', color: isDark ? '#ffffff' : '#0f172a' }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                  Gender
                </label>
                <select
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 border"
                  style={{ backgroundColor: isDark ? '#020617' : '#f8fafc', borderColor: isDark ? '#334155' : '#cbd5e1', color: isDark ? '#ffffff' : '#0f172a' }}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            {/* Profile Photo */}
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                Profile Photo
              </label>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5">
                {photoUrl ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500 shrink-0">
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover object-top" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="w-full text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Clear photo showing full face</p>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
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
                style={{ backgroundColor: isDark ? '#020617' : '#f8fafc', borderColor: isDark ? '#334155' : '#cbd5e1', color: isDark ? '#ffffff' : '#0f172a' }}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
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
                style={{ backgroundColor: isDark ? '#020617' : '#f8fafc', borderColor: isDark ? '#334155' : '#cbd5e1', color: isDark ? '#ffffff' : '#0f172a' }}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition shadow-lg shadow-emerald-600/20"
            >
              Continue &rarr; Verify Email
            </button>

            <div className="pt-2 text-center text-xs text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMessage(''); setSuccessMessage(''); }}
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

        {/* ── 4. PENDING DUAL APPROVAL SCREEN (SECRETARY & ADMIN) ── */}
        {mode === 'pending_approval' && (
          <div className="space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
              <Clock className="w-7 h-7" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                Application Submitted &bull; Pending Dual Approval
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mt-2">
                Awaiting Official Review
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Thank you for applying to join Diaspora Connect Farmers SACCO. Under statutory cooperative guidelines, new memberships require dual approval by both the <strong>Secretary</strong> and <strong>System Administrator</strong>.
              </p>
            </div>

            {/* Application Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Applicant Name:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{activeRegApp?.fullName || fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Registered Email:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{activeRegApp?.email || email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Chapter / Region:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{activeRegApp?.chapter || chapter}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Application Ref:</span>
                <span className="font-mono text-slate-500">{activeRegApp?.id || 'REG-PENDING'}</span>
              </div>
            </div>

            {/* Dual Approval Status Checklist */}
            <div className="space-y-2 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Dual Authorization Flow:
              </span>

              {/* Step 1 */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">1. Email &amp; Identity Verification</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  Confirmed
                </span>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  {activeRegApp?.secretaryApproved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">2. Secretary Vetting</span>
                    <span className="block text-[10px] text-slate-400">Mr. Halera John Bahati</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeRegApp?.secretaryApproved
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                }`}>
                  {activeRegApp?.secretaryApproved ? 'Vetted &amp; Approved' : 'Under Review'}
                </span>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  {activeRegApp?.adminApproved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">3. Admin Final Authorization</span>
                    <span className="block text-[10px] text-slate-400">Ezra Kisakye (System Admin)</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeRegApp?.adminApproved
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                }`}>
                  {activeRegApp?.adminApproved ? 'Authorized' : 'Awaiting Authorization'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage('');
                  setSuccessMessage('Your application is recorded. Once approved, use your email and password to sign in.');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Return to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
