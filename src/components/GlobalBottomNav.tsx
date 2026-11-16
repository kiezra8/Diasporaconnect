import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Home, MessageSquare, LogIn, LayoutDashboard, Settings } from 'lucide-react';
import { getSession } from '../services/api';

export default function GlobalBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getSession());

  // Listen for login/logout and session updates
  useEffect(() => {
    const checkSession = () => setSession(getSession());
    window.addEventListener('storage', checkSession);
    window.addEventListener('dc_storage_update', checkSession);
    window.addEventListener('dc_auth_change', checkSession);
    return () => {
      window.removeEventListener('storage', checkSession);
      window.removeEventListener('dc_storage_update', checkSession);
      window.removeEventListener('dc_auth_change', checkSession);
    };
  }, []);

  // Determine user's portal dashboard route based on role
  const getDashboardPath = () => {
    if (!session) return '/signin';
    const role = session.role;
    if (role === 'MEMBER') return '/member';
    if (role === 'ADMIN') return '/admin';
    if (role === 'BOARD_MEMBER') return '/board';
    if (role === 'FARM_WORKER') return '/farm';
    if (role === 'ACCOUNTANT') return '/accountant';
    if (role === 'SECRETARY') return '/secretary';
    return '/member';
  };

  const dashboardPath = getDashboardPath();
  const isPortalActive = session && (
    location.pathname === dashboardPath ||
    location.pathname.startsWith('/member') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/farm') ||
    location.pathname.startsWith('/board') ||
    location.pathname.startsWith('/accountant') ||
    location.pathname.startsWith('/secretary') ||
    location.pathname.startsWith('/sacco')
  );

  const isHomeActive = location.pathname === '/';
  const isSignInActive = !session && location.pathname.startsWith('/signin');

  // Handle Chat Click
  const handleChatClick = () => {
    if (isPortalActive) {
      window.dispatchEvent(new CustomEvent('dc_portal_tab_switch', { detail: 'chat' }));
    } else {
      window.dispatchEvent(new CustomEvent('dc_toggle_chat'));
      const fabBtn = document.getElementById('fab-trigger');
      if (fabBtn) fabBtn.click();
    }
  };

  // Handle Account / Dashboard Click
  const handleAccountClick = () => {
    if (session) {
      if (isPortalActive) {
        window.dispatchEvent(new CustomEvent('dc_portal_tab_switch', { detail: 'dashboard' }));
      } else {
        navigate(dashboardPath);
      }
    } else {
      navigate('/signin');
    }
  };

  // Handle Settings Click
  const handleSettingsClick = () => {
    if (session) {
      if (isPortalActive) {
        window.dispatchEvent(new CustomEvent('dc_portal_tab_switch', { detail: 'settings' }));
      } else {
        navigate(`${dashboardPath}?tab=settings`);
      }
    } else {
      navigate('/signin');
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center justify-around shadow-2xl pb-[max(10px,env(safe-area-inset-bottom))] md:bottom-5 md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[460px] md:max-w-xl md:rounded-2xl md:border md:border-slate-200/80 md:dark:border-slate-800/80 md:bg-white/90 md:dark:bg-slate-900/90 md:shadow-2xl md:px-6 md:py-2.5 transition-all duration-300"
      aria-label="Bottom Navigation Bar"
    >
      {/* 1. HOME — Public Website */}
      <Link
        to="/"
        className={`flex flex-col items-center justify-center flex-1 py-1 transition group ${
          isHomeActive
            ? 'text-emerald-700 dark:text-emerald-400 font-extrabold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <div className={`p-1 rounded-xl transition ${isHomeActive ? 'bg-emerald-500/10' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800'}`}>
          <Home className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold mt-0.5 tracking-wider uppercase">Home</span>
      </Link>

      {/* 2. CHAT — In-App Support & Community */}
      <button
        type="button"
        onClick={handleChatClick}
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition cursor-pointer group"
      >
        <div className="p-1 rounded-xl transition group-hover:bg-slate-100 dark:group-hover:bg-slate-800">
          <MessageSquare className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold mt-0.5 tracking-wider uppercase">Chat</span>
      </button>

      {/* 3. SIGN IN / ACCOUNT (DASHBOARD) */}
      <button
        type="button"
        onClick={handleAccountClick}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer group ${
          isPortalActive || isSignInActive
            ? 'text-emerald-700 dark:text-emerald-400 font-extrabold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <div className={`p-1 rounded-xl transition ${
          isPortalActive || isSignInActive
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
            : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800'
        }`}>
          {session ? (
            <LayoutDashboard className="w-5 h-5" />
          ) : (
            <LogIn className="w-5 h-5" />
          )}
        </div>
        <span className="text-[10px] font-bold mt-0.5 tracking-wider uppercase">
          {session ? 'Account' : 'Sign In'}
        </span>
      </button>

      {/* 4. SETTINGS */}
      <button
        type="button"
        onClick={handleSettingsClick}
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer group"
      >
        <div className="p-1 rounded-xl transition group-hover:bg-slate-100 dark:group-hover:bg-slate-800">
          <Settings className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold mt-0.5 tracking-wider uppercase">Settings</span>
      </button>
    </nav>
  );
}
