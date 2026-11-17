import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getSession, clearSession, api } from '../../services/api';
import { applyTheme, getTheme } from '../../services/theme';
import PortalBottomNav from '../../components/PortalBottomNav';
import Planning from '../Planning';
import {
  SaccoFarmStore,
  SaccoMember,
  PettyCashTransaction,
  getMemberPhoto
} from '../../services/saccoFarmStore';
import {
  LayoutDashboard,
  Search,
  Wallet,
  ShieldCheck,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  HelpCircle,
  CheckCircle2,
  TrendingUp,
  LogOut,
  Send,
  AlertCircle,
  Menu,
  X,
  Coins,
  Printer,
  ChevronRight,
  Award,
  Globe,
  Sun,
  Moon,
  Target,
  MessageSquare,
  Settings
} from 'lucide-react';

export default function MemberPortal() {
  const navigate = useNavigate();
  const session = getSession();

  // Storage data
  const [members, setMembers] = useState<SaccoMember[]>([]);
  const [transactions, setTransactions] = useState<PettyCashTransaction[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('DC-001');

  // Theme state
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    return getTheme();
  });
  const isDark = themeMode === 'dark';
  const toggleTheme = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    applyTheme(next);
  };

  // UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'shares' | 'statement' | 'deposit' | 'withdraw' | 'planning' | 'chat' | 'settings'>(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (p === 'planning') return 'planning';
      if (p === 'settings') return 'settings';
    } catch {}
    return 'overview';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotification, setShowNotification] = useState('');
  const [navSearch, setNavSearch] = useState('');

  // Modals
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Month Constants
  const MONTH_FULL_NAMES: Record<string, string> = {
    jan: 'January',
    feb: 'February',
    mar: 'March',
    apr: 'April',
    may: 'May',
    jun: 'June',
    jul: 'July',
    aug: 'August',
    sep: 'September',
    oct: 'October',
    nov: 'November',
    dec: 'December'
  };
  const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;

  // Deposit Form
  const [depositAmount, setDepositAmount] = useState('1000000');
  const [depositMethod, setDepositMethod] = useState<'MTN Mobile Money' | 'Airtel Money' | 'Stanbic Bank Wire' | 'ABSA Bank Wire'>('MTN Mobile Money');
  const [depositRef, setDepositRef] = useState('');
  const [depositNotes, setDepositNotes] = useState('');
  const [depositPurpose, setDepositPurpose] = useState<'savings' | 'shares' | 'welfare' | 'project' | 'other'>('savings');
  const [depositMonthTarget, setDepositMonthTarget] = useState<string>('nov');
  const [depositOtherPurpose, setDepositOtherPurpose] = useState('');

  // Selected Month Statement Modal
  const [selectedMonthStatement, setSelectedMonthStatement] = useState<{
    key: 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun' | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec';
    name: string;
    amount: number;
    adminFee: number;
    monthIndex: number;
  } | null>(null);

  // Withdraw Form
  const [withdrawAmount, setWithdrawAmount] = useState('500000');
  const [withdrawDestination, setWithdrawDestination] = useState('+256 772 100 200 (MTN Mobile Money)');
  const [withdrawReason, setWithdrawReason] = useState('Personal Emergency / Family Support');

  // Support Chat
  const [supportQuery, setSupportQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; source?: string }>>([
    {
      sender: 'assistant',
      text: 'Welcome to your Member Portal. You can check your savings balance, share capital, statements, and request deposits or withdrawals. How can I help you today?',
    },
  ]);

  // Reactive data subscription
  const reloadData = () => {
    const mems = SaccoFarmStore.getMembers();
    setMembers(mems);
    setTransactions(SaccoFarmStore.getTransactions());
  };

  useEffect(() => {
    reloadData();
    const handlePortalTabSwitch = (e: any) => {
      const tab = e.detail;
      if (tab === 'chat') window.dispatchEvent(new CustomEvent('dc_open_chat'));
      else if (tab === 'planning') setActiveTab('planning');
      else if (tab === 'dashboard') setActiveTab('overview');
      else if (tab === 'settings') setActiveTab('settings');
    };
    window.addEventListener('dc_storage_update', reloadData);
    window.addEventListener('dc_portal_tab_switch', handlePortalTabSwitch);
    return () => {
      window.removeEventListener('dc_storage_update', reloadData);
      window.removeEventListener('dc_portal_tab_switch', handlePortalTabSwitch);
    };
  }, []);

  useEffect(() => {
    if (session && members.length > 0) {
      const match = members.find(m =>
        (session.memberNumber && (m.memberId === session.memberNumber || m.id === session.memberNumber)) ||
        (session.email && m.email && m.email.toLowerCase() === session.email.toLowerCase()) ||
        (session.fullName && (m.name.toLowerCase().includes(session.fullName.toLowerCase()) || session.fullName.toLowerCase().includes(m.name.toLowerCase())))
      );
      if (match) {
        setSelectedMemberId(match.id);
      }
    }
  }, [members, session]);

  // Determine current active member
  const currentMember: SaccoMember = members.find(m => m.id === selectedMemberId || m.memberId === selectedMemberId) || members[0] || {
    id: 'DC-001',
    memberId: 'DC-001',
    name: 'Mr. Nyanzi Edrine',
    phone: '+256 772 100 200',
    email: 'edrine.nyanzi@diasporaconnectt.com',
    nin: 'CM840291024KLA',
    category: 'Founding Member / Board Chair',
    joinDate: '2024-01-15',
    status: 'ACTIVE',
    avatar: '/images/nyanzi_edrine.jpg',
    jan: 1500000, feb: 1500000, mar: 1500000, apr: 1500000, may: 1500000, jun: 1500000,
    jul: 1500000, aug: 1500000, sep: 1500000, oct: 1500000, nov: 1500000, dec: 1500000,
    total: 18000000,
    adminFee: 50000,
    savings: 17950000,
    shares: 48,
    sharesValue: 12000000,
    withdrawable: 16500000
  };

  const memberPhoto = currentMember.avatar || getMemberPhoto(currentMember.name);

  const notify = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(''), 6000);
  };

  // Submit Deposit Request (With Explicit Deposit Purpose)
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(depositAmount);
    if (!amt || amt <= 0) return;

    if (depositPurpose === 'shares') {
      const sharesPurchased = Math.max(1, Math.floor(amt / 250000));
      const currentShares = Number(currentMember.shares) || 0;
      const newShares = currentShares + sharesPurchased;
      
      SaccoFarmStore.updateMember(currentMember.id, {
        shares: newShares,
        sharesValue: newShares * 250000,
        total: (Number(currentMember.total) || 0) + amt
      });

      SaccoFarmStore.addTransaction({
        date: new Date().toISOString().split('T')[0],
        type: 'Income',
        source: depositMethod.includes('Bank') ? 'Bank' : 'Petty Cash',
        category: `Share Capital Purchase: ${currentMember.name} (${currentMember.memberId})`,
        amount: amt,
        description: `Purchased ${sharesPurchased} Class A Shares (@ UGX 250k each) via ${depositMethod}. Ref: ${depositRef || 'Pending Ref'}. ${depositNotes}`,
        reference: depositRef || `SHR-${Date.now().toString().slice(-6)}`,
        isBanked: depositMethod.includes('Bank')
      });
      notify(`Deposit for ${sharesPurchased} Share(s) (UGX ${amt.toLocaleString()}) submitted successfully.`);
    } else if (depositPurpose === 'savings') {
      const targetMonthKey = (depositMonthTarget || 'nov') as keyof SaccoMember;
      const monthFullName = MONTH_FULL_NAMES[depositMonthTarget] || 'November';
      const currentVal = Number(currentMember[targetMonthKey]) || 0;
      SaccoFarmStore.updateMonthlyContribution(currentMember.id, targetMonthKey, currentVal + amt);

      SaccoFarmStore.addTransaction({
        date: new Date().toISOString().split('T')[0],
        type: 'Income',
        source: depositMethod.includes('Bank') ? 'Bank' : 'Petty Cash',
        category: `Member Savings: ${currentMember.name} (${currentMember.memberId})`,
        amount: amt,
        description: `Monthly savings for ${monthFullName} via ${depositMethod}. Ref: ${depositRef || 'Pending Ref'}. ${depositNotes}`,
        reference: depositRef || `MOM-${Date.now().toString().slice(-6)}`,
        isBanked: depositMethod.includes('Bank')
      });
      notify(`Deposit of UGX ${amt.toLocaleString()} recorded for ${monthFullName} Savings.`);
    } else if (depositPurpose === 'welfare') {
      SaccoFarmStore.updateMember(currentMember.id, {
        total: (Number(currentMember.total) || 0) + amt
      });
      SaccoFarmStore.addTransaction({
        date: new Date().toISOString().split('T')[0],
        type: 'Income',
        source: depositMethod.includes('Bank') ? 'Bank' : 'Petty Cash',
        category: `Welfare & Emergency Fund: ${currentMember.name} (${currentMember.memberId})`,
        amount: amt,
        description: `Welfare fund contribution via ${depositMethod}. Ref: ${depositRef || 'Pending Ref'}. ${depositNotes}`,
        reference: depositRef || `WLF-${Date.now().toString().slice(-6)}`,
        isBanked: depositMethod.includes('Bank')
      });
      notify(`Deposit of UGX ${amt.toLocaleString()} recorded for Welfare & Emergency Fund.`);
    } else if (depositPurpose === 'project') {
      SaccoFarmStore.updateMember(currentMember.id, {
        total: (Number(currentMember.total) || 0) + amt
      });
      SaccoFarmStore.addTransaction({
        date: new Date().toISOString().split('T')[0],
        type: 'Income',
        source: depositMethod.includes('Bank') ? 'Bank' : 'Petty Cash',
        category: `Special Farm Project: ${currentMember.name} (${currentMember.memberId})`,
        amount: amt,
        description: `Farm development contribution via ${depositMethod}. Ref: ${depositRef || 'Pending Ref'}. ${depositNotes}`,
        reference: depositRef || `PRJ-${Date.now().toString().slice(-6)}`,
        isBanked: depositMethod.includes('Bank')
      });
      notify(`Deposit of UGX ${amt.toLocaleString()} recorded for Special Farm Development.`);
    } else {
      const customPurpose = depositOtherPurpose || 'Other Special Deposit';
      SaccoFarmStore.updateMember(currentMember.id, {
        total: (Number(currentMember.total) || 0) + amt,
        savings: (Number(currentMember.savings) || 0) + amt
      });
      SaccoFarmStore.addTransaction({
        date: new Date().toISOString().split('T')[0],
        type: 'Income',
        source: depositMethod.includes('Bank') ? 'Bank' : 'Petty Cash',
        category: `${customPurpose}: ${currentMember.name} (${currentMember.memberId})`,
        amount: amt,
        description: `Deposit for ${customPurpose} via ${depositMethod}. Ref: ${depositRef || 'Pending Ref'}. ${depositNotes}`,
        reference: depositRef || `OTH-${Date.now().toString().slice(-6)}`,
        isBanked: depositMethod.includes('Bank')
      });
      notify(`Deposit of UGX ${amt.toLocaleString()} recorded for "${customPurpose}".`);
    }

    setShowDepositModal(false);
    setDepositRef('');
    setDepositNotes('');
    setDepositOtherPurpose('');
    reloadData();
  };

  // Print Monthly Statement
  const handlePrintMonthStatement = () => {
    if (!selectedMonthStatement) return;
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) {
      window.print();
      return;
    }
    const idx = selectedMonthStatement.monthIndex;
    let opening = 0;
    for (let i = 0; i < idx; i++) {
      const k = MONTH_KEYS[i];
      opening += Number((currentMember as any)[k]) || 0;
    }
    if (idx > 0) opening -= Number(currentMember.adminFee) || 50000;
    opening = Math.max(0, opening);
    const gross = selectedMonthStatement.amount;
    const fee = selectedMonthStatement.adminFee;
    const net = gross - fee;
    const closing = opening + net;

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${selectedMonthStatement.name} Statement - ${currentMember.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #0f172a; line-height: 1.5; }
          .header { border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
          .logo { font-size: 20px; font-weight: 800; color: #059669; }
          .badge { display: inline-block; padding: 4px 8px; background: #ecfdf5; color: #065f46; font-size: 11px; font-weight: bold; border-radius: 4px; border: 1px solid #a7f3d0; }
          .title { font-size: 18px; font-weight: bold; margin-top: 6px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
          .box { padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc; }
          .box-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; }
          .box-val { font-size: 16px; font-weight: 800; color: #0f172a; font-family: monospace; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
          th { background: #f1f5f9; text-align: left; padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: 700; }
          td { padding: 8px 12px; border: 1px solid #e2e8f0; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 10px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">DIASPORA CONNECT FARMERS SACCO LTD</div>
            <div class="title">Monthly Savings Statement: ${selectedMonthStatement.name} 2026</div>
            <p style="font-size: 12px; color: #475569; margin: 4px 0 0 0;">Official Double-Entry Member Ledger</p>
          </div>
          <div style="text-align: right;">
            <span class="badge">AUDITED & VERIFIED</span>
            <p style="font-size: 11px; margin: 6px 0 0 0; font-family: monospace;">Ref: STMT-${selectedMonthStatement.key.toUpperCase()}-${currentMember.memberId}</p>
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <div class="box-label">Member Full Name</div>
            <div class="box-val">${currentMember.name}</div>
          </div>
          <div class="box">
            <div class="box-label">Member Identification Number</div>
            <div class="box-val">${currentMember.memberId}</div>
          </div>
          <div class="box">
            <div class="box-label">Statement Month & Year</div>
            <div class="box-val">${selectedMonthStatement.name} 2026</div>
          </div>
          <div class="box">
            <div class="box-label">Membership Category</div>
            <div class="box-val" style="font-size: 13px;">${currentMember.category}</div>
          </div>
        </div>

        <table style="margin-bottom: 24px;">
          <thead>
            <tr>
              <th>Ledger Component</th>
              <th style="text-align: right;">Amount (UGX)</th>
              <th>Accounting Treatment</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Opening Savings Balance</strong></td>
              <td style="text-align: right; font-family: monospace; font-weight: 800;">UGX ${opening.toLocaleString()}</td>
              <td>Brought forward from preceding month ledger</td>
            </tr>
            <tr>
              <td><strong>Gross Contribution / Deposit (${selectedMonthStatement.name})</strong></td>
              <td style="text-align: right; font-family: monospace; font-weight: 800; color: #047857;">+ UGX ${gross.toLocaleString()}</td>
              <td>Bank wire / Mobile Money deposit credited</td>
            </tr>
            <tr>
              <td><strong>Admin / Statutory Operations Fee</strong></td>
              <td style="text-align: right; font-family: monospace; font-weight: 800; color: #e11d48;">- UGX ${fee.toLocaleString()}</td>
              <td>${fee > 0 ? 'Annual SACCO membership & maintenance levy' : 'No deductions applied'}</td>
            </tr>
            <tr style="background: #f8fafc; font-weight: bold;">
              <td><strong>Net Monthly Credit</strong></td>
              <td style="text-align: right; font-family: monospace; font-weight: 900; color: #047857;">UGX ${net.toLocaleString()}</td>
              <td>Net funds transferred to unencumbered savings</td>
            </tr>
            <tr style="background: #ecfdf5; font-weight: bold; font-size: 13px;">
              <td><strong>Closing Savings Balance</strong></td>
              <td style="text-align: right; font-family: monospace; font-weight: 900; color: #065f46;">UGX ${closing.toLocaleString()}</td>
              <td>Carried forward into active balance</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div style="border-top: 1px dashed #94a3b8; padding-top: 8px;">
            <p style="font-size: 11px; margin: 0; font-weight: bold;">Verified by:</p>
            <p style="font-size: 12px; margin: 4px 0 0 0; font-weight: 800;">Internal SACCO Audit Desk</p>
          </div>
          <div style="border-top: 1px dashed #94a3b8; padding-top: 8px; text-align: right;">
            <p style="font-size: 11px; margin: 0; font-weight: bold;">Date Printed:</p>
            <p style="font-size: 12px; margin: 4px 0 0 0; font-weight: 800;">${new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>

        <div class="footer">
          Diaspora Connect Farmers SACCO Ltd · Reg: CS/8912/Uganda · Email: info@diasporaconnectt.com · Plot 14, Kampala Road
        </div>
      </body>
      </html>
    `;
    w.document.write(printHtml);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  // Submit Withdrawal Request
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid withdrawal amount.');
      return;
    }
    if (amt > currentMember.withdrawable) {
      alert(`Withdrawal amount exceeds your available withdrawable balance of UGX ${currentMember.withdrawable.toLocaleString()}.`);
      return;
    }

    SaccoFarmStore.addTransaction({
      date: new Date().toISOString().split('T')[0],
      type: 'Expense',
      source: 'Petty Cash',
      category: `Member Withdrawal: ${currentMember.name} (${currentMember.memberId})`,
      amount: amt,
      description: `Withdrawal request for ${currentMember.name} to ${withdrawDestination}. Reason: ${withdrawReason}.`,
      reference: `WTH-${Date.now().toString().slice(-6)}`,
      isBanked: false
    });

    setShowWithdrawModal(false);
    notify(`Withdrawal request of UGX ${amt.toLocaleString()} submitted.`);
  };

  // Convert Savings to Shares
  const handleConvertShares = () => {
    const sharesToBuy = 2; // UGX 500,000
    if (currentMember.savings < sharesToBuy * 250000) {
      alert('Insufficient savings balance to purchase additional cooperative shares.');
      return;
    }
    if (confirm(`Confirm purchase of ${sharesToBuy} shares @ UGX 250,000 each (Total: UGX ${(sharesToBuy * 250000).toLocaleString()})?`)) {
      SaccoFarmStore.convertSavingsToShares(currentMember.id, sharesToBuy);
      notify(`Successfully purchased ${sharesToBuy} cooperative shares.`);
    }
  };

  // Support AI Assistant
  const handleSupportSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportQuery.trim()) return;

    const q = supportQuery;
    setSupportQuery('');
    setChatMessages(prev => [...prev, { sender: 'user', text: q }]);

    try {
      const res = await api.querySupportAssistant(q, currentMember.id);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: res.answer,
          source: res.sourceArticle
        }
      ]);
    } catch {
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'assistant',
            text: `Under SACCO bylaws, each ordinary share carries a nominal value of UGX 250,000. Deposits via MTN MoMo, Airtel Money, or Stanbic bank wires are credited upon verification. For assistance, contact the secretariat at +256 772 100 200.`,
            source: 'SACCO Bylaws Article 14'
          }
        ]);
      }, 500);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/signin');
  };

  return (
    <div className={`min-h-screen flex antialiased font-sans transition-colors duration-200 selection:bg-emerald-600 selection:text-white ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* 1. LEFT SIDEBAR */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-r p-4 flex flex-col justify-between shrink-0 shadow-2xl transition-transform duration-200 overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-5">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-white shadow-lg shadow-emerald-900/30 text-lg">
                DC
              </div>
              <div>
                <h1 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight leading-tight">Diaspora Connect</h1>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold tracking-wider uppercase">MEMBER PORTAL</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-800 dark:text-slate-300 font-medium hover:text-slate-900 dark:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Member Profile Widget */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-3">
              {memberPhoto ? (
                <img
                  src={memberPhoto}
                  alt={currentMember.name}
                  className="w-11 h-11 rounded-xl object-cover border border-emerald-500/40 shadow-md shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center justify-center border border-emerald-500/40 shrink-0">
                  {currentMember.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentMember.name}</p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold">{currentMember.memberId}</p>
                <span className="inline-block px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold">
                  {currentMember.status}
                </span>
              </div>
            </div>
          </div>

          {/* Left Navigation Items */}
          <div className="space-y-1">
            <button
              onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white shadow-md font-bold'
                  : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-slate-900 font-bold hover:text-emerald-700 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => { setActiveTab('shares'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'shares'
                  ? 'bg-emerald-600 text-white shadow-md font-bold'
                  : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-slate-900 font-bold hover:text-emerald-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Shares</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono font-bold">
                {currentMember.shares} sh
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('statement'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'statement'
                  ? 'bg-emerald-600 text-white shadow-md font-bold'
                  : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-slate-900 font-bold hover:text-emerald-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 shrink-0" />
                <span>Statement</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-mono font-bold">
                12 Mo
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('deposit'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'deposit'
                  ? 'bg-emerald-600 text-white shadow-md font-bold'
                  : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-slate-900 font-bold hover:text-emerald-700 hover:bg-slate-100'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Deposit Request</span>
            </button>

            <button
              onClick={() => { setActiveTab('withdraw'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'withdraw'
                  ? 'bg-rose-600 text-white shadow-md font-black'
                  : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-rose-600 font-black hover:bg-rose-50'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Withdrawal Request</span>
            </button>

            <button
              onClick={() => { setActiveTab('planning'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'planning'
                  ? 'bg-emerald-600 text-white shadow-md font-bold'
                  : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-slate-900 font-bold hover:text-emerald-700 hover:bg-slate-100'
              }`}
            >
              <Target className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Planning</span>
            </button>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className={`pt-4 border-t space-y-2.5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition border ${
              isDark
                ? 'bg-slate-950 hover:bg-slate-850 text-slate-200 border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {isDark ? <Sun className="w-4 h-4 text-emerald-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              <span>{isDark ? 'Switch to Light' : 'Switch to Dark'}</span>
            </div>
            <span className="text-[10px] text-slate-900 dark:text-slate-300 uppercase font-bold font-mono">{themeMode}</span>
          </button>

          <Link
            to="/"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition ${
              isDark ? 'bg-slate-950/70 hover:bg-slate-800 text-slate-200 border-slate-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>Public Website</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className={`sticky top-0 z-30 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} backdrop-blur border-b px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:text-white md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Member Portal</h2>
            </div>
          </div>

          {/* Navigation Search Bar */}
          <div className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-2 sm:mx-4 hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search modules, savings, shares, statement..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-8 py-1.5 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 shadow-sm"
              />
              {navSearch && (
                <button
                  onClick={() => setNavSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {navSearch.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-2xl shadow-2xl p-3 z-50 max-h-80 overflow-y-auto space-y-2">
                <p className="text-[10px] uppercase font-bold text-slate-800 dark:text-slate-300">Quick Navigation</p>
                {[
                  { label: 'Dashboard', tab: 'overview' as const, desc: 'Balances, shares, and monthly savings' },
                  { label: 'Shares', tab: 'shares' as const, desc: 'Share certificate & capital valuation' },
                  { label: 'Statement', tab: 'statement' as const, desc: 'Monthly contribution breakdown' },
                  { label: 'Deposit Request', tab: 'deposit' as const, desc: 'Submit deposit & payment receipt' },
                  { label: 'Withdrawal Request', tab: 'withdraw' as const, desc: 'Request savings payout' },
                  { label: 'Planning', tab: 'planning' as const, desc: 'Savings goals and expense projections' },
                ]
                  .filter(i => i.label.toLowerCase().includes(navSearch.toLowerCase()) || i.desc.toLowerCase().includes(navSearch.toLowerCase()))
                  .map(item => (
                    <button
                      key={item.tab}
                      onClick={() => { setActiveTab(item.tab); setNavSearch(''); }}
                      className="w-full text-left p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-800/80 transition flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Member Switcher & Theme Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
              title="Toggle Light / Dark Mode"
            >
              {isDark ? <Sun className="w-4 h-4 text-emerald-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              <span className="hidden sm:inline text-[11px]">{isDark ? 'Light' : 'Dark'}</span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-800 dark:text-slate-300">Account:</span>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className={`text-xs font-bold rounded-xl px-2.5 py-1.5 border focus:outline-none transition ${
                  isDark ? 'bg-slate-950 border-slate-700 text-emerald-400' : 'bg-slate-100 border-slate-300 text-emerald-800 font-bold'
                }`}
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.memberId})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Notification Toast */}
        {showNotification && (
          <div className="m-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-xl animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{showNotification}</span>
          </div>
        )}

        {/* Main Views */}
        <main className="p-4 md:p-6 space-y-6 flex-1 pb-24 md:pb-6">
          {/* VIEW: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Member Profile Clean Top Card */}
              <div className={`rounded-3xl p-5 md:p-6 shadow-sm border-2 ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    {memberPhoto ? (
                      <img
                        src={memberPhoto}
                        alt={currentMember.name}
                        className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-emerald-500/40 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                        {currentMember.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{currentMember.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                          {currentMember.status}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-bold mt-1">
                        Member ID: {currentMember.memberId}
                      </p>
                    </div>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDepositModal(true)}
                      className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      <span>DEPOSIT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowWithdrawModal(true)}
                      className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md shadow-rose-900/20 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>WITHDRAW</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('planning')}
                      className="px-4 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs border border-emerald-500/40 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>PLANNING</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('statement')}
                      className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>STATEMENT</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── MODULE CARDS: Small Square with Round Border Buttons ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-emerald-600" />
                    <span>Member Modules &amp; Services</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">All Clickable</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  {/* 1. Planning */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('planning')}
                    className="group aspect-square p-2.5 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/15 hover:border-emerald-500 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm active:scale-95"
                    title="Financial Planning & Goals"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                      <Target className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">Planning</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Goals</span>
                  </button>

                  {/* 2. Statement */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('statement')}
                    className="group aspect-square p-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm active:scale-95"
                    title="12-Month Ledger Statement"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">Statement</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Ledger</span>
                  </button>

                  {/* 3. Shares */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('shares')}
                    className="group aspect-square p-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-500 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm active:scale-95"
                    title="Share Capital & Dividends"
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">Shares</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Equity</span>
                  </button>

                  {/* 4. Deposit Funds */}
                  <button
                    type="button"
                    onClick={() => setShowDepositModal(true)}
                    className="group aspect-square p-2.5 rounded-2xl border-2 border-emerald-600/40 bg-emerald-600/10 hover:bg-emerald-600/20 hover:border-emerald-600 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm active:scale-95"
                    title="Make Deposit"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-1 group-hover:scale-110 transition shadow-sm">
                      <ArrowDownLeft className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">Deposit</span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Top Up</span>
                  </button>

                  {/* 5. Withdraw Funds */}
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(true)}
                    className="group aspect-square p-2.5 rounded-2xl border-2 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/15 hover:border-rose-500 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm active:scale-95"
                    title="Request Withdrawal"
                  >
                    <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center mb-1 group-hover:scale-110 transition shadow-sm">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">Withdraw</span>
                    <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold uppercase">Payout</span>
                  </button>

                  {/* 6. Certificate */}
                  <button
                    type="button"
                    onClick={() => setShowCertificateModal(true)}
                    className="group aspect-square p-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm active:scale-95"
                    title="View Share Certificate"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">Certificate</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Official</span>
                  </button>

                  {/* 7. Chat / WhatsApp Support */}
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('dc_open_chat'))}
                    className="group aspect-square p-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm active:scale-95"
                    title="Live Chat Support"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">Chat</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Direct</span>
                  </button>

                  {/* 8. Settings */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="group aspect-square p-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm active:scale-95"
                    title="Portal Settings"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                      <Settings className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">Settings</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Security</span>
                  </button>
                </div>
              </div>

              {/* 4 Financial Balances Cards - Clickable */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('statement')}
                  className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-left hover:border-emerald-500/60 transition cursor-pointer active:scale-98"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase">Savings Balance</span>
                    <Coins className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                    UGX {currentMember.savings.toLocaleString()}
                  </div>
                  <p className="text-xs font-bold mt-1 text-rose-600 dark:text-rose-400">
                    Withdrawable: UGX {currentMember.withdrawable.toLocaleString()} &rarr;
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('shares')}
                  className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-left hover:border-purple-500/60 transition cursor-pointer active:scale-98"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase">Share Ownership</span>
                    <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {currentMember.shares} Shares
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mt-1">
                    Value: UGX {(currentMember.shares * 250000).toLocaleString()} &rarr;
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('statement')}
                  className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-left hover:border-emerald-500/60 transition cursor-pointer active:scale-98"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase">Total Contributed</span>
                    <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    UGX {currentMember.total.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mt-1">Cumulative Deposits &rarr;</p>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCertificateModal(true)}
                  className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-left hover:border-amber-500/60 transition cursor-pointer active:scale-98"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase">Membership Status</span>
                    <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                    Active
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mt-1">Voting Member &bull; View Cert &rarr;</p>
                </button>
              </div>

              {/* Monthly Savings Section - Every Month Clickable */}
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base">Monthly Savings</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                      Click any month to view its detailed monthly statement
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('statement')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 flex items-center gap-1.5"
                  >
                    <span>Full Statement</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-center text-xs font-mono">
                  {MONTH_KEYS.map((m, idx) => {
                    const val = Number((currentMember as any)[m]) || 0;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSelectedMonthStatement({
                          key: m,
                          name: MONTH_FULL_NAMES[m],
                          amount: val,
                          adminFee: m === 'jan' ? (Number(currentMember.adminFee) || 50000) : 0,
                          monthIndex: idx
                        })}
                        className="group bg-slate-50 dark:bg-slate-950 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 p-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 transition cursor-pointer text-center relative focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        title={`Click to view statement for ${MONTH_FULL_NAMES[m]}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-700 dark:text-slate-400 text-[10px] uppercase font-bold group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                            {m}
                          </span>
                          <span className="text-[8px] px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold group-hover:bg-emerald-600 group-hover:text-white uppercase transition">
                            View
                          </span>
                        </div>
                        <span className="text-slate-900 dark:text-white font-black text-sm block">
                          {(val / 1000).toFixed(0)}k
                        </span>
                        <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-semibold block mt-0.5">
                          {val > 0 ? 'Verified' : 'Pending'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions & Policy Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                    <Award className="w-4 h-4" /> Share Capital Rights
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-300 font-semibold leading-relaxed">
                    Each share is nominal UGX 250,000. Members holding 10+ shares participate in AGM voting and receive annual dividend surpluses.
                  </p>
                  <button
                    onClick={handleConvertShares}
                    className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold flex items-center gap-1 pt-1"
                  >
                    Convert Savings to Shares &rarr;
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" /> Dual-Control Protection
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-300 font-semibold leading-relaxed">
                    All deposits and payouts require verified payment evidence by the Accountant and final authorization by the Administrator.
                  </p>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                    Audited and Verified
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SHARES */}
          {activeTab === 'shares' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Share Capital</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCertificateModal(true)}
                    className="px-3 py-2 rounded-xl bg-purple-100 dark:bg-purple-500/20 hover:bg-purple-200 dark:hover:bg-purple-500/30 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Award className="w-4 h-4" /> View Share Certificate
                  </button>
                  <button
                    onClick={handleConvertShares}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md"
                  >
                    <Coins className="w-4 h-4" /> Buy More Shares
                  </button>
                </div>
              </div>

              {/* Shares Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs text-slate-800 dark:text-slate-300 font-bold">Total Shares Owned</span>
                  <div className="text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
                    {currentMember.shares} <span className="text-sm font-normal text-slate-700 dark:text-slate-300 font-bold">Shares</span>
                  </div>
                  <p className="text-xs text-purple-700 dark:text-purple-300 font-bold mt-1">Class A Voting Equity</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs text-slate-800 dark:text-slate-300 font-bold">Nominal Valuation</span>
                  <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">
                    UGX {(currentMember.shares * 250000).toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mt-1">UGX 250,000 / Share Par Value</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs text-slate-800 dark:text-slate-300 font-bold">Certificate Number</span>
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">
                    CERT-DC-{currentMember.memberId.replace('DC-', '')}
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">Official Registry</p>
                </div>
              </div>

              {/* Share Breakdown Table */}
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Share Allotment Schedule</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">Reference</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Class</th>
                        <th className="p-3 text-right">Units</th>
                        <th className="p-3 text-right">Par Value</th>
                        <th className="p-3 text-right">Total</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      <tr>
                        <td className="p-3 font-mono text-purple-700 dark:text-purple-300 font-bold">ALLOT-2024-001</td>
                        <td className="p-3 text-slate-900 dark:text-slate-200 font-bold">{currentMember.joinDate}</td>
                        <td className="p-3 text-slate-800 dark:text-slate-200 font-semibold">Class A Voting Equity</td>
                        <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white">{currentMember.shares}</td>
                        <td className="p-3 text-right font-mono text-slate-800 dark:text-slate-300 font-bold">UGX 250,000</td>
                        <td className="p-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-400">
                          UGX {(currentMember.shares * 250000).toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold">
                            Active
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: FINANCIAL STATEMENT */}
          {activeTab === 'statement' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Account Statement</h3>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 self-start"
                >
                  <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Print Statement
                </button>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <div>
                  <span className="text-[11px] text-slate-800 dark:text-slate-300 font-bold">Total Deposits:</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white font-mono">UGX {currentMember.total.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-800 dark:text-slate-300 font-bold">Admin/Ops Fee:</span>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-300 font-mono">UGX {currentMember.adminFee.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-800 dark:text-slate-300 font-bold">Net Cumulative Savings:</span>
                  <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">UGX {currentMember.savings.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-800 dark:text-slate-300 font-bold">Available Withdrawable:</span>
                  <p className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">UGX {currentMember.withdrawable.toLocaleString()}</p>
                </div>
              </div>

              {/* Monthly Table */}
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Monthly Breakdown</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-2.5">Month</th>
                        <th className="p-2.5 text-right">Contributed</th>
                        <th className="p-2.5 text-right">Admin Deduction</th>
                        <th className="p-2.5 text-right">Net Savings</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                      {[
                        { m: 'January', key: 'jan' as const, val: currentMember.jan, fee: currentMember.adminFee, idx: 0 },
                        { m: 'February', key: 'feb' as const, val: currentMember.feb, fee: 0, idx: 1 },
                        { m: 'March', key: 'mar' as const, val: currentMember.mar, fee: 0, idx: 2 },
                        { m: 'April', key: 'apr' as const, val: currentMember.apr, fee: 0, idx: 3 },
                        { m: 'May', key: 'may' as const, val: currentMember.may, fee: 0, idx: 4 },
                        { m: 'June', key: 'jun' as const, val: currentMember.jun, fee: 0, idx: 5 },
                        { m: 'July', key: 'jul' as const, val: currentMember.jul, fee: 0, idx: 6 },
                        { m: 'August', key: 'aug' as const, val: currentMember.aug, fee: 0, idx: 7 },
                        { m: 'September', key: 'sep' as const, val: currentMember.sep, fee: 0, idx: 8 },
                        { m: 'October', key: 'oct' as const, val: currentMember.oct, fee: 0, idx: 9 },
                        { m: 'November', key: 'nov' as const, val: currentMember.nov, fee: 0, idx: 10 },
                        { m: 'December', key: 'dec' as const, val: currentMember.dec, fee: 0, idx: 11 },
                      ].map((row) => (
                        <tr
                          key={row.key}
                          onClick={() => setSelectedMonthStatement({
                            key: row.key,
                            name: row.m,
                            amount: row.val,
                            adminFee: row.fee,
                            monthIndex: row.idx
                          })}
                          className="hover:bg-emerald-50/60 dark:hover:bg-slate-800/50 cursor-pointer transition"
                          title="Click to view detailed month statement"
                        >
                          <td className="p-2.5 font-sans font-bold text-slate-900 dark:text-slate-200 flex items-center justify-between">
                            <span>{row.m}</span>
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold underline">View Statement &rarr;</span>
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">UGX {row.val.toLocaleString()}</td>
                          <td className="p-2.5 text-right font-bold text-slate-600 dark:text-slate-400">UGX {row.fee.toLocaleString()}</td>
                          <td className="p-2.5 text-right font-black text-emerald-700 dark:text-emerald-400">UGX {(row.val - row.fee).toLocaleString()}</td>
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 text-[10px] font-sans font-bold">
                              POSTED
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transactions History */}
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Recent Transactions</h4>
                <div className="space-y-2">
                  {transactions
                    .filter(tx => tx.category.includes(currentMember.name) || tx.description.includes(currentMember.name) || tx.type === 'Income')
                    .slice(0, 5)
                    .map(tx => (
                      <div key={tx.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{tx.category || tx.description}</p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-medium">{tx.date} &middot; Ref: {tx.reference || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono font-black ${tx.type === 'Income' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {tx.type === 'Income' ? '+' : '-'} UGX {tx.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: DEPOSIT REQUEST */}
          {activeTab === 'deposit' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Submit Deposit Request</h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mt-1">
                  Submit external payment evidence. Once verified, it reflects in your statement.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                {/* Payment Channels Notice */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> Authorized Collection Channels:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-900 dark:text-slate-200 font-bold">
                    <li><strong className="text-emerald-800 dark:text-emerald-300">MTN Merchant MoMoPay:</strong> 784102 (Diaspora Connect SACCO Ltd)</li>
                    <li><strong className="text-emerald-800 dark:text-emerald-300">Airtel Money Pay:</strong> 6100234 (Diaspora Connect Farmers)</li>
                    <li><strong className="text-emerald-800 dark:text-emerald-300">Stanbic Bank Uganda:</strong> Account #9030018492019</li>
                  </ul>
                </div>

                <form onSubmit={handleDepositSubmit} className="space-y-4">
                  {/* What you are depositing for */}
                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                      What are you depositing for? *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDepositPurpose('savings')}
                        className={`p-3 rounded-xl border-2 text-left transition flex items-start gap-2.5 ${
                          depositPurpose === 'savings'
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <Coins className={`w-4 h-4 shrink-0 mt-0.5 ${depositPurpose === 'savings' ? 'text-emerald-600' : 'text-slate-500'}`} />
                        <div>
                          <p className="text-xs font-bold leading-tight">Monthly Savings</p>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">Regular monthly member savings</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDepositPurpose('shares');
                          if (Number(depositAmount) < 250000) setDepositAmount('500000');
                        }}
                        className={`p-3 rounded-xl border-2 text-left transition flex items-start gap-2.5 ${
                          depositPurpose === 'shares'
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${depositPurpose === 'shares' ? 'text-purple-600' : 'text-slate-500'}`} />
                        <div>
                          <p className="text-xs font-bold leading-tight">Buying Shares / Share Capital</p>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">UGX 250,000 / share (Voting Equity)</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDepositPurpose('welfare')}
                        className={`p-3 rounded-xl border-2 text-left transition flex items-start gap-2.5 ${
                          depositPurpose === 'welfare'
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <Award className={`w-4 h-4 shrink-0 mt-0.5 ${depositPurpose === 'welfare' ? 'text-blue-600' : 'text-slate-500'}`} />
                        <div>
                          <p className="text-xs font-bold leading-tight">Welfare / Emergency Fund</p>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">Emergency support & member relief</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDepositPurpose('project')}
                        className={`p-3 rounded-xl border-2 text-left transition flex items-start gap-2.5 ${
                          depositPurpose === 'project'
                            ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <TrendingUp className={`w-4 h-4 shrink-0 mt-0.5 ${depositPurpose === 'project' ? 'text-amber-600' : 'text-slate-500'}`} />
                        <div>
                          <p className="text-xs font-bold leading-tight">Special Farm Project</p>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">Dairy & farm development expansion</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Assistance based on Deposit Purpose */}
                  {depositPurpose === 'shares' && (
                    <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-900 dark:text-purple-300">Share Capital Calculation:</span>
                        <span className="font-mono font-black text-purple-700 dark:text-purple-400">
                          {Math.floor(Number(depositAmount || 0) / 250000)} Shares @ UGX 250,000 each
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: '1 Share (250k)', val: '250000' },
                          { label: '2 Shares (500k)', val: '500000' },
                          { label: '4 Shares (1.0M)', val: '1000000' },
                          { label: '8 Shares (2.0M)', val: '2000000' },
                          { label: '12 Shares (3.0M)', val: '3000000' },
                        ].map(preset => (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => setDepositAmount(preset.val)}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 text-[11px] font-bold text-purple-800 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {depositPurpose === 'savings' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">Target Savings Month *</label>
                      <select
                        value={depositMonthTarget}
                        onChange={(e) => setDepositMonthTarget(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                      >
                        {MONTH_KEYS.map(k => (
                          <option key={k} value={k}>{MONTH_FULL_NAMES[k]} 2026</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">Deposit Amount (UGX) *</label>
                    <input
                      type="number"
                      required
                      min="10000"
                      step="10000"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">Payment Channel *</label>
                    <select
                      value={depositMethod}
                      onChange={(e: any) => setDepositMethod(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="MTN Mobile Money">MTN Mobile Money (MoMoPay 784102)</option>
                      <option value="Airtel Money">Airtel Money Pay (Merchant 6100234)</option>
                      <option value="Stanbic Bank Wire">Stanbic Bank Wire</option>
                      <option value="ABSA Bank Wire">ABSA Bank Diaspora Account</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">Payment Reference *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MTN-891024 or Bank Slip Number"
                      value={depositRef}
                      onChange={(e) => setDepositRef(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Optional notes"
                      value={depositNotes}
                      onChange={(e) => setDepositNotes(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>SUBMIT DEPOSIT REQUEST</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* VIEW: WITHDRAWAL REQUEST */}
          {activeTab === 'withdraw' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Submit Withdrawal Request</h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mt-1">
                  Withdraw from your unencumbered savings balance.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-800 dark:text-slate-300 font-bold">Available Withdrawable Balance:</span>
                    <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                      UGX {currentMember.withdrawable.toLocaleString()}
                    </p>
                  </div>
                  <Coins className="w-8 h-8 text-rose-500/40" />
                </div>

                <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">Requested Amount (UGX) *</label>
                    <input
                      type="number"
                      required
                      min="50000"
                      max={currentMember.withdrawable}
                      step="10000"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">Payout Destination *</label>
                    <input
                      type="text"
                      required
                      placeholder="+256 7XX XXX XXX (Mobile Money) or Bank Account"
                      value={withdrawDestination}
                      onChange={(e) => setWithdrawDestination(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">Reason for Withdrawal</label>
                    <input
                      type="text"
                      value={withdrawReason}
                      onChange={(e) => setWithdrawReason(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" /> Withdrawal Notice:
                    </p>
                    <p className="text-[11px] text-slate-800 dark:text-slate-200 font-bold mt-1">
                      Withdrawals undergo verification and are processed within 24 business hours.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm transition shadow-md shadow-rose-900/30 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>SUBMIT WITHDRAWAL REQUEST</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* VIEW: PLANNING */}
          {activeTab === 'planning' && (
            <div className="space-y-4">
              <Planning />
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Member Profile &amp; Preferences</h3>
              <p className="text-xs text-slate-500">Security preferences, phone number, and statement delivery options.</p>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Security Status</span>
                <p className="font-extrabold text-emerald-600 dark:text-emerald-400">Two-Factor Authentication Active</p>
                <p className="text-slate-500 text-[11px]">Authorized for SACCO digital banking &amp; dividend distribution.</p>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL: DEPOSIT REQUEST */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Make a Deposit Request</h3>
              </div>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-800 dark:text-slate-300 font-medium hover:text-slate-900 dark:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4 text-xs">
              {/* Deposit Purpose Selector in Modal */}
              <div>
                <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                  What are you depositing for? *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDepositPurpose('savings')}
                    className={`p-2.5 rounded-xl border-2 text-left transition flex items-start gap-2 ${
                      depositPurpose === 'savings'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Coins className={`w-4 h-4 shrink-0 mt-0.5 ${depositPurpose === 'savings' ? 'text-emerald-600' : 'text-slate-500'}`} />
                    <div>
                      <p className="font-bold text-[11px] leading-tight">Monthly Savings</p>
                      <p className="text-[9px] text-slate-500">Regular member savings</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDepositPurpose('shares');
                      if (Number(depositAmount) < 250000) setDepositAmount('500000');
                    }}
                    className={`p-2.5 rounded-xl border-2 text-left transition flex items-start gap-2 ${
                      depositPurpose === 'shares'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${depositPurpose === 'shares' ? 'text-purple-600' : 'text-slate-500'}`} />
                    <div>
                      <p className="font-bold text-[11px] leading-tight">Buying Shares</p>
                      <p className="text-[9px] text-slate-500">UGX 250k / share</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDepositPurpose('welfare')}
                    className={`p-2.5 rounded-xl border-2 text-left transition flex items-start gap-2 ${
                      depositPurpose === 'welfare'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Award className={`w-4 h-4 shrink-0 mt-0.5 ${depositPurpose === 'welfare' ? 'text-blue-600' : 'text-slate-500'}`} />
                    <div>
                      <p className="font-bold text-[11px] leading-tight">Welfare Fund</p>
                      <p className="text-[9px] text-slate-500">Emergency relief pool</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDepositPurpose('project')}
                    className={`p-2.5 rounded-xl border-2 text-left transition flex items-start gap-2 ${
                      depositPurpose === 'project'
                        ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <TrendingUp className={`w-4 h-4 shrink-0 mt-0.5 ${depositPurpose === 'project' ? 'text-amber-600' : 'text-slate-500'}`} />
                    <div>
                      <p className="font-bold text-[11px] leading-tight">Farm Project</p>
                      <p className="text-[9px] text-slate-500">Special development</p>
                    </div>
                  </button>
                </div>
              </div>

              {depositPurpose === 'shares' && (
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-purple-900 dark:text-purple-300">Equity Shares:</span>
                    <span className="font-mono font-black text-purple-700 dark:text-purple-400">
                      {Math.floor(Number(depositAmount || 0) / 250000)} Shares
                    </span>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {['250000', '500000', '1000000', '2000000'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setDepositAmount(val)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 text-[10px] font-bold text-purple-800 dark:text-purple-300"
                      >
                        {Number(val)/250000} sh
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {depositPurpose === 'savings' && (
                <div>
                  <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1">Target Savings Month *</label>
                  <select
                    value={depositMonthTarget}
                    onChange={(e) => setDepositMonthTarget(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                  >
                    {MONTH_KEYS.map(k => (
                      <option key={k} value={k}>{MONTH_FULL_NAMES[k]} 2026</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1">Amount (UGX) *</label>
                <input
                  type="number"
                  required
                  min="10000"
                  step="10000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1">Payment Method</label>
                <select
                  value={depositMethod}
                  onChange={(e: any) => setDepositMethod(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="MTN Mobile Money">MTN MoMoPay (784102 - Diaspora Connect)</option>
                  <option value="Airtel Money">Airtel Money Merchant (6100234)</option>
                  <option value="Stanbic Bank Wire">Stanbic Bank Wire</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1">Payment Reference</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1092839210 or Slip Number"
                  value={depositRef}
                  onChange={(e) => setDepositRef(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-md"
                >
                  Submit Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: WITHDRAWAL REQUEST */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Request Withdrawal</h3>
              </div>
              <button onClick={() => setShowWithdrawModal(false)} className="text-slate-800 dark:text-slate-300 font-medium hover:text-slate-900 dark:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-800 dark:text-slate-300 font-bold">Available Withdrawable:</span>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
                UGX {currentMember.withdrawable.toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1">Requested Amount (UGX)</label>
                <input
                  type="number"
                  required
                  min="50000"
                  max={currentMember.withdrawable}
                  step="10000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1">Destination Phone / Account</label>
                <input
                  type="text"
                  required
                  value={withdrawDestination}
                  onChange={(e) => setWithdrawDestination(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black shadow-md shadow-rose-900/30"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MONTHLY STATEMENT */}
      {selectedMonthStatement && (() => {
        const idx = selectedMonthStatement.monthIndex;
        let openingBal = 0;
        for (let i = 0; i < idx; i++) {
          const k = MONTH_KEYS[i];
          openingBal += Number((currentMember as any)[k]) || 0;
        }
        if (idx > 0) openingBal -= Number(currentMember.adminFee) || 50000;
        openingBal = Math.max(0, openingBal);
        const grossAmt = selectedMonthStatement.amount;
        const feeAmt = selectedMonthStatement.adminFee;
        const netAmt = grossAmt - feeAmt;
        const closingBal = openingBal + netAmt;

        // Month transactions
        const monthTxList = transactions.filter(tx => {
          const matchMember = tx.category.includes(currentMember.name) || tx.description.includes(currentMember.name);
          const monthNum = String(idx + 1).padStart(2, '0');
          const dateMatch = tx.date && tx.date.includes(`-${monthNum}-`);
          const textMatch = tx.description.toLowerCase().includes(selectedMonthStatement.name.toLowerCase()) || tx.category.toLowerCase().includes(selectedMonthStatement.name.toLowerCase());
          return matchMember && (dateMatch || textMatch);
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-7 max-w-2xl w-full space-y-5 shadow-2xl relative animate-scale-up text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/30 uppercase">
                      Official Monthly Statement
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Ref: STMT-{selectedMonthStatement.key.toUpperCase()}</span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                    {selectedMonthStatement.name} 2026 Statement
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-bold mt-0.5">
                    {currentMember.name} &middot; <span className="font-mono text-emerald-700 dark:text-emerald-400">{currentMember.memberId}</span> &middot; {currentMember.category}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMonthStatement(null)}
                  className="p-1 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Financial Balance Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase block">Opening Balance</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white font-mono block mt-1">
                    UGX {openingBal.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Brought forward</span>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/50">
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase block">Monthly Deposit</span>
                  <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono block mt-1">
                    + UGX {grossAmt.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold">Gross Credited</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase block">Admin Deductions</span>
                  <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono block mt-1">
                    {feeAmt > 0 ? `- UGX ${feeAmt.toLocaleString()}` : 'UGX 0'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">{feeAmt > 0 ? 'Annual levy' : 'No deductions'}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-emerald-500/40">
                  <span className="text-[10px] text-slate-800 dark:text-slate-300 font-bold uppercase block">Closing Balance</span>
                  <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono block mt-1">
                    UGX {closingBal.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">Carried Forward</span>
                </div>
              </div>

              {/* Itemized Activity */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Itemized Ledger Activity for {selectedMonthStatement.name}
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-2.5">Date / Ref</th>
                        <th className="p-2.5">Particulars & Purpose</th>
                        <th className="p-2.5 text-right">Amount</th>
                        <th className="p-2.5 text-center">Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {monthTxList.length > 0 ? (
                        monthTxList.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-2.5">
                              <span className="font-sans font-bold text-slate-900 dark:text-white block">{tx.date}</span>
                              <span className="text-[10px] text-slate-500">{tx.reference || 'REF-N/A'}</span>
                            </td>
                            <td className="p-2.5 font-sans">
                              <span className="font-bold text-slate-900 dark:text-white block">{tx.category}</span>
                              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{tx.description}</span>
                            </td>
                            <td className="p-2.5 text-right font-black text-emerald-700 dark:text-emerald-400">
                              + UGX {tx.amount.toLocaleString()}
                            </td>
                            <td className="p-2.5 text-center font-sans">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-[9px] font-bold">
                                RECONCILED
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-2.5">
                            <span className="font-sans font-bold text-slate-900 dark:text-white block">2026-{(idx + 1).toString().padStart(2, '0')}-05</span>
                            <span className="text-[10px] text-slate-500">MOM-{selectedMonthStatement.key.toUpperCase()}-001</span>
                          </td>
                          <td className="p-2.5 font-sans">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              Regular Monthly Savings Contribution ({selectedMonthStatement.name})
                            </span>
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                              Direct credit to {currentMember.name} SACCO savings account
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-black text-emerald-700 dark:text-emerald-400">
                            + UGX {grossAmt.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-center font-sans">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-[9px] font-bold">
                              RECONCILED
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const targetMonth = selectedMonthStatement.key;
                    setSelectedMonthStatement(null);
                    setDepositPurpose('savings');
                    setDepositMonthTarget(targetMonth);
                    setShowDepositModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Deposit to {selectedMonthStatement.name}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintMonthStatement}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition"
                  >
                    <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Print Statement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMonthStatement(null)}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: SHARE CERTIFICATE */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 md:p-8 max-w-2xl w-full space-y-6 shadow-2xl relative text-slate-900 dark:text-slate-100">
            <button
              onClick={() => setShowCertificateModal(false)}
              className="absolute top-4 right-4 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-medium hover:text-slate-900 dark:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Certificate Header */}
            <div className="text-center space-y-2 border-b border-emerald-500/30 pb-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
                DC
              </div>
              <h2 className="text-xl font-extrabold tracking-wider text-emerald-800 dark:text-emerald-300 uppercase">
                Diaspora Connect Farmers SACCO Ltd
              </h2>
              <p className="text-[11px] text-slate-800 dark:text-slate-200 font-bold uppercase tracking-widest">
                Certificate of Cooperative Share Capital Ownership
              </p>
            </div>

            {/* Certificate Body */}
            <div className="space-y-4 text-center text-xs">
              <p className="text-slate-800 dark:text-slate-200 font-semibold">This is to certify that</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-wide">{currentMember.name}</h3>
              <p className="text-slate-800 dark:text-slate-300 font-mono font-bold">
                Member ID: {currentMember.memberId}
              </p>
              <p className="text-slate-800 dark:text-slate-200 font-semibold leading-relaxed max-w-lg mx-auto">
                Is the duly registered proprietor of <strong className="text-purple-700 dark:text-purple-300">{currentMember.shares} Fully-Paid Class A Voting Shares</strong> with a nominal par value of <strong>UGX 250,000 each</strong> (Total Capital: <strong className="text-emerald-700 dark:text-emerald-400">UGX {(currentMember.shares * 250000).toLocaleString()}</strong>).
              </p>
            </div>

            {/* Certificate Seals */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-[11px]">
              <div>
                <p className="font-mono text-slate-800 dark:text-slate-300 font-bold">CERT-DC-{currentMember.memberId.replace('DC-', '')}</p>
                <p className="font-bold text-slate-900 dark:text-slate-200 mt-1">Mr. Nyanzi Edrine</p>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">Board Chairperson</span>
              </div>
              <div>
                <p className="font-mono text-slate-800 dark:text-slate-300 font-bold">REG-DATE: {currentMember.joinDate}</p>
                <p className="font-bold text-slate-900 dark:text-slate-200 mt-1">Mrs. Miriam Halera</p>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">SACCO Treasurer</span>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md"
              >
                Print Certificate
              </button>
            </div>
          </div>
        </div>
      )}
          {/* Mobile Bottom Navigation Bar (Home, Dashboard, Chat, Settings) */}
      <PortalBottomNav
        currentTab={activeTab === 'overview' ? 'dashboard' : activeTab === 'planning' ? 'planning' : activeTab === 'chat' ? 'chat' : activeTab}
        onSelectTab={t => {
          if (t === 'dashboard') setActiveTab('overview');
          else if (t === 'planning') setActiveTab('planning');
          else if (t === 'chat') window.dispatchEvent(new CustomEvent('dc_open_chat'));
          else if (t === 'settings') setActiveTab('settings');
          else setActiveTab(t as any);
        }}
        dashboardTab="dashboard"
        chatTab="chat"
        settingsTab="settings"
      />
    </div>
  );
}
