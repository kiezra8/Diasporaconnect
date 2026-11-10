// Centralized State & Persistence Service for Diaspora Connect Portals & Management Systems
// Reverse engineered from enterprise SACCO & Farm management specifications (JBS Farm Enterprise Model)

const STORAGE_KEY = 'diaspora_connect_portal_state_v2';
const AUTH_KEY = 'diaspora_connect_auth_session';

export const AUTHORIZED_TESTER = {
  email: 'israelezrakisakye@gmail.com',
  password: '88888888',
  name: 'Israel Ezra Kisakye',
  memberNo: 'DCF-8492-UG',
  joinedDate: 'January 14, 2024'
};

const INITIAL_DATA = {
  // ── 1. CLIENT / MEMBER PROFILE ──
  client: {
    name: 'Israel Ezra Kisakye',
    email: 'israelezrakisakye@gmail.com',
    memberNo: 'DCF-8492-UG',
    chapter: 'Diaspora Uganda Chapter',
    sharesCount: 150,
    shareUnitPrice: 100000, // 100,000 UGX
    totalShareValue: 15000000,
    savingsBalance: 4850000,
    totalPortfolio: 19850000,
    dividendsYTD: 1420000,
    heifersAllocated: 5,
    coffeeAcreageAllocated: '2.5 Acres',
    ownershipPercentage: '1.25%'
  },

  // ── 2. AUDITED FINANCIAL LEDGER ──
  financialStatement: [
    {
      id: 'TX-901',
      date: '2026-11-08',
      description: 'Coffee Export Trading Surplus Dividend (Shipment #CS-501)',
      type: 'coffee_dividend',
      category: 'Coffee Trading Sync',
      amount: 450000,
      balance: 19850000,
      status: 'Completed',
      ref: 'COF-DIV-501'
    },
    {
      id: 'TX-892',
      date: '2026-11-02',
      description: 'Commercial Dairy Milk Off-take Dividend (Mbarara & Luwero Depots)',
      type: 'farm_dividend',
      category: 'Farm System Sync',
      amount: 380000,
      balance: 19400000,
      status: 'Completed',
      ref: 'FARM-DIV-1102'
    },
    {
      id: 'TX-870',
      date: '2026-10-15',
      description: 'Monthly SACCO Share Capital Deposit (Bank Wire Stanbic)',
      type: 'deposit',
      category: 'Member Deposit',
      amount: 1000000,
      balance: 19020000,
      status: 'Completed',
      ref: 'DEP-8492-10'
    },
    {
      id: 'TX-855',
      date: '2026-09-30',
      description: 'Q3 SACCO Surplus Interest Distribution',
      type: 'dividend',
      category: 'SACCO Core Sync',
      amount: 590000,
      balance: 18020000,
      status: 'Completed',
      ref: 'SACCO-DIV-Q3'
    },
    {
      id: 'TX-820',
      date: '2026-08-14',
      description: 'Agricultural Farmland Titled Trust Allotment (Kiruhura Block 4)',
      type: 'share_purchase',
      category: 'Asset Allocation',
      amount: 5000000,
      balance: 17430000,
      status: 'Completed',
      ref: 'LAND-ASSET-04'
    }
  ],

  depositRequests: [
    {
      id: 'REQ-DEP-01',
      date: '2026-11-09',
      amount: 2000000,
      method: 'MTN Mobile Money (+256 747 325 565)',
      reference: 'MM-TX-984128',
      status: 'Pending',
      notes: 'Monthly contribution for 20 additional dairy shares'
    }
  ],

  withdrawalRequests: [],

  supportTickets: [
    {
      id: 'TCK-201',
      date: '2026-11-05',
      subject: 'Physical Farmland Tour Booking for December Visit',
      status: 'Resolved',
      priority: 'Medium',
      reply: 'Liaison desk confirmed your itinerary for Luwero Dairy Farm on Dec 18, 2026.'
    }
  ],

  // ── 3. REVERSE ENGINEERED SACCO MANAGEMENT SYSTEM (JBS FARM SPEC) ──
  saccoSystem: {
    selectedYear: 'Year 2 (2026)',
    activeTab: 'year2', // 'year1' | 'year2' | 'investors' | 'pettyCash'
    adminFeePerMember: 50000,
    // Year 2 12-Month Contribution Grid
    membersYear2: [
      {
        id: 'MB-001',
        name: 'Israel Ezra Kisakye',
        phone: '+256 747 325 565',
        nin: 'CM92019482UG',
        category: 'Saving Member & Investor',
        jan: 500000, feb: 500000, mar: 500000, apr: 500000, may: 500000, jun: 500000,
        jul: 500000, aug: 500000, sep: 500000, oct: 500000, nov: 500000, dec: 0,
        total: 5500000,
        admin: 50000,
        savings: 5450000,
        noOfShares: 54,
        status: 'CLEARED'
      },
      {
        id: 'MB-002',
        name: 'Grace Nakato Asiimwe (London UK)',
        phone: '+44 7123 456789',
        nin: 'CF89201934UG',
        category: 'Money Maker Investor',
        jan: 800000, feb: 800000, mar: 800000, apr: 800000, may: 800000, jun: 800000,
        jul: 800000, aug: 800000, sep: 800000, oct: 800000, nov: 800000, dec: 0,
        total: 8800000,
        admin: 50000,
        savings: 8750000,
        noOfShares: 87,
        status: 'CLEARED'
      },
      {
        id: 'MB-003',
        name: 'David Ochieng (Toronto Canada)',
        phone: '+1 416 555 0192',
        nin: 'CM84019283UG',
        category: 'Saving Member',
        jan: 600000, feb: 600000, mar: 600000, apr: 600000, may: 600000, jun: 600000,
        jul: 600000, aug: 600000, sep: 600000, oct: 600000, nov: 0, dec: 0,
        total: 6000000,
        admin: 50000,
        savings: 5950000,
        noOfShares: 59,
        status: 'PENDING'
      },
      {
        id: 'MB-004',
        name: 'Joseph Mugisha (Dubai UAE)',
        phone: '+971 50 123 4567',
        nin: 'CM91029384UG',
        category: 'Investor Phase 3',
        jan: 1000000, feb: 1000000, mar: 1000000, apr: 1000000, may: 1000000, jun: 1000000,
        jul: 1000000, aug: 1000000, sep: 1000000, oct: 1000000, nov: 1000000, dec: 0,
        total: 11000000,
        admin: 50000,
        savings: 10950000,
        noOfShares: 109,
        status: 'CLEARED'
      }
    ],
    // Investor & Cattle Programs (JBS Farm Model)
    investorPrograms: [
      {
        id: 'INV-01',
        name: 'Israel Ezra Kisakye',
        category: 'Money Maker',
        programAmount: 8000000,
        investmentAmount: 8000000,
        balance: 0,
        status: 'CLEARED',
        cowsPerYear: 2,
        assignedHeifers: ['JBS-001 (Friesian)', 'JBS-004 (Jersey)']
      },
      {
        id: 'INV-02',
        name: 'Grace Nakato Asiimwe',
        category: 'Money Maker',
        programAmount: 8000000,
        investmentAmount: 8000000,
        balance: 0,
        status: 'CLEARED',
        cowsPerYear: 2,
        assignedHeifers: ['JBS-002 (Friesian)', 'JBS-005 (Ayrshire)']
      },
      {
        id: 'INV-03',
        name: 'David Mukasa',
        category: 'Phase 3 Dairy Club',
        programAmount: 12000000,
        investmentAmount: 9000000,
        balance: 3000000,
        status: 'PENDING',
        cowsPerYear: 3,
        assignedHeifers: ['JBS-003 (Friesian Cross)']
      }
    ],
    // Petty Cash & Cashier Transactions
    pettyCash: [
      { id: 'PC-101', date: '2026-11-09', type: 'Income', category: 'Member Deposit', amount: 1000000, method: 'MTN MM', isBanked: true, description: 'Direct MM contribution by MB-001' },
      { id: 'PC-102', date: '2026-11-08', type: 'Income', category: 'Airtel MM', amount: 650000, method: 'Airtel MM', isBanked: false, description: 'Monthly share purchase' },
      { id: 'PC-103', date: '2026-11-06', type: 'Expense', category: 'Farm Silage Freight', amount: 480000, method: 'Cash', isBanked: true, description: 'Silage transport to Luwero depot' },
      { id: 'PC-104', date: '2026-11-04', type: 'Income', category: 'Cash', amount: 2500000, method: 'Cash', isBanked: true, description: 'Dairy milk off-take cash settlement' }
    ]
  },

  // ── 4. REVERSE ENGINEERED ENTERPRISE FARM MANAGEMENT SYSTEM (JBS FARM SPEC) ──
  farmSystem: {
    activeTab: 'animals', // 'animals' | 'milk' | 'health' | 'breeding' | 'feed'
    totalHerdCount: 105,
    lactatingCows: 58,
    dailyMilkAvgLiters: 2120,
    totalSilageTons: 159,
    // Cattle / Animals Directory
    animals: [
      { tagId: 'JBS-001', name: 'Queen Esther', breed: 'Friesian Purebred', gender: 'Female', stage: 'Money Maker / Milking', health: 'Healthy', dailyYield: '24.5 L', sire: 'Semex Bull 409', dam: 'JBS-Dam-12', paddock: 'Paddock 2 (Luwero)' },
      { tagId: 'JBS-002', name: 'Victoria Pride', breed: 'Friesian Cross', gender: 'Female', stage: 'Money Maker / Milking', health: 'Healthy', dailyYield: '22.8 L', sire: 'Alta genetics 301', dam: 'JBS-Dam-08', paddock: 'Paddock 2 (Luwero)' },
      { tagId: 'JBS-003', name: 'Kampala Star', breed: 'Jersey High-Butterfat', gender: 'Female', stage: 'In-Calf / Milking', health: 'Healthy', dailyYield: '19.2 L', sire: 'Jersey Bull 808', dam: 'JBS-Dam-15', paddock: 'Paddock 1 (Mbarara)' },
      { tagId: 'JBS-004', name: 'Rwenzori Belle', breed: 'Ayrshire Cross', gender: 'Female', stage: 'Money Maker / Milking', health: 'Healthy', dailyYield: '21.0 L', sire: 'Semex 410', dam: 'JBS-Dam-04', paddock: 'Paddock 3 (Luwero)' },
      { tagId: 'JBS-005', name: 'Ankole Gold', breed: 'Ankole Dairy Cross', gender: 'Female', stage: 'Breeding Heifer', health: 'Healthy', dailyYield: '14.0 L', sire: 'Boran Bull B-12', dam: 'JBS-Dam-01', paddock: 'Paddock 4 (Kiruhura)' },
      { tagId: 'JBS-006', name: 'Thunder Boy', breed: 'Pedigree Friesian Bull', gender: 'Male', stage: 'Breeding Bull', health: 'Healthy', dailyYield: 'N/A', sire: 'Alta genetics 101', dam: 'JBS-Dam-02', paddock: 'Bull Pen (Luwero)' }
    ],
    // Milk Production Tracker (Morning / Afternoon / Evening sessions)
    milkLogs: [
      { date: '2026-11-09', morning: 1140, afternoon: 0, evening: 980, total: 2120, chillingTemp: '3.8°C', offTaker: 'Brookside Dairy Uganda', ratePerL: 1650, totalRevenueUGX: 3498000 },
      { date: '2026-11-08', morning: 1110, afternoon: 0, evening: 960, total: 2070, chillingTemp: '3.9°C', offTaker: 'Brookside Dairy Uganda', ratePerL: 1650, totalRevenueUGX: 3415500 },
      { date: '2026-11-07', morning: 1150, afternoon: 0, evening: 990, total: 2140, chillingTemp: '3.7°C', offTaker: 'Brookside Dairy Uganda', ratePerL: 1650, totalRevenueUGX: 3531000 },
      { date: '2026-11-06', morning: 1120, afternoon: 0, evening: 950, total: 2070, chillingTemp: '3.9°C', offTaker: 'Brookside Dairy Uganda', ratePerL: 1650, totalRevenueUGX: 3415500 }
    ],
    // Health & Vaccination Records
    healthLogs: [
      { id: 'HL-01', tagId: 'JBS-001', date: '2026-11-04', condition: 'Routine Booster', treatment: 'Foot & Mouth Disease (FMD) Vaccination', vet: 'Dr. Mugabe Peter DVM', status: 'Cleared' },
      { id: 'HL-02', tagId: 'JBS-003', date: '2026-10-28', condition: 'Deworming Cycle', treatment: 'Albendazole 10% Oral Drench', vet: 'Dr. Mugabe Peter DVM', status: 'Cleared' },
      { id: 'HL-03', tagId: 'JBS-004', date: '2026-10-20', condition: 'Tick-borne Prevention', treatment: 'East Coast Fever (ECF) ITM Immunization', vet: 'Dr. Mugabe Peter DVM', status: 'Cleared' }
    ],
    // Breeding & In-Calf Schedules
    breedingLogs: [
      { id: 'BR-01', tagId: 'JBS-003', cowName: 'Kampala Star', aiDate: '2026-05-14', sireSemen: 'Semex Friesian Straw #409', expectedCalving: '2027-02-20', status: 'In-Calf Confirmed (Month 6)' },
      { id: 'BR-02', tagId: 'JBS-005', cowName: 'Ankole Gold', aiDate: '2026-07-10', sireSemen: 'Jersey High-Yield Straw #808', expectedCalving: '2027-04-18', status: 'In-Calf Confirmed (Month 4)' }
    ],
    // Feed & Nutrition Inventory
    feedStock: [
      { id: 'F-01', name: 'Maize & Napier Grass Anaerobic Silage', type: 'Roughage / Fodder', capacityTons: 120, inStockTons: 95, dailyIntakeKg: 1200 },
      { id: 'F-02', name: 'Alfalfa & Desmodium Legume Hay', type: 'High Protein Fodder', capacityTons: 80, inStockTons: 64, dailyIntakeKg: 450 },
      { id: 'F-03', name: 'Dairy Meal 18% Crude Protein Concentrate', type: 'Concentrate', capacityTons: 30, inStockTons: 18, dailyIntakeKg: 280 },
      { id: 'F-04', name: 'Mineral Salt Lick Blocks', type: 'Supplements', capacityTons: 10, inStockTons: 7, dailyIntakeKg: 40 }
    ]
  },

  // ── 5. COFFEE MANAGEMENT SYSTEM (BUYING & SELLING COFFEE) ──
  coffeeManagement: {
    stockInWarehouseKg: 42700,
    totalPurchasesUGX: 127920000,
    totalRevenueUGX: 378510000,
    netTradingSurplusUGX: 73700000,
    buyingLogs: [
      {
        id: 'CB-101',
        date: '2026-11-08',
        farmerName: 'Peter Mugabi (Mbale Outgrowers)',
        coffeeType: 'Arabica Bugisu',
        grade: 'FAQ Grade AA',
        moisture: '11.8%',
        bags: 45,
        netWeightKg: 2700,
        ratePerKg: 13500,
        totalUGX: 36450000,
        paymentStatus: 'Paid'
      },
      {
        id: 'CB-102',
        date: '2026-11-06',
        farmerName: 'Annet Nabwire (Kasese Highlands)',
        coffeeType: 'Arabica Drugar',
        grade: 'Screen 18',
        moisture: '12.0%',
        bags: 60,
        netWeightKg: 3600,
        ratePerKg: 12800,
        totalUGX: 46080000,
        paymentStatus: 'Paid'
      },
      {
        id: 'CB-103',
        date: '2026-11-04',
        farmerName: 'John Baptist Ssenfuma (Masaka Farmers)',
        coffeeType: 'Robusta Kiboko',
        grade: 'Screen 15 Clean',
        moisture: '12.2%',
        bags: 85,
        netWeightKg: 5100,
        ratePerKg: 8900,
        totalUGX: 45390000,
        paymentStatus: 'Paid'
      }
    ],
    sellingLogs: [
      {
        id: 'CS-501',
        date: '2026-11-07',
        buyerName: 'Caffè Trieste Export SpA (Italy)',
        coffeeType: 'Arabica Bugisu AA Special',
        quantityTons: 12.0,
        pricePerTonUSD: 4650,
        totalValueUSD: 55800,
        totalValueUGX: 206460000,
        profitMarginUGX: 41200000,
        status: 'Shipped & Paid',
        dividendPoolAllocatedUGX: 12000000
      },
      {
        id: 'CS-502',
        date: '2026-10-25',
        buyerName: 'Hamburg Specialty Importers (Germany)',
        coffeeType: 'Robusta Screen 18 Premium',
        quantityTons: 15.0,
        pricePerTonUSD: 3100,
        totalValueUSD: 46500,
        totalValueUGX: 172050000,
        profitMarginUGX: 32500000,
        status: 'Completed',
        dividendPoolAllocatedUGX: 9800000
      }
    ]
  },

  // ── 6. SECRETARY REGISTRY ──
  secretary: {
    minutes: [
      {
        id: 'MIN-2026-04',
        title: 'Board Resolution on Coffee Processing Line Procurement',
        date: 'November 03, 2026',
        signee: 'Mr. Helera John Bahati (Secretary)',
        summary: 'Resolution passed to acquire commercial coffee huller and destoner unit for Masaka depot.'
      },
      {
        id: 'MIN-2026-03',
        title: 'Q3 Financial Review & Interim Dairy Milk Dividend Declaration',
        date: 'October 12, 2026',
        signee: 'Mr. Helera John Bahati (Secretary)',
        summary: 'Approved payout of 590,000 UGX aggregate dividend per tier-1 shareholder.'
      }
    ]
  },

  // ── 7. BOARD OF DIRECTORS GOVERNANCE ──
  board: {
    kpis: {
      totalAssetsUGX: '2,840,000,000 UGX',
      totalMembers: 342,
      dairyCattleCount: 105,
      titledAcreage: '380 Acres Freehold',
      regulatoryCompliance: '100% (Co-operative Societies Act)'
    }
  }
};

