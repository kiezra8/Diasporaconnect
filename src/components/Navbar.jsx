import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navWrapRef = useRef(null);
  const hamburgerRef = useRef(null);
  const location = useLocation();

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

  return (
    <nav
      id="navbar"
      style={{
        background: isScrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
        boxShadow: isScrolled ? '0 4px 20px rgba(0, 0, 0, 0.07)' : '0 2px 10px rgba(0, 0, 0, 0.03)'
      }}
    >
      <Link to="/" className="nav-logo" style={{ textDecoration: 'none', color: 'inherit' }} title="Diaspora Connect Farmers SACCO Home">
        <img src="/images/logo.jpg" alt="Diaspora Connect Farmers SACCO – Official Logo" width="46" height="46" loading="eager" />
        <div className="nav-brand">
          <span className="top">Diaspora Connect</span>
          <span className="bottom">Farmers SACCO</span>
        </div>
      </Link>

      <div className={`nav-menu-wrap ${isOpen ? 'open' : ''}`} id="nav-menu-wrap" ref={navWrapRef}>
        <ul className="nav-menu">
          <li>
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              About Us
            </NavLink>
          </li>
          <li>
            <NavLink to="/mission" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Mission
            </NavLink>
          </li>
          <li>
            <NavLink to="/values" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Values
            </NavLink>
          </li>
          <li>
            <NavLink to="/farmlife" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Farm Life
            </NavLink>
          </li>
          <li>
            <NavLink to="/blog" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Blog
            </NavLink>
          </li>
          <li>
            <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Contact
            </NavLink>
          </li>
        </ul>
        <div className="nav-right">
          <Link to="/signin" className="nav-signin-btn">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
            Sign In
          </Link>
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

