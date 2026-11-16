import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getSession, clearSession } from '../../services/api';
import AccessDenied from '../../components/AccessDenied';
import { applyTheme, getTheme } from '../../services/theme';
import PortalBottomNav from '../../components/PortalBottomNav';
import { SaccoFarmStore, CattleAnimal, MilkLogRecord, CowHealthRecord, FeedInventoryItem } from '../../services/saccoFarmStore';
import {
  Briefcase,
  Users,
  PieChart,
  FileText,
  BarChart3,
  Download,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Milk,
  Coffee,
  Calendar,
  Menu,
  X,
  Globe,
  TrendingUp,
  Award,
  Building,
  Sun,
  Moon,
  Search,
} from 'lucide-react';

export default function BoardPortal() {
  const navigate = useNavigate();
  const session = getSession();

  if (session && session.role === 'MEMBER') {
    return <AccessDenied message="You have no access to this field." backPath="/member" />;
  }
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'farm' | 'governance' | 'chat' | 'settings'>('overview');
  const [farmSubTab, setFarmSubTab] = useState<'dairy' | 'feeds' | 'cows' | 'health'>('dairy');
  const [selectedCow, setSelectedCow] = useState<CattleAnimal | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // -- Theme State ------------------------------------------------------------
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('dc_portal_theme') as 'dark' | 'light') || 'dark';
  });
  const isDark = themeMode === 'dark';
  const toggleTheme = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    applyTheme(next);
  };

  useEffect(() => {
    const handlePortalTabSwitch = (e: any) => {
      const tab = e.detail;
      if (tab === 'chat') setActiveTab('chat');
      else if (tab === 'dashboard') setActiveTab('overview');
      else if (tab === 'settings') setActiveTab('governance');
    };
    window.addEventListener('dc_portal_tab_switch', handlePortalTabSwitch);
    return () => window.removeEventListener('dc_portal_tab_switch', handlePortalTabSwitch);
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate('/signin');
  };

  return (
    <div className={`min-h-screen flex antialiased font-sans selection:bg-emerald-600 selection:text-white ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* -------------------------------------------------------------
          1. PERMANENT LEFT SIDEBAR
         ------------------------------------------------------------- */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 p-4 flex flex-col justify-between shrink-0 shadow-2xl transition-transform duration-200 overflow-y-auto ${
          isDark ? 'bg-slate-900 border-r border-slate-200 dark:border-slate-800' : 'bg-white border-r border-slate-200'
        } ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-5">
          {/* Brand Header */}
          <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-200 dark:border-slate-800' : 'border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-slate-900 dark:text-white shadow-lg shadow-emerald-900/30 text-lg">
                DC
              </div>
              <div>
                <h1 className={`font-extrabold text-sm tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Diaspora Connect</h1>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider uppercase">BOARD OF DIRECTORS</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`p-1 rounded-lg md:hidden ${isDark ? 'text-slate-500 dark:text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Board Chairperson Profile Widget */}
          <div className={`p-3 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <img
                src="/images/nyanzi_edrine.jpg"
                alt="Mr. Nyanzi Edrine"
                className="w-11 h-11 rounded-xl object-cover border border-emerald-500/40 shadow-md shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>Mr. Nyanzi Edrine</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">Board Chairperson</p>
                <span className="inline-block px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                  Governance Oversight
                </span>
              </div>
            </div>
          </div>

          {/* Left Navigation Items */}
          <div className="space-y-1">
            <button
              onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : isDark
                  ? 'text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Strategic KPIs</span>
            </button>

            <button
              onClick={() => { setActiveTab('financials'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'financials'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : isDark
                  ? 'text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Audited Trial Balance</span>
            </button>

            <button
              onClick={() => { setActiveTab('farm'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'farm'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : isDark
                  ? 'text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Milk className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Farm</span>
            </button>

            <button
              onClick={() => { setActiveTab('governance'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'governance'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : isDark
                  ? 'text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0 text-blue-500" />
              <span>Resolutions &amp; Minutes</span>
            </button>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className={`pt-4 border-t space-y-2 ${isDark ? 'border-slate-200 dark:border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition border ${
              isDark
                ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-white'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {isDark ? <Sun className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> : <Moon className="w-4 h-4 text-emerald-600" />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <span className="text-[10px] font-mono uppercase text-slate-500">{themeMode}</span>
          </button>

          <Link
            to="/"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${
              isDark ? 'text-slate-500 dark:text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Public Website</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* -------------------------------------------------------------
          2. MAIN CONTENT AREA
         ------------------------------------------------------------- */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className={`sticky top-0 z-30 backdrop-blur border-b px-4 sm:px-6 py-3.5 flex items-center justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-200 dark:border-slate-800' : 'bg-white/90 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`p-1.5 rounded-xl md:hidden ${
                isDark ? 'bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className={`text-base sm:text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Board Governance &amp; Strategy</h2>
              <p className={`text-xs ${isDark ? 'text-slate-500 dark:text-slate-400' : 'text-slate-500'}`}>Institutional Oversight &middot; Certified Read-Only Environment</p>
            </div>
          </div>

          {/* Module Search Bar */}
          <div className="relative hidden md:block max-w-xs w-full mx-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
              isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
            }`}>
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search board modules, financials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-xs font-bold placeholder:text-slate-400 placeholder:font-normal"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Search Dropdown */}
            {searchQuery.trim().length > 0 && (
              <div className={`absolute top-full left-0 right-0 mt-1.5 p-2 rounded-xl shadow-2xl border z-50 max-h-72 overflow-y-auto ${
                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1">Board Modules</div>
                {[
                  { id: 'overview', label: 'Executive Overview & Strategic KPIs' },
                  { id: 'financials', label: 'Financial Audit & Balance Sheet' },
                  { id: 'operations', label: 'Luwero Farm & Value Chain Report' },
                  { id: 'governance', label: 'Governance & Board Resolutions' },
                ].filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase())).map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setActiveTab(t.id as any); setSearchQuery(''); }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-500/10 hover:text-emerald-500 flex items-center justify-between"
                  >
                    <span>{t.label}</span>
                    <span className="text-[10px] font-mono text-slate-400">Jump</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5 border ${
              isDark ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Certified Governance</span>
            </span>

            {/* Header Theme Switch */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-600 dark:text-slate-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
              }`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <Sun className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> : <Moon className="w-4 h-4 text-emerald-600" />}
              <span className="hidden md:inline">{isDark ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="p-4 sm:p-6 space-y-6 flex-1">
          {/* TAB 1: STRATEGIC KPIS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800$2">
                  <span className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold block mb-1">Total Cooperative Assets</span>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">UGX 1.84 Billion</div>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">+16.4% YoY Growth</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800$2">
                  <span className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold block mb-1">Member Equity Capital</span>
                  <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 font-mono">UGX 640,000,000</div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">2,560 Issued Shares</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800$2">
                  <span className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold block mb-1">Commercial Dairy Output</span>
                  <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">63,900 Liters / mo</div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">100% Off-take Brookside</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800$2">
                  <span className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold block mb-1">Coffee Export Volume</span>
                  <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 font-mono">114 Metric Tons</div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Hamburg &amp; Rotterdam</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Approved Quarterly Disclosures</h3>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono">Certified by External Auditor</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  The cooperative maintains audited liquidity ratios above statutory requirements, with ordinary member savings separated from the commercial dairy and coffee trading capital pools.
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white rounded-xl text-xs font-extrabold flex items-center gap-2 transition shadow-md shadow-emerald-900/30"
                  >
                    <Download className="w-4 h-4" /> Download Q3 Audited Report (PDF)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUDITED FINANCIALS */}
          {activeTab === 'financials' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Certified Double-Entry Trial Balance</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Generated directly from immutable General Ledger journal postings.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800 text-[10px]">
                      <th className="py-2.5 px-3">Account Code</th>
                      <th className="py-2.5 px-3">Account Title</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Debit (UGX)</th>
                      <th className="py-2.5 px-3 text-right">Credit (UGX)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-blue-700 dark:text-blue-400">1010</td>
                      <td className="py-2.5 px-3 font-sans text-slate-200">Operating Cash &amp; Bank (Centenary / Stanbic)</td>
                      <td className="py-2.5 px-3 font-sans text-emerald-700 dark:text-emerald-400 font-bold">ASSET</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">342,500,000</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">0</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-blue-700 dark:text-blue-400">1100</td>
                      <td className="py-2.5 px-3 font-sans text-slate-200">Luwero Commercial Cattle Herd Asset</td>
                      <td className="py-2.5 px-3 font-sans text-emerald-700 dark:text-emerald-400 font-bold">ASSET</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">568,000,000</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">0</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-blue-700 dark:text-blue-400">2010</td>
                      <td className="py-2.5 px-3 font-sans text-slate-200">Ordinary Member Savings Deposits</td>
                      <td className="py-2.5 px-3 font-sans text-rose-400 font-bold">LIABILITY</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">0</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">420,500,000</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-blue-700 dark:text-blue-400">3010</td>
                      <td className="py-2.5 px-3 font-sans text-slate-200">Member Share Capital (UGX 250,000/share)</td>
                      <td className="py-2.5 px-3 font-sans text-blue-700 dark:text-blue-400 font-bold">EQUITY</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">0</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">490,000,000</td>
                    </tr>
                    <tr className="bg-slate-50 dark:bg-slate-950 font-bold font-sans text-xs border-t border-slate-200 dark:border-slate-800">
                      <td colSpan={3} className="py-3 px-3 uppercase text-slate-900 dark:text-white">Total Balanced Invariant</td>
                      <td className="py-3 px-3 text-right text-emerald-700 dark:text-emerald-400 font-mono">UGX 910,500,000</td>
                      <td className="py-3 px-3 text-right text-emerald-700 dark:text-emerald-400 font-mono">UGX 910,500,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: FARM (DAIRY, FEEDS, COWS, HEALTH) */}
          {activeTab === 'farm' && (() => {
            const cattleList = SaccoFarmStore.getCattle();
            const milkLogs = SaccoFarmStore.getMilkLogs();
            const healthLogs = SaccoFarmStore.getAllHealthRecords ? SaccoFarmStore.getAllHealthRecords() : [];
            const feedList = SaccoFarmStore.getFeedInventory ? SaccoFarmStore.getFeedInventory() : [];
            const totalRev = milkLogs.reduce((s, m) => s + m.revenue, 0);

            return (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Farm Oversight</h3>
                    <p className="text-xs text-slate-500">Board governance of Dairy Production, Feeds Stock, Herd Registry &amp; Veterinary Health</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {cattleList.length} Head of Cattle
                  </span>
                </div>

                {/* Subtabs Bar */}
                <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  {[
                    { key: 'dairy', label: 'DAIRY' },
                    { key: 'feeds', label: 'FEEDS' },
                    { key: 'cows', label: 'COWS' },
                    { key: 'health', label: 'HEALTH' },
                  ].map(sub => (
                    <button
                      key={sub.key}
                      onClick={() => setFarmSubTab(sub.key as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                        farmSubTab === sub.key
                          ? 'bg-emerald-600 text-white shadow-md'
                          : isDark
                          ? 'bg-slate-900 text-slate-400 hover:text-white'
                          : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                {/* 1. Dairy */}
                {farmSubTab === 'dairy' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                        <span className="text-xs text-slate-500 uppercase font-bold">Total Herd</span>
                        <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">{cattleList.length} head</div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                        <span className="text-xs text-slate-500 uppercase font-bold">Milking Cows</span>
                        <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">{cattleList.filter(c => c.stage === 'Milking').length} head</div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                        <span className="text-xs text-slate-500 uppercase font-bold">Total Milk Revenue</span>
                        <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">UGX {totalRev.toLocaleString()}</div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                        <span className="text-xs text-slate-500 uppercase font-bold">Production Logs</span>
                        <div className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 mt-1">{milkLogs.length} entries</div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Recent Daily Milk Production</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-100 dark:bg-slate-800/50">
                            <tr>
                              {['Date', 'Morning (L)', 'Afternoon (L)', 'Evening (L)', 'Net Sold (L)', 'Price/L', 'Revenue (UGX)'].map(h => (
                                <th key={h} className="text-left text-slate-800 dark:text-slate-300 font-bold uppercase text-[11px] py-2 px-3">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                            {milkLogs.slice(0, 10).map(ml => (
                              <tr key={ml.id}>
                                <td className="py-2.5 px-3 text-slate-500 font-bold">{ml.date}</td>
                                <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{ml.morning}</td>
                                <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{ml.afternoon}</td>
                                <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{ml.evening}</td>
                                <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">{ml.netSold}</td>
                                <td className="py-2.5 px-3 text-slate-500">{ml.offtakerPrice.toLocaleString()}</td>
                                <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">UGX {ml.revenue.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Feeds */}
                {farmSubTab === 'feeds' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                        <span className="text-xs text-slate-500 uppercase font-bold">Feed Items</span>
                        <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">{feedList.length} types</div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                        <span className="text-xs text-slate-500 uppercase font-bold">Farm Made Feeds</span>
                        <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">{feedList.filter(f => f.source === 'FARM_MADE').length} batches</div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                        <span className="text-xs text-slate-500 uppercase font-bold">Purchased Feeds</span>
                        <div className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 mt-1">{feedList.filter(f => f.source === 'BOUGHT').length} batches</div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                        <span className="text-xs text-slate-500 uppercase font-bold">Total Feed Value</span>
                        <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">UGX {feedList.reduce((s, f) => s + (f.totalCost || 0), 0).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Feeds Inventory Register</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-100 dark:bg-slate-800/50">
                            <tr>
                              {['Feed Type', 'Source', 'Current Stock', 'Unit Cost', 'Total Value', 'Date Updated'].map(h => (
                                <th key={h} className="text-left text-slate-800 dark:text-slate-300 font-bold uppercase text-[11px] py-2 px-3">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {feedList.map(f => (
                              <tr key={f.id}>
                                <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{f.feedType}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    f.source === 'FARM_MADE' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                                  }`}>
                                    {f.source === 'FARM_MADE' ? 'Farm Made (UGX 0)' : 'Purchased'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{f.currentStock} {f.unit}</td>
                                <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                                  {f.source === 'FARM_MADE' ? 'UGX 0' : `UGX ${(f.unitCost || 0).toLocaleString()}`}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {f.source === 'FARM_MADE' ? 'UGX 0' : `UGX ${(f.totalCost || 0).toLocaleString()}`}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 font-mono">{f.lastUpdated}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Cows */}
                {farmSubTab === 'cows' && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Herd Register</h4>
                        <span className="text-xs font-mono font-bold text-slate-400">{cattleList.length} head</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-100 dark:bg-slate-800/50">
                            <tr>
                              {['Tag', 'Name', 'Breed', 'Stage', 'Weight', 'Daily Avg (L)', 'Health Status', 'Action'].map(h => (
                                <th key={h} className="text-left text-slate-800 dark:text-slate-300 font-bold uppercase text-[11px] py-2 px-3">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {cattleList.map(c => {
                              const isSick = c.status && c.status.some(s => s.toLowerCase().includes('sick'));
                              return (
                                <tr key={c.id}>
                                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{c.tagNumber}</td>
                                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{c.name}</td>
                                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{c.breed}</td>
                                  <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400 font-bold">{c.stage}</td>
                                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">{c.weight}kg</td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{c.dailyAvgMilk || '0.0'}</td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      isSick ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                    }`}>
                                      {isSick ? 'Sick (Treatment)' : 'Healthy'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <button
                                      onClick={() => setSelectedCow(c)}
                                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px]"
                                    >
                                      DOSSIER
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Health */}
                {farmSubTab === 'health' && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Herd Health &amp; Veterinary Incidents</h4>
                        <span className="text-xs font-mono font-bold text-slate-400">{healthLogs.length} clinical records</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-100 dark:bg-slate-800/50">
                            <tr>
                              {['Date', 'Cow Tag & Name', 'Illness', 'Symptoms', 'Treatment', 'Vet', 'Status'].map(h => (
                                <th key={h} className="text-left text-slate-800 dark:text-slate-300 font-bold uppercase text-[11px] py-2 px-3">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                            {healthLogs.map(rec => (
                              <tr key={rec.id}>
                                <td className="py-2.5 px-3 text-slate-500 font-bold">{rec.date}</td>
                                <td className="py-2.5 px-3 font-sans">
                                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{rec.cowTag}</span>
                                  <span className="block font-bold text-slate-900 dark:text-white">{rec.cowName}</span>
                                </td>
                                <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white">{rec.illness}</td>
                                <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">{rec.symptoms || '—'}</td>
                                <td className="py-2.5 px-3 font-sans">
                                  <div>{rec.treatment}</div>
                                  {rec.medication && <div className="text-[10px] text-slate-500">Rx: {rec.medication}</div>}
                                </td>
                                <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400">{rec.vetName}</td>
                                <td className="py-2.5 px-3 font-sans">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    rec.status === 'UNDER_TREATMENT' || rec.status === 'CURRENTLY_SICK'
                                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                  }`}>
                                    {rec.status === 'UNDER_TREATMENT' ? 'Under Treatment' : rec.status === 'CURRENTLY_SICK' ? 'Sick' : 'Recovered'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB: CHAT */}
          {activeTab === 'chat' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto text-lg font-bold">
                MSG
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white">Board &amp; Leadership Direct Messaging</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Direct encrypted channel connecting Board of Directors with Sacco Management.</p>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="font-extrabold text-slate-900 dark:text-white">Board Governance Settings</h3>
              <p className="text-xs text-slate-500">Supervisory oversight roles and quorum thresholds.</p>
            </div>
          )}

          {/* TAB 4: GOVERNANCE & RESOLUTIONS */}
          {activeTab === 'governance' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Board Resolutions &amp; Statutory Records</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white text-xs">Resolution #2026-14: Q3 Surplus Dividend Authorization</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Approved by Chairperson Mr. Nyanzi Edrine &middot; August 2026</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                    EXECUTED
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white text-xs">Resolution #2026-15: Farmland Acreage Capitalization (Nakasongola)</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Approved by Full Board Quorum &middot; September 2026</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[10px] font-bold">
                    IN PROGRESS
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    
      {/* ── COW DOSSIER MODAL FOR BOARD ─────────────────────────────────── */}
      {selectedCow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setSelectedCow(null)}>
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{selectedCow.name} ({selectedCow.tagNumber})</h3>
                <p className="text-xs text-slate-500">{selectedCow.breed} &middot; {selectedCow.gender || 'Female'} &middot; {selectedCow.stage}</p>
              </div>
              <button onClick={() => setSelectedCow(null)} className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold block">Current Stage</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{selectedCow.stage}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold block">Health Status</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{selectedCow.status[0] || 'Healthy'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold block">Weight</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{selectedCow.weight || 500} kg</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold block">Daily Milk Avg</span>
                <span className="text-sm font-black text-blue-600 dark:text-blue-400">{selectedCow.dailyAvgMilk || '0.0'} L</span>
              </div>
            </div>
            {selectedCow.healthHistory && selectedCow.healthHistory.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2">Historical Sickness Records:</span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto text-xs">
                  {selectedCow.healthHistory.map((h, i) => (
                    <div key={i} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{h.illness}</span>
                        <span className="block text-[10px] text-slate-500 font-mono">{h.date} &middot; Vet: {h.vetName}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{h.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-2 flex justify-end">
              <button onClick={() => setSelectedCow(null)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Home, Dashboard, Chat, Settings) */}
      <PortalBottomNav
        currentTab={activeTab === 'overview' ? 'dashboard' : activeTab}
        onSelectTab={t => {
          if (t === 'dashboard') setActiveTab('overview');
          else if (t === 'chat') setActiveTab('chat');
          else if (t === 'settings') setActiveTab('settings');
          else setActiveTab(t as any);
        }}
        dashboardTab="dashboard"
      />
    </div>
  );
}






