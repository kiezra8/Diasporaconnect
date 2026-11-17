// Diaspora Connect - Enterprise Farm & SACCO Reactive Storage Service
// Modeled directly on the proven interactive JBS Farm operational architecture
// Persistent across browser reloads via localStorage with full real-time reactivity

export interface SaccoMember {
  id: string;
  memberId: string;
  name: string;
  phone: string;
  email: string;
  nin: string;
  category: string;
  joinDate: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  avatar?: string;
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
  total: number;
  adminFee: number;
  savings: number;
  shares: number; // nominal 250,000 UGX each
  sharesValue: number;
  withdrawable: number;
}

export interface MoneyMakerInvestor {
  id: string;
  memberId: string;
  name: string;
  phone: string;
  category: string;
  units: number; // 2-cow dairy units @ 8,000,000 UGX
  programAmount: number;
  investmentAmount: number;
  balance: number;
  status: 'FUNDED' | 'ACTIVE' | 'PENDING';
  cowsAllocated: number;
  joinDate: string;
  lastPaymentDate: string;
}

export interface CowMilkRecord {
  id: string;
  cowTag: string;
  cowName: string;
  date: string;
  session: 'Morning' | 'Afternoon' | 'Evening';
  litres: number;
  fatScore?: number; // optional
  offtakerPrice: number; // Brookside Dairy Uganda UGX 1,650
  revenue: number; // litres * offtakerPrice
  recorder: string;
  notes?: string;
}

export interface LoanRepaymentEntry {
  id: string;
  date: string;
  amount: number;
  principalPortion: number;
  interestPortion: number;
  remainingBalance: number;
  reference: string;
  paymentMethod: string;
  notes?: string;
}

export interface SaccoLoan {
  id: string;
  loanNumber: string;
  memberId: string;
  memberName: string;
  principal: number; // UGX
  interestRate: number; // % annual
  durationMonths: number;
  monthlyRepayment: number;
  totalPayable: number;
  amountPaid: number;
  outstandingBalance: number;
  purpose: string;
  collateral: string;
  guarantor: string;
  status: 'PENDING_APPROVAL' | 'ACTIVE' | 'CLEARED' | 'DEFAULTED';
  applicationDate: string;
  disbursementDate?: string;
  nextDueDate: string;
  repaymentHistory?: LoanRepaymentEntry[];
}

export interface PettyCashTransaction {
  id: string;
  date: string;
  type: 'Income' | 'Expense' | 'Transfer';
  source: 'Bank' | 'Petty Cash';
  category: string;
  amount: number;
  description: string;
  reference: string;
  isBanked: boolean;
  bankedDate?: string;
}

export interface CowHealthRecord {
  id: string;
  cowId: string;
  cowTag: string;
  cowName: string;
  date: string;
  illness: string;
  symptoms?: string;
  treatment?: string;
  medication?: string;
  vetName?: string;
  recoveredDate?: string;
  status: 'CURRENTLY_SICK' | 'RECOVERED' | 'UNDER_TREATMENT';
  notes?: string;
}

export interface CattleAnimal {
  id: string;
  tagNumber: string;
  name: string;
  breed: 'Friesian Cross' | 'Jersey' | 'Friesian Pure' | 'Boran' | 'Sahiwal' | 'Ankole Longhorn';
  gender: 'Female' | 'Male';
  ageCategory: 'Cow' | 'Heifer' | 'Calf' | 'Bull';
  stage: 'Milking' | 'Dry' | 'Pregnant' | 'Heifer' | 'Calf' | 'Bull';
  status: ('Healthy' | 'Sick' | 'Pregnant' | 'Dry' | 'Sold' | 'Deceased')[];
  dob: string;
  weight: number; // kg
  hasCalf: boolean;
  calfTag?: string;
  dailyAvgMilk?: number;
  sireDam: string;
  purchaseDate: string;
  purchasePrice: number;
  color: string;
  notes: string;
  healthHistory?: CowHealthRecord[];
}

export interface MilkLogRecord {
  id: string;
  date: string;
  morning: number; // Litres
  afternoon: number; // Litres
  evening: number; // Litres
  calvesConsumption: number; // Litres
  netSold: number; // Litres
  offtakerPrice: number; // UGX per litre (Brookside Dairy UGX 1,650)
  revenue: number; // UGX
  recorder: string;
  notes: string;
}

export interface CattleHealthRecord {
  id: string;
  animalId: string;
  tagNumber: string;
  animalName: string;
  type: 'Vaccination' | 'Treatment' | 'Deworming' | 'Vet Visit' | 'Mortality';
  date: string;
  diagnosis: string;
  treatment: string;
  vaccine?: string;
  vet: string;
  cost: number;
  nextDue?: string;
  status: 'Resolved' | 'Under Treatment' | 'Scheduled';
  notes: string;
}

export interface CattleBreedingRecord {
  id: string;
  animalId: string;
  tagNumber: string;
  animalName: string;
  type: 'Artificial Insemination' | 'Natural Service';
  date: string;
  bull: string; // semen straw code or bull name
  expectedCalving: string; // ~283 days auto-calculated
  status: 'Pending Check' | 'Confirmed Pregnant' | 'Failed' | 'Calved';
  notes: string;
}

export interface FeedInventoryItem {
  id: string;
  feedType: string;
  source?: 'BOUGHT' | 'FARM_MADE';
  currentStock: number;
  minStock: number;
  unit: string;
  unitCost: number; // 0 if FARM_MADE
  totalCost?: number; // 0 if FARM_MADE
  supplier: string;
  lastUpdated: string;
  notes?: string;
}

export interface CustomModule {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  metrics: Array<{ label: string; value: string; sub?: string }>;
  contentNotes: string;
  createdAt: string;
  createdBy: string;
}

export interface CoffeePurchaseBatch {
  id: string;
  date: string;
  farmerName: string;
  district: string;
  variety: 'Arabica Bugisu AA' | 'Arabica Bugisu A' | 'Robusta Kasese Screen 18' | 'Robusta FAQ';
  bags: number;
  netWeightKg: number;
  moisturePercent: number;
  pricePerKg: number;
  totalPayout: number;
  batchCode: string;
  status: 'Received' | 'Drying' | 'Graded' | 'Warehouse Bins' | 'Export Ready';
}

export interface CoffeeSaleRecord {
  id: string;
  date: string;
  buyerName: string;
  marketType: 'Export Contract' | 'Domestic Roaster' | 'Regional Trade';
  destination: string;
  variety: 'Arabica Bugisu AA' | 'Arabica Bugisu A' | 'Robusta Kasese Screen 18' | 'Robusta FAQ';
  bags: number;
  netWeightKg: number;
  sellingPricePerKg: number;
  totalRevenue: number;
  contractRef: string;
  status: 'Contract Signed' | 'In Transit' | 'Delivered' | 'Paid';
  paymentStatus: 'Paid' | 'Partial' | 'Pending Net 30';
  notes?: string;
}

export interface CoffeeInventoryItem {
  id: string;
  variety: 'Arabica Bugisu AA' | 'Arabica Bugisu A' | 'Robusta Kasese Screen 18' | 'Robusta FAQ';
  warehouseLocation: string;
  binNumber: string;
  totalBags: number;
  totalKg: number;
  averageMoisture: number;
  averageCostPerKg: number;
  currentMarketPricePerKg: number;
  lastInspectionDate: string;
  status: 'In Storage' | 'Processing / Drying' | 'Reserved for Export';
}

const STORAGE_KEYS = {
  MEMBERS: 'dc_sacco_members_v2',
  INVESTORS: 'dc_sacco_investors_v2',
  TRANSACTIONS: 'dc_sacco_transactions_v2',
  CATTLE: 'dc_farm_cattle_v2',
  MILK: 'dc_farm_milk_v2',
  COW_MILK: 'dc_farm_cow_milk_v2',
  HEALTH: 'dc_farm_health_v2',
  BREEDING: 'dc_farm_breeding_v2',
  FEEDS: 'dc_farm_feeds_v2',
  COFFEE: 'dc_coffee_batches_v2',
  COFFEE_SALES: 'dc_coffee_sales_v2',
  COFFEE_INVENTORY: 'dc_coffee_inventory_v2',
  LOANS: 'dc_sacco_loans_v2',
  CUSTOM_MODULES: 'dc_custom_modules_v2'
};

const DEFAULT_CUSTOM_MODULES: CustomModule[] = [
  {
    id: 'MOD-01',
    title: 'Coffee Roastery & Retail',
    slug: 'coffee-roastery',
    description: 'Specialty coffee roasting, packaging, and regional retail sales unit',
    category: 'Commercial Enterprises',
    metrics: [
      { label: 'Roast Batches', value: '18 Batches', sub: 'Single-Origin Bugisu AA' },
      { label: 'Retail Inventory', value: '450 kg', sub: 'Valued @ UGX 13,500,000' },
      { label: 'Monthly Sales', value: 'UGX 6,200,000', sub: 'Regional cafes & exports' }
    ],
    contentNotes: 'Roastery equipment operational with 200kg daily roasting capacity. All packaging complies with UNBS certification standards.',
    createdAt: '2026-11-01',
    createdBy: 'System Administrator'
  }
];

