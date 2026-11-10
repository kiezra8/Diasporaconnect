// Centralized State & Persistence Service for Diaspora Connect Portals & Management Systems
const STORAGE_KEY = 'diaspora_connect_portal_state_v1';
const AUTH_KEY = 'diaspora_connect_auth_session';

export const AUTHORIZED_TESTER = {
  email: 'israelezrakisakye@gmail.com',
  password: '88888888',
  name: 'Israel Ezra Kisakye',
  memberNo: 'DCF-8492-UG',
  joinedDate: 'January 14, 2024'
};

const INITIAL_DATA = {
  client: {
    name: 'Israel Ezra Kisakye',
    email: 'israelezrakisakye@gmail.com',
    memberNo: 'DCF-8492-UG',
    chapter: 'Diaspora Uganda Chapter',
    sharesCount: 150,
    shareUnitPrice: 100000, // 100,000 UGX per share
    totalShareValue: 15000000, // 15,000,000 UGX
    savingsBalance: 4850000, // 4,850,000 UGX
    totalPortfolio: 19850000,
    dividendsYTD: 1420000,
    heifersAllocated: 5, // Co-owned dairy heifers
    coffeeAcreageAllocated: '2.5 Acres',
    ownershipPercentage: '1.25%',
  },
  financialStatement: [
    {
      id: 'TX-901',
      date: '2026-11-08',
      description: 'Coffee Export Trading Surplus Dividend (Italian Shipment #CS-501)',
      type: 'coffee_dividend',
      category: 'Coffee Management Sync',
      amount: 450000,
      balance: 19850000,
      status: 'Completed',
      ref: 'COF-DIV-501'
    },
    {
      id: 'TX-892',
      date: '2026-11-02',
      description: 'Commercial Dairy Milk Off-take Dividend – Luwero & Mbarara Depots',
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
  // Farm Management Software Data
  farmManagement: {
    totalHerdCount: 105,
    lactatingCows: 58,
    dailyMilkAvgLiters: 2120,
    totalSilageTons: 159,
    herds: [
      { id: 'H-01', breed: 'Friesian Cross (High-Yield Pedigree)', count: 48, status: 'Lactating', location: 'Luwero Unit', avgYield: '22.4 L/day' },
      { id: 'H-02', breed: 'Jersey Cross (High Butterfat)', count: 32, status: 'In-Calf / Milking', location: 'Mbarara Unit', avgYield: '18.5 L/day' },
      { id: 'H-03', breed: 'Ankole Dairy Genetics (Hardy)', count: 25, status: 'Breeding / Heifers', location: 'Kiruhura Unit', avgYield: '12.8 L/day' }
    ],
    recentMilkLogs: [
      { date: '2026-11-09', morning: 1140, evening: 980, total: 2120, temp: '3.8°C', offTaker: 'Brookside / Fresh Diary' },
      { date: '2026-11-08', morning: 1110, evening: 960, total: 2070, temp: '3.9°C', offTaker: 'Brookside / Fresh Diary' },
      { date: '2026-11-07', morning: 1150, evening: 990, total: 2140, temp: '3.7°C', offTaker: 'Brookside / Fresh Diary' }
    ]
  },
  // Coffee Management Software Data (Buying & Selling)
  coffeeManagement: {
    stockInWarehouseKg: 42700, // 42.7 MT
    totalBoughtKgMonth: 11400,
    totalSoldKgMonth: 27000,
    totalRevenueUGX: 378510000,
    totalPurchasesUGX: 127920000,
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
  // Secretary Data
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
  // Board Data
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

// Retrieve State
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

// Save State
export function savePortalState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('diaspora_portal_updated'));
  } catch (err) {
    console.error('Failed to save portal state', err);
  }
}

// Auth Helpers
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

// Business Logic: Member submits deposit request
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

// Business Logic: Member submits withdrawal request
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

// Business Logic: Member submits support ticket
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

// Business Logic: Accountant / Admin approves deposit -> AUTO-UPDATES CLIENT SHARES & STATEMENT!
export function approveDeposit(requestId) {
  const state = getPortalState();
  const req = state.depositRequests.find((r) => r.id === requestId);
  if (!req || req.status === 'Approved') return;

  req.status = 'Approved';
  const addedAmount = req.amount;

  // Update client shares/savings
  const additionalShares = Math.floor(addedAmount / state.client.shareUnitPrice);
  state.client.sharesCount += additionalShares;
  state.client.totalShareValue = state.client.sharesCount * state.client.shareUnitPrice;
  state.client.savingsBalance += (addedAmount % state.client.shareUnitPrice);
  state.client.totalPortfolio = state.client.totalShareValue + state.client.savingsBalance;

  // Insert into Financial Statement
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

  savePortalState(state);
}

// Business Logic: Farm System distributes dairy dividend -> AUTO-UPDATES CLIENT SHARES & STATEMENT!
export function distributeFarmDividend(totalPoolUGX = 25000000) {
  const state = getPortalState();
  // Member's 1.25% share of the dividend pool
  const memberDividend = Math.round(totalPoolUGX * 0.0125);

  state.client.dividendsYTD += memberDividend;
  state.client.savingsBalance += memberDividend;
  state.client.totalPortfolio = state.client.totalShareValue + state.client.savingsBalance;

  const newTx = {
    id: `TX-FARM-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split('T')[0],
    description: `Automated Commercial Dairy Surplus Dividend Distribution`,
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

// Business Logic: Coffee System adds buying record
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

// Business Logic: Coffee System records a sale & distributes dividend -> AUTO-UPDATES CLIENT SHARES & STATEMENT!
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
    category: 'Coffee Management Sync',
    amount: clientShare,
    balance: state.client.totalPortfolio,
    status: 'Completed',
    ref: newSale.id
  };
  state.financialStatement.unshift(newTx);

  savePortalState(state);
  return clientShare;
}
