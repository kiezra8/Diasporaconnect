import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getSession, clearSession } from '../../services/api';
import AccessDenied from '../../components/AccessDenied';
import { applyTheme, getTheme } from '../../services/theme';
import PortalBottomNav from '../../components/PortalBottomNav';
import { SaccoFarmStore,
  SaccoMember,
  SaccoLoan,
  PettyCashTransaction,
} from '../../services/saccoFarmStore';
import {
  Search,
  FileCheck,
  BookOpen,
  LogOut,
  Scale,
  Menu,
  X,
  Building2,
  CheckCircle2,
  Building,
  Users,
  CreditCard,
  PiggyBank,
  TrendingUp,
  BarChart3,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Sun,
  Moon,
  Receipt,
  Plus,
  Printer,
  Wallet,
  DollarSign,
} from 'lucide-react';

type TabId =
  | 'dashboard'
  | 'members'
  | 'shares'
  | 'savings'
  | 'loans'
  | 'expenses'
  | 'journal'
  | 'reports'
  | 'verification'
  | 'reconciliation'
  | 'chat'
  | 'settings';

export default function AccountantPortal() {
  const navigate = useNavigate();
  const session = getSession();

  if (session && session.role === 'MEMBER') {
    return <AccessDenied message="You have no access to this field." backPath="/member" />;
  }

  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState('');
  const [notifType, setNotifType] = useState<'success' | 'error'>('success');

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

  // Live data
  const [members, setMembers] = useState<SaccoMember[]>([]);
  const [loans, setLoans] = useState<SaccoLoan[]>([]);
  const [transactions, setTransactions] = useState<PettyCashTransaction[]>([]);

  // Verification queue (dual-control)
  const [unverifiedQueue, setUnverifiedQueue] = useState([
    {
      id: 'TX-9410',
      member: 'Joseph Ssenyonga (DC-MBR-00106)',
      type: 'DEPOSIT',
      purpose: 'Buying Shares (10 Class A Shares)',
      amount: 2500000,
      paymentMethod: 'Airtel Money Merchant',
      reference: 'AIRTEL-7729104',
      submittedAt: '2026-11-12 10:45',
      status: 'PENDING_VERIFICATION',
    },
    {
      id: 'TX-9411',
      member: 'David Mukasa (DC-MBR-00104)',
      type: 'DEPOSIT',
      purpose: 'Monthly Savings (November 2026)',
      amount: 1000000,
      paymentMethod: 'Stanbic Bank Wire',
      reference: 'STN-WIRE-40192',
      submittedAt: '2026-11-12 11:10',
      status: 'PENDING_VERIFICATION',
    },
  ]);
  const [verifiedQueue, setVerifiedQueue] = useState([
    {
      id: 'TX-9402',
      member: 'David Mukasa (DC-MBR-00104)',
      amount: 1500000,
      verifiedAt: '2026-11-12 09:30',
      status: 'VERIFIED_AWAITING_ADMIN',
    },
  ]);

  // Loans UI
  const [repaymentAmounts, setRepaymentAmounts] = useState<Record<string, string>>({});
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [selectedMember, setSelectedMember] = useState<SaccoMember | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [accountantSearch, setAccountantSearch] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Selected Loan for Repayment History Modal
  const [selectedLoanHistory, setSelectedLoanHistory] = useState<SaccoLoan | null>(null);

  // Expense Form State
  const [expenseCategory, setExpenseCategory] = useState('Dairy Feeds & Nutrition');
  const [expensePayee, setExpensePayee] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseSource, setExpenseSource] = useState<'Bank' | 'Petty Cash'>('Bank');
  const [expenseRef, setExpenseRef] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');

  const handleRecordExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(expenseAmount);
    if (!amt || amt <= 0) {
      notify('Please enter a valid expense amount.', 'error');
      return;
    }
    SaccoFarmStore.addTransaction({
      date: new Date().toISOString().split('T')[0],
      type: 'Expense',
      source: expenseSource,
      category: expenseCategory,
      amount: amt,
      description: `${expenseDesc ? expenseDesc + ' - ' : ''}Payee: ${expensePayee || 'General Vendor'}`,
      reference: expenseRef || `EXP-${Date.now().toString().slice(-5)}`,
      isBanked: expenseSource === 'Bank'
    });
    notify(`Expense of UGX ${amt.toLocaleString()} recorded and posted to General Ledger!`);
    setExpenseAmount('');
    setExpensePayee('');
    setExpenseRef('');
    setExpenseDesc('');
    reloadData();
  };

  const reloadData = () => {
    setMembers(SaccoFarmStore.getMembers());
    setLoans(SaccoFarmStore.getLoans());
    setTransactions(SaccoFarmStore.getTransactions());
  };

  useEffect(() => {
    reloadData();
    const handlePortalTabSwitch = (e: any) => {
      const tab = e.detail;
      if (tab === 'chat') setActiveTab('chat');
      else if (tab === 'dashboard') setActiveTab('dashboard');
      else if (tab === 'settings') setActiveTab('settings');
    };
    window.addEventListener('dc_portal_tab_switch', handlePortalTabSwitch);
    window.addEventListener('dc_storage_update', reloadData);
    return () => {
      window.removeEventListener('dc_portal_tab_switch', handlePortalTabSwitch);
      window.removeEventListener('dc_storage_update', reloadData);
    };
  }, []);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification(msg);
    setNotifType(type);
    setTimeout(() => setNotification(''), 6000);
  };

  // -- Derived totals ---------------------------------------------------------
  const totalSavings = members.reduce((s, m) => s + (m.savings || 0), 0);
  const totalShares = members.reduce((s, m) => s + (m.shares || 0), 0);
  const totalSharesValue = members.reduce((s, m) => s + (m.sharesValue || 0), 0);
  const activeLoansTotal = loans
    .filter((l) => l.status === 'ACTIVE')
    .reduce((s, l) => s + l.outstandingBalance, 0);
  const pendingLoans = loans.filter((l) => l.status === 'PENDING_APPROVAL');
  const totalIncome = transactions
    .filter((t) => t.type === 'Income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === 'Expense')
    .reduce((s, t) => s + t.amount, 0);

  // -- Handlers ---------------------------------------------------------------
  const handleVerifyTransaction = (id: string) => {
    const item = unverifiedQueue.find((q) => q.id === id);
    if (!item) return;
    setUnverifiedQueue(unverifiedQueue.filter((q) => q.id !== id));
    setVerifiedQueue([
      {
        id: item.id,
        member: item.member,
        amount: item.amount,
        verifiedAt: new Date().toLocaleString(),
        status: 'VERIFIED_AWAITING_ADMIN',
      },
      ...verifiedQueue,
    ]);
    notify(`Transaction ${id} verified and forwarded to Admin for final authorization.`);
  };

  const handleApproveLoan = (id: string) => {
    const loan = SaccoFarmStore.approveLoan(id);
    if (loan) {
      notify(`Loan ${id} approved and disbursed to ${loan.memberName}.`);
    }
  };

  const handleRecordRepayment = (loanId: string) => {
    const amt = Number(repaymentAmounts[loanId] || 0);
    if (!amt || amt <= 0) {
      notify('Enter a valid repayment amount.', 'error');
      return;
    }
    const updated = SaccoFarmStore.recordLoanRepayment(loanId, amt, 'Stanbic Bank Wire', `LN-REC-${Date.now().toString().slice(-4)}`, 'Loan installment via accountant portal');
    if (updated) {
      notify(
        `Repayment of UGX ${amt.toLocaleString()} recorded for ${updated.memberName}. Balance: UGX ${updated.outstandingBalance.toLocaleString()}`
      );
      setRepaymentAmounts((prev) => ({ ...prev, [loanId]: '' }));
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/signin');
  };

  const nav = (tab: TabId) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const navItem = (id: TabId, label: string, Icon: React.ComponentType<{ className?: string }>, badge?: number) => (
    <button
      onClick={() => nav(id)}
      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
        activeTab === id
          ? 'bg-emerald-600 text-white shadow-md'
          : isDark
          ? 'text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 shrink-0" />
        <span>{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
          isDark ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' : 'bg-blue-100 text-blue-700'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );

  // -- Trial Balance data -----------------------------------------------------
  const cashBankBalance = 342500000;
  const cattleAssets = 568000000;
  const memberSavingsLiability = totalSavings;
  const shareCapital = totalSharesValue;
  const loanPortfolio = loans
    .filter((l) => l.status === 'ACTIVE')
    .reduce((s, l) => s + l.outstandingBalance, 0);
  const tbDebit = cashBankBalance + cattleAssets + loanPortfolio;
  const tbCredit = memberSavingsLiability + shareCapital;

  return (
    <div className={`min-h-screen flex antialiased font-sans selection:bg-emerald-600 selection:text-white ${
      isDark ? 'bg-slate-50 dark:bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* -- LEFT SIDEBAR --------------------------------------------------- */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 p-4 flex flex-col justify-between shrink-0 shadow-2xl transition-transform duration-200 overflow-y-auto ${
          isDark ? 'bg-slate-900 border-r border-slate-200 dark:border-slate-800' : 'bg-white border-r border-slate-200'
        } ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-5">
          {/* Brand */}
          <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-200 dark:border-slate-800' : 'border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-slate-900 dark:text-white shadow-lg shadow-emerald-900/30 text-lg">
                DC
              </div>
              <div>
                <h1 className={`font-extrabold text-sm tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Diaspora Connect</h1>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider uppercase">Finance &amp; Accounting</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`p-1 rounded-lg md:hidden ${isDark ? 'text-slate-500 dark:text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile */}
          <div className={`p-3 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <img
                src="/images/miriam_halera.jpg"
                alt="Mrs. Miriam Halera"
                className="w-11 h-11 rounded-xl object-cover border border-emerald-500/40 shadow-md shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>Mrs. Miriam Halera</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">Chief Accountant</p>
                <span className="inline-block px-1.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                  General Ledger Auth
                </span>
              </div>
            </div>
          </div>

          {/* Nav */}
          <div className="space-y-1">
            {navItem('dashboard', 'Dashboard', BarChart3)}
            {navItem('members', 'Members & Balances', Users, members.length)}
            {navItem('shares', 'Shares Management', CreditCard)}
            {navItem('savings', 'Savings Records', PiggyBank)}
            {navItem('loans', 'Loans Processing', CircleDollarSign, pendingLoans.length)}
            {navItem('expenses', 'Expenses Ledger', Receipt)}
            {navItem('journal', 'Double-Entry Journal', BookOpen)}
            {navItem('reports', 'Financial Reports', TrendingUp)}
            {navItem('verification', 'Verification Queue', FileCheck, unverifiedQueue.length)}
            {navItem('reconciliation', 'Bank Reconciliation', Building2)}
          </div>
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

      {/* -- MAIN CONTENT ---------------------------------------------------- */}
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
              <h2 className={`text-base sm:text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Financial Accounting Dashboard</h2>
              <p className={`text-xs ${isDark ? 'text-slate-500 dark:text-slate-400' : 'text-slate-500'}`}>Double-Entry Ledger &amp; Dual-Control Verification</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1.5 border ${
              isDark
                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Balanced Invariant</span>
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

        {/* Notification Toast */}
        {notification && (
          <div
            className={`m-4 p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 shadow-xl ${
              notifType === 'error'
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        <main className="p-4 sm:p-6 space-y-6 flex-1 pb-24 md:pb-6">

          {/* -- TAB: DASHBOARD ------------------------------------------- */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Member Savings', value: `UGX ${totalSavings.toLocaleString()}`, color: 'emerald' },
                  { label: 'Share Capital Pool', value: `UGX ${totalSharesValue.toLocaleString()}`, color: 'blue' },
                  { label: 'Active Loan Portfolio', value: `UGX ${activeLoansTotal.toLocaleString()}`, color: 'blue' },
                  { label: 'Net Operating Surplus', value: `UGX ${(totalIncome - totalExpenses).toLocaleString()}`, color: 'emerald' },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1"
                  >
                    <p className="text-[10px] text-slate-500 dark:text-slate-800 dark:text-slate-300 font-bold uppercase text-[11px] uppercase tracking-wider">{card.label}</p>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white font-mono leading-tight">{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Quick activity */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Recent Transactions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                        <th className="p-3">Date</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-right">Amount (UGX)</th>
                        <th className="p-3 text-center">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                      {transactions.slice(0, 8).map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-sans text-slate-500 dark:text-slate-400">{tx.date}</td>
                          <td className="p-3 font-sans text-slate-900 dark:text-slate-100 font-bold font-bold">{tx.category}</td>
                          <td className="p-3 font-sans text-slate-500 dark:text-slate-400 text-[11px] max-w-xs truncate">{tx.description}</td>
                          <td className={`p-3 text-right font-extrabold ${tx.type === 'Income' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-400'}`}>
                            {tx.amount.toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.type === 'Income'
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {tx.type}
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

          {/* -- TAB: MEMBERS & BALANCES ---------------------------------- */}
          {activeTab === 'members' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Member Financial Registry</h3>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300">
                  {members.length} Members
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                      <th className="p-3">ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3 text-right">Savings (UGX)</th>
                      <th className="p-3 text-right">Shares</th>
                      <th className="p-3 text-right">Share Value (UGX)</th>
                      <th className="p-3 text-right">Withdrawable (UGX)</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-bold text-blue-700 dark:text-blue-400">{m.memberId}</td>
                        <td className="p-3 font-sans">
                          <span className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-700 dark:text-emerald-400 cursor-pointer transition">
                            {m.name}
                          </span>
                        </td>
                        <td className="p-3 text-right text-emerald-700 dark:text-emerald-400 font-bold">{(m.savings || 0).toLocaleString()}</td>
                        <td className="p-3 text-right text-slate-900 dark:text-white font-bold">{m.shares || 0}</td>
                        <td className="p-3 text-right text-blue-700 dark:text-blue-300">{(m.sharesValue || 0).toLocaleString()}</td>
                        <td className="p-3 text-right text-slate-900 dark:text-slate-100 font-bold">{(m.withdrawable || 0).toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                              : m.status === 'PENDING'
                              ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-700">
                    <tr className="bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white font-mono">
                      <td colSpan={2} className="p-3 font-sans uppercase text-[11px]">Totals</td>
                      <td className="p-3 text-right text-emerald-700 dark:text-emerald-400">{totalSavings.toLocaleString()}</td>
                      <td className="p-3 text-right">{totalShares}</td>
                      <td className="p-3 text-right text-blue-700 dark:text-blue-300">{totalSharesValue.toLocaleString()}</td>
                      <td colSpan={2} className="p-3" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* -- TAB: SHARES MANAGEMENT ----------------------------------- */}
          {activeTab === 'shares' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Total Shares Issued</p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{totalShares}</p>
                  <p className="text-[10px] text-slate-500">@ UGX 250,000 per share</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Total Share Capital</p>
                  <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">UGX {totalSharesValue.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Active Shareholders</p>
                  <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 font-mono">{members.filter((m) => (m.shares || 0) > 0).length}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Share Register</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                        <th className="p-3">Member ID</th>
                        <th className="p-3">Name</th>
                        <th className="p-3 text-right">Shares Held</th>
                        <th className="p-3 text-right">Nominal Value (UGX)</th>
                        <th className="p-3 text-right">% Ownership</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                      {members
                        .filter((m) => (m.shares || 0) > 0)
                        .sort((a, b) => (b.shares || 0) - (a.shares || 0))
                        .map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-3 font-bold text-blue-700 dark:text-blue-400">{m.memberId}</td>
                            <td className="p-3 font-sans"><button onClick={() => { setSelectedMember(m); setShowMemberModal(true); }} className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-700 dark:text-emerald-400 underline-offset-2 hover:underline cursor-pointer text-left">{m.name}</button></td>
                            <td className="p-3 text-right font-bold text-slate-900 dark:text-white">{m.shares || 0}</td>
                            <td className="p-3 text-right text-emerald-700 dark:text-emerald-400">{(m.sharesValue || 0).toLocaleString()}</td>
                            <td className="p-3 text-right text-blue-700 dark:text-blue-300">
                              {totalShares > 0 ? (((m.shares || 0) / totalShares) * 100).toFixed(1) : '0.0'}%
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* -- TAB: SAVINGS RECORDS ------------------------------------- */}
          {activeTab === 'savings' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Monthly Savings Contributions Ledger</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                        <th className="p-3">Member</th>
                        <th className="p-3 text-right">Jan</th>
                        <th className="p-3 text-right">Feb</th>
                        <th className="p-3 text-right">Mar</th>
                        <th className="p-3 text-right">Q2</th>
                        <th className="p-3 text-right">Q3</th>
                        <th className="p-3 text-right">Oct</th>
                        <th className="p-3 text-right">Nov</th>
                        <th className="p-3 text-right">Total (UGX)</th>
                        <th className="p-3 text-right">Net Savings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                      {members.map((m) => {
                        const q2 = (m.apr || 0) + (m.may || 0) + (m.jun || 0);
                        const q3 = (m.jul || 0) + (m.aug || 0) + (m.sep || 0);
                        return (
                          <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-3 font-sans"><button onClick={() => { setSelectedMember(m); setShowMemberModal(true); }} className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-700 dark:text-emerald-400 underline-offset-2 hover:underline cursor-pointer text-left">{m.name}</button></td>
                            <td className="p-3 text-right text-slate-500 dark:text-slate-400">{(m.jan || 0).toLocaleString()}</td>
                            <td className="p-3 text-right text-slate-500 dark:text-slate-400">{(m.feb || 0).toLocaleString()}</td>
                            <td className="p-3 text-right text-slate-500 dark:text-slate-400">{(m.mar || 0).toLocaleString()}</td>
                            <td className="p-3 text-right text-slate-500 dark:text-slate-400">{q2.toLocaleString()}</td>
                            <td className="p-3 text-right text-slate-500 dark:text-slate-400">{q3.toLocaleString()}</td>
                            <td className="p-3 text-right text-slate-500 dark:text-slate-400">{(m.oct || 0).toLocaleString()}</td>
                            <td className="p-3 text-right text-slate-500 dark:text-slate-400">{(m.nov || 0).toLocaleString()}</td>
                            <td className="p-3 text-right font-bold text-slate-900 dark:text-white">{(m.total || 0).toLocaleString()}</td>
                            <td className="p-3 text-right font-bold text-emerald-700 dark:text-emerald-400">{(m.savings || 0).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="border-t-2 border-slate-700">
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold font-mono">
                        <td className="p-3 font-sans uppercase text-[11px]">Pool Total</td>
                        <td colSpan={8} className="p-3" />
                        <td className="p-3 text-right text-emerald-700 dark:text-emerald-400">{totalSavings.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* -- TAB: LOANS PROCESSING ------------------------------------ */}
          {activeTab === 'loans' && (
            <div className="space-y-6">
              {/* Pending approval */}
              {pendingLoans.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-500/30 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Pending Loan Applications</h3>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300">
                      {pendingLoans.length} Awaiting Approval
                    </span>
                  </div>
                  <div className="space-y-3">
                    {pendingLoans.map((loan) => (
                      <div key={loan.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-blue-700 dark:text-blue-400">{loan.loanNumber}</span>
                            <span className="ml-2 font-bold text-slate-900 dark:text-white font-sans">{loan.memberName}</span>
                          </div>
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                            UGX {loan.principal.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Purpose: {loan.purpose} &middot; {loan.durationMonths} months @ {loan.interestRate}% p.a.
                        </p>
                        <p className="text-xs text-slate-500">Collateral: {loan.collateral}</p>
                        <p className="text-xs text-slate-500">Guarantor: {loan.guarantor}</p>
                        <button
                          onClick={() => handleApproveLoan(loan.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white font-bold text-xs transition shadow-md"
                        >
                          Approve &amp; Disburse
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active loans */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Active &amp; Historical Loan Book</h3>
                <div className="space-y-4">
                  {loans.map((loan) => (
                    <div key={loan.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-blue-700 dark:text-blue-400 text-sm">{loan.loanNumber}</span>
                          <span className="ml-2 font-bold text-slate-900 dark:text-white">{loan.memberName}</span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            loan.status === 'ACTIVE'
                              ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                              : loan.status === 'CLEARED'
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                              : loan.status === 'PENDING_APPROVAL'
                              ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                        <div>
                          <p className="text-slate-500">Principal</p>
                          <p className="font-bold text-slate-900 dark:text-white">{loan.principal.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Total Payable</p>
                          <p className="font-bold text-slate-900 dark:text-white">{loan.totalPayable.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Paid</p>
                          <p className="font-bold text-emerald-700 dark:text-emerald-400">{loan.amountPaid.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Outstanding</p>
                          <p className={`font-bold ${loan.outstandingBalance > 0 ? 'text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                            {loan.outstandingBalance.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, (loan.amountPaid / loan.totalPayable) * 100)}%` }}
                        />
                      </div>
                      {loan.status === 'ACTIVE' && (
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            placeholder="Repayment amount (UGX)"
                            value={repaymentAmounts[loan.id] || ''}
                            onChange={(e) =>
                              setRepaymentAmounts((prev) => ({ ...prev, [loan.id]: e.target.value }))
                            }
                            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            onClick={() => handleRecordRepayment(loan.id)}
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white font-bold text-xs transition"
                          >
                            Record Payment
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* -- TAB: DOUBLE-ENTRY JOURNAL -------------------------------- */}
          {activeTab === 'journal' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">General Ledger Journal Entries</h3>
              <div className="space-y-3 font-mono text-xs">
                {/* Auto-generated from transactions */}
                {transactions.slice(0, 10).map((tx, i) => {
                  const jrnNum = `JRN-2026-${880 + i}`;
                  const isIncome = tx.type === 'Income';
                  const drAcc = isIncome ? '1010 Cash &amp; Bank' : tx.category;
                  const crAcc = isIncome ? `4xxx ${tx.category}` : '1010 Cash &amp; Bank';
                  return (
                    <div key={tx.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px] font-sans">
                        <span>Journal #{jrnNum} &middot; {tx.date} &middot; Ref: {tx.reference}</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase">Balanced Posting</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-900 dark:text-slate-100 font-bold">DR {drAcc}</span>
                          <span className={`font-bold ${isIncome ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-400'}`}>
                            UGX {tx.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between pl-6">
                          <span className="text-slate-500 dark:text-slate-400">CR {crAcc}</span>
                          <span className="text-slate-900 dark:text-white font-bold">UGX {tx.amount.toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 pt-1 font-sans">{tx.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* -- TAB: FINANCIAL REPORTS ----------------------------------- */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Trial Balance */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Double-Entry Trial Balance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-sans text-[10px]">
                        <th className="p-3">Code</th>
                        <th className="p-3">Account Name</th>
                        <th className="p-3 text-right">Debit (UGX)</th>
                        <th className="p-3 text-right">Credit (UGX)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="p-3 text-blue-700 dark:text-blue-400 font-bold">1010</td>
                        <td className="p-3 font-sans text-slate-900 dark:text-slate-100 font-bold">Cash &amp; Bank Balances</td>
                        <td className="p-3 text-right text-emerald-700 dark:text-emerald-400 font-bold">{cashBankBalance.toLocaleString()}</td>
                        <td className="p-3 text-right text-slate-600">0</td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="p-3 text-blue-700 dark:text-blue-400 font-bold">1100</td>
                        <td className="p-3 font-sans text-slate-900 dark:text-slate-100 font-bold">Biological Cattle Herd Assets</td>
                        <td className="p-3 text-right text-emerald-700 dark:text-emerald-400 font-bold">{cattleAssets.toLocaleString()}</td>
                        <td className="p-3 text-right text-slate-600">0</td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="p-3 text-blue-700 dark:text-blue-400 font-bold">1200</td>
                        <td className="p-3 font-sans text-slate-900 dark:text-slate-100 font-bold">Cooperative Loan Portfolio</td>
                        <td className="p-3 text-right text-emerald-700 dark:text-emerald-400 font-bold">{loanPortfolio.toLocaleString()}</td>
                        <td className="p-3 text-right text-slate-600">0</td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="p-3 text-blue-700 dark:text-blue-400 font-bold">2010</td>
                        <td className="p-3 font-sans text-slate-900 dark:text-slate-100 font-bold">Member Savings Liabilities</td>
                        <td className="p-3 text-right text-slate-600">0</td>
                        <td className="p-3 text-right text-slate-900 dark:text-white font-bold">{totalSavings.toLocaleString()}</td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="p-3 text-blue-700 dark:text-blue-400 font-bold">3010</td>
                        <td className="p-3 font-sans text-slate-900 dark:text-slate-100 font-bold">Member Share Capital Equity</td>
                        <td className="p-3 text-right text-slate-600">0</td>
                        <td className="p-3 text-right text-slate-900 dark:text-white font-bold">{totalSharesValue.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white font-sans border-t border-slate-200 dark:border-slate-800">
                        <td colSpan={2} className="p-3 uppercase">Total Invariant Check</td>
                        <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400">UGX {tbDebit.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400">UGX {tbCredit.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Income Statement */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Income &amp; Expenditure Statement</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-sans font-semibold">Income</p>
                    {transactions.filter((t) => t.type === 'Income').slice(0, 5).map((t) => (
                      <div key={t.id} className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-300 font-sans">{t.category}</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">{t.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 font-bold">
                      <span className="text-slate-900 dark:text-white font-sans">Total Income</span>
                      <span className="text-emerald-700 dark:text-emerald-400">{totalIncome.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-sans font-semibold">Expenditure</p>
                    {transactions.filter((t) => t.type === 'Expense').slice(0, 5).map((t) => (
                      <div key={t.id} className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-300 font-sans">{t.category}</span>
                        <span className="text-rose-400 font-bold">{t.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 font-bold">
                      <span className="text-slate-900 dark:text-white font-sans">Total Expenditure</span>
                      <span className="text-rose-400">{totalExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-emerald-500/30 flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">Net Operating Surplus</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-xl font-mono">
                    UGX {(totalIncome - totalExpenses).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* -- TAB: VERIFICATION QUEUE ---------------------------------- */}
          {activeTab === 'verification' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Step 1: Payment Evidence Verification</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Match external bank or mobile money records before admin authorization</p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300">
                    {unverifiedQueue.length} Pending
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                        <th className="p-3">Ref ID</th>
                        <th className="p-3">Member</th>
                        <th className="p-3">Depositing For</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3">Channel</th>
                        <th className="p-3">Reference #</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                      {unverifiedQueue.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-bold text-blue-700 dark:text-blue-400">{item.id}</td>
                          <td className="p-3 font-sans text-slate-900 dark:text-slate-100 font-bold font-bold">{item.member}</td>
                          <td className="p-3 font-sans">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                              {item.purpose || 'Monthly Savings'}
                            </span>
                          </td>
                          <td className="p-3 text-right font-extrabold text-slate-900 dark:text-white">UGX {item.amount.toLocaleString()}</td>
                          <td className="p-3 font-sans text-slate-500 dark:text-slate-400">{item.paymentMethod}</td>
                          <td className="p-3 text-emerald-800 dark:text-emerald-300 font-bold">{item.reference}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleVerifyTransaction(item.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white font-sans font-bold text-xs shadow-md transition"
                            >
                              Verify
                            </button>
                          </td>
                        </tr>
                      ))}
                      {unverifiedQueue.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-500 font-sans">
                            All submitted payment requests have been verified.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Verified awaiting Admin */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Step 2: Awaiting Admin Final Authorization</h3>
                <div className="space-y-2">
                  {verifiedQueue.map((v) => (
                    <div key={v.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="font-bold text-blue-700 dark:text-blue-400">{v.id}</span>
                        <span className="text-slate-600 dark:text-slate-300 font-sans ml-2 font-semibold">{v.member}</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">Verified at: {v.verifiedAt}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">UGX {v.amount.toLocaleString()}</span>
                        <span className="block text-[10px] font-sans font-bold text-blue-700 dark:text-blue-400 uppercase">Awaiting Admin Dual-Auth</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* -- TAB: BANK RECONCILIATION --------------------------------- */}
          {activeTab === 'reconciliation' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Bank Statement Reconciliation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Stanbic Bank Statement Balance</span>
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">UGX 218,400,000</div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Reconciled as of 2026-11-12</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Centenary Bank Operational Account</span>
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">UGX 124,100,000</div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Reconciled as of 2026-11-12</p>
                  </div>
                </div>

                {/* Unbanked items */}
                <div>
                  <h4 className="font-bold text-slate-600 dark:text-slate-300 text-xs mb-3 uppercase tracking-wider">Unreconciled Cash Items</h4>
                  <div className="space-y-2">
                    {transactions.filter((t) => !t.isBanked).map((t) => (
                      <div key={t.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-blue-500/20 flex items-center justify-between text-xs font-mono">
                        <div>
                          <span className="text-blue-700 dark:text-blue-300 font-bold">{t.reference}</span>
                          <span className="font-sans text-slate-600 dark:text-slate-300 ml-2">{t.description}</span>
                        </div>
                        <span className={`font-extrabold ${t.type === 'Income' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-400'}`}>
                          UGX {t.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {transactions.filter((t) => !t.isBanked).length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-4">All transactions are reconciled.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* TAB: CHAT */}
          {activeTab === 'chat' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto text-lg font-bold">
                MSG
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white">Accountant In-App Communication Desk</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Reconciliations inquiries, member deposit confirmations, and audit notifications.</p>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white">Accounting Controls &amp; Settings</h3>
              <p className="text-xs text-slate-500">General ledger accounts setup, chart of accounts calibration, and financial year close dates.</p>
            </div>
          )}

        </main>      {/* -- LOAN REPAYMENT HISTORY MODAL ------------------------------ */}
      {selectedLoanHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setSelectedLoanHistory(null)}>
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/50 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black">Loan Repayment History: {selectedLoanHistory.loanNumber}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-bold mt-0.5">
                  Borrower: {selectedLoanHistory.memberName} ({selectedLoanHistory.memberId}) &middot; Purpose: {selectedLoanHistory.purpose}
                </p>
              </div>
              <button onClick={() => setSelectedLoanHistory(null)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-sans font-bold text-slate-500 uppercase block">Principal</span>
                <span className="text-sm font-black text-slate-900 dark:text-white block mt-0.5">UGX {selectedLoanHistory.principal.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-sans font-bold text-slate-500 uppercase block">Total Payable</span>
                <span className="text-sm font-black text-slate-900 dark:text-white block mt-0.5">UGX {selectedLoanHistory.totalPayable.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/50">
                <span className="text-[10px] font-sans font-bold text-emerald-800 dark:text-emerald-300 uppercase block">Total Paid</span>
                <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 block mt-0.5">UGX {selectedLoanHistory.amountPaid.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-sans font-bold text-slate-500 uppercase block">Balance Remaining</span>
                <span className="text-sm font-black text-rose-600 dark:text-rose-400 block mt-0.5">UGX {selectedLoanHistory.outstandingBalance.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                Recorded Repayment Installments
              </h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-60 overflow-y-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-200 uppercase font-black text-[10px] sticky top-0">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Ref #</th>
                      <th className="p-2.5">Channel</th>
                      <th className="p-2.5 text-right">Amount Paid</th>
                      <th className="p-2.5 text-right">Balance After</th>
                      <th className="p-2.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {selectedLoanHistory.repaymentHistory && selectedLoanHistory.repaymentHistory.length > 0 ? (
                      selectedLoanHistory.repaymentHistory.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 font-sans font-bold text-slate-900 dark:text-slate-200">{h.date}</td>
                          <td className="p-2.5 font-bold text-blue-700 dark:text-blue-400">{h.reference}</td>
                          <td className="p-2.5 font-sans text-slate-700 dark:text-slate-300">{h.paymentMethod}</td>
                          <td className="p-2.5 text-right font-black text-emerald-700 dark:text-emerald-400">
                            UGX {h.amount.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                            UGX {h.remainingBalance.toLocaleString()}
                          </td>
                          <td className="p-2.5 font-sans text-slate-500 truncate max-w-xs">{h.notes || 'N/A'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-500 font-sans">
                          No repayment installments recorded yet for this facility.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLoanHistory(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs cursor-pointer hover:bg-slate-300"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- MEMBER DETAIL MODAL --------------------------------------- */}
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
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Savings Balance</span>
                <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">UGX {(selectedMember.savings || 0).toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Share Capital</span>
                <p className="text-lg font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5">{selectedMember.shares || 0} Shares</p>
                <span className="text-[10px] text-slate-500">UGX {((selectedMember.shares || 0) * 250000).toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Phone & Email</span>
                <p className="font-bold mt-0.5">{selectedMember.phone}</p>
                <p className="text-[11px] text-slate-500">{selectedMember.email || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Withdrawable Balance</span>
                <p className="text-lg font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">UGX {(selectedMember.withdrawable || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowMemberModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-900 dark:text-slate-100 font-bold font-bold text-xs cursor-pointer hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
          {/* Mobile Bottom Navigation Bar (Home, Dashboard, Chat, Settings) */}
      <PortalBottomNav
        currentTab={activeTab === 'dashboard' ? 'dashboard' : activeTab}
        onSelectTab={t => {
          if (t === 'dashboard') setActiveTab('dashboard');
          else if (t === 'chat') setActiveTab('chat');
          else if (t === 'settings') setActiveTab('settings');
          else setActiveTab(t as any);
        }}
        dashboardTab="dashboard"
      />
    </div>
  );
}