export function getPortalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
      return INITIAL_DATA;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse portal state', err);
    return INITIAL_DATA;
  }
}

export function savePortalState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('diaspora_portal_updated'));
  } catch (err) {
    console.error('Failed to save portal state', err);
  }
}

export function getAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuthSession(session) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_KEY);
}

// ── CLIENT / MEMBER REQUESTS ──
export function submitDepositRequest(amount, method, reference, notes) {
  const state = getPortalState();
  const newReq = {
    id: `REQ-DEP-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split('T')[0],
    amount: Number(amount),
    method,
    reference,
    notes,
    status: 'Pending'
  };
  state.depositRequests.unshift(newReq);
  savePortalState(state);
  return newReq;
}

export function submitWithdrawalRequest(amount, destination, reason) {
  const state = getPortalState();
  const newReq = {
    id: `REQ-WTH-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split('T')[0],
    amount: Number(amount),
    destination,
    reason,
    status: 'Pending'
  };
  state.withdrawalRequests.unshift(newReq);
  savePortalState(state);
  return newReq;
}

export function submitSupportTicket(subject, category, message) {
  const state = getPortalState();
  const newTicket = {
    id: `TCK-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split('T')[0],
    subject: `[${category}] ${subject}`,
    status: 'Received',
    priority: 'Normal',
    reply: 'Your request has been logged with the SACCO liaison officer. Expected response within 2 hours.'
  };
  state.supportTickets.unshift(newTicket);
  savePortalState(state);
  return newTicket;
}

// ── AUTO-SYNC: APPROVE MEMBER DEPOSIT ──
export function approveDeposit(requestId) {
  const state = getPortalState();
  const req = state.depositRequests.find((r) => r.id === requestId);
  if (!req || req.status === 'Approved') return;

  req.status = 'Approved';
  const addedAmount = req.amount;

  const additionalShares = Math.floor(addedAmount / state.client.shareUnitPrice);
  state.client.sharesCount += additionalShares;
  state.client.totalShareValue = state.client.sharesCount * state.client.shareUnitPrice;
  state.client.savingsBalance += (addedAmount % state.client.shareUnitPrice);
  state.client.totalPortfolio = state.client.totalShareValue + state.client.savingsBalance;

  // Sync to Financial Statement
  const newTx = {
    id: `TX-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split('T')[0],
    description: `Approved Member Deposit (${req.method} Ref: ${req.reference})`,
    type: 'deposit',
    category: 'Deposit Approved',
    amount: addedAmount,
    balance: state.client.totalPortfolio,
    status: 'Completed',
    ref: req.reference || req.id
  };
  state.financialStatement.unshift(newTx);

  // Sync to Petty Cash
  state.saccoSystem.pettyCash.unshift({
    id: `PC-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split('T')[0],
    type: 'Income',
    category: 'Member Share Capital',
    amount: addedAmount,
    method: req.method.includes('MTN') ? 'MTN MM' : req.method.includes('Airtel') ? 'Airtel MM' : 'Bank',
    isBanked: true,
    description: `Reconciled deposit by ${state.client.name} (${req.id})`
  });

  savePortalState(state);
}

// ── AUTO-SYNC: DISTRIBUTE FARM PROCEEDS ──
export function distributeFarmDividend(totalPoolUGX = 25000000) {
  const state = getPortalState();
  const memberDividend = Math.round(totalPoolUGX * 0.0125);

  state.client.dividendsYTD += memberDividend;
  state.client.savingsBalance += memberDividend;
  state.client.totalPortfolio = state.client.totalShareValue + state.client.savingsBalance;

  const newTx = {
    id: `TX-FARM-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split('T')[0],
    description: `Commercial Dairy Milk Surplus Dividend Distribution`,
    type: 'farm_dividend',
    category: 'Farm System Sync',
    amount: memberDividend,
    balance: state.client.totalPortfolio,
    status: 'Completed',
    ref: `DAIRY-POOL-${Date.now().toString().slice(-4)}`
  };
  state.financialStatement.unshift(newTx);

  savePortalState(state);
  return memberDividend;
}

// ── SACCO MANAGEMENT ACTIONS (JBS FARM SPEC) ──
export function addSaccoMemberYear2(member) {
  const state = getPortalState();
  const newMember = {
    id: `MB-${String(state.saccoSystem.membersYear2.length + 1).padStart(3, '0')}`,
    ...member,
    admin: state.saccoSystem.adminFeePerMember,
    status: 'CLEARED'
  };
  state.saccoSystem.membersYear2.push(newMember);
  savePortalState(state);
  return newMember;
}

export function togglePettyCashBanked(txId) {
  const state = getPortalState();
  const tx = state.saccoSystem.pettyCash.find((t) => t.id === txId);
  if (tx) {
    tx.isBanked = !tx.isBanked;
    savePortalState(state);
  }
}

// ── FARM MANAGEMENT ACTIONS (JBS FARM SPEC) ──
export function addCattleAnimal(animal) {
  const state = getPortalState();
  state.farmSystem.animals.unshift(animal);
  state.farmSystem.totalHerdCount += 1;
  savePortalState(state);
  return animal;
}

export function logDailyMilkSession(session) {
  const state = getPortalState();
  const total = Number(session.morning) + Number(session.afternoon || 0) + Number(session.evening);
  const revenue = total * Number(session.ratePerL);
  const log = {
    date: session.date || new Date().toISOString().split('T')[0],
    morning: Number(session.morning),
    afternoon: Number(session.afternoon || 0),
    evening: Number(session.evening),
    total,
    chillingTemp: session.chillingTemp || '3.8°C',
    offTaker: session.offTaker || 'Brookside Dairy Uganda',
    ratePerL: Number(session.ratePerL),
    totalRevenueUGX: revenue
  };
  state.farmSystem.milkLogs.unshift(log);
  state.farmSystem.dailyMilkAvgLiters = total;
  savePortalState(state);
  return log;
}

// ── COFFEE MANAGEMENT ACTIONS ──
export function addCoffeePurchase(purchase) {
  const state = getPortalState();
  const newLog = {
    id: `CB-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split('T')[0],
    ...purchase,
    paymentStatus: 'Paid'
  };
  state.coffeeManagement.buyingLogs.unshift(newLog);
  state.coffeeManagement.stockInWarehouseKg += Number(purchase.netWeightKg);
  state.coffeeManagement.totalPurchasesUGX += Number(purchase.totalUGX);
  savePortalState(state);
  return newLog;
}

export function addCoffeeSaleAndDistribute(sale, dividendAllocationUGX = 15000000) {
  const state = getPortalState();
  const newSale = {
    id: `CS-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split('T')[0],
    ...sale,
    status: 'Completed',
    dividendPoolAllocatedUGX: dividendAllocationUGX
  };
  state.coffeeManagement.sellingLogs.unshift(newSale);
  state.coffeeManagement.stockInWarehouseKg = Math.max(0, state.coffeeManagement.stockInWarehouseKg - (Number(sale.quantityTons) * 1000));
  state.coffeeManagement.totalRevenueUGX += Number(sale.totalValueUGX);
  state.coffeeManagement.netTradingSurplusUGX += Number(sale.profitMarginUGX);

  // Auto-distribute share to client
  const clientShare = Math.round(dividendAllocationUGX * 0.0125);
  state.client.dividendsYTD += clientShare;
  state.client.savingsBalance += clientShare;
  state.client.totalPortfolio = state.client.totalShareValue + state.client.savingsBalance;

  const newTx = {
    id: `TX-COF-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split('T')[0],
    description: `Coffee Export Profit Dividend (${sale.buyerName} - ${sale.coffeeType})`,
    type: 'coffee_dividend',
    category: 'Coffee Trading Sync',
    amount: clientShare,
    balance: state.client.totalPortfolio,
    status: 'Completed',
    ref: newSale.id
  };
  state.financialStatement.unshift(newTx);

  savePortalState(state);
  return clientShare;
}
