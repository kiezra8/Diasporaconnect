// Collection keys — must match STORAGE_KEYS in the portal (src/services/saccoFarmStore.ts)
export const KEYS = {
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
  STAFF: 'dc_staff_directory_v1',
  TASKS: 'dc_task_assignments_v1',
  PERIODS: 'dc_period_closes_v1',
  DIVIDENDS: 'dc_dividends_v1',
  SMS_SETTINGS: 'dc_sms_settings_v1',
  SMS_LOG: 'dc_sms_log_v1',
  SHARE_PAR: 'dc_share_par_value',
  REGISTRATIONS: 'dc_member_registrations',
} as const;

export const ALL_KEYS = new Set<string>(Object.values(KEYS));

/** Only the Administrator may change these. */
export const ADMIN_ONLY_KEYS = new Set<string>([KEYS.TASKS, KEYS.STAFF, KEYS.SHARE_PAR, KEYS.SMS_SETTINGS]);

/** Staff roles that may write SACCO / farm data. Board members are read-only. */
export const WRITER_ROLES = new Set(['ADMIN', 'ACCOUNTANT', 'SECRETARY', 'FARM_WORKER']);

/** Collections a member may add their own items to (merged server-side, never replaced). */
export const MEMBER_WRITABLE = new Set<string>([KEYS.PAYMENT_REQUESTS, KEYS.KYC, KEYS.SHARE_CONVERSIONS, KEYS.MEMBERS]);

/** Status a member-created item must have — members can submit, never approve. */
export const MEMBER_ALLOWED_STATUS: Record<string, string[]> = {
  [KEYS.PAYMENT_REQUESTS]: ['PENDING_VERIFICATION'],
  [KEYS.KYC]: ['PENDING'],
  [KEYS.SHARE_CONVERSIONS]: ['PENDING'],
};

/** Profile fields a member may edit on their own member record. */
export const MEMBER_PROFILE_FIELDS = ['name', 'phone', 'email', 'avatar'];

/** Collections members can read, filtered to their own rows (others are hidden entirely). */
export const MEMBER_READ_OWN = new Set<string>([
  KEYS.MEMBERS, KEYS.LOANS, KEYS.PAYMENT_REQUESTS, KEYS.KYC, KEYS.SHARE_CONVERSIONS, KEYS.INVESTORS, KEYS.SMS_LOG, KEYS.TRANSACTIONS, KEYS.DIVIDENDS,
]);
export const MEMBER_READ_ALL = new Set<string>([KEYS.SHARE_PAR, KEYS.CATTLE, KEYS.MILK, KEYS.SMS_SETTINGS]);
