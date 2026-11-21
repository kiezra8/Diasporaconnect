import React, { useState, useEffect } from 'react';
import ApplicationKycSummary from '../../components/kyc/ApplicationKycSummary';
import { useNavigate, Link } from 'react-router-dom';
import { getSession, clearSession } from '../../services/api';
import AccessDenied from '../../components/AccessDenied';
import { applyTheme, getTheme } from '../../services/theme';
import PortalBottomNav from '../../components/PortalBottomNav';
import { SaccoFarmStore, SaccoMember } from '../../services/saccoFarmStore';
import KycReviewPanel from '../../components/kyc/KycReviewPanel';
import MyTasksCard from '../../components/settings/MyTasksCard';
import {
  UserCheck,
  UserPlus,
  Clock,
  LogOut,
  CheckCircle2,
  Menu,
  X,
  Users,
  Building,
  FileText,
  Search,
  Upload,
  Bell,
  Globe,
  Eye,
  AlertCircle,
  Sun,
  Moon,
} from 'lucide-react';

type TabId = 'register' | 'applications' | 'directory' | 'kyc' | 'requests' | 'notices' | 'chat' | 'settings';

export interface PendingMemberApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  chapter: string;
  reason: string;
  photoUrl?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  secretaryApproved: boolean;
  adminApproved: boolean;
  submittedAt: string;
  memberId?: string;
  dob?: string;
  gender?: string;
  kyc?: any;
}

