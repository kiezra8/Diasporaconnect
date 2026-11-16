import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getSession, clearSession } from '../../services/api';
import AccessDenied from '../../components/AccessDenied';
import { applyTheme, getTheme } from '../../services/theme';
import PortalBottomNav from '../../components/PortalBottomNav';
import {
  SaccoFarmStore,
  CattleAnimal,
  MilkLogRecord,
  CattleHealthRecord,
  CowMilkRecord,
  FeedInventoryItem,
  CowHealthRecord,
} from '../../services/saccoFarmStore';
import {
  Milk,
  PlusCircle,
  HeartPulse,
  LogOut,
  CheckCircle2,
  Menu,
  X,
  Building,
  ShieldCheck,
  Download,
  Printer,
  Calendar,
  Filter,
  TrendingUp,
  Activity,
  Sun,
  Moon,
  Search,
  Edit2,
  Trash2,
  Lock,
  ChevronRight,
  SlidersHorizontal,
  FileText
} from 'lucide-react';

type DateFilterMode = 'day' | 'week' | 'month' | 'year' | 'all';

export default function FarmPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();

  if (session && session.role === 'MEMBER') {
    return <AccessDenied message="You have no access to this field." backPath="/member" />;
  }

  // Authorization check for PDF reports
  const canDownloadReports = session?.role === 'ADMIN' || session?.role === 'BOARD_MEMBER';

  const getInitialTab = (): 'per_cow' | 'cattle' | 'health' | 'feeds' => {
    if (location.pathname.includes('/cattle') || location.pathname.includes('/animals')) return 'cattle';
    if (location.pathname.includes('/health')) return 'health';
    if (location.pathname.includes('/feeds')) return 'feeds';
    return 'per_cow';
  };

  const [activeTab, setActiveTab] = useState<'per_cow' | 'feeds' | 'cattle' | 'health' | 'chat' | 'settings'>(getInitialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
  const [cattle, setCattle] = useState<CattleAnimal[]>([]);
  const [healthRecords, setHealthRecords] = useState<CattleHealthRecord[]>([]);
  const [cowMilkRecords, setCowMilkRecords] = useState<CowMilkRecord[]>([]);
  const [feeds, setFeeds] = useState<FeedInventoryItem[]>([]);

  // Feeds Form State
  const [showAddFeedModal, setShowAddFeedModal] = useState(false);
  const [feedTypeInput, setFeedTypeInput] = useState('');
  const [feedSourceInput, setFeedSourceInput] = useState<'BOUGHT' | 'FARM_MADE'>('FARM_MADE');
  const [feedQtyInput, setFeedQtyInput] = useState('');
  const [feedUnitInput, setFeedUnitInput] = useState('kg');
  const [feedUnitCostInput, setFeedUnitCostInput] = useState('0');
  const [feedSupplierInput, setFeedSupplierInput] = useState('');
  const [feedNotesInput, setFeedNotesInput] = useState('');
  const [feedSearch, setFeedSearch] = useState('');

  // ── Sickness & Health Management State ──────────────────────────────────────
  const [showSicknessModal, setShowSicknessModal] = useState(false);
  const [sicknessCow, setSicknessCow] = useState<CattleAnimal | null>(null);
  const [sicknessIllness, setSicknessIllness] = useState('');
  const [sicknessSymptoms, setSicknessSymptoms] = useState('');
  const [sicknessTreatment, setSicknessTreatment] = useState('');
  const [sicknessMedication, setSicknessMedication] = useState('');
  const [sicknessVet, setSicknessVet] = useState('Dr. Kigozi Charles');
  const [sicknessNotes, setSicknessNotes] = useState('');

  // Feed usage modal state
  const [showUseFeedModal, setShowUseFeedModal] = useState(false);
  const [selectedFeedForUse, setSelectedFeedForUse] = useState<FeedInventoryItem | null>(null);
  const [feedUseQty, setFeedUseQty] = useState('');
  const [feedUseNotes, setFeedUseNotes] = useState('');

  const handleOpenMarkSick = (cow: CattleAnimal) => {
    setSicknessCow(cow);
    setSicknessIllness('Mastitis');
    setSicknessSymptoms('');
    setSicknessTreatment('Intramammary antibiotic infusion');
    setSicknessMedication('Penicillin G');
    setSicknessVet('Dr. Kigozi Charles');
    setSicknessNotes('');
    setShowSicknessModal(true);
  };

  const handleConfirmMarkSick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sicknessCow || !sicknessIllness.trim()) return;
    if (SaccoFarmStore.markCowSick) {
      SaccoFarmStore.markCowSick(sicknessCow.id, {
        illness: sicknessIllness.trim(),
        symptoms: sicknessSymptoms.trim() || undefined,
        treatment: sicknessTreatment.trim() || 'Veterinary care protocol',
        medication: sicknessMedication.trim() || undefined,
        vetName: sicknessVet.trim() || 'Dr. Kigozi Charles',
        notes: sicknessNotes.trim() || undefined,
      });
      reloadData();
    }
    setShowSicknessModal(false);
    setSicknessCow(null);
    notify(`${sicknessCow.name} (${sicknessCow.tagNumber}) marked SICK and added to treatment log.`);
  };

  const handleMarkHealthy = (cow: CattleAnimal) => {
    if (SaccoFarmStore.markCowHealthy) {
      SaccoFarmStore.markCowHealthy(cow.id, 'Recovered under veterinary protocol');
      reloadData();
    }
    notify(`${cow.name} (${cow.tagNumber}) marked HEALTHY and fit.`);
  };

  const handleConfirmUseFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedForUse || !feedUseQty) return;
    const q = Number(feedUseQty);
    if (isNaN(q) || q <= 0) return;
    if (SaccoFarmStore.recordFeedUsage) {
      SaccoFarmStore.recordFeedUsage(selectedFeedForUse.id, q, feedUseNotes.trim() || undefined);
      reloadData();
    }
    setShowUseFeedModal(false);
    setSelectedFeedForUse(null);
    setFeedUseQty('');
    setFeedUseNotes('');
    notify(`Deducted ${q} ${selectedFeedForUse.unit} of ${selectedFeedForUse.feedType} from inventory.`);
  };

  const handleCreateFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedTypeInput.trim()) return;
    const isFarmMade = feedSourceInput === 'FARM_MADE';
    const qty = Number(feedQtyInput) || 0;
    const unitCost = isFarmMade ? 0 : (Number(feedUnitCostInput) || 0);
    const totalCost = isFarmMade ? 0 : (unitCost * qty);

    SaccoFarmStore.addFeedItem({
      feedType: feedTypeInput.trim(),
      source: feedSourceInput,
      currentStock: qty,
      minStock: Math.max(10, Math.round(qty * 0.2)),
      unit: feedUnitInput || 'kg',
      unitCost,
      totalCost,
      supplier: isFarmMade ? (feedSupplierInput.trim() || 'On-Farm Pasture Paddock') : (feedSupplierInput.trim() || 'Feed Supplier'),
      notes: feedNotesInput.trim() || (isFarmMade ? 'Produced on-farm; zero procurement cost' : 'Commercial feed batch')
    });

    notify(`Added feed batch: ${feedTypeInput} (${isFarmMade ? 'Made at Farm: UGX 0' : 'Purchased: UGX ' + totalCost.toLocaleString()})`);
    setShowAddFeedModal(false);
    setFeedTypeInput('');
    setFeedQtyInput('');
    setFeedUnitCostInput('0');
    setFeedSupplierInput('');
    setFeedNotesInput('');
    reloadData();
  };

  const handleUseFeed = (feed: FeedInventoryItem) => {
    const qtyStr = prompt(`Enter quantity of ${feed.feedType} consumed (${feed.unit}):`, '50');
    if (!qtyStr) return;
    const qty = Number(qtyStr);
    if (!qty || qty <= 0) return;
    if (qty > feed.currentStock) {
      alert(`Cannot use more than current stock (${feed.currentStock} ${feed.unit})`);
      return;
    }
    SaccoFarmStore.logFeedConsumption(feed.id, qty, 'Daily dairy herd feed ration');
    notify(`Recorded usage of ${qty} ${feed.unit} of ${feed.feedType}`);
    reloadData();
  };

  const handleDeleteFeed = (id: string, name: string) => {
    if (!confirm(`Delete feed batch "${name}"?`)) return;
    SaccoFarmStore.deleteFeedItem(id);
    notify(`Deleted feed batch "${name}"`);
    reloadData();
  };

  // ── Milk logging form (Strictly per-cow) ───────────────────────────────────
  const [cowSearchInput, setCowSearchInput] = useState('');
  const [selectedCowForMilk, setSelectedCowForMilk] = useState<CattleAnimal | null>(null);
  const [milkSession, setMilkSession] = useState<'Morning' | 'Afternoon' | 'Evening'>('Morning');
  const [milkLitres, setMilkLitres] = useState('');
  const [milkFat, setMilkFat] = useState('3.8');
  const [milkDate, setMilkDate] = useState(new Date().toISOString().split('T')[0]);
  const [offtakerPrice, setOfftakerPrice] = useState('1650');
  const [recorderName, setRecorderName] = useState(session?.fullName || 'Joseph Mugisha');

  // ── Date and Search Filters for Milk Records ───────────────────────────────
  const [milkDateFilterMode, setMilkDateFilterMode] = useState<DateFilterMode>('all');
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarSelectedMonth, setCalendarSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [calendarSelectedYear, setCalendarSelectedYear] = useState(new Date().getFullYear().toString());
  const [milkTableSearch, setMilkTableSearch] = useState('');

  // ── Cattle Registry Search & Filter ────────────────────────────────────────
  const [cattleSearch, setCattleSearch] = useState('');
  const [cattleStageFilter, setCattleStageFilter] = useState<'All' | 'Milking' | 'Pregnant' | 'Dry' | 'Heifer' | 'Calf' | 'Bull'>('All');

  // ── Selected Cow Modal for Clickable Actions (Edit, Delete, Female Milk) ───
  const [selectedCow, setSelectedCow] = useState<CattleAnimal | null>(null);
  const [cowModalTab, setCowModalTab] = useState<'details' | 'edit' | 'milk' | 'health'>('details');
  const [editCowName, setEditCowName] = useState('');
  const [editCowBreed, setEditCowBreed] = useState<any>('Friesian Cross');
  const [editCowStage, setEditCowStage] = useState<any>('Milking');
  const [editCowGender, setEditCowGender] = useState<'Female' | 'Male'>('Female');
  const [editCowWeight, setEditCowWeight] = useState('');
  const [editCowDailyAvg, setEditCowDailyAvg] = useState('');
  const [editCowStatus, setEditCowStatus] = useState<'Healthy' | 'Sick' | 'Pregnant' | 'Dry' | 'Sold' | 'Deceased'>('Healthy');
  const [editCowNotes, setEditCowNotes] = useState('');

  // Quick milk entry inside cow modal
  const [modalQuickLitres, setModalQuickLitres] = useState('');
  const [modalQuickSession, setModalQuickSession] = useState<'Morning' | 'Afternoon' | 'Evening'>('Morning');
  const [modalQuickDate, setModalQuickDate] = useState(new Date().toISOString().split('T')[0]);

  // ── Report Modal ───────────────────────────────────────────────────────────
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());

  // Cattle form (Add new)
  const [showAddCattleModal, setShowAddCattleModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newName, setNewName] = useState('');
  const [newBreed, setNewBreed] = useState<'Friesian Cross' | 'Jersey' | 'Friesian Pure' | 'Boran' | 'Sahiwal'>('Friesian Cross');
  const [newStage, setNewStage] = useState<'Milking' | 'Dry' | 'Pregnant' | 'Heifer' | 'Bull'>('Milking');
  const [newGender, setNewGender] = useState<'Female' | 'Male'>('Female');
  const [newWeight, setNewWeight] = useState('520');

  // Health form
  const [hlCowTag, setHlCowTag] = useState('');
  const [hlDiagnosis, setHlDiagnosis] = useState('');
  const [hlTreatment, setHlTreatment] = useState('');
  const [hlVet, setHlVet] = useState('Dr. Opolot Isaac');
  const [hlCost, setHlCost] = useState('');
  const [hlType, setHlType] = useState<'Vaccination' | 'Treatment' | 'Deworming' | 'Vet Visit' | 'Mortality'>('Treatment');

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 6000);
  };

  const reloadData = () => {
    setCattle(SaccoFarmStore.getCattle());
    setHealthRecords(SaccoFarmStore.getHealthRecords());
    setCowMilkRecords(SaccoFarmStore.getCowMilkRecords());
    setFeeds(SaccoFarmStore.getFeedInventory());
  };

  useEffect(() => {
    reloadData();
    const handlePortalTabSwitch = (e: any) => {
      const tab = e.detail;
      if (tab === 'chat') setActiveTab('chat');
      else if (tab === 'dashboard') setActiveTab('per_cow');
      else if (tab === 'settings') setActiveTab('settings');
    };
    window.addEventListener('dc_storage_update', reloadData);
    window.addEventListener('dc_portal_tab_switch', handlePortalTabSwitch);
    return () => {
      window.removeEventListener('dc_storage_update', reloadData);
      window.removeEventListener('dc_portal_tab_switch', handlePortalTabSwitch);
    };
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  // ── Open Cow Details Modal ────────────────────────────────────────────────
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

  // ── Save Cow Adjustments ──────────────────────────────────────────────────
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
      notify(`Cow ${updated.tagNumber} (${updated.name}) details updated successfully.`);
      reloadData();
      setCowModalTab('details');
    }
  };

  // ── Delete Cow ────────────────────────────────────────────────────────────
  const handleDeleteCow = (cow: CattleAnimal) => {
    if (confirm(`Are you sure you want to permanently delete Cow ${cow.tagNumber} (${cow.name}) from the herd?`)) {
      SaccoFarmStore.deleteCattle(cow.id);
      setSelectedCow(null);
      notify(`Cow ${cow.tagNumber} has been removed from the central herd registry.`);
      reloadData();
    }
  };

  // ── Add Per-Cow Milk from Main Form ───────────────────────────────────────
  const handleAddPerCowMilk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCowForMilk || !milkLitres) {
      alert('Please select a cow and enter milk litres.');
      return;
    }
    const litres = Number(milkLitres);
    const price = Number(offtakerPrice || 1650);

    SaccoFarmStore.addCowMilkRecord({
      cowTag: selectedCowForMilk.tagNumber,
      cowName: selectedCowForMilk.name,
      date: milkDate,
      session: milkSession,
      litres,
      fatScore: Number(milkFat || 3.8),
      offtakerPrice: price,
      recorder: recorderName,
    });

    notify(`Milk logged for ${selectedCowForMilk.name} (${selectedCowForMilk.tagNumber}): ${litres}L (${milkSession}).`);
    setMilkLitres('');
    reloadData();
  };

  // ── Add Per-Cow Milk inside Cow Modal ─────────────────────────────────────
  const handleAddModalQuickMilk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCow || !modalQuickLitres) return;
    const litres = Number(modalQuickLitres);
    const price = 1650;

    SaccoFarmStore.addCowMilkRecord({
      cowTag: selectedCow.tagNumber,
      cowName: selectedCow.name,
      date: modalQuickDate,
      session: modalQuickSession,
      litres,
      fatScore: 3.8,
      offtakerPrice: price,
      recorder: session?.fullName || 'Herd Manager',
    });

    notify(`Logged ${litres}L for ${selectedCow.name}.`);
    setModalQuickLitres('');
    reloadData();
  };

  // ── Register New Cattle ───────────────────────────────────────────────────
  const handleAddCattle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag || !newName) return;

    SaccoFarmStore.addCattle({
      tagNumber: newTag,
      name: newName,
      breed: newBreed,
      gender: newGender,
      ageCategory: newGender === 'Male' ? 'Bull' : 'Cow',
      stage: newStage,
      status: ['Healthy'],
      dob: '2023-01-10',
      weight: Number(newWeight),
      hasCalf: false,
      dailyAvgMilk: newStage === 'Milking' ? 20 : 0,
      sireDam: 'Sire: ABS Robust / Dam: Local Sahiwal',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: 3800000,
      color: 'Black & White',
      notes: `Registered by ${recorderName}.`,
    });

    notify(`Cattle ${newName} (${newTag}) added to herd!`);
    setNewTag('');
    setNewName('');
    setShowAddCattleModal(false);
    reloadData();
  };

  // ── Log Health ────────────────────────────────────────────────────────────
  const handleAddHealth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hlCowTag || !hlDiagnosis) return;
    const cow = cattle.find(c => c.tagNumber === hlCowTag);

    SaccoFarmStore.addHealthRecord({
      animalId: cow?.id || hlCowTag,
      tagNumber: hlCowTag,
      animalName: cow?.name || hlCowTag,
      type: hlType,
      date: today,
      diagnosis: hlDiagnosis,
      treatment: hlTreatment,
      vet: hlVet,
      cost: Number(hlCost || 0),
      status: 'Under Treatment',
      notes: `Logged by ${recorderName}.`,
    });

    notify(`Health record for ${cow?.name || hlCowTag} saved.`);
    setHlCowTag(''); setHlDiagnosis(''); setHlTreatment(''); setHlCost('');
    reloadData();
  };

  // ── Strict Filtering for Milk Records ─────────────────────────────────────
  const filteredCowMilkRecords = cowMilkRecords.filter(rec => {
    // 1. Strict Search: only matching rows stay
    if (milkTableSearch.trim()) {
      const q = milkTableSearch.toLowerCase().trim();
      const matchCow = rec.cowTag.toLowerCase().includes(q) || rec.cowName.toLowerCase().includes(q) || (rec.recorder && rec.recorder.toLowerCase().includes(q));
      if (!matchCow) return false;
    }

    // 2. Date Filtering
    if (milkDateFilterMode === 'day') {
      return rec.date === calendarSelectedDate;
    }
    if (milkDateFilterMode === 'week') {
      const targetDate = new Date(calendarSelectedDate);
      const weekStart = new Date(targetDate.getTime() - 7 * 86400000).toISOString().split('T')[0];
      return rec.date >= weekStart && rec.date <= calendarSelectedDate;
    }
    if (milkDateFilterMode === 'month') {
      return rec.date.startsWith(calendarSelectedMonth);
    }
    if (milkDateFilterMode === 'year') {
      return rec.date.startsWith(calendarSelectedYear);
    }
    return true;
  });

  // ── Strict Filtering for Cattle Herd ──────────────────────────────────────
  const filteredCattle = cattle.filter(c => {
    if (cattleSearch.trim()) {
      const q = cattleSearch.toLowerCase().trim();
      const match = c.tagNumber.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.breed.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (cattleStageFilter !== 'All' && c.stage !== cattleStageFilter) {
      return false;
    }
    return true;
  });

  // ── Filtered cows for cow milk selection search ───────────────────────────
  const filteredCowsForLogging = cattle.filter(c => {
    if (!cowSearchInput.trim()) return true;
    const q = cowSearchInput.toLowerCase().trim();
    return c.tagNumber.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.breed.toLowerCase().includes(q);
  });

  // ── Minimalist & Professional PDF Report Generator (Admin & Board Only) ───
  const handleGenerateMinimalPDF = (type: 'day' | 'week' | 'month' | 'year') => {
    if (!canDownloadReports) {
      alert('Access Restricted: Official PDF reports can only be downloaded by System Administrators and Board Members.');
      return;
    }

    let reportPeriodTitle = '';
    let reportSubset: CowMilkRecord[] = [];

    if (type === 'day') {
      reportPeriodTitle = `Daily Audit Report (${reportDate})`;
      reportSubset = cowMilkRecords.filter(r => r.date === reportDate);
    } else if (type === 'week') {
      const end = new Date(reportDate);
      const start = new Date(end.getTime() - 7 * 86400000).toISOString().split('T')[0];
      reportPeriodTitle = `Weekly Summary Report (${start} to ${reportDate})`;
      reportSubset = cowMilkRecords.filter(r => r.date >= start && r.date <= reportDate);
    } else if (type === 'month') {
      reportPeriodTitle = `Monthly Comprehensive Audit (${reportMonth})`;
      reportSubset = cowMilkRecords.filter(r => r.date.startsWith(reportMonth));
    } else if (type === 'year') {
      reportPeriodTitle = `Annual Production Statement (Year ${reportYear})`;
      reportSubset = cowMilkRecords.filter(r => r.date.startsWith(reportYear));
    }

    const totalLitres = reportSubset.reduce((s, r) => s + r.litres, 0);
    const totalRev = reportSubset.reduce((s, r) => s + r.revenue, 0);
    const uniqueCows = new Set(reportSubset.map(r => r.cowTag)).size;
    const avgYield = uniqueCows > 0 ? (totalLitres / uniqueCows).toFixed(1) : '0';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Diaspora Connect - ${reportPeriodTitle}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 24px;
            font-size: 11pt;
            line-height: 1.4;
          }
          .header {
            border-bottom: 2px solid #059669;
            padding-bottom: 16px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .title {
            font-size: 18pt;
            font-weight: 800;
            color: #064e3b;
            margin: 0 0 4px 0;
            letter-spacing: -0.5px;
          }
          .subtitle {
            font-size: 10pt;
            color: #475569;
            font-weight: 600;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .badge {
            background: #ecfdf5;
            color: #047857;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 9pt;
            font-weight: bold;
            border: 1px solid #a7f3d0;
          }
          .kpi-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .kpi-card {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px;
            background: #f8fafc;
          }
          .kpi-label {
            font-size: 8pt;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .kpi-value {
            font-size: 14pt;
            font-weight: 800;
            color: #0f172a;
            font-family: monospace;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5pt;
            margin-bottom: 30px;
          }
          th {
            background: #0f172a;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 8px 10px;
            font-size: 8.5pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
          }
          tr:nth-child(even) { background: #f8fafc; }
          .total-row {
            font-weight: 800;
            background: #ecfdf5 !important;
            border-top: 2px solid #059669;
          }
          .sign-section {
            margin-top: 40px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            padding-top: 20px;
            border-top: 1px dashed #cbd5e1;
            font-size: 9pt;
          }
          .sign-box {
            text-align: center;
          }
          .sign-line {
            border-bottom: 1px solid #94a3b8;
            margin-top: 35px;
            margin-bottom: 6px;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">Diaspora Connect Farmers SACCO</h1>
            <p class="subtitle">Luwero Dairy Operations Node &middot; Official Audit Statement</p>
            <p style="margin: 4px 0 0 0; font-size: 9pt; color: #64748b;">
              Off-taker: Brookside Dairy Uganda Ltd &middot; Price: UGX 1,650/L
            </p>
          </div>
          <div class="badge">
            ${reportPeriodTitle}
          </div>
        </div>

        <div class="kpi-row">
          <div class="kpi-card">
            <div class="kpi-label">Total Volume Collected</div>
            <div class="kpi-value">${totalLitres.toFixed(1)} L</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Gross Farm Revenue</div>
            <div class="kpi-value">UGX ${totalRev.toLocaleString()}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Active Contributing Cows</div>
            <div class="kpi-value">${uniqueCows} Head</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Avg Yield per Cow</div>
            <div class="kpi-value">${avgYield} L</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Cow Tag</th>
              <th>Cow Name</th>
              <th>Session</th>
              <th style="text-align: right;">Litres</th>
              <th style="text-align: right;">Price / L</th>
              <th style="text-align: right;">Revenue (UGX)</th>
              <th>Recorder</th>
            </tr>
          </thead>
          <tbody>
            ${reportSubset.map(r => `
              <tr>
                <td>${r.date}</td>
                <td><b>${r.cowTag}</b></td>
                <td>${r.cowName}</td>
                <td>${r.session}</td>
                <td style="text-align: right; font-family: monospace; font-weight: bold;">${r.litres.toFixed(1)}L</td>
                <td style="text-align: right; font-family: monospace;">${r.offtakerPrice.toLocaleString()}</td>
                <td style="text-align: right; font-family: monospace; font-weight: bold; color: #047857;">${r.revenue.toLocaleString()}</td>
                <td>${r.recorder || 'Staff'}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="4">TOTAL AGGREGATED PRODUCTION</td>
              <td style="text-align: right; font-family: monospace;">${totalLitres.toFixed(1)}L</td>
              <td colspan="2"></td>
              <td style="text-align: right; font-family: monospace; color: #065f46;">UGX ${totalRev.toLocaleString()}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div class="sign-section">
          <div class="sign-box">
            <div class="sign-line"></div>
            <strong>Joseph Mugisha</strong><br/>
            <span>Luwero Farm Operations Manager</span>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <strong>Mrs. Miriam Halera</strong><br/>
            <span>Chief Accountant &middot; SACCO</span>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <strong>Mr. Nyanzi Edrine</strong><br/>
            <span>Board Chairperson &middot; Governance</span>
          </div>
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.print();
    }
    setShowReportModal(false);
  };

  const handleLogout = () => { clearSession(); navigate('/signin'); };

  return (
    <div className={`min-h-screen flex antialiased font-sans selection:bg-emerald-600 selection:text-white ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden" />
      )}

      {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────── */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 p-4 flex flex-col justify-between shrink-0 shadow-2xl transition-transform duration-200 overflow-y-auto ${
        isDark ? 'bg-slate-900 border-r border-slate-800' : 'bg-white border-r border-slate-200'
      } ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-white shadow-lg shadow-emerald-900/30 text-lg">
                DC
              </div>
              <div>
                <h1 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white leading-tight">Diaspora Connect</h1>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold tracking-wider uppercase">FARM NODE</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white md:hidden">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            {[
              { id: 'per_cow' as const, label: 'Dairy', icon: <Milk className="w-4 h-4" />, badge: cowMilkRecords.length },
              { id: 'feeds' as const, label: 'Feeds', icon: <TrendingUp className="w-4 h-4" />, badge: feeds.length },
              { id: 'cattle' as const, label: 'Cows', icon: <ShieldCheck className="w-4 h-4" />, badge: cattle.length },
              { id: 'health' as const, label: 'Health', icon: <HeartPulse className="w-4 h-4" />, badge: healthRecords.length },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === item.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800'
                }`}>
                  {item.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {canDownloadReports && (
            <button
              onClick={() => setShowReportModal(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Download Audit PDF</span>
              </div>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-200/50 dark:bg-blue-800/50">Admin/Board</span>
            </button>
          )}

          <button
            onClick={toggleTheme}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition border ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {isDark ? <Sun className="w-4 h-4 text-emerald-400" /> : <Moon className="w-4 h-4 text-emerald-600" />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <span className="text-[10px] font-mono uppercase text-slate-500">{themeMode}</span>
          </button>

          <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <Building className="w-4 h-4" />
            <span>Public Website</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <header className={`sticky top-0 z-30 backdrop-blur border-b px-4 sm:px-6 py-3.5 flex items-center justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-xl md:hidden bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Luwero Dairy Operations Node</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">Dairy Herd &amp; Milk Production Records</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canDownloadReports ? (
              <button
                onClick={() => setShowReportModal(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF Reports</span>
              </button>
            ) : (
              <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>PDF: Admin/Board Only</span>
              </span>
            )}

            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4 text-emerald-400" /> : <Moon className="w-4 h-4 text-emerald-600" />}
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

        <main className="p-4 sm:p-6 space-y-6 flex-1 overflow-auto pb-24 md:pb-6">
          {/* ═══════════════════════════════════════════════════════════════════
              TAB: PER-COW MILK ENTRY & RECORDS
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'per_cow' && (
            <div className="space-y-6">
              {/* Top Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase">Total Herd Size</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">{cattle.length} Head</div>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">{cattle.filter(c => c.stage === 'Milking').length} Currently Milking</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase">Filtered Records Volume</span>
                  <div className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono mt-1">
                    {filteredCowMilkRecords.reduce((s, r) => s + r.litres, 0).toFixed(1)} L
                  </div>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{filteredCowMilkRecords.length} Session Logs</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase">Brookside Gross Revenue</span>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">
                    UGX {filteredCowMilkRecords.reduce((s, r) => s + r.revenue, 0).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">@ UGX 1,650 / Litre</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase">Official Audit Reports</span>
                  <div className="text-sm font-black text-slate-900 dark:text-white mt-2">
                    {canDownloadReports ? (
                      <button
                        onClick={() => setShowReportModal(true)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Daily / Monthly PDF</span>
                      </button>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Restricted (Admin/Board)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* PER-COW MILK ENTRY FORM (With Cow Search) */}
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Record Milk Collection</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Search and pick an individual cow to log its session output</p>
                  </div>
                  {selectedCowForMilk && (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-500/30">
                      Selected: {selectedCowForMilk.tagNumber} ({selectedCowForMilk.name})
                    </span>
                  )}
                </div>

                <form onSubmit={handleAddPerCowMilk} className="space-y-4 text-xs">
                  {/* Cow Search & Selection */}
                  <div className="space-y-2">
                    <label className="block font-bold text-slate-800 dark:text-slate-300">
                      1. Search &amp; Select Cow *
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search cow by tag (e.g. DC-H01) or name (e.g. Kyomu)..."
                        value={cowSearchInput}
                        onChange={e => setCowSearchInput(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-slate-900 dark:text-white font-bold placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                      />
                      {cowSearchInput && (
                        <button type="button" onClick={() => setCowSearchInput('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Quick Selection Buttons for Cows - Strictly Filtered */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1 max-h-48 overflow-y-auto">
                      {filteredCowsForLogging.map(c => {
                        const isSelected = selectedCowForMilk?.id === c.id;
                        return (
                          <button
                            type="button"
                            key={c.id}
                            onClick={() => setSelectedCowForMilk(c)}
                            className={`p-2.5 rounded-xl border-2 text-left transition ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-slate-900 dark:text-white'
                            }`}
                          >
                            <p className="font-mono font-black text-xs">{c.tagNumber}</p>
                            <p className={`text-[11px] truncate font-bold ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>{c.name}</p>
                            <span className={`text-[9px] uppercase font-bold ${isSelected ? 'text-emerald-100' : 'text-emerald-700 dark:text-emerald-400'}`}>
                              {c.stage}
                            </span>
                          </button>
                        );
                      })}
                      {filteredCowsForLogging.length === 0 && (
                        <div className="col-span-full py-4 text-center text-slate-500 text-xs font-bold">
                          No cows matching "{cowSearchInput}" found.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Yield Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-300 mb-1">Date *</label>
                      <input
                        type="date"
                        required
                        value={milkDate}
                        onChange={e => setMilkDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-300 mb-1">Milking Session *</label>
                      <select
                        value={milkSession}
                        onChange={e => setMilkSession(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Morning">Morning Session</option>
                        <option value="Afternoon">Afternoon Session</option>
                        <option value="Evening">Evening Session</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-800 dark:text-slate-300 mb-1">Litres Collected *</label>
                      <input
                        type="number"
                        required
                        step="0.1"
                        min="0.1"
                        placeholder="e.g. 14.5"
                        value={milkLitres}
                        onChange={e => setMilkLitres(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-black text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition shadow-md flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>SAVE MILK RECORD</span>
                  </button>
                </form>
              </div>

              {/* STRICT SEARCHABLE MILK RECORDS TABLE */}
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Historical Milk Records</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Filter by specific calendar day, week, month, or search by cow</p>
                  </div>

                  {/* Quick Filter Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { key: 'all' as const, label: 'All Records' },
                      { key: 'day' as const, label: 'Calendar Day' },
                      { key: 'week' as const, label: 'Week' },
                      { key: 'month' as const, label: 'Month' },
                      { key: 'year' as const, label: 'Year' },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setMilkDateFilterMode(f.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          milkDateFilterMode === f.key
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Controls Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {/* Strict Table Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Strict search cow tag, name..."
                      value={milkTableSearch}
                      onChange={e => setMilkTableSearch(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-7 py-1.5 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                    {milkTableSearch && (
                      <button onClick={() => setMilkTableSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Calendar Date Picker for Day or Week */}
                  {(milkDateFilterMode === 'day' || milkDateFilterMode === 'week') && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                        {milkDateFilterMode === 'day' ? 'Day:' : 'Week Ending:'}
                      </span>
                      <input
                        type="date"
                        value={calendarSelectedDate}
                        onChange={e => setCalendarSelectedDate(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}

                  {/* Month Picker */}
                  {milkDateFilterMode === 'month' && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0">Month:</span>
                      <input
                        type="month"
                        value={calendarSelectedMonth}
                        onChange={e => setCalendarSelectedMonth(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}

                  {/* Year Picker */}
                  {milkDateFilterMode === 'year' && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0">Year:</span>
                      <select
                        value={calendarSelectedYear}
                        onChange={e => setCalendarSelectedYear(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="2027">2027</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                      </select>
                    </div>
                  )}

                  {/* PDF Download Trigger */}
                  <div className="flex items-center justify-end">
                    {canDownloadReports ? (
                      <button
                        onClick={() => setShowReportModal(true)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Report (PDF)</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-400" /> PDF Download: Admin/Board
                      </span>
                    )}
                  </div>
                </div>

                {/* The Records Table (Strict Filtering) */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Cow Tag</th>
                        <th className="p-3">Cow Name</th>
                        <th className="p-3">Session</th>
                        <th className="p-3 text-right">Litres</th>
                        <th className="p-3 text-right">Price/L</th>
                        <th className="p-3 text-right">Revenue (UGX)</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                      {filteredCowMilkRecords.map(r => {
                        const cow = cattle.find(c => c.tagNumber === r.cowTag);
                        return (
                          <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-3 text-slate-700 dark:text-slate-300">{r.date}</td>
                            <td className="p-3 font-bold text-emerald-700 dark:text-emerald-400">
                              <button
                                onClick={() => cow && handleOpenCowModal(cow)}
                                className="underline-offset-2 hover:underline cursor-pointer text-left"
                              >
                                {r.cowTag}
                              </button>
                            </td>
                            <td className="p-3 font-sans font-bold text-slate-900 dark:text-white">{r.cowName}</td>
                            <td className="p-3 font-sans text-blue-700 dark:text-blue-400 font-bold">{r.session}</td>
                            <td className="p-3 text-right font-black text-slate-900 dark:text-white">{r.litres.toFixed(1)}L</td>
                            <td className="p-3 text-right text-slate-600 dark:text-slate-400">{r.offtakerPrice.toLocaleString()}</td>
                            <td className="p-3 text-right font-black text-emerald-700 dark:text-emerald-400">UGX {r.revenue.toLocaleString()}</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => {
                                  if (confirm(`Delete this milk record (${r.litres}L for ${r.cowName})?`)) {
                                    SaccoFarmStore.deleteCowMilkRecord(r.id);
                                    reloadData();
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600"
                                title="Delete record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredCowMilkRecords.length > 0 && (
                        <tr className="bg-slate-50 dark:bg-slate-950 font-bold text-xs">
                          <td colSpan={4} className="p-3 font-sans text-slate-900 dark:text-white">TOTAL FILTERED PRODUCTION</td>
                          <td className="p-3 text-right font-black text-blue-700 dark:text-blue-400">
                            {filteredCowMilkRecords.reduce((s, r) => s + r.litres, 0).toFixed(1)}L
                          </td>
                          <td colSpan={2}></td>
                          <td className="p-3 text-right font-black text-emerald-700 dark:text-emerald-400">
                            UGX {filteredCowMilkRecords.reduce((s, r) => s + r.revenue, 0).toLocaleString()}
                          </td>
                          <td></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {filteredCowMilkRecords.length === 0 && (
                    <div className="py-8 text-center text-slate-500 font-bold text-xs">
                      No milk records found for the selected filter or search term "{milkTableSearch}".
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB: CATTLE HERD REGISTRY (CLICKABLE COWS, EDIT, ADJUST, FEMALE MILK)
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'cattle' && (
            <div className="space-y-6">
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Cattle Herd Registry</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Tap any cow to adjust details, edit, delete, or inspect individual milk yield</p>
                </div>
                <button
                  onClick={() => setShowAddCattleModal(true)}
                  className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 self-start"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Register New Animal</span>
                </button>
              </div>

              {/* Strict Search & Filter Row */}
              <div className="flex flex-col sm:flex-row gap-3 p-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search cattle by tag (DC-H01), name (Kyomu), breed..."
                    value={cattleSearch}
                    onChange={e => setCattleSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                  {cattleSearch && (
                    <button onClick={() => setCattleSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {(['All', 'Milking', 'Pregnant', 'Dry', 'Heifer', 'Calf', 'Bull'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setCattleStageFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        cattleStageFilter === st
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* CLICKABLE COWS GRID (STRICT FILTERING) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCattle.map(cow => {
                  const cowMilk = cowMilkRecords.filter(r => r.cowTag === cow.tagNumber);
                  const cowTotalMilk = cowMilk.reduce((s, r) => s + r.litres, 0);

                  return (
                    <div
                      key={cow.id}
                      onClick={() => handleOpenCowModal(cow)}
                      className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-500 shadow-sm hover:shadow-md transition cursor-pointer space-y-3 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">
                          {cow.tagNumber}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cow.stage === 'Milking' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300' :
                            cow.stage === 'Pregnant' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {cow.stage}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                            {cow.gender || 'Female'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">
                          {cow.name}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                          {cow.breed} &middot; {cow.weight || 500} kg
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Recorded Milk</span>
                          <span className="font-bold text-slate-900 dark:text-white">{cowTotalMilk.toFixed(1)}L total</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Status</span>
                          <span className={`font-bold ${
                            cow.status && cow.status.some(s => s.toLowerCase().includes('sick'))
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}>
                            {cow.status && cow.status.some(s => s.toLowerCase().includes('sick')) ? 'Sick' : 'Healthy'}
                          </span>
                        </div>
                      </div>

                      {/* Explicit Sickness Toggle Buttons */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                        <span className="text-[11px] text-slate-500 font-bold">Clinical State:</span>
                        <div className="flex gap-1.5">
                          {cow.status && cow.status.some(s => s.toLowerCase().includes('sick')) ? (
                            <button
                              onClick={() => handleMarkHealthy(cow)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] uppercase shadow-sm"
                            >
                              NOW HEALTHY
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenMarkSick(cow)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] uppercase shadow-sm"
                            >
                              NOW SICK
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition">
                        <span>Tap to edit, adjust or view records &rarr;</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredCattle.length === 0 && (
                <div className="p-12 text-center bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
                  <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-base font-bold text-slate-900 dark:text-white">No matching cattle found</p>
                  <p className="text-xs text-slate-500">Search term "{cattleSearch}" yielded no animals.</p>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB: HEALTH RECORDS
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Log Veterinary / Health Record</h3>
                <form onSubmit={handleAddHealth} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cow Tag *</label>
                      <select
                        value={hlCowTag}
                        onChange={e => setHlCowTag(e.target.value)}
                        required
                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">Select cow...</option>
                        {cattle.map(c => <option key={c.id} value={c.tagNumber}>{c.tagNumber} — {c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Record Type</label>
                      <select
                        value={hlType}
                        onChange={e => setHlType(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                      >
                        <option>Treatment</option>
                        <option>Vaccination</option>
                        <option>Deworming</option>
                        <option>Vet Visit</option>
                        <option>Mortality</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Diagnosis / Condition *</label>
                      <input
                        type="text"
                        required
                        value={hlDiagnosis}
                        onChange={e => setHlDiagnosis(e.target.value)}
                        placeholder="e.g. Mastitis, ECF, Routine Check"
                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Treatment / Medication</label>
                      <input
                        type="text"
                        value={hlTreatment}
                        onChange={e => setHlTreatment(e.target.value)}
                        placeholder="e.g. Oxytetracycline 20ml"
                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Attending Vet</label>
                      <input
                        type="text"
                        value={hlVet}
                        onChange={e => setHlVet(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Treatment Cost (UGX)</label>
                      <input
                        type="number"
                        value={hlCost}
                        onChange={e => setHlCost(e.target.value)}
                        placeholder="e.g. 45000"
                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition shadow-md"
                  >
                    Save Health Record
                  </button>
                </form>
              </div>

              {/* Health logs table */}
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base">Recent Veterinary Logs</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Cow Tag</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Diagnosis</th>
                        <th className="p-3">Treatment</th>
                        <th className="p-3">Vet</th>
                        <th className="p-3 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {healthRecords.map(h => (
                        <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-3 text-slate-600 dark:text-slate-400 font-mono">{h.date}</td>
                          <td className="p-3 font-bold text-emerald-700 dark:text-emerald-400 font-mono">{h.tagNumber}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{h.animalName}</td>
                          <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">{h.diagnosis}</td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">{h.treatment}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{h.vet}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">UGX {h.cost.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB: FEEDS MANAGEMENT
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'feeds' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Feeds Stock Register</h3>
                  <p className="text-xs text-slate-500">Track bought feeds and zero-cost farm-made feeds (Silage, Hay, Grazing)</p>
                </div>
                <button
                  onClick={() => setShowAddFeedModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md"
                >
                  ADD FEED BATCH
                </button>
              </div>

              {/* Feeds KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Feed Stock Items', value: `${feeds.length} types`, color: 'text-slate-900 dark:text-white' },
                  { label: 'Farm-Made Feeds', value: `${feeds.filter(f => f.source === 'FARM_MADE').length} batches`, color: 'text-emerald-700 dark:text-emerald-400' },
                  { label: 'Purchased Feeds', value: `${feeds.filter(f => f.source === 'BOUGHT').length} batches`, color: 'text-blue-700 dark:text-blue-400' },
                  { label: 'Total Feed Valuation', value: `UGX ${feeds.reduce((s, f) => s + (f.totalCost || 0), 0).toLocaleString()}`, color: 'text-slate-900 dark:text-white' },
                ].map((k, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                    <span className="text-xs text-slate-500 uppercase font-bold">{k.label}</span>
                    <div className={`text-xl font-black font-mono mt-1 ${k.color}`}>{k.value}</div>
                  </div>
                ))}
              </div>

              {/* Feeds Table */}
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Current Feed Inventory</h4>
                  <span className="text-xs font-mono font-bold text-slate-400">{feeds.length} stock items</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/50">
                      <tr>
                        {['Feed Type', 'Source', 'Current Stock', 'Unit Cost', 'Total Value', 'Date Added', 'Actions'].map(h => (
                          <th key={h} className="text-left text-slate-800 dark:text-slate-300 font-bold uppercase text-[11px] py-2 px-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {feeds.map(f => (
                        <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
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
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {f.source === 'FARM_MADE' ? 'UGX 0' : `UGX ${(f.totalCost || 0).toLocaleString()}`}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono">{f.lastUpdated}</td>
                          <td className="py-2.5 px-3">
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
                                title="Delete feed batch"
                              >
                                DELETE
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {feeds.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 font-bold">
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

          {/* ═══════════════════════════════════════════════════════════════════
              TAB: CHAT & COMMUNITY MESSAGING
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Community &amp; Member Messaging</h3>
                  <p className="text-xs text-slate-500">Live communication with farmers, SACCO members, and administrative staff</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  SACCO Live Network
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-xl font-black">
                  MSG
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Farm &amp; Veterinary Communications Desk</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Send milk supply updates, bulk collection schedules, and veterinary announcements directly to dairy members.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => notify('Dairy milk collection broadcast sent to all farmers.')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs"
                  >
                    SEND MILK BROADCAST
                  </button>
                  <button
                    onClick={() => notify('Farm veterinary notification posted.')}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    POST VET ADVISORY
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB: SETTINGS
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Farm Node Settings</h3>
                <p className="text-xs text-slate-500">System configuration and veterinary preferences</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Luwero Dairy Node Config</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Active Dairy Node</span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">Luwero Central Dairy Farm</p>
                    <p className="text-slate-500 text-[11px]">Primary bulk chilling &amp; pasteurization center</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Bulk Tank Milk Rate</span>
                    <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">UGX 1,650 / Litre</p>
                    <p className="text-slate-500 text-[11px]">Core offtaker delivery contract</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          COW DETAIL, ADJUSTMENT & FEMALE MILK RECORDS MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
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
                <span>Sickness &amp; Health History</span>
              </button>
              <button
                onClick={() => setCowModalTab('edit')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  cowModalTab === 'edit' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Adjust / Edit Cow</span>
              </button>
              {(selectedCow.gender === 'Female' || ['Milking', 'Pregnant', 'Dry', 'Heifer'].includes(selectedCow.stage)) && (
                <button
                  onClick={() => setCowModalTab('milk')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                    cowModalTab === 'milk' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Milk className="w-3.5 h-3.5" />
                  <span>Female Milk Records</span>
                </button>
              )}
            </div>

            
            {/* SUBTAB: SICKNESS & HEALTH HISTORY */}
            {cowModalTab === 'health' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Current Clinical Condition</span>
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
                      : (SaccoFarmStore.getAllHealthRecords ? SaccoFarmStore.getAllHealthRecords().filter(r => r.cowTag === selectedCow.tagNumber || r.cowId === selectedCow.id) : []);

                    return (
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Diagnosis</th>
                            <th className="p-2.5">Symptoms &amp; Rx</th>
                            <th className="p-2.5">Vet</th>
                            <th className="p-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                          {cowSicknessEvents.map((rec, rIdx) => (
                            <tr key={rec.id || rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
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
                              <td colSpan={5} className="p-4 text-center text-slate-400 font-bold font-sans">
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
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Animal from Herd</span>
                  </button>
                  <button
                    onClick={() => setCowModalTab('edit')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit / Adjust Cow</span>
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
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
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
                          <tr>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Session</th>
                            <th className="p-2.5 text-right">Litres</th>
                            <th className="p-2.5 text-right">Revenue (UGX)</th>
                            <th className="p-2.5 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {cowRecords.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
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
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {cowRecords.length > 0 && (
                            <tr className="bg-slate-50 dark:bg-slate-950 font-bold">
                              <td colSpan={2} className="p-2.5 font-sans">TOTAL PRODUCTION</td>
                              <td className="p-2.5 text-right text-blue-700 dark:text-blue-400 font-black">{totalL.toFixed(1)}L</td>
                              <td className="p-2.5 text-right text-emerald-700 dark:text-emerald-400 font-black">UGX {totalUGX.toLocaleString()}</td>
                              <td></td>
                            </tr>
                          )}
                          {cowRecords.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-slate-500 font-bold font-sans">
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

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: REGISTER NEW CATTLE
         ═══════════════════════════════════════════════════════════════════════ */}
      {showAddCattleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-black text-base">Register New Cattle</h3>
              </div>
              <button onClick={() => setShowAddCattleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCattle} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tag Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DC-H12"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Animal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Busingye"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Breed *</label>
                  <select
                    value={newBreed}
                    onChange={e => setNewBreed(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Friesian Cross">Friesian Cross</option>
                    <option value="Jersey">Jersey Pure</option>
                    <option value="Friesian Pure">Friesian Pure</option>
                    <option value="Boran">Boran</option>
                    <option value="Sahiwal">Sahiwal</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Gender *</label>
                  <select
                    value={newGender}
                    onChange={e => setNewGender(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Production Stage *</label>
                  <select
                    value={newStage}
                    onChange={e => setNewStage(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Milking">Milking</option>
                    <option value="Pregnant">Pregnant</option>
                    <option value="Dry">Dry Cow</option>
                    <option value="Heifer">Heifer</option>
                    <option value="Bull">Bull</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={newWeight}
                    onChange={e => setNewWeight(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCattleModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md"
                >
                  Register Animal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: OFFICIAL PDF AUDIT REPORT EXPORT (ADMIN & BOARD ONLY)
         ═══════════════════════════════════════════════════════════════════════ */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-slate-900 dark:text-white animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-base">Generate Milk Audit Report (PDF)</h3>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-400">
                Select audit scope. Generates a minimalist, professional report for management and external Brookside reconciliation.
              </p>

              {/* Scope Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'day' as const, label: 'Single Day' },
                  { key: 'week' as const, label: 'Weekly' },
                  { key: 'month' as const, label: 'Monthly' },
                  { key: 'year' as const, label: 'Yearly' },
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setReportType(item.key)}
                    className={`py-2 rounded-xl font-bold border-2 transition ${
                      reportType === item.key
                        ? 'bg-blue-600 border-blue-600 text-white shadow'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Date pickers depending on report scope */}
              {(reportType === 'day' || reportType === 'week') && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {reportType === 'day' ? 'Select Calendar Day *' : 'Week Ending Date *'}
                  </label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={e => setReportDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {reportType === 'month' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Month *</label>
                  <input
                    type="month"
                    value={reportMonth}
                    onChange={e => setReportMonth(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {reportType === 'year' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Year *</label>
                  <select
                    value={reportYear}
                    onChange={e => setReportYear(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="2027">2027</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateMinimalPDF(reportType)}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black shadow-md flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Generate &amp; Print PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── ADD FEED MODAL ──────────────────────────────────────────────── */}
      {showAddFeedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setShowAddFeedModal(false)}>
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Add Feed Batch</h3>
              <button onClick={() => setShowAddFeedModal(false)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateFeed} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Feed Type / Name *</label>
                <input
                  type="text"
                  required
                  value={feedTypeInput}
                  onChange={e => setFeedTypeInput(e.target.value)}
                  placeholder="e.g. Dairy Meal, Maize Silage, Rhodes Grass Hay"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={feedQtyInput}
                    onChange={e => setFeedQtyInput(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unit</label>
                  <select
                    value={feedUnitInput}
                    onChange={e => setFeedUnitInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                  >
                    {['kg', 'bags', 'bales', 'litres', 'tonnes'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Source</label>
                <select
                  value={feedSourceInput}
                  onChange={e => setFeedSourceInput(e.target.value as 'BOUGHT' | 'FARM_MADE')}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="FARM_MADE">Made at Farm (UGX 0 Cost)</option>
                  <option value="BOUGHT">Bought / Purchased External</option>
                </select>
              </div>
              {feedSourceInput === 'BOUGHT' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unit Cost (UGX)</label>
                  <input
                    type="number"
                    min="0"
                    value={feedUnitCostInput}
                    onChange={e => setFeedUnitCostInput(e.target.value)}
                    placeholder="e.g. 3500"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFeedModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-md"
                >
                  SAVE FEED BATCH
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── USE FEED MODAL ──────────────────────────────────────────────── */}
      {showUseFeedModal && selectedFeedForUse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setShowUseFeedModal(false)}>
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Record Feed Usage</h3>
                <p className="text-xs text-slate-500">{selectedFeedForUse.feedType} (Stock: {selectedFeedForUse.currentStock} {selectedFeedForUse.unit})</p>
              </div>
              <button onClick={() => setShowUseFeedModal(false)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmUseFeed} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Quantity Used ({selectedFeedForUse.unit}) *</label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="0.1"
                  max={selectedFeedForUse.currentStock}
                  value={feedUseQty}
                  onChange={e => setFeedUseQty(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Usage Notes / Barn</label>
                <input
                  type="text"
                  value={feedUseNotes}
                  onChange={e => setFeedUseNotes(e.target.value)}
                  placeholder="e.g. Morning milking ration for lactating cows"
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
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Mark Cow Sick &amp; Record Treatment</h3>
                <p className="text-xs text-slate-500">{sicknessCow.name} ({sicknessCow.tagNumber})</p>
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
                  placeholder="e.g. Hard swollen udder quarter, high body temperature, limping"
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
                    placeholder="e.g. Penicillin G, Oxytetracycline"
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

          {/* Mobile Bottom Navigation Bar (Home, Dashboard, Chat, Settings) */}
      <PortalBottomNav
        currentTab={activeTab === 'per_cow' ? 'dashboard' : activeTab}
        onSelectTab={t => {
          if (t === 'dashboard') setActiveTab('per_cow');
          else if (t === 'chat') setActiveTab('chat');
          else if (t === 'settings') setActiveTab('settings');
          else setActiveTab(t as any);
        }}
        dashboardTab="dashboard"
      />
    </div>
  );
}
