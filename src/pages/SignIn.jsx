import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function SignIn() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(
      isSignUp
        ? 'Sign up submitted! An onboarding verification email has been sent.'
        : 'Sign in submitted! Welcome back to Diaspora Connect.'
    );
  };

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#334155' }}>
      <main className="signin-hero">
        {/* Small Container with Fully White Background */}
        <div className="signin-container">
          <div className="signin-content">
            {/* Just Diaspora Connect Logo as it is now */}
            <div className="signin-header">
              <img src="/images/logo.jpg" alt="Diaspora Connect" className="signin-logo" width="58" height="58" />
            </div>

            <form id="auth-form" onSubmit={handleSubmit}>
              {/* Extra field when in Sign Up mode */}
              {isSignUp && (
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Email Box */}
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

              {/* Password Box */}
              <div className="form-group">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Password"
                  required
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Forgot Password Down */}
              {!isSignUp && (
                <div className="forgot-row" id="forgot-row">
                  <Link to="/contact" className="forgot-link">
                    Forgot password?
                  </Link>
                </div>
              )}

              <button type="submit" className="signin-btn" id="submit-btn">
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </button>

              {/* Option of Sign Up / In Down */}
              <div className="signup-option-row">
                <span id="switch-text">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </span>
                <button
                  type="button"
                  className="signup-toggle-btn"
                  id="toggle-btn"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