// Default Realistic Seed Data
const DEFAULT_MEMBERS: SaccoMember[] = [
  {
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
  },
  {
    id: 'DC-002',
    memberId: 'DC-002',
    name: 'Mrs. Miriam Halera',
    phone: '+256 701 334 455',
    email: 'miriam.halera@diasporaconnectt.com',
    nin: 'CF880192837KLA',
    category: 'Treasurer / Founding Member',
    joinDate: '2024-01-15',
    status: 'ACTIVE',
    avatar: '/images/miriam_halera.jpg',
    jan: 1200000, feb: 1200000, mar: 1200000, apr: 1200000, may: 1200000, jun: 1200000,
    jul: 1200000, aug: 1200000, sep: 1200000, oct: 1200000, nov: 1200000, dec: 1200000,
    total: 14400000,
    adminFee: 50000,
    savings: 14350000,
    shares: 40,
    sharesValue: 10000000,
    withdrawable: 13200000
  },
  {
    id: 'DC-003',
    memberId: 'DC-003',
    name: 'Ms. Namulindwa Mary Flavia',
    phone: '+256 752 998 811',
    email: 'mary.namulindwa@diasporaconnectt.com',
    nin: 'CF900384729EBB',
    category: 'Vice Chairperson / Board',
    joinDate: '2024-02-01',
    status: 'ACTIVE',
    avatar: '/images/namulindwa_mary_flavia.jpg',
    jan: 1000000, feb: 1000000, mar: 1000000, apr: 1000000, may: 1000000, jun: 1000000,
    jul: 1000000, aug: 1000000, sep: 1000000, oct: 1000000, nov: 1000000, dec: 1000000,
    total: 12000000,
    adminFee: 50000,
    savings: 11950000,
    shares: 32,
    sharesValue: 8000000,
    withdrawable: 11000000
  },
  {
    id: 'DC-004',
    memberId: 'DC-004',
    name: 'Mr. Halera John Bahati',
    phone: '+256 782 554 433',
    email: 'john.halera@diasporaconnectt.com',
    nin: 'CM860182736MBR',
    category: 'Secretary / Operations',
    joinDate: '2024-02-10',
    status: 'ACTIVE',
    avatar: '/images/halera_john_bahati.jpg',
    jan: 1000000, feb: 1000000, mar: 1000000, apr: 1000000, may: 1000000, jun: 1000000,
    jul: 1000000, aug: 1000000, sep: 1000000, oct: 1000000, nov: 1000000, dec: 1000000,
    total: 12000000,
    adminFee: 50000,
    savings: 11950000,
    shares: 30,
    sharesValue: 7500000,
    withdrawable: 11000000
  },
  {
    id: 'DC-005',
    memberId: 'DC-005',
    name: 'Ms. Ssanyu Phiona',
    phone: '+256 774 212 900',
    email: 'ssanyu.phiona@diasporaconnectt.com',
    nin: 'CF910482910KLA',
    category: 'Member Representative',
    joinDate: '2024-02-15',
    status: 'ACTIVE',
    avatar: '',
    jan: 800000, feb: 800000, mar: 800000, apr: 800000, may: 800000, jun: 800000,
    jul: 800000, aug: 800000, sep: 800000, oct: 800000, nov: 800000, dec: 800000,
    total: 9600000,
    adminFee: 50000,
    savings: 9550000,
    shares: 24,
    sharesValue: 6000000,
    withdrawable: 8800000
  },
  {
    id: 'DC-006',
    memberId: 'DC-006',
    name: 'David Mukasa',
    phone: '+44 7911 123456',
    email: 'david.mukasa@london.co.uk',
    nin: 'CM830291827LON',
    category: 'Diaspora (United Kingdom)',
    joinDate: '2024-03-01',
    status: 'ACTIVE',
    avatar: '',
    jan: 1500000, feb: 1500000, mar: 1500000, apr: 1500000, may: 1500000, jun: 1500000,
    jul: 1500000, aug: 1500000, sep: 1500000, oct: 1500000, nov: 1500000, dec: 1500000,
    total: 18000000,
    adminFee: 50000,
    savings: 17950000,
    shares: 42,
    sharesValue: 10500000,
    withdrawable: 16500000
  },
  {
    id: 'DC-007',
    memberId: 'DC-007',
    name: 'Amara Okello',
    phone: '+1 416 555 0192',
    email: 'amara.okello@toronto.ca',
    nin: 'CF920192837TOR',
    category: 'Diaspora (Canada)',
    joinDate: '2024-03-15',
    status: 'ACTIVE',
    avatar: '',
    jan: 1000000, feb: 1000000, mar: 1000000, apr: 1000000, may: 1200000, jun: 1000000,
    jul: 1000000, aug: 1000000, sep: 1000000, oct: 1000000, nov: 1000000, dec: 1000000,
    total: 12200000,
    adminFee: 50000,
    savings: 12150000,
    shares: 35,
    sharesValue: 8750000,
    withdrawable: 11200000
  }
];

const DEFAULT_INVESTORS: MoneyMakerInvestor[] = [
  {
    id: 'INV-01',
    memberId: 'DC-001',
    name: 'Mr. Nyanzi Edrine',
    phone: '+256 772 100 200',
    category: 'Commercial Dairy Program',
    units: 2,
    programAmount: 16000000,
    investmentAmount: 16000000,
    balance: 0,
    status: 'FUNDED',
    cowsAllocated: 4,
    joinDate: '2024-02-15',
    lastPaymentDate: '2024-03-01'
  },
  {
    id: 'INV-02',
    memberId: 'DC-002',
    name: 'Mrs. Miriam Halera',
    phone: '+256 701 334 455',
    category: 'Commercial Dairy Program',
    units: 2,
    programAmount: 16000000,
    investmentAmount: 16000000,
    balance: 0,
    status: 'FUNDED',
    cowsAllocated: 4,
    joinDate: '2024-02-20',
    lastPaymentDate: '2024-03-05'
  },
  {
    id: 'INV-03',
    memberId: 'DC-006',
    name: 'David Mukasa',
    phone: '+44 7911 123456',
    category: 'Commercial Dairy Program',
    units: 1,
    programAmount: 8000000,
    investmentAmount: 8000000,
    balance: 0,
    status: 'FUNDED',
    cowsAllocated: 2,
    joinDate: '2024-03-10',
    lastPaymentDate: '2024-03-20'
  },
  {
    id: 'INV-04',
    memberId: 'DC-007',
    name: 'Amara Okello',
    phone: '+1 416 555 0192',
    category: 'Commercial Dairy Program',
    units: 1,
    programAmount: 8000000,
    investmentAmount: 5000000,
    balance: 3000000,
    status: 'ACTIVE',
    cowsAllocated: 2,
    joinDate: '2024-04-01',
    lastPaymentDate: '2024-05-10'
  }
];

const DEFAULT_COW_MILK_LOGS: CowMilkRecord[] = [
  // Today's records
  { id: 'CML-101', cowTag: 'DC-H01', cowName: 'Kyomu', date: '2026-11-12', session: 'Morning', litres: 12.5, fatScore: 3.9, offtakerPrice: 1650, revenue: 20625, recorder: 'Joseph Mugisha', notes: 'Prime lactation peak' },
  { id: 'CML-102', cowTag: 'DC-H01', cowName: 'Kyomu', date: '2026-11-12', session: 'Evening', litres: 10.0, fatScore: 3.8, offtakerPrice: 1650, revenue: 16500, recorder: 'Joseph Mugisha', notes: 'Normal milking' },
  { id: 'CML-103', cowTag: 'DC-H02', cowName: 'Nabirye', date: '2026-11-12', session: 'Morning', litres: 11.0, fatScore: 3.7, offtakerPrice: 1650, revenue: 18150, recorder: 'Joseph Mugisha', notes: 'Lactating well' },
  { id: 'CML-104', cowTag: 'DC-H03', cowName: 'Namaganda', date: '2026-11-12', session: 'Morning', litres: 9.5, offtakerPrice: 1650, revenue: 15675, recorder: 'Joseph Mugisha', notes: 'Prime Jersey milk yield' },
  { id: 'CML-105', cowTag: 'DC-H04', cowName: 'Nalongo', date: '2026-11-12', session: 'Morning', litres: 7.0, fatScore: 3.6, offtakerPrice: 1650, revenue: 11550, recorder: 'Joseph Mugisha', notes: 'Recovering in Sick Bay' },

  // Yesterday's records (Previous Days)
  { id: 'CML-106', cowTag: 'DC-H01', cowName: 'Kyomu', date: '2026-11-11', session: 'Morning', litres: 13.0, fatScore: 3.9, offtakerPrice: 1650, revenue: 21450, recorder: 'Joseph Mugisha', notes: 'Excellent yield' },
  { id: 'CML-107', cowTag: 'DC-H01', cowName: 'Kyomu', date: '2026-11-11', session: 'Evening', litres: 10.5, fatScore: 3.8, offtakerPrice: 1650, revenue: 17325, recorder: 'Joseph Mugisha', notes: 'Healthy appetite' },
  { id: 'CML-108', cowTag: 'DC-H02', cowName: 'Nabirye', date: '2026-11-11', session: 'Morning', litres: 10.5, fatScore: 3.7, offtakerPrice: 1650, revenue: 17325, recorder: 'Joseph Mugisha', notes: 'Steady output' },
  { id: 'CML-109', cowTag: 'DC-H03', cowName: 'Namaganda', date: '2026-11-11', session: 'Morning', litres: 9.0, fatScore: 4.1, offtakerPrice: 1650, revenue: 14850, recorder: 'Joseph Mugisha', notes: 'Rich golden milk' },

  // Last Week (Previous Weeks)
  { id: 'CML-110', cowTag: 'DC-H01', cowName: 'Kyomu', date: '2026-11-05', session: 'Morning', litres: 12.0, fatScore: 3.8, offtakerPrice: 1650, revenue: 19800, recorder: 'Joseph Mugisha', notes: 'Silage fed' },
  { id: 'CML-111', cowTag: 'DC-H02', cowName: 'Nabirye', date: '2026-11-05', session: 'Morning', litres: 11.5, fatScore: 3.7, offtakerPrice: 1650, revenue: 18975, recorder: 'Joseph Mugisha', notes: 'Good pasture grazing' },
  { id: 'CML-112', cowTag: 'DC-H03', cowName: 'Namaganda', date: '2026-10-28', session: 'Morning', litres: 10.0, fatScore: 4.2, offtakerPrice: 1650, revenue: 16500, recorder: 'Joseph Mugisha', notes: 'Pre-pregnancy maintenance' },

  // Previous Month
  { id: 'CML-113', cowTag: 'DC-H01', cowName: 'Kyomu', date: '2026-10-15', session: 'Morning', litres: 13.5, fatScore: 3.9, offtakerPrice: 1650, revenue: 22275, recorder: 'Joseph Mugisha', notes: 'October lush rains' },
  { id: 'CML-114', cowTag: 'DC-H02', cowName: 'Nabirye', date: '2026-10-15', session: 'Morning', litres: 12.0, fatScore: 3.8, offtakerPrice: 1650, revenue: 19800, recorder: 'Joseph Mugisha', notes: 'Bulk vat #1' },
  { id: 'CML-115', cowTag: 'DC-H01', cowName: 'Kyomu', date: '2026-09-22', session: 'Morning', litres: 12.0, fatScore: 3.8, offtakerPrice: 1650, revenue: 19800, recorder: 'Joseph Mugisha', notes: 'September cycle' }
];

