import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getSession, setSession, clearSession, api } from '../../services/api';
import { applyTheme, getTheme } from '../../services/theme';
import PortalBottomNav from '../../components/PortalBottomNav';
import Planning from '../Planning';
import {
  SaccoFarmStore,
  SaccoMember,
  PettyCashTransaction,
  ShareConversionRequest,
  MemberPaymentRequest,
  MonthKey,
  getMemberPhoto
} from '../../services/saccoFarmStore';
import MemberKycPanel from '../../components/kyc/MemberKycPanel';
import { database } from '../../services/database';
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
  Repeat,
  Printer,
  ChevronRight,
  Award,
  Globe,
  Sun,
  Moon,
  Target,
  MessageSquare,
  Settings,
  Phone,
  Edit3,
  Camera,
  User,
  Upload,
  Check
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
  const [activeTab, setActiveTab] = useState<'overview' | 'shares' | 'statement' | 'deposit' | 'withdraw' | 'kyc' | 'planning' | 'chat' | 'settings'>(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (p === 'planning') return 'planning';
      if (p === 'settings') return 'settings';
      if (p === 'kyc') return 'kyc';
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
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showBuySharesChoiceModal, setShowBuySharesChoiceModal] = useState(false);
  const [showConvertSavingsModal, setShowConvertSavingsModal] = useState(false);
  const [convertShareCount, setConvertShareCount] = useState(1);
  const [shareConversionRequests, setShareConversionRequests] = useState<ShareConversionRequest[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<MemberPaymentRequest[]>([]);
  const [kycStatus, setKycStatus] = useState<string>('NOT_SUBMITTED');
  // set in Supabase only (profiles.kyc_exempt); the app cannot change it
  const kycExempt = getSession()?.kycExempt === true;

  // Edit Profile Form State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
  const [depositMethod, setDepositMethod] = useState<'MTN Mobile Money' | 'Airtel Money' | 'Bank Wire'>('MTN Mobile Money');
  const [depositRef, setDepositRef] = useState('');
  // Mobile money "pay now" (MTN MoMo / Airtel Money prompt on the member's phone)
  const [momoPhone, setMomoPhone] = useState('');
  const [momoState, setMomoState] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [momoMsg, setMomoMsg] = useState('');
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
    setShareConversionRequests(SaccoFarmStore.getShareConversionRequests());
    setPaymentRequests(SaccoFarmStore.getPaymentRequests());
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
        (session.email && m.email && m.email.toLowerCase() === session.email.toLowerCase())
      );
      if (match) {
        setSelectedMemberId(match.id);
      }
    }
  }, [members, session]);

  // Determine current active member
  // Staff can see every member, so fall back to the first record only for a member login (which sees only its own)
  const currentMember: SaccoMember = members.find(m => m.id === selectedMemberId || m.memberId === selectedMemberId) || (session?.role === 'MEMBER' ? members[0] : undefined) || {
    id: session?.memberNumber || '',
    memberId: session?.memberNumber || '',
    name: session?.fullName || '',
    phone: '',
    email: session?.email || '',
    nin: '',
    category: '',
    joinDate: '',
    status: 'ACTIVE',
    avatar: '',
    jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
    jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
    total: 0,
    adminFee: 0,
    savings: 0,
    shares: 0,
    sharesValue: 0,
    withdrawable: 0
  };

  const getRegisteredPhoto = () => {
    try {
      const regs = JSON.parse(localStorage.getItem('dc_member_registrations') || '[]');
      const r = regs.find((a: any) =>
        (a.email && currentMember.email && a.email.toLowerCase() === currentMember.email.toLowerCase()) ||
        (a.fullName && currentMember.name && a.fullName.toLowerCase() === currentMember.name.toLowerCase()) ||
        (a.memberId && currentMember.memberId && a.memberId === currentMember.memberId)
      );
      if (r?.photoUrl) return r.photoUrl;
    } catch {}
    return '';
  };

  useEffect(() => {
    setKycStatus(kycExempt ? 'EXEMPT' : SaccoFarmStore.getKycStatus(currentMember.memberId));
  }, [currentMember.memberId, members, transactions, paymentRequests]);

  const memberPhoto = (session as any)?.photoUrl || getRegisteredPhoto() || currentMember.avatar || getMemberPhoto(currentMember.name);

  const notify = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(''), 6000);
  };

  useEffect(() => {
    if (currentMember) {
      if (!editName) setEditName(currentMember.name || session?.fullName || '');
      if (!editPhone) setEditPhone(currentMember.phone || (session as any)?.phone || '');
      if (!editEmail) setEditEmail(currentMember.email || session?.email || '');
      if (!editPhotoUrl) setEditPhotoUrl(memberPhoto || '');
    }
  }, [currentMember, memberPhoto, session]);

  const openEditProfile = () => {
    setEditName(currentMember.name || session?.fullName || '');
    setEditPhone(currentMember.phone || (session as any)?.phone || '');
    setEditEmail(currentMember.email || session?.email || '');
    setEditPhotoUrl(memberPhoto || '');
    setShowEditProfileModal(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      notify('Photo file size should be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setEditPhotoUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editName.trim()) {
      notify('Please enter your full name.');
      return;
    }
    setIsSavingProfile(true);

    try {
      const finalPhoto = editPhotoUrl || memberPhoto || '';

      // 1. Update in SaccoFarmStore
      SaccoFarmStore.updateMember(currentMember.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        avatar: finalPhoto
      });

      // 2. Update active user session
      const currentSession = getSession();
      if (currentSession) {
        const updatedSession: any = {
          ...currentSession,
          fullName: editName.trim(),
          email: editEmail.trim() || currentSession.email,
          phone: editPhone.trim(),
          photoUrl: finalPhoto
        };
        setSession(updatedSession);
      }

      // 3. Update in dc_member_registrations
      try {
        const regs = JSON.parse(localStorage.getItem('dc_member_registrations') || '[]');
        const updatedRegs = regs.map((r: any) => {
          if (
            (r.memberId && (r.memberId === currentMember.memberId || r.memberId === currentMember.id)) ||
            (r.email && currentMember.email && r.email.toLowerCase() === currentMember.email.toLowerCase()) ||
            (r.fullName && currentMember.name && r.fullName.toLowerCase() === currentMember.name.toLowerCase())
          ) {
            return {
              ...r,
              fullName: editName.trim(),
              phone: editPhone.trim(),
              email: editEmail.trim(),
              photoUrl: finalPhoto || r.photoUrl
            };
          }
          return r;
        });
        localStorage.setItem('dc_member_registrations', JSON.stringify(updatedRegs));
      } catch {}

      // 4. Update in dc_member_photos
      if (finalPhoto) {
        try {
          const photos = JSON.parse(localStorage.getItem('dc_member_photos') || '{}');
          photos[editName.trim()] = finalPhoto;
          photos[currentMember.name] = finalPhoto;
          if (currentMember.memberId) photos[currentMember.memberId] = finalPhoto;
          if (currentMember.id) photos[currentMember.id] = finalPhoto;
          localStorage.setItem('dc_member_photos', JSON.stringify(photos));
        } catch {}
      }

      // 5. Reactive reload & feedback
      window.dispatchEvent(new Event('dc_storage_update'));
      reloadData();
      setShowEditProfileModal(false);
      notify('Member profile updated successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      notify('Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Pay now: the SACCO server sends a payment prompt to the phone; once the member enters their PIN the
  // provider confirms the money and the request goes straight to the Admin (no manual reference needed)
  const handlePayNow = async () => {
    const amt = Number(depositAmount);
    if (!amt || amt < 500) { setMomoState('failed'); setMomoMsg('Enter the amount first (minimum UGX 500).'); return; }
    const phone = momoPhone || currentMember.phone;
    setMomoState('pending');
    setMomoMsg('Sending the payment prompt to your phone…');
    try {
      const started = await database.startMobileMoney({
        provider: depositMethod === 'Airtel Money' ? 'AIRTEL' : 'MTN',
        phone, amount: amt, memberId: currentMember.memberId, purpose: depositPurpose,
        month: depositPurpose === 'savings' ? depositMonthTarget : undefined,
        otherLabel: depositPurpose === 'other' ? depositOtherPurpose : undefined,
      });
      setMomoMsg(started.message || 'Check your phone and enter your Mobile Money PIN to approve.');
      for (let i = 0; i < 30; i++) {
        await new Promise(res => setTimeout(res, 5000));
        const s = await database.checkMobileMoney(started.id);
        if (s.status === 'SUCCESSFUL') {
          setMomoState('success');
          setMomoMsg(`Payment received. Request ${s.requestId || ''} is with the Admin for approval — you will get an SMS.`);
          reloadData();
          return;
        }
        if (s.status === 'FAILED') { setMomoState('failed'); setMomoMsg(s.reason || 'The payment was declined or cancelled.'); return; }
      }
      setMomoState('failed');
      setMomoMsg('No confirmation yet. If money left your account, it will appear once the provider confirms it.');
    } catch (err: any) {
      setMomoState('failed');
      setMomoMsg(err.message || 'Mobile money is unavailable right now.');
    }
  };

  // Submit Deposit Request — recorded as PENDING; savings / shares change only after
  // the Accountant verifies and the Admin approves (same shared store as every portal)
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(depositAmount);
    if (!amt || amt <= 0) return;
    const res = SaccoFarmStore.submitPaymentRequest({
      memberId: currentMember.memberId,
      kind: 'DEPOSIT',
      purpose: depositPurpose,
      amount: amt,
      method: depositMethod,
      reference: depositRef || undefined,
      month: depositPurpose === 'savings' ? (depositMonthTarget as MonthKey) : undefined,
      otherLabel: depositPurpose === 'other' ? (depositOtherPurpose || 'Other Special Deposit') : undefined,
      notes: depositNotes || undefined,
    });
    if (!res.success) {
      notify(res.msg);
      return;
    }
    notify(res.msg);
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

  // Submit Withdrawal Request — goes to the Accountant / Admin queue; savings are deducted on approval
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid withdrawal amount.');
      return;
    }
    if (!kycExempt && SaccoFarmStore.getKycStatus(currentMember.memberId) !== 'VERIFIED') {
      alert('Please complete "Verify My Identity (KYC)" before requesting a withdrawal.');
      setShowWithdrawModal(false);
      setActiveTab('kyc');
      return;
    }
    const res = SaccoFarmStore.submitPaymentRequest({
      memberId: currentMember.memberId,
      kind: 'WITHDRAWAL',
      purpose: 'savings',
      amount: amt,
      method: withdrawDestination,
      destination: withdrawDestination,
      notes: `Reason: ${withdrawReason}`,
    });
    if (!res.success) {
      alert(res.msg);
      return;
    }
    setShowWithdrawModal(false);
    notify(res.msg);
    reloadData();
  };

  // Buy Shares Choice Handler
  const handleConvertShares = () => {
    setShowBuySharesChoiceModal(true);
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
            text: `Under SACCO bylaws, each ordinary share carries a nominal value of UGX 250,000. Deposits via MTN MoMo, Airtel Money, or Bank wire are credited upon verification. For assistance, contact the secretariat at +256 772 100 200.`,
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
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold whitespace-nowrap">{currentMember.memberId}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { openEditProfile(); setSidebarOpen(false); }}
              className="w-full py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 hover:bg-emerald-50 dark:hover:bg-slate-800/80 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Edit Profile</span>
            </button>
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
              onClick={() => { setActiveTab('kyc'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'kyc'
                  ? 'bg-emerald-600 text-white shadow-md font-bold'
                  : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-slate-900 font-bold hover:text-emerald-700 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Verify Identity (KYC)</span>
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${kycStatus === 'VERIFIED' || kycStatus === 'EXEMPT' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : kycStatus === 'PENDING' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-rose-500/20 text-rose-600 dark:text-rose-300'}`}>
                {kycStatus === 'EXEMPT' || kycStatus === 'VERIFIED' ? 'VERIFIED' : kycStatus === 'PENDING' ? 'REVIEW' : kycStatus === 'REJECTED' ? 'REDO' : 'TO DO'}
              </span>
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

            <button
              onClick={() => { openEditProfile(); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition text-slate-900 dark:text-slate-300 font-bold hover:text-emerald-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer"
            >
              <Edit3 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Edit Profile</span>
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
        {/* Mobile Top Header (hidden on desktop so page content starts directly at the top with zero upward clutter) */}
        <header className={`md:hidden sticky top-0 z-30 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} backdrop-blur border-b px-4 py-2.5 flex items-center justify-between`}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
            title="Toggle Light / Dark Mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-emerald-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
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
                isDark ? 'bg-slate-900 border-emerald-500/40 text-white' : 'bg-white border-emerald-500/40 text-slate-900'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    {memberPhoto ? (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-md border-2 border-emerald-500/50 shrink-0 bg-slate-900">
                        <img
                          src={memberPhoto}
                          alt={currentMember.name}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-600 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                        {currentMember.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">{currentMember.name}</h3>
                      <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 font-mono font-bold mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span className="break-all">{currentMember.phone || (session as any)?.phone || '+256 700 000 000'}</span>
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
                      className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs border border-emerald-500/30 dark:border-emerald-700/50 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>STATEMENT</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 Financial Balances - Minimal Rectangular Cards with Green Borders */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {/* 1. Saving Balance */}
                <button
                  type="button"
                  onClick={() => setActiveTab('statement')}
                  className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-600/40 rounded-2xl p-4 shadow-sm text-left hover:border-emerald-500 transition cursor-pointer active:scale-[0.99] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Savings Balance</span>
                    <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      UGX {currentMember.savings.toLocaleString()}
                    </div>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                      Withdrawable: <span className="text-rose-600 dark:text-rose-400 font-bold font-mono">UGX {currentMember.withdrawable.toLocaleString()}</span>
                    </p>
                  </div>
                </button>

                {/* 2. Shares */}
                <button
                  type="button"
                  onClick={() => setActiveTab('shares')}
                  className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-600/40 rounded-2xl p-4 shadow-sm text-left hover:border-emerald-500 transition cursor-pointer active:scale-[0.99] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Share Ownership</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {currentMember.shares} Shares
                    </div>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                      Valuation: <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">UGX {(currentMember.shares * 250000).toLocaleString()}</span>
                    </p>
                  </div>
                </button>

                {/* 3. Total Contributed */}
                <button
                  type="button"
                  onClick={() => setActiveTab('statement')}
                  className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-600/40 rounded-2xl p-4 shadow-sm text-left hover:border-emerald-500 transition cursor-pointer active:scale-[0.99] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Contributed</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                      UGX {currentMember.total.toLocaleString()}
                    </div>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                      Cumulative Deposits Recorded
                    </p>
                  </div>
                </button>
              </div>

              {/* Monthly Savings Section - Every Month Clickable */}
              <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-600/40 rounded-2xl p-5 shadow-sm space-y-4">
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
                        className="group bg-slate-50 dark:bg-slate-950 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 p-2.5 rounded-xl border-2 border-emerald-500/30 dark:border-emerald-700/40 hover:border-emerald-500 transition cursor-pointer text-center relative focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
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
                <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-600/40 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs text-slate-800 dark:text-slate-300 font-bold">Total Shares Owned</span>
                  <div className="text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
                    {currentMember.shares} <span className="text-sm font-normal text-slate-700 dark:text-slate-300 font-bold">Shares</span>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">Ordinary Shares</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-600/40 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs text-slate-800 dark:text-slate-300 font-bold">Nominal Valuation</span>
                  <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">
                    UGX {(currentMember.shares * 250000).toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mt-1">UGX 250,000 / Share Par Value</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-600/40 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs text-slate-800 dark:text-slate-300 font-bold">Certificate Number</span>
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">
                    CERT-DC-{currentMember.memberId.replace('DC-', '')}
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">Official Registry</p>
                </div>
              </div>

              {/* Share Purchase Requests Tracker */}
              {shareConversionRequests.filter(r => r.memberId === currentMember.memberId).length > 0 && (
                <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-600/40 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <Repeat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Share Purchase Requests
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Status of your requests to convert savings into shares
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                      {shareConversionRequests.filter(r => r.memberId === currentMember.memberId && r.status === 'PENDING').length} Pending
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                        <tr><th className="p-3 w-10">#</th>
                          <th className="p-3">Ref ID</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Shares</th>
                          <th className="p-3 text-right">Amount (UGX)</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                        {shareConversionRequests.filter(r => r.memberId === currentMember.memberId).map((req, __n) => (
                          <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30"><td className="p-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                            <td className="p-3 font-bold text-emerald-700 dark:text-emerald-400">{req.id}</td>
                            <td className="p-3 font-sans text-slate-600 dark:text-slate-400">{req.date}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white font-sans">{req.shareCount} Shares</td>
                            <td className="p-3 text-right font-extrabold text-slate-900 dark:text-white">{req.amount.toLocaleString()}</td>
                            <td className="p-3 text-center font-sans">
                              {req.status === 'APPROVED' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                                  <Check className="w-3 h-3" /> Approved
                                </span>
                              ) : req.status === 'REJECTED' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 text-[10px] font-bold">
                                  Rejected
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                                  Pending Approval
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Share Statement Down on Shares Page */}
              <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-600/40 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Share Purchases & Statement</h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total: {currentMember.shares} Shares (UGX {(currentMember.shares * 250000).toLocaleString()})</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr><th className="p-3 w-10">#</th>
                        <th className="p-3">Reference</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-right">Shares</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Total (UGX)</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                      <tr><td />
                        <td className="p-3 text-emerald-700 dark:text-emerald-400 font-bold">ALLOT-2024-001</td>
                        <td className="p-3 text-slate-900 dark:text-slate-200 font-sans font-bold">{currentMember.joinDate}</td>
                        <td className="p-3 text-slate-800 dark:text-slate-200 font-sans font-semibold">Initial Share Allotment</td>
                        <td className="p-3 text-right font-black text-slate-900 dark:text-white">
                          {Math.max(1, currentMember.shares - shareConversionRequests.filter(r => r.memberId === currentMember.memberId && r.status === 'APPROVED').reduce((s, r) => s + r.shareCount, 0))}
                        </td>
                        <td className="p-3 text-right text-slate-800 dark:text-slate-300 font-bold">UGX 250,000</td>
                        <td className="p-3 text-right font-black text-emerald-700 dark:text-emerald-400">
                          UGX {(Math.max(1, currentMember.shares - shareConversionRequests.filter(r => r.memberId === currentMember.memberId && r.status === 'APPROVED').reduce((s, r) => s + r.shareCount, 0)) * 250000).toLocaleString()}
                        </td>
                        <td className="p-3 text-center font-sans">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold">
                            Active
                          </span>
                        </td>
                      </tr>
                      {shareConversionRequests.filter(r => r.memberId === currentMember.memberId && r.status === 'APPROVED').map((req, __n) => (
                        <tr key={req.id}><td className="p-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                          <td className="p-3 text-emerald-700 dark:text-emerald-400 font-bold">{req.id}</td>
                          <td className="p-3 text-slate-900 dark:text-slate-200 font-sans font-bold">{req.date}</td>
                          <td className="p-3 text-slate-800 dark:text-slate-200 font-sans font-semibold">Savings Conversion ({req.shareCount} Shares)</td>
                          <td className="p-3 text-right font-black text-slate-900 dark:text-white">{req.shareCount}</td>
                          <td className="p-3 text-right text-slate-800 dark:text-slate-300 font-bold">UGX 250,000</td>
                          <td className="p-3 text-right font-black text-emerald-700 dark:text-emerald-400">
                            UGX {req.amount.toLocaleString()}
                          </td>
                          <td className="p-3 text-center font-sans">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold">
                              Approved
                            </span>
                          </td>
                        </tr>
                      ))}
                      {transactions.filter(tx => tx.category?.includes('Share Capital Purchase') && (tx.category?.includes(currentMember.name) || tx.description?.includes(currentMember.memberId))).map(tx => (
                        <tr key={tx.id}><td />
                          <td className="p-3 text-emerald-700 dark:text-emerald-400 font-bold">{tx.reference || tx.id}</td>
                          <td className="p-3 text-slate-900 dark:text-slate-200 font-sans font-bold">{tx.date}</td>
                          <td className="p-3 text-slate-800 dark:text-slate-200 font-sans font-semibold">Direct Deposit Purchase</td>
                          <td className="p-3 text-right font-black text-slate-900 dark:text-white">{Math.floor(tx.amount / 250000)}</td>
                          <td className="p-3 text-right text-slate-800 dark:text-slate-300 font-bold">UGX 250,000</td>
                          <td className="p-3 text-right font-black text-emerald-700 dark:text-emerald-400">
                            UGX {tx.amount.toLocaleString()}
                          </td>
                          <td className="p-3 text-center font-sans">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold">
                              Completed
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-600/40 rounded-2xl p-4">
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
              <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-600/40 rounded-2xl p-5 shadow-sm space-y-3">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Monthly Breakdown</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr><th className="p-2.5 w-10">#</th>
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
                      ].map((row, __n) => (
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
                        ><td className="p-2.5 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
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
              <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-600/40 rounded-2xl p-5 shadow-sm space-y-3">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Recent Transactions</h4>
                <div className="space-y-2">
                  {transactions
                    .filter(tx =>
                      tx.category?.includes(currentMember.name) ||
                      tx.description?.includes(currentMember.name) ||
                      tx.category?.includes(currentMember.memberId) ||
                      tx.description?.includes(currentMember.memberId)
                    )
                    .slice(0, 20)
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

              <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-600/40 rounded-3xl p-6 shadow-sm space-y-5">
                {/* Payment Channels Notice */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> Authorized Collection Channels:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-900 dark:text-slate-200 font-bold">
                    <li><strong className="text-emerald-800 dark:text-emerald-300">MTN Merchant MoMoPay:</strong> 784102 (Diaspora Connect SACCO Ltd)</li>
                    <li><strong className="text-emerald-800 dark:text-emerald-300">Airtel Money Pay:</strong> 6100234 (Diaspora Connect Farmers)</li>
                    <li><strong className="text-emerald-800 dark:text-emerald-300">Bank Wire / Transfer:</strong> Account #9030018492019</li>
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
                          if (Number(depositAmount) < 250000) setDepositAmount('250000');
                        }}
                        className={`p-3 rounded-xl border-2 text-left transition flex items-start gap-2.5 ${
                          depositPurpose === 'shares'
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${depositPurpose === 'shares' ? 'text-purple-600' : 'text-slate-500'}`} />
                        <div>
                          <p className="text-xs font-bold leading-tight">Buy Shares</p>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">UGX 250,000 per share</p>
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

                  {depositPurpose === 'shares' ? (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">Number of Shares to Buy *</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = Math.max(1, Math.floor(Number(depositAmount || 250000) / 250000));
                            if (cur > 1) setDepositAmount(String((cur - 1) * 250000));
                          }}
                          className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-extrabold text-lg flex items-center justify-center transition cursor-pointer"
                        >
                          -
                        </button>
                        <div className="flex-1 relative">
                          <input
                            type="number"
                            min={1}
                            value={Math.max(1, Math.floor(Number(depositAmount || 250000) / 250000))}
                            onChange={(e) => {
                              const count = Math.max(1, parseInt(e.target.value) || 1);
                              setDepositAmount(String(count * 250000));
                            }}
                            className="w-full text-center px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-extrabold text-lg focus:outline-none focus:border-emerald-500"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Shares</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const cur = Math.max(1, Math.floor(Number(depositAmount || 250000) / 250000));
                            setDepositAmount(String((cur + 1) * 250000));
                          }}
                          className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-extrabold text-lg flex items-center justify-center transition cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Total Cost (UGX 250,000 / share):</span>
                        <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                          UGX {(Math.max(1, Math.floor(Number(depositAmount || 250000) / 250000)) * 250000).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">Payment Channel *</label>
                    <select
                      value={depositMethod}
                      onChange={(e: any) => setDepositMethod(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="MTN Mobile Money">MTN Mobile Money (MoMoPay 784102)</option>
                      <option value="Airtel Money">Airtel Money Pay (Merchant 6100234)</option>
                      <option value="Bank Wire">Bank Wire</option>
                    </select>
                  </div>

                  {depositMethod !== 'Bank Wire' && (
                    <div className="p-3 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 space-y-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Pay now from your phone</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="tel"
                          value={momoPhone || currentMember.phone}
                          onChange={(e) => setMomoPhone(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono font-bold"
                          aria-label="Mobile money number"
                        />
                        <button type="button" onClick={handlePayNow} disabled={momoState === 'pending'} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-black text-xs">
                          {momoState === 'pending' ? 'WAITING FOR PIN…' : `PAY UGX ${(Number(depositAmount) || 0).toLocaleString()} WITH ${depositMethod === 'Airtel Money' ? 'AIRTEL' : 'MTN'}`}
                        </button>
                      </div>
                      {momoMsg && <p className={`text-[11px] font-bold ${momoState === 'failed' ? 'text-rose-600' : momoState === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{momoMsg}</p>}
                      <p className="text-[10px] text-slate-500">Already paid another way? Enter the reference below and submit instead.</p>
                    </div>
                  )}

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

              <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-600/40 rounded-3xl p-6 shadow-sm space-y-5">
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

          {/* VIEW: KYC SELF-VERIFICATION */}
          {activeTab === 'kyc' && (kycExempt ? (
            <div className="rounded-2xl p-5 border-2 border-emerald-500/40 bg-emerald-500/10">
              <p className="text-base font-extrabold text-slate-900 dark:text-white">✓ Verified</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Your identity is already verified.</p>
            </div>
          ) : (
            <MemberKycPanel member={currentMember} onNotify={notify} />
          ))}

          {/* My deposit / withdrawal requests and where they are in the approval chain */}
          {(activeTab === 'deposit' || activeTab === 'withdraw') && (
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">My Requests</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Your balance and shares update as soon as the Admin approves a request.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px]"><th className="p-2.5 w-10">#</th>
                      <th className="p-2.5">Ref</th><th className="p-2.5">Date</th><th className="p-2.5">Request</th><th className="p-2.5 text-right">Amount</th><th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paymentRequests.filter(r => r.memberId === currentMember.memberId).map((r, __n) => (
                      <tr key={r.id}><td className="p-2.5 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                        <td className="p-2.5 font-mono font-bold text-blue-700 dark:text-blue-400">{r.id}</td>
                        <td className="p-2.5 font-mono text-slate-500">{r.submittedAt}</td>
                        <td className="p-2.5 text-slate-800 dark:text-slate-200">{r.kind === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} — {r.purposeLabel}{r.shareCount ? ` (${r.shareCount} share${r.shareCount > 1 ? 's' : ''})` : ''}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">UGX {r.amount.toLocaleString()}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : r.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'}`}>
                            {r.status === 'PENDING_VERIFICATION' ? 'With Accountant' : r.status === 'VERIFIED_AWAITING_ADMIN' ? 'With Admin' : r.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                          </span>
                          {r.rejectionReason && <span className="block text-[10px] text-rose-500 mt-0.5">{r.rejectionReason}</span>}
                        </td>
                      </tr>
                    ))}
                    {paymentRequests.filter(r => r.memberId === currentMember.memberId).length === 0 && (
                      <tr><td colSpan={6} className="p-4 text-center text-slate-500">No requests yet.</td></tr>
                    )}
                  </tbody>
                </table>
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
            <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-600/40 rounded-3xl p-6 shadow-sm space-y-6 max-w-2xl">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Member Profile & Preferences</h3>
                <p className="text-xs text-slate-500 mt-1">Manage your personal details, contact information, and profile picture.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Photo Upload */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-slate-200 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                    {editPhotoUrl || memberPhoto ? (
                      <img src={editPhotoUrl || memberPhoto} alt="Profile" className="w-full h-full object-cover object-top" />
                    ) : (
                      <User className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">Profile Photo</label>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload New Photo</span>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                      {(editPhotoUrl || memberPhoto) && (
                        <button
                          type="button"
                          onClick={() => setEditPhotoUrl('')}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+256 7XX XXX XXX"
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Member ID (Read-only) */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">SACCO Member ID</label>
                  <input
                    type="text"
                    disabled
                    value={currentMember.memberId || currentMember.id}
                    className="w-full bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* MODAL: EDIT PROFILE */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Edit Member Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Photo Upload */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-slate-200 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                  {editPhotoUrl || memberPhoto ? (
                    <img src={editPhotoUrl || memberPhoto} alt="Profile" className="w-full h-full object-cover object-top" />
                  ) : (
                    <User className="w-7 h-7 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Profile Photo</p>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition">
                      <Upload className="w-3 h-3" />
                      <span>Change</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                    {(editPhotoUrl || memberPhoto) && (
                      <button
                        type="button"
                        onClick={() => setEditPhotoUrl('')}
                        className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+256 7XX XXX XXX"
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingProfile ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

              {depositPurpose === 'shares' ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">Number of Shares to Buy *</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = Math.max(1, Math.floor(Number(depositAmount || 250000) / 250000));
                        if (cur > 1) setDepositAmount(String((cur - 1) * 250000));
                      }}
                      className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-extrabold text-lg flex items-center justify-center transition cursor-pointer"
                    >
                      -
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        min={1}
                        value={Math.max(1, Math.floor(Number(depositAmount || 250000) / 250000))}
                        onChange={(e) => {
                          const count = Math.max(1, parseInt(e.target.value) || 1);
                          setDepositAmount(String(count * 250000));
                        }}
                        className="w-full text-center px-4 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-extrabold text-lg focus:outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Shares</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = Math.max(1, Math.floor(Number(depositAmount || 250000) / 250000));
                        setDepositAmount(String((cur + 1) * 250000));
                      }}
                      className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-extrabold text-lg flex items-center justify-center transition cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Total Cost (UGX 250,000 / share):</span>
                    <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                      UGX {(Math.max(1, Math.floor(Number(depositAmount || 250000) / 250000)) * 250000).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}

              <div>
                <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1">Payment Method</label>
                <select
                  value={depositMethod}
                  onChange={(e: any) => setDepositMethod(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="MTN Mobile Money">MTN MoMoPay (784102 - Diaspora Connect)</option>
                  <option value="Airtel Money">Airtel Money Merchant (6100234)</option>
                  <option value="Bank Wire">Bank Wire</option>
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
                      <tr><th className="p-2.5 w-10">#</th>
                        <th className="p-2.5">Date / Ref</th>
                        <th className="p-2.5">Particulars & Purpose</th>
                        <th className="p-2.5 text-right">Amount</th>
                        <th className="p-2.5 text-center">Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {monthTxList.length > 0 ? (
                        monthTxList.map((tx, __n) => (
                          <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30"><td className="p-2.5 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
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
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30"><td />
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

      {/* MODAL: BUY SHARES CHOICE */}
      {showBuySharesChoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 md:p-7 max-w-md w-full space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Buy Cooperative Shares</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Select your preferred funding option</p>
                </div>
              </div>
              <button
                onClick={() => setShowBuySharesChoiceModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Cooperative shares cost <strong className="text-emerald-600 dark:text-emerald-400">UGX 250,000 per share</strong>. Choose how you would like to purchase:
            </p>

            <div className="space-y-3">
              {/* Option 1: Convert Savings to Shares */}
              <button
                type="button"
                onClick={() => {
                  setShowBuySharesChoiceModal(false);
                  setConvertShareCount(1);
                  setShowConvertSavingsModal(true);
                }}
                className="w-full p-4 rounded-2xl border-2 border-emerald-500/40 hover:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-left transition hover:shadow-md group flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition">
                  <Repeat className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                      Convert Savings to Shares
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                      Savings Balance
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                    Use your existing savings balance. Requires approval before shares are credited.
                  </p>
                  <p className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-1.5">
                    Current Savings: UGX {currentMember.savings.toLocaleString()}
                  </p>
                </div>
              </button>

              {/* Option 2: Deposit New Money */}
              <button
                type="button"
                onClick={() => {
                  setShowBuySharesChoiceModal(false);
                  setDepositPurpose('shares');
                  if (Number(depositAmount) < 250000) setDepositAmount('250000');
                  setShowDepositModal(true);
                }}
                className="w-full p-4 rounded-2xl border-2 border-purple-500/40 hover:border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 text-left transition hover:shadow-md group flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                      Deposit New Money
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300">
                      Mobile / Bank
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                    Deposit new funds via Mobile Money or Bank Wire.
                  </p>
                  <p className="text-[11px] font-mono font-bold text-purple-700 dark:text-purple-400 mt-1.5">
                    Channels: MTN MoMo &bull; Airtel &bull; Bank Wire
                  </p>
                </div>
              </button>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowBuySharesChoiceModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONVERT SAVINGS TO SHARES */}
      {showConvertSavingsModal && (() => {
        const sharePrice = 250000;
        const maxShares = Math.floor(currentMember.savings / sharePrice);
        const cost = convertShareCount * sharePrice;
        const remainingSavings = currentMember.savings - cost;
        const isAffordable = currentMember.savings >= cost && convertShareCount >= 1;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 md:p-7 max-w-lg w-full space-y-5 shadow-2xl animate-scale-up">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Repeat className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Convert Savings to Shares</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Buy shares using your savings balance</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConvertSavingsModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Balances Header */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Current Savings</span>
                  <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    UGX {currentMember.savings.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-500">Voluntary Savings</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Current Shares</span>
                  <p className="text-base font-extrabold text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                    {currentMember.shares} Shares
                  </p>
                  <span className="text-[10px] text-slate-500">UGX {(currentMember.shares * sharePrice).toLocaleString()}</span>
                </div>
              </div>

              {/* Number of Shares to Convert */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Number of Shares to Purchase</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Max: {maxShares} {maxShares === 1 ? 'share' : 'shares'}
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setConvertShareCount(Math.max(1, convertShareCount - 1))}
                    disabled={convertShareCount <= 1}
                    className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-extrabold text-lg disabled:opacity-40 transition flex items-center justify-center"
                  >
                    -
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, maxShares)}
                      value={convertShareCount}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 1;
                        setConvertShareCount(Math.max(1, Math.min(val, Math.max(1, maxShares))));
                      }}
                      className="w-full text-center px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-extrabold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Shares</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConvertShareCount(Math.min(maxShares, convertShareCount + 1))}
                    disabled={convertShareCount >= maxShares}
                    className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-extrabold text-lg disabled:opacity-40 transition flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Conversion Calculation Summary */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Price per Share:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">UGX 250,000</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Total Cost:</span>
                  <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    UGX {cost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 pt-1 border-t border-emerald-500/20">
                  <span>Remaining Savings after Approval:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    UGX {Math.max(0, remainingSavings).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>New Total Shares:</span>
                  <span className="font-mono font-extrabold text-purple-600 dark:text-purple-400">
                    {currentMember.shares + convertShareCount} Shares (UGX {((currentMember.shares + convertShareCount) * sharePrice).toLocaleString()})
                  </span>
                </div>
              </div>

              {/* Approval Notice */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Once approved, your savings will automatically be reduced by UGX {cost.toLocaleString()} and {convertShareCount} {convertShareCount === 1 ? 'share' : 'shares'} will be added to your account.
                </p>
              </div>

              {maxShares < 1 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>You need at least UGX 250,000 in savings to purchase 1 share. Please deposit new money instead.</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConvertSavingsModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!isAffordable}
                  onClick={() => {
                    const res = SaccoFarmStore.addShareConversionRequest({
                      memberId: currentMember.memberId,
                      memberName: currentMember.name,
                      shareCount: convertShareCount
                    });
                    if (res.success) {
                      notify(`Share conversion request for ${convertShareCount} shares (UGX ${cost.toLocaleString()}) submitted for approval.`);
                      setShowConvertSavingsModal(false);
                      reloadData();
                    } else {
                      alert(res.msg);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Submit Request</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
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
