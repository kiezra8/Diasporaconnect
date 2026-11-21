import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getSession, clearSession } from '../../services/api';
import AccessDenied from '../../components/AccessDenied';
import PortalBottomNav from '../../components/PortalBottomNav';
import { applyTheme, getTheme } from '../../services/theme';
import {
  SaccoFarmStore,
  SaccoMember,
  SaccoLoan,
  PettyCashTransaction,
  MilkLogRecord,
  CattleAnimal,
  MoneyMakerInvestor,
  CowMilkRecord,
  FeedInventoryItem,
  LoanRepaymentEntry,
  CowHealthRecord,
  ShareConversionRequest,
  MemberPaymentRequest,
  classifyIncome,
  toLedgerLines,
  buildTrialBalance,
  KycSubmission,
  getMemberPhoto,
} from '../../services/saccoFarmStore';
import AccountingWorkspace from '../../components/accounting/AccountingWorkspace';
import PaymentRequestQueue from '../../components/approvals/PaymentRequestQueue';
import KycReviewPanel from '../../components/kyc/KycReviewPanel';
import SaccoAIAdvisor from '../../components/ai/SaccoAIAdvisor';
import PeriodCloseDividends from '../../components/accounting/PeriodCloseDividends';
import TaskAssignmentsPanel from '../../components/settings/TaskAssignmentsPanel';
import AuditTrailPanel from '../../components/settings/AuditTrailPanel';
import SmsCenterPanel from '../../components/settings/SmsCenterPanel';
import ApplicationKycSummary from '../../components/kyc/ApplicationKycSummary';
import ReportBarChart from '../../components/charts/ReportBarChart';
import { htmlBarChart, PRINT_CHART_CSS } from '../../components/charts/printBarChart';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Wallet,
  FileText,
  TrendingUp,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Globe,
  Settings,
  BookOpen,
  BarChart3,
  ArrowDownLeft,
  ArrowUpRight,
  UserPlus,
  Search,
  Edit2,
  Eye,
  Lock,
  Unlock,
  Milk,
  Plus,
  Download,
  Printer,
  ChevronRight,
  Activity,
  PieChart,
  Scale,
  Sun,
  Moon,
  ShieldAlert,
  KeyRound,
  PackageCheck,
  Warehouse,
  ShoppingCart,
  Truck,
  Layers,
  Sparkles,
  Trash2,
  Repeat,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type TabId =
  | 'dashboard'
  | 'members'
  | 'shares'
  | 'savings'
  | 'loans'
  | 'accounting'
  | 'farm'
  | 'reports'
  | 'approvals'
  | 'settings'
  | string;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => `UGX ${n.toLocaleString()}`;
