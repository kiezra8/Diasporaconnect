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

export interface ShareConversionRequest {
  id: string;
  memberId: string;
  memberName: string;
  shareCount: number;
  amount: number;
  date: string;
  submittedAt: string;
  accountantApproved: boolean;
  accountantApprovedAt?: string;
  accountantApprovedBy?: string;
  adminApproved: boolean;
  adminApprovedAt?: string;
  adminApprovedBy?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
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
  principalPaid?: number;   // running totals from the interest-first allocation
  interestPaid?: number;
}

export interface PettyCashTransaction {
  id: string;
  date: string;
  // 'Journal' = non-cash double-entry posting (e.g. savings → share capital); it never moves Bank / Petty Cash balances
  type: 'Income' | 'Expense' | 'Transfer' | 'Journal';
  source: 'Bank' | 'Petty Cash';
  category: string;
  amount: number;
  description: string;
  reference: string;
  isBanked: boolean;
  bankedDate?: string;
  // Explicit double-entry accounts (optional — derived from type/source/category when absent)
  debitAccount?: string;
  creditAccount?: string;
  payee?: string;
  recordedBy?: string;
  memberId?: string;   // member this entry belongs to (members see their own entries)
}

// ── Member KYC (Know Your Customer) self-verification ────────────────────────
export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface KycSubmission {
  id: string;
  memberId: string;
  memberName: string;
  idType: 'National ID' | 'Passport' | 'Driving Permit';
  idNumber: string;
  dateOfBirth: string;
  nationality: string;
  countryOfResidence: string;
  address: string;
  occupation: string;
  sourceOfFunds: string;
  nextOfKinName: string;
  nextOfKinRelationship: string;
  nextOfKinPhone: string;
  idFrontImage: string;   // compressed JPEG data URL
  idBackImage?: string;   // compressed JPEG data URL
  selfieImage: string;    // compressed JPEG data URL
  submittedAt: string;
  status: Exclude<KycStatus, 'NOT_SUBMITTED'>;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

// ── Member payment requests (deposits & withdrawals) — maker / checker / approver ──
export type PaymentPurpose = 'savings' | 'shares' | 'welfare' | 'project' | 'other';

export interface MemberPaymentRequest {
  id: string;
  memberId: string;
  memberName: string;
  kind: 'DEPOSIT' | 'WITHDRAWAL';
  purpose: PaymentPurpose;
  purposeLabel: string;
  month?: MonthKey;          // savings month allocation
  shareCount?: number;       // shares being bought (computed at submission from par value)
  amount: number;
  method: string;
  reference: string;
  destination?: string;      // withdrawals only
  notes?: string;
  submittedAt: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED_AWAITING_ADMIN' | 'APPROVED' | 'REJECTED';
  verifiedBy?: string;
  verifiedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  postedTransactionId?: string;
}

export type MonthKey = 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun' | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec';
export const MONTH_KEYS: MonthKey[] = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// ── Audit trail ──────────────────────────────────────────────────────────────
export interface Actor { name: string; role: string; email?: string }
export interface AuditEntry {
  id: string;
  at: string;          // ISO timestamp
  actor: string;
  role: string;
  email?: string;
  action: string;      // store operation, e.g. approvePaymentRequest
  entity: string;      // Member, Transaction, Loan, Cow ...
  entityId?: string;
  summary: string;
  details?: string;    // JSON (truncated, images stripped)
}

// ── Staff & task assignment ──────────────────────────────────────────────────
export interface StaffUser { id: string; name: string; email: string; role: string; phone?: string; active: boolean }

export interface TaskDefinition { id: string; area: 'SACCO' | 'Farm'; label: string; description: string; defaultRoles: string[] }
export const TASK_CATALOG: TaskDefinition[] = [
  { id: 'verify_payments', area: 'SACCO', label: 'Verify member payments', description: 'Match member deposits / withdrawals to bank & mobile-money statements', defaultRoles: ['ACCOUNTANT'] },
  { id: 'approve_payments', area: 'SACCO', label: 'Approve member payments', description: 'Final approval that posts deposits, share purchases and withdrawals', defaultRoles: ['ADMIN'] },
  { id: 'record_income', area: 'SACCO', label: 'Record income manually', description: 'Enter savings, share purchases, repayments and other income received off-portal', defaultRoles: ['ACCOUNTANT'] },
  { id: 'record_expenses', area: 'SACCO', label: 'Record expenses', description: 'Post SACCO and farm expenditure', defaultRoles: ['ACCOUNTANT'] },
  { id: 'post_journals', area: 'SACCO', label: 'Post journal entries', description: 'Debit / credit adjustments', defaultRoles: ['ACCOUNTANT'] },
  { id: 'loan_processing', area: 'SACCO', label: 'Process loans & repayments', description: 'Approve loans and record repayments', defaultRoles: ['ACCOUNTANT', 'ADMIN'] },
  { id: 'kyc_review', area: 'SACCO', label: 'Review member KYC', description: 'Verify or reject identity documents', defaultRoles: ['SECRETARY', 'ADMIN'] },
  { id: 'member_registration', area: 'SACCO', label: 'Register members', description: 'Capture new member applications', defaultRoles: ['SECRETARY'] },
  { id: 'month_end_close', area: 'SACCO', label: 'Month-end close', description: 'Close a month so its figures can no longer change', defaultRoles: ['ACCOUNTANT'] },
  { id: 'dividends', area: 'SACCO', label: 'Declare & pay dividends', description: 'Compute and pay annual dividends', defaultRoles: ['ADMIN'] },
  { id: 'sms_broadcast', area: 'SACCO', label: 'Member SMS & notices', description: 'Send SMS alerts and notices to members', defaultRoles: ['SECRETARY', 'ADMIN'] },
  { id: 'milk_recording', area: 'Farm', label: 'Record milk', description: 'Enter per-cow milk records each session', defaultRoles: ['FARM_WORKER'] },
  { id: 'herd_register', area: 'Farm', label: 'Manage herd register', description: 'Add cows, calves and update cattle details', defaultRoles: ['FARM_WORKER'] },
  { id: 'animal_health', area: 'Farm', label: 'Animal health & vet records', description: 'Log sickness, treatment and recovery', defaultRoles: ['FARM_WORKER'] },
  { id: 'feeds_stock', area: 'Farm', label: 'Feeds & stock', description: 'Record feed purchases and usage', defaultRoles: ['FARM_WORKER'] },
  { id: 'breeding', area: 'Farm', label: 'Breeding & calving', description: 'Record services, pregnancies and calvings', defaultRoles: ['FARM_WORKER'] },
];
export interface TaskAssignment { taskId: string; assigneeEmails: string[]; notes?: string; dueRule?: string; updatedBy?: string; updatedAt?: string }

// ── Month-end close & dividends ──────────────────────────────────────────────
export interface PeriodClose {
  month: string;             // YYYY-MM
  closedAt: string;
  closedBy: string;
  income: number;
  revenue: number;
  expenses: number;
  surplus: number;
  trialBalanced: boolean;
  status: 'CLOSED' | 'REOPENED';
  reopenReason?: string;
}
export interface DividendParams { year: number; reservePct: number; educationPct: number; payoutPct: number; method: 'shares' | 'share-months' }
export interface DividendRow { memberId: string; memberName: string; shares: number; weight: number; amount: number }
export interface DividendDeclaration extends DividendParams {
  id: string;
  revenue: number;
  expenses: number;
  surplus: number;
  reserve: number;
  education: number;
  pool: number;
  ratePerShare: number;
  rows: DividendRow[];
  declaredAt: string;
  declaredBy: string;
  status: 'DECLARED' | 'PAID';
  paidAt?: string;
  paidBy?: string;
}

// ── SMS alerts ───────────────────────────────────────────────────────────────
export type SmsEvent = 'payment_received' | 'payment_approved' | 'payment_rejected' | 'kyc_verified' | 'kyc_rejected' | 'loan_repayment' | 'manual_income' | 'dividend_paid' | 'broadcast';
export const SMS_EVENT_LABELS: Record<SmsEvent, string> = {
  payment_received: 'Mobile-money payment received',
  payment_approved: 'Deposit / withdrawal approved',
  payment_rejected: 'Deposit / withdrawal rejected',
  kyc_verified: 'KYC verified',
  kyc_rejected: 'KYC rejected',
  loan_repayment: 'Loan repayment received',
  manual_income: 'Payment recorded by Accountant',
  dividend_paid: 'Dividend paid',
  broadcast: 'Broadcast messages',
};
export interface SmsSettings { enabled: boolean; senderId: string; events: Record<SmsEvent, boolean> }
export interface SmsMessage {
  id: string;
  event: SmsEvent;
  to: string;
  memberId?: string;
  message: string;
  createdAt: string;
  status: 'QUEUED' | 'SENT' | 'FAILED';
  providerRef?: string;
  error?: string;
}

// ── Income source buckets used by accounting reports ─────────────────────────
export type IncomeSource = 'Savings' | 'Share Purchases' | 'Milk Sales (Farm)' | 'Loan Interest' | 'Loan Repayments' | 'Member Funds' | 'Other Income';
export const INCOME_SOURCES: IncomeSource[] = ['Savings', 'Share Purchases', 'Milk Sales (Farm)', 'Loan Interest', 'Loan Repayments', 'Member Funds', 'Other Income'];
/** Income that is SACCO revenue (counts toward surplus & dividends). Savings, shares, member funds and loan principal are money held for members, not earnings. */
export const REVENUE_SOURCES: IncomeSource[] = ['Milk Sales (Farm)', 'Loan Interest', 'Other Income'];

export function classifyIncome(tx: Pick<PettyCashTransaction, 'category' | 'description'>): IncomeSource {
  const c = `${tx.category || ''}`.toLowerCase();
  const d = `${tx.description || ''}`.toLowerCase();
  if (/loan interest/.test(c)) return 'Loan Interest';
  if (/loan repayment/.test(c)) return 'Loan Repayments';
  if (/share/.test(c)) return 'Share Purchases';
  if (/milk|dairy|brookside/.test(c)) return 'Milk Sales (Farm)';
  if (/welfare|project|special deposit|member fund/.test(c)) return 'Member Funds';
  if (/saving|contribution|member cash deposit|deposit/.test(c)) return 'Savings';
  if (/share/.test(d)) return 'Share Purchases';
  if (/milk/.test(d)) return 'Milk Sales (Farm)';
  if (/saving/.test(d)) return 'Savings';
  return 'Other Income';
}

/** One side of a double-entry posting */
export interface LedgerLine {
  txId: string;
  date: string;
  reference: string;
  account: string;
  narration: string;
  debit: number;
  credit: number;
}

const cashAccount = (source: PettyCashTransaction['source']) =>
  source === 'Petty Cash' ? '1010 — Petty Cash / Mobile Money Float' : '1001 — Cash at Bank';

function incomeAccount(tx: PettyCashTransaction): string {
  switch (classifyIncome(tx)) {
    case 'Savings': return '3010 — Member Savings';
    case 'Share Purchases': return '3020 — Share Capital';
    case 'Milk Sales (Farm)': return '4010 — Milk Sales Revenue';
    case 'Loan Repayments': return '1200 — Loans Receivable';
    case 'Loan Interest': return '4020 — Loan Interest Income';
    case 'Member Funds': return '3030 — Welfare & Project Funds';
    default: return '4090 — Other Income';
  }
}

function expenseAccount(tx: PettyCashTransaction): string {
  const c = (tx.category || '').toLowerCase();
  if (/withdrawal/.test(c)) return '3010 — Member Savings';
  if (/loan (facility )?disbursement|loan disbursement/.test(c)) return '1200 — Loans Receivable';
  return `5000 — Expense: ${tx.category || 'General'}`;
}

/** Turns every ledger transaction into balanced debit / credit lines. */
export function toLedgerLines(txs: PettyCashTransaction[]): LedgerLine[] {
  const lines: LedgerLine[] = [];
  txs.forEach(tx => {
    const amt = Number(tx.amount) || 0;
    if (amt <= 0) return;
    let dr: string;
    let cr: string;
    if (tx.debitAccount && tx.creditAccount) {
      dr = tx.debitAccount;
      cr = tx.creditAccount;
    } else if (tx.type === 'Income') {
      dr = cashAccount(tx.source);
      cr = incomeAccount(tx);
    } else if (tx.type === 'Expense') {
      dr = expenseAccount(tx);
      cr = cashAccount(tx.source);
    } else if (tx.type === 'Transfer') {
      // Transfer FROM source to the other cash account
      dr = tx.source === 'Bank' ? cashAccount('Petty Cash') : cashAccount('Bank');
      cr = cashAccount(tx.source);
    } else {
      // Legacy journal text: "Journal: Dr X / Cr Y"
      const m = /Dr\s+(.+?)\s*\/\s*Cr\s+(.+)$/i.exec(tx.category || '');
      dr = m ? m[1].trim() : 'Suspense (Dr)';
      cr = m ? m[2].trim() : 'Suspense (Cr)';
    }
    const narration = tx.description || tx.category;
    lines.push({ txId: tx.id, date: tx.date, reference: tx.reference, account: dr, narration, debit: amt, credit: 0 });
    lines.push({ txId: tx.id, date: tx.date, reference: tx.reference, account: cr, narration, debit: 0, credit: amt });
  });
  return lines;
}

export interface TrialBalanceRow { account: string; debit: number; credit: number; balance: number; side: 'Dr' | 'Cr' }

export function buildTrialBalance(txs: PettyCashTransaction[]): { rows: TrialBalanceRow[]; totalDebit: number; totalCredit: number; balanced: boolean } {
  const map = new Map<string, { debit: number; credit: number }>();
  toLedgerLines(txs).forEach(l => {
    const r = map.get(l.account) || { debit: 0, credit: 0 };
    r.debit += l.debit;
    r.credit += l.credit;
    map.set(l.account, r);
  });
  const rows: TrialBalanceRow[] = Array.from(map.entries())
    .map(([account, v]) => {
      const net = v.debit - v.credit;
      return { account, debit: v.debit, credit: v.credit, balance: Math.abs(net), side: (net >= 0 ? 'Dr' : 'Cr') as 'Dr' | 'Cr' };
    })
    .sort((a, b) => a.account.localeCompare(b.account));
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  return { rows, totalDebit, totalCredit, balanced: Math.round(totalDebit) === Math.round(totalCredit) };
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

export const STORAGE_KEYS = {
  MEMBERS: 'dc_sacco_members_v2',
  INVESTORS: 'dc_sacco_investors_v2',
  TRANSACTIONS: 'dc_sacco_transactions_v2',
  CATTLE: 'dc_farm_cattle_v2',
  MILK: 'dc_farm_milk_v2',
  COW_MILK: 'dc_farm_cow_milk_v2',
  HEALTH: 'dc_farm_health_v2',
  BREEDING: 'dc_farm_breeding_v2',
  FEEDS: 'dc_farm_feeds_v2',
  LOANS: 'dc_sacco_loans_v2',
  SHARE_CONVERSIONS: 'dc_share_conversions_v2',
  KYC: 'dc_member_kyc_v1',
  PAYMENT_REQUESTS: 'dc_member_payment_requests_v1',
  AUDIT: 'dc_audit_trail_v1',
  STAFF: 'dc_staff_directory_v1',
  TASKS: 'dc_task_assignments_v1',
  PERIODS: 'dc_period_closes_v1',
  DIVIDENDS: 'dc_dividends_v1',
  SMS_SETTINGS: 'dc_sms_settings_v1',
  SMS_LOG: 'dc_sms_log_v1',
  SHARE_PAR: 'dc_share_par_value'
};

const DEFAULT_STAFF: StaffUser[] = [
  { id: 'STF-01', name: 'Ezra Kisakye', email: 'admin@diasporaconnectt.com', role: 'ADMIN', active: true },
  { id: 'STF-02', name: 'Mrs. Miriam Halera', email: 'accountant@diasporaconnectt.com', role: 'ACCOUNTANT', active: true },
  { id: 'STF-03', name: 'Mr. Halera John Bahati', email: 'secretary@diasporaconnectt.com', role: 'SECRETARY', active: true },
  { id: 'STF-04', name: 'Mr. Nyanzi Edrine', email: 'board@diasporaconnectt.com', role: 'BOARD_MEMBER', active: true },
  { id: 'STF-05', name: 'Mugisha Joseph', email: 'farm@diasporaconnectt.com', role: 'FARM_WORKER', active: true },
];

const DEFAULT_SMS_SETTINGS: SmsSettings = {
  enabled: true,
  senderId: 'DIASPORA',
  events: { payment_received: true, payment_approved: true, payment_rejected: true, kyc_verified: true, kyc_rejected: true, loan_repayment: true, manual_income: true, dividend_paid: true, broadcast: true },
};

// Who is acting right now (set by each portal on load) — stamped on audit entries
let currentActor: Actor = { name: 'System', role: 'SYSTEM' };

// Listeners notified after every save (used by the cloud sync to push changes to the server)
type StoreWriteListener = (key: string, value: unknown) => void;
const writeListeners: StoreWriteListener[] = [];
export function onStoreWrite(fn: StoreWriteListener): () => void {
  writeListeners.push(fn);
  return () => { const i = writeListeners.indexOf(fn); if (i >= 0) writeListeners.splice(i, 1); };
}

// Seed queue — replaces the hard-coded demo queues that used to live inside the Accountant & Admin portals
const DEFAULT_PAYMENT_REQUESTS: MemberPaymentRequest[] = [
  {
    id: 'PRQ-9410',
    memberId: 'DC-006',
    memberName: 'David Mukasa',
    kind: 'DEPOSIT',
    purpose: 'shares',
    purposeLabel: 'Buying Shares',
    shareCount: 10,
    amount: 2500000,
    method: 'Airtel Money',
    reference: 'AIRTEL-7729104',
    submittedAt: '2026-11-12 10:45',
    status: 'PENDING_VERIFICATION'
  },
  {
    id: 'PRQ-9411',
    memberId: 'DC-006',
    memberName: 'David Mukasa',
    kind: 'DEPOSIT',
    purpose: 'savings',
    purposeLabel: 'Monthly Savings (November)',
    month: 'nov',
    amount: 1000000,
    method: 'Bank Wire',
    reference: 'STN-WIRE-40192',
    submittedAt: '2026-11-12 11:10',
    status: 'PENDING_VERIFICATION'
  },
  {
    id: 'PRQ-9402',
    memberId: 'DC-006',
    memberName: 'David Mukasa',
    kind: 'DEPOSIT',
    purpose: 'savings',
    purposeLabel: 'Monthly Savings (November)',
    month: 'nov',
    amount: 1500000,
    method: 'Bank Wire',
    reference: 'STN-WIRE-40188',
    submittedAt: '2026-11-12 09:05',
    status: 'VERIFIED_AWAITING_ADMIN',
    verifiedBy: 'Mrs. Miriam Halera (Accountant)',
    verifiedAt: '2026-11-12 09:30'
  },
  {
    id: 'PRQ-9405',
    memberId: 'DC-007',
    memberName: 'Amara Okello',
    kind: 'WITHDRAWAL',
    purpose: 'savings',
    purposeLabel: 'Savings Withdrawal',
    amount: 2000000,
    method: 'MTN Mobile Money',
    destination: 'MTN Mobile Money',
    reference: 'WTH-740291',
    submittedAt: '2026-11-12 10:40',
    status: 'VERIFIED_AWAITING_ADMIN',
    verifiedBy: 'Mrs. Miriam Halera (Accountant)',
    verifiedAt: '2026-11-12 11:15'
  }
];

const nowStamp = () => new Date().toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
const todayISO = () => new Date().toISOString().split('T')[0];
const purposeLabelOf = (p: PaymentPurpose, month?: MonthKey, other?: string) =>
  p === 'savings' ? `Monthly Savings${month ? ` (${month.toUpperCase()})` : ''}`
  : p === 'shares' ? 'Buying Shares'
  : p === 'welfare' ? 'Welfare & Emergency Fund'
  : p === 'project' ? 'Special Farm Project'
  : (other || 'Other Special Deposit');

// One-time cleanup: coffee trading and custom modules are no longer part of the SACCO
function purgeRetiredModules() {
  try {
    if (localStorage.getItem('dc_retired_modules_purged_v1') === '1') return;
    ['dc_coffee_batches_v2', 'dc_coffee_sales_v2', 'dc_coffee_inventory_v2', 'dc_custom_modules_v2', 'dc_custom_nav_modules', 'dc_module_creator_roles']
      .forEach(k => localStorage.removeItem(k));
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (raw) {
      const txs = JSON.parse(raw) as PettyCashTransaction[];
      const kept = txs.filter(t => !/coffee/i.test(`${t.category} ${t.description}`));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(kept));
    }
    localStorage.setItem('dc_retired_modules_purged_v1', '1');
  } catch {}
}
purgeRetiredModules();

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
    purpose: 'Solar Milk Cooling Unit Installation',
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
export const getMemberPhoto = (name: string): string => {
  const n = (name || '').toLowerCase();
  if (n.includes('nyanzi') || n.includes('edrine')) return '/images/nyanzi_edrine.jpg';
  if ((n.includes('miriam') || n.includes('halera')) && !n.includes('john') && !n.includes('bahati')) return '/images/miriam_halera.jpg';
  if (n.includes('namulindwa') || n.includes('flavia') || n.includes('mary')) return '/images/namulindwa_mary_flavia.jpg';
  if (n.includes('john') || n.includes('bahati')) return '/images/halera_john_bahati.jpg';
  if (n.includes('ssanyu') || n.includes('phiona')) return '/images/ssanyu_phiona.jpg';
  return '';
};

// Strip big data URLs (KYC images) and cap size before writing audit details
function safeDetails(v: unknown): string {
  try {
    const s = JSON.stringify(v, (_k, val) => (typeof val === 'string' && val.startsWith('data:') ? '[image]' : val));
    return s.length > 1500 ? s.slice(0, 1500) + '…' : s;
  } catch { return ''; }
}

/** 07XX / +256 7XX / 2567XX → 2567XXXXXXXX (E.164 without +) — returns '' if it isn't a usable number. */
export function normalizeUgPhone(raw: string): string {
  const digits = String(raw || '').replace(/[^0-9]/g, '');
  if (/^0\d{9}$/.test(digits)) return '256' + digits.slice(1);
  if (/^256\d{9}$/.test(digits)) return digits;
  if (/^\d{9}$/.test(digits) && digits.startsWith('7')) return '256' + digits;
  return digits.length >= 10 && digits.length <= 15 ? digits : '';
}

// Operating expenses reduce surplus; member withdrawals and loan disbursements are balance-sheet movements
function isOperatingExpense(t: PettyCashTransaction): boolean {
  return !/withdrawal|loan (facility )?disbursement/i.test(t.category || '');
}

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
    writeListeners.forEach(fn => { try { fn(key, val); } catch {} });
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
    const memberId = SaccoFarmStore.nextMemberId();
    const months = [member.jan, member.feb, member.mar, member.apr, member.may, member.jun, member.jul, member.aug, member.sep, member.oct, member.nov, member.dec];
    const total = months.reduce((acc, m) => acc + (Number(m) || 0), 0);
    const adminFee = Number(member.adminFee) || 50000;
    const savings = Math.max(0, total - adminFee);
    const shares = Number(member.shares) || 0;
    const sharesValue = shares * SaccoFarmStore.getShareParValue();

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

  /** Next member number in sequence: DC-001, DC-002 … (never reuses a number). */
  nextMemberId: (): string => {
    const nums = SaccoFarmStore.getMembers().map(m => parseInt(String(m.memberId || m.id).replace(/\D/g, ''), 10)).filter(n => Number.isFinite(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `DC-${String(next).padStart(3, '0')}`;
  },

  /**
   * A membership application approved by both Secretary and Admin becomes a member:
   * next member number, and the KYC captured at sign-up is recorded as verified.
   */
  activateApplication: (app: any, approver: string): SaccoMember => {
    const kyc = app.kyc || {};
    const member = SaccoFarmStore.addMember({
      memberId: '',
      name: app.fullName,
      phone: app.phone,
      category: app.chapter ? `Diaspora (${app.chapter})` : 'Ordinary Member',
      shares: 4,
      adminFee: 50000,
      email: app.email,
      nin: kyc.idNumber || `CM${Math.floor(10000000 + Math.random() * 90000000)}Z`,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      avatar: app.photoUrl || undefined,
      jan: 2050000, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
      jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
    } as any);
    if (kyc.idNumber) {
      const list = SaccoFarmStore.getKycSubmissions();
      list.unshift({
        id: `KYC-${app.id || Date.now().toString().slice(-6)}`,
        memberId: member.memberId,
        memberName: member.name,
        idType: kyc.idType, idNumber: kyc.idNumber, dateOfBirth: kyc.dateOfBirth || app.dob || '',
        nationality: kyc.nationality || '', countryOfResidence: kyc.countryOfResidence || '', address: kyc.address || '',
        occupation: kyc.occupation || '', sourceOfFunds: kyc.sourceOfFunds || '',
        nextOfKinName: kyc.nextOfKinName || '', nextOfKinRelationship: kyc.nextOfKinRelationship || '', nextOfKinPhone: kyc.nextOfKinPhone || '',
        idFrontImage: kyc.idFrontImage || '', idBackImage: kyc.idBackImage, selfieImage: kyc.selfieImage || '',
        submittedAt: app.submittedAt || nowStamp(),
        status: 'VERIFIED',
        reviewedBy: approver,
        reviewedAt: nowStamp(),
      });
      setStored(STORAGE_KEYS.KYC, list);
    }
    return member;
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
    merged.sharesValue = merged.shares * SaccoFarmStore.getShareParValue();
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


  convertSavingsToShares: (memberId: string, shareCount: number, sharePrice = SaccoFarmStore.getShareParValue()): { success: boolean; msg: string } => {
    const members = SaccoFarmStore.getMembers();
    const m = members.find(item => item.id === memberId || item.memberId === memberId);
    if (!m) return { success: false, msg: 'Member not found' };
    const cost = shareCount * sharePrice;
    if (m.savings < cost) {
      return { success: false, msg: `Insufficient savings balance (${m.savings.toLocaleString()} UGX) for ${shareCount} shares (${cost.toLocaleString()} UGX)` };
    }

    // Deduct cost from months from latest to earliest so total matches savings
    let remainingToDeduct = cost;
    const monthKeys: (keyof SaccoMember)[] = ['dec', 'nov', 'oct', 'sep', 'aug', 'jul', 'jun', 'may', 'apr', 'mar', 'feb', 'jan'];
    for (const mk of monthKeys) {
      if (remainingToDeduct <= 0) break;
      const currentVal = Number(m[mk]) || 0;
      if (currentVal > 0) {
        const deduct = Math.min(currentVal, remainingToDeduct);
        (m as any)[mk] = currentVal - deduct;
        remainingToDeduct -= deduct;
      }
    }

    m.shares = (Number(m.shares) || 0) + shareCount;
    m.sharesValue = m.shares * sharePrice;
    const months = [m.jan, m.feb, m.mar, m.apr, m.may, m.jun, m.jul, m.aug, m.sep, m.oct, m.nov, m.dec];
    m.total = months.reduce((acc, val) => acc + (Number(val) || 0), 0);
    m.savings = Math.max(0, m.total - (Number(m.adminFee) || 50000));
    m.withdrawable = Math.round(m.savings * 0.9);

    const idx = members.findIndex(item => item.id === m.id || item.memberId === m.memberId);
    if (idx !== -1) {
      members[idx] = m;
      SaccoFarmStore.saveMembers(members);
    }
    return { success: true, msg: `Converted ${cost.toLocaleString()} UGX savings into ${shareCount} shares successfully.` };
  },

  // Share Conversion Requests (Dual-Approval: Accountant + Admin)
  getShareConversionRequests: (): ShareConversionRequest[] => {
    return getStored<ShareConversionRequest[]>(STORAGE_KEYS.SHARE_CONVERSIONS, []);
  },

  saveShareConversionRequests: (requests: ShareConversionRequest[]) => {
    setStored(STORAGE_KEYS.SHARE_CONVERSIONS, requests);
  },

  addShareConversionRequest: (req: { memberId: string; memberName: string; shareCount: number }): { success: boolean; request?: ShareConversionRequest; msg: string } => {
    const cost = req.shareCount * SaccoFarmStore.getShareParValue();
    const members = SaccoFarmStore.getMembers();
    const m = members.find(item => item.id === req.memberId || item.memberId === req.memberId);
    if (!m) return { success: false, msg: 'Member not found' };
    if (m.savings < cost) {
      return { success: false, msg: `Insufficient savings balance (UGX ${m.savings.toLocaleString()}) for ${req.shareCount} shares (UGX ${cost.toLocaleString()})` };
    }

    const requests = SaccoFarmStore.getShareConversionRequests();
    const newReq: ShareConversionRequest = {
      id: `SCR-${Date.now().toString().slice(-6)}`,
      memberId: m.memberId,
      memberName: m.name,
      shareCount: req.shareCount,
      amount: cost,
      date: new Date().toISOString().split('T')[0],
      submittedAt: new Date().toLocaleString(),
      accountantApproved: false,
      adminApproved: false,
      status: 'PENDING'
    };

    requests.unshift(newReq);
    SaccoFarmStore.saveShareConversionRequests(requests);
    return { success: true, request: newReq, msg: 'Share conversion request submitted for Accountant & Admin approval.' };
  },

  approveShareConversionRequest: (
    requestId: string,
    role: 'ACCOUNTANT' | 'ADMIN',
    approverName: string
  ): { success: boolean; fullyApproved: boolean; msg: string } => {
    const requests = SaccoFarmStore.getShareConversionRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return { success: false, fullyApproved: false, msg: 'Request not found' };
    if (req.status !== 'PENDING') return { success: false, fullyApproved: false, msg: `Request is already ${req.status}` };

    if (role === 'ACCOUNTANT') {
      req.accountantApproved = true;
      req.accountantApprovedAt = new Date().toLocaleString();
      req.accountantApprovedBy = approverName;
    } else if (role === 'ADMIN') {
      req.adminApproved = true;
      req.adminApprovedAt = new Date().toLocaleString();
      req.adminApprovedBy = approverName;
    }

    let fullyApproved = false;
    if (req.accountantApproved && req.adminApproved) {
      // Execute the conversion
      const convRes = SaccoFarmStore.convertSavingsToShares(req.memberId, req.shareCount);
      if (!convRes.success) {
        if (role === 'ACCOUNTANT') req.accountantApproved = false;
        if (role === 'ADMIN') req.adminApproved = false;
        SaccoFarmStore.saveShareConversionRequests(requests);
        return { success: false, fullyApproved: false, msg: convRes.msg };
      }

      req.status = 'APPROVED';
      fullyApproved = true;

      // Non-cash double-entry: Dr Member Savings (liability falls) / Cr Share Capital (equity rises)
      SaccoFarmStore.addTransaction({
        date: new Date().toISOString().split('T')[0],
        type: 'Journal',
        source: 'Bank',
        debitAccount: '3010 — Member Savings',
        creditAccount: '3020 — Share Capital',
        category: `Share Conversion: ${req.memberName}`,
        amount: req.amount,
        description: `Dual-Approved: Converted UGX ${req.amount.toLocaleString()} savings to ${req.shareCount} shares for ${req.memberName} (${req.memberId}). Verified by Accountant & Authorized by Admin.`,
        reference: req.id,
        isBanked: true,
      });
    }

    SaccoFarmStore.saveShareConversionRequests(requests);
    const msg = fullyApproved
      ? `Share conversion request ${req.id} fully dual-approved! ${req.shareCount} shares credited and savings deducted.`
      : `${role === 'ACCOUNTANT' ? 'Accountant' : 'Admin'} approved request ${req.id}. Awaiting ${role === 'ACCOUNTANT' ? 'Admin' : 'Accountant'} dual authorization.`;
    return { success: true, fullyApproved, msg };
  },

  rejectShareConversionRequest: (requestId: string, reason?: string): boolean => {
    const requests = SaccoFarmStore.getShareConversionRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return false;
    req.status = 'REJECTED';
    req.rejectionReason = reason || 'Rejected by management';
    SaccoFarmStore.saveShareConversionRequests(requests);
    return true;
  },

  // ── Single source of truth for money a member pays in ─────────────────────
  // Every portal (Admin direct entry, Member request after approval) calls this, so
  // member balances, share counts and the ledger can never drift apart.
  applyMemberDeposit: (args: {
    memberId: string;
    purpose: PaymentPurpose;
    amount: number;
    month?: MonthKey;
    shareCount?: number;
    method?: string;
    reference?: string;
    otherLabel?: string;
    notes?: string;
    date?: string;
  }): { success: boolean; msg: string; tx?: PettyCashTransaction } => {
    const members = SaccoFarmStore.getMembers();
    const m = members.find(x => x.id === args.memberId || x.memberId === args.memberId);
    if (!m) return { success: false, msg: 'Member not found' };
    const amount = Number(args.amount) || 0;
    if (amount <= 0) return { success: false, msg: 'Amount must be greater than zero' };
    const par = SaccoFarmStore.getShareParValue();
    const method = args.method || 'Bank Wire';
    const isBank = /bank/i.test(method);
    const ref = args.reference || `DEP-${Date.now().toString().slice(-6)}`;
    const who = `${m.name} (${m.memberId})`;
    let category: string;
    let description: string;

    if (args.purpose === 'shares') {
      const count = args.shareCount && args.shareCount > 0 ? args.shareCount : Math.floor(amount / par);
      if (count < 1) return { success: false, msg: `Amount is below the price of one share (UGX ${par.toLocaleString()})` };
      SaccoFarmStore.updateMember(m.id, { shares: (Number(m.shares) || 0) + count });
      category = `Share Capital Purchase: ${who}`;
      description = `Purchased ${count} share(s) @ UGX ${par.toLocaleString()} via ${method}. Ref: ${ref}. ${args.notes || ''}`.trim();
    } else if (args.purpose === 'savings') {
      const month = args.month || MONTH_KEYS[new Date().getMonth()];
      SaccoFarmStore.updateMember(m.id, { [month]: (Number(m[month]) || 0) + amount } as Partial<SaccoMember>);
      category = `Member Savings: ${who}`;
      description = `Monthly savings for ${month.toUpperCase()} via ${method}. Ref: ${ref}. ${args.notes || ''}`.trim();
    } else {
      const label = purposeLabelOf(args.purpose, undefined, args.otherLabel);
      category = `${label}: ${who}`;
      description = `${label} contribution via ${method}. Ref: ${ref}. ${args.notes || ''}`.trim();
    }

    const tx = SaccoFarmStore.addTransaction({
      memberId: m.memberId,
      date: args.date || todayISO(),
      type: 'Income',
      source: isBank ? 'Bank' : 'Petty Cash',
      category,
      amount,
      description,
      reference: ref,
      isBanked: isBank,
    });
    return { success: true, msg: `UGX ${amount.toLocaleString()} posted for ${m.name}.`, tx };
  },

  /** Deducts a withdrawal from the member's latest months first and posts the cash out. */
  applyMemberWithdrawal: (args: { memberId: string; amount: number; method?: string; reference?: string; notes?: string }): { success: boolean; msg: string; tx?: PettyCashTransaction } => {
    const members = SaccoFarmStore.getMembers();
    const m = members.find(x => x.id === args.memberId || x.memberId === args.memberId);
    if (!m) return { success: false, msg: 'Member not found' };
    const amount = Number(args.amount) || 0;
    if (amount <= 0) return { success: false, msg: 'Amount must be greater than zero' };
    if (amount > m.withdrawable) return { success: false, msg: `Exceeds withdrawable balance (UGX ${m.withdrawable.toLocaleString()})` };
    const updates: Partial<SaccoMember> = {};
    let remaining = amount;
    [...MONTH_KEYS].reverse().forEach(k => {
      if (remaining <= 0) return;
      const cur = Number(m[k]) || 0;
      const take = Math.min(cur, remaining);
      if (take > 0) { (updates as any)[k] = cur - take; remaining -= take; }
    });
    SaccoFarmStore.updateMember(m.id, updates);
    const method = args.method || 'Mobile Money';
    const isBank = /bank/i.test(method);
    const ref = args.reference || `WTH-${Date.now().toString().slice(-6)}`;
    const tx = SaccoFarmStore.addTransaction({
      date: todayISO(),
      type: 'Expense',
      source: isBank ? 'Bank' : 'Petty Cash',
      memberId: m.memberId,
      category: `Member Savings Withdrawal: ${m.name} (${m.memberId})`,
      amount,
      description: `Savings withdrawal paid via ${method}. Ref: ${ref}. ${args.notes || ''}`.trim(),
      reference: ref,
      isBanked: isBank,
    });
    return { success: true, msg: `Withdrawal of UGX ${amount.toLocaleString()} paid to ${m.name}.`, tx };
  },

  // ── Member payment requests: Member submits → Accountant verifies → Admin approves ──
  getPaymentRequests: (): MemberPaymentRequest[] => getStored<MemberPaymentRequest[]>(STORAGE_KEYS.PAYMENT_REQUESTS, DEFAULT_PAYMENT_REQUESTS),
  savePaymentRequests: (list: MemberPaymentRequest[]) => setStored(STORAGE_KEYS.PAYMENT_REQUESTS, list),

  submitPaymentRequest: (req: {
    memberId: string;
    kind: 'DEPOSIT' | 'WITHDRAWAL';
    purpose: PaymentPurpose;
    amount: number;
    method: string;
    reference?: string;
    month?: MonthKey;
    otherLabel?: string;
    destination?: string;
    notes?: string;
  }): { success: boolean; msg: string; request?: MemberPaymentRequest } => {
    const m = SaccoFarmStore.getMembers().find(x => x.id === req.memberId || x.memberId === req.memberId);
    if (!m) return { success: false, msg: 'Member not found' };
    const amount = Number(req.amount) || 0;
    if (amount <= 0) return { success: false, msg: 'Enter a valid amount' };
    const par = SaccoFarmStore.getShareParValue();
    let shareCount: number | undefined;
    if (req.kind === 'DEPOSIT' && req.purpose === 'shares') {
      shareCount = Math.floor(amount / par);
      if (shareCount < 1) return { success: false, msg: `Minimum share purchase is UGX ${par.toLocaleString()} (1 share)` };
    }
    if (req.kind === 'WITHDRAWAL' && amount > m.withdrawable) {
      return { success: false, msg: `Amount exceeds your withdrawable balance of UGX ${m.withdrawable.toLocaleString()}` };
    }
    const list = SaccoFarmStore.getPaymentRequests();
    const newReq: MemberPaymentRequest = {
      id: `PRQ-${Date.now().toString().slice(-6)}`,
      memberId: m.memberId,
      memberName: m.name,
      kind: req.kind,
      purpose: req.kind === 'WITHDRAWAL' ? 'savings' : req.purpose,
      purposeLabel: req.kind === 'WITHDRAWAL' ? 'Savings Withdrawal' : purposeLabelOf(req.purpose, req.month, req.otherLabel),
      month: req.kind === 'DEPOSIT' && req.purpose === 'savings' ? (req.month || MONTH_KEYS[new Date().getMonth()]) : undefined,
      shareCount,
      amount,
      method: req.method,
      reference: req.reference || `${req.kind === 'DEPOSIT' ? 'DEP' : 'WTH'}-${Date.now().toString().slice(-6)}`,
      destination: req.destination,
      notes: req.notes,
      submittedAt: nowStamp(),
      status: 'PENDING_VERIFICATION',
    };
    list.unshift(newReq);
    SaccoFarmStore.savePaymentRequests(list);
    return { success: true, msg: `${req.kind === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} request ${newReq.id} submitted. It will reflect on your account once the Accountant verifies it and the Admin approves it.`, request: newReq };
  },

  verifyPaymentRequest: (id: string, verifierName: string): { success: boolean; msg: string } => {
    const list = SaccoFarmStore.getPaymentRequests();
    const r = list.find(x => x.id === id);
    if (!r) return { success: false, msg: 'Request not found' };
    if (r.status !== 'PENDING_VERIFICATION') return { success: false, msg: `Request is already ${r.status.replace(/_/g, ' ').toLowerCase()}` };
    r.status = 'VERIFIED_AWAITING_ADMIN';
    r.verifiedBy = verifierName;
    r.verifiedAt = nowStamp();
    SaccoFarmStore.savePaymentRequests(list);
    return { success: true, msg: `${r.id} verified and forwarded to Admin for final approval.` };
  },

  approvePaymentRequest: (id: string, approverName: string): { success: boolean; msg: string } => {
    const list = SaccoFarmStore.getPaymentRequests();
    const r = list.find(x => x.id === id);
    if (!r) return { success: false, msg: 'Request not found' };
    if (r.status !== 'VERIFIED_AWAITING_ADMIN') return { success: false, msg: 'The Accountant must verify this request before Admin approval.' };
    const res = r.kind === 'DEPOSIT'
      ? SaccoFarmStore.applyMemberDeposit({
          memberId: r.memberId, purpose: r.purpose, amount: r.amount, month: r.month,
          shareCount: r.shareCount, method: r.method, reference: r.reference,
          otherLabel: r.purpose === 'other' ? r.purposeLabel : undefined, notes: r.notes,
        })
      : SaccoFarmStore.applyMemberWithdrawal({ memberId: r.memberId, amount: r.amount, method: r.method, reference: r.reference, notes: r.notes });
    if (!res.success) return res;
    // re-read: applying the request saved members/transactions, the request list is unaffected
    r.status = 'APPROVED';
    r.approvedBy = approverName;
    r.approvedAt = nowStamp();
    r.postedTransactionId = res.tx?.id;
    SaccoFarmStore.savePaymentRequests(list);
    const detail = r.kind === 'DEPOSIT' && r.purpose === 'shares' ? ` ${r.shareCount} share(s) credited to ${r.memberName}.` : '';
    SaccoFarmStore.queueSms('payment_approved', r.memberId, r.kind === 'DEPOSIT'
      ? `Diaspora Connect: your ${r.purposeLabel} deposit of UGX ${r.amount.toLocaleString()} (ref ${r.reference}) is approved and on your account.${r.shareCount ? ` ${r.shareCount} share(s) added.` : ''}`
      : `Diaspora Connect: your withdrawal of UGX ${r.amount.toLocaleString()} is approved and being paid to ${r.destination || r.method}.`);
    return { success: true, msg: `${r.id} approved and posted to the ledger.${detail}` };
  },

  rejectPaymentRequest: (id: string, reason: string, by: string): boolean => {
    const list = SaccoFarmStore.getPaymentRequests();
    const r = list.find(x => x.id === id);
    if (!r || r.status === 'APPROVED') return false;
    r.status = 'REJECTED';
    r.rejectionReason = `${reason || 'Rejected'} — ${by}`;
    SaccoFarmStore.savePaymentRequests(list);
    SaccoFarmStore.queueSms('payment_rejected', r.memberId, `Diaspora Connect: your ${r.kind.toLowerCase()} request ${r.id} of UGX ${r.amount.toLocaleString()} was not approved. Reason: ${reason || 'see portal'}.`);
    return true;
  },

  // ── KYC ───────────────────────────────────────────────────────────────────
  getKycSubmissions: (): KycSubmission[] => getStored<KycSubmission[]>(STORAGE_KEYS.KYC, []),
  saveKycSubmissions: (list: KycSubmission[]) => setStored(STORAGE_KEYS.KYC, list),

  getLatestKyc: (memberId: string): KycSubmission | null => {
    const list = SaccoFarmStore.getKycSubmissions().filter(k => k.memberId === memberId);
    return list.length ? list[0] : null;
  },

  getKycStatus: (memberId: string): KycStatus => SaccoFarmStore.getLatestKyc(memberId)?.status || 'NOT_SUBMITTED',

  submitKyc: (data: Omit<KycSubmission, 'id' | 'submittedAt' | 'status' | 'reviewedBy' | 'reviewedAt' | 'rejectionReason'>): { success: boolean; msg: string } => {
    const current = SaccoFarmStore.getKycStatus(data.memberId);
    if (current === 'PENDING') return { success: false, msg: 'Your KYC is already under review.' };
    if (current === 'VERIFIED') return { success: false, msg: 'Your identity is already verified.' };
    const list = SaccoFarmStore.getKycSubmissions();
    list.unshift({ ...data, id: `KYC-${Date.now().toString().slice(-6)}`, submittedAt: nowStamp(), status: 'PENDING' });
    try {
      // written directly (not via setStored) so a storage-quota failure is reported to the member
      localStorage.setItem(STORAGE_KEYS.KYC, JSON.stringify(list));
      window.dispatchEvent(new Event('dc_storage_update'));
    } catch {
      return { success: false, msg: 'Could not save documents — the images are too large. Try smaller photos.' };
    }
    return { success: true, msg: 'KYC documents submitted. You will be notified once an officer reviews them.' };
  },

  reviewKyc: (id: string, decision: 'VERIFIED' | 'REJECTED', reviewer: string, reason?: string): boolean => {
    const list = SaccoFarmStore.getKycSubmissions();
    const k = list.find(x => x.id === id);
    if (!k || k.status !== 'PENDING') return false;
    k.status = decision;
    k.reviewedBy = reviewer;
    k.reviewedAt = nowStamp();
    if (decision === 'REJECTED') k.rejectionReason = reason || 'Documents could not be verified';
    SaccoFarmStore.saveKycSubmissions(list);
    // A verified identity updates the member record everyone reads
    if (decision === 'VERIFIED') SaccoFarmStore.updateMember(k.memberId, { nin: k.idNumber });
    SaccoFarmStore.queueSms(decision === 'VERIFIED' ? 'kyc_verified' : 'kyc_rejected', k.memberId, decision === 'VERIFIED'
      ? 'Diaspora Connect: your identity (KYC) has been verified. Thank you.'
      : `Diaspora Connect: your KYC could not be verified — ${k.rejectionReason}. Please resubmit in the Member Portal.`);
    return true;
  },

  // ── Acting user & audit trail ─────────────────────────────────────────────
  setActor: (actor: Actor) => { currentActor = { ...actor }; },
  getActor: (): Actor => ({ ...currentActor }),

  getAuditTrail: (): AuditEntry[] => getStored<AuditEntry[]>(STORAGE_KEYS.AUDIT, []),

  /** Append-only. Written straight to storage (no re-render storm); cloud sync ships each entry to the server log. */
  audit: (action: string, entity: string, entityId: string | undefined, summary: string, details?: unknown) => {
    const entry: AuditEntry = {
      id: `AUD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      at: new Date().toISOString(),
      actor: currentActor.name,
      role: currentActor.role,
      email: currentActor.email,
      action,
      entity,
      entityId,
      summary,
      details: details === undefined ? undefined : safeDetails(details),
    };
    try {
      const list = SaccoFarmStore.getAuditTrail();
      list.unshift(entry);
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(list.slice(0, 5000)));
      window.dispatchEvent(new CustomEvent('dc_audit', { detail: entry }));
    } catch {}
    return entry;
  },

  // ── Staff directory & task assignment ─────────────────────────────────────
  getStaff: (): StaffUser[] => getStored<StaffUser[]>(STORAGE_KEYS.STAFF, DEFAULT_STAFF),
  saveStaffUser: (u: Omit<StaffUser, 'id'> & { id?: string }): StaffUser => {
    const list = SaccoFarmStore.getStaff();
    const email = u.email.toLowerCase().trim();
    const existing = list.find(s => s.id === u.id || s.email.toLowerCase() === email);
    const saved: StaffUser = existing ? Object.assign(existing, { ...u, email, id: existing.id }) : { ...u, email, id: `STF-${Date.now().toString().slice(-5)}` };
    if (!existing) list.push(saved);
    setStored(STORAGE_KEYS.STAFF, list);
    return saved;
  },

  getTaskAssignments: (): TaskAssignment[] => {
    const saved = getStored<TaskAssignment[]>(STORAGE_KEYS.TASKS, []);
    const staff = SaccoFarmStore.getStaff();
    return TASK_CATALOG.map(t => saved.find(a => a.taskId === t.id) || {
      taskId: t.id,
      assigneeEmails: staff.filter(s => s.active && t.defaultRoles.includes(s.role)).map(s => s.email),
    });
  },

  saveTaskAssignment: (taskId: string, assigneeEmails: string[], notes?: string, dueRule?: string) => {
    const list = getStored<TaskAssignment[]>(STORAGE_KEYS.TASKS, []).filter(a => a.taskId !== taskId);
    list.push({ taskId, assigneeEmails, notes, dueRule, updatedBy: currentActor.name, updatedAt: new Date().toISOString() });
    setStored(STORAGE_KEYS.TASKS, list);
  },

  /** Admin can do everything; anyone else must be assigned the task by email (or, for legacy sessions without email, by role). */
  canPerform: (taskId: string, actor: Actor = currentActor): boolean => {
    if (actor.role === 'ADMIN') return true;
    const a = SaccoFarmStore.getTaskAssignments().find(x => x.taskId === taskId);
    if (!a) return false;
    const staff = SaccoFarmStore.getStaff();
    if (actor.email && a.assigneeEmails.map(e => e.toLowerCase()).includes(actor.email.toLowerCase())) return true;
    return !actor.email && a.assigneeEmails.some(e => staff.find(s => s.email === e)?.role === actor.role);
  },

  assigneeNames: (taskId: string): string => {
    const a = SaccoFarmStore.getTaskAssignments().find(x => x.taskId === taskId);
    const staff = SaccoFarmStore.getStaff();
    const names = (a?.assigneeEmails || []).map(e => staff.find(s => s.email === e)?.name || e);
    return names.length ? names.join(', ') : 'Unassigned';
  },

  getMyTasks: (actor: Actor = currentActor): Array<TaskDefinition & { assignment: TaskAssignment }> => {
    const all = SaccoFarmStore.getTaskAssignments();
    return TASK_CATALOG
      .map(t => ({ ...t, assignment: all.find(a => a.taskId === t.id)! }))
      .filter(t => actor.role !== 'ADMIN' && SaccoFarmStore.canPerform(t.id, actor));
  },

  // ── Manual income (members who don't use the portal) ──────────────────────
  recordManualIncome: (args: {
    type: 'savings' | 'shares' | 'welfare' | 'project' | 'loan_repayment' | 'milk' | 'other';
    memberId?: string;
    amount: number;
    date: string;
    method: string;
    reference?: string;
    month?: MonthKey;
    category?: string;
    notes?: string;
  }): { success: boolean; msg: string } => {
    const amount = Number(args.amount) || 0;
    if (amount <= 0) return { success: false, msg: 'Enter a valid amount' };
    const isBank = /bank/i.test(args.method);
    const note = `Recorded by ${currentActor.name}${args.notes ? ` — ${args.notes}` : ''}`;

    if (args.type === 'loan_repayment') {
      const loan = SaccoFarmStore.getLoans().find(l => l.memberId === args.memberId && (l.status === 'ACTIVE' || l.status === 'DEFAULTED'));
      if (!loan) return { success: false, msg: 'This member has no active loan' };
      SaccoFarmStore.recordLoanRepayment(loan.id, amount, args.method, args.reference || '', note, args.date);
      return { success: true, msg: `Repayment of UGX ${amount.toLocaleString()} posted to ${loan.loanNumber}.` };
    }
    if (args.type === 'milk' || args.type === 'other') {
      const category = args.type === 'milk' ? 'Milk Sales (Farm)' : (args.category || '').trim();
      if (!category) return { success: false, msg: 'Type the income category' };
      SaccoFarmStore.addTransaction({
        date: args.date, type: 'Income', source: isBank ? 'Bank' : 'Petty Cash', category, amount,
        description: `${category} received via ${args.method}. ${note}`,
        reference: args.reference || `INC-${Date.now().toString().slice(-6)}`, isBanked: isBank, recordedBy: currentActor.name,
      });
      return { success: true, msg: `Income "${category}" of UGX ${amount.toLocaleString()} recorded.` };
    }
    if (!args.memberId) return { success: false, msg: 'Select the member who paid' };
    const res = SaccoFarmStore.applyMemberDeposit({
      memberId: args.memberId, purpose: args.type, amount, month: args.month, method: args.method,
      reference: args.reference, otherLabel: args.category, notes: note, date: args.date,
    });
    if (res.success) {
      SaccoFarmStore.queueSms('manual_income', args.memberId,
        `Diaspora Connect: we received UGX ${amount.toLocaleString()} for ${purposeLabelOf(args.type, args.month, args.category)} on ${args.date}. Thank you.`);
    }
    return res;
  },

  // ── Month-end close ───────────────────────────────────────────────────────
  getPeriodCloses: (): PeriodClose[] => getStored<PeriodClose[]>(STORAGE_KEYS.PERIODS, []),
  isPeriodClosed: (date: string): boolean =>
    SaccoFarmStore.getPeriodCloses().some(p => p.status === 'CLOSED' && date.startsWith(p.month)),

  summarizePeriod: (prefix: string) => {
    const txs = SaccoFarmStore.getTransactions().filter(t => t.date.startsWith(prefix));
    const income = txs.filter(t => t.type === 'Income');
    const revenue = income.filter(t => REVENUE_SOURCES.includes(classifyIncome(t))).reduce((s, t) => s + t.amount, 0);
    const expenses = txs.filter(t => t.type === 'Expense' && isOperatingExpense(t)).reduce((s, t) => s + t.amount, 0);
    return {
      income: income.reduce((s, t) => s + t.amount, 0),
      revenue,
      expenses,
      surplus: revenue - expenses,
      trialBalanced: buildTrialBalance(txs).balanced,
      count: txs.length,
    };
  },

  closePeriod: (month: string): { success: boolean; msg: string } => {
    const current = new Date().toISOString().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) return { success: false, msg: 'Invalid month' };
    if (month >= current) return { success: false, msg: 'Only months that have ended can be closed.' };
    const list = SaccoFarmStore.getPeriodCloses();
    if (list.some(p => p.month === month && p.status === 'CLOSED')) return { success: false, msg: `${month} is already closed.` };
    const s = SaccoFarmStore.summarizePeriod(month);
    if (!s.trialBalanced) return { success: false, msg: `${month} does not balance (Dr ≠ Cr). Fix the entries before closing.` };
    const pending = SaccoFarmStore.getPaymentRequests().filter(r => r.status !== 'APPROVED' && r.status !== 'REJECTED' && r.submittedAt.includes(month.split('-').reverse().join('/')));
    const rec: PeriodClose = {
      month, closedAt: new Date().toISOString(), closedBy: currentActor.name,
      income: s.income, revenue: s.revenue, expenses: s.expenses, surplus: s.surplus, trialBalanced: s.trialBalanced, status: 'CLOSED',
    };
    setStored(STORAGE_KEYS.PERIODS, [rec, ...list.filter(p => p.month !== month)]);
    return { success: true, msg: `${month} closed. Surplus UGX ${s.surplus.toLocaleString()}.${pending.length ? ` Note: ${pending.length} request(s) from that month are still pending.` : ''}` };
  },

  reopenPeriod: (month: string, reason: string): boolean => {
    const list = SaccoFarmStore.getPeriodCloses();
    const p = list.find(x => x.month === month && x.status === 'CLOSED');
    if (!p || currentActor.role !== 'ADMIN') return false;
    p.status = 'REOPENED';
    p.reopenReason = `${reason} — ${currentActor.name}, ${new Date().toLocaleString()}`;
    setStored(STORAGE_KEYS.PERIODS, list);
    return true;
  },

  // ── Dividends ─────────────────────────────────────────────────────────────
  getDividends: (): DividendDeclaration[] => getStored<DividendDeclaration[]>(STORAGE_KEYS.DIVIDENDS, []),

  computeDividend: (p: DividendParams): Omit<DividendDeclaration, 'id' | 'declaredAt' | 'declaredBy' | 'status'> => {
    const s = SaccoFarmStore.summarizePeriod(String(p.year));
    const surplus = Math.max(0, s.surplus);
    const reserve = Math.round(surplus * p.reservePct / 100);
    const education = Math.round(surplus * p.educationPct / 100);
    const pool = Math.round(Math.max(0, surplus - reserve - education) * p.payoutPct / 100);
    const members = SaccoFarmStore.getMembers().filter(m => m.status === 'ACTIVE' && m.shares > 0);
    // share-months: shares weighted by the months of the year the member has been in the SACCO
    const weightOf = (m: SaccoMember) => {
      if (p.method === 'shares') return m.shares;
      const join = new Date(m.joinDate);
      const months = join.getFullYear() < p.year ? 12 : join.getFullYear() > p.year ? 0 : 12 - join.getMonth();
      return m.shares * months / 12;
    };
    const totalWeight = members.reduce((t, m) => t + weightOf(m), 0);
    const rows: DividendRow[] = members.map(m => {
      const weight = weightOf(m);
      return { memberId: m.memberId, memberName: m.name, shares: m.shares, weight, amount: totalWeight ? Math.floor(pool * weight / totalWeight) : 0 };
    });
    const totalShares = members.reduce((t, m) => t + m.shares, 0);
    return { ...p, revenue: s.revenue, expenses: s.expenses, surplus: s.surplus, reserve, education, pool, ratePerShare: totalShares ? Math.floor(pool / totalShares) : 0, rows };
  },

  declareDividend: (p: DividendParams): { success: boolean; msg: string } => {
    if (SaccoFarmStore.getDividends().some(d => d.year === p.year)) return { success: false, msg: `A dividend for ${p.year} has already been declared.` };
    const c = SaccoFarmStore.computeDividend(p);
    if (c.pool <= 0) return { success: false, msg: `No distributable surplus for ${p.year}.` };
    const decl: DividendDeclaration = { ...c, id: `DIV-${p.year}`, declaredAt: new Date().toISOString(), declaredBy: currentActor.name, status: 'DECLARED' };
    setStored(STORAGE_KEYS.DIVIDENDS, [decl, ...SaccoFarmStore.getDividends()]);
    const date = todayISO();
    if (c.reserve + c.education > 0) {
      SaccoFarmStore.addTransaction({ date, type: 'Journal', source: 'Bank', debitAccount: '3100 — Retained Surplus', creditAccount: '3200 — Statutory Reserve & Education Fund', category: `Appropriation ${p.year}: reserves`, amount: c.reserve + c.education, description: `Statutory reserve ${p.reservePct}% + education fund ${p.educationPct}% of ${p.year} surplus`, reference: `${decl.id}-RES`, isBanked: true });
    }
    SaccoFarmStore.addTransaction({ date, type: 'Journal', source: 'Bank', debitAccount: '3100 — Retained Surplus', creditAccount: '2200 — Dividends Payable', category: `Dividend declared ${p.year}`, amount: c.pool, description: `Dividend of UGX ${c.ratePerShare.toLocaleString()} per share declared for ${p.year}`, reference: decl.id, isBanked: true });
    return { success: true, msg: `Dividend for ${p.year} declared: pool UGX ${c.pool.toLocaleString()} (UGX ${c.ratePerShare.toLocaleString()} per share).` };
  },

  /** Credits every member's savings with their dividend (Dr Dividends Payable / Cr Member Savings). */
  payDividend: (id: string): { success: boolean; msg: string } => {
    const list = SaccoFarmStore.getDividends();
    const d = list.find(x => x.id === id);
    if (!d || d.status !== 'DECLARED') return { success: false, msg: 'Dividend not found or already paid' };
    const month = MONTH_KEYS[new Date().getMonth()];
    d.rows.forEach(r => {
      if (r.amount <= 0) return;
      const m = SaccoFarmStore.getMembers().find(x => x.memberId === r.memberId);
      if (!m) return;
      SaccoFarmStore.updateMember(m.id, { [month]: (Number(m[month]) || 0) + r.amount } as Partial<SaccoMember>);
      SaccoFarmStore.queueSms('dividend_paid', r.memberId, `Diaspora Connect: your ${d.year} dividend of UGX ${r.amount.toLocaleString()} has been credited to your savings.`);
    });
    SaccoFarmStore.addTransaction({ date: todayISO(), type: 'Journal', source: 'Bank', debitAccount: '2200 — Dividends Payable', creditAccount: '3010 — Member Savings', category: `Dividend paid ${d.year}`, amount: d.rows.reduce((s, r) => s + r.amount, 0), description: `${d.year} dividend credited to ${d.rows.filter(r => r.amount > 0).length} members' savings`, reference: `${d.id}-PAY`, isBanked: true });
    d.status = 'PAID';
    d.paidAt = new Date().toISOString();
    d.paidBy = currentActor.name;
    setStored(STORAGE_KEYS.DIVIDENDS, list);
    return { success: true, msg: `${d.year} dividend credited to members' savings.` };
  },

  // ── SMS alerts (queued here; the cloud sync sends them through the SMS gateway) ──
  getSmsSettings: (): SmsSettings => ({ ...DEFAULT_SMS_SETTINGS, ...getStored<SmsSettings>(STORAGE_KEYS.SMS_SETTINGS, DEFAULT_SMS_SETTINGS) }),
  saveSmsSettings: (s: SmsSettings) => setStored(STORAGE_KEYS.SMS_SETTINGS, s),
  getSmsLog: (): SmsMessage[] => getStored<SmsMessage[]>(STORAGE_KEYS.SMS_LOG, []),

  queueSms: (event: SmsEvent, memberIdOrPhone: string, message: string): SmsMessage | null => {
    const settings = SaccoFarmStore.getSmsSettings();
    if (!settings.enabled || !settings.events[event]) return null;
    const member = SaccoFarmStore.getMembers().find(m => m.memberId === memberIdOrPhone || m.id === memberIdOrPhone);
    const to = normalizeUgPhone(member ? member.phone : memberIdOrPhone);
    if (!to) return null;
    const sms: SmsMessage = { id: `SMS-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, event, to, memberId: member?.memberId, message: message.slice(0, 459), createdAt: new Date().toISOString(), status: 'QUEUED' };
    const log = SaccoFarmStore.getSmsLog();
    log.unshift(sms);
    setStored(STORAGE_KEYS.SMS_LOG, log.slice(0, 2000));
    window.dispatchEvent(new CustomEvent('dc_sms_queued', { detail: sms }));
    return sms;
  },

  updateSms: (id: string, patch: Partial<SmsMessage>) => {
    const log = SaccoFarmStore.getSmsLog();
    const s = log.find(x => x.id === id);
    if (!s) return;
    Object.assign(s, patch);
    setStored(STORAGE_KEYS.SMS_LOG, log);
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
    // A closed month is frozen: late entries are posted as adjustments in the current (open) month
    let entry = { ...tx, recordedBy: tx.recordedBy || currentActor.name };
    if (tx.date && SaccoFarmStore.isPeriodClosed(tx.date)) {
      entry = { ...entry, date: todayISO(), description: `[Adjustment for closed period ${tx.date.slice(0, 7)}, originally dated ${tx.date}] ${tx.description}` };
    }
    const newTx: PettyCashTransaction = {
      ...entry,
      id: `TX-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase()
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
    SaccoFarmStore.syncCowMilkIntoDailyLog(newRecord, 1);
    return newRecord;
  },

  deleteCowMilkRecord: (id: string): boolean => {
    const list = SaccoFarmStore.getCowMilkRecords();
    const target = list.find(r => r.id === id);
    const filtered = list.filter(r => r.id !== id);
    if (!target) return false;
    SaccoFarmStore.saveCowMilkRecords(filtered);
    SaccoFarmStore.syncCowMilkIntoDailyLog(target, -1);
    return true;
  },

  /**
   * Keeps the herd-level daily milk log and the milk-sales income in the ledger in step with
   * per-cow milking records (sign = +1 when a record is added, -1 when it is deleted).
   */
  syncCowMilkIntoDailyLog: (rec: CowMilkRecord, sign: 1 | -1) => {
    const litres = (Number(rec.litres) || 0) * sign;
    if (!litres) return;
    const field = rec.session === 'Morning' ? 'morning' : rec.session === 'Afternoon' ? 'afternoon' : 'evening';
    const logs = SaccoFarmStore.getMilkLogs();
    let log = logs.find(l => l.date === rec.date);
    if (!log) {
      if (sign < 0) return;
      log = {
        id: `ML-${Date.now().toString().slice(-5)}`,
        date: rec.date, morning: 0, afternoon: 0, evening: 0, calvesConsumption: 0,
        netSold: 0, offtakerPrice: rec.offtakerPrice || 1650, revenue: 0,
        recorder: rec.recorder, notes: 'Built from per-cow milking records',
      };
      logs.unshift(log);
    }
    const before = log.revenue;
    log[field] = Math.max(0, Math.round(((Number(log[field]) || 0) + litres) * 10) / 10);
    log.netSold = Math.max(0, Math.round((log.morning + log.afternoon + log.evening - (log.calvesConsumption || 0)) * 10) / 10);
    log.revenue = Math.round(log.netSold * (log.offtakerPrice || 1650));
    logs.sort((a, b) => b.date.localeCompare(a.date));
    SaccoFarmStore.saveMilkLogs(logs);

    // Post only the change in revenue so seed / manually-entered daily totals are never double counted
    const delta = log.revenue - before;
    if (!delta) return;
    const ref = `MLK-COW-${rec.date.replace(/-/g, '')}`;
    const txs = SaccoFarmStore.getTransactions();
    const tx = txs.find(t => t.reference === ref);
    if (tx) {
      tx.amount = Math.max(0, tx.amount + delta);
      tx.description = `Milk sales from per-cow milking records on ${rec.date} @ UGX ${(log.offtakerPrice || 1650).toLocaleString()}/L`;
      SaccoFarmStore.saveTransactions(tx.amount > 0 ? txs : txs.filter(t => t !== tx));
    } else if (delta > 0) {
      SaccoFarmStore.addTransaction({
        date: rec.date,
        type: 'Income',
        source: 'Bank',
        category: 'Milk Sales (Farm)',
        amount: delta,
        description: `Milk sales from per-cow milking records on ${rec.date} @ UGX ${(log.offtakerPrice || 1650).toLocaleString()}/L`,
        reference: ref,
        isBanked: true,
        bankedDate: rec.date,
      });
    }
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

  /**
   * Interest split for a flat-rate SACCO loan:
   *   total interest = principal × rate × (months / 12), accrued evenly per month from disbursement.
   * Each payment clears interest accrued-but-unpaid first, then principal (standard SACCO allocation).
   */
  getLoanBreakdown: (loan: SaccoLoan, asOf: string = new Date().toISOString().split('T')[0]) => {
    const totalInterest = Math.max(0, loan.totalPayable - loan.principal);
    const history = loan.repaymentHistory || [];
    const interestPaid = loan.interestPaid ?? history.reduce((s, h) => s + (h.interestPortion || 0), 0);
    const principalPaid = loan.principalPaid ?? Math.max(0, loan.amountPaid - interestPaid);
    const start = new Date(loan.disbursementDate || loan.applicationDate);
    const now = new Date(asOf);
    const monthsElapsed = Math.max(1, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1);
    const monthlyInterest = loan.durationMonths > 0 ? totalInterest / loan.durationMonths : totalInterest;
    const accruedInterest = Math.min(totalInterest, Math.round(monthlyInterest * monthsElapsed));
    return {
      totalInterest,
      interestPaid,
      principalPaid,
      principalOutstanding: Math.max(0, loan.principal - principalPaid),
      interestOutstanding: Math.max(0, totalInterest - interestPaid),
      accruedInterest,
      interestDueNow: Math.max(0, accruedInterest - interestPaid),
    };
  },

  recordLoanRepayment: (id: string, amount: number, paymentMethod = 'Bank Wire / Mobile Money', reference = '', notes = '', date?: string): SaccoLoan | null => {
    const list = SaccoFarmStore.getLoans();
    const item = list.find(l => l.id === id || l.loanNumber === id);
    if (!item) return null;
    const paid = Math.min(Number(amount) || 0, item.outstandingBalance || Number(amount) || 0);
    if (paid <= 0) return null;
    const payDate = date || new Date().toISOString().split('T')[0];
    const b = SaccoFarmStore.getLoanBreakdown(item, payDate);

    // interest due first, then principal; anything left over (early payoff) clears the remaining interest
    let interestPortion = Math.min(paid, b.interestDueNow);
    let principalPortion = Math.min(paid - interestPortion, b.principalOutstanding);
    const leftover = paid - interestPortion - principalPortion;
    if (leftover > 0) interestPortion += Math.min(leftover, b.interestOutstanding - interestPortion);

    item.interestPaid = b.interestPaid + interestPortion;
    item.principalPaid = b.principalPaid + principalPortion;
    item.amountPaid += paid;
    item.outstandingBalance = Math.max(0, item.totalPayable - item.amountPaid);
    if (item.outstandingBalance === 0) item.status = 'CLEARED';

    const ref = reference || `LN-PAY-${Date.now().toString().slice(-6)}`;
    const historyEntry: LoanRepaymentEntry = {
      id: `RPM-${Date.now().toString().slice(-6)}`,
      date: payDate,
      amount: paid,
      principalPortion,
      interestPortion,
      remainingBalance: item.outstandingBalance,
      reference: ref,
      paymentMethod,
      notes: notes || 'Monthly Loan Installment'
    };
    if (!item.repaymentHistory) item.repaymentHistory = [];
    item.repaymentHistory.unshift(historyEntry);
    SaccoFarmStore.saveLoans(list);

    // Two postings so the ledger shows principal recovered vs interest earned:
    //   Dr Cash / Cr 1200 Loans Receivable  (principal)
    //   Dr Cash / Cr 4020 Loan Interest Income  (interest)
    const isBank = /bank/i.test(paymentMethod);
    if (principalPortion > 0) {
      SaccoFarmStore.addTransaction({
        date: payDate,
        type: 'Income',
        source: isBank ? 'Bank' : 'Petty Cash',
        memberId: item.memberId,
        category: `Loan Repayment (Principal): ${item.memberName} (${item.loanNumber})`,
        amount: principalPortion,
        description: `Principal repaid on ${item.loanNumber} via ${paymentMethod}. Ref: ${ref}`,
        reference: ref,
        isBanked: isBank
      });
    }
    if (interestPortion > 0) {
      SaccoFarmStore.addTransaction({
        date: payDate,
        type: 'Income',
        source: isBank ? 'Bank' : 'Petty Cash',
        memberId: item.memberId,
        category: `Loan Interest Income: ${item.memberName} (${item.loanNumber})`,
        amount: interestPortion,
        description: `Interest earned on ${item.loanNumber} via ${paymentMethod}. Ref: ${ref}`,
        reference: `${ref}-INT`,
        isBanked: isBank
      });
    }
    SaccoFarmStore.queueSms('loan_repayment', item.memberId,
      `Diaspora Connect: loan ${item.loanNumber} payment of UGX ${paid.toLocaleString()} received (principal ${principalPortion.toLocaleString()}, interest ${interestPortion.toLocaleString()}). Balance UGX ${item.outstandingBalance.toLocaleString()}.`);

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
    const val = localStorage.getItem(STORAGE_KEYS.SHARE_PAR);
    return val ? Number(val) : 250000;
  },

  setShareParValue: (newVal: number): void => {
    setStored(STORAGE_KEYS.SHARE_PAR, newVal);
    const members = SaccoFarmStore.getMembers();
    members.forEach(m => {
      m.sharesValue = (Number(m.shares) || 0) * newVal;
    });
    SaccoFarmStore.saveMembers(members);
    window.dispatchEvent(new Event('dc_storage_update'));
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
    const totalSharesValue = totalShares * SaccoFarmStore.getShareParValue();
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


// ── Audit every state-changing operation ─────────────────────────────────────
// Wraps the store's mutating methods. Only the outermost call is logged, so an approval that
// internally updates a member and posts a transaction appears once, as the approval.
type Describer = (args: any[], result: any) => string;
const ugxT = (n: any) => `UGX ${Number(n || 0).toLocaleString()}`;
const AUDITED: Record<string, { entity: string; id?: (a: any[], r: any) => string | undefined; describe: Describer }> = {
  addMember: { entity: 'Member', id: (_a, r) => r?.memberId, describe: (a) => `Registered member ${a[0]?.name}` },
  updateMember: { entity: 'Member', id: (a) => a[0], describe: (a) => `Updated member ${a[0]}: ${Object.keys(a[1] || {}).join(', ')}` },
  deleteMember: { entity: 'Member', id: (a) => a[0], describe: (a) => `Deleted member ${a[0]}` },
  updateMonthlyContribution: { entity: 'Member', id: (a) => a[0], describe: (a) => `Set ${String(a[1]).toUpperCase()} contribution of ${a[0]} to ${ugxT(a[2])}` },
  addShareConversionRequest: { entity: 'ShareConversion', id: (_a, r) => r?.request?.id, describe: (a) => `${a[0]?.memberName} requested conversion of savings into ${a[0]?.shareCount} share(s)` },
  approveShareConversionRequest: { entity: 'ShareConversion', id: (a) => a[0], describe: (a, r) => `${a[1]} approval of share conversion ${a[0]}${r?.fullyApproved ? ' — shares credited' : ''}` },
  rejectShareConversionRequest: { entity: 'ShareConversion', id: (a) => a[0], describe: (a) => `Rejected share conversion ${a[0]}: ${a[1] || ''}` },
  applyMemberDeposit: { entity: 'Member', id: (a) => a[0]?.memberId, describe: (a) => `Posted ${a[0]?.purpose} deposit of ${ugxT(a[0]?.amount)} for ${a[0]?.memberId}` },
  applyMemberWithdrawal: { entity: 'Member', id: (a) => a[0]?.memberId, describe: (a) => `Paid withdrawal of ${ugxT(a[0]?.amount)} to ${a[0]?.memberId}` },
  submitPaymentRequest: { entity: 'PaymentRequest', id: (_a, r) => r?.request?.id, describe: (a) => `${a[0]?.memberId} submitted ${String(a[0]?.kind).toLowerCase()} (${a[0]?.purpose}) of ${ugxT(a[0]?.amount)}` },
  verifyPaymentRequest: { entity: 'PaymentRequest', id: (a) => a[0], describe: (a) => `Verified payment request ${a[0]}` },
  approvePaymentRequest: { entity: 'PaymentRequest', id: (a) => a[0], describe: (a) => `Approved payment request ${a[0]} and posted it` },
  rejectPaymentRequest: { entity: 'PaymentRequest', id: (a) => a[0], describe: (a) => `Rejected payment request ${a[0]}: ${a[1] || ''}` },
  activateApplication: { entity: 'Member', id: (a) => a[0]?.id, describe: (a) => `Membership application ${a[0]?.id} for ${a[0]?.fullName} approved — member created` },
  submitKyc: { entity: 'KYC', id: (a) => a[0]?.memberId, describe: (a) => `${a[0]?.memberName} submitted KYC (${a[0]?.idType})` },
  reviewKyc: { entity: 'KYC', id: (a) => a[0], describe: (a) => `KYC ${a[0]} marked ${a[1]}${a[3] ? `: ${a[3]}` : ''}` },
  addInvestor: { entity: 'Investor', id: (_a, r) => r?.id, describe: (a) => `Added Money Maker investor ${a[0]?.name}` },
  recordInvestorPayment: { entity: 'Investor', id: (a) => a[0], describe: (a) => `Investor ${a[0]} paid ${ugxT(a[1])}` },
  addTransaction: { entity: 'Transaction', id: (_a, r) => r?.id, describe: (a) => `${a[0]?.type} ${ugxT(a[0]?.amount)} — ${a[0]?.category}` },
  deleteTransaction: { entity: 'Transaction', id: (a) => a[0], describe: (a) => `Deleted transaction ${a[0]}` },
  toggleBankedStatus: { entity: 'Transaction', id: (a) => a[0], describe: (a) => `Toggled banked status of ${a[0]}` },
  bankAllAirtelTransactions: { entity: 'Transaction', describe: (_a, r) => `Marked ${r} unbanked income item(s) as banked` },
  addCattle: { entity: 'Cow', id: (_a, r) => r?.tagNumber, describe: (a, r) => `Added ${a[0]?.name} (${r?.tagNumber}) to herd` },
  updateCattle: { entity: 'Cow', id: (a) => a[0], describe: (a) => `Updated cow ${a[0]}: ${Object.keys(a[1] || {}).join(', ')}` },
  deleteCattle: { entity: 'Cow', id: (a) => a[0], describe: (a) => `Removed cow ${a[0]} from herd` },
  markCowSick: { entity: 'Cow', id: (a) => a[0], describe: (a) => `Marked cow ${a[0]} sick: ${a[1]?.illness}` },
  markCowHealthy: { entity: 'Cow', id: (a) => a[0], describe: (a) => `Marked cow ${a[0]} healthy` },
  addMilkLog: { entity: 'MilkLog', id: (_a, r) => r?.id, describe: (a) => `Daily milk log for ${a[0]?.date}` },
  deleteMilkLog: { entity: 'MilkLog', id: (a) => a[0], describe: (a) => `Deleted milk log ${a[0]}` },
  addCowMilkRecord: { entity: 'MilkRecord', id: (_a, r) => r?.id, describe: (a) => `${a[0]?.litres} L from ${a[0]?.cowName} (${a[0]?.cowTag}), ${a[0]?.session} ${a[0]?.date}` },
  deleteCowMilkRecord: { entity: 'MilkRecord', id: (a) => a[0], describe: (a) => `Deleted milk record ${a[0]}` },
  addLoan: { entity: 'Loan', id: (_a, r) => r?.loanNumber, describe: (a, r) => `Created loan ${r?.loanNumber} of ${ugxT(a[0]?.principal)} for ${a[0]?.memberName}` },
  approveLoan: { entity: 'Loan', id: (a) => a[0], describe: (a) => `Approved loan ${a[0]}` },
  recordLoanRepayment: { entity: 'Loan', id: (a) => a[0], describe: (a, r) => `Repayment ${ugxT(a[1])} on ${a[0]} (principal ${ugxT(r?.repaymentHistory?.[0]?.principalPortion)}, interest ${ugxT(r?.repaymentHistory?.[0]?.interestPortion)})` },
  addHealthRecord: { entity: 'HealthRecord', id: (_a, r) => r?.id, describe: (a) => `${a[0]?.type} for ${a[0]?.animalName || a[0]?.tagNumber}: ${a[0]?.diagnosis}` },
  deleteHealthRecord: { entity: 'HealthRecord', id: (a) => a[0], describe: (a) => `Deleted health record ${a[0]}` },
  addBreedingRecord: { entity: 'Breeding', id: (_a, r) => r?.id, describe: (a) => `${a[0]?.type} for ${a[0]?.animalName}` },
  deleteBreedingRecord: { entity: 'Breeding', id: (a) => a[0], describe: (a) => `Deleted breeding record ${a[0]}` },
  logFeedConsumption: { entity: 'Feed', id: (a) => a[0], describe: (a) => `Used ${a[1]} of feed ${a[0]}` },
  purchaseFeed: { entity: 'Feed', id: (a) => a[0], describe: (a) => `Bought ${a[1]} of feed ${a[0]} for ${ugxT(a[2])}` },
  addFeedItem: { entity: 'Feed', id: (_a, r) => r?.id, describe: (a) => `Added feed ${a[0]?.feedType}` },
  deleteFeedItem: { entity: 'Feed', id: (a) => a[0], describe: (a) => `Deleted feed ${a[0]}` },
  recordFeedUsage: { entity: 'Feed', id: (a) => a[0], describe: (a) => `Used ${a[1]} of feed ${a[0]}` },
  setShareParValue: { entity: 'Settings', describe: (a) => `Share par value set to ${ugxT(a[0])}` },
  saveStaffUser: { entity: 'Staff', id: (_a, r) => r?.email, describe: (a) => `Saved staff ${a[0]?.name} (${a[0]?.role})` },
  saveTaskAssignment: { entity: 'Task', id: (a) => a[0], describe: (a) => `Assigned task ${a[0]} to ${(a[1] || []).join(', ') || 'nobody'}` },
  recordManualIncome: { entity: 'Transaction', id: (a) => a[0]?.memberId, describe: (a) => `Manual income (${a[0]?.type}) ${ugxT(a[0]?.amount)}${a[0]?.memberId ? ` for ${a[0].memberId}` : ''} dated ${a[0]?.date}` },
  closePeriod: { entity: 'Period', id: (a) => a[0], describe: (a) => `Closed month ${a[0]}` },
  reopenPeriod: { entity: 'Period', id: (a) => a[0], describe: (a) => `Reopened month ${a[0]}: ${a[1]}` },
  declareDividend: { entity: 'Dividend', id: (a) => String(a[0]?.year), describe: (a) => `Declared ${a[0]?.year} dividend (reserve ${a[0]?.reservePct}%, payout ${a[0]?.payoutPct}%)` },
  payDividend: { entity: 'Dividend', id: (a) => a[0], describe: (a) => `Paid dividend ${a[0]} into member savings` },
  saveSmsSettings: { entity: 'Settings', describe: () => 'Updated SMS alert settings' },
  resetAll: { entity: 'System', describe: () => 'Reset all data to demo defaults' },
};

let auditDepth = 0;
const isFailure = (r: any) => r === null || r === false || (r && typeof r === 'object' && r.success === false);
Object.entries(AUDITED).forEach(([name, meta]) => {
  const store = SaccoFarmStore as any;
  const original = store[name];
  if (typeof original !== 'function') return;
  store[name] = (...args: any[]) => {
    auditDepth++;
    let result: any;
    try {
      result = original(...args);
    } finally {
      auditDepth--;
    }
    if (auditDepth === 0 && !isFailure(result)) {
      try {
        SaccoFarmStore.audit(name, meta.entity, meta.id?.(args, result), meta.describe(args, result), args);
      } catch {}
    }
    return result;
  };
});