const DEFAULT_LOANS: SaccoLoan[] = [
  {
    id: 'LN-001',
    loanNumber: 'LN-001',
    memberId: 'DC-001',
    memberName: 'Mr. Nyanzi Edrine',
    principal: 10000000,
    interestRate: 10,
    durationMonths: 12,
    monthlyRepayment: 916667,
    totalPayable: 11000000,
    amountPaid: 4583335,
    outstandingBalance: 6416665,
    purpose: 'Pasture Fodder Silage Bunker Construction',
    collateral: 'SACCO Shares (48 shares @ UGX 250k) & Land Title Deed #KLA-891',
    guarantor: 'Mrs. Miriam Halera (DC-002)',
    status: 'ACTIVE',
    applicationDate: '2024-05-10',
    disbursementDate: '2024-05-15',
    nextDueDate: '2026-12-05'
  },
  {
    id: 'LN-002',
    loanNumber: 'LN-002',
    memberId: 'DC-006',
    memberName: 'David Mukasa',
    principal: 8000000,
    interestRate: 10,
    durationMonths: 12,
    monthlyRepayment: 733333,
    totalPayable: 8800000,
    amountPaid: 4400000,
    outstandingBalance: 4400000,
    purpose: 'Coffee Solar Drying Mill Installation',
    collateral: 'Cooperative Share Holdings (42 shares)',
    guarantor: 'Mr. Halera John Bahati (DC-004)',
    status: 'ACTIVE',
    applicationDate: '2024-06-01',
    disbursementDate: '2024-06-08',
    nextDueDate: '2026-12-08',
    repaymentHistory: [
      {
        id: 'RPM-001',
        date: '2024-07-08',
        amount: 2200000,
        principalPortion: 2000000,
        interestPortion: 200000,
        remainingBalance: 6600000,
        reference: 'REC-LN-771',
        paymentMethod: 'Stanbic Bank Wire',
        notes: 'Installment 1 & 2'
      },
      {
        id: 'RPM-002',
        date: '2024-09-08',
        amount: 2200000,
        principalPortion: 2000000,
        interestPortion: 200000,
        remainingBalance: 4400000,
        reference: 'REC-LN-892',
        paymentMethod: 'MTN MoMoPay',
        notes: 'Installment 3 & 4'
      }
    ]
  },
  {
    id: 'LN-003',
    loanNumber: 'LN-003',
    memberId: 'DC-007',
    memberName: 'Amara Okello',
    principal: 5000000,
    interestRate: 10,
    durationMonths: 6,
    monthlyRepayment: 875000,
    totalPayable: 5250000,
    amountPaid: 0,
    outstandingBalance: 5250000,
    purpose: 'Zero-Grazing Cow Barn Concrete Flooring',
    collateral: 'SACCO Shares (35 shares)',
    guarantor: 'Ms. Namulindwa Mary Flavia (DC-003)',
    status: 'PENDING_APPROVAL',
    applicationDate: '2026-11-08',
    nextDueDate: '2026-12-15'
  },
  {
    id: 'LN-004',
    loanNumber: 'LN-004',
    memberId: 'DC-003',
    memberName: 'Ms. Namulindwa Mary Flavia',
    principal: 6000000,
    interestRate: 10,
    durationMonths: 6,
    monthlyRepayment: 1050000,
    totalPayable: 6300000,
    amountPaid: 6300000,
    outstandingBalance: 0,
    purpose: 'Solar Water Pump for Dairy Paddocks',
    collateral: 'Share Certificate CERT-DC-003',
    guarantor: 'Mr. Nyanzi Edrine (DC-001)',
    status: 'CLEARED',
    applicationDate: '2024-01-15',
    disbursementDate: '2024-01-20',
    nextDueDate: 'Completed'
  }
];

const DEFAULT_TRANSACTIONS: PettyCashTransaction[] = [
  {
    id: 'TX-201',
    date: '2026-11-10',
    type: 'Income',
    source: 'Bank',
    category: 'Milk Off-taker Brookside',
    amount: 3267000,
    description: 'Bulk milk payout Brookside Dairy Uganda Ltd - Batch #781',
    reference: 'EFT-BKS-99102',
    isBanked: true,
    bankedDate: '2026-11-10'
  },
  {
    id: 'TX-202',
    date: '2026-11-09',
    type: 'Income',
    source: 'Petty Cash',
    category: 'Farm Gate Milk Sales',
    amount: 450000,
    description: 'Fresh raw milk sales to local community retail buyers',
    reference: 'CSH-REC-892',
    isBanked: true,
    bankedDate: '2026-11-10'
  },
  {
    id: 'TX-203',
    date: '2026-11-08',
    type: 'Expense',
    source: 'Petty Cash',
    category: 'Veterinary & Meds',
    amount: 320000,
    description: 'Acaricides dip purchase & mastitis tubes (Dr. Kasirye Brian)',
    reference: 'VET-INV-440',
    isBanked: true
  },
  {
    id: 'TX-204',
    date: '2026-11-07',
    type: 'Expense',
    source: 'Bank',
    category: 'Dairy Feed & Silage',
    amount: 1850000,
    description: '10 tonnes chopped silage & 15 bags Dairy Meal Kazinga Feeds',
    reference: 'EFT-KAZ-2091',
    isBanked: true
  },
  {
    id: 'TX-205',
    date: '2026-11-06',
    type: 'Expense',
    source: 'Petty Cash',
    category: 'Farm Staff Allowance',
    amount: 400000,
    description: 'Milkers weekly operational allowances & dip wash consumables',
    reference: 'VOUCH-STF-019',
    isBanked: false
  },
  {
    id: 'TX-206',
    date: '2026-11-05',
    type: 'Income',
    source: 'Petty Cash',
    category: 'Member Cash Deposit',
    amount: 1000000,
    description: 'Monthly savings contribution deposit from local member',
    reference: 'DEP-UG-998',
    isBanked: false
  }
];

const DEFAULT_CATTLE: CattleAnimal[] = [
  {
    id: 'COW-001',
    tagNumber: 'DC-H01',
    name: 'Nakazibwe',
    breed: 'Friesian Cross',
    gender: 'Female',
    ageCategory: 'Cow',
    stage: 'Milking',
    status: ['Healthy'],
    dob: '2022-03-12',
    weight: 540,
    hasCalf: true,
    calfTag: 'DC-C09',
    dailyAvgMilk: 24.5,
    sireDam: 'Sire: ABS Titan / Dam: Local Grade',
    purchaseDate: '2023-01-15',
    purchasePrice: 4200000,
    color: 'Black and White',
    notes: 'Primary milker in Barn 1. Peak producer.'
  },
  {
    id: 'COW-002',
    tagNumber: 'DC-H02',
    name: 'Babirye',
    breed: 'Friesian Pure',
    gender: 'Female',
    ageCategory: 'Cow',
    stage: 'Milking',
    status: ['Healthy'],
    dob: '2021-11-05',
    weight: 565,
    hasCalf: false,
    dailyAvgMilk: 26.0,
    sireDam: 'Sire: Alta Spring / Dam: DC-H00',
    purchaseDate: '2022-12-01',
    purchasePrice: 4800000,
    color: 'Black and White',
    notes: 'Very calm temperament. High daily milk yield.'
  },
  {
    id: 'COW-003',
    tagNumber: 'DC-H03',
    name: 'Namaganda',
    breed: 'Jersey',
    gender: 'Female',
    ageCategory: 'Cow',
    stage: 'Pregnant',
    status: ['Pregnant', 'Healthy'],
    dob: '2022-07-20',
    weight: 430,
    hasCalf: false,
    dailyAvgMilk: 18.0,
    sireDam: 'Sire: World-Wide-Sires Chrome / Dam: KZN-01',
    purchaseDate: '2023-02-10',
    purchasePrice: 3800000,
    color: 'Fawn / Light Brown',
    notes: 'Confirmed pregnant via AI. Expected calving Jan 2027.'
  },
  {
    id: 'COW-004',
    tagNumber: 'DC-H04',
    name: 'Nalongo',
    breed: 'Friesian Cross',
    gender: 'Female',
    ageCategory: 'Cow',
    stage: 'Milking',
    status: ['Sick'],
    dob: '2022-01-18',
    weight: 510,
    hasCalf: true,
    calfTag: 'DC-C10',
    dailyAvgMilk: 14.0,
    sireDam: 'Sire: Semex / Dam: Local Boran',
    purchaseDate: '2023-01-20',
    purchasePrice: 4100000,
    color: 'Black and White',
    notes: 'Mild mastitis in right rear quarter. Currently isolated in Sick Bay.'
  },
  {
    id: 'COW-005',
    tagNumber: 'DC-H05',
    name: 'Kiconco',
    breed: 'Friesian Cross',
    gender: 'Female',
    ageCategory: 'Heifer',
    stage: 'Heifer',
    status: ['Healthy'],
    dob: '2023-08-14',
    weight: 380,
    hasCalf: false,
    sireDam: 'Sire: ABS Robust / Dam: DC-H01',
    purchaseDate: '2023-08-14',
    purchasePrice: 0,
    color: 'Black and White',
    notes: 'Farm-born heifer. Ready for first artificial insemination this month.'
  },
  {
    id: 'COW-006',
    tagNumber: 'DC-B01',
    name: 'Mukonjo King',
    breed: 'Boran',
    gender: 'Male',
    ageCategory: 'Bull',
    stage: 'Bull',
    status: ['Healthy'],
    dob: '2021-04-10',
    weight: 710,
    hasCalf: false,
    sireDam: 'Ol Pejeta Boran Pedigree',
    purchaseDate: '2022-10-15',
    purchasePrice: 5500000,
    color: 'Grey-White Humped',
    notes: 'Pedigree breeding bull for beef cross lines and herd vigor.'
  }
];

const DEFAULT_MILK_LOGS: MilkLogRecord[] = [
  {
    id: 'ML-01',
    date: '2026-11-12',
    morning: 135,
    afternoon: 85,
    evening: 55,
    calvesConsumption: 35,
    netSold: 240,
    offtakerPrice: 1650,
    revenue: 396000,
    recorder: 'Halera John Bahati',
    notes: 'Morning chill; all 12 milkers stripped clean. Delivered to Brookside.'
  },
  {
    id: 'ML-02',
    date: '2026-11-11',
    morning: 140,
    afternoon: 80,
    evening: 60,
    calvesConsumption: 35,
    netSold: 245,
    offtakerPrice: 1650,
    revenue: 404250,
    recorder: 'Halera John Bahati',
    notes: 'Regular collection truck on time at 9:00 AM.'
  },
  {
    id: 'ML-03',
    date: '2026-11-10',
    morning: 138,
    afternoon: 82,
    evening: 58,
    calvesConsumption: 35,
    netSold: 243,
    offtakerPrice: 1650,
    revenue: 400950,
    recorder: 'Halera John Bahati',
    notes: 'High silage ration provided in Barn 2.'
  },
  {
    id: 'ML-04',
    date: '2026-11-09',
    morning: 132,
    afternoon: 78,
    evening: 52,
    calvesConsumption: 32,
    netSold: 230,
    offtakerPrice: 1650,
    revenue: 379500,
    recorder: 'Halera John Bahati',
    notes: 'Heavy afternoon rain.'
  },
  {
    id: 'ML-05',
    date: '2026-11-08',
    morning: 145,
    afternoon: 85,
    evening: 62,
    calvesConsumption: 35,
    netSold: 257,
    offtakerPrice: 1650,
    revenue: 424050,
    recorder: 'Halera John Bahati',
    notes: 'Peak yield following mineral lick replenishment.'
  },
  {
    id: 'ML-06',
    date: '2026-11-07',
    morning: 136,
    afternoon: 80,
    evening: 54,
    calvesConsumption: 34,
    netSold: 236,
    offtakerPrice: 1650,
    revenue: 389400,
    recorder: 'Halera John Bahati',
    notes: 'All quality lactometer readings normal (31 at 20°C).'
  },
  {
    id: 'ML-07',
    date: '2026-11-06',
    morning: 134,
    afternoon: 76,
    evening: 56,
    calvesConsumption: 34,
    netSold: 232,
    offtakerPrice: 1650,
    revenue: 382800,
    recorder: 'Halera John Bahati',
    notes: 'Delivered in sanitized stainless steel cans.'
  }
];