const fmtK = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminPortal() {
  const navigate = useNavigate();
  const session = getSession();

  if (session && session.role === 'MEMBER') {
    return <AccessDenied message="You have no access to this field." backPath="/member" />;
  }

  // ── Theme State ────────────────────────────────────────────────────────────
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => getTheme());
  const isDark = themeMode === 'dark';
  const toggleTheme = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    applyTheme(next);
  };

  // ── Member detail modal state ──────────────────────────────────────────────
  const [memberPaymentAmount, setMemberPaymentAmount] = useState('');
  const [memberPaymentType, setMemberPaymentType] = useState<'savings' | 'shares' | 'loan_repayment'>('savings');
  const [memberPaymentRef, setMemberPaymentRef] = useState('');
  const [showMemberPaymentForm, setShowMemberPaymentForm] = useState(false);
  const [editingMemberField, setEditingMemberField] = useState<string | null>(null);

  // ── Role & Authorization State ─────────────────────────────────────────────
  const [activeRole, setActiveRole] = useState<string>(() => session?.role || 'ADMIN');
  // The audit trail and task permissions follow the role being used (including the role simulator)
  useEffect(() => {
    SaccoFarmStore.setActor({
      name: session?.fullName || 'Administrator',
      role: activeRole,
      email: activeRole === (session?.role || 'ADMIN') ? session?.email : undefined,
    });
  }, [activeRole]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalData, setAuthModalData] = useState<{
    title: string;
    message: string;
    requiredRole: string;
    actionToRetry?: () => void;
  }>({
    title: '',
    message: '',
    requiredRole: 'ADMIN'
  });
  const [authPinInput, setAuthPinInput] = useState('');
  const [authPinError, setAuthPinError] = useState('');

  // ── Live data ──────────────────────────────────────────────────────────────
  const [members, setMembers] = useState<SaccoMember[]>([]);
  const [loans, setLoans] = useState<SaccoLoan[]>([]);
  const [transactions, setTransactions] = useState<PettyCashTransaction[]>([]);
  const [milkLogs, setMilkLogs] = useState<MilkLogRecord[]>([]);
  const [cattle, setCattle] = useState<CattleAnimal[]>([]);
  const [investors, setInvestors] = useState<MoneyMakerInvestor[]>([]);
  // ── UI state ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<SaccoMember | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // Cattle and Cow Modal State
  const [cattleSearch, setCattleSearch] = useState('');
  const [selectedCow, setSelectedCow] = useState<CattleAnimal | null>(null);
  const [cowModalTab, setCowModalTab] = useState<'details' | 'edit' | 'milk' | 'health'>('details');
  const [editCowName, setEditCowName] = useState('');
  const [editCowBreed, setEditCowBreed] = useState<any>('Friesian Cross');
  const [editCowStage, setEditCowStage] = useState<any>('Milking');
  const [editCowGender, setEditCowGender] = useState<'Female' | 'Male'>('Female');
  const [editCowWeight, setEditCowWeight] = useState('');
  const [editCowDailyAvg, setEditCowDailyAvg] = useState('');
  const [editCowStatus, setEditCowStatus] = useState<any>('Healthy');
  const [editCowNotes, setEditCowNotes] = useState('');
  const [cowMilkRecords, setCowMilkRecords] = useState<CowMilkRecord[]>([]);
  const [modalQuickLitres, setModalQuickLitres] = useState('');
  const [modalQuickSession, setModalQuickSession] = useState<'Morning' | 'Afternoon' | 'Evening'>('Morning');
  const [modalQuickDate, setModalQuickDate] = useState(new Date().toISOString().split('T')[0]);

  // ── Approvals queue ────────────────────────────────────────────────────────
  const [shareConversionRequests, setShareConversionRequests] = useState<ShareConversionRequest[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<MemberPaymentRequest[]>([]);
  const [kycSubmissions, setKycSubmissions] = useState<KycSubmission[]>([]);

  const [memberApps, setMemberApps] = useState<any[]>([]);

  // ── New member form ────────────────────────────────────────────────────────
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberNin, setNewMemberNin] = useState('');
  const [newMemberCategory, setNewMemberCategory] = useState('Diaspora (United Kingdom)');

  // -- Global Navigation Search State -----------------------------------------
  const [globalNavSearch, setGlobalNavSearch] = useState('');
  const [showGlobalSearchDropdown, setShowGlobalSearchDropdown] = useState(false);

  // ── Farm Sub-Tabs & Sickness Management ───────────────────────────────────
  const [farmSubTab, setFarmSubTab] = useState<'dairy' | 'feeds' | 'cows' | 'health'>('dairy');

  // Dairy: per-cow milk record (feeds the daily milk log + milk income in the shared ledger)
  const [showAddMilkModal, setShowAddMilkModal] = useState(false);
  const [milkCowTag, setMilkCowTag] = useState('');
  const [milkDate, setMilkDate] = useState(new Date().toISOString().split('T')[0]);
  const [milkSession, setMilkSession] = useState<'Morning' | 'Afternoon' | 'Evening'>('Morning');
  const [milkLitres, setMilkLitres] = useState('');
  const [milkNotes, setMilkNotes] = useState('');

  const handleAddMilkRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const cow = cattle.find(c => c.tagNumber === milkCowTag);
    const litres = Number(milkLitres);
    if (!cow || !litres || litres <= 0) return;
    SaccoFarmStore.addCowMilkRecord({
      cowTag: cow.tagNumber,
      cowName: cow.name,
      date: milkDate,
      session: milkSession,
      litres,
      offtakerPrice: 1650,
      recorder: session?.fullName || 'Admin',
      notes: milkNotes.trim() || undefined,
    });
    notify(`Milk record saved: ${litres}L from ${cow.name} (${cow.tagNumber}), ${milkSession} ${milkDate}. Daily log and milk income updated.`);
    setMilkLitres(''); setMilkNotes('');
    setShowAddMilkModal(false);
    reloadData();
  };

  // Cows: register a new animal
  const [showAddCowModal, setShowAddCowModal] = useState(false);
  const [newCowTag, setNewCowTag] = useState('');
  const [newCowName, setNewCowName] = useState('');
  const [newCowBreed, setNewCowBreed] = useState<CattleAnimal['breed']>('Friesian Cross');
  const [newCowGender, setNewCowGender] = useState<'Female' | 'Male'>('Female');
  const [newCowStage, setNewCowStage] = useState<CattleAnimal['stage']>('Milking');
  const [newCowWeight, setNewCowWeight] = useState('450');
  const [newCowDob, setNewCowDob] = useState('');
  const [newCowHasCalf, setNewCowHasCalf] = useState(false);
  const [newCowCalfTag, setNewCowCalfTag] = useState('');
  const [cowCalfFilter, setCowCalfFilter] = useState<'all' | 'withCalf'>('all');

  const handleAddCow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCowName.trim()) return;
    const added = SaccoFarmStore.addCattle({
      tagNumber: newCowTag.trim(),
      name: newCowName.trim(),
      breed: newCowBreed,
      gender: newCowGender,
      ageCategory: newCowStage === 'Calf' ? 'Calf' : newCowStage === 'Heifer' ? 'Heifer' : newCowGender === 'Male' ? 'Bull' : 'Cow',
      stage: newCowStage,
      status: newCowStage === 'Pregnant' ? ['Healthy', 'Pregnant'] : ['Healthy'],
      dob: newCowDob || new Date().toISOString().split('T')[0],
      weight: Number(newCowWeight) || 0,
      hasCalf: newCowGender === 'Female' && newCowHasCalf,
      calfTag: newCowGender === 'Female' && newCowHasCalf ? newCowCalfTag.trim() || undefined : undefined,
      dailyAvgMilk: 0,
      sireDam: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: 0,
      color: '',
      notes: `Registered by ${session?.fullName || 'Admin'}.`,
    });
    notify(`${added.name} (${added.tagNumber}) added to the herd.`);
    setNewCowTag(''); setNewCowName(''); setNewCowDob(''); setNewCowHasCalf(false); setNewCowCalfTag('');
    setShowAddCowModal(false);
    reloadData();
  };
  const [showSicknessModal, setShowSicknessModal] = useState(false);
  const [sicknessCow, setSicknessCow] = useState<CattleAnimal | null>(null);
  const [sicknessIllness, setSicknessIllness] = useState('Mastitis');
  const [sicknessSymptoms, setSicknessSymptoms] = useState('');
  const [sicknessTreatment, setSicknessTreatment] = useState('Antibiotic intramammary infusion + isolation');
  const [sicknessMedication, setSicknessMedication] = useState('Penicillin / Mastijet Fort 20ml');
  const [sicknessVet, setSicknessVet] = useState('Dr. David Ssemwogerere');
  const [sicknessNotes, setSicknessNotes] = useState('');

  const handleOpenMarkSick = (cow: CattleAnimal) => {
    setSicknessCow(cow);
    setSicknessIllness('Mastitis');
    setSicknessSymptoms('Swollen quarter, elevated body temp');
    setSicknessTreatment('Antibiotic intramammary infusion and isolation in sick bay');
    setSicknessMedication('Mastijet Fort 20ml + Penicillin');
    setSicknessVet('Dr. David Ssemwogerere');
    setSicknessNotes('');
    setShowSicknessModal(true);
  };

  const handleConfirmMarkSick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sicknessCow) return;
    const updated = SaccoFarmStore.markCowSick(sicknessCow.id, {
      illness: sicknessIllness,
      symptoms: sicknessSymptoms,
      treatment: sicknessTreatment,
      medication: sicknessMedication,
      vetName: sicknessVet,
      notes: sicknessNotes
    });
    reloadData();
    setShowSicknessModal(false);
    if (selectedCow && (selectedCow.id === sicknessCow.id || selectedCow.tagNumber === sicknessCow.tagNumber) && updated) {
      setSelectedCow(updated);
    }
    notify(`${sicknessCow.name} (${sicknessCow.tagNumber}) marked as SICK. Sickness record filed.`);
  };

  const handleMarkHealthy = (cow: CattleAnimal) => {
    const notes = prompt(`Enter recovery notes for ${cow.name} (${cow.tagNumber}):`, 'Cleared by veterinary team. Full recovery.');
    if (notes === null) return;
    const updated = SaccoFarmStore.markCowHealthy(cow.id, notes);
    reloadData();
    if (selectedCow && (selectedCow.id === cow.id || selectedCow.tagNumber === cow.tagNumber) && updated) {
      setSelectedCow(updated);
    }
    notify(`${cow.name} (${cow.tagNumber}) marked as HEALTHY. Recovery date logged.`);
  };

  // ── Share Par Value ────────────────────────────────────────────────────────
  const [shareParValue, setShareParValue] = useState<number>(() => SaccoFarmStore.getShareParValue ? SaccoFarmStore.getShareParValue() : 250000);
  const [shareParInput, setShareParInput] = useState<string>('250000');
  const handleUpdateShareParValue = () => {
    const val = parseInt(shareParInput.replace(/,/g, ''), 10);
    if (!val || val < 10000) { alert('Share par value must be at least UGX 10,000'); return; }
    if (SaccoFarmStore.setShareParValue) SaccoFarmStore.setShareParValue(val);
    setShareParValue(val);
    notify(`Share par value updated to UGX ${val.toLocaleString()}`);
  };

  // ── Feeds Management ───────────────────────────────────────────────────────
  const [feedsList, setFeedsList] = useState<FeedInventoryItem[]>(() => SaccoFarmStore.getFeedInventory ? SaccoFarmStore.getFeedInventory() : []);
  const [feedSearch, setFeedSearch] = useState('');
  const [showAddFeedModal, setShowAddFeedModal] = useState(false);
  const [feedName, setFeedName] = useState('');
  const [feedQuantity, setFeedQuantity] = useState('');
  const [feedUnit, setFeedUnit] = useState('kg');
  const [feedSource, setFeedSource] = useState<'BOUGHT' | 'FARM_MADE'>('BOUGHT');
  const [feedCostPerUnit, setFeedCostPerUnit] = useState('');
  const [feedNotes, setFeedNotes] = useState('');
  const [showSectionPdfModal, setShowSectionPdfModal] = useState(false);
  const [pdfModalSection, setPdfModalSection] = useState<'milk' | 'members' | 'loans' | 'feeds' | 'cows' | 'health' | 'accounting'>('milk');
  const [pdfMilkPeriod, setPdfMilkPeriod] = useState<'today' | 'week' | 'month' | 'calendar' | 'all'>('month');

  const handleDeleteFeed = (id: string, name: string) => {
    if (!confirm(`Delete feed batch "${name}" from inventory?`)) return;
    if (SaccoFarmStore.deleteFeedItem) {
      SaccoFarmStore.deleteFeedItem(id);
      reloadFeeds();
      notify(`Deleted feed batch "${name}" from inventory.`);
    }
  };
  const [healthRecords, setHealthRecords] = useState<CowHealthRecord[]>(() => SaccoFarmStore.getAllHealthRecords ? SaccoFarmStore.getAllHealthRecords() : []);
  const [showUseFeedModal, setShowUseFeedModal] = useState(false);
  const [selectedFeedForUse, setSelectedFeedForUse] = useState<FeedInventoryItem | null>(null);
  const [feedUseQuantity, setFeedUseQuantity] = useState('');
  const [feedUseNotes, setFeedUseNotes] = useState('');

  const handleUseFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedForUse || !feedUseQuantity) return;
    const q = Number(feedUseQuantity);
    if (isNaN(q) || q <= 0) return;
    if (SaccoFarmStore.recordFeedUsage) {
      SaccoFarmStore.recordFeedUsage(selectedFeedForUse.id, q, feedUseNotes.trim() || undefined);
      reloadFeeds();
    }
    setShowUseFeedModal(false);
    setSelectedFeedForUse(null);
    setFeedUseQuantity('');
    setFeedUseNotes('');
    notify(`Deducted ${q} ${selectedFeedForUse.unit} of ${selectedFeedForUse.feedType} from stock.`);
  };
  const reloadFeeds = () => { if (SaccoFarmStore.getFeedInventory) setFeedsList(SaccoFarmStore.getFeedInventory()); };
  const handleAddFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedName.trim() || !feedQuantity) return;
    if (SaccoFarmStore.addFeedItem) {
      SaccoFarmStore.addFeedItem({
        feedType: feedName.trim(),
        currentStock: Number(feedQuantity),
        minStock: 0,
        unit: feedUnit,
        source: feedSource,
        unitCost: feedSource === 'BOUGHT' ? Number(feedCostPerUnit) || 0 : 0,
        totalCost: feedSource === 'BOUGHT' ? (Number(feedQuantity) * (Number(feedCostPerUnit) || 0)) : 0,
        supplier: feedSource === 'BOUGHT' ? 'External Supplier' : 'Farm Produced',
        notes: feedNotes.trim()
      });
      reloadFeeds();
    }
    setShowAddFeedModal(false);
    setFeedName(''); setFeedQuantity(''); setFeedCostPerUnit(''); setFeedNotes('');
    notify('Feed batch added to inventory.');
  };

  // ── Loan Repayment History Modal ───────────────────────────────────────────
  const [selectedLoanHistory, setSelectedLoanHistory] = useState<SaccoLoan | null>(null);
  const [loanRepayAmount, setLoanRepayAmount] = useState('');
  const [loanRepayRef, setLoanRepayRef] = useState('');
  const [loanRepayMethod, setLoanRepayMethod] = useState('Mobile Money');
  const handleRecordLoanRepayment = (loanId: string) => {
    const amt = Number(loanRepayAmount);
    if (!amt || amt < 1000) { alert('Enter a valid repayment amount'); return; }
    SaccoFarmStore.recordLoanRepayment(loanId, amt, loanRepayMethod, loanRepayRef || undefined);
    reloadData();
    setLoanRepayAmount(''); setLoanRepayRef('');
    const updated = SaccoFarmStore.getLoans().find(l => l.id === loanId) || null;
    setSelectedLoanHistory(updated);
    notify('Loan repayment recorded successfully.');
  };

  // ── Milk Revenue Analytics ─────────────────────────────────────────────────
  const [milkRevCalendarDate, setMilkRevCalendarDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const MILK_RATE = 1650;
  const todayStr = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const monthStr = new Date().toISOString().slice(0, 7);
  const todayMilkRev = milkLogs.filter(l => l.date === todayStr).reduce((s, l) => s + (l.revenue || l.netSold * MILK_RATE), 0);
  const weekMilkRev = milkLogs.filter(l => l.date >= weekAgo).reduce((s, l) => s + (l.revenue || l.netSold * MILK_RATE), 0);
  const monthMilkRev = milkLogs.filter(l => l.date && l.date.startsWith(monthStr)).reduce((s, l) => s + (l.revenue || l.netSold * MILK_RATE), 0);
  const calDateLogs = milkLogs.filter(l => l.date === milkRevCalendarDate);
  const calDateRev = calDateLogs.reduce((s, l) => s + (l.revenue || l.netSold * MILK_RATE), 0);
  const calDateLitres = calDateLogs.reduce((s, l) => s + (l.netSold || 0), 0);

  // ── System Users (for Settings role management) ────────────────────────────
  const [systemUsers] = useState([
    { id: '1', name: session?.fullName || 'Ezra Kisakye', email: 'israelezrakisakye@gmail.com', role: 'ADMIN', active: true },
    { id: '2', name: 'Mr. Nyanzi Edrine', email: 'board@diasporaconnectt.com', role: 'BOARD_MEMBER', active: true },
    { id: '3', name: 'Mr. Halera John Bahati', email: 'secretary@diasporaconnectt.com', role: 'SECRETARY', active: true },
    { id: '4', name: 'Mrs. Miriam Halera', email: 'accountant@diasporaconnectt.com', role: 'ACCOUNTANT', active: true },
    { id: '5', name: 'Demo Member', email: 'member@diasporaconnectt.com', role: 'MEMBER', active: true },
  ]);
  const [userRoles, setUserRoles] = useState<Record<string, string>>(() => {
    const roles: Record<string, string> = {};
    systemUsers.forEach(u => { roles[u.id] = u.role; });
    return roles;
  });
  const [userActive, setUserActive] = useState<Record<string, boolean>>(() => {
    const active: Record<string, boolean> = {};
    systemUsers.forEach(u => { active[u.id] = u.active; });
    return active;
  });

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 6000);
  };

  const reloadData = () => {
    setMembers(SaccoFarmStore.getMembers());
    setLoans(SaccoFarmStore.getLoans());
    setTransactions(SaccoFarmStore.getTransactions());
    setMilkLogs(SaccoFarmStore.getMilkLogs());
    setCattle(SaccoFarmStore.getCattle());
    setCowMilkRecords(SaccoFarmStore.getCowMilkRecords());
    setInvestors(SaccoFarmStore.getInvestors());
    setShareConversionRequests(SaccoFarmStore.getShareConversionRequests());
    setPaymentRequests(SaccoFarmStore.getPaymentRequests());
    setKycSubmissions(SaccoFarmStore.getKycSubmissions());
    if (SaccoFarmStore.getFeedInventory) setFeedsList(SaccoFarmStore.getFeedInventory());
    if (SaccoFarmStore.getAllHealthRecords) setHealthRecords(SaccoFarmStore.getAllHealthRecords());
    try {
      const stored = JSON.parse(localStorage.getItem('dc_member_registrations') || '[]');
      setMemberApps(stored);
    } catch {
      setMemberApps([]);
    }
  };

  useEffect(() => {
    if (session?.role === 'MEMBER') {
      navigate('/member');
      return;
    }
    reloadData();
    const handlePortalTabSwitch = (e: any) => {
      const tab = e.detail;
      if (tab === 'chat') setActiveTab('chat');
      else if (tab === 'dashboard') setActiveTab('overview');
      else if (tab === 'settings') setActiveTab('settings');
    };
    window.addEventListener('dc_storage_update', reloadData);
    window.addEventListener('dc_portal_tab_switch', handlePortalTabSwitch);
    return () => {
      window.removeEventListener('dc_storage_update', reloadData);
      window.removeEventListener('dc_portal_tab_switch', handlePortalTabSwitch);
    };
  }, [session, navigate]);

  // ── Computed stats ──────────────────────────────────────────────────────────
  const totalSavings = members.reduce((s, m) => s + m.savings, 0);
  const totalShares = members.reduce((s, m) => s + m.shares, 0);
  const totalSharesValue = members.reduce((s, m) => s + m.shares * 250000, 0);
  const activeMembers = members.filter(m => m.status === 'ACTIVE').length;
  const activeLoans = loans.filter(l => l.status === 'ACTIVE');
  const totalLoanBook = activeLoans.reduce((s, l) => s + l.outstandingBalance, 0);
  const totalMilkRevenue = milkLogs.reduce((s, l) => s + l.revenue, 0);
  const latestMilk = milkLogs[0];
  const totalIncome = transactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);

  // ── Role Authorization Gate Helper ──────────────────────────────────────────
  const checkPermission = (requiredRoles: string[], actionDesc: string, actionCallback: () => void) => {
    if (requiredRoles.includes(activeRole)) {
      actionCallback();
    } else {
      setAuthPinInput('');
      setAuthPinError('');
      setAuthModalData({
        title: 'Authorization Required',
        message: `Your current view role (${activeRole.replace('_', ' ')}) has view-only permissions for this section. ${actionDesc} requires authorization from ${requiredRoles.join(' or ')}.`,
        requiredRole: requiredRoles[0],
        actionToRetry: actionCallback
      });
      setShowAuthModal(true);
    }
  };

  const handleAdminOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (authPinInput === '8888' || authPinInput === '1234') {
      setShowAuthModal(false);
      notify('Administrative override accepted. Action executed successfully.');
      if (authModalData.actionToRetry) {
        authModalData.actionToRetry();
      }
    } else {
      setAuthPinError('Invalid Authorization PIN. Enter 8888 for administrative demo override.');
    }
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAdminApproveConversion = (requestId: string) => {
    checkPermission(['ADMIN'], 'Authorizing share conversion request', () => {
      const res = SaccoFarmStore.approveShareConversionRequest(requestId, 'ADMIN', 'Dr. David Kato (Admin)');
      if (res.success) {
        notify(res.msg);
        reloadData();
      } else {
        notify(res.msg);
      }
    });
  };

  const handleAdminRejectConversion = (requestId: string) => {
    checkPermission(['ADMIN'], 'Rejecting share conversion request', () => {
      if (confirm('Reject this share conversion request?')) {
        SaccoFarmStore.rejectShareConversionRequest(requestId, 'Rejected by Administrator');
        notify('Share conversion request rejected.');
        reloadData();
      }
    });
  };

  const handleAdminApproveMember = (id: string) => {
    checkPermission(['ADMIN'], 'Authorizing new member registration', () => {
      try {
        const stored: any[] = JSON.parse(localStorage.getItem('dc_member_registrations') || '[]');
        let appName = '';
        let isFinal = false;
        const updated = stored.map(app => {
          if (app.id === id) {
            appName = app.fullName;
            const newAdminApproved = true;
            const isFullyApproved = app.secretaryApproved && newAdminApproved;
            isFinal = isFullyApproved;
            const approvedMemberId = isFullyApproved ? SaccoFarmStore.activateApplication(app, 'Admin').memberId : app.memberId;
            return {
              ...app,
              adminApproved: newAdminApproved,
              status: isFullyApproved ? 'APPROVED' : 'PENDING_APPROVAL',
              memberId: isFullyApproved ? approvedMemberId : app.memberId
            };
          }
          return app;
        });
        localStorage.setItem('dc_member_registrations', JSON.stringify(updated));
        window.dispatchEvent(new Event('dc_storage_update'));
        setMemberApps(updated);
        notify(`Admin authorization granted for ${appName}. ${isFinal ? 'Member account is now ACTIVE and can sign in.' : 'Pending Secretary recommendation.'}`);
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleAdminRejectMember = (id: string) => {
    checkPermission(['ADMIN'], 'Rejecting new member registration', () => {
      if (!confirm('Reject this new member application?')) return;
      try {
        const stored: any[] = JSON.parse(localStorage.getItem('dc_member_registrations') || '[]');
        const updated = stored.map(app => {
          if (app.id === id) {
            return { ...app, status: 'REJECTED' };
          }
          return app;
        });
        localStorage.setItem('dc_member_registrations', JSON.stringify(updated));
        window.dispatchEvent(new Event('dc_storage_update'));
        setMemberApps(updated);
        notify('Member registration marked as rejected.');
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleSuspendMember = (member: SaccoMember) => {
    checkPermission(['ADMIN'], 'Suspending a member account', () => {
      if (confirm(`Suspend ${member.name}? They will lose portal access.`)) {
        SaccoFarmStore.updateMember(member.id, { status: 'SUSPENDED' });
        notify(`${member.name} has been suspended.`);
        reloadData();
      }
    });
  };

  const handleReactivateMember = (member: SaccoMember) => {
    checkPermission(['ADMIN'], 'Reactivating a member account', () => {
      SaccoFarmStore.updateMember(member.id, { status: 'ACTIVE' });
      notify(`${member.name} has been reactivated.`);
      reloadData();
    });
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    checkPermission(['ADMIN', 'SECRETARY'], 'Registering a new cooperative member', () => {
      if (!newMemberName || !newMemberPhone) return;
      SaccoFarmStore.addMember({
        memberId: '',
        name: newMemberName, phone: newMemberPhone,
        email: newMemberEmail, nin: newMemberNin,
        category: newMemberCategory,
        joinDate: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
        jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
        jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
        adminFee: 50000, shares: 0,
      });
      notify(`New member ${newMemberName} registered successfully!`);
      setNewMemberName(''); setNewMemberPhone(''); setNewMemberEmail(''); setNewMemberNin('');
      reloadData();
    });
  };


  // ── Universal Minimalist PDF Report Generator ─────────────────────────────
  const handleDownloadSectionPdf = (
    section: 'milk' | 'members' | 'loans' | 'feeds' | 'cows' | 'health' | 'accounting',
    periodOption: 'today' | 'week' | 'month' | 'calendar' | 'all' = 'month',
    calendarPick?: string
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const generatedDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

    let docTitle = 'Diaspora Connect Operational Audit Report';
    let subtitle = 'Official Verification Ledger';
    let periodTitle = 'Current Period';
    let kpiHtml = '';
    let tableHtml = '';
    let chartHtml = '';

    if (section === 'milk') {
      docTitle = 'Milk Production & Revenue Audit Statement';
      subtitle = 'Luwero Central Dairy Unit — Offtaker: Brookside Dairy (UGX 1,650/L)';

      let targetLogs = [...milkLogs];
      if (periodOption === 'today') {
        periodTitle = `Daily Statement: ${todayStr}`;
        targetLogs = milkLogs.filter(l => l.date === todayStr);
      } else if (periodOption === 'week') {
        const d7 = new Date(); d7.setDate(d7.getDate() - 7);
        const d7Str = d7.toISOString().split('T')[0];
        periodTitle = `Weekly Audit: ${d7Str} to ${todayStr}`;
        targetLogs = milkLogs.filter(l => l.date >= d7Str && l.date <= todayStr);
      } else if (periodOption === 'month') {
        const d30 = new Date(); d30.setDate(d30.getDate() - 30);
        const d30Str = d30.toISOString().split('T')[0];
        periodTitle = `Monthly Audit: Past 30 Days (${d30Str} to ${todayStr})`;
        targetLogs = milkLogs.filter(l => l.date >= d30Str && l.date <= todayStr);
      } else if (periodOption === 'calendar') {
        const selDate = calendarPick || milkRevCalendarDate || todayStr;
        periodTitle = `Daily Ledger for ${selDate}`;
        targetLogs = milkLogs.filter(l => l.date === selDate);
      } else {
        periodTitle = 'Comprehensive All-Time Milk Production Ledger';
      }

      const totalL = targetLogs.reduce((s, l) => s + l.netSold, 0);
      const totalRev = targetLogs.reduce((s, l) => s + l.revenue, 0);
      const avgPrice = targetLogs.length > 0 ? (totalRev / (totalL || 1)).toFixed(0) : '1,650';

      kpiHtml = `
        <div class="kpi-card"><span class="kpi-label">TOTAL VOLUME SOLD</span><div class="kpi-val">${totalL.toFixed(1)} L</div></div>
        <div class="kpi-card"><span class="kpi-label">GROSS MILK REVENUE</span><div class="kpi-val text-em">UGX ${totalRev.toLocaleString()}</div></div>
        <div class="kpi-card"><span class="kpi-label">EFFECTIVE RATE</span><div class="kpi-val">UGX ${Number(avgPrice).toLocaleString()} / L</div></div>
        <div class="kpi-card"><span class="kpi-label">PRODUCTION SESSIONS</span><div class="kpi-val">${targetLogs.length} Records</div></div>
      `;

      chartHtml = htmlBarChart('Litres sold per day', [...targetLogs].sort((a, b) => a.date.localeCompare(b.date)).map(l => ({ label: l.date, value: l.netSold })), n => `${n.toFixed(1)} L`, '#1baf7a') + htmlBarChart('Milk revenue per day', [...targetLogs].sort((a, b) => a.date.localeCompare(b.date)).map(l => ({ label: l.date, value: l.revenue })), (n: number) => `UGX ${Math.round(n).toLocaleString()}`);

      tableHtml = `
        <table>
          <thead>
            <tr><th>#</th>
              <th>Date</th>
              <th>Morning (L)</th>
              <th>Afternoon (L)</th>
              <th>Evening (L)</th>
              <th style="text-align: right;">Net Sold (L)</th>
              <th style="text-align: right;">Rate / L</th>
              <th style="text-align: right;">Gross Revenue (UGX)</th>
              <th>Duty Officer</th>
            </tr>
          </thead>
          <tbody>${targetLogs.map((l, __n) => `
              <tr><td>${__n + 1}</td>
                <td>${l.date}</td>
                <td>${l.morning}</td>
                <td>${l.afternoon}</td>
                <td>${l.evening}</td>
                <td style="text-align: right; font-weight: bold;">${l.netSold.toFixed(1)}</td>
                <td style="text-align: right;">${l.offtakerPrice.toLocaleString()}</td>
                <td style="text-align: right; font-weight: bold; color: #047857;">UGX ${l.revenue.toLocaleString()}</td>
                <td>${l.recorder}</td>
              </tr>
            `).join('')}
            ${targetLogs.length === 0 ? '<tr><td></td><td colspan="8" style="text-align: center; padding: 20px; color: #64748b;">No milk production records found for this period.</td></tr>' : ''}
          </tbody>
          ${targetLogs.length > 0 ? `
            <tfoot>
              <tr><td></td>
                <td colspan="4" style="font-weight: bold;">PERIOD TOTALS</td>
                <td style="text-align: right; font-weight: bold;">${totalL.toFixed(1)} L</td>
                <td></td>
                <td style="text-align: right; font-weight: bold; color: #047857;">UGX ${totalRev.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          ` : ''}
        </table>
      `;
    } else if (section === 'members') {
      docTitle = 'SACCO Membership & Share Capital Ledger';
      subtitle = 'Diaspora Connect Farmers SACCO Official Registry';
      periodTitle = `Active Member Register as of ${generatedDate}`;

      const totalSav = members.reduce((s, m) => s + m.savings, 0);
      const totalShr = members.reduce((s, m) => s + m.shares, 0);
      const totalShrVal = totalShr * 250000;

      kpiHtml = `
        <div class="kpi-card"><span class="kpi-label">TOTAL MEMBERS</span><div class="kpi-val">${members.length} Registered</div></div>
        <div class="kpi-card"><span class="kpi-label">MEMBER SAVINGS</span><div class="kpi-val text-em">UGX ${totalSav.toLocaleString()}</div></div>
        <div class="kpi-card"><span class="kpi-label">PAID-UP SHARES</span><div class="kpi-val">${totalShr.toLocaleString()} Units</div></div>
        <div class="kpi-card"><span class="kpi-label">SHARE CAPITAL VALUE</span><div class="kpi-val text-em">UGX ${totalShrVal.toLocaleString()}</div></div>
      `;

      chartHtml = htmlBarChart('Savings by member', members.map(m => ({ label: m.name, value: m.savings })), (n: number) => `UGX ${Math.round(n).toLocaleString()}`) + htmlBarChart('Shares by member', members.map(m => ({ label: m.name, value: m.shares })), n => `${n} shares`, '#6250d6');

      tableHtml = `
        <table>
          <thead>
            <tr><th>#</th>
              <th>Member ID</th>
              <th>Full Legal Name</th>
              <th>Phone &amp; NIN</th>
              <th>Status</th>
              <th style="text-align: right;">Shares</th>
              <th style="text-align: right;">Share Value (UGX)</th>
              <th style="text-align: right;">Savings Balance (UGX)</th>
            </tr>
          </thead>
          <tbody>${members.map((m, __n) => `
              <tr><td>${__n + 1}</td>
                <td style="font-weight: bold;">${m.memberId}</td>
                <td>${m.name}</td>
                <td>${m.phone} &middot; ${m.nin}</td>
                <td><span style="font-weight: bold; color: ${m.status === 'ACTIVE' ? '#047857' : '#e11d48'};">${m.status}</span></td>
                <td style="text-align: right;">${m.shares}</td>
                <td style="text-align: right;">UGX ${(m.shares * 250000).toLocaleString()}</td>
                <td style="text-align: right; font-weight: bold; color: #047857;">UGX ${m.savings.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (section === 'feeds') {
      docTitle = 'Dairy Feeds & Nutrition Stock Valuation';
      subtitle = 'Luwero Dairy Unit — Feed Silage, Pasture & Purchased Nutrition';
      periodTitle = `Feed Stock Assessment as of ${generatedDate}`;

      const feedList = SaccoFarmStore.getFeedInventory();
      const totalCost = feedList.reduce((s, f) => s + (f.totalCost || 0), 0);
      const farmMadeCount = feedList.filter(f => f.source === 'FARM_MADE').length;
      const boughtCount = feedList.filter(f => f.source === 'BOUGHT').length;

      kpiHtml = `
        <div class="kpi-card"><span class="kpi-label">FEED TYPES</span><div class="kpi-val">${feedList.length} Items</div></div>
        <div class="kpi-card"><span class="kpi-label">FARM-MADE (UGX 0)</span><div class="kpi-val text-em">${farmMadeCount} Batches</div></div>
        <div class="kpi-card"><span class="kpi-label">PURCHASED FEEDS</span><div class="kpi-val">${boughtCount} Batches</div></div>
        <div class="kpi-card"><span class="kpi-label">INVENTORY VALUATION</span><div class="kpi-val text-em">UGX ${totalCost.toLocaleString()}</div></div>
      `;

      chartHtml = htmlBarChart('Feed stock on hand', feedList.map(f => ({ label: `${f.feedType} (${f.unit})`, value: f.currentStock })), n => n.toLocaleString(), '#eda100');

      tableHtml = `
        <table>
          <thead>
            <tr><th>#</th>
              <th>Feed Classification</th>
              <th>Source</th>
              <th>Quantity in Stock</th>
              <th style="text-align: right;">Unit Cost (UGX)</th>
              <th style="text-align: right;">Total Valuation (UGX)</th>
              <th>Supplier / Bunker</th>
              <th>Last Calibration</th>
            </tr>
          </thead>
          <tbody>${feedList.map((f, __n) => `
              <tr><td>${__n + 1}</td>
                <td style="font-weight: bold;">${f.feedType}</td>
                <td>${f.source === 'FARM_MADE' ? 'Made at Farm (UGX 0)' : 'Purchased'}</td>
                <td style="font-weight: bold;">${f.currentStock} ${f.unit}</td>
                <td style="text-align: right;">${f.source === 'FARM_MADE' ? 'UGX 0' : `UGX ${(f.unitCost || 0).toLocaleString()}`}</td>
                <td style="text-align: right; font-weight: bold; color: #047857;">${f.source === 'FARM_MADE' ? 'UGX 0' : `UGX ${(f.totalCost || 0).toLocaleString()}`}</td>
                <td>${f.supplier || '—'}</td>
                <td>${f.lastUpdated}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (section === 'cows') {
      docTitle = 'Cattle Herd Register & Pedigree Dossier';
      subtitle = 'Luwero Commercial Dairy Herd Inventory';
      periodTitle = `Census as of ${generatedDate}`;

      const milkingCount = cattle.filter(c => c.stage === 'Milking').length;
      const pregnantCount = cattle.filter(c => c.stage === 'Pregnant').length;
      const sickCount = cattle.filter(c => c.status && c.status.some(s => s.toLowerCase().includes('sick'))).length;

      kpiHtml = `
        <div class="kpi-card"><span class="kpi-label">TOTAL HERD</span><div class="kpi-val">${cattle.length} Head</div></div>
        <div class="kpi-card"><span class="kpi-label">MILKING COWS</span><div class="kpi-val text-em">${milkingCount} Head</div></div>
        <div class="kpi-card"><span class="kpi-label">PREGNANT (IN-CALF)</span><div class="kpi-val">${pregnantCount} Head</div></div>
        <div class="kpi-card"><span class="kpi-label">UNDER TREATMENT</span><div class="kpi-val" style="color: ${sickCount > 0 ? '#e11d48' : '#047857'}">${sickCount} Head</div></div>
      `;

      chartHtml = htmlBarChart('Herd by stage', ['Milking', 'Pregnant', 'Dry', 'Heifer', 'Calf', 'Bull'].map(st => ({ label: st, value: cattle.filter(c => c.stage === st).length })), n => `${n} head`) + htmlBarChart('Daily average milk by cow', cattle.filter(c => (c.dailyAvgMilk || 0) > 0).map(c => ({ label: `${c.name} (${c.tagNumber})`, value: c.dailyAvgMilk || 0 })), n => `${n} L`, '#1baf7a');

      tableHtml = `
        <table>
          <thead>
            <tr><th>#</th>
              <th>Tag Number</th>
              <th>Name</th>
              <th>Breed</th>
              <th>Stage</th>
              <th>Weight (kg)</th>
              <th style="text-align: right;">Daily Avg (L)</th>
              <th>Health Status</th>
              <th>Lineage / Sire</th>
            </tr>
          </thead>
          <tbody>${cattle.map((c, __n) => `
              <tr><td>${__n + 1}</td>
                <td style="font-weight: bold;">${c.tagNumber}</td>
                <td>${c.name}</td>
                <td>${c.breed}</td>
                <td>${c.stage}</td>
                <td>${c.weight} kg</td>
                <td style="text-align: right; font-weight: bold;">${c.dailyAvgMilk || '0.0'} L</td>
                <td><span style="font-weight: bold; color: ${c.status && c.status.some(s => s.toLowerCase().includes('sick')) ? '#e11d48' : '#047857'}">${c.status[0]}</span></td>
                <td>${c.sireDam || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (section === 'health') {
      docTitle = 'Herd Veterinary Health & Clinical Incident Register';
      subtitle = 'Luwero Dairy Unit — Disease Surveillance & Treatment Log';
      periodTitle = `Clinical Dossier as of ${generatedDate}`;

      const healthList = SaccoFarmStore.getAllHealthRecords ? SaccoFarmStore.getAllHealthRecords() : [];
      const recoveredCount = healthList.filter(r => r.status === 'RECOVERED').length;
      const activeSick = healthList.filter(r => r.status !== 'RECOVERED').length;

      kpiHtml = `
        <div class="kpi-card"><span class="kpi-label">TOTAL CLINICAL LOGS</span><div class="kpi-val">${healthList.length} Events</div></div>
        <div class="kpi-card"><span class="kpi-label">ACTIVE TREATMENT</span><div class="kpi-val" style="color: ${activeSick > 0 ? '#e11d48' : '#047857'}">${activeSick} Active</div></div>
        <div class="kpi-card"><span class="kpi-label">SUCCESSFULLY RESOLVED</span><div class="kpi-val text-em">${recoveredCount} Recovered</div></div>
        <div class="kpi-card"><span class="kpi-label">HERD HEALTH RATE</span><div class="kpi-val text-em">${cattle.length > 0 ? (((cattle.length - activeSick) / cattle.length) * 100).toFixed(1) : 100}%</div></div>
      `;

      chartHtml = htmlBarChart('Health incidents by illness', Array.from(healthList.reduce((m, h) => m.set(h.illness, (m.get(h.illness) || 0) + 1), new Map<string, number>())).map(([label, value]) => ({ label, value })), n => `${n} case(s)`, '#e34948');

      tableHtml = `
        <table>
          <thead>
            <tr><th>#</th>
              <th>Date</th>
              <th>Cow Tag &amp; Name</th>
              <th>Diagnosis / Illness</th>
              <th>Observed Symptoms</th>
              <th>Treatment &amp; Medication</th>
              <th>Attending Vet</th>
              <th>Status</th>
              <th>Recovery Date</th>
            </tr>
          </thead>
          <tbody>${healthList.map((h, __n) => `
              <tr><td>${__n + 1}</td>
                <td>${h.date}</td>
                <td style="font-weight: bold;">${h.cowTag} (${h.cowName})</td>
                <td style="font-weight: bold;">${h.illness}</td>
                <td>${h.symptoms || '—'}</td>
                <td>${h.treatment} ${h.medication ? `[Rx: ${h.medication}]` : ''}</td>
                <td>${h.vetName}</td>
                <td><span style="font-weight: bold; color: ${h.status === 'RECOVERED' ? '#047857' : '#e11d48'};">${h.status}</span></td>
                <td>${h.recoveredDate || 'Ongoing'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (section === 'loans') {
      docTitle = 'SACCO Credit Portfolio & Loan Recovery Ledger';
      subtitle = 'Member Agricultural Financing & Repayment Register';
      periodTitle = `Loan Book as of ${generatedDate}`;

      const totalPrincipal = loans.reduce((s, l) => s + l.principal, 0);
      const totalBalance = loans.reduce((s, l) => s + l.outstandingBalance, 0);
      const activeCount = loans.filter(l => l.status === 'ACTIVE').length;

      kpiHtml = `
        <div class="kpi-card"><span class="kpi-label">TOTAL LOANS ISSUED</span><div class="kpi-val">${loans.length} Facilities</div></div>
        <div class="kpi-card"><span class="kpi-label">TOTAL DISBURSED</span><div class="kpi-val">UGX ${totalPrincipal.toLocaleString()}</div></div>
        <div class="kpi-card"><span class="kpi-label">OUTSTANDING BOOK</span><div class="kpi-val text-em">UGX ${totalBalance.toLocaleString()}</div></div>
        <div class="kpi-card"><span class="kpi-label">ACTIVE LOANS</span><div class="kpi-val">${activeCount} Active</div></div>
      `;

      chartHtml = htmlBarChart('Outstanding balance by borrower', loans.map(l => ({ label: `${l.memberName} (${l.loanNumber || l.id})`, value: l.outstandingBalance })), (n: number) => `UGX ${Math.round(n).toLocaleString()}`);

      tableHtml = `
        <table>
          <thead>
            <tr><th>#</th>
              <th>Loan ID</th>
              <th>Borrower</th>
              <th>Purpose</th>
              <th style="text-align: right;">Principal (UGX)</th>
              <th style="text-align: right;">Interest Rate</th>
              <th style="text-align: right;">Outstanding (UGX)</th>
              <th>Status</th>
              <th>Maturity</th>
            </tr>
          </thead>
          <tbody>${loans.map((l, __n) => `
              <tr><td>${__n + 1}</td>
                <td style="font-weight: bold;">${l.loanNumber || l.id}</td>
                <td style="font-weight: bold;">${l.memberName}</td>
                <td>${l.purpose}</td>
                <td style="text-align: right;">${l.principal.toLocaleString()}</td>
                <td style="text-align: right;">${l.interestRate}% p.a.</td>
                <td style="text-align: right; font-weight: bold; color: #047857;">UGX ${l.outstandingBalance.toLocaleString()}</td>
                <td><span style="font-weight: bold; color: ${l.status === 'ACTIVE' ? '#047857' : '#64748b'};">${l.status}</span></td>
                <td>${l.nextDueDate || l.applicationDate}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (section === 'accounting') {
      docTitle = 'General Ledger Double-Entry Audit Statement';
      subtitle = 'Diaspora Connect Farmers SACCO Core Financials';
      periodTitle = `Certified as of ${generatedDate}`;

      const allTx = SaccoFarmStore.getTransactions();
      const totalIncome = allTx.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
      const totalExp = allTx.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
      const netCash = totalIncome - totalExp;

      kpiHtml = `
        <div class="kpi-card"><span class="kpi-label">TOTAL OPERATING INCOME</span><div class="kpi-val text-em">UGX ${totalIncome.toLocaleString()}</div></div>
        <div class="kpi-card"><span class="kpi-label">TOTAL EXPENDITURE</span><div class="kpi-val" style="color: #e11d48;">UGX ${totalExp.toLocaleString()}</div></div>
        <div class="kpi-card"><span class="kpi-label">NET OPERATING SURPLUS</span><div class="kpi-val text-em">UGX ${netCash.toLocaleString()}</div></div>
        <div class="kpi-card"><span class="kpi-label">TOTAL JOURNAL ENTRIES</span><div class="kpi-val">${allTx.length} Postings</div></div>
      `;

      chartHtml = htmlBarChart('Income vs expenses by category', [...Array.from(allTx.filter(t => t.type === 'Income').reduce((m, t) => m.set(classifyIncome(t), (m.get(classifyIncome(t)) || 0) + t.amount), new Map<string, number>())).map(([label, value]) => ({ label: `Income — ${label}`, value })), ...Array.from(allTx.filter(t => t.type === 'Expense').reduce((m, t) => m.set(t.category, (m.get(t.category) || 0) + t.amount), new Map<string, number>())).map(([label, value]) => ({ label: `Expense — ${label}`, value }))], (n: number) => `UGX ${Math.round(n).toLocaleString()}`);

      const ledger = toLedgerLines(allTx);
      const tb = buildTrialBalance(allTx);
      tableHtml = `
        <h3 style="font-size: 10pt; margin: 0 0 8px 0;">Trial Balance — ${tb.balanced ? 'Balanced (Dr = Cr)' : 'OUT OF BALANCE'}</h3>
        <table>
          <thead>
            <tr><th>#</th>
              <th>Account</th>
              <th style="text-align: right;">Debit (UGX)</th>
              <th style="text-align: right;">Credit (UGX)</th>
              <th style="text-align: right;">Balance</th>
            </tr>
          </thead>
          <tbody>${tb.rows.map((r, __n) => `
              <tr><td>${__n + 1}</td>
                <td style="font-weight: bold;">${r.account}</td>
                <td style="text-align: right;">${r.debit ? r.debit.toLocaleString() : '—'}</td>
                <td style="text-align: right;">${r.credit ? r.credit.toLocaleString() : '—'}</td>
                <td style="text-align: right; font-weight: bold;">${r.balance.toLocaleString()} ${r.side}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr><td></td>
              <td>TOTALS</td>
              <td style="text-align: right;">${tb.totalDebit.toLocaleString()}</td>
              <td style="text-align: right;">${tb.totalCredit.toLocaleString()}</td>
              <td style="text-align: right; color: ${tb.balanced ? '#047857' : '#e11d48'};">${tb.balanced ? 'Dr = Cr' : 'Difference ' + (tb.totalDebit - tb.totalCredit).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
        <h3 style="font-size: 10pt; margin: 0 0 8px 0;">General Ledger — Double Entry</h3>
        <table>
          <thead>
            <tr><th>#</th>
              <th>Date</th>
              <th>Ref Number</th>
              <th>Account</th>
              <th>Narration</th>
              <th style="text-align: right;">Debit (UGX)</th>
              <th style="text-align: right;">Credit (UGX)</th>
            </tr>
          </thead>
          <tbody>${ledger.map((l, __n) => `
              <tr><td>${__n + 1}</td>
                <td>${l.date}</td>
                <td style="font-weight: bold;">${l.reference}</td>
                <td style="${l.credit ? 'padding-left: 24px;' : 'font-weight: bold;'}">${l.account}</td>
                <td>${l.narration}</td>
                <td style="text-align: right;">${l.debit ? l.debit.toLocaleString() : ''}</td>
                <td style="text-align: right;">${l.credit ? l.credit.toLocaleString() : ''}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr><td></td>
              <td colspan="4">TOTALS</td>
              <td style="text-align: right;">${ledger.reduce((s, l) => s + l.debit, 0).toLocaleString()}</td>
              <td style="text-align: right;">${ledger.reduce((s, l) => s + l.credit, 0).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    const printDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${docTitle} — Diaspora Connect</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 24px;
            font-size: 10pt;
            line-height: 1.4;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 16px;
            border-bottom: 2px solid #0f172a;
            margin-bottom: 20px;
          }
          .title { font-size: 15pt; font-weight: 800; margin: 0 0 4px 0; letter-spacing: -0.3px; color: #0f172a; }
          .subtitle { font-size: 9pt; color: #475569; margin: 0; }
          .badge {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 8pt;
            font-weight: 700;
            text-transform: uppercase;
            text-align: right;
            color: #0f172a;
          }
          .kpi-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .kpi-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 12px;
            background: #f8fafc;
          }
          .kpi-label {
            font-size: 7pt;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 4px;
          }
          .kpi-val {
            font-size: 13pt;
            font-weight: 800;
            font-family: monospace;
            color: #0f172a;
          }
          .text-em { color: #047857; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
            margin-bottom: 30px;
          }
          th {
            background: #f1f5f9;
            color: #1e293b;
            text-align: left;
            padding: 8px 10px;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 7.5pt;
            letter-spacing: 0.3px;
            border-bottom: 1px solid #cbd5e1;
          }
          td {
            padding: 7px 10px;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
          }
          tr:nth-child(even) td { background: #fafafa; }
          tfoot td {
            font-weight: 800;
            background: #f8fafc;
            border-top: 2px solid #cbd5e1;
            padding: 9px 10px;
          }
          .signatures {
            margin-top: 40px;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 40px;
            padding-top: 20px;
            border-top: 1px dashed #cbd5e1;
            font-size: 8pt;
          }
          .sig-box { text-align: left; }
          .sig-line {
            border-bottom: 1px solid #0f172a;
            margin-top: 36px;
            margin-bottom: 6px;
            width: 80%;
          }
          ${PRINT_CHART_CSS}
          @media print {
            body { padding: 0; }
            .kpi-card { break-inside: avoid; }
            tr { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">Diaspora Connect Farmers SACCO</h1>
            <p class="subtitle">${subtitle}</p>
            <p style="margin: 4px 0 0 0; font-size: 8pt; color: #64748b;">
              Official System Audit Statement &middot; Generated: ${generatedDate}
            </p>
          </div>
          <div class="badge">
            ${periodTitle}
          </div>
        </div>

        <div class="kpi-row">
          ${kpiHtml}
        </div>

        ${chartHtml}

        ${tableHtml}

        <div class="signatures">
          <div class="sig-box">
            <div class="sig-line"></div>
            <strong>Prepared by: System Administrator &amp; Head of Operations</strong>
            <div style="color: #64748b; font-size: 7.5pt;">Diaspora Connect Farmers SACCO — Certified Ledger Record</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <strong>Attested by: Supervisory Committee / Board Secretariat</strong>
            <div style="color: #64748b; font-size: 7.5pt;">Official Verification Stamp &amp; Member Audit Record</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(printDoc);
      printWin.document.close();
      printWin.print();
    }
  };

  const handleLogout = () => { clearSession(); navigate('/signin'); };

  const handleMemberPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !memberPaymentAmount) return;
    const amount = Number(memberPaymentAmount);
    if (memberPaymentType === 'loan_repayment') {
      // Reduce the member's actual loan (this also posts the ledger entry)
      const loan = SaccoFarmStore.getLoans().find(l => l.memberId === selectedMember.memberId && (l.status === 'ACTIVE' || l.status === 'DEFAULTED'));
      if (!loan) { notify(`${selectedMember.name} has no active loan to repay.`); return; }
      SaccoFarmStore.recordLoanRepayment(loan.id, amount, 'Bank Wire', memberPaymentRef || undefined);
    } else {
      const res = SaccoFarmStore.applyMemberDeposit({
        memberId: selectedMember.memberId,
        purpose: memberPaymentType,
        amount,
        method: 'Bank Wire',
        reference: memberPaymentRef || undefined,
      });
      if (!res.success) { notify(res.msg); return; }
    }
    notify(`Payment of UGX ${amount.toLocaleString()} recorded for ${selectedMember.name}`);
    setMemberPaymentAmount('');
    setMemberPaymentRef('');
    setShowMemberPaymentForm(false);
    reloadData();
    const updated = SaccoFarmStore.getMembers().find(mb => mb.memberId === selectedMember.memberId);
    if (updated) setSelectedMember(updated);
  };

  // ── Member Details Inline Full Edit State & Handler ────────────────────────
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [editMemberForm, setEditMemberForm] = useState<{
    name: string;
    phone: string;
    email: string;
    nin: string;
    category: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
    shares: number;
    savings: number;
  }>({
    name: '',
    phone: '',
    email: '',
    nin: '',
    category: '',
    status: 'ACTIVE',
    shares: 0,
    savings: 0,
  });

  const handleStartEditMember = (m: SaccoMember) => {
    setEditMemberForm({
      name: m.name,
      phone: m.phone,
      email: m.email,
      nin: m.nin,
      category: m.category,
      status: m.status,
      shares: m.shares,
      savings: m.savings,
    });
    setIsEditingMember(true);
  };

  const handleSaveMemberEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    SaccoFarmStore.updateMember(selectedMember.memberId, {
      name: editMemberForm.name,
      phone: editMemberForm.phone,
      email: editMemberForm.email,
      nin: editMemberForm.nin,
      category: editMemberForm.category,
      status: editMemberForm.status,
      shares: Number(editMemberForm.shares),
      savings: Number(editMemberForm.savings),
    });
    notify(`Member records for ${editMemberForm.name} updated successfully!`);
    setIsEditingMember(false);
    reloadData();
    const updated = SaccoFarmStore.getMembers().find(mb => mb.memberId === selectedMember.memberId);
    if (updated) setSelectedMember(updated);
  };

  // ── Savings Deposit Form State & Handler ────────────────────────────────────
  const [savingsDepositMemberId, setSavingsDepositMemberId] = useState('');
  const [savingsDepositAmount, setSavingsDepositAmount] = useState('250000');
  const [savingsDepositMonth, setSavingsDepositMonth] = useState<'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun' | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec'>('nov');
  const [savingsDepositRef, setSavingsDepositRef] = useState('');
  const [savingsDepositPurpose, setSavingsDepositPurpose] = useState<'savings' | 'shares' | 'welfare' | 'project' | 'other'>('savings');

  const handleRecordSavingsDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = members.find(m => m.memberId === savingsDepositMemberId || m.id === savingsDepositMemberId) || members[0];
    if (!target) return;
    const amount = Number(savingsDepositAmount);
    // One store call keeps the member's savings / shares and the ledger in step
    const res = SaccoFarmStore.applyMemberDeposit({
      memberId: target.memberId,
      purpose: savingsDepositPurpose,
      amount,
      month: savingsDepositMonth,
      method: 'Bank Wire',
      reference: savingsDepositRef || undefined,
    });
    notify(res.success ? `Recorded ${savingsDepositPurpose} deposit of UGX ${amount.toLocaleString()} for ${target.name}.` : res.msg);

    setSavingsDepositAmount('250000');
    setSavingsDepositRef('');
    reloadData();
  };

  // ── Loan Creation Form State & Handler ──────────────────────────────────────
  const [loanApplicantId, setLoanApplicantId] = useState('');
  const [loanPrincipalInput, setLoanPrincipalInput] = useState('5000000');
  const [loanDurationMonths, setLoanDurationMonths] = useState('12');
  const [loanInterestRate, setLoanInterestRate] = useState('12');
  const [loanPurposeInput, setLoanPurposeInput] = useState('Dairy Farm Modernization & Cattle Feed');

  const handleCreateNewLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const target = members.find(m => m.memberId === loanApplicantId || m.id === loanApplicantId) || members[0];
    if (!target) return;
    const principal = Number(loanPrincipalInput);
    const rate = Number(loanInterestRate);
    const duration = Number(loanDurationMonths);
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    SaccoFarmStore.addLoan({
      memberId: target.memberId,
      memberName: target.name,
      principal,
      interestRate: rate,
      durationMonths: duration,
      purpose: loanPurposeInput,
      collateral: 'SACCO Member Savings & Cattle Assets',
      guarantor: 'SACCO Board Standing Committee',
      status: 'ACTIVE',
      applicationDate: today,
      disbursementDate: today,
      nextDueDate: nextMonth,
    });

    SaccoFarmStore.addTransaction({
      date: today,
      category: 'Loan Facility Disbursement',
      description: `Loan disbursement to ${target.name} for ${loanPurposeInput}`,
      amount: principal,
      type: 'Expense',
      source: 'Bank',
      isBanked: true,
      reference: `LN-DISB-${Date.now()}`,
    });

    notify(`Loan of UGX ${principal.toLocaleString()} issued to ${target.name}!`);
    setLoanPrincipalInput('5000000');
    reloadData();
  };

  // ── Cattle Clickable Modal Handlers ─────────────────────────────────────────
  const handleOpenCowModal = (cow: CattleAnimal) => {
    setSelectedCow(cow);
    setEditCowName(cow.name);
    setEditCowBreed(cow.breed);
    setEditCowStage(cow.stage);
    setEditCowGender(cow.gender || 'Female');
    setEditCowWeight(cow.weight?.toString() || '500');
    setEditCowDailyAvg(cow.dailyAvgMilk?.toString() || '0');
    setEditCowStatus(cow.status[0] || 'Healthy');
    setEditCowNotes(cow.notes || '');
    setCowModalTab('details');
  };

  const handleUpdateCow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCow) return;
    const updated = SaccoFarmStore.updateCattle(selectedCow.id, {
      name: editCowName,
      breed: editCowBreed,
      stage: editCowStage,
      gender: editCowGender,
      weight: Number(editCowWeight) || 500,
      dailyAvgMilk: Number(editCowDailyAvg) || 0,
      status: [editCowStatus],
      notes: editCowNotes,
    });
    if (updated) {
      setSelectedCow(updated);
      notify(`Cow ${updated.tagNumber} (${updated.name}) details updated.`);
      reloadData();
      setCowModalTab('details');
    }
  };

  const handleDeleteCow = (cow: CattleAnimal) => {
    if (confirm(`Permanently remove Cow ${cow.tagNumber} (${cow.name}) from herd?`)) {
      SaccoFarmStore.deleteCattle(cow.id);
      setSelectedCow(null);
      notify(`Cow ${cow.tagNumber} removed from herd.`);
      reloadData();
    }
  };

  const handleAddModalQuickMilk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCow || !modalQuickLitres) return;
    const litres = Number(modalQuickLitres);
    SaccoFarmStore.addCowMilkRecord({
      cowTag: selectedCow.tagNumber,
      cowName: selectedCow.name,
      date: modalQuickDate,
      session: modalQuickSession,
      litres,
      fatScore: 3.8,
      offtakerPrice: 1650,
      recorder: session?.fullName || 'Admin',
    });
    notify(`Logged ${litres}L for ${selectedCow.name}.`);
    setModalQuickLitres('');
    reloadData();
  };

    const pendingMemberRegCount = memberApps.filter(a => !a.adminApproved && a.status === 'PENDING_APPROVAL').length;
    const pendingShareConvCount = shareConversionRequests.filter(r => !r.adminApproved && r.status === 'PENDING').length;
    const pendingPaymentCount = paymentRequests.filter(r => r.status === 'VERIFIED_AWAITING_ADMIN').length;
    const pendingKycCount = kycSubmissions.filter(k => k.status === 'PENDING').length;
    const totalPendingApprovals = pendingPaymentCount + pendingMemberRegCount + pendingShareConvCount + pendingKycCount;

  // ── Nav items ────────────────────────────────────────────────────────────────
  const navItems: { id: TabId; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'members', label: 'Members', icon: <Users className="w-4 h-4" />, badge: members.length },
    { id: 'shares', label: 'Shares', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'savings', label: 'Savings', icon: <Wallet className="w-4 h-4" /> },
    { id: 'loans', label: 'Loans', icon: <Scale className="w-4 h-4" />, badge: activeLoans.length },
    { id: 'accounting', label: 'Accounting', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'closing', label: 'Close & Dividends', icon: <PieChart className="w-4 h-4" /> },
    { id: 'farm', label: 'Farm', icon: <Milk className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'ai', label: 'AI Advisor', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'approvals', label: 'Approvals', icon: <CheckCircle2 className="w-4 h-4" />, badge: totalPendingApprovals || undefined },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.memberId.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div className={`min-h-screen flex antialiased font-sans transition-colors duration-200 selection:bg-emerald-600 selection:text-white ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden" />
      )}

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 border-r flex flex-col justify-between shrink-0 shadow-2xl transition-transform duration-200 overflow-y-auto ${
        isDark ? 'bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-white border-slate-200'
      } ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-4 space-y-4">
          {/* Brand */}
          <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-200 dark:border-slate-800' : 'border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white shadow-lg text-base">DC</div>
              <div>
                <h1 className={`font-extrabold text-sm tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Diaspora Connect</h1>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider uppercase">Management Portal</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white md:hidden">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Profile & Authorization Badge */}
          <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-200 dark:border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center border border-emerald-500/30 shrink-0">
                {session?.fullName?.slice(0, 2).toUpperCase() || activeRole.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{session?.fullName || 'Management User'}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                  {activeRole.replace('_', ' ')}
                </p>
                <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  activeRole === 'ADMIN'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                }`}>
                  {activeRole === 'ADMIN' ? 'Administrator' : activeRole.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="space-y-0.5">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === item.id
                    ? 'bg-emerald-600 text-white shadow-md font-bold'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                    item.id === 'approvals' && Number(item.badge) > 0
                      ? 'bg-rose-500 text-white'
                      : isDark ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

          </nav>
        </div>

        {/* Bottom controls */}
        <div className={`p-4 border-t space-y-2 ${isDark ? 'border-slate-200 dark:border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition border ${
              isDark
                ? 'bg-slate-950 hover:bg-slate-850 text-slate-200 border-slate-200 dark:border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {isDark ? <Sun className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
              <span>{isDark ? 'Switch to Light' : 'Switch to Dark'}</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-mono">{themeMode}</span>
          </button>

          <Link to="/" className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition ${
            isDark ? 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-200 dark:border-slate-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
          }`}>
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            <span>Public Website</span>
          </Link>
          <div className="flex items-center justify-between px-1">
            <span />
            <button onClick={handleLogout} className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-400 transition text-[10px] font-bold">SIGN OUT</button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">

        {/* Top header */}
        <header className={`sticky top-0 z-30 backdrop-blur border-b px-4 py-3 flex items-center justify-between transition-colors duration-200 ${
          isDark ? 'bg-slate-900/90 border-slate-200 dark:border-slate-800' : 'bg-white/95 border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className={`p-2 rounded-xl md:hidden ${
              isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-700 hover:text-slate-900'
            }`}>
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Diaspora Connect</h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Role Simulator */}
            <div className="flex items-center gap-1.5">
              
              <select
                value={activeRole}
                onChange={(e) => {
                  setActiveRole(e.target.value);
                  notify(`Active role view: ${e.target.value.replace('_', ' ')}`);
                }}
                className={`text-xs font-bold rounded-xl px-2.5 py-1.5 border focus:outline-none transition ${
                  isDark ? 'bg-slate-950 border-slate-700 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 border-slate-300 text-emerald-700'
                }`}
                title="Select role to test permission-based authorization"
              >
                <option value="ADMIN">System Admin (Full Access)</option>
                <option value="BOARD_MEMBER">Board Member (Read-Only Mgmt)</option>
                <option value="ACCOUNTANT">Chief Accountant</option>
                <option value="SECRETARY">General Secretary</option>
                <option value="FARM_WORKER">Farm Manager</option>
              </select>
            </div>

            {/* Universal Section PDF Export Trigger */}
            <button
              onClick={() => setShowSectionPdfModal(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">EXPORT SECTION PDF</span>
            </button>

            {/* Quick Theme Switcher Pill */}
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
              title="Toggle Light / Dark Mode"
            >
              {isDark ? <Sun className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
              <span className="hidden sm:inline text-[11px]">{isDark ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </header>

        {/* Notification */}
        {notification && (
          <div className="m-4 p-3 rounded-2xl bg-emerald-600/15 border border-emerald-600/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 shadow-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Pending approvals banner */}
        {pendingPaymentCount > 0 && activeTab !== 'approvals' && (
          <button
            onClick={() => setActiveTab('approvals')}
            className="mx-4 mt-2 p-3 rounded-2xl bg-rose-600/15 border border-rose-600/40 text-rose-400 text-xs font-bold flex items-center justify-between shadow-xl hover:bg-rose-600/20 transition"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pendingPaymentCount} member payment(s) awaiting your final authorization</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <main className="p-4 md:p-6 space-y-6 flex-1 overflow-auto">

          {/* ── DASHBOARD TAB ───────────────────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">System Dashboard</h3>
                <p className="text-xs text-slate-400">Overview of Diaspora Connect SACCO & Farm operations</p>
              </div>

              {/* KPI Cards — All Clickable */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Active Members', value: activeMembers, sub: `${members.length} total registered`, icon: <Users className="w-5 h-5" />, color: 'text-emerald-500', tab: 'members' as const },
                  { label: 'Total Savings', value: `UGX ${fmtK(totalSavings)}`, sub: 'Net member savings balance', icon: <Wallet className="w-5 h-5" />, color: 'text-blue-500', tab: 'savings' as const },
                  { label: 'Share Capital', value: `UGX ${fmtK(totalSharesValue)}`, sub: `${totalShares} shares @ UGX ${(shareParValue/1000).toFixed(0)}K`, icon: <ShieldCheck className="w-5 h-5" />, color: 'text-emerald-600 dark:text-emerald-400', tab: 'shares' as const },
                  { label: 'Loan Book', value: `UGX ${fmtK(totalLoanBook)}`, sub: `${activeLoans.length} active loans`, icon: <Scale className="w-5 h-5" />, color: 'text-rose-500', tab: 'loans' as const },
                ].map((k, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(k.tab)}
                    className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition text-left cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide group-hover:text-emerald-600 dark:group-hover:text-emerald-700 dark:text-emerald-400 transition">{k.label}</span>
                      <span className={`${k.color} opacity-80 group-hover:scale-110 transition`}>{k.icon}</span>
                    </div>
                    <div className={`text-2xl font-extrabold font-mono ${k.color}`}>{k.value}</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                      <span>{k.sub}</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-emerald-500" />
                    </p>
                  </button>
                ))}
              </div>

              {/* Row 2: Farm + P&L — Clickable */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('farm')}
                  className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase group-hover:text-emerald-600 dark:group-hover:text-emerald-700 dark:text-emerald-400">Dairy Revenue (All Time)</span>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">UGX {fmtK(totalMilkRevenue)}</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Brookside Dairy Off-taker</p>
                  {latestMilk && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">Last log: {latestMilk.netSold}L sold on {latestMilk.date}</p>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('accounting')}
                  className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase group-hover:text-emerald-600 dark:group-hover:text-emerald-700 dark:text-emerald-400">Total Income (Ledger)</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition" />
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">UGX {fmtK(totalIncome)}</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">All verified income entries</p>
                </button>

                <button
                  onClick={() => setActiveTab('accounting')}
                  className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-rose-500 dark:hover:border-rose-500 hover:shadow-md transition text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase group-hover:text-rose-600 dark:group-hover:text-rose-400">Total Expenses (Ledger)</span>
                    <ArrowUpRight className="w-4 h-4 text-rose-500 group-hover:scale-110 transition" />
                  </div>
                  <div className="text-2xl font-extrabold text-rose-500 font-mono mt-1">UGX {fmtK(totalExpense)}</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">All verified expense entries</p>
                </button>
              </div>

              {/* Quick actions */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">Quick Actions</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Approvals Queue', tab: 'approvals', icon: <CheckCircle2 className="w-4 h-4" />, count: totalPendingApprovals, urgent: true },
                    { label: 'Register Member', tab: 'members', icon: <UserPlus className="w-4 h-4" />, count: null, urgent: false },
                    { label: 'Post Journal', tab: 'accounting', icon: <BookOpen className="w-4 h-4" />, count: null, urgent: false },
                    { label: 'Generate Report', tab: 'reports', icon: <BarChart3 className="w-4 h-4" />, count: null, urgent: false },
                  ].map((a, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTab(a.tab as TabId)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-bold transition ${
                        a.urgent && a.count
                          ? 'bg-rose-600/15 border-rose-600/40 text-rose-300 hover:bg-rose-600/25'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-500/50 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {a.icon}
                      <span>{a.label}</span>
                      {a.count !== null && a.count > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black">{a.count}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent transactions */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Recent Ledger Entries</h4>
                  <button onClick={() => setActiveTab('accounting')} className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:text-emerald-800 dark:text-emerald-300">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800"><th className="text-slate-500 py-2 pr-4 w-10">#</th>
                        {['Date', 'Type', 'Category', 'Amount', 'Ref'].map(h => (
                          <th key={h} className="text-left text-slate-500 font-semibold py-2 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {transactions.slice(0, 8).map((t, __n) => (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30"><td className="py-2 pr-4 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                          <td className="py-2 pr-4 text-slate-400 font-mono">{t.date}</td>
                          <td className="py-2 pr-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.type === 'Income' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                              t.type === 'Expense' ? 'bg-rose-500/15 text-rose-400' :
                              'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                            }`}>{t.type}</span>
                          </td>
                          <td className="py-2 pr-4 max-w-[200px] truncate">
                            {(() => {
                              const m = members.find(mb => t.category.includes(mb.name) || (t.description && t.description.includes(mb.name)) || t.category.includes(mb.memberId));
                              if (m) {
                                return (
                                  <button
                                    onClick={() => { setSelectedMember(m); setShowMemberModal(true); }}
                                    className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline text-left cursor-pointer"
                                    title={`Click to view & edit member: ${m.name}`}
                                  >
                                    {t.category}
                                  </button>
                                );
                              }
                              return <span className="font-semibold text-slate-800 dark:text-slate-200">{t.category}</span>;
                            })()}
                          </td>
                          <td className="py-2 pr-4 font-mono font-bold text-slate-900 dark:text-white">UGX {t.amount.toLocaleString()}</td>
                          <td className="py-2 text-slate-500 font-mono">{t.reference}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {transactions.length === 0 && (
                    <p className="text-slate-500 text-xs text-center py-6">No transactions yet.</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ── MEMBERS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Member Registry</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{members.length} registered members • {activeMembers} active</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      placeholder="Search members..."
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-48"
                    />
                  </div>
                </div>
              </div>

              {/* Register new member — FORM FIRST */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">Register New Member</h4>
                <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: 'Full Name *', value: newMemberName, setter: setNewMemberName, placeholder: 'e.g. John Mukasa', required: true },
                    { label: 'Phone Number *', value: newMemberPhone, setter: setNewMemberPhone, placeholder: '+256 772 000 000', required: true },
                    { label: 'Email Address', value: newMemberEmail, setter: setNewMemberEmail, placeholder: 'email@domain.com', required: false },
                    { label: 'NIN / Passport', value: newMemberNin, setter: setNewMemberNin, placeholder: 'CM840291...', required: false },
                  ].map((f, i) => (
                    <div key={i}>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{f.label}</label>
                      <input
                        value={f.value}
                        onChange={e => f.setter(e.target.value)}
                        placeholder={f.placeholder}
                        required={f.required}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Member Category</label>
                    <select
                      value={newMemberCategory}
                      onChange={e => setNewMemberCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                    >
                      {['Founding Member', 'Diaspora (United Kingdom)', 'Diaspora (Canada)', 'Diaspora (UAE)', 'Diaspora (USA)', 'Local Member', 'Staff Member'].map(c => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
                    <button type="submit" className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition">REGISTER MEMBER</button>
                  </div>
                </form>
              </div>

              {/* Members table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr><th className="text-slate-500 dark:text-slate-400 py-3 px-4 w-10">#</th>
                        {['Member', 'ID', 'Category', 'Savings', 'Shares', 'Status', 'Actions'].map(h => (
                          <th key={h} className="text-left text-slate-500 dark:text-slate-400 font-semibold py-3 px-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {filteredMembers.map((m, __n) => (
                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30"><td className="py-3 px-4 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {m.avatar || getMemberPhoto(m.name) ? (
                                <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-emerald-500/40 bg-slate-900">
                                  <img src={m.avatar || getMemberPhoto(m.name)} alt={m.name} className="w-full h-full object-cover object-top" />
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                                  {m.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <button
                                  onClick={() => { setSelectedMember(m); setShowMemberModal(true); }}
                                  className="font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-700 dark:text-emerald-400 text-left transition underline-offset-2 hover:underline"
                                >
                                  {m.name}
                                </button>
                                <p className="text-slate-500">{m.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-mono font-bold">{m.memberId}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-[120px] truncate">{m.category}</td>
                          <td className="py-3 px-4 text-slate-900 dark:text-white font-mono font-bold">UGX {m.savings.toLocaleString()}</td>
                          <td className="py-3 px-4 text-blue-700 dark:text-blue-400 font-mono font-bold">{m.shares} sh</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                              m.status === 'SUSPENDED' ? 'bg-rose-500/15 text-rose-400' :
                              'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                            }`}>{m.status}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => { setSelectedMember(m); setShowMemberModal(true); }}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                              >VIEW</button>
                              {m.status === 'ACTIVE' ? (
                                <button onClick={() => handleSuspendMember(m)} className="px-2 py-1 rounded-lg bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 font-bold text-[10px]">SUSPEND</button>
                              ) : (
                                <button onClick={() => handleReactivateMember(m)} className="px-2 py-1 rounded-lg bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">ACTIVATE</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── SHARES TAB ──────────────────────────────────────────────── */}
          {activeTab === 'shares' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Share Capital Registry</h3>
                <p className="text-xs text-slate-400">Cooperative share ownership at UGX 250,000 per Class A voting share</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Shares Issued', value: `${totalShares} shares`, color: 'text-blue-500 dark:text-blue-400' },
                  { label: 'Share Capital Value', value: `UGX ${fmtK(totalSharesValue)}`, color: 'text-slate-900 dark:text-white' },
                  { label: 'Par Value Per Share', value: 'UGX 250,000', color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Shareholders', value: `${members.filter(m => m.shares > 0).length} members`, color: 'text-slate-700 dark:text-slate-200' },
                ].map((k, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl">
                    <span className="text-xs font-semibold text-slate-400">{k.label}</span>
                    <div className={`text-xl font-extrabold font-mono mt-1 ${k.color}`}>{k.value}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/50">
                      <tr><th className="dark:text-slate-300 uppercase text-[11px] py-3 px-4 w-10">#</th>
                        {['Member', 'Member ID', 'Shares', 'Share Value (UGX)', 'Certificate No.', 'Status'].map(h => (
                          <th key={h} className="text-left text-slate-800 dark:text-slate-300 font-bold uppercase text-[11px] py-3 px-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {members.map((m, __n) => (
                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30"><td className="py-3 px-4 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                          <td className="py-3 px-4 font-semibold">
                            <button
                              onClick={() => { setSelectedMember(m); setShowMemberModal(true); }}
                              className="font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-700 dark:text-emerald-400 text-left transition underline-offset-2 hover:underline"
                            >
                              {m.name}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-mono">{m.memberId}</td>
                          <td className="py-3 px-4 text-blue-700 dark:text-blue-400 font-mono font-bold">{m.shares}</td>
                          <td className="py-3 px-4 text-slate-900 dark:text-white font-mono font-bold">{(m.shares * 250000).toLocaleString()}</td>
                          <td className="py-3 px-4 text-slate-400 font-mono">CERT-DC-{m.memberId.replace('DC-', '')}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-slate-500/15 text-slate-400'
                            }`}>{m.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── SAVINGS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'savings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Member Savings Ledger</h3>
                <p className="text-xs text-slate-400">12-month contribution matrix for all SACCO members</p>
              </div>

              {/* RECORD MEMBER DEPOSIT FORM — WITH PURPOSE */}
              <div className="bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Record Member Deposit</h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">Specify deposit purpose & accounting allocation</span>
                </div>
                <form onSubmit={handleRecordSavingsDeposit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Member *</label>
                    <select
                      value={savingsDepositMemberId}
                      onChange={e => setSavingsDepositMemberId(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value="">Select member...</option>
                      {members.map(m => <option key={m.id} value={m.memberId}>{m.name} ({m.memberId})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Depositing For *</label>
                    <select
                      value={savingsDepositPurpose}
                      onChange={e => setSavingsDepositPurpose(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value="savings">Monthly Savings</option>
                      <option value="shares">Buying Shares (UGX 250k/sh)</option>
                      <option value="welfare">Welfare / Emergency Fund</option>
                      <option value="project">Farm Expansion Project</option>
                      <option value="other">Other Special Deposit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Amount (UGX) *</label>
                    <input
                      type="number"
                      min="1000"
                      required
                      value={savingsDepositAmount}
                      onChange={e => setSavingsDepositAmount(e.target.value)}
                      placeholder="e.g. 500000"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Month Allocation</label>
                    <select
                      value={savingsDepositMonth}
                      disabled={savingsDepositPurpose !== 'savings'}
                      onChange={e => setSavingsDepositMonth(e.target.value as 'jan'|'feb'|'mar'|'apr'|'may'|'jun'|'jul'|'aug'|'sep'|'oct'|'nov'|'dec')}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      {(['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'] as const).map(mo => (
                        <option key={mo} value={mo}>{mo.charAt(0).toUpperCase() + mo.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="w-full px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition">RECORD DEPOSIT</button>
                  </div>
                </form>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                  <span className="text-xs text-slate-400 font-semibold">Total Pooled Savings</span>
                  <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono mt-1">UGX {totalSavings.toLocaleString()}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                  <span className="text-xs text-slate-400 font-semibold">Average per Member</span>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                    UGX {members.length ? Math.round(totalSavings / members.length).toLocaleString() : '0'}
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/50">
                      <tr><th className="dark:text-slate-300 uppercase text-[11px] py-3 px-4 w-10">#</th>
                        <th className="text-left text-slate-800 dark:text-slate-300 font-bold uppercase text-[11px] py-3 px-4">Member</th>
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                          <th key={m} className="text-right text-slate-800 dark:text-slate-300 font-bold uppercase text-[11px] py-3 px-2">{m}</th>
                        ))}
                        <th className="text-right text-slate-400 font-semibold py-3 px-4">Total</th>
                        <th className="text-right text-slate-400 font-semibold py-3 px-4">Net Savings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {members.map((m, __n) => (
                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30"><td className="py-2 px-4 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                          <td className="py-2 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            <button
                              onClick={() => { setSelectedMember(m); setShowMemberModal(true); }}
                              className="font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-700 dark:text-emerald-400 text-left transition underline-offset-2 hover:underline"
                            >
                              {m.name}
                            </button>
                          </td>
                          {(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const).map(mo => (
                            <td key={mo} className="py-2 px-2 text-right font-mono text-slate-500 dark:text-slate-300">
                              {m[mo] ? `${(m[mo] / 1000).toFixed(0)}K` : '—'}
                            </td>
                          ))}
                          <td className="py-2 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">{(m.total / 1000000).toFixed(1)}M</td>
                          <td className="py-2 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">{(m.savings / 1000000).toFixed(1)}M</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── LOANS TAB ───────────────────────────────────────────────── */}
          {activeTab === 'loans' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Loan Management</h3>
                <p className="text-xs text-slate-400">SACCO loan book — all active, pending, and cleared facilities</p>
              </div>

              {/* ISSUE NEW LOAN FORM — FIRST */}
              <div className="bg-white dark:bg-slate-900 border-2 border-blue-200 dark:border-blue-900/50 rounded-2xl p-5 shadow-sm">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">Issue New Loan</h4>
                <form onSubmit={handleCreateNewLoan} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Member *</label>
                    <select
                      value={loanApplicantId}
                      onChange={e => setLoanApplicantId(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select member...</option>
                      {members.map(m => <option key={m.id} value={m.memberId}>{m.name} ({m.memberId})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Principal (UGX) *</label>
                    <input
                      type="number"
                      min="100000"
                      required
                      value={loanPrincipalInput}
                      onChange={e => setLoanPrincipalInput(e.target.value)}
                      placeholder="e.g. 5000000"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Duration (Months) *</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      required
                      value={loanDurationMonths}
                      onChange={e => setLoanDurationMonths(e.target.value)}
                      placeholder="e.g. 12"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Interest Rate (% pa) *</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      step="0.5"
                      required
                      value={loanInterestRate}
                      onChange={e => setLoanInterestRate(e.target.value)}
                      placeholder="e.g. 12"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Purpose</label>
                    <input
                      type="text"
                      value={loanPurposeInput}
                      onChange={e => setLoanPurposeInput(e.target.value)}
                      placeholder="e.g. Dairy Farm Modernization"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="w-full px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg transition">ISSUE LOAN</button>
                  </div>
                </form>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Outstanding Loan Book', value: `UGX ${fmtK(totalLoanBook)}`, color: 'text-rose-500 dark:text-rose-400' },
                  { label: 'Active Loans', value: `${activeLoans.length} facilities`, color: 'text-slate-900 dark:text-white' },
                  { label: 'Pending Approval', value: `${loans.filter(l => l.status === 'PENDING_APPROVAL').length}`, color: 'text-blue-500 dark:text-blue-400' },
                  { label: 'Cleared Loans', value: `${loans.filter(l => l.status === 'CLEARED').length}`, color: 'text-emerald-600 dark:text-emerald-400' },
                ].map((k, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                    <span className="text-xs text-slate-400 font-semibold">{k.label}</span>
                    <div className={`text-xl font-extrabold font-mono mt-1 ${k.color}`}>{k.value}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/50">
                      <tr><th className="dark:text-slate-300 uppercase text-[11px] py-3 px-3 w-10">#</th>
                        {['Loan No.', 'Member', 'Principal', 'Outstanding', 'Rate', 'Status', 'Next Due', 'Actions'].map(h => (
                          <th key={h} className="text-left text-slate-800 dark:text-slate-300 font-bold uppercase text-[11px] py-3 px-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {loans.map((l, __n) => (
                        <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30"><td className="py-3 px-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                          <td className="py-3 px-3 text-emerald-700 dark:text-emerald-400 font-mono font-bold">{l.loanNumber}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                            <button
                              onClick={() => { const mem = members.find(mb => mb.memberId === l.memberId || mb.name === l.memberName); if (mem) { setSelectedMember(mem); setShowMemberModal(true); }}}
                              className="font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-700 dark:text-emerald-400 text-left transition underline-offset-2 hover:underline"
                            >
                              {l.memberName}
                            </button>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">{(l.principal / 1000000).toFixed(1)}M</td>
                          <td className="py-3 px-3 font-mono font-bold text-rose-400">{(l.outstandingBalance / 1000000).toFixed(1)}M</td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{l.interestRate}% pa</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              l.status === 'ACTIVE' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400' :
                              l.status === 'CLEARED' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                              l.status === 'PENDING_APPROVAL' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300' :
                              'bg-rose-500/15 text-rose-400'
                            }`}>{l.status.replace('_', ' ')}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono">{l.nextDueDate}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1 flex-wrap">
                              {l.status === 'PENDING_APPROVAL' && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Approve loan ${l.loanNumber} for ${l.memberName}?`)) {
                                      SaccoFarmStore.approveLoan(l.id);
                                      notify(`Loan ${l.loanNumber} approved!`);
                                      reloadData();
                                    }
                                  }}
                                  className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                                >APPROVE</button>
                              )}
                              {l.status === 'ACTIVE' && (
                                <button
                                  onClick={() => { setSelectedLoanHistory(l); setLoanRepayAmount(''); setLoanRepayRef(''); }}
                                  className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px]"
                                >PAY</button>
                              )}
                              <button
                                onClick={() => setSelectedLoanHistory(l)}
                                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-[10px]"
                              >HISTORY</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {loans.length === 0 && <p className="text-slate-500 text-xs text-center py-6">No loan records.</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── ACCOUNTING TAB ──────────────────────────────────────────── */}
          {activeTab === 'accounting' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Accounting — Income, Expenses &amp; Double Entry</h3>
                <p className="text-xs text-slate-400">Money in from savings, share purchases and milk; SACCO expenses; journal postings; and the debit / credit report</p>
              </div>
              <AccountingWorkspace
                actorName={`${session?.fullName || 'Administrator'} (${activeRole.replace('_', ' ')})`}
                canPost={['ADMIN', 'ACCOUNTANT'].includes(activeRole)}
                onNotify={notify}
              />
            </div>
          )}

          {/* ── FARM TAB ────────────────────────────────────────────────── */}
          {activeTab === 'farm' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Farm Operations</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {cattle.length} Head of Cattle
                  </span>
                  {farmSubTab === 'dairy' && SaccoFarmStore.canPerform('milk_recording') && (
                    <button
                      onClick={() => setShowAddMilkModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      ADD MILK RECORD
                    </button>
                  )}
                  {farmSubTab === 'cows' && SaccoFarmStore.canPerform('herd_register') && (
                    <button
                      onClick={() => setShowAddCowModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      ADD COW
                    </button>
                  )}
                </div>
              </div>

              {/* 4 Farm Sub-Tabs: Dairy, Feeds, Cows, Health */}
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

              {/* ── 1. DAIRY SUBTAB ── */}
              {farmSubTab === 'dairy' && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Milking Cows', value: `${cattle.filter(c => c.stage === 'Milking').length} head`, color: 'text-emerald-700 dark:text-emerald-400' },
                      { label: "Today's Milk Sales", value: `UGX ${fmtK(todayMilkRev)}`, color: 'text-slate-900 dark:text-white' },
                      { label: "This Month's Revenue", value: `UGX ${fmtK(monthMilkRev)}`, color: 'text-blue-700 dark:text-blue-400' },
                      { label: 'All-Time Milk Revenue', value: `UGX ${fmtK(totalMilkRevenue)}`, color: 'text-emerald-700 dark:text-emerald-400' },
                    ].map((k, i) => (
                      <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                        <span className="text-xs text-slate-400 font-semibold uppercase">{k.label}</span>
                        <div className={`text-xl font-extrabold font-mono mt-1 ${k.color}`}>{k.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Milk Revenue Analytics */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Milk Revenue Analytics</h4>
                        <p className="text-xs text-slate-500">Breakdown by daily, weekly, and calendar date filter</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { label: 'Today', value: todayMilkRev },
                        { label: 'This Week', value: weekMilkRev },
                        { label: 'This Month', value: monthMilkRev },
                        { label: 'All Time', value: totalMilkRevenue },
                      ].map((k, i) => (
                        <div key={i} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{k.label}</span>
                          <div className="text-lg font-extrabold font-mono mt-1 text-emerald-700 dark:text-emerald-400">UGX {fmtK(k.value)}</div>
                        </div>
                      ))}
                    </div>
                    {/* Quick Milk PDF Download Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Export Official Milk PDF:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleDownloadSectionPdf('milk', 'today')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition"
                    >
                      PDF: TODAY
                    </button>
                    <button
                      onClick={() => handleDownloadSectionPdf('milk', 'week')}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition"
                    >
                      PDF: THIS WEEK
                    </button>
                    <button
                      onClick={() => handleDownloadSectionPdf('milk', 'month')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition"
                    >
                      PDF: THIS MONTH
                    </button>
                    <button
                      onClick={() => handleDownloadSectionPdf('milk', 'calendar', milkRevCalendarDate)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs transition"
                    >
                      PDF: SELECTED DATE
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Pick Any Date</label>
                        <input
                          type="date"
                          value={milkRevCalendarDate}
                          onChange={e => setMilkRevCalendarDate(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                        <div className="flex flex-wrap gap-6">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Litres Sold</span>
                            <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">{calDateLitres.toFixed(1)} L</div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Rate</span>
                            <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">UGX 1,650</div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Revenue</span>
                            <div className="text-lg font-extrabold font-mono text-emerald-700 dark:text-emerald-400">UGX {calDateRev.toLocaleString()}</div>
                          </div>
                        </div>
                        {calDateLogs.length === 0 && <p className="text-xs text-slate-400 font-bold mt-2">No milk records for {milkRevCalendarDate}.</p>}
                      </div>
                    </div>
                  </div>

                  {/* Dairy bar-graph reports */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <ReportBarChart
                      title="Daily milk by session — last 14 days"
                      data={[...milkLogs].sort((a, b) => a.date.localeCompare(b.date)).slice(-14).map(l => ({ date: l.date.slice(5), morning: l.morning, afternoon: l.afternoon, evening: l.evening }))}
                      xKey="date"
                      series={[{ key: 'morning', label: 'Morning' }, { key: 'afternoon', label: 'Afternoon' }, { key: 'evening', label: 'Evening' }]}
                      format="litres"
                    />
                    <ReportBarChart
                      title="Milk per cow (all recorded sessions)"
                      data={Object.values(cowMilkRecords.reduce((acc, r) => {
                        const k = `${r.cowName} (${r.cowTag})`;
                        acc[k] = acc[k] || { cow: k, litres: 0 };
                        acc[k].litres = Math.round((acc[k].litres + r.litres) * 10) / 10;
                        return acc;
                      }, {} as Record<string, { cow: string; litres: number }>)).sort((a, b) => b.litres - a.litres)}
                      xKey="cow"
                      series={[{ key: 'litres', label: 'Litres' }]}
                      format="litres"
                      horizontal
                    />
                  </div>

                  {/* Per-cow milk records */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Cow Milk Records</h4>
                      <button onClick={() => setShowAddMilkModal(true)} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]">ADD MILK RECORD</button>
                    </div>
                    <div className="overflow-x-auto max-h-80 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800/50 sticky top-0">
                          <tr><th className="dark:text-slate-300 uppercase text-[11px] py-2 px-3 w-10">#</th>
                            {['Date', 'Session', 'Cow', 'Litres', 'Revenue', 'Recorder', ''].map(h => (
                              <th key={h} className="text-left text-slate-800 dark:text-slate-300 font-bold uppercase text-[11px] py-2 px-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                          {cowMilkRecords.slice(0, 30).map((r, __n) => (
                            <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30"><td className="py-2 px-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                              <td className="py-2 px-3 font-mono text-slate-500">{r.date}</td>
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{r.session}</td>
                              <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{r.cowName} <span className="font-mono text-emerald-700 dark:text-emerald-400">{r.cowTag}</span></td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">{r.litres} L</td>
                              <td className="py-2 px-3 font-mono text-emerald-700 dark:text-emerald-400">UGX {r.revenue.toLocaleString()}</td>
                              <td className="py-2 px-3 text-slate-500">{r.recorder}</td>
                              <td className="py-2 px-3">
                                <button
                                  onClick={() => { if (confirm(`Delete ${r.litres}L record for ${r.cowName}?`)) { SaccoFarmStore.deleteCowMilkRecord(r.id); reloadData(); } }}
                                  className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px]"
                                >DELETE</button>
                              </td>
                            </tr>
                          ))}
                          {cowMilkRecords.length === 0 && (
                            <tr><td colSpan={8} className="py-6 text-center text-slate-400">No cow milk records yet. Tap ADD MILK RECORD.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Milk Production Log */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Milk Production Log</h4>
                      <span className="text-xs font-mono text-slate-400">{milkLogs.length} total sessions</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800/50">
                          <tr><th className="dark:text-slate-300 uppercase text-[11px] py-2 px-3 w-10">#</th>
                            {['Date', 'Morning (L)', 'Afternoon (L)', 'Evening (L)', 'Net Sold (L)', 'Price/L', 'Revenue', 'Recorder'].map(h => (
                              <th key={h} className="text-left text-slate-800 dark:text-slate-300 font-bold uppercase text-[11px] py-2 px-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 font-mono">
                          {milkLogs.slice(0, 15).map((ml, __n) => (
                            <tr key={ml.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30"><td className="py-2 px-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                              <td className="py-2 px-3 text-slate-500 font-bold">{ml.date}</td>
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{ml.morning}</td>
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{ml.afternoon}</td>
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{ml.evening}</td>
                              <td className="py-2 px-3 text-emerald-700 dark:text-emerald-400 font-bold">{ml.netSold}</td>
                              <td className="py-2 px-3 text-slate-500">{ml.offtakerPrice.toLocaleString()}</td>
                              <td className="py-2 px-3 text-slate-900 dark:text-white font-bold font-sans">UGX {ml.revenue.toLocaleString()}</td>
                              <td className="py-2 px-3 text-slate-500 font-sans">{ml.recorder}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 2. FEEDS SUBTAB ── */}
              {farmSubTab === 'feeds' && (
                <div className="space-y-6">
                  {/* Feeds KPIs */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Feed Inventory Items', value: `${feedsList.length} types`, color: 'text-slate-900 dark:text-white' },
                      { label: 'Farm-Made Feeds', value: `${feedsList.filter(f => f.source === 'FARM_MADE').length} batches`, color: 'text-emerald-700 dark:text-emerald-400' },
                      { label: 'Purchased Feeds', value: `${feedsList.filter(f => f.source === 'BOUGHT').length} batches`, color: 'text-blue-700 dark:text-blue-400' },
                      { label: 'Total Feed Valuation', value: `UGX ${fmtK(feedsList.reduce((s, f) => s + (f.totalCost || 0), 0))}`, color: 'text-slate-900 dark:text-white' },
                    ].map((k, i) => (
                      <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                        <span className="text-xs text-slate-400 font-semibold uppercase">{k.label}</span>
                        <div className={`text-xl font-extrabold font-mono mt-1 ${k.color}`}>{k.value}</div>
                      </div>
                    ))}
                  </div>

                  <ReportBarChart
                    title="Feed stock on hand"
                    data={feedsList.map(f => ({ feed: `${f.feedType} (${f.unit})`, stock: f.currentStock, minimum: f.minStock }))}
                    xKey="feed"
                    series={[{ key: 'stock', label: 'In stock' }, { key: 'minimum', label: 'Minimum level' }]}
                    horizontal
                  />

                  {/* Feeds Table */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Feeds Stock Register</h4>
                        <p className="text-xs text-slate-500">Track bought feeds and zero-cost farm-made feeds (Silage, Hay, Grazing)</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowAddFeedModal(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                        >
                          ADD FEED BATCH
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800/50">
                          <tr><th className="dark:text-slate-300 uppercase text-[11px] py-2 px-3 w-10">#</th>
                            {['Feed Name', 'Source', 'Quantity In Stock', 'Unit Cost', 'Total Value', 'Date Added', 'Actions'].map(h => (
                              <th key={h} className="text-left text-slate-800 dark:text-slate-300 font-bold uppercase text-[11px] py-2 px-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                          {feedsList.map((f, __n) => (
                            <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30"><td className="py-2 px-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                              <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{f.feedType}</td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  f.source === 'FARM_MADE' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                                }`}>
                                  {f.source === 'FARM_MADE' ? 'Farm Made (UGX 0)' : 'Purchased'}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">{f.currentStock} {f.unit}</td>
                              <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">
                                {f.source === 'FARM_MADE' ? 'UGX 0' : `UGX ${(f.unitCost || 0).toLocaleString()}`}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                {f.source === 'FARM_MADE' ? 'UGX 0' : `UGX ${(f.totalCost || 0).toLocaleString()}`}
                              </td>
                              <td className="py-2 px-3 text-slate-500 font-mono">{f.lastUpdated}</td>
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedFeedForUse(f);
                                      setShowUseFeedModal(true);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-[10px]"
                                  >
                                    USE FEED
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFeed(f.id, f.feedType)}
                                    className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[10px]"
                                    title="Delete feed item"
                                  >
                                    DELETE
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {feedsList.length === 0 && (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-slate-400 font-bold">
                                No feed inventory records yet. Click ADD FEED BATCH above.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 3. COWS SUBTAB ── */}
              {farmSubTab === 'cows' && (
                <div className="space-y-6">
                  {/* Herd KPIs */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Herd Size', value: `${cattle.length} head`, color: 'text-slate-900 dark:text-white' },
                      { label: 'Milking Cows', value: `${cattle.filter(c => c.stage === 'Milking').length}`, color: 'text-emerald-700 dark:text-emerald-400' },
                      { label: 'In-Calf / Pregnant', value: `${cattle.filter(c => c.stage === 'Pregnant').length}`, color: 'text-blue-700 dark:text-blue-400' },
                      { label: 'Under Treatment', value: `${cattle.filter(c => c.status && c.status.some(s => s.toLowerCase().includes('sick'))).length}`, color: 'text-amber-600 dark:text-amber-400' },
                    ].map((k, i) => (
                      <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                        <span className="text-xs text-slate-400 font-semibold uppercase">{k.label}</span>
                        <div className={`text-xl font-extrabold font-mono mt-1 ${k.color}`}>{k.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <ReportBarChart
                      title="Herd by stage"
                      data={['Milking', 'Pregnant', 'Dry', 'Heifer', 'Calf', 'Bull'].map(st => ({ stage: st, head: cattle.filter(c => c.stage === st).length }))}
                      xKey="stage"
                      series={[{ key: 'head', label: 'Head' }]}
                    />
                    <ReportBarChart
                      title="Daily average milk by cow"
                      data={cattle.filter(c => (c.dailyAvgMilk || 0) > 0).sort((a, b) => (b.dailyAvgMilk || 0) - (a.dailyAvgMilk || 0)).map(c => ({ cow: `${c.name} (${c.tagNumber})`, litres: c.dailyAvgMilk || 0 }))}
                      xKey="cow"
                      series={[{ key: 'litres', label: 'Litres / day' }]}
                      format="litres"
                      horizontal
                    />
                  </div>

                  {/* Cows with calves */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Cows with a Calf</h4>
                      <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">{cattle.filter(c => c.hasCalf).length} cow(s)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {cattle.filter(c => c.hasCalf).map(c => {
                        const calf = cattle.find(x => x.tagNumber === c.calfTag);
                        return (
                          <button key={c.id} onClick={() => handleOpenCowModal(c)} className="text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{c.name} <span className="font-mono text-emerald-700 dark:text-emerald-400">{c.tagNumber}</span></p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{c.breed} · {c.stage}</p>
                            <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 mt-1">Calf: {calf ? `${calf.name} (${calf.tagNumber})` : c.calfTag || 'Tag not recorded'}</p>
                          </button>
                        );
                      })}
                      {cattle.filter(c => c.hasCalf).length === 0 && <p className="text-xs text-slate-400">No cows are currently recorded with a calf.</p>}
                    </div>
                  </div>

                  {/* Herd Table */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Herd Register</h4>
                        <p className="text-xs text-slate-500">Click any cow to open dossier, adjust details, or toggle health status</p>
                        <div className="flex gap-1.5 mt-2">
                          {([['all', 'All cattle'], ['withCalf', `With calf (${cattle.filter(c => c.hasCalf).length})`]] as const).map(([k, label]) => (
                            <button key={k} onClick={() => setCowCalfFilter(k)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${cowCalfFilter === k ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="relative max-w-xs w-full">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search tag number, name, breed..."
                          value={cattleSearch}
                          onChange={e => setCattleSearch(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-7 py-1.5 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                        />
                        {cattleSearch && (
                          <button onClick={() => setCattleSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800/50">
                          <tr><th className="dark:text-slate-300 uppercase text-[11px] py-2 px-3 w-10">#</th>
                            {['Tag', 'Name', 'Breed', 'Stage', 'Calf', 'Weight', 'Daily Avg (L)', 'Health Status', 'Actions'].map(h => (
                              <th key={h} className="text-left text-slate-800 dark:text-slate-300 font-bold uppercase text-[11px] py-2 px-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                          {cattle.filter(c => {
                            if (cowCalfFilter === 'withCalf' && !c.hasCalf) return false;
                            if (!cattleSearch.trim()) return true;
                            const q = cattleSearch.toLowerCase().trim();
                            return c.tagNumber.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.breed.toLowerCase().includes(q);
                          }).map((c, __n) => {
                            const isSick = c.status && c.status.some(s => s.toLowerCase().includes('sick'));
                            return (
                              <tr
                                key={c.id}
                                onClick={() => handleOpenCowModal(c)}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition"
                              ><td className="py-2.5 px-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                                <td className="py-2.5 px-3 text-emerald-700 dark:text-emerald-400 font-mono font-bold">{c.tagNumber}</td>
                                <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{c.name}</td>
                                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{c.breed}</td>
                                <td className="py-2.5 px-3 text-blue-700 dark:text-blue-400 font-bold">{c.stage}</td>
                                <td className="py-2.5 px-3">{c.hasCalf ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300">With calf{c.calfTag ? ` · ${c.calfTag}` : ''}</span> : <span className="text-slate-400">—</span>}</td>
                                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-mono">{c.weight}kg</td>
                                <td className="py-2.5 px-3 text-emerald-700 dark:text-emerald-400 font-mono font-bold">{c.dailyAvgMilk || '0.0'}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isSick ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                  }`}>
                                    {isSick ? 'Sick (Treatment)' : 'Healthy'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                    {isSick ? (
                                      <button
                                        onClick={() => handleMarkHealthy(c)}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] uppercase shadow-sm"
                                      >
                                        NOW HEALTHY
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleOpenMarkSick(c)}
                                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] uppercase shadow-sm"
                                      >
                                        NOW SICK
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleOpenCowModal(c)}
                                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px]"
                                    >
                                      DOSSIER
                                    </button>
                                  </div>
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

              {/* ── 4. HEALTH SUBTAB ── */}
              {farmSubTab === 'health' && (
                <div className="space-y-6">
                  {/* Health KPIs */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Healthy Animals', value: `${cattle.filter(c => !c.status || !c.status.some(s => s.toLowerCase().includes('sick'))).length} head`, color: 'text-emerald-700 dark:text-emerald-400' },
                      { label: 'Under Treatment (Sick)', value: `${cattle.filter(c => c.status && c.status.some(s => s.toLowerCase().includes('sick'))).length} head`, color: 'text-rose-600 dark:text-rose-400' },
                      { label: 'Total Recorded Incidents', value: `${healthRecords.length} records`, color: 'text-slate-900 dark:text-white' },
                      { label: 'Resolved / Recovered', value: `${healthRecords.filter(r => r.status === 'RECOVERED').length} events`, color: 'text-blue-700 dark:text-blue-400' },
                    ].map((k, i) => (
                      <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                        <span className="text-xs text-slate-400 font-semibold uppercase">{k.label}</span>
                        <div className={`text-xl font-extrabold font-mono mt-1 ${k.color}`}>{k.value}</div>
                      </div>
                    ))}
                  </div>

                  <ReportBarChart
                    title="Health incidents by illness"
                    data={Object.values(healthRecords.reduce((acc, r) => {
                      acc[r.illness] = acc[r.illness] || { illness: r.illness, active: 0, recovered: 0 };
                      if (r.status === 'RECOVERED') acc[r.illness].recovered += 1; else acc[r.illness].active += 1;
                      return acc;
                    }, {} as Record<string, { illness: string; active: number; recovered: number }>))}
                    xKey="illness"
                    series={[{ key: 'active', label: 'Active' }, { key: 'recovered', label: 'Recovered' }]}
                    horizontal
                  />

                  {/* Sickness History Register */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Herd Health & Veterinary Dossier</h4>
                        <p className="text-xs text-slate-500">Itemized log of every sickness event, diagnosis, treatment, and recovery status</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400">{healthRecords.length} clinical records</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800/50">
                          <tr><th className="dark:text-slate-300 uppercase text-[11px] py-2 px-3 w-10">#</th>
                            {['Date', 'Cow Tag & Name', 'Illness / Diagnosis', 'Symptoms', 'Treatment & Medication', 'Attending Vet', 'Status', 'Action'].map(h => (
                              <th key={h} className="text-left text-slate-800 dark:text-slate-300 font-bold uppercase text-[11px] py-2 px-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                          {healthRecords.map((rec, __n) => (
                            <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30"><td className="py-2.5 px-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-500">{rec.date}</td>
                              <td className="py-2.5 px-3">
                                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{rec.cowTag}</span>
                                <span className="block font-bold text-slate-900 dark:text-white">{rec.cowName}</span>
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{rec.illness}</td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{rec.symptoms || '—'}</td>
                              <td className="py-2.5 px-3">
                                <span className="font-semibold text-slate-900 dark:text-white">{rec.treatment}</span>
                                {rec.medication && <span className="block text-[11px] text-slate-500">Rx: {rec.medication}</span>}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{rec.vetName}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  rec.status === 'UNDER_TREATMENT' || rec.status === 'CURRENTLY_SICK'
                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                }`}>
                                  {rec.status === 'UNDER_TREATMENT' ? 'Under Treatment' : rec.status === 'CURRENTLY_SICK' ? 'Sick' : 'Recovered'}
                                </span>
                                {rec.recoveredDate && (
                                  <span className="block text-[10px] font-mono text-slate-400">Rec: {rec.recoveredDate}</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                {rec.status !== 'RECOVERED' ? (
                                  <button
                                    onClick={() => {
                                      const cow = cattle.find(c => c.tagNumber === rec.cowTag || c.id === rec.cowId);
                                      if (cow) handleMarkHealthy(cow);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] uppercase shadow-sm"
                                  >
                                    MARK HEALTHY
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">RESOLVED</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {healthRecords.length === 0 && (
                            <tr>
                              <td colSpan={9} className="py-8 text-center text-slate-400 font-bold">
                                No cow sickness records logged. All cattle are in healthy condition.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ── REPORTS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Financial Reports</h3>
                  <p className="text-xs text-slate-400">Cooperative performance reports — every figure below comes from the shared SACCO ledger</p>
                </div>
                <button onClick={() => window.print()} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700">PRINT REPORT</button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ReportBarChart
                  title="Savings by member"
                  data={[...members].sort((a, b) => b.savings - a.savings).map(m => ({ member: m.name, savings: m.savings }))}
                  xKey="member"
                  series={[{ key: 'savings', label: 'Net savings' }]}
                  format="ugx"
                  horizontal
                />
                <ReportBarChart
                  title="Shares held by member"
                  subtitle={`Par value UGX ${shareParValue.toLocaleString()} per share`}
                  data={[...members].sort((a, b) => b.shares - a.shares).map(m => ({ member: m.name, shares: m.shares }))}
                  xKey="member"
                  series={[{ key: 'shares', label: 'Shares' }]}
                  horizontal
                />
                <ReportBarChart
                  title="Loan book by borrower"
                  data={loans.filter(l => l.status !== 'CLEARED').map(l => ({ borrower: `${l.memberName} (${l.loanNumber})`, principal: l.principal, outstanding: l.outstandingBalance }))}
                  xKey="borrower"
                  series={[{ key: 'principal', label: 'Principal' }, { key: 'outstanding', label: 'Outstanding' }]}
                  format="ugx"
                  horizontal
                />
                <ReportBarChart
                  title="Monthly savings contributions (all members)"
                  data={(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const).map(mo => ({ month: mo.charAt(0).toUpperCase() + mo.slice(1), amount: members.reduce((s, m) => s + (Number(m[mo]) || 0), 0) }))}
                  xKey="month"
                  series={[{ key: 'amount', label: 'Contributions' }]}
                  format="ugx"
                />
                <ReportBarChart
                  title="Milk revenue — last 14 production days"
                  data={[...milkLogs].sort((a, b) => a.date.localeCompare(b.date)).slice(-14).map(l => ({ date: l.date.slice(5), revenue: l.revenue }))}
                  xKey="date"
                  series={[{ key: 'revenue', label: 'Milk revenue' }]}
                  format="ugx"
                />
                <ReportBarChart
                  title="Herd by stage"
                  data={['Milking', 'Pregnant', 'Dry', 'Heifer', 'Calf', 'Bull'].map(st => ({ stage: st, head: cattle.filter(c => c.stage === st).length }))}
                  xKey="stage"
                  series={[{ key: 'head', label: 'Head of cattle' }]}
                />
              </div>

              {/* Income by source, trial balance and Dr/Cr charts from the shared ledger */}
              <AccountingWorkspace sections={['summary', 'report']} actorName={session?.fullName || 'Administrator'} canPost={false} onNotify={notify} />

              {/* Member contributions summary */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">Member Savings Summary Report</h4>
                <div className="space-y-2">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{m.name}</p>
                        <p className="text-[10px] text-slate-500">{m.memberId} • {m.shares} shares</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">UGX {m.savings.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500">withdrawable: UGX {m.withdrawable.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── APPROVALS TAB ───────────────────────────────────────────── */}
          {activeTab === 'approvals' && (
            <div className="space-y-8">
              {/* SECTION 1: Member Registrations Dual-Control Approval */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">New Member Registrations (Dual-Approval)</h3>
                  <p className="text-xs text-slate-400">
                    Dual-control authorization: Secretariat recommends after reviewing KYC intake, Admin provides final binding approval to activate portal access.
                  </p>
                </div>

                {memberApps.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-slate-900 dark:text-white font-bold text-sm">No Pending Member Registrations</p>
                    <p className="text-slate-400 text-xs">All self-registered applicant records are cleared.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {memberApps.map(app => (
                      <div key={app.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

                              <p className="text-base font-extrabold text-slate-900 dark:text-white">
                                {app.fullName}
                              </p>

                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                                <span><span className="text-slate-400">Email:</span> {app.email}</span>
                                <span><span className="text-slate-400">Phone:</span> {app.phone}</span>
                                <span><span className="text-slate-400">Chapter:</span> {app.chapter}</span>
                              </div>

                              <ApplicationKycSummary app={app} />
                              {app.reason && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">Motivation:</span> {app.reason}
                                </p>
                              )}

                              {/* Dual status badges */}
                              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-400 font-semibold">1. Secretariat Recommendation:</span>
                                  {app.secretaryApproved ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                                      <CheckCircle2 className="w-3 h-3" /> Recommended
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                                      <Clock className="w-3 h-3" /> Awaiting Secretariat Review
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-400 font-semibold">2. Admin Authorization:</span>
                                  {app.adminApproved ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                                      <CheckCircle2 className="w-3 h-3" /> Authorized
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-500 dark:text-slate-400 font-bold text-[11px]">
                                      <Clock className="w-3 h-3" /> Pending Admin
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {app.status === 'PENDING_APPROVAL' && (
                              <>
                                <button
                                  onClick={() => handleAdminRejectMember(app.id)}
                                  className="px-4 py-2 rounded-xl bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 border border-rose-500/30 font-bold text-xs transition"
                                >
                                  REJECT
                                </button>
                                <button
                                  onClick={() => handleAdminApproveMember(app.id)}
                                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition"
                                >
                                  {app.adminApproved ? 'AUTHORIZED' : 'AUTHORIZE MEMBERSHIP'}
                                </button>
                              </>
                            )}
                            {app.status === 'APPROVED' && (
                              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/30">
                                Active ({app.memberId})
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

              {/* SECTION 2: Transaction Approvals */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Financial Transaction Approvals</h3>
                  <p className="text-xs text-slate-400">Dual-control final authorization — verified by Accountant, requires Admin authorization</p>
                </div>

                <PaymentRequestQueue
                  role="ADMIN"
                  actorName={`${session?.fullName || 'Administrator'} (Admin)`}
                  onNotify={notify}
                  guard={(desc, fn) => checkPermission(['ADMIN'], desc, fn)}
                />
              </div>

              {/* SECTION 2b: Member KYC Verification */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <KycReviewPanel
                  reviewerName={`${session?.fullName || 'Administrator'} (Admin)`}
                  onNotify={notify}
                  guard={(desc, fn) => checkPermission(['ADMIN', 'SECRETARY'], desc, fn)}
                />
              </div>

              {/* SECTION 3: Savings-to-Shares Conversion Approvals */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Repeat className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Share Capital Conversion Approvals (Savings to Shares)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Step 2 Dual-Control: Admin final binding authorization to transfer member voluntary savings into cooperative share capital
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    {shareConversionRequests.filter(r => !r.adminApproved && r.status === 'PENDING').length} Pending Admin
                  </span>
                </div>

                {shareConversionRequests.filter(r => r.status === 'PENDING').length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-slate-900 dark:text-white font-bold text-sm">All Share Conversions Cleared</p>
                    <p className="text-slate-400 text-xs">No savings-to-shares conversion requests awaiting authorization.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shareConversionRequests.filter(r => r.status === 'PENDING').map(req => (
                      <div key={req.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Repeat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                                SAVINGS TO SHARES
                              </span>
                              <span className="text-xs text-slate-500 font-mono">ID: {req.id}</span>
                              <span className="text-xs text-slate-400">Date: {req.date}</span>
                            </div>

                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {req.memberName} <span className="text-slate-500 font-normal text-xs ml-1 font-mono">({req.memberId})</span>
                            </p>

                            <div className="flex items-baseline gap-3">
                              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                                UGX {req.amount.toLocaleString()}
                              </span>
                              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">
                                &rarr; {req.shareCount} Class A Shares (@ UGX 250,000)
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                              <span>
                                Accountant Status:{' '}
                                {req.accountantApproved ? (
                                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                    Verified ({req.accountantApprovedBy || 'Mrs. Miriam Halera'})
                                  </span>
                                ) : (
                                  <span className="text-amber-500 font-bold">Awaiting Accountant Verification</span>
                                )}
                              </span>
                              <span>&bull;</span>
                              <span>
                                Admin Status:{' '}
                                {req.adminApproved ? (
                                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">Authorized</span>
                                ) : (
                                  <span className="text-blue-500 font-bold">Awaiting Your Authorization</span>
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {req.adminApproved ? (
                              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                                AUTHORIZED
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleAdminRejectConversion(req.id)}
                                  className="px-4 py-2 rounded-xl bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 border border-rose-500/30 font-bold text-xs transition"
                                >
                                  REJECT
                                </button>
                                <button
                                  onClick={() => handleAdminApproveConversion(req.id)}
                                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition"
                                >
                                  AUTHORIZE & ACCEPT
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SETTINGS TAB ────────────────────────────────────────────── */}
          {activeTab === 'settings' && (
            activeRole !== 'ADMIN' ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
                <p className="text-slate-900 dark:text-white font-extrabold text-sm">You have no access to this field.</p>
                <p className="text-xs text-slate-400 mt-2">Settings are restricted to the System Administrator.</p>
              </div>
            ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Settings</h3>

              {/* Section 1: User Authorization & Role Assignment */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">User Authorization & Role Assignment</h4>
                <div className="space-y-3">
                  {systemUsers.map(u => (
                    <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{u.name}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={userRoles[u.id] || u.role}
                          onChange={e => setUserRoles(prev => ({ ...prev, [u.id]: e.target.value }))}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        >
                          {['ADMIN', 'BOARD_MEMBER', 'SECRETARY', 'ACCOUNTANT', 'FARM_MANAGER', 'MEMBER'].map(r => (
                            <option key={r} value={r}>{r.replace('_', ' ')}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => notify(`Role saved: ${u.name} -> ${userRoles[u.id] || u.role}`)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                        >SAVE ROLE</button>
                        {userActive[u.id] !== false ? (
                          <button
                            onClick={() => { setUserActive(prev => ({ ...prev, [u.id]: false })); notify(`${u.name} deactivated.`); }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500/20 font-bold text-[10px]"
                          >DEACTIVATE</button>
                        ) : (
                          <button
                            onClick={() => { setUserActive(prev => ({ ...prev, [u.id]: true })); notify(`${u.name} activated.`); }}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20 font-bold text-[10px]"
                          >ACTIVATE</button>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${userActive[u.id] !== false ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-500'}`}>
                          {userActive[u.id] !== false ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Share Par Value */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">Share Par Value</h4>
                <p className="text-xs text-slate-400 mb-4">Change the nominal value per Class A voting share. This updates valuations across all members.</p>
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">New Par Value (UGX)</label>
                    <input
                      type="number"
                      value={shareParInput}
                      onChange={e => setShareParInput(e.target.value)}
                      min="10000"
                      step="1000"
                      placeholder="e.g. 250000"
                      className="w-48 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    onClick={handleUpdateShareParValue}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >UPDATE SHARE VALUE</button>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Current: <span className="font-bold font-mono text-slate-900 dark:text-white">UGX {shareParValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Task assignment, server connection, SMS and audit */}
              <TaskAssignmentsPanel onNotify={notify} />
              <SmsCenterPanel onNotify={notify} />
              <AuditTrailPanel />

              {/* Section 4: Danger Zone */}
              <div className="bg-white dark:bg-slate-900 border border-rose-500/20 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-rose-500 mb-3">Danger Zone</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Clear This Device</p>
                      <p className="text-[11px] text-slate-400">Removes the copy saved in this browser and signs out. Records in the database are kept.</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Clear the copy saved on this device and sign out? Records in the database are not deleted.')) {
                          localStorage.clear();
                          window.location.reload();
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 border border-rose-500/30 text-xs font-bold"
                    >CLEAR</button>
                  </div>
                </div>
              </div>
            </div>
            )
          )}

          {/* ── MONTH-END CLOSE & DIVIDENDS ─────────────────────────────── */}
          {activeTab === 'closing' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Month-End Close &amp; Dividends</h3>
                <p className="text-xs text-slate-400">Freeze completed months and share the year’s surplus with members</p>
              </div>
              <PeriodCloseDividends onNotify={notify} />
            </div>
          )}

          {/* ── AI ADVISOR ──────────────────────────────────────────────── */}
          {activeTab === 'ai' && (
            activeRole === 'ADMIN' || activeRole === 'BOARD_MEMBER' ? <SaccoAIAdvisor /> : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
                <p className="text-slate-900 dark:text-white font-extrabold text-sm">The AI Advisor is available to the Administrator.</p>
              </div>
            )
          )}

          {/* ── CHAT & MESSAGING ────────────────────────────────────────── */}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Community & Member Messaging</h3>
                  <p className="text-xs text-slate-500">Communication with farmers, SACCO members, and administrative staff</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  SACCO Network
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-xl font-black">
                  MSG
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Member Communications & Support Desk</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Send broadcast notifications, member loan alerts, and farm veterinary updates directly to registered member phones and portal inboxes.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => notify('Broadcast message sent to all active members.')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs"
                  >
                    SEND SACCO BROADCAST
                  </button>
                  <button
                    onClick={() => notify('Farm veterinary announcement sent.')}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    POST VET ADVISORY
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── EXPORT SECTION PDF MODAL ─────────────────────────────────────── */}
      {showSectionPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setShowSectionPdfModal(false)}>
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Export Official Audit PDF</h3>
                <p className="text-xs text-slate-500">Minimalist, verified double-entry reports for Admin and Board</p>
              </div>
              <button onClick={() => setShowSectionPdfModal(false)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">Select System Section *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'milk', label: 'Milk Production' },
                    { id: 'members', label: 'SACCO Members' },
                    { id: 'loans', label: 'Loan Portfolio' },
                    { id: 'feeds', label: 'Feeds Stock' },
                    { id: 'cows', label: 'Cattle Herd' },
                    { id: 'health', label: 'Veterinary Log' },
                    { id: 'accounting', label: 'General Ledger' },
                  ].map(sec => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setPdfModalSection(sec.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-bold text-left transition border ${
                        pdfModalSection === sec.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>
              </div>

              {pdfModalSection === 'milk' && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Milk Reporting Period</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'today', label: 'Today' },
                      { id: 'week', label: 'This Week' },
                      { id: 'month', label: 'This Month' },
                      { id: 'calendar', label: 'Calendar Date' },
                      { id: 'all', label: 'All-Time' },
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPdfMilkPeriod(p.id as any)}
                        className={`py-2 rounded-xl text-xs font-bold transition border ${
                          pdfMilkPeriod === p.id
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSectionPdfModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadSectionPdf(pdfModalSection, pdfMilkPeriod, milkRevCalendarDate);
                    setShowSectionPdfModal(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-md flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>PRINT / DOWNLOAD PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD COW MILK RECORD MODAL (Dairy) ──────────────────────────────── */}
      {showAddMilkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setShowAddMilkModal(false)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Add Milk Record</h3>
                <p className="text-xs text-slate-500">Litres from one cow in one milking session</p>
              </div>
              <button onClick={() => setShowAddMilkModal(false)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddMilkRecord} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cow *</label>
                <select required value={milkCowTag} onChange={e => setMilkCowTag(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white">
                  <option value="">Select cow...</option>
                  {cattle.filter(c => c.gender === 'Female' && c.stage !== 'Calf' && c.stage !== 'Heifer').map(c => (
                    <option key={c.id} value={c.tagNumber}>{c.name} ({c.tagNumber}) — {c.stage}{c.hasCalf ? ', with calf' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                  <input type="date" required value={milkDate} onChange={e => setMilkDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-mono" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Session *</label>
                  <select value={milkSession} onChange={e => setMilkSession(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white">
                    <option>Morning</option><option>Afternoon</option><option>Evening</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Litres *</label>
                <input type="number" required min="0.1" step="0.1" value={milkLitres} onChange={e => setMilkLitres(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-mono font-bold" />
                {Number(milkLitres) > 0 && <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">≈ UGX {(Number(milkLitres) * 1650).toLocaleString()} at UGX 1,650/L — added to today’s milk income</p>}
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                <input value={milkNotes} onChange={e => setMilkNotes(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddMilkModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">CANCEL</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold">SAVE MILK RECORD</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD COW MODAL (Cows) ───────────────────────────────────────────── */}
      {showAddCowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setShowAddCowModal(false)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Add Cow to Herd</h3>
              <button onClick={() => setShowAddCowModal(false)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddCow} className="p-6 grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Name *', value: newCowName, set: setNewCowName, required: true, type: 'text' },
                { label: 'Tag Number (blank = auto)', value: newCowTag, set: setNewCowTag, required: false, type: 'text' },
                { label: 'Date of Birth', value: newCowDob, set: setNewCowDob, required: false, type: 'date' },
                { label: 'Weight (kg)', value: newCowWeight, set: setNewCowWeight, required: false, type: 'number' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{f.label}</label>
                  <input type={f.type} required={f.required} value={f.value} onChange={e => f.set(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white" />
                </div>
              ))}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Breed</label>
                <select value={newCowBreed} onChange={e => setNewCowBreed(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white">
                  {['Friesian Cross', 'Friesian Pure', 'Jersey', 'Boran', 'Sahiwal', 'Ankole Longhorn'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sex</label>
                <select value={newCowGender} onChange={e => setNewCowGender(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white">
                  <option>Female</option><option>Male</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Stage</label>
                <select value={newCowStage} onChange={e => setNewCowStage(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white">
                  {['Milking', 'Pregnant', 'Dry', 'Heifer', 'Calf', 'Bull'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              {newCowGender === 'Female' && (
                <div className="col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                    <input type="checkbox" checked={newCowHasCalf} onChange={e => setNewCowHasCalf(e.target.checked)} />
                    This cow has a calf at foot
                  </label>
                  {newCowHasCalf && (
                    <input value={newCowCalfTag} onChange={e => setNewCowCalfTag(e.target.value)} placeholder="Calf tag number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono" />
                  )}
                </div>
              )}
              <div className="col-span-2 flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddCowModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">CANCEL</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold">ADD COW</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD FEED MODAL ─────────────────────────────────────────────────── */}
      
      {/* ── USE / DEDUCT FEED MODAL ────────────────────────────────────────── */}
      {showUseFeedModal && selectedFeedForUse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setShowUseFeedModal(false)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Record Feed Usage</h3>
                <p className="text-xs text-slate-500">{selectedFeedForUse.feedType} (Current Stock: {selectedFeedForUse.currentStock} {selectedFeedForUse.unit})</p>
              </div>
              <button onClick={() => setShowUseFeedModal(false)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUseFeed} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Quantity Used ({selectedFeedForUse.unit}) *</label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="0.1"
                  max={selectedFeedForUse.currentStock}
                  value={feedUseQuantity}
                  onChange={e => setFeedUseQuantity(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Usage Notes / Barn Unit</label>
                <input
                  type="text"
                  value={feedUseNotes}
                  onChange={e => setFeedUseNotes(e.target.value)}
                  placeholder="e.g. Fed to milking herd pen A"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUseFeedModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-md"
                >
                  CONFIRM USAGE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SICKNESS LOGGING MODAL ────────────────────────────────────────── */}
      {showSicknessModal && sicknessCow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setShowSicknessModal(false)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Mark Cow Sick &amp; Record Treatment</h3>
                <p className="text-xs text-slate-500">{sicknessCow.name} ({sicknessCow.tagNumber}) &middot; {sicknessCow.breed}</p>
              </div>
              <button onClick={() => setShowSicknessModal(false)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmMarkSick} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Illness / Clinical Diagnosis *</label>
                <input
                  type="text"
                  required
                  value={sicknessIllness}
                  onChange={e => setSicknessIllness(e.target.value)}
                  placeholder="e.g. Mastitis, Foot Rot, Anaplasmosis, East Coast Fever, Pneumonia"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Observed Symptoms</label>
                <input
                  type="text"
                  value={sicknessSymptoms}
                  onChange={e => setSicknessSymptoms(e.target.value)}
                  placeholder="e.g. Swollen udder quarter, high body temperature, limping"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Treatment Protocol</label>
                <input
                  type="text"
                  value={sicknessTreatment}
                  onChange={e => setSicknessTreatment(e.target.value)}
                  placeholder="e.g. Intramammary infusion &amp; intramuscular injection"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Medication Administered</label>
                  <input
                    type="text"
                    value={sicknessMedication}
                    onChange={e => setSicknessMedication(e.target.value)}
                    placeholder="e.g. Penicillin, Oxytetracycline"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Attending Vet *</label>
                  <input
                    type="text"
                    required
                    value={sicknessVet}
                    onChange={e => setSicknessVet(e.target.value)}
                    placeholder="e.g. Dr. Kigozi Charles"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Veterinary Notes &amp; Isolation Plan</label>
                <textarea
                  rows={2}
                  value={sicknessNotes}
                  onChange={e => setSicknessNotes(e.target.value)}
                  placeholder="Withhold milk from bulk tank for 72 hours; isolate in infirmary stall."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSicknessModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold shadow-md"
                >
                  CONFIRM SICK &amp; START TREATMENT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddFeedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setShowAddFeedModal(false)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Add Feed Batch</h3>
              <button onClick={() => setShowAddFeedModal(false)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddFeed} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Feed Name / Type *</label>
                <input type="text" required value={feedName} onChange={e => setFeedName(e.target.value)} placeholder="e.g. Dairy Meal, Silage, Hay" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Quantity *</label>
                  <input type="number" required min="1" value={feedQuantity} onChange={e => setFeedQuantity(e.target.value)} placeholder="e.g. 100" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Unit</label>
                  <select value={feedUnit} onChange={e => setFeedUnit(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500">
                    {['kg', 'bags', 'bales', 'litres', 'tonnes'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Source</label>
                <select value={feedSource} onChange={e => setFeedSource(e.target.value as 'BOUGHT' | 'FARM_MADE')} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500">
                  <option value="BOUGHT">Bought / Purchased</option>
                  <option value="FARM_MADE">Made at Farm (UGX 0)</option>
                </select>
              </div>
              {feedSource === 'BOUGHT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Unit Cost (UGX)</label>
                  <input type="number" min="0" value={feedCostPerUnit} onChange={e => setFeedCostPerUnit(e.target.value)} placeholder="e.g. 3200" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500" />
                  {feedCostPerUnit && feedQuantity && <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">Total: UGX {(Number(feedCostPerUnit) * Number(feedQuantity)).toLocaleString()}</p>}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Notes</label>
                <input type="text" value={feedNotes} onChange={e => setFeedNotes(e.target.value)} placeholder="Optional notes" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowAddFeedModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs">CANCEL</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs">ADD BATCH</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── LOAN REPAYMENT HISTORY MODAL ────────────────────────────────────── */}
      {selectedLoanHistory && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md" onClick={() => setSelectedLoanHistory(null)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl shadow-2xl max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
              <div>
                <p className="text-base font-extrabold text-slate-900 dark:text-white">{selectedLoanHistory.loanNumber}</p>
                <p className="text-xs text-emerald-500 font-mono font-bold">{selectedLoanHistory.memberName} — Repayment History</p>
              </div>
              <button onClick={() => setSelectedLoanHistory(null)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Loan summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(() => { const b = SaccoFarmStore.getLoanBreakdown(selectedLoanHistory); return [
                  { label: 'Principal', value: `UGX ${selectedLoanHistory.principal.toLocaleString()}` },
                  { label: 'Rate', value: `${selectedLoanHistory.interestRate}% pa` },
                  { label: 'Principal Repaid', value: `UGX ${b.principalPaid.toLocaleString()}` },
                  { label: 'Interest Paid', value: `UGX ${b.interestPaid.toLocaleString()}` },
                  { label: 'Principal Left', value: `UGX ${b.principalOutstanding.toLocaleString()}`, red: true },
                  { label: 'Interest Left', value: `UGX ${b.interestOutstanding.toLocaleString()}`, red: true },
                  { label: 'Interest Due Now', value: `UGX ${b.interestDueNow.toLocaleString()}`, red: b.interestDueNow > 0 },
                  { label: 'Total Outstanding', value: `UGX ${selectedLoanHistory.outstandingBalance.toLocaleString()}`, red: true },
                ]; })().map((s, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</span>
                    <div className={`text-sm font-extrabold font-mono mt-1 ${s.red ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Repayment History Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Repayment Installments</h4>
                {(selectedLoanHistory.repaymentHistory && selectedLoanHistory.repaymentHistory.length > 0) ? (
                  <div className="overflow-x-auto bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800/50">
                        <tr><th className="dark:text-slate-300 uppercase text-[11px] py-2 px-3 w-10">#</th>
                          {['Date', 'Reference', 'Method', 'Amount Paid', 'Principal', 'Interest', 'Balance After'].map(h => (
                            <th key={h} className="text-left text-slate-800 dark:text-slate-300 font-bold uppercase text-[11px] py-2 px-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                        {selectedLoanHistory.repaymentHistory.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-100 dark:hover:bg-slate-900"><td className="py-2 px-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{i + 1}</td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-mono">{r.date}</td>
                            <td className="py-2 px-3 text-slate-500 font-mono">{r.reference || '—'}</td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{r.paymentMethod}</td>
                            <td className="py-2 px-3 text-emerald-700 dark:text-emerald-400 font-mono font-bold">UGX {r.amount.toLocaleString()}</td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-mono">{(r.principalPortion || 0).toLocaleString()}</td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-mono">{(r.interestPortion || 0).toLocaleString()}</td>
                            <td className="py-2 px-3 text-rose-500 font-mono font-bold">UGX {r.remainingBalance.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-bold text-center py-4">No repayment installments recorded yet.</p>
                )}
              </div>

              {/* Record Payment Form */}
              {selectedLoanHistory.status === 'ACTIVE' && (
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3">Record Repayment</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Amount (UGX)</label>
                      <input type="number" value={loanRepayAmount} onChange={e => setLoanRepayAmount(e.target.value)} placeholder="e.g. 500000" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reference</label>
                      <input type="text" value={loanRepayRef} onChange={e => setLoanRepayRef(e.target.value)} placeholder="e.g. MoMo-TX-7823" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Method</label>
                      <select value={loanRepayMethod} onChange={e => setLoanRepayMethod(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500">
                        {['Mobile Money', 'Bank Transfer', 'Cash', 'SACCO Deduction'].map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRecordLoanRepayment(selectedLoanHistory.id)}
                    className="mt-3 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md"
                  >RECORD REPAYMENT</button>
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={() => setSelectedLoanHistory(null)} className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs">CLOSE</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MEMBER DETAIL MODAL ───────────────────────────────────────────── */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md" onClick={() => setShowMemberModal(false)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-500 font-bold text-lg flex items-center justify-center border border-emerald-500/30 shrink-0">
                  {selectedMember.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white">{selectedMember.name}</p>
                  <p className="text-xs text-emerald-500 font-mono font-bold">{selectedMember.memberId}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedMember.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  selectedMember.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
                }`}>{selectedMember.status}</span>
                <button onClick={() => setShowMemberModal(false)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Savings Balance', value: fmt(selectedMember.savings), color: 'text-emerald-500' },
                  { label: 'Share Capital', value: fmt(selectedMember.shares * 250000), color: 'text-blue-500' },
                  { label: 'Withdrawable', value: fmt(selectedMember.withdrawable), color: 'text-slate-900 dark:text-white' },
                  { label: 'Total Contributions', value: fmt(selectedMember.total), color: 'text-slate-900 dark:text-white' },
                ].map((s, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">{s.label}</p>
                    <p className={`text-sm font-extrabold font-mono mt-1 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Member Info Grid */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Member Information</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {[
                    { label: 'Phone', value: selectedMember.phone },
                    { label: 'Email', value: selectedMember.email || 'N/A' },
                    { label: 'NIN / Passport', value: selectedMember.nin || 'Pending' },
                    { label: 'Join Date', value: selectedMember.joinDate },
                    { label: 'Shares Held', value: `${selectedMember.shares} shares` },
                    { label: 'Admin Fee', value: fmt(selectedMember.adminFee || 50000) },
                  ].map((f, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-950 rounded-xl p-2.5 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase">{f.label}</span>
                      <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Contributions */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Monthly Contributions</h4>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        {(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const).map(m => (
                          <th key={m} className="text-center text-slate-500 dark:text-slate-400 font-semibold py-2 px-2">{m}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const).map(mo => (
                          <td key={mo} className="text-center py-2 px-2 font-mono text-slate-700 dark:text-slate-300">
                            {selectedMember[mo] ? `${(selectedMember[mo] / 1000).toFixed(0)}K` : '—'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transaction History */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Transaction History</h4>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/50">
                      <tr><th className="dark:text-slate-300 uppercase text-[11px] py-2 px-3 w-10">#</th>
                        {['Date', 'Reference', 'Type', 'Description', 'Amount'].map(h => (
                          <th key={h} className="text-left text-slate-800 dark:text-slate-300 font-bold uppercase text-[11px] py-2 px-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {transactions.filter(t => (t.category && t.category.includes(selectedMember.name)) || (t.description && t.description.includes(selectedMember.name)) || (t.category && t.category.includes(selectedMember.memberId))).length > 0
                        ? transactions.filter(t => (t.category && t.category.includes(selectedMember.name)) || (t.description && t.description.includes(selectedMember.name)) || (t.category && t.category.includes(selectedMember.memberId))).slice(0, 30).map((t, i) => (
                          <tr key={i} className="hover:bg-slate-100 dark:hover:bg-slate-900"><td className="py-2 px-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{i + 1}</td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-mono">{t.date}</td>
                            <td className="py-2 px-3 text-slate-500 font-mono">{t.reference || '—'}</td>
                            <td className="py-2 px-3">
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                t.type === 'Income' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-500'
                              }`}>{t.type === 'Income' ? 'DEPOSIT' : 'WITHDRAWAL'}</span>
                            </td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-semibold">{t.description || t.category}</td>
                            <td className={`py-2 px-3 font-mono font-bold ${t.type === 'Income' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-500'}`}>
                              {t.type === 'Income' ? '+' : '-'}UGX {(t.amount || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))
                        : (
                          <tr>
                            <td colSpan={6} className="py-4 text-center text-slate-400 font-bold">No transactions found for this member.</td>
                          </tr>
                        )
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowMemberPaymentForm(prev => !prev)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                >
                  ADD PAYMENT
                </button>
                <button
                  onClick={() => handleStartEditMember(selectedMember)}
                  className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-500 hover:bg-blue-500/20 font-bold text-xs transition"
                >
                  EDIT MEMBER
                </button>
                <button
                  onClick={() => {
                    if (selectedMember.status === 'ACTIVE') handleSuspendMember(selectedMember);
                    else handleReactivateMember(selectedMember);
                  }}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition border ${
                    selectedMember.status === 'ACTIVE'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20'
                  }`}
                >
                  {selectedMember.status === 'ACTIVE' ? 'SUSPEND MEMBER' : 'REACTIVATE MEMBER'}
                </button>
                <button
                  onClick={() => setActiveTab('loans')}
                  className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-500 hover:bg-blue-500/20 font-bold text-xs transition"
                >
                  VIEW LOANS
                </button>
              </div>

              {/* Payment Form (expandable) */}
              {showMemberPaymentForm && (
                <form onSubmit={handleMemberPayment} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Record Payment for {selectedMember.name}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Amount (UGX) *</label>
                      <input
                        type="number"
                        required
                        min="1000"
                        value={memberPaymentAmount}
                        onChange={e => setMemberPaymentAmount(e.target.value)}
                        placeholder="e.g. 500000"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Payment Type *</label>
                      <select
                        value={memberPaymentType}
                        onChange={e => setMemberPaymentType(e.target.value as 'savings' | 'shares' | 'loan_repayment')}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="savings">Savings Deposit</option>
                        <option value="shares">Share Purchase</option>
                        <option value="loan_repayment">Loan Repayment</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Reference / Receipt No.</label>
                      <input
                        type="text"
                        value={memberPaymentRef}
                        onChange={e => setMemberPaymentRef(e.target.value)}
                        placeholder="e.g. STN-WIRE-40192"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowMemberPaymentForm(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs">
                      Cancel
                    </button>
                    <button type="submit"
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md">
                      Record Payment
                    </button>
                  </div>
                </form>
              )}

              {/* Edit Member Form (expandable) */}
              {isEditingMember && (
                <form onSubmit={handleSaveMemberEdit} className="bg-slate-50 dark:bg-slate-950 border-2 border-blue-200 dark:border-blue-900/50 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Edit Member Details</h4>
                    <button type="button" onClick={() => setIsEditingMember(false)} className="p-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Full Name</label>
                      <input type="text" value={editMemberForm.name} onChange={e => setEditMemberForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. John Mukasa" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Phone</label>
                      <input type="text" value={editMemberForm.phone} onChange={e => setEditMemberForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="+256 772 000 000" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Email</label>
                      <input type="text" value={editMemberForm.email} onChange={e => setEditMemberForm(prev => ({ ...prev, email: e.target.value }))} placeholder="email@domain.com" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">NIN / Passport</label>
                      <input type="text" value={editMemberForm.nin} onChange={e => setEditMemberForm(prev => ({ ...prev, nin: e.target.value }))} placeholder="CM840291..." className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Category</label>
                      <select value={editMemberForm.category} onChange={e => setEditMemberForm(prev => ({ ...prev, category: e.target.value }))} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500">
                        {['Founding Member', 'Diaspora (United Kingdom)', 'Diaspora (Canada)', 'Diaspora (UAE)', 'Diaspora (USA)', 'Local Member', 'Staff Member'].map(c => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Status</label>
                      <select value={editMemberForm.status} onChange={e => setEditMemberForm(prev => ({ ...prev, status: e.target.value as 'ACTIVE' | 'PENDING' | 'SUSPENDED' }))} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500">
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                        <option value="PENDING">PENDING</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setIsEditingMember(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs">
                      Cancel
                    </button>
                    <button type="submit"
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md">
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── COW DETAIL, ADJUSTMENT & FEMALE MILK RECORDS MODAL ───────────────── */}
      {selectedCow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-slate-900 dark:text-white animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  {selectedCow.tagNumber.replace('DC-', '')}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedCow.name} ({selectedCow.tagNumber})
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                    {selectedCow.breed} &middot; {selectedCow.gender || 'Female'} &middot; {selectedCow.stage}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedCow.status && selectedCow.status.some(s => s.toLowerCase().includes('sick')) ? (
                  <button
                    onClick={() => handleMarkHealthy(selectedCow)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md"
                  >
                    NOW HEALTHY
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenMarkSick(selectedCow)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md"
                  >
                    NOW SICK
                  </button>
                )}
                <button
                  onClick={() => setSelectedCow(null)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Subtabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <button
                onClick={() => setCowModalTab('details')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  cowModalTab === 'details' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Profile &amp; Lineage
              </button>
              <button
                onClick={() => setCowModalTab('health')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  cowModalTab === 'health' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>SICKNESS &amp; HEALTH HISTORY</span>
              </button>
              <button
                onClick={() => setCowModalTab('edit')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  cowModalTab === 'edit' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>ADJUST / EDIT COW</span>
              </button>
              {(selectedCow.gender === 'Female' || ['Milking', 'Pregnant', 'Dry', 'Heifer'].includes(selectedCow.stage)) && (
                <button
                  onClick={() => setCowModalTab('milk')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                    cowModalTab === 'milk' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>FEMALE MILK RECORDS</span>
                </button>
              )}
            </div>

            
            {/* SUBTAB: SICKNESS & HEALTH HISTORY */}
            {cowModalTab === 'health' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Current Health Condition</span>
                    <span className={`text-sm font-black ${
                      selectedCow.status && selectedCow.status.some(s => s.toLowerCase().includes('sick'))
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {selectedCow.status && selectedCow.status.some(s => s.toLowerCase().includes('sick')) ? 'SICK (UNDER TREATMENT)' : 'HEALTHY & FIT'}
                    </span>
                  </div>
                  <div>
                    {selectedCow.status && selectedCow.status.some(s => s.toLowerCase().includes('sick')) ? (
                      <button
                        onClick={() => handleMarkHealthy(selectedCow)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md"
                      >
                        MARK NOW HEALTHY
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenMarkSick(selectedCow)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md"
                      >
                        RECORD SICKNESS
                      </button>
                    )}
                  </div>
                </div>

                {/* Sickness History Table for this cow */}
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  {(() => {
                    const cowSicknessEvents = (selectedCow.healthHistory && selectedCow.healthHistory.length > 0)
                      ? selectedCow.healthHistory
                      : healthRecords.filter(r => r.cowTag === selectedCow.tagNumber || r.cowId === selectedCow.id);

                    return (
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                          <tr><th className="p-2.5 w-10">#</th>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Diagnosis</th>
                            <th className="p-2.5">Symptoms &amp; Rx</th>
                            <th className="p-2.5">Vet</th>
                            <th className="p-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                          {cowSicknessEvents.map((rec, rIdx) => (
                            <tr key={rec.id || rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30"><td className="p-2.5 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{rIdx + 1}</td>
                              <td className="p-2.5 text-slate-500 font-bold">{rec.date}</td>
                              <td className="p-2.5 font-sans font-bold text-slate-900 dark:text-white">{rec.illness}</td>
                              <td className="p-2.5 font-sans text-slate-700 dark:text-slate-300">
                                <div>{rec.treatment}</div>
                                {rec.medication && <div className="text-[10px] text-slate-500">Rx: {rec.medication}</div>}
                              </td>
                              <td className="p-2.5 font-sans text-slate-600 dark:text-slate-400">{rec.vetName}</td>
                              <td className="p-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-sans ${
                                  rec.status === 'UNDER_TREATMENT' || rec.status === 'CURRENTLY_SICK'
                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                }`}>
                                  {rec.status === 'UNDER_TREATMENT' ? 'Under Treatment' : rec.status === 'CURRENTLY_SICK' ? 'Sick' : 'Recovered'}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {cowSicknessEvents.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-slate-400 font-bold font-sans">
                                Clean veterinary record! No sickness incidents recorded for {selectedCow.name}.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* SUBTAB 1: DETAILS */}
            {cowModalTab === 'details' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Current Stage</span>
                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">{selectedCow.stage}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Weight</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{selectedCow.weight || 520} kg</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Health Status</span>
                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">{selectedCow.status[0] || 'Healthy'}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Date of Birth</span>
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">{selectedCow.dob || '2023-01-10'}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Sire &amp; Dam Lineage</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{selectedCow.sireDam || 'ABS Semex / Local Sahiwal'}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Daily Avg Output</span>
                    <span className="text-sm font-black text-blue-700 dark:text-blue-400">{selectedCow.dailyAvgMilk || 0} L / day</span>
                  </div>
                </div>

                {selectedCow.notes && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Veterinary &amp; Feed Notes</span>
                    <p className="text-slate-800 dark:text-slate-300 font-medium">{selectedCow.notes}</p>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <button
                    onClick={() => handleDeleteCow(selectedCow)}
                    className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 font-bold text-xs flex items-center gap-1.5"
                  >
                    <span>DELETE ANIMAL FROM HERD</span>
                  </button>
                  <button
                    onClick={() => setCowModalTab('edit')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <span>EDIT / ADJUST COW</span>
                  </button>
                </div>
              </div>
            )}

            {/* SUBTAB 2: EDIT / ADJUST */}
            {cowModalTab === 'edit' && (
              <form onSubmit={handleUpdateCow} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cow Name *</label>
                    <input
                      type="text"
                      required
                      value={editCowName}
                      onChange={e => setEditCowName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Breed *</label>
                    <select
                      value={editCowBreed}
                      onChange={e => setEditCowBreed(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Friesian Cross">Friesian Cross</option>
                      <option value="Jersey">Jersey Pure</option>
                      <option value="Friesian Pure">Friesian Pure</option>
                      <option value="Boran">Boran</option>
                      <option value="Sahiwal">Sahiwal</option>
                      <option value="Ankole Longhorn">Ankole Longhorn</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Production Stage *</label>
                    <select
                      value={editCowStage}
                      onChange={e => setEditCowStage(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Milking">Milking</option>
                      <option value="Pregnant">Pregnant (In-Calf)</option>
                      <option value="Dry">Dry Cow</option>
                      <option value="Heifer">Heifer</option>
                      <option value="Calf">Calf</option>
                      <option value="Bull">Bull</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Gender / Sex</label>
                    <select
                      value={editCowGender}
                      onChange={e => setEditCowGender(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Body Weight (kg)</label>
                    <input
                      type="number"
                      value={editCowWeight}
                      onChange={e => setEditCowWeight(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Daily Average Yield (L)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editCowDailyAvg}
                      onChange={e => setEditCowDailyAvg(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Health / General Status</label>
                    <select
                      value={editCowStatus}
                      onChange={e => setEditCowStatus(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Healthy">Healthy</option>
                      <option value="Sick">Sick (Under Treatment)</option>
                      <option value="Pregnant">Pregnant</option>
                      <option value="Dry">Dry</option>
                      <option value="Sold">Sold</option>
                      <option value="Deceased">Deceased</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / Remarks</label>
                    <input
                      type="text"
                      value={editCowNotes}
                      onChange={e => setEditCowNotes(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCowModalTab('details')}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md"
                  >
                    Save Adjustments
                  </button>
                </div>
              </form>
            )}

            {/* SUBTAB 3: FEMALE MILK RECORDS (Dedicated for this Cow) */}
            {cowModalTab === 'milk' && (
              <div className="space-y-4 text-xs">
                {/* Inline Quick Log Form */}
                <form onSubmit={handleAddModalQuickMilk} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>Quick Milk Entry for {selectedCow.name}</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="date"
                      required
                      value={modalQuickDate}
                      onChange={e => setModalQuickDate(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-mono font-bold text-slate-900 dark:text-white"
                    />
                    <select
                      value={modalQuickSession}
                      onChange={e => setModalQuickSession(e.target.value as any)}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 dark:text-white"
                    >
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Evening">Evening</option>
                    </select>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        step="0.1"
                        required
                        placeholder="Litres..."
                        value={modalQuickLitres}
                        onChange={e => setModalQuickLitres(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-mono font-black text-slate-900 dark:text-white"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </form>

                {/* Historical records for this cow */}
                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  {(() => {
                    const cowRecords = cowMilkRecords.filter(r => r.cowTag === selectedCow.tagNumber);
                    const totalL = cowRecords.reduce((s, r) => s + r.litres, 0);
                    const totalUGX = cowRecords.reduce((s, r) => s + r.revenue, 0);

                    return (
                      <table className="w-full text-xs text-left font-mono">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                          <tr><th className="p-2.5 w-10">#</th>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Session</th>
                            <th className="p-2.5 text-right">Litres</th>
                            <th className="p-2.5 text-right">Revenue (UGX)</th>
                            <th className="p-2.5 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {cowRecords.map((r, __n) => (
                            <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30"><td className="p-2.5 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{__n + 1}</td>
                              <td className="p-2.5">{r.date}</td>
                              <td className="p-2.5 font-sans font-bold text-blue-700 dark:text-blue-400">{r.session}</td>
                              <td className="p-2.5 text-right font-black text-slate-900 dark:text-white">{r.litres.toFixed(1)}L</td>
                              <td className="p-2.5 text-right font-black text-emerald-700 dark:text-emerald-400">{r.revenue.toLocaleString()}</td>
                              <td className="p-2.5 text-center">
                                <button
                                  onClick={() => {
                                    SaccoFarmStore.deleteCowMilkRecord(r.id);
                                    reloadData();
                                  }}
                                  className="text-slate-400 hover:text-rose-600"
                                >
                                  <span className="text-[10px] font-bold">DELETE</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                          {cowRecords.length > 0 && (
                            <tr className="bg-slate-50 dark:bg-slate-950 font-bold">
                              <td colSpan={3} className="p-2.5 font-sans">TOTAL PRODUCTION</td>
                              <td className="p-2.5 text-right text-blue-700 dark:text-blue-400 font-black">{totalL.toFixed(1)}L</td>
                              <td className="p-2.5 text-right text-emerald-700 dark:text-emerald-400 font-black">UGX {totalUGX.toLocaleString()}</td>
                              <td></td>
                            </tr>
                          )}
                          {cowRecords.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-slate-500 font-bold font-sans">
                                No milk records logged yet for {selectedCow.name}.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ROLE AUTHORIZATION REQUIRED MODAL ─────────────────────────────── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" onClick={() => setShowAuthModal(false)}>
          <div className="bg-white dark:bg-slate-900 border-2 border-blue-500/50 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 relative text-slate-900 dark:text-white" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-500 flex items-center justify-center border border-blue-500/40 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{authModalData.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{authModalData.message}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                
                <span className="font-bold text-blue-700 dark:text-blue-400 font-mono">{activeRole.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Required Sign-off:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">{authModalData.requiredRole} Authorization</span>
              </div>
            </div>

            <form onSubmit={handleAdminOverride} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Enter Administrator Override PIN:
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    maxLength={6}
                    autoFocus
                    placeholder="Enter 8888 for Admin Demo PIN"
                    value={authPinInput}
                    onChange={e => {
                      setAuthPinInput(e.target.value);
                      setAuthPinError('');
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                {authPinError && <p className="text-rose-400 text-[11px] mt-1 font-semibold">{authPinError}</p>}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg transition"
                >
                  Authorize Action (PIN 8888)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveRole('ADMIN');
                    setShowAuthModal(false);
                    notify('Role elevated to System Administrator (Full Access).');
                    if (authModalData.actionToRetry) {
                      authModalData.actionToRetry();
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition"
                >
                  Switch to Admin Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Home, Dashboard, Chat, Settings) */}
      <PortalBottomNav
        currentTab={activeTab}
        onSelectTab={t => setActiveTab(t as any)}
        dashboardTab="overview"
      />
    </div>
  );
}



