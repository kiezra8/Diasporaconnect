// Diaspora Connect — one shared database (Supabase Postgres), with a copy kept in this browser.
//
// Every record is saved twice: in this browser (instant, works without internet) and in Supabase.
// Changes made by anyone else arrive through Supabase Realtime and update the open page at once,
// so e.g. a deposit approved by the Admin shows on the member's page immediately.

import { getSession } from './api';
import { supabase, accessToken } from './supabase';
import { API_BASE_URL } from './api';
import { SaccoFarmStore, STORAGE_KEYS, SmsMessage } from './saccoFarmStore';

type Row = Record<string, any>;
interface TableCfg {
  key: string;                 // browser storage key
  table: string;               // Supabase table
  idOf: (r: Row) => string | undefined;
  order: 'asc' | 'desc';       // how the app orders the list (new items appended or put first)
  appendOnly?: boolean;        // never updated or deleted (audit trail)
  limit?: number;              // only the newest N are kept in the browser
  clean?: (r: Row) => Row;
}

const byId = (r: Row) => (r && (r.id ?? r.memberId)) || undefined;
const TABLES: TableCfg[] = [
  { key: STORAGE_KEYS.MEMBERS, table: 'members', idOf: byId, order: 'asc' },
  { key: 'dc_member_registrations', table: 'member_applications', idOf: r => r?.id, order: 'desc', clean: ({ password, ...r }) => r },
  { key: STORAGE_KEYS.KYC, table: 'kyc_submissions', idOf: r => r?.id, order: 'desc' },
  { key: STORAGE_KEYS.PAYMENT_REQUESTS, table: 'payment_requests', idOf: r => r?.id, order: 'desc' },
  { key: STORAGE_KEYS.SHARE_CONVERSIONS, table: 'share_conversions', idOf: r => r?.id, order: 'desc' },
  { key: STORAGE_KEYS.LOANS, table: 'loans', idOf: r => r?.id, order: 'desc' },
  { key: STORAGE_KEYS.TRANSACTIONS, table: 'transactions', idOf: r => r?.id, order: 'desc' },
  { key: STORAGE_KEYS.INVESTORS, table: 'investors', idOf: r => r?.id, order: 'asc' },
  { key: STORAGE_KEYS.DIVIDENDS, table: 'dividends', idOf: r => r?.id, order: 'desc' },
  { key: STORAGE_KEYS.PERIODS, table: 'period_closes', idOf: r => r?.month, order: 'desc' },
  { key: STORAGE_KEYS.SMS_LOG, table: 'sms_messages', idOf: r => r?.id, order: 'desc', limit: 2000 },
  { key: STORAGE_KEYS.AUDIT, table: 'audit_log', idOf: r => r?.id, order: 'desc', appendOnly: true, limit: 5000 },
  { key: STORAGE_KEYS.STAFF, table: 'staff', idOf: r => r?.id, order: 'asc' },
  { key: STORAGE_KEYS.TASKS, table: 'task_assignments', idOf: r => r?.taskId, order: 'asc' },
  { key: STORAGE_KEYS.CATTLE, table: 'cattle', idOf: r => r?.id, order: 'desc' },
  { key: STORAGE_KEYS.MILK, table: 'milk_logs', idOf: r => r?.id, order: 'desc' },
  { key: STORAGE_KEYS.COW_MILK, table: 'cow_milk_records', idOf: r => r?.id, order: 'desc' },
  { key: STORAGE_KEYS.HEALTH, table: 'health_records', idOf: r => r?.id, order: 'desc' },
  { key: STORAGE_KEYS.BREEDING, table: 'breeding_records', idOf: r => r?.id, order: 'desc' },
  { key: STORAGE_KEYS.FEEDS, table: 'feed_inventory', idOf: r => r?.id, order: 'desc' },
];
// single values kept in app_settings
const SETTINGS: Record<string, string> = {
  [STORAGE_KEYS.SHARE_PAR]: 'share_par_value',
  [STORAGE_KEYS.SMS_SETTINGS]: 'sms_settings',
};
const BY_KEY = new Map(TABLES.map(t => [t.key, t]));
const BY_TABLE = new Map(TABLES.map(t => [t.table, t]));
const SETTING_KEY_BY_NAME = new Map(Object.entries(SETTINGS).map(([k, v]) => [v, k]));
const WRITER_ROLES = ['ADMIN', 'ACCOUNTANT', 'SECRETARY', 'FARM_WORKER'];