const DEFAULT_HEALTH: CattleHealthRecord[] = [
  {
    id: 'HL-01',
    animalId: 'COW-004',
    tagNumber: 'DC-H04',
    animalName: 'Nalongo',
    type: 'Treatment',
    date: '2026-11-10',
    diagnosis: 'Clinical Mastitis in right rear quarter',
    treatment: 'Intramammary antibiotic infusion (Spectramast LC) & flunixin',
    vet: 'Dr. Kasirye Brian',
    cost: 85000,
    nextDue: '2026-11-13',
    status: 'Under Treatment',
    notes: 'Milk from treated quarter discarded. Cow placed in sick isolation bay.'
  },
  {
    id: 'HL-02',
    animalId: 'COW-001',
    tagNumber: 'DC-H01',
    animalName: 'Nakazibwe',
    type: 'Vaccination',
    date: '2026-10-15',
    diagnosis: 'Routine herd protection',
    treatment: 'Foot and Mouth Disease (FMD) Quadrivalent Vaccine',
    vaccine: 'FMD Quadrivalent',
    vet: 'Dr. Kasirye Brian',
    cost: 35000,
    nextDue: '2027-04-15',
    status: 'Resolved',
    notes: 'Herd vaccination completed with zero adverse reactions.'
  },
  {
    id: 'HL-03',
    animalId: 'COW-005',
    tagNumber: 'DC-H05',
    animalName: 'Kiconco',
    type: 'Deworming',
    date: '2026-10-01',
    diagnosis: 'Routine internal parasite control',
    treatment: 'Albendazole 10% drench (60ml)',
    vet: 'Halera John Bahati',
    cost: 18000,
    nextDue: '2027-01-01',
    status: 'Resolved',
    notes: 'All heifers drenched before rainy season pasture change.'
  }
];

const DEFAULT_BREEDING: CattleBreedingRecord[] = [
  {
    id: 'BR-01',
    animalId: 'COW-003',
    tagNumber: 'DC-H03',
    animalName: 'Namaganda',
    type: 'Artificial Insemination',
    date: '2026-04-15',
    bull: 'Straw #US-JER-881 (World-Wide Sires Chrome)',
    expectedCalving: '2027-01-23',
    status: 'Confirmed Pregnant',
    notes: 'Confirmed 90-day palpation pregnancy check positive by Dr. Kasirye.'
  },
  {
    id: 'BR-02',
    animalId: 'COW-005',
    tagNumber: 'DC-H05',
    animalName: 'Kiconco',
    type: 'Artificial Insemination',
    date: '2026-11-02',
    bull: 'Straw #NL-FRI-442 (Alta Spring Friesian)',
    expectedCalving: '2027-08-12',
    status: 'Pending Check',
    notes: 'First service for heifer upon standing heat. Pregnancy scan set for 60 days.'
  }
];

const DEFAULT_FEEDS: FeedInventoryItem[] = [
  {
    id: 'FD-01',
    feedType: 'Chopped Maize Silage',
    source: 'FARM_MADE',
    currentStock: 42000,
    minStock: 15000,
    unit: 'kg',
    unitCost: 0,
    totalCost: 0,
    supplier: 'Diaspora Connect Fodder Bunker B',
    lastUpdated: '2026-11-10',
    notes: 'Zero-cost silage prepared on farm'
  },
  {
    id: 'FD-02',
    feedType: 'Dairy Meal (18% CP)',
    source: 'BOUGHT',
    currentStock: 18,
    minStock: 25, // Alert low stock!
    unit: 'bags (50kg)',
    unitCost: 92000,
    totalCost: 1656000,
    supplier: 'Kazinga Feeds Uganda',
    lastUpdated: '2026-11-08'
  },
  {
    id: 'FD-03',
    feedType: 'Rhodes Grass Baled Hay',
    source: 'BOUGHT',
    currentStock: 280,
    minStock: 100,
    unit: 'bales',
    unitCost: 12000,
    totalCost: 3360000,
    supplier: 'Mbarara Pasture Producers',
    lastUpdated: '2026-11-05'
  },
  {
    id: 'FD-04',
    feedType: 'Dairy Mineral Salt Blocks',
    source: 'BOUGHT',
    currentStock: 14,
    minStock: 10,
    unit: 'blocks (5kg)',
    unitCost: 35000,
    totalCost: 490000,
    supplier: 'Coopers Uganda Veterinary',
    lastUpdated: '2026-11-01'
  },
  {
    id: 'FD-05',
    feedType: 'Cane Molasses Syrup',
    source: 'BOUGHT',
    currentStock: 800,
    minStock: 400,
    unit: 'litres',
    unitCost: 850,
    totalCost: 680000,
    supplier: 'Kakira Sugar Works',
    lastUpdated: '2026-11-04'
  },
  {
    id: 'FD-06',
    feedType: 'Fresh Cut Napier Fodder',
    source: 'FARM_MADE',
    currentStock: 8500,
    minStock: 2000,
    unit: 'kg',
    unitCost: 0,
    totalCost: 0,
    supplier: 'Farm Fodder Paddock Section C',
    lastUpdated: '2026-11-12',
    notes: 'Grown and cut on farm'
  }
];

const DEFAULT_COFFEE: CoffeePurchaseBatch[] = [
  {
    id: 'CF-101',
    date: '2026-11-10',
    farmerName: 'Kato Stephen & Outgrowers Group',
    district: 'Mbale (Mount Elgon)',
    variety: 'Arabica Bugisu AA',
    bags: 45,
    netWeightKg: 2700,
    moisturePercent: 12.1,
    pricePerKg: 13500,
    totalPayout: 36450000,
    batchCode: 'DC-ARA-MB-09',
    status: 'Warehouse Bins'
  },
  {
    id: 'CF-102',
    date: '2026-11-08',
    farmerName: 'Muhindo Eric Farmers Cooperative',
    district: 'Kasese (Rwenzori Foothills)',
    variety: 'Robusta Kasese Screen 18',
    bags: 60,
    netWeightKg: 3600,
    moisturePercent: 12.4,
    pricePerKg: 10200,
    totalPayout: 36720000,
    batchCode: 'DC-ROB-KAS-12',
    status: 'Warehouse Bins'
  },
  {
    id: 'CF-103',
    date: '2026-11-04',
    farmerName: 'Wasswa Gerald Estate',
    district: 'Masaka (Greater Southern)',
    variety: 'Robusta FAQ',
    bags: 30,
    netWeightKg: 1800,
    moisturePercent: 12.8,
    pricePerKg: 9400,
    totalPayout: 16920000,
    batchCode: 'DC-ROB-MSK-05',
    status: 'Graded'
  }
];

const DEFAULT_COFFEE_SALES: CoffeeSaleRecord[] = [
  {
    id: 'CS-501',
    date: '2026-11-11',
    buyerName: 'Hamburg Specialty Coffee Importers GmbH',
    marketType: 'Export Contract',
    destination: 'Port of Hamburg, Germany',
    variety: 'Arabica Bugisu AA',
    bags: 120,
    netWeightKg: 7200,
    sellingPricePerKg: 18200,
    totalRevenue: 131040000,
    contractRef: 'CT-2026-HAM-04',
    status: 'In Transit',
    paymentStatus: 'Paid',
    notes: 'Grade A1 specialty parchment lot. Off-take FOB Mombasa port.'
  },
  {
    id: 'CS-502',
    date: '2026-11-06',
    buyerName: 'Rotterdam Commodity Exchange BV',
    marketType: 'Export Contract',
    destination: 'Rotterdam, Netherlands',
    variety: 'Robusta Kasese Screen 18',
    bags: 180,
    netWeightKg: 10800,
    sellingPricePerKg: 14500,
    totalRevenue: 156600000,
    contractRef: 'CT-2026-RTD-08',
    status: 'Delivered',
    paymentStatus: 'Paid',
    notes: 'Bulk washed screen 18. Certified organic origin.'
  },
  {
    id: 'CS-503',
    date: '2026-11-02',
    buyerName: 'Kampala Artisan Coffee Roasters',
    marketType: 'Domestic Roaster',
    destination: 'Industrial Area, Kampala',
    variety: 'Arabica Bugisu AA',
    bags: 25,
    netWeightKg: 1500,
    sellingPricePerKg: 16800,
    totalRevenue: 25200000,
    contractRef: 'DOM-KLA-1102',
    status: 'Paid',
    paymentStatus: 'Paid',
    notes: 'Local specialty coffee retail chain supply.'
  }
];

const DEFAULT_COFFEE_INVENTORY: CoffeeInventoryItem[] = [
  {
    id: 'INV-CF-01',
    variety: 'Arabica Bugisu AA',
    warehouseLocation: 'Mbale Central Silo Facility',
    binNumber: 'SILO-BIN-04A',
    totalBags: 340,
    totalKg: 20400,
    averageMoisture: 12.0,
    averageCostPerKg: 13500,
    currentMarketPricePerKg: 18200,
    lastInspectionDate: '2026-11-12',
    status: 'In Storage'
  },
  {
    id: 'INV-CF-02',
    variety: 'Robusta Kasese Screen 18',
    warehouseLocation: 'Kasese Foothills Bonded Depot',
    binNumber: 'DEP-BIN-12B',
    totalBags: 420,
    totalKg: 25200,
    averageMoisture: 12.3,
    averageCostPerKg: 10200,
    currentMarketPricePerKg: 14500,
    lastInspectionDate: '2026-11-11',
    status: 'In Storage'
  },
  {
    id: 'INV-CF-03',
    variety: 'Arabica Bugisu A',
    warehouseLocation: 'Mbale Central Silo Facility',
    binNumber: 'SILO-BIN-02C',
    totalBags: 110,
    totalKg: 6600,
    averageMoisture: 12.5,
    averageCostPerKg: 11800,
    currentMarketPricePerKg: 15400,
    lastInspectionDate: '2026-11-09',
    status: 'Processing / Drying'
  },
  {
    id: 'INV-CF-04',
    variety: 'Robusta FAQ',
    warehouseLocation: 'Masaka Regional Collection Center',
    binNumber: 'MSK-BIN-01',
    totalBags: 150,
    totalKg: 9000,
    averageMoisture: 12.7,
    averageCostPerKg: 9400,
    currentMarketPricePerKg: 12800,
    lastInspectionDate: '2026-11-07',
    status: 'Reserved for Export'
  }
];

