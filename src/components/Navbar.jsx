import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { getSession } from '../services/api';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navWrapRef = useRef(null);
  const hamburgerRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setIsOpen(false); }, [location]);

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
            <NavLink to="/vision" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
              Vision
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
            <button
              type="button"
              className="nav-link"
              onClick={() => {
                handleNavClick();
                window.dispatchEvent(new CustomEvent('dc_open_chat'));
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                font: 'inherit',
                color: 'inherit',
                padding: '8px 14px',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              Chat
            </button>
          </li>
        </ul>

        <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <NavLink
            to="/signin"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={{ fontWeight: '700', color: '#059669' }}
            onClick={handleNavClick}
          >
            Login
          </NavLink>
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