export default function SecretaryPortal() {
  const navigate = useNavigate();
  const session = getSession();

  if (session && session.role === 'MEMBER') {
    return <AccessDenied message="You have no access to this field." backPath="/member" />;
  }

  const [activeTab, setActiveTab] = useState<TabId>('register');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<SaccoMember | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [secNavSearch, setSecNavSearch] = useState('');
  const [showSecDropdown, setShowSecDropdown] = useState(false);

  // ── Theme State ────────────────────────────────────────────────────────────
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    return getTheme();
  });
  const isDark = themeMode === 'dark';
  const toggleTheme = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    applyTheme(next);
  };

  // Live data
  const [members, setMembers] = useState<SaccoMember[]>([]);
  const [memberApps, setMemberApps] = useState<PendingMemberApplication[]>([]);

  // Register form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [chapter, setChapter] = useState('London Chapter');
  const [ninOrPassport, setNinOrPassport] = useState('');
  const [occupation, setOccupation] = useState('');
  const [nextOfKin, setNextOfKin] = useState('');

  // Financial request statuses (Sec. can see status, NOT amounts or balances)
  const [requestStatuses] = useState([
    {
      reqId: 'REQ-DEP-9021',
      member: 'David Mukasa (DC-006)',
      type: 'Deposit Notification',
      timestamp: '2026-11-12 08:45',
      status: 'VERIFIED_BY_ACCOUNTANT',
      workflowStep: 'Awaiting Final Admin Authorization',
    },
    {
      reqId: 'REQ-WTH-8819',
      member: 'Amara Okello (DC-007)',
      type: 'Withdrawal Notification',
      timestamp: '2026-11-12 09:15',
      status: 'PENDING_ACCOUNTANT_REVIEW',
      workflowStep: 'In Accountant Compliance Queue',
    },
    {
      reqId: 'REQ-LN-7742',
      member: 'Mr. Nyanzi Edrine (DC-001)',
      type: 'Loan Application',
      timestamp: '2026-11-11 14:30',
      status: 'APPROVED',
      workflowStep: 'Disbursed & Active',
    },
  ]);

  // Operational notices
  const [notices, setNotices] = useState([
    { id: 'NT-001', title: 'General Meeting — Q4 2026', date: '2026-11-20', body: 'Quarterly general member meeting scheduled for November 20th at 3:00 PM EAT via Zoom. Agenda: Farm performance, loan book update, elections.', priority: 'HIGH' },
    { id: 'NT-002', title: 'KYC Document Reminder', date: '2026-11-15', body: 'Members DC-MBR-00106 and DC-MBR-00108 have outstanding KYC documents. Please follow up for NIN/Passport copies.', priority: 'MEDIUM' },
    { id: 'NT-003', title: 'New Member Onboarding Batch', date: '2026-11-01', body: 'Three new member registrations pending document collection. Coordinate with Admin for account activation.', priority: 'LOW' },
  ]);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticePriority, setNoticePriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 5000);
  };

  const reloadData = () => {
    setMembers(SaccoFarmStore.getMembers());
    try {
      const stored = JSON.parse(localStorage.getItem('dc_member_registrations') || '[]');
      setMemberApps(stored);
    } catch {
      setMemberApps([]);
    }
  };

  const handleSecretaryRecommend = (id: string) => {
    try {
      const stored: PendingMemberApplication[] = JSON.parse(localStorage.getItem('dc_member_registrations') || '[]');
      let targetName = '';
      const updated = stored.map(app => {
        if (app.id === id) {
          targetName = app.fullName;
          const newSecApproved = true;
          const isFullyApproved = app.adminApproved && newSecApproved;
          const assignedId = isFullyApproved ? SaccoFarmStore.activateApplication(app, 'Secretary').memberId : app.memberId;
          return {
            ...app,
            secretaryApproved: newSecApproved,
            status: isFullyApproved ? ('APPROVED' as const) : ('PENDING_APPROVAL' as const),
            memberId: isFullyApproved ? assignedId : app.memberId
          };
        }
        return app;
      });
      localStorage.setItem('dc_member_registrations', JSON.stringify(updated));
      window.dispatchEvent(new Event('dc_storage_update'));
      setMemberApps(updated);
      notify(`Secretariat recommendation recorded for ${targetName}. Awaiting Admin final authorization.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSecretaryReject = (id: string) => {
    if (!window.confirm('Reject this member application?')) return;
    try {
      const stored: PendingMemberApplication[] = JSON.parse(localStorage.getItem('dc_member_registrations') || '[]');
      const updated = stored.map(app => {
        if (app.id === id) {
          return { ...app, status: 'REJECTED' as const };
        }
        return app;
      });
      localStorage.setItem('dc_member_registrations', JSON.stringify(updated));
      window.dispatchEvent(new Event('dc_storage_update'));
      setMemberApps(updated);
      notify('Application rejected by Secretariat.');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    reloadData();
    const handlePortalTabSwitch = (e: any) => {
      const tab = e.detail;
      if (tab === 'chat') setActiveTab('chat');
      else if (tab === 'dashboard') setActiveTab('register');
      else if (tab === 'settings') setActiveTab('settings');
    };
    window.addEventListener('dc_portal_tab_switch', handlePortalTabSwitch);
    window.addEventListener('dc_storage_update', reloadData);
    return () => {
      window.removeEventListener('dc_portal_tab_switch', handlePortalTabSwitch);
      window.removeEventListener('dc_storage_update', reloadData);
    };
  }, []);

  const handleRegisterMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;

    SaccoFarmStore.addMember({
      memberId: '',
      name: fullName,
      phone,
      email,
      nin: ninOrPassport,
      category: `Diaspora (${country})`,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
      jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
      adminFee: 50000, shares: 0,
    });

    notify(`New member ${fullName} registered. Pending Admin activation and KYC verification.`);
    setFullName(''); setEmail(''); setPhone(''); setNinOrPassport(''); setOccupation(''); setNextOfKin('');
    reloadData();
  };

  const handleLogout = () => { clearSession(); navigate('/signin'); };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.memberId.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const pendingSecretaryCount = memberApps.filter(a => !a.secretaryApproved && a.status === 'PENDING_APPROVAL').length;

  const navItems: { id: TabId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'register', label: 'Register Member', icon: <UserPlus className="w-4 h-4" /> },
    { id: 'applications', label: 'Pending Approvals', icon: <CheckCircle2 className="w-4 h-4" />, badge: pendingSecretaryCount || undefined },
    { id: 'directory', label: 'Member Directory', icon: <Users className="w-4 h-4" />, badge: members.length },
    { id: 'kyc', label: 'KYC Management', icon: <UserCheck className="w-4 h-4" />, badge: members.filter(m => m.status === 'PENDING').length },
    { id: 'requests', label: 'Request Status', icon: <Clock className="w-4 h-4" />, badge: requestStatuses.filter(r => r.status !== 'APPROVED').length },
    { id: 'notices', label: 'Notices & Records', icon: <Bell className="w-4 h-4" />, badge: notices.filter(n => n.priority === 'HIGH').length },
  ];

  return (
    <div className={`min-h-screen flex antialiased font-sans selection:bg-emerald-600 selection:text-white ${
      isDark ? 'bg-slate-50 dark:bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden" />
      )}

      {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────── */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 p-4 flex flex-col justify-between shrink-0 shadow-2xl transition-transform duration-200 overflow-y-auto ${
        isDark ? 'bg-slate-900 border-r border-slate-200 dark:border-slate-800' : 'bg-white border-r border-slate-200'
      } ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="space-y-5">
          <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-200 dark:border-slate-800' : 'border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-slate-900 dark:text-white shadow-lg text-lg">DC</div>
              <div>
                <h1 className={`font-extrabold text-sm tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Diaspora Connect</h1>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider uppercase">Secretariat & Records</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className={`p-1 rounded-lg md:hidden ${isDark ? 'text-slate-500 dark:text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile */}
          <div className={`p-3 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center border border-emerald-500/40 shrink-0">
                {session?.fullName?.slice(0, 2).toUpperCase() || 'SC'}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{session?.fullName || 'Halera John Bahati'}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">Secretary / Records</p>
                <span className="inline-block px-1.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">Operational Access</span>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="space-y-0.5">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === item.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : isDark
                    ? 'text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                    isDark ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

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

          <Link to="/" className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${
            isDark ? 'text-slate-500 dark:text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}>
            <Globe className="w-4 h-4" />
            <span>Public Website</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <header className={`sticky top-0 z-30 backdrop-blur border-b px-4 sm:px-6 py-3.5 flex items-center justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-200 dark:border-slate-800' : 'bg-white/90 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className={`p-1.5 rounded-xl md:hidden ${
              isDark ? 'bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}>
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className={`text-base sm:text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Secretariat & Member Records</h2>
              <p className={`text-xs ${isDark ? 'text-slate-500 dark:text-slate-400' : 'text-slate-500'}`}>Member Registration, KYC Management & Operational Records</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`hidden sm:flex text-xs px-3 py-1 rounded-full font-mono font-bold items-center gap-1.5 border ${
              isDark ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              <Users className="w-3.5 h-3.5" />
              <span>{members.length} Registered</span>
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

        {notification && (
          <div className="m-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        <main className="p-4 sm:p-6 space-y-6 flex-1 pb-24 md:pb-6">

          {/* ── TAB: REGISTER ──────────────────────────────────────────── */}
          {activeTab === 'register' && (
            <div className="space-y-6">
              <MyTasksCard actor={{ name: session?.fullName || 'Staff', role: session?.role || 'SECRETARY', email: session?.email }} />
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Register New Member</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Complete member profile — account will be activated by Admin after KYC verification</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
                <form onSubmit={handleRegisterMember} className="space-y-5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Full Legal Name *', value: fullName, setter: setFullName, placeholder: 'As on passport/NIN', required: true, type: 'text' },
                      { label: 'Phone Number *', value: phone, setter: setPhone, placeholder: '+256 772 000 000 or +44 7911...', required: true, type: 'tel' },
                      { label: 'Email Address *', value: email, setter: setEmail, placeholder: 'member@example.com', required: true, type: 'email' },
                      { label: 'NIN / Passport Number', value: ninOrPassport, setter: setNinOrPassport, placeholder: 'CM840291...', required: false, type: 'text' },
                      { label: 'Occupation / Profession', value: occupation, setter: setOccupation, placeholder: 'e.g. Registered Nurse', required: false, type: 'text' },
                      { label: 'Next of Kin (Name & Phone)', value: nextOfKin, setter: setNextOfKin, placeholder: 'e.g. Sarah Mukasa +256...', required: false, type: 'text' },
                    ].map((f, i) => (
                      <div key={i}>
                        <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">{f.label}</label>
                        <input
                          type={f.type}
                          required={f.required}
                          value={f.value}
                          onChange={e => f.setter(e.target.value)}
                          placeholder={f.placeholder}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Country of Residence *</label>
                      <select value={country} onChange={e => setCountry(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500">
                        {['United Kingdom', 'Canada', 'UAE (Dubai)', 'USA', 'Australia', 'Germany', 'Sweden', 'Uganda (Kampala)', 'Other'].map(c => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Chapter / Branch</label>
                      <select value={chapter} onChange={e => setChapter(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500">
                        {['London Chapter', 'Toronto Chapter', 'Dubai Chapter', 'New York Chapter', 'Kampala Chapter', 'Other'].map(c => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Document upload note */}
                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-start gap-3">
                      <Upload className="w-4 h-4 text-blue-700 dark:text-blue-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-blue-700 dark:text-blue-300">KYC Documents Required</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          After registration, the member must submit: (1) NIN or Passport copy, (2) Proof of Address (utility bill/bank statement), (3) Passport-sized photo. Documents trigger Admin account activation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white font-extrabold text-sm transition shadow-lg flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Register Member (Pending KYC Activation)
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── TAB: PENDING APPROVALS ──────────────────────────────────── */}
          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Member Application Approvals</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dual-authorization gate: Review applicant KYC credentials and issue Secretariat recommendation. Final activation requires Admin authorization.
                </p>
              </div>

              {memberApps.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                  <p className="text-slate-900 dark:text-white font-bold">No Pending Membership Applications</p>
                  <p className="text-slate-400 text-xs mt-1">All new self-registered member applications have been reviewed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {memberApps.map(app => (
                    <div key={app.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          {app.photoUrl ? (
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-sm shrink-0 bg-slate-900">
                              <img src={app.photoUrl} alt={app.fullName} className="w-full h-full object-cover object-top" />
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/30">
                              <Users className="w-6 h-6" />
                            </div>
                          )}

                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-slate-500">{app.id}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                app.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                                app.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-500' :
                                'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              }`}>
                                {app.status.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[11px] text-slate-400">Submitted: {app.submittedAt}</span>
                            </div>

                            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                              {app.fullName}
                            </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <div><span className="text-slate-400">Email:</span> {app.email}</div>
                            <div><span className="text-slate-400">Phone:</span> {app.phone}</div>
                            <div><span className="text-slate-400">Chapter:</span> {app.chapter}</div>
                          </div>

                          <ApplicationKycSummary app={app} />
                          {app.reason && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">Reason / Interest:</span> {app.reason}
                            </p>
                          )}

                          {/* Dual approval status indicators */}
                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-slate-400 font-semibold">1. Secretariat:</span>
                              {app.secretaryApproved ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                                  <CheckCircle2 className="w-3 h-3" /> Recommended
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                                  <Clock className="w-3 h-3" /> Pending Review
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-slate-400 font-semibold">2. Admin:</span>
                              {app.adminApproved ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                                  <CheckCircle2 className="w-3 h-3" /> Authorized
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-500 dark:text-slate-400 font-bold text-[11px]">
                                  <Clock className="w-3 h-3" /> Awaiting Final Step
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                        {/* Action buttons */}
                        <div className="flex sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 shrink-0">
                          {app.status === 'PENDING_APPROVAL' && (
                            <>
                              {!app.secretaryApproved ? (
                                <button
                                  onClick={() => handleSecretaryRecommend(app.id)}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition"
                                >
                                  Recommend Approval
                                </button>
                              ) : (
                                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/30">
                                  Recommended to Admin
                                </span>
                              )}
                              <button
                                onClick={() => handleSecretaryReject(app.id)}
                                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 font-bold text-xs transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {app.status === 'APPROVED' && (
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/30">
                              Active Member ({app.memberId})
                            </span>
                          )}
                          {app.status === 'REJECTED' && (
                            <span className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-500 font-bold text-xs border border-rose-500/30">
                              Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: MEMBER DIRECTORY ──────────────────────────────────── */}
          {activeTab === 'directory' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Member Directory</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{members.length} registered members — operational view (no financial balances)</p>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    placeholder="Search by name, ID or email..."
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-56"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/50">
                      <tr><th className="text-slate-500 dark:text-slate-400 py-3 px-4 w-10">#</th>
                        {['Member ID', 'Name', 'Phone', 'Email', 'Country / Category', 'Join Date', 'Status'].map(h => (
                          <th key={h} className="text-left text-slate-500 dark:text-slate-400 font-semibold py-3 px-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {filteredMembers.map((m, __n) => (
                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30"><td className="py-3 px-4 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                          <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-mono font-bold">{m.memberId}</td>
                          <td className="py-3 px-4 font-semibold"><button onClick={() => { setSelectedMember(m); setShowMemberModal(true); }} className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-700 dark:text-emerald-400 underline-offset-2 hover:underline cursor-pointer text-left">{m.name}</button></td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">{m.phone}</td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-[160px] truncate">{m.email || 'N/A'}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-[140px] truncate">{m.category}</td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono">{m.joinDate}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                              m.status === 'PENDING' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400' :
                              'bg-rose-500/15 text-rose-400'
                            }`}>{m.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredMembers.length === 0 && (
                    <p className="text-slate-500 text-xs text-center py-6">No members match your search.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: KYC MANAGEMENT ────────────────────────────────────── */}
          {activeTab === 'kyc' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">KYC Document Management</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Track identity verification and document submission status</p>
              </div>

              <KycReviewPanel reviewerName={`${session?.fullName || 'Secretary'} (Secretary)`} onNotify={notify} />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Members', value: members.length, color: 'text-white' },
                  { label: 'Fully Verified', value: members.filter(m => m.status === 'ACTIVE').length, color: 'text-emerald-700 dark:text-emerald-400' },
                  { label: 'Pending KYC', value: members.filter(m => m.status === 'PENDING').length, color: 'text-blue-700 dark:text-blue-400' },
                  { label: 'Suspended', value: members.filter(m => m.status === 'SUSPENDED').length, color: 'text-rose-400' },
                ].map((k, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{k.label}</span>
                    <div className={`text-2xl font-extrabold font-mono mt-1 ${k.color}`}>{k.value}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">KYC Status Register</h4>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {members.map(m => (
                    <div key={m.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30 shrink-0">
                          {m.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <button onClick={() => { setSelectedMember(m); setShowMemberModal(true); }} className="text-xs font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-700 dark:text-emerald-400 underline-offset-2 hover:underline cursor-pointer text-left">{m.name}</button>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{m.memberId} • {m.category}</p>
                          <p className="text-[10px] text-slate-500">NIN: {m.nin || 'Not submitted'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          m.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                          m.status === 'PENDING' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400' :
                          'bg-rose-500/15 text-rose-400'
                        }`}>
                          {m.status === 'ACTIVE' ? 'Verified' : m.status === 'PENDING' ? 'Pending Docs' : 'Suspended'}
                        </span>
                        {m.status === 'PENDING' && (
                          <button
                            onClick={() => notify(`Reminder sent to ${m.name} for KYC document submission.`)}
                            className="px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-500/20"
                          >
                            Send Reminder
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: REQUEST STATUS ────────────────────────────────────── */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Financial Request Status Tracker</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  You can view request status only. Financial amounts and balances are confidential and visible to Accountant and Admin only.
                </p>
              </div>

              <div className="space-y-3">
                {requestStatuses.map(req => (
                  <div key={req.reqId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-500">{req.reqId}</span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{req.type}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{req.member}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Submitted: {req.timestamp}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          req.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                          req.status === 'VERIFIED_BY_ACCOUNTANT' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400' :
                          'bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>{req.status.replace(/_/g, ' ')}</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{req.workflowStep}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Workflow Information</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      All member financial transactions go through dual-control: (1) Accountant verifies payment evidence and posts to ledger, then (2) Admin gives final authorization. Members receive notifications at each stage.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: NOTICES ────────────────────────────────────────────── */}
          {activeTab === 'notices' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Notices & Operational Records</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Internal notices, member communications and operational documentation</p>
              </div>

              <div className="space-y-4">
                {notices.map(n => (
                  <div key={n.id} className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xl ${
                    n.priority === 'HIGH' ? 'border-rose-500/30' :
                    n.priority === 'MEDIUM' ? 'border-blue-500/30' :
                    'border-slate-200 dark:border-slate-800'
                  }`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            n.priority === 'HIGH' ? 'bg-rose-500/15 text-rose-400' :
                            n.priority === 'MEDIUM' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400' :
                            'bg-slate-500/15 text-slate-500 dark:text-slate-400'
                          }`}>{n.priority}</span>
                          <span className="text-xs text-slate-500 font-mono">{n.id}</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">{n.title}</h4>
                        <p className="text-[11px] text-slate-500">{n.date}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{n.body}</p>
                  </div>
                ))}
              </div>

              {/* Quick action: draft notice */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Draft Internal Notice</h4>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!noticeTitle.trim()) return;
                    const newN = {
                      id: `NT-${Date.now().toString().slice(-3)}`,
                      title: noticeTitle,
                      date: new Date().toISOString().split('T')[0],
                      body: noticeBody || 'Notice details recorded.',
                      priority: noticePriority,
                    };
                    setNotices(prev => [newN, ...prev]);
                    setNoticeTitle('');
                    setNoticeBody('');
                    notify('Notice drafted and saved to official records.');
                  }}
                  className="space-y-3"
                >
                  <div className="flex gap-2">
                    <input
                      required
                      placeholder="Notice title..."
                      value={noticeTitle}
                      onChange={(e) => setNoticeTitle(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <select
                      value={noticePriority}
                      onChange={(e) => setNoticePriority(e.target.value as any)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="LOW">Low Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="HIGH">High Priority</option>
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Notice body text..."
                    value={noticeBody}
                    onChange={(e) => setNoticeBody(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 resize-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    Save &amp; Post Notice
                  </button>
                </form>
              </div>
            </div>
          )}


          {/* TAB: CHAT */}
          {activeTab === 'chat' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto text-lg font-bold">
                MSG
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white">Secretary Member Inquiries &amp; Notices</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Member registration queries, KYC document verification follow-ups, and AGM notices.</p>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white">Secretariat Settings</h3>
              <p className="text-xs text-slate-500">Bylaws versioning, membership intake quotas, and official registry sealing keys.</p>
            </div>
          )}

        </main>      {/* -- MEMBER DETAIL MODAL --------------------------------------- */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowMemberModal(false)}>
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/50 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center">
                  {selectedMember.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black">{selectedMember.name}</h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">{selectedMember.memberId}  -  {selectedMember.category}</p>
                </div>
              </div>
              <button onClick={() => setShowMemberModal(false)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Phone Number</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedMember.phone}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Email Address</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">{selectedMember.email || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">NIN / Identification</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{selectedMember.nin || 'Pending Verification'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Registration Date</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{selectedMember.joinDate}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowMemberModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer hover:bg-slate-200"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
          {/* Mobile Bottom Navigation Bar (Home, Dashboard, Chat, Settings) */}
      <PortalBottomNav
        currentTab={activeTab === 'register' ? 'dashboard' : activeTab}
        onSelectTab={t => {
          if (t === 'dashboard') setActiveTab('register');
          else if (t === 'chat') setActiveTab('chat');
          else if (t === 'settings') setActiveTab('settings');
          else setActiveTab(t as any);
        }}
        dashboardTab="dashboard"
      />
    </div>
  );
}






