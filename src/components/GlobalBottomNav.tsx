import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Home, MessageSquare, LogIn, LayoutDashboard, MoreHorizontal, Phone, X, ExternalLink, Target, Info, Target as TargetIcon, ShieldCheck, Eye, Sparkles, Sprout, BookOpen } from 'lucide-react';
import { getSession } from '../services/api';

export default function GlobalBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getSession());
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const chatPopupRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Listen for login/logout and session updates
  useEffect(() => {
    const checkSession = () => setSession(getSession());
    const openChat = () => setShowChatOptions(true);
    window.addEventListener('storage', checkSession);
    window.addEventListener('dc_storage_update', checkSession);
    window.addEventListener('dc_auth_change', checkSession);
    window.addEventListener('dc_open_chat', openChat);
    return () => {
      window.removeEventListener('storage', checkSession);
      window.removeEventListener('dc_storage_update', checkSession);
      window.removeEventListener('dc_auth_change', checkSession);
      window.removeEventListener('dc_open_chat', openChat);
    };
  }, []);

  // Close menus when clicking outside or navigating
  useEffect(() => {
    setShowChatOptions(false);
    setShowMoreMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showChatOptions && chatPopupRef.current && !chatPopupRef.current.contains(e.target as Node)) {
        setShowChatOptions(false);
      }
      if (showMoreMenu && moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showChatOptions, showMoreMenu]);

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
  const isFarmLifeActive = location.pathname === '/farmlife' || location.pathname.startsWith('/farmlife');
  const isPlanningActive = location.pathname === '/planning' || (isPortalActive && location.search.includes('tab=planning'));
  const isSignInActive = !session && location.pathname.startsWith('/signin');

  // Handle Planning Click
  const handlePlanningClick = () => {
    setShowChatOptions(false);
    if (session && isPortalActive) {
      window.dispatchEvent(new CustomEvent('dc_portal_tab_switch', { detail: 'planning' }));
    } else if (session) {
      navigate('/member?tab=planning');
    } else {
      navigate('/planning');
    }
  };

  // Handle Chat Click -> Show WhatsApp & Call Options
  const handleChatClick = () => {
    setShowChatOptions(prev => !prev);
  };

  // Handle Account / Dashboard Click
  const handleAccountClick = () => {
    setShowChatOptions(false);
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
    setShowChatOptions(false);
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
    <>
      {/* ─────────────────────────────────────────────────────────────
          CHAT OPTIONS MODAL / ACTION SHEET (WHATSAPP & CALL)
         ───────────────────────────────────────────────────────────── */}
      {showChatOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            ref={chatPopupRef}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Contact &amp; Chat
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Direct connection with our team
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowChatOptions(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* WhatsApp Option Button */}
            <a
              href="https://wa.me/256747325565"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowChatOptions(false)}
              className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm shadow-md transition active:scale-[0.98]"
            >
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="font-extrabold">Chat on WhatsApp</div>
                <div className="text-xs text-white/80">Available anytime</div>
              </div>
              <ExternalLink className="w-4 h-4 text-white/80" />
            </a>

            {/* Direct Phone Call Button */}
            <a
              href="tel:+256747325565"
              onClick={() => setShowChatOptions(false)}
              className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-sm shadow-md transition active:scale-[0.98] border border-slate-700"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-extrabold">Call Us</div>
                <div className="text-xs text-slate-400">Speak to our team</div>
              </div>
              <Phone className="w-4 h-4 text-slate-400" />
            </a>

            {/* If on Portal, option to switch to internal chat tab */}
            {isPortalActive && (
              <button
                type="button"
                onClick={() => {
                  setShowChatOptions(false);
                  window.dispatchEvent(new CustomEvent('dc_portal_tab_switch', { detail: 'chat' }));
                }}
                className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Open Internal Portal Chat</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MORE DETAILS MODAL / ACTION SHEET (TOP NAV DETAILS)
         ───────────────────────────────────────────────────────────── */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            ref={moreMenuRef}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Explore More
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Diaspora Connect Sections
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/about"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200/70 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 transition"
              >
                <Info className="w-4 h-4 text-emerald-600" />
                <span>About Us</span>
              </Link>

              <Link
                to="/vision"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200/70 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 transition"
              >
                <Eye className="w-4 h-4 text-amber-500" />
                <span>Vision</span>
              </Link>

              <Link
                to="/mission"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200/70 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 transition"
              >
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Mission</span>
              </Link>

              <Link
                to="/values"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200/70 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 transition"
              >
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>Values</span>
              </Link>

              <Link
                to="/farmlife"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200/70 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 transition"
              >
                <Sprout className="w-4 h-4 text-emerald-600" />
                <span>Farm Life</span>
              </Link>

              <Link
                to="/blog"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200/70 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 transition"
              >
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>Blog</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          UNIVERSAL BOTTOM NAVIGATION DOCK (MOBILE ONLY - HIDDEN ON DESKTOPS)
         ───────────────────────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center justify-around shadow-2xl pb-[max(10px,env(safe-area-inset-bottom))] transition-all duration-300"
        aria-label="Bottom Navigation Bar"
      >
        {/* 1. HOME — Public Website */}
        <Link
          to="/"
          onClick={() => { setShowChatOptions(false); setShowMoreMenu(false); }}
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

        {/* 2. FARM LIFE (public) / PLANNING (signed in) */}
        {session ? (
          <button
            type="button"
            onClick={() => { setShowMoreMenu(false); handlePlanningClick(); }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer group ${
              isPlanningActive
                ? 'text-emerald-700 dark:text-emerald-400 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400'
            }`}
          >
            <div className={`p-1 rounded-xl transition ${isPlanningActive ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800'}`}>
              <Target className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold mt-0.5 tracking-wider uppercase">Planning</span>
          </button>
        ) : (
          <Link
            to="/farmlife"
            onClick={() => { setShowChatOptions(false); setShowMoreMenu(false); }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition group ${
              isFarmLifeActive
                ? 'text-emerald-700 dark:text-emerald-400 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400'
            }`}
          >
            <div className={`p-1 rounded-xl transition ${isFarmLifeActive ? 'bg-emerald-500/15' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800'}`}>
              <Sprout className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold mt-0.5 tracking-wider uppercase">Farm Life</span>
          </Link>
        )}

        {/* 3. CHAT — WhatsApp / Call Action Sheet */}
        <button
          type="button"
          onClick={() => { setShowMoreMenu(false); handleChatClick(); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer group ${
            showChatOptions
              ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
              : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400'
          }`}
        >
          <div className={`p-1 rounded-xl transition ${showChatOptions ? 'bg-emerald-500/20' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800'}`}>
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold mt-0.5 tracking-wider uppercase">Chat</span>
        </button>

        {/* 4. SIGN IN / ACCOUNT (DASHBOARD) */}
        <button
          type="button"
          onClick={() => { setShowMoreMenu(false); handleAccountClick(); }}
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

        {/* 5. MORE — Top Navbar Details */}
        <button
          type="button"
          onClick={() => {
            setShowChatOptions(false);
            setShowMoreMenu(prev => !prev);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer group ${
            showMoreMenu
              ? 'text-emerald-700 dark:text-emerald-400 font-extrabold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-xl transition ${showMoreMenu ? 'bg-emerald-500/15' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800'}`}>
            <MoreHorizontal className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold mt-0.5 tracking-wider uppercase">More</span>
        </button>
      </nav>
    </>
  );
}