export const getMemberPhoto = (name: string): string => {
  const n = (name || '').toLowerCase();
  if (n.includes('nyanzi') || n.includes('edrine')) return '/images/nyanzi_edrine.jpg';
  if ((n.includes('miriam') || n.includes('halera')) && !n.includes('john') && !n.includes('bahati')) return '/images/miriam_halera.jpg';
  if (n.includes('namulindwa') || n.includes('flavia') || n.includes('mary')) return '/images/namulindwa_mary_flavia.jpg';
  if (n.includes('john') || n.includes('bahati')) return '/images/halera_john_bahati.jpg';
  if (n.includes('ssanyu') || n.includes('phiona')) return '/images/ssanyu_phiona.jpg';
  return '';
};

// Helper to load or initialize
function getStored<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error reading ${key} from localStorage:`, err);
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    window.dispatchEvent(new Event('dc_storage_update'));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

export const SaccoFarmStore = {
  // Members
  getMembers: (): SaccoMember[] => {
    const list = getStored<SaccoMember[]>(STORAGE_KEYS.MEMBERS, DEFAULT_MEMBERS);
    return list.map(m => ({
      ...m,
      avatar: m.avatar || getMemberPhoto(m.name)
    }));
  },
  saveMembers: (members: SaccoMember[]) => setStored(STORAGE_KEYS.MEMBERS, members),

  addMember: (member: Omit<SaccoMember, 'id' | 'total' | 'savings' | 'sharesValue' | 'withdrawable'>): SaccoMember => {
    const members = SaccoFarmStore.getMembers();
    const nextNum = members.length + 1;
    const memberId = `DC-${String(nextNum).padStart(3, '0')}`;
    const months = [member.jan, member.feb, member.mar, member.apr, member.may, member.jun, member.jul, member.aug, member.sep, member.oct, member.nov, member.dec];
    const total = months.reduce((acc, m) => acc + (Number(m) || 0), 0);
    const adminFee = Number(member.adminFee) || 50000;
    const savings = Math.max(0, total - adminFee);
    const shares = Number(member.shares) || 0;
    const sharesValue = shares * 250000;

    const newMember: SaccoMember = {
      ...member,
      id: memberId,
      memberId,
      total,
      adminFee,
      savings,
      shares,
      sharesValue,
      withdrawable: Math.round(savings * 0.9)
    };
    members.push(newMember);
    SaccoFarmStore.saveMembers(members);
    return newMember;
  },

  updateMember: (id: string, updates: Partial<SaccoMember>): SaccoMember | null => {
    const members = SaccoFarmStore.getMembers();
    const idx = members.findIndex(m => m.id === id || m.memberId === id);
    if (idx === -1) return null;

    const existing = members[idx];
    const merged = { ...existing, ...updates };
    const months = [merged.jan, merged.feb, merged.mar, merged.apr, merged.may, merged.jun, merged.jul, merged.aug, merged.sep, merged.oct, merged.nov, merged.dec];
    merged.total = months.reduce((acc, m) => acc + (Number(m) || 0), 0);
    merged.adminFee = Number(merged.adminFee) || 50000;
    merged.savings = Math.max(0, merged.total - merged.adminFee);
    merged.shares = Number(merged.shares) || 0;
    merged.sharesValue = merged.shares * 250000;
    merged.withdrawable = Math.round(merged.savings * 0.9);

    members[idx] = merged;
    SaccoFarmStore.saveMembers(members);
    return merged;
  },

  deleteMember: (id: string): boolean => {
    const members = SaccoFarmStore.getMembers();
    const filtered = members.filter(m => m.id !== id && m.memberId !== id);
    if (filtered.length === members.length) return false;
    SaccoFarmStore.saveMembers(filtered);
    return true;
  },


  updateMonthlyContribution: (memberId: string, month: keyof SaccoMember, amount: number) => {
    const members = SaccoFarmStore.getMembers();
    const m = members.find(item => item.id === memberId || item.memberId === memberId);
    if (!m) return false;
    (m as any)[month] = Number(amount) || 0;
    SaccoFarmStore.updateMember(m.id, m);
    return true;
  },


  convertSavingsToShares: (memberId: string, shareCount: number, sharePrice = 250000): { success: boolean; msg: string } => {
    const members = SaccoFarmStore.getMembers();
    const m = members.find(item => item.id === memberId || item.memberId === memberId);
    if (!m) return { success: false, msg: 'Member not found' };
    const cost = shareCount * sharePrice;
    if (m.savings < cost) {
      return { success: false, msg: `Insufficient savings balance (${m.savings.toLocaleString()} UGX) for ${shareCount} shares (${cost.toLocaleString()} UGX)` };
    }
    m.savings -= cost;
    m.shares += shareCount;
    m.sharesValue = m.shares * sharePrice;
    m.withdrawable = Math.round(m.savings * 0.9);
    SaccoFarmStore.updateMember(m.id, m);
    return { success: true, msg: `Converted ${cost.toLocaleString()} UGX savings into ${shareCount} shares successfully.` };
  },

  // Investors (Money Maker)
  getInvestors: (): MoneyMakerInvestor[] => getStored<MoneyMakerInvestor[]>(STORAGE_KEYS.INVESTORS, DEFAULT_INVESTORS),
  saveInvestors: (investors: MoneyMakerInvestor[]) => setStored(STORAGE_KEYS.INVESTORS, investors),

  addInvestor: (investor: Omit<MoneyMakerInvestor, 'id' | 'programAmount' | 'balance' | 'cowsAllocated'>): MoneyMakerInvestor => {
    const list = SaccoFarmStore.getInvestors();
    const nextId = `MM-${String(list.length + 1).padStart(2, '0')}`;
    const units = Number(investor.units) || 1;
    const programAmount = units * 8000000;
    const paid = Number(investor.investmentAmount) || 0;
    const balance = Math.max(0, programAmount - paid);
    const cowsAllocated = units * 2;
    const status = balance === 0 ? 'FUNDED' : 'ACTIVE';

    const newInv: MoneyMakerInvestor = {
      ...investor,
      id: nextId,
      units,
      programAmount,
      investmentAmount: paid,
      balance,
      cowsAllocated,
      status
    };
    list.push(newInv);
    SaccoFarmStore.saveInvestors(list);
    return newInv;
  },

  recordInvestorPayment: (investorId: string, amount: number, method: string, isBanked: boolean, date: string, ref: string) => {
    const list = SaccoFarmStore.getInvestors();
    const inv = list.find(item => item.id === investorId);
    if (!inv) return false;

    const amt = Number(amount) || 0;
    inv.investmentAmount += amt;
    inv.balance = Math.max(0, inv.programAmount - inv.investmentAmount);
    inv.lastPaymentDate = date || new Date().toISOString().split('T')[0];
    if (inv.balance === 0) inv.status = 'FUNDED';
    SaccoFarmStore.saveInvestors(list);

    // Also record transaction in cashbook
    SaccoFarmStore.addTransaction({
      date: inv.lastPaymentDate,
      type: 'Income',
      source: method === 'Bank' ? 'Bank' : 'Petty Cash',
      category: 'Money Maker Investor Contribution',
      amount: amt,
      description: `Investment top-up for ${inv.name} (${inv.units} units)`,
      reference: ref || `MM-DEP-${Date.now().toString().slice(-4)}`,
      isBanked: isBanked
    });

    return true;
  },


  // Petty Cash & Transactions
  getTransactions: (): PettyCashTransaction[] => getStored<PettyCashTransaction[]>(STORAGE_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS),
  saveTransactions: (txs: PettyCashTransaction[]) => setStored(STORAGE_KEYS.TRANSACTIONS, txs),

  addTransaction: (tx: Omit<PettyCashTransaction, 'id'>): PettyCashTransaction => {
    const list = SaccoFarmStore.getTransactions();
    const newTx: PettyCashTransaction = {
      ...tx,
      id: `TX-${Date.now().toString().slice(-6)}`
    };
    list.unshift(newTx);
    SaccoFarmStore.saveTransactions(list);
    return newTx;
  },

  deleteTransaction: (id: string): boolean => {
    const list = SaccoFarmStore.getTransactions();
    const filtered = list.filter(t => t.id !== id);
    if (filtered.length === list.length) return false;
    SaccoFarmStore.saveTransactions(filtered);
    return true;
  },


  toggleBankedStatus: (id: string): boolean => {
    const list = SaccoFarmStore.getTransactions();
    const tx = list.find(t => t.id === id);
    if (!tx) return false;
    tx.isBanked = !tx.isBanked;
    if (tx.isBanked) {
      tx.bankedDate = new Date().toISOString().split('T')[0];
    } else {
      delete tx.bankedDate;
    }
    SaccoFarmStore.saveTransactions(list);
    return true;
  },


  bankAllAirtelTransactions: (): number => {
    const list = SaccoFarmStore.getTransactions();
    let count = 0;
    const today = new Date().toISOString().split('T')[0];
    list.forEach(tx => {
      if (!tx.isBanked && tx.type === 'Income') {
        tx.isBanked = true;
        tx.bankedDate = today;
        count++;
      }
    });
    if (count > 0) SaccoFarmStore.saveTransactions(list);
    return count;
  },

  // Cattle Herd
  getCattle: (): CattleAnimal[] => {
    const list = getStored<CattleAnimal[]>(STORAGE_KEYS.CATTLE, DEFAULT_CATTLE);
    return list.map(c => ({
      ...c,
      healthHistory: (c.healthHistory && c.healthHistory.length > 0) ? c.healthHistory : (c.id === 'COW-004' || c.tagNumber === 'DC-H04' ? [
        {
          id: 'HLT-004',
          cowId: c.id,
          cowTag: c.tagNumber,
          cowName: c.name,
          date: '2026-11-10',
          illness: 'Acute Mastitis',
          symptoms: 'Swollen right rear quarter, clot formation in milk',
          treatment: 'Intramammary antibiotic infusion and twice-daily stripping',
          medication: 'Penicillin-Streptomycin 20ml IM + Mastijet Fort',
          vetName: 'Dr. David Ssemwogerere',
          status: 'CURRENTLY_SICK' as const,
          notes: 'Milk strictly discarded. Under quarantine in Sick Bay.'
        }
      ] : c.id === 'COW-001' || c.tagNumber === 'DC-H01' ? [
        {
          id: 'HLT-001',
          cowId: c.id,
          cowTag: c.tagNumber,
          cowName: c.name,
          date: '2026-06-12',
          illness: 'Foot Rot (Interdigital Necrobacillosis)',
          symptoms: 'Lameness in left hind foot, foul odor',
          treatment: 'Foot bath copper sulphate 5% + hoof trimming',
          medication: 'Oxytetracycline 20% LA 30ml',
          vetName: 'Dr. David Ssemwogerere',
          recoveredDate: '2026-06-19',
          status: 'RECOVERED' as const,
          notes: 'Full recovery, hoof healed clean. Returned to Barn 1.'
        }
      ] : [])
    }));
  },
  saveCattle: (cattle: CattleAnimal[]) => setStored(STORAGE_KEYS.CATTLE, cattle),

  addCattle: (animal: Omit<CattleAnimal, 'id'>): CattleAnimal => {
    const list = SaccoFarmStore.getCattle();
    const nextNum = list.length + 1;
    const prefix = animal.gender === 'Male' ? 'DC-B' : 'DC-H';
    const tagNumber = animal.tagNumber || `${prefix}${String(nextNum).padStart(2, '0')}`;
    const newAnimal: CattleAnimal = {
      ...animal,
      id: `COW-${Date.now().toString().slice(-4)}`,
      tagNumber
    };
    list.unshift(newAnimal);
    SaccoFarmStore.saveCattle(list);
    return newAnimal;
  },

  updateCattle: (id: string, updates: Partial<CattleAnimal>): CattleAnimal | null => {
    const list = SaccoFarmStore.getCattle();
    const idx = list.findIndex(c => c.id === id || c.tagNumber === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    SaccoFarmStore.saveCattle(list);
    return list[idx];
  },

  deleteCattle: (id: string): boolean => {
    const list = SaccoFarmStore.getCattle();
    const filtered = list.filter(c => c.id !== id && c.tagNumber !== id);
    if (filtered.length === list.length) return false;
    SaccoFarmStore.saveCattle(filtered);
    return true;
  },

  markCowSick: (
    cowId: string,
    details: { illness: string; symptoms?: string; treatment?: string; medication?: string; vetName?: string; notes?: string }
  ): CattleAnimal | null => {
    const list = SaccoFarmStore.getCattle();
    const idx = list.findIndex(c => c.id === cowId || c.tagNumber === cowId);
    if (idx === -1) return null;
    const cow = list[idx];
    const newRecord: CowHealthRecord = {
      id: `HLT-${Date.now().toString().slice(-4)}`,
      cowId: cow.id,
      cowTag: cow.tagNumber,
      cowName: cow.name,
      date: new Date().toISOString().split('T')[0],
      illness: details.illness,
      symptoms: details.symptoms || '',
      treatment: details.treatment || '',
      medication: details.medication || '',
      vetName: details.vetName || 'Dr. David Ssemwogerere',
      status: 'CURRENTLY_SICK',
      notes: details.notes || ''
    };
    const healthHistory = [newRecord, ...(cow.healthHistory || [])];
    const status = cow.status.filter(s => s !== 'Healthy');
    if (!status.includes('Sick')) status.unshift('Sick');
    list[idx] = { ...cow, status, healthHistory };
    SaccoFarmStore.saveCattle(list);
    return list[idx];
  },

  markCowHealthy: (cowId: string, notes?: string): CattleAnimal | null => {
    const list = SaccoFarmStore.getCattle();
    const idx = list.findIndex(c => c.id === cowId || c.tagNumber === cowId);
    if (idx === -1) return null;
    const cow = list[idx];
    const today = new Date().toISOString().split('T')[0];
    const healthHistory = (cow.healthHistory || []).map(h => {
      if (h.status === 'CURRENTLY_SICK' || h.status === 'UNDER_TREATMENT') {
        return { ...h, status: 'RECOVERED' as const, recoveredDate: today, notes: notes ? `${h.notes || ''} [Recovery: ${notes}]` : h.notes };
      }
      return h;
    });
    const status = cow.status.filter(s => s !== 'Sick');
    if (!status.includes('Healthy')) status.unshift('Healthy');
    list[idx] = { ...cow, status, healthHistory };
    SaccoFarmStore.saveCattle(list);
    return list[idx];
  },

  getAllHealthRecords: (): CowHealthRecord[] => {
    const list = SaccoFarmStore.getCattle();
    const allRecords: CowHealthRecord[] = [];
    list.forEach(c => {
      if (c.healthHistory && Array.isArray(c.healthHistory)) {
        allRecords.push(...c.healthHistory);
      }
    });
    return allRecords.sort((a, b) => b.date.localeCompare(a.date));
  },


  // Milk Logs
  getMilkLogs: (): MilkLogRecord[] => getStored<MilkLogRecord[]>(STORAGE_KEYS.MILK, DEFAULT_MILK_LOGS),
  saveMilkLogs: (logs: MilkLogRecord[]) => setStored(STORAGE_KEYS.MILK, logs),

  addMilkLog: (log: Omit<MilkLogRecord, 'id' | 'netSold' | 'revenue'>): MilkLogRecord => {
    const list = SaccoFarmStore.getMilkLogs();
    const morning = Number(log.morning) || 0;
    const afternoon = Number(log.afternoon) || 0;
    const evening = Number(log.evening) || 0;
    const calves = Number(log.calvesConsumption) || 0;
    const totalProduced = morning + afternoon + evening;
    const netSold = Math.max(0, totalProduced - calves);
    const offtakerPrice = Number(log.offtakerPrice) || 1650;
    const revenue = netSold * offtakerPrice;

    const newLog: MilkLogRecord = {
      ...log,
      id: `ML-${Date.now().toString().slice(-5)}`,
      morning,
      afternoon,
      evening,
      calvesConsumption: calves,
      netSold,
      offtakerPrice,
      revenue
    };
    list.unshift(newLog);
    SaccoFarmStore.saveMilkLogs(list);

    // Also auto-post farm income into Petty Cash / Bank transactions
    SaccoFarmStore.addTransaction({
      date: newLog.date,
      type: 'Income',
      source: 'Bank',
      category: 'Milk Off-taker Brookside',
      amount: revenue,
      description: `Daily bulk milk sales: ${netSold}L delivered @ UGX ${offtakerPrice}/L`,
      reference: `MLK-DAY-${newLog.date.replace(/-/g, '')}`,
      isBanked: true,
      bankedDate: newLog.date
    });

    return newLog;
  },

  deleteMilkLog: (id: string): boolean => {
    const list = SaccoFarmStore.getMilkLogs();
    const filtered = list.filter(l => l.id !== id);
    if (filtered.length === list.length) return false;
    SaccoFarmStore.saveMilkLogs(filtered);
    return true;
  },


  // Per-Cow Milk Production Records
  getCowMilkRecords: (): CowMilkRecord[] => getStored<CowMilkRecord[]>(STORAGE_KEYS.COW_MILK, DEFAULT_COW_MILK_LOGS),
  saveCowMilkRecords: (records: CowMilkRecord[]) => setStored(STORAGE_KEYS.COW_MILK, records),

  addCowMilkRecord: (record: Omit<CowMilkRecord, 'id' | 'revenue'>): CowMilkRecord => {
    const list = SaccoFarmStore.getCowMilkRecords();
    const litres = Number(record.litres) || 0;
    const offtakerPrice = Number(record.offtakerPrice) || 1650;
    const revenue = Math.round(litres * offtakerPrice);

    const newRecord: CowMilkRecord = {
      ...record,
      id: `CML-${Date.now().toString().slice(-6)}`,
      litres,
      offtakerPrice,
      revenue
    };
    list.unshift(newRecord);
    SaccoFarmStore.saveCowMilkRecords(list);
    return newRecord;
  },

  deleteCowMilkRecord: (id: string): boolean => {
    const list = SaccoFarmStore.getCowMilkRecords();
    const filtered = list.filter(r => r.id !== id);
    if (filtered.length === list.length) return false;
    SaccoFarmStore.saveCowMilkRecords(filtered);
    return true;
  },


  // Cooperative Loans
  getLoans: (): SaccoLoan[] => getStored<SaccoLoan[]>(STORAGE_KEYS.LOANS, DEFAULT_LOANS),
  saveLoans: (loans: SaccoLoan[]) => setStored(STORAGE_KEYS.LOANS, loans),

  addLoan: (loan: Omit<SaccoLoan, 'id' | 'loanNumber' | 'totalPayable' | 'monthlyRepayment' | 'amountPaid' | 'outstandingBalance'>): SaccoLoan => {
    const list = SaccoFarmStore.getLoans();
    const nextNum = list.length + 1;
    const loanNumber = `LN-${String(nextNum).padStart(3, '0')}`;
    const principal = Number(loan.principal) || 0;
    const rate = Number(loan.interestRate) || 10;
    const duration = Number(loan.durationMonths) || 12;
    const totalInterest = Math.round((principal * rate * (duration / 12)) / 100);
    const totalPayable = principal + totalInterest;
    const monthlyRepayment = Math.round(totalPayable / duration);

    const newLoan: SaccoLoan = {
      ...loan,
      id: loanNumber,
      loanNumber,
      principal,
      interestRate: rate,
      durationMonths: duration,
      monthlyRepayment,
      totalPayable,
      amountPaid: 0,
      outstandingBalance: totalPayable
    };
    list.unshift(newLoan);
    SaccoFarmStore.saveLoans(list);
    return newLoan;
  },

  approveLoan: (id: string): SaccoLoan | null => {
    const list = SaccoFarmStore.getLoans();
    const item = list.find(l => l.id === id || l.loanNumber === id);
    if (!item) return null;
    item.status = 'ACTIVE';
    item.disbursementDate = new Date().toISOString().split('T')[0];
    SaccoFarmStore.saveLoans(list);
    return item;
  },

  recordLoanRepayment: (id: string, amount: number, paymentMethod = 'Bank Wire / Mobile Money', reference = '', notes = ''): SaccoLoan | null => {
    const list = SaccoFarmStore.getLoans();
    const item = list.find(l => l.id === id || l.loanNumber === id);
    if (!item) return null;
    const paid = Number(amount) || 0;
    item.amountPaid += paid;
    item.outstandingBalance = Math.max(0, item.totalPayable - item.amountPaid);
    if (item.outstandingBalance === 0) {
      item.status = 'CLEARED';
    }
    const historyEntry: LoanRepaymentEntry = {
      id: `RPM-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      amount: paid,
      principalPortion: Math.round(paid * 0.9),
      interestPortion: Math.round(paid * 0.1),
      remainingBalance: item.outstandingBalance,
      reference: reference || `LN-PAY-${Date.now().toString().slice(-4)}`,
      paymentMethod,
      notes: notes || 'Monthly Loan Installment'
    };
    if (!item.repaymentHistory) item.repaymentHistory = [];
    item.repaymentHistory.unshift(historyEntry);
    SaccoFarmStore.saveLoans(list);

    // Auto-record in double-entry transactions
    SaccoFarmStore.addTransaction({
      date: historyEntry.date,
      type: 'Income',
      source: paymentMethod.includes('Bank') ? 'Bank' : 'Petty Cash',
      category: `Loan Repayment: ${item.memberName} (${item.loanNumber})`,
      amount: paid,
      description: `Loan repayment for ${item.loanNumber} via ${paymentMethod}. Ref: ${historyEntry.reference}`,
      reference: historyEntry.reference,
      isBanked: paymentMethod.includes('Bank')
    });

    return item;
  },

  // Health Records
  getHealthRecords: (): CattleHealthRecord[] => getStored<CattleHealthRecord[]>(STORAGE_KEYS.HEALTH, DEFAULT_HEALTH),
  saveHealthRecords: (records: CattleHealthRecord[]) => setStored(STORAGE_KEYS.HEALTH, records),

  addHealthRecord: (record: Omit<CattleHealthRecord, 'id'>): CattleHealthRecord => {
    const list = SaccoFarmStore.getHealthRecords();
    const newRecord: CattleHealthRecord = {
      ...record,
      id: `HL-${Date.now().toString().slice(-5)}`
    };
    list.unshift(newRecord);
    SaccoFarmStore.saveHealthRecords(list);

    // If status is ongoing, mark cattle as 'Sick'
    if (record.status === 'Under Treatment') {
      const cattle = SaccoFarmStore.getCattle();
      const cow = cattle.find(c => c.id === record.animalId || c.tagNumber === record.tagNumber);
      if (cow && !cow.status.includes('Sick')) {
        cow.status = [...cow.status.filter(s => s !== 'Healthy'), 'Sick'];
        SaccoFarmStore.saveCattle(cattle);
      }
    }

    // Auto-record expense if cost > 0
    if (record.cost && record.cost > 0) {
      SaccoFarmStore.addTransaction({
        date: record.date,
        type: 'Expense',
        source: 'Petty Cash',
        category: 'Veterinary & Meds',
        amount: Number(record.cost),
        description: `Vet treatment for ${record.animalName || record.tagNumber}: ${record.treatment}`,
        reference: `VET-${record.tagNumber}`,
        isBanked: false
      });
    }

    return newRecord;
  },

  deleteHealthRecord: (id: string): boolean => {
    const list = SaccoFarmStore.getHealthRecords();
    const filtered = list.filter(r => r.id !== id);
    if (filtered.length === list.length) return false;
    SaccoFarmStore.saveHealthRecords(filtered);
    return true;
  },


  // Breeding Records
  getBreedingRecords: (): CattleBreedingRecord[] => getStored<CattleBreedingRecord[]>(STORAGE_KEYS.BREEDING, DEFAULT_BREEDING),
  saveBreedingRecords: (records: CattleBreedingRecord[]) => setStored(STORAGE_KEYS.BREEDING, records),

  addBreedingRecord: (record: Omit<CattleBreedingRecord, 'id' | 'expectedCalving'>): CattleBreedingRecord => {
    const list = SaccoFarmStore.getBreedingRecords();
    // Auto-calculate +283 days gestation
    const servDate = new Date(record.date);
    const calvingDate = new Date(servDate.getTime() + 283 * 24 * 60 * 60 * 1000);
    const expectedCalving = calvingDate.toISOString().split('T')[0];

    const newRecord: CattleBreedingRecord = {
      ...record,
      id: `BR-${Date.now().toString().slice(-5)}`,
      expectedCalving
    };
    list.unshift(newRecord);
    SaccoFarmStore.saveBreedingRecords(list);

    // If confirmed pregnant, update cattle status
    if (record.status === 'Confirmed Pregnant') {
      const cattle = SaccoFarmStore.getCattle();
      const cow = cattle.find(c => c.id === record.animalId || c.tagNumber === record.tagNumber);
      if (cow) {
        if (!cow.status.includes('Pregnant')) cow.status.push('Pregnant');
        cow.stage = 'Pregnant';
        SaccoFarmStore.saveCattle(cattle);
      }
    }

    return newRecord;
  },

  deleteBreedingRecord: (id: string): boolean => {
    const list = SaccoFarmStore.getBreedingRecords();
    const filtered = list.filter(r => r.id !== id);
    if (filtered.length === list.length) return false;
    SaccoFarmStore.saveBreedingRecords(filtered);
    return true;
  },


  // Feed Inventory
  getFeedInventory: (): FeedInventoryItem[] => {
    const raw = getStored<FeedInventoryItem[]>(STORAGE_KEYS.FEEDS, DEFAULT_FEEDS);
    return raw.map(f => {
      const isFarmMade = f.source === 'FARM_MADE' || (f.supplier && f.supplier.toLowerCase().includes('bunker')) || (f.supplier && f.supplier.toLowerCase().includes('farm')) || (Number(f.unitCost) === 0);
      const source: 'BOUGHT' | 'FARM_MADE' = isFarmMade ? 'FARM_MADE' : (f.source || 'BOUGHT');
      const unitCost = isFarmMade ? 0 : (Number(f.unitCost) || 0);
      const totalCost = isFarmMade ? 0 : (f.totalCost !== undefined && !isNaN(Number(f.totalCost)) ? Number(f.totalCost) : (unitCost * (Number(f.currentStock) || 0)));
      return {
        ...f,
        source,
        unitCost,
        totalCost,
        currentStock: Number(f.currentStock) || 0,
        minStock: Number(f.minStock) || 0,
        unit: f.unit || 'kg',
        lastUpdated: f.lastUpdated || new Date().toISOString().split('T')[0]
      };
    });
  },
  saveFeedInventory: (feeds: FeedInventoryItem[]) => {
    setStored(STORAGE_KEYS.FEEDS, feeds);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dc_storage_update'));
    }
  },

  logFeedConsumption: (feedId: string, quantityUsed: number, notes: string): boolean => {
    const feeds = SaccoFarmStore.getFeedInventory();
    const item = feeds.find(f => f.id === feedId);
    if (!item) return false;
    item.currentStock = Math.max(0, item.currentStock - Number(quantityUsed));
    item.lastUpdated = new Date().toISOString().split('T')[0];
    SaccoFarmStore.saveFeedInventory(feeds);
    return true;
  },


  purchaseFeed: (feedId: string, quantityAdded: number, totalCost: number, supplier: string): boolean => {
    const feeds = SaccoFarmStore.getFeedInventory();
    const item = feeds.find(f => f.id === feedId);
    if (!item) return false;
    item.currentStock += Number(quantityAdded);
    if (supplier) item.supplier = supplier;
    item.lastUpdated = new Date().toISOString().split('T')[0];
    SaccoFarmStore.saveFeedInventory(feeds);

    if (totalCost > 0) {
      SaccoFarmStore.addTransaction({
        date: item.lastUpdated,
        type: 'Expense',
        source: 'Bank',
        category: 'Dairy Feed & Silage',
        amount: Number(totalCost),
        description: `Purchased ${quantityAdded} ${item.unit} of ${item.feedType}`,
        reference: `FEED-PURCH-${feedId}`,
        isBanked: true
      });
    }

    return true;
  },

  addFeedItem: (feed: Omit<FeedInventoryItem, 'id' | 'lastUpdated'>): FeedInventoryItem => {
    const feeds = SaccoFarmStore.getFeedInventory();
    const isFarmMade = feed.source === 'FARM_MADE';
    const unitCost = isFarmMade ? 0 : (Number(feed.unitCost) || 0);
    const totalCost = isFarmMade ? 0 : (Number(feed.totalCost) || (unitCost * (Number(feed.currentStock) || 0)));
    const newFeed: FeedInventoryItem = {
      ...feed,
      id: `FD-${Date.now().toString().slice(-4)}`,
      source: feed.source || 'BOUGHT',
      unitCost,
      totalCost,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    feeds.unshift(newFeed);
    SaccoFarmStore.saveFeedInventory(feeds);

    if (!isFarmMade && totalCost > 0) {
      SaccoFarmStore.addTransaction({
        date: newFeed.lastUpdated,
        type: 'Expense',
        source: 'Bank',
        category: 'Dairy Feeds & Nutrition',
        amount: totalCost,
        description: `Procurement of ${newFeed.currentStock} ${newFeed.unit} of ${newFeed.feedType} from ${newFeed.supplier || 'Supplier'}`,
        reference: `FD-PUR-${Date.now().toString().slice(-4)}`,
        isBanked: true
      });
    }

    return newFeed;
  },

  deleteFeedItem: (id: string): boolean => {
    const feeds = SaccoFarmStore.getFeedInventory();
    const filtered = feeds.filter(f => f.id !== id);
    if (filtered.length === feeds.length) return false;
    SaccoFarmStore.saveFeedInventory(filtered);
    return true;
  },

  recordFeedUsage: (id: string, quantity: number, notes?: string): boolean => {
    const feeds = SaccoFarmStore.getFeedInventory();
    const idx = feeds.findIndex(f => f.id === id);
    if (idx === -1) return false;
    feeds[idx].currentStock = Math.max(0, feeds[idx].currentStock - quantity);
    feeds[idx].lastUpdated = new Date().toISOString().split('T')[0];
    if (notes) feeds[idx].notes = (feeds[idx].notes ? feeds[idx].notes + '; ' : '') + `Used ${quantity} ${feeds[idx].unit} (${notes})`;
    SaccoFarmStore.saveFeedInventory(feeds);
    return true;
  },

  // Share Par Value
  getShareParValue: (): number => {
    const val = localStorage.getItem('dc_share_par_value');
    return val ? Number(val) : 250000;
  },

  setShareParValue: (newVal: number): void => {
    localStorage.setItem('dc_share_par_value', String(newVal));
    const members = SaccoFarmStore.getMembers();
    members.forEach(m => {
      m.sharesValue = (Number(m.shares) || 0) * newVal;
    });
    SaccoFarmStore.saveMembers(members);
    window.dispatchEvent(new Event('dc_storage_update'));
  },

  // Custom Navigation Modules
  getCustomModules: (): CustomModule[] => getStored<CustomModule[]>(STORAGE_KEYS.CUSTOM_MODULES, DEFAULT_CUSTOM_MODULES),
  saveCustomModules: (modules: CustomModule[]) => setStored(STORAGE_KEYS.CUSTOM_MODULES, modules),

  addCustomModule: (mod: Omit<CustomModule, 'id' | 'createdAt'>): CustomModule => {
    const modules = SaccoFarmStore.getCustomModules();
    const newMod: CustomModule = {
      ...mod,
      id: `MOD-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    modules.push(newMod);
    SaccoFarmStore.saveCustomModules(modules);
    return newMod;
  },

  deleteCustomModule: (id: string): boolean => {
    const modules = SaccoFarmStore.getCustomModules();
    const filtered = modules.filter(m => m.id !== id);
    if (filtered.length === modules.length) return false;
    SaccoFarmStore.saveCustomModules(filtered);
    return true;
  },



  // Coffee System Batches
  getCoffeeBatches: (): CoffeePurchaseBatch[] => getStored<CoffeePurchaseBatch[]>(STORAGE_KEYS.COFFEE, DEFAULT_COFFEE),
  saveCoffeeBatches: (batches: CoffeePurchaseBatch[]) => setStored(STORAGE_KEYS.COFFEE, batches),

  addCoffeeBatch: (batch: Omit<CoffeePurchaseBatch, 'id' | 'totalPayout'>): CoffeePurchaseBatch => {
    const batches = SaccoFarmStore.getCoffeeBatches();
    const netKg = Number(batch.netWeightKg) || 0;
    const priceKg = Number(batch.pricePerKg) || 0;
    const totalPayout = netKg * priceKg;

    const newBatch: CoffeePurchaseBatch = {
      ...batch,
      id: `CF-${Date.now().toString().slice(-5)}`,
      totalPayout
    };
    batches.unshift(newBatch);
    SaccoFarmStore.saveCoffeeBatches(batches);

    // Auto-record payout as expense
    SaccoFarmStore.addTransaction({
      date: newBatch.date,
      type: 'Expense',
      source: 'Bank',
      category: 'Coffee Outgrower Payout',
      amount: totalPayout,
      description: `Bought ${batch.bags} bags (${netKg}kg) ${batch.variety} from ${batch.farmerName} (${batch.district})`,
      reference: batch.batchCode || `COF-LOT-${newBatch.id}`,
      isBanked: true
    });

    return newBatch;
  },

  updateCoffeeBatchStatus: (id: string, status: CoffeePurchaseBatch['status']): boolean => {
    const batches = SaccoFarmStore.getCoffeeBatches();
    const b = batches.find(item => item.id === id);
    if (!b) return false;
    b.status = status;
    SaccoFarmStore.saveCoffeeBatches(batches);
    return true;
  },


  // Coffee Sales & Exports
  getCoffeeSales: (): CoffeeSaleRecord[] => getStored<CoffeeSaleRecord[]>(STORAGE_KEYS.COFFEE_SALES, DEFAULT_COFFEE_SALES),
  saveCoffeeSales: (sales: CoffeeSaleRecord[]) => setStored(STORAGE_KEYS.COFFEE_SALES, sales),

  addCoffeeSale: (sale: Omit<CoffeeSaleRecord, 'id' | 'totalRevenue'>): CoffeeSaleRecord => {
    const sales = SaccoFarmStore.getCoffeeSales();
    const netKg = Number(sale.netWeightKg) || 0;
    const priceKg = Number(sale.sellingPricePerKg) || 0;
    const totalRevenue = netKg * priceKg;

    const newSale: CoffeeSaleRecord = {
      ...sale,
      id: `CS-${Date.now().toString().slice(-5)}`,
      totalRevenue
    };
    sales.unshift(newSale);
    SaccoFarmStore.saveCoffeeSales(sales);

    // Auto-record sale as Income transaction in SACCO core ledger
    SaccoFarmStore.addTransaction({
      date: newSale.date,
      type: 'Income',
      source: 'Bank',
      category: 'Coffee Export & Trading Revenue',
      amount: totalRevenue,
      description: `Sold ${sale.bags} bags (${netKg}kg) ${sale.variety} to ${sale.buyerName} (${sale.destination})`,
      reference: sale.contractRef || `CS-REV-${newSale.id}`,
      isBanked: true
    });

    // Auto-decrement matching inventory
    const inventory = SaccoFarmStore.getCoffeeInventory();
    const invItem = inventory.find(i => i.variety === sale.variety);
    if (invItem && invItem.totalKg >= netKg) {
      invItem.totalKg -= netKg;
      invItem.totalBags = Math.max(0, invItem.totalBags - Number(sale.bags));
      invItem.lastInspectionDate = new Date().toISOString().split('T')[0];
      SaccoFarmStore.saveCoffeeInventory(inventory);
    }

    return newSale;
  },

  // Coffee Inventory Management
  getCoffeeInventory: (): CoffeeInventoryItem[] => getStored<CoffeeInventoryItem[]>(STORAGE_KEYS.COFFEE_INVENTORY, DEFAULT_COFFEE_INVENTORY),
  saveCoffeeInventory: (inv: CoffeeInventoryItem[]) => setStored(STORAGE_KEYS.COFFEE_INVENTORY, inv),

  updateCoffeeInventoryItem: (id: string, updates: Partial<CoffeeInventoryItem>): boolean => {
    const inv = SaccoFarmStore.getCoffeeInventory();
    const idx = inv.findIndex(i => i.id === id);
    if (idx === -1) return false;
    inv[idx] = { ...inv[idx], ...updates, lastInspectionDate: new Date().toISOString().split('T')[0] };
    SaccoFarmStore.saveCoffeeInventory(inv);
    return true;
  },


  adjustCoffeeStock: (id: string, deltaKg: number, deltaBags: number, reason: string): boolean => {
    const inv = SaccoFarmStore.getCoffeeInventory();
    const item = inv.find(i => i.id === id);
    if (!item) return false;
    item.totalKg = Math.max(0, item.totalKg + deltaKg);
    item.totalBags = Math.max(0, item.totalBags + deltaBags);
    item.lastInspectionDate = new Date().toISOString().split('T')[0];
    SaccoFarmStore.saveCoffeeInventory(inv);
    return true;
  },


  // Computed Financial Metrics (matches exact JBS formula)
  getFinancials: () => {
    const txs = SaccoFarmStore.getTransactions();
    const members = SaccoFarmStore.getMembers();
    const cattle = SaccoFarmStore.getCattle();
    const milkLogs = SaccoFarmStore.getMilkLogs();

    let moneyInBank = 0;
    let pettyCash = 0;
    let totalExpenses = 0;
    let totalIncome = 0;

    txs.forEach(w => {
      const v = Number(w.amount) || 0;
      if (w.type === 'Income') {
        totalIncome += v;
        if (w.source === 'Bank') moneyInBank += v;
        else if (w.source === 'Petty Cash') pettyCash += v;
      } else if (w.type === 'Expense') {
        totalExpenses += v;
        if (w.source === 'Bank') moneyInBank -= v;
        else if (w.source === 'Petty Cash') pettyCash -= v;
      } else if (w.type === 'Transfer') {
        if (w.source === 'Bank') {
          moneyInBank -= v;
          pettyCash += v;
        } else {
          pettyCash -= v;
          moneyInBank += v;
        }
      }
    });

    const totalShares = members.reduce((sum, m) => sum + (Number(m.shares) || 0), 0);
    const totalSharesValue = totalShares * 250000;
    const totalSavings = members.reduce((sum, m) => sum + (Number(m.savings) || 0), 0);
    const totalMemberDeposits = members.reduce((sum, m) => sum + (Number(m.total) || 0), 0);
    const netBalance = moneyInBank + pettyCash;

    // Cattle Herd stats
    const totalCattle = cattle.length;
    const milkingCows = cattle.filter(c => c.stage === 'Milking').length;
    const sickAnimals = cattle.filter(c => c.status.includes('Sick')).length;
    const pregnantCows = cattle.filter(c => c.status.includes('Pregnant')).length;

    // Today's milk
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLog = milkLogs.find(l => l.date === todayStr) || milkLogs[0];
    const todayMilkLitres = todayLog ? (todayLog.morning + todayLog.afternoon + todayLog.evening) : 275;
    const todayMilkRevenue = todayLog ? todayLog.revenue : 396000;

    return {
      moneyInBank,
      pettyCash,
      totalExpenses,
      totalIncome,
      totalShares,
      totalSharesValue,
      totalSavings,
      totalMemberDeposits,
      netBalance,
      totalCattle,
      milkingCows,
      sickAnimals,
      pregnantCows,
      todayMilkLitres,
      todayMilkRevenue
    };
  },

  // Reset to default seed data
  resetAll: () => {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(DEFAULT_MEMBERS));
    localStorage.setItem(STORAGE_KEYS.INVESTORS, JSON.stringify(DEFAULT_INVESTORS));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(DEFAULT_TRANSACTIONS));
    localStorage.setItem(STORAGE_KEYS.CATTLE, JSON.stringify(DEFAULT_CATTLE));
    localStorage.setItem(STORAGE_KEYS.MILK, JSON.stringify(DEFAULT_MILK_LOGS));
    localStorage.setItem(STORAGE_KEYS.HEALTH, JSON.stringify(DEFAULT_HEALTH));
    localStorage.setItem(STORAGE_KEYS.BREEDING, JSON.stringify(DEFAULT_BREEDING));
    localStorage.setItem(STORAGE_KEYS.FEEDS, JSON.stringify(DEFAULT_FEEDS));
    localStorage.setItem(STORAGE_KEYS.COFFEE, JSON.stringify(DEFAULT_COFFEE));
    window.dispatchEvent(new Event('dc_storage_update'));
  },

  // Excel / CSV Export
  exportSaccoMembersCsv: () => {
    const members = SaccoFarmStore.getMembers();
    const headers = ['Member ID', 'Name', 'Phone', 'Category', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Total (UGX)', 'Admin Fee', 'Net Savings (UGX)', 'Shares', 'Shares Value (UGX)', 'Status'];
    const rows = members.map(m => [
      m.memberId,
      `"${m.name}"`,
      `"${m.phone}"`,
      `"${m.category}"`,
      m.jan, m.feb, m.mar, m.apr, m.may, m.jun, m.jul, m.aug, m.sep, m.oct, m.nov, m.dec,
      m.total,
      m.adminFee,
      m.savings,
      m.shares,
      m.sharesValue,
      m.status
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Diaspora_Connect_SACCO_Contributions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportMilkLogsCsv: () => {
    const logs = SaccoFarmStore.getMilkLogs();
    const headers = ['Date', 'Morning (L)', 'Afternoon (L)', 'Evening (L)', 'Total Produced (L)', 'Calves (L)', 'Net Sold (L)', 'Brookside Price (UGX/L)', 'Revenue (UGX)', 'Recorder', 'Notes'];
    const rows = logs.map(l => [
      l.date,
      l.morning,
      l.afternoon,
      l.evening,
      l.morning + l.afternoon + l.evening,
      l.calvesConsumption,
      l.netSold,
      l.offtakerPrice,
      l.revenue,
      `"${l.recorder}"`,
      `"${l.notes.replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Diaspora_Connect_Milk_Production_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportCattleHerdCsv: () => {
    const cattle = SaccoFarmStore.getCattle();
    const headers = ['Tag Number', 'Name', 'Breed', 'Gender', 'Stage', 'Status', 'DOB', 'Weight (kg)', 'Daily Avg Milk (L)', 'Sire/Dam', 'Notes'];
    const rows = cattle.map(c => [
      c.tagNumber,
      `"${c.name}"`,
      `"${c.breed}"`,
      c.gender,
      c.stage,
      `"${c.status.join(', ')}"`,
      c.dob,
      c.weight,
      c.dailyAvgMilk || 0,
      `"${c.sireDam}"`,
      `"${c.notes.replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Diaspora_Connect_Cattle_Herd_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportCowMilkCsv: () => {
    const records = SaccoFarmStore.getCowMilkRecords();
    const headers = ['Record ID', 'Cow Tag', 'Cow Name', 'Date', 'Session', 'Litres (L)', 'Fat/Quality Score (%)', 'Offtaker Rate (UGX)', 'Revenue (UGX)', 'Recorder', 'Notes'];
    const rows = records.map(r => [
      r.id,
      r.cowTag,
      `"${r.cowName}"`,
      r.date,
      r.session,
      r.litres,
      r.fatScore,
      r.offtakerPrice,
      r.revenue,
      `"${r.recorder}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Diaspora_Connect_Cow_Milk_Records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