// ── helpers ─────────────────────────────────────────────────────────────────
const stable = (v: any): string => {
  if (v === null || typeof v !== 'object') return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  return `{${Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;
};
const hashOf = (v: any): string => {
  const s = stable(v);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36) + s.length.toString(36);
};

// Writes coming from this module go straight to storage without being sent back to the server
const rawSetItem = Storage.prototype.setItem;
let applying = false;
const writeLocal = (key: string, value: unknown) => {
  applying = true;
  try { rawSetItem.call(localStorage, key, JSON.stringify(value)); } finally { applying = false; }
};
const readLocal = (key: string): any => {
  try { const raw = localStorage.getItem(key); return raw === null ? undefined : JSON.parse(raw); } catch { return undefined; }
};

// What was last saved to / received from the server, per record (survives page reloads)
const META_KEY = 'dc_db_state_v1';
interface Meta { owner: string; rows: Record<string, Record<string, string>>; settings: Record<string, string> }
let meta: Meta = { owner: '', rows: {}, settings: {} };
const loadMeta = () => { meta = readLocal(META_KEY) || { owner: '', rows: {}, settings: {} }; };
const saveMeta = () => writeLocal(META_KEY, meta);

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
const announce = () => {
  if (refreshTimer) return;
  refreshTimer = setTimeout(() => { refreshTimer = null; window.dispatchEvent(new Event('dc_storage_update')); }, 60);
};

// ── state ───────────────────────────────────────────────────────────────────
let active = false;
let connected = false;
let role = '';
let channel: ReturnType<typeof supabase.channel> | null = null;
const ready = new Set<string>();              // keys loaded from the server for this user
const pushTimers: Record<string, ReturnType<typeof setTimeout>> = {};
const running: Record<string, Promise<void> | undefined> = {};
const again = new Set<string>();
let retryTimer: ReturnType<typeof setInterval> | null = null;

const isDenied = (err: any) => err && (err.code === '42501' || err.code === 'PGRST301' || /row-level security|permission denied/i.test(err.message || ''));

// ── reading from the server ─────────────────────────────────────────────────
async function fetchRows(cfg: TableCfg): Promise<Row[]> {
  const out: Row[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const take = cfg.limit ? Math.min(page, cfg.limit - out.length) : page;
    if (take <= 0) break;
    // newest first for capped lists, otherwise in the app's own order
    const asc = cfg.limit ? false : cfg.order === 'asc';
    const { data, error } = await supabase.from(cfg.table).select('id,data').order('seq', { ascending: asc }).range(from, from + take - 1);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < take) break;
  }
  if (cfg.limit && cfg.order === 'asc') out.reverse();
  return out.map(r => r.data);
}

/** Replace this browser's copy of a list with the server's, keeping local changes not yet saved. */
async function pullTable(cfg: TableCfg, keepLocalChanges: boolean) {
  const remote = await fetchRows(cfg);
  const local: Row[] = Array.isArray(readLocal(cfg.key)) ? readLocal(cfg.key) : [];
  const known = meta.rows[cfg.key] || {};
  const nextMeta: Record<string, string> = {};
  const remoteIds = new Set<string>();
  remote.forEach(r => { const id = cfg.idOf(r); if (id) { remoteIds.add(id); nextMeta[id] = hashOf(r); } });

  let merged: Row[] = remote;
  if (keepLocalChanges) {
    const pending = new Map<string, Row>();
    local.forEach(r => { const id = cfg.idOf(r); if (id && known[id] !== hashOf(r)) pending.set(id, r); });
    merged = remote.map(r => pending.get(cfg.idOf(r)!) ?? r);
    const fresh = [...pending.entries()].filter(([id]) => !remoteIds.has(id) && !(id in known)).map(([, r]) => r);
    merged = cfg.order === 'desc' ? [...fresh, ...merged] : [...merged, ...fresh];
    pending.forEach((_, id) => { if (id in known) nextMeta[id] = known[id]; else delete nextMeta[id]; });
  }
  local.filter(r => !cfg.idOf(r)).forEach(r => merged.push(r)); // records without an id stay local
  meta.rows[cfg.key] = nextMeta;
  if (stable(merged) !== stable(local)) { writeLocal(cfg.key, merged); announce(); }
  saveMeta();
}

async function pullSettings() {
  const { data, error } = await supabase.from('app_settings').select('key,value');
  if (error) throw error;
  const found = new Set<string>();
  (data || []).forEach(r => {
    const key = SETTING_KEY_BY_NAME.get(r.key);
    if (!key) return;
    found.add(key);
    meta.settings[key] = hashOf(r.value);
    if (stable(readLocal(key)) !== stable(r.value)) { writeLocal(key, r.value); announce(); }
  });
  return found;
}

// ── saving to the server ────────────────────────────────────────────────────
function onLocalWrite(key: string) {
  if (!active || applying) return;
  if (!BY_KEY.has(key) && !(key in SETTINGS)) return;
  clearTimeout(pushTimers[key]);
  pushTimers[key] = setTimeout(() => { schedulePush(key); }, 250);
}

function schedulePush(key: string): Promise<void> {
  if (running[key]) { again.add(key); return running[key]!; }
  const p = (async () => {
    try { await pushKey(key); } finally {
      running[key] = undefined;
      if (again.delete(key)) schedulePush(key);
    }
  })();
  running[key] = p;
  return p;
}

async function pushKey(key: string) {
  if (!active || !ready.has(key)) return;
  if (key in SETTINGS) return pushSetting(key);
  const cfg = BY_KEY.get(key)!;
  const list: Row[] = Array.isArray(readLocal(key)) ? readLocal(key) : [];
  const known = (meta.rows[key] ||= {});
  const seen = new Set<string>();
  const changed: { id: string; data: Row; h: string }[] = [];
  for (const r of list) {
    const id = cfg.idOf(r);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const h = hashOf(r);
    if (known[id] !== h) changed.push({ id, data: cfg.clean ? cfg.clean(r) : r, h });
  }
  let removed = cfg.appendOnly || cfg.limit ? [] : Object.keys(known).filter(id => !seen.has(id));
  // safety: a list that suddenly lost most of its records is reloaded instead of wiped on the server
  const knownCount = Object.keys(known).length;
  if (removed.length > 10 && removed.length > knownCount / 2) { removed = []; await pullTable(cfg, false).catch(() => {}); return; }
  if (!changed.length && !removed.length) return;
  if (cfg.order === 'desc') changed.reverse(); // oldest first so the server numbering follows creation order

  const writer = WRITER_ROLES.includes(role);
  let denied = false;
  try {
    for (let i = 0; i < changed.length; i += 100) {
      const chunk = changed.slice(i, i + 100);
      if (writer || cfg.appendOnly) {
        const { error } = await supabase.from(cfg.table)
          .upsert(chunk.map(c => ({ id: c.id, data: c.data })), { onConflict: 'id', ignoreDuplicates: !!cfg.appendOnly });
        if (error) { if (isDenied(error)) { denied = true; break; } throw error; }
        chunk.forEach(c => { known[c.id] = c.h; });
      } else {
        // members: change their own existing records, add new requests
        for (const c of chunk) {
          const { error } = c.id in known
            ? await supabase.from(cfg.table).update({ data: c.data }).eq('id', c.id)
            : await supabase.from(cfg.table).insert({ id: c.id, data: c.data });
          if (error) { if (isDenied(error) || error.code === '23505') { denied = true; continue; } throw error; }
          known[c.id] = c.h;
        }
      }
    }
    if (!denied && removed.length) {
      for (let i = 0; i < removed.length; i += 100) {
        const ids = removed.slice(i, i + 100);
        const { error } = await supabase.from(cfg.table).delete().in('id', ids);
        if (error) { if (isDenied(error)) { denied = true; break; } throw error; }
        ids.forEach(id => { delete known[id]; });
      }
    }
    connected = true;
  } catch {
    connected = false; // no internet — kept in this browser and sent when back online
  }
  saveMeta();
  // not allowed (e.g. a Board member editing): put back what the database has
  if (denied) await pullTable(cfg, false).catch(() => {});
}

async function pushSetting(key: string) {
  const value = readLocal(key);
  if (value === undefined) return;
  const h = hashOf(value);
  if (meta.settings[key] === h) return;
  try {
    const { error } = await supabase.from('app_settings').upsert({ key: SETTINGS[key], value }, { onConflict: 'key' });
    if (error) {
      if (isDenied(error)) await pullSettings().catch(() => {});
      else throw error;
    } else meta.settings[key] = h;
    connected = true;
  } catch { connected = false; }
  saveMeta();
}

// ── changes made by others (Supabase Realtime) ──────────────────────────────
async function onRemoteChange(payload: any) {
  const table: string = payload.table;
  if (table === 'app_settings') {
    const rec = payload.new && Object.keys(payload.new).length ? payload.new : null;
    const key = rec && SETTING_KEY_BY_NAME.get(rec.key);
    if (!key) return;
    meta.settings[key] = hashOf(rec.value);
    if (stable(readLocal(key)) !== stable(rec.value)) { writeLocal(key, rec.value); announce(); }
    saveMeta();
    return;
  }
  const cfg = BY_TABLE.get(table);
  if (!cfg || !ready.has(cfg.key)) return;
  const known = (meta.rows[cfg.key] ||= {});
  const list: Row[] = Array.isArray(readLocal(cfg.key)) ? readLocal(cfg.key) : [];

  if (payload.eventType === 'DELETE') {
    const id = payload.old?.id;
    if (!id) return;
    const next = list.filter(r => cfg.idOf(r) !== id);
    delete known[id];
    if (next.length !== list.length) { writeLocal(cfg.key, next); announce(); }
    saveMeta();
    return;
  }

  const id: string = payload.new?.id;
  if (!id) return;
  let data = payload.new?.data;
  if (data === undefined) {
    // very large records (e.g. KYC photos) arrive without their body — fetch it
    const { data: row } = await supabase.from(cfg.table).select('data').eq('id', id).maybeSingle();
    data = row?.data;
    if (data === undefined) return;
  }
  const idx = list.findIndex(r => cfg.idOf(r) === id);
  if (idx >= 0 && known[id] !== hashOf(list[idx])) return; // edited here and not saved yet — ours goes up next
  const h = hashOf(data);
  known[id] = h;
  if (idx >= 0) {
    if (hashOf(list[idx]) === h) { saveMeta(); return; }
    list[idx] = data;
  } else if (cfg.order === 'desc') list.unshift(data);
  else list.push(data);
  writeLocal(cfg.key, cfg.limit ? list.slice(0, cfg.limit) : list);
  saveMeta();
  announce();
}

function subscribe() {
  if (channel) supabase.removeChannel(channel);
  channel = supabase
    .channel('dc-database')
    .on('postgres_changes', { event: '*', schema: 'public' }, payload => { onRemoteChange(payload).catch(() => {}); })
    .subscribe(status => {
      if (status === 'SUBSCRIBED') connected = true;
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') connected = false;
    });
}

// ── start / stop ────────────────────────────────────────────────────────────
async function loadEverything(uid: string) {
  const sameUser = meta.owner === uid;
  if (!sameUser) meta = { owner: uid, rows: {}, settings: {} };

  // settings
  const foundSettings = await pullSettings();
  for (const key of Object.keys(SETTINGS)) {
    ready.add(key);
    if (!foundSettings.has(key) && role === 'ADMIN' && readLocal(key) !== undefined) await pushSetting(key);
  }

  for (const cfg of TABLES) {
    const firstTime = !sameUser || !(cfg.key in meta.rows);
    if (firstTime) {
      const remote = await fetchRows(cfg);
      const local: Row[] = Array.isArray(readLocal(cfg.key)) ? readLocal(cfg.key) : [];
      if (!remote.length && role === 'ADMIN' && local.length) {
        // empty database: the Admin's records become the starting data
        meta.rows[cfg.key] = {};
        ready.add(cfg.key);
        await schedulePush(cfg.key);
        continue;
      }
      meta.rows[cfg.key] = {};
      ready.add(cfg.key);
      const nextMeta: Record<string, string> = {};
      remote.forEach(r => { const id = cfg.idOf(r); if (id) nextMeta[id] = hashOf(r); });
      meta.rows[cfg.key] = nextMeta;
      if (stable(remote) !== stable(local)) { writeLocal(cfg.key, remote); announce(); }
      saveMeta();
    } else {
      ready.add(cfg.key);
      await schedulePush(cfg.key);       // send what was changed here while away
      await pullTable(cfg, true);
    }
  }
  saveMeta();
}

async function flushAll() {
  for (const key of [...ready]) await schedulePush(key);
}

export const database = {
  isConnected: () => active && connected,
  enabled: () => active,

  /** Called after sign-in and on page load. */
  async start() {
    const s: any = getSession();
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id;
    if (!s?.backend || !uid) { database.stop(); return; }
    if (active && meta.owner === uid) return;
    active = true;
    role = s.role;
    ready.clear();
    loadMeta();
    try {
      await loadEverything(uid);
      connected = true;
    } catch {
      connected = false;
      TABLES.forEach(t => ready.add(t.key));
      Object.keys(SETTINGS).forEach(k => ready.add(k));
    }
    subscribe();
    database.flushSms();
    if (!retryTimer) {
      retryTimer = setInterval(() => { if (active) flushAll(); }, 30000);
      window.addEventListener('online', () => { if (active) { flushAll(); TABLES.forEach(t => pullTable(t, true).catch(() => {})); } });
      window.addEventListener('dc_sms_queued', (e: any) => { if (active) sendSms(e.detail); });
    }
  },

  stop() {
    active = false;
    connected = false;
    ready.clear();
    if (channel) { supabase.removeChannel(channel); channel = null; }
  },

  async flushSms(): Promise<number> {
    let sent = 0;
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    for (const m of SaccoFarmStore.getSmsLog().filter(x => x.status !== 'SENT' && x.createdAt >= since).reverse()) {
      if (await sendSms(m)) sent++;
    }
    return sent;
  },

  // ── Mobile money (MTN MoMo / Airtel Money) through the API server ──
  async startMobileMoney(req: { provider: 'MTN' | 'AIRTEL'; phone: string; amount: number; memberId: string; purpose: string; month?: string; otherLabel?: string }): Promise<{ id: string; status: string; message?: string }> {
    if (!active) throw new Error('Mobile money needs an internet connection. Sign in again, or pay and enter the reference manually.');
    const res = await api('/payments/mobile-money/collect', { method: 'POST', body: JSON.stringify(req) }, 30000);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Payment could not be started (${res.status})`);
    return data;
  },

  async checkMobileMoney(id: string): Promise<{ id: string; status: 'PENDING' | 'SUCCESSFUL' | 'FAILED'; reason?: string; requestId?: string }> {
    const res = await api(`/payments/mobile-money/${encodeURIComponent(id)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Status check failed (${res.status})`);
    if (data.status === 'SUCCESSFUL') { const cfg = BY_KEY.get(STORAGE_KEYS.PAYMENT_REQUESTS)!; await pullTable(cfg, true).catch(() => {}); }
    return data;
  },
};

async function api(path: string, init: RequestInit = {}, timeoutMs = 20000): Promise<Response> {
  const t = await accessToken();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}), ...(init.headers || {}) },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function sendSms(m: SmsMessage): Promise<boolean> {
  if (!active || !WRITER_ROLES.includes(role)) return false;
  try {
    const res = await api('/notifications/sms', {
      method: 'POST',
      body: JSON.stringify({ id: m.id, to: m.to, message: m.message, event: m.event, senderId: SaccoFarmStore.getSmsSettings().senderId }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.status === 'SENT') {
      SaccoFarmStore.updateSms(m.id, { status: 'SENT', providerRef: data.providerRef, error: undefined });
      return true;
    }
    SaccoFarmStore.updateSms(m.id, { status: 'FAILED', error: data.error || data.message || `HTTP ${res.status}` });
  } catch {
    SaccoFarmStore.updateSms(m.id, { status: 'QUEUED', error: 'Waiting for network' });
  }
  return false;
}

// Every save anywhere in the app (store, portals, sign-up) goes through localStorage.setItem
Storage.prototype.setItem = function (this: Storage, key: string, value: string) {
  rawSetItem.call(this, key, value);
  if (this === window.localStorage) onLocalWrite(key);
};
