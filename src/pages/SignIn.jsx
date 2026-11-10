import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setAuthSession, AUTHORIZED_TESTER } from '../services/portalState';

export default function SignIn() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'verify'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('849201');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle Login Submit - Restricted to authorized tester
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail !== AUTHORIZED_TESTER.email.toLowerCase() || password !== AUTHORIZED_TESTER.password) {
      setErrorMessage('Access Denied: Testing mode is restricted to authorized tester credentials (israelezrakisakye@gmail.com / 88888888).');
      return;
    }

    setAuthSession({
      email: AUTHORIZED_TESTER.email,
      name: AUTHORIZED_TESTER.name,
      loginTime: new Date().toISOString()
    });

    navigate('/portal');
  };

  const handleFillTesterCredentials = () => {
    setEmail(AUTHORIZED_TESTER.email);
    setPassword(AUTHORIZED_TESTER.password);
    setErrorMessage('');
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

    // Simulate sending 6-digit code to user's email
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
    <div style={{ backgroundColor: '#ffffff', color: '#334155' }}>
      <main className="signin-hero" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Beautiful "DIASPORA CONNECT" watermark text in the background */}
        <div className="signin-bg-watermark" aria-hidden="true">
          <span>DIASPORA</span>
          <span>CONNECT</span>
        </div>

        {/* Small, clean container with pure white background */}
        <div className="signin-container">
          <div className="signin-content">
            {/* Official Diaspora Connect Logo */}
            <div className="signin-header">
              <img src="/images/logo.jpg" alt="Diaspora Connect" className="signin-logo" width="58" height="58" />
            </div>

            {/* Error & Info Messages */}
            {errorMessage && (
              <div
                style={{
                  background: '#fef2f2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '12px',
                  marginBottom: '14px',
                  lineHeight: '1.4'
                }}
              >
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div
                style={{
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '12px',
                  marginBottom: '14px',
                  lineHeight: '1.4'
                }}
              >
                {successMessage}
              </div>
            )}

            {/* ── 1. SIGN IN MODE ── */}
            {mode === 'signin' && (
              <form id="auth-form" onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Email Address"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="forgot-row" id="forgot-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleFillTesterCredentials}
                    style={{ background: 'none', border: 'none', color: '#b8860b', fontSize: '11.5px', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontWeight: '600' }}
                  >
                    Use Authorized Test Credentials
                  </button>
                  <Link to="/contact" className="forgot-link">
                    Forgot password?
                  </Link>
                </div>

                <button type="submit" className="signin-btn" id="submit-btn">
                  Sign In
                </button>

                <div className="signup-option-row">
                  <span id="switch-text">Don't have an account?</span>
                  <button
                    type="button"
                    className="signup-toggle-btn"
                    id="toggle-btn"
                    onClick={() => {
                      setMode('signup');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                  >
                    Sign Up
                  </button>
                </div>
              </form>
            )}

            {/* ── 2. SIGN UP MODE (Password + Confirm Password) ── */}
            {mode === 'signup' && (
              <form id="signup-form" onSubmit={handleSignUpSubmit}>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Full Name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Email Address"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Confirm Password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className="signin-btn" id="signup-submit-btn">
                  Continue &rarr; Send Code
                </button>

                <div className="signup-option-row">
                  <span id="switch-text">Already have an account?</span>
                  <button
                    type="button"
                    className="signup-toggle-btn"
                    onClick={() => {
                      setMode('signin');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}

            {/* ── 3. EMAIL VERIFICATION STEP ── */}
            {mode === 'verify' && (
              <form id="verify-form" onSubmit={handleVerifySubmit}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <h3
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: '15px',
                      color: 'var(--text-heading)',
                      marginBottom: '6px'
                    }}
                  >
                    Confirm Sign Up
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    Enter the 6-digit confirmation code sent to <strong>{email}</strong>
                  </p>
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    maxLength={6}
                    className="form-control"
                    placeholder="6-digit code"
                    required
                    autoComplete="one-time-code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    style={{
                      textAlign: 'center',
                      letterSpacing: '8px',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: 'var(--gold-dark)'
                    }}
                  />
                </div>

                <button type="submit" className="signin-btn" id="confirm-signup-btn">
                  Confirm Sign Up
                </button>

                <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Didn't receive the code? </span>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--gold-dark)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline'
                    }}
                  >
                    Resend Code
                  </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMessage('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '11.5px',
                      cursor: 'pointer'
                    }}
                  >
                    &larr; Back to Sign Up
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
