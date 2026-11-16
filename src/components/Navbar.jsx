import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { getSession } from '../services/api';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [session, setSession] = useState(() => getSession());
  const navWrapRef = useRef(null);
  const hamburgerRef = useRef(null);
  const location = useLocation();

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

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isOpen &&
        navWrapRef.current &&
        !navWrapRef.current.contains(e.target) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const handleNavClick = () => {
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        boxShadow: isScrolled ? '0 4px 20px rgba(0, 0, 0, 0.07)' : '0 2px 10px rgba(0, 0, 0, 0.03)'
      }}
    >
      <Link
        to="/"
        className="nav-logo"
        style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
        title="Diaspora Connect Farmers SACCO Home"
        onClick={handleNavClick}
      >
        <img src="/images/logo.jpg" alt="Diaspora Connect Farmers SACCO – Official Logo" width="46" height="46" loading="eager" />
        <div className="nav-brand">
          <span className="top">Diaspora Connect</span>
          <span className="bottom">Farmers SACCO</span>
        </div>
      </Link>

      <div className={`nav-menu-wrap ${isOpen ? 'open' : ''}`} id="nav-menu-wrap" ref={navWrapRef}>
        <ul className="nav-menu">
          <li>
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
              About Us
            </NavLink>
          </li>
          <li>
            <NavLink to="/mission" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
              Mission
            </NavLink>
          </li>
          <li>
            <NavLink to="/values" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
              Values
            </NavLink>
          </li>
          <li>
            <NavLink to="/farmlife" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
              Farm Life
            </NavLink>
          </li>
          <li>
            <NavLink to="/blog" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
              Blog
            </NavLink>
          </li>
          <li>
            <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
              Contact
            </NavLink>
          </li>
          <li>
            {session ? (
              <NavLink
                to={accountPath}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={{ color: '#059669', fontWeight: '700' }}
                onClick={handleNavClick}
              >
                Account
              </NavLink>
            ) : (
              <NavLink
                to="/signin"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={{ color: '#059669', fontWeight: '700' }}
                onClick={handleNavClick}
              >
                Sign In
              </NavLink>
            )}
          </li>
        </ul>

        <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {session ? (
            <Link
              to={accountPath}
              className="nav-signin-btn"
              onClick={handleNavClick}
              style={{
                background: '#059669',
                color: '#ffffff',
                border: '1px solid #10b981',
                fontWeight: '700',
                padding: '7px 16px',
                fontSize: '12px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
              Account
            </Link>
          ) : (
            <Link
              to="/signin"
              className="nav-signin-btn"
              onClick={handleNavClick}
              style={{
                background: '#059669',
                color: '#ffffff',
                border: '1px solid #10b981',
                fontWeight: '700',
                padding: '7px 16px',
                fontSize: '12px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
              Sign In
            </Link>
          )}
        </div>
      </div>

      <button
        ref={hamburgerRef}
        className={`nav-hamburger ${isOpen ? 'open' : ''}`}
        id="nav-hamburger"
        type="button"
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen ? 'true' : 'false'}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>
  );
}
