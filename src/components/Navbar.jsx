import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSession, clearSession } from '../services/api';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [session, setSession] = useState(() => getSession());
  const location = useLocation();
  const navigate = useNavigate();

  const syncSession = () => setSession(getSession());

  useEffect(() => {
    syncSession();
  }, [location]);

  useEffect(() => {
    window.addEventListener('storage', syncSession);
    window.addEventListener('dc_storage_update', syncSession);
    window.addEventListener('dc_auth_change', syncSession);
    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('dc_storage_update', syncSession);
      window.removeEventListener('dc_auth_change', syncSession);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardPath = () => {
    if (!session) return '/signin';
    const role = session.role;
    if (role === 'ADMIN') return '/admin';
    if (role === 'BOARD_MEMBER') return '/board';
    if (role === 'SECRETARY') return '/secretary';
    if (role === 'ACCOUNTANT') return '/accountant';
    if (role === 'FARM_WORKER') return '/farm';
    return '/member';
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    window.dispatchEvent(new Event('dc_auth_change'));
    navigate('/signin');
  };

  const accountPath = getDashboardPath();

  return (
    <nav
      id="navbar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: isScrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
        boxShadow: isScrolled ? '0 4px 20px rgba(0, 0, 0, 0.07)' : '0 2px 10px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 28px',
        transition: 'background 0.3s, box-shadow 0.3s'
      }}
    >
      <Link
        to="/"
        className="nav-logo"
        style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
        title="Diaspora Connect Farmers SACCO Home"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <img
          src="/images/logo.jpg"
          alt="Diaspora Connect Farmers SACCO Official Logo"
          width="44"
          height="44"
          loading="eager"
          style={{ borderRadius: '50%', border: '2px solid var(--gold, #b45309)', objectFit: 'contain' }}
        />
        <div className="nav-brand">
          <span className="top">Diaspora Connect</span>
          <span className="bottom">Farmers SACCO</span>
        </div>
      </Link>

      <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {session ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              to={accountPath}
              className="nav-signin-btn"
              style={{
                background: '#059669',
                color: '#ffffff',
                border: '1px solid #10b981',
                fontWeight: '700',
                padding: '8px 18px',
                fontSize: '13px',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                cursor: 'pointer',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
              Account
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              style={{
                background: 'transparent',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                fontWeight: '600',
                padding: '7px 12px',
                fontSize: '12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            to="/signin"
            className="nav-signin-btn"
            style={{
              background: '#059669',
              color: '#ffffff',
              border: '1px solid #10b981',
              fontWeight: '700',
              padding: '8px 20px',
              fontSize: '13px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              cursor: 'pointer',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
