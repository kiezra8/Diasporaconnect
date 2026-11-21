-- ════════════════════════════════════════════════════════════════════════════
--  Diaspora Connect SACCO & Farm — Supabase database (Postgres + Auth)
--  Project: cbohtkesgaxuixbdsucw
--
--  Run this whole file once in Supabase → SQL Editor → New query → Run.
--  It is safe to run again (everything is "if not exists" / "or replace").
--
--  How the app uses it
--    • Every record type has its own table. Each row keeps the full record in
--      `data` (jsonb) plus typed columns generated from it for reports and
--      filtering, and a running number `seq` (1, 2, 3 …).
--    • Sign-in is Supabase Auth. Each login has a row in `profiles` with its
--      role (ADMIN, ACCOUNTANT, SECRETARY, BOARD_MEMBER, FARM_WORKER, MEMBER)
--      and, for members, their member number (DC-001 …).
--    • Row Level Security: staff see the SACCO; a member sees only their own
--      records. The Board is read-only. Members can only submit requests.
--      Writing is allowed only to the people who hold the task (Settings → Task
--      Assignments): money, member records and farm are separate areas, and
--      verify → approve is enforced here in the database, not only in the app.
--    • Roles are never in the app code. They are set in Supabase — see roles.sql.
--    • Realtime is on for every table, so a change made by staff appears on the
--      member's page immediately.
-- ════════════════════════════════════════════════════════════════════════════

-- gen_random_uuid() is built into Postgres 13+

-- ── Roles ───────────────────────────────────────────────────────────────────
do $$ begin
  create type public.app_role as enum ('ADMIN', 'ACCOUNTANT', 'SECRETARY', 'BOARD_MEMBER', 'FARM_WORKER', 'MEMBER');
exception when duplicate_object then null; end $$;

-- Lenient number cast for generated columns (bad input → null instead of an error)
create or replace function public.jnum(v text) returns numeric
language plpgsql immutable as $$
begin
  return nullif(trim(v), '')::numeric;
exception when others then
  return null;
end $$;

create or replace function public.jbool(v text) returns boolean
language plpgsql immutable as $$
begin
  return nullif(trim(v), '')::boolean;
exception when others then
  return null;
end $$;

-- ════════════════════════════════════════════════════════════════════════════
--  1. PROFILES (one per login)
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  seq         bigint generated always as identity unique,
  email       text not null unique,
  full_name   text,
  phone       text,
  role        public.app_role not null default 'MEMBER',
  member_id   text,                       -- DC-001 … for members
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists profiles_member_idx on public.profiles (member_id);
-- No KYC needed for this person. Set only in Supabase (SQL Editor / table editor), never from the app.
alter table public.profiles add column if not exists kyc_exempt boolean not null default false;

-- Two-step login: true when this session was confirmed with an authenticator-app code.
-- Staff powers only work in such a session; a staff password alone opens nothing.
create or replace function public.mfa_ok() returns boolean
language sql stable as $$
  select coalesce(auth.jwt()->>'aal', '') = 'aal2'
$$;

-- Helpers used by the access rules (security definer so they can read profiles)
create or replace function public.my_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active and (role = 'MEMBER' or public.mfa_ok())
$$;

create or replace function public.my_member_id() returns text
language sql stable security definer set search_path = public as $$
  select member_id from public.profiles where id = auth.uid() and active
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role <> 'MEMBER' from public.profiles where id = auth.uid() and active), false) and public.mfa_ok()
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'ADMIN' from public.profiles where id = auth.uid() and active), false) and public.mfa_ok()
$$;

-- Staff who may change SACCO / farm records (the Board is read-only)
create or replace function public.can_write() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('ADMIN', 'ACCOUNTANT', 'SECRETARY', 'FARM_WORKER') from public.profiles where id = auth.uid() and active), false) and public.mfa_ok()
$$;

-- ════════════════════════════════════════════════════════════════════════════
--  2. SACCO TABLES
-- ════════════════════════════════════════════════════════════════════════════

-- Members (DC-001, DC-002 …)
create table if not exists public.members (
  id          text primary key,
  seq         bigint generated always as identity unique,
  data        jsonb not null,
  member_id   text generated always as (coalesce(data->>'memberId', id)) stored unique,
  name        text generated always as (data->>'name') stored,
  email       text generated always as (lower(data->>'email')) stored,
  phone       text generated always as (data->>'phone') stored,
  status      text generated always as (data->>'status') stored,
  shares      numeric generated always as (public.jnum(data->>'shares')) stored,
  savings     numeric generated always as (public.jnum(data->>'savings')) stored,
  join_date   text generated always as (data->>'joinDate') stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);
create index if not exists members_email_idx on public.members (email);

-- Membership applications from the sign-up page (KYC included)
create sequence if not exists public.member_application_no;
create table if not exists public.member_applications (
  id                  text primary key,
  seq                 bigint generated always as identity unique,
  user_id             uuid references auth.users(id) on delete set null,
  data                jsonb not null,
  email               text generated always as (lower(data->>'email')) stored,
  full_name           text generated always as (data->>'fullName') stored,
  status              text generated always as (data->>'status') stored,
  member_id           text generated always as (data->>'memberId') stored,
  secretary_approved  boolean generated always as (public.jbool(data->>'secretaryApproved')) stored,
  admin_approved      boolean generated always as (public.jbool(data->>'adminApproved')) stored,
  submitted_at        text generated always as (data->>'submittedAt') stored,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  updated_by          uuid default auth.uid()
);
create index if not exists member_applications_user_idx on public.member_applications (user_id);

-- KYC submissions
create table if not exists public.kyc_submissions (
  id            text primary key,
  seq           bigint generated always as identity unique,
  data          jsonb not null,
  member_id     text generated always as (data->>'memberId') stored,
  status        text generated always as (data->>'status') stored,
  id_type       text generated always as (data->>'idType') stored,
  id_number     text generated always as (data->>'idNumber') stored,
  submitted_at  text generated always as (data->>'submittedAt') stored,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    uuid default auth.uid()
);
create index if not exists kyc_member_idx on public.kyc_submissions (member_id);

-- Deposits & withdrawals submitted by members (verify → approve)
create table if not exists public.payment_requests (
  id            text primary key,
  seq           bigint generated always as identity unique,
  data          jsonb not null,
  member_id     text generated always as (data->>'memberId') stored,
  kind          text generated always as (data->>'kind') stored,
  purpose       text generated always as (data->>'purpose') stored,
  amount        numeric generated always as (public.jnum(data->>'amount')) stored,
  method        text generated always as (data->>'method') stored,
  reference     text generated always as (data->>'reference') stored,
  status        text generated always as (data->>'status') stored,
  submitted_at  text generated always as (data->>'submittedAt') stored,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    uuid default auth.uid()
);
create index if not exists payment_requests_member_idx on public.payment_requests (member_id);

-- Savings → share capital conversions
create table if not exists public.share_conversions (
  id           text primary key,
  seq          bigint generated always as identity unique,
  data         jsonb not null,
  member_id    text generated always as (data->>'memberId') stored,
  share_count  numeric generated always as (public.jnum(data->>'shareCount')) stored,
  amount       numeric generated always as (public.jnum(data->>'amount')) stored,
  status       text generated always as (data->>'status') stored,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   uuid default auth.uid()
);
create index if not exists share_conversions_member_idx on public.share_conversions (member_id);

-- Loans (repayment history with principal / interest split is inside data)
create table if not exists public.loans (
  id                   text primary key,
  seq                  bigint generated always as identity unique,
  data                 jsonb not null,
  loan_number          text generated always as (data->>'loanNumber') stored,
  member_id            text generated always as (data->>'memberId') stored,
  principal            numeric generated always as (public.jnum(data->>'principal')) stored,
  interest_rate        numeric generated always as (public.jnum(data->>'interestRate')) stored,
  outstanding_balance  numeric generated always as (public.jnum(data->>'outstandingBalance')) stored,
  principal_paid       numeric generated always as (public.jnum(data->>'principalPaid')) stored,
  interest_paid        numeric generated always as (public.jnum(data->>'interestPaid')) stored,
  status               text generated always as (data->>'status') stored,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  updated_by           uuid default auth.uid()
);
create index if not exists loans_member_idx on public.loans (member_id);

-- Income, expenses, transfers and journals (the general ledger)
create table if not exists public.transactions (
  id              text primary key,
  seq             bigint generated always as identity unique,
  data            jsonb not null,
  tx_date         text generated always as (data->>'date') stored,
  type            text generated always as (data->>'type') stored,
  source          text generated always as (data->>'source') stored,
  category        text generated always as (data->>'category') stored,
  amount          numeric generated always as (public.jnum(data->>'amount')) stored,
  reference       text generated always as (data->>'reference') stored,
  debit_account   text generated always as (data->>'debitAccount') stored,
  credit_account  text generated always as (data->>'creditAccount') stored,
  member_id       text generated always as (coalesce(
                    nullif(data->>'memberId', ''),
                    substring((coalesce(data->>'description', '') || ' ' || coalesce(data->>'reference', '') || ' ' || coalesce(data->>'category', '')) from 'DC-[0-9]+')
                  )) stored,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  updated_by      uuid default auth.uid()
);
create index if not exists transactions_date_idx on public.transactions (tx_date);
create index if not exists transactions_member_idx on public.transactions (member_id);

-- Money Maker (dairy unit) investors
create table if not exists public.investors (
  id                 text primary key,
  seq                bigint generated always as identity unique,
  data               jsonb not null,
  member_id          text generated always as (data->>'memberId') stored,
  name               text generated always as (data->>'name') stored,
  units              numeric generated always as (public.jnum(data->>'units')) stored,
  investment_amount  numeric generated always as (public.jnum(data->>'investmentAmount')) stored,
  status             text generated always as (data->>'status') stored,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  updated_by         uuid default auth.uid()
);

-- Dividend declarations (per-member amounts are inside data.rows)
create table if not exists public.dividends (
  id          text primary key,
  seq         bigint generated always as identity unique,
  data        jsonb not null,
  year        numeric generated always as (public.jnum(data->>'year')) stored,
  surplus     numeric generated always as (public.jnum(data->>'surplus')) stored,
  pool        numeric generated always as (public.jnum(data->>'pool')) stored,
  status      text generated always as (data->>'status') stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);

-- Month-end closes (id = YYYY-MM)
create table if not exists public.period_closes (
  id          text primary key,
  seq         bigint generated always as identity unique,
  data        jsonb not null,
  status      text generated always as (data->>'status') stored,
  revenue     numeric generated always as (public.jnum(data->>'revenue')) stored,
  expenses    numeric generated always as (public.jnum(data->>'expenses')) stored,
  surplus     numeric generated always as (public.jnum(data->>'surplus')) stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);

-- SMS alerts sent to members
create table if not exists public.sms_messages (
  id          text primary key,
  seq         bigint generated always as identity unique,
  data        jsonb not null,
  member_id   text generated always as (data->>'memberId') stored,
  event       text generated always as (data->>'event') stored,
  to_phone    text generated always as (data->>'to') stored,
  status      text generated always as (data->>'status') stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);

-- Audit trail (append-only: rows can never be edited or deleted)
create table if not exists public.audit_log (
  id          text primary key,
  seq         bigint generated always as identity unique,
  data        jsonb not null,
  at          text generated always as (data->>'at') stored,
  actor       text generated always as (data->>'actor') stored,
  role        text generated always as (data->>'role') stored,
  action      text generated always as (data->>'action') stored,
  entity      text generated always as (data->>'entity') stored,
  entity_id   text generated always as (data->>'entityId') stored,
  summary     text generated always as (data->>'summary') stored,
  user_id     uuid default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);
create index if not exists audit_at_idx on public.audit_log (at);

-- Staff directory (used for task assignment) and who does which task
create table if not exists public.staff (
  id          text primary key,
  seq         bigint generated always as identity unique,
  data        jsonb not null,
  email       text generated always as (lower(data->>'email')) stored,
  name        text generated always as (data->>'name') stored,
  role        text generated always as (data->>'role') stored,
  active      boolean generated always as (public.jbool(data->>'active')) stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);

create table if not exists public.task_assignments (
  id          text primary key,          -- task id, e.g. approve_payments
  seq         bigint generated always as identity unique,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);

-- Settings (share par value, SMS settings)
create table if not exists public.app_settings (
  key         text primary key,
  seq         bigint generated always as identity unique,
  value       jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);

-- Mobile money collections (written only by the API server on the VPS)
create table if not exists public.mobile_money_payments (
  id                uuid primary key default gen_random_uuid(),
  seq               bigint generated always as identity unique,
  provider          text not null check (provider in ('MTN', 'AIRTEL')),
  provider_ref      text not null unique,
  external_id       text not null unique,
  msisdn            text not null,
  amount            numeric not null check (amount > 0),
  currency          text not null default 'UGX',
  member_id         text not null,
  purpose           text not null,
  month             text,
  other_label       text,
  status            text not null default 'PENDING' check (status in ('PENDING', 'SUCCESSFUL', 'FAILED')),
  reason            text,
  financial_txn_id  text,
  request_id        text,
  initiated_by      text,
  raw               jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists momo_member_idx on public.mobile_money_payments (member_id);

-- ════════════════════════════════════════════════════════════════════════════
--  3. FARM TABLES
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.cattle (
  id          text primary key,
  seq         bigint generated always as identity unique,
  data        jsonb not null,
  tag_number  text generated always as (data->>'tagNumber') stored,
  name        text generated always as (data->>'name') stored,
  breed       text generated always as (data->>'breed') stored,
  stage       text generated always as (data->>'stage') stored,
  has_calf    boolean generated always as (public.jbool(data->>'hasCalf')) stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);

create table if not exists public.milk_logs (
  id          text primary key,
  seq         bigint generated always as identity unique,
  data        jsonb not null,
  log_date    text generated always as (data->>'date') stored,
  morning     numeric generated always as (public.jnum(data->>'morning')) stored,
  afternoon   numeric generated always as (public.jnum(data->>'afternoon')) stored,
  evening     numeric generated always as (public.jnum(data->>'evening')) stored,
  net_sold    numeric generated always as (public.jnum(data->>'netSold')) stored,
  revenue     numeric generated always as (public.jnum(data->>'revenue')) stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);

create table if not exists public.cow_milk_records (
  id          text primary key,
  seq         bigint generated always as identity unique,
  data        jsonb not null,
  cow_tag     text generated always as (data->>'cowTag') stored,
  record_date text generated always as (data->>'date') stored,
  session     text generated always as (data->>'session') stored,
  litres      numeric generated always as (public.jnum(data->>'litres')) stored,
  revenue     numeric generated always as (public.jnum(data->>'revenue')) stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);

create table if not exists public.health_records (
  id          text primary key,
  seq         bigint generated always as identity unique,
  data        jsonb not null,
  tag_number  text generated always as (data->>'tagNumber') stored,
  type        text generated always as (data->>'type') stored,
  record_date text generated always as (data->>'date') stored,
  cost        numeric generated always as (public.jnum(data->>'cost')) stored,
  status      text generated always as (data->>'status') stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);

create table if not exists public.breeding_records (
  id                text primary key,
  seq               bigint generated always as identity unique,
  data              jsonb not null,
  tag_number        text generated always as (data->>'tagNumber') stored,
  record_date       text generated always as (data->>'date') stored,
  expected_calving  text generated always as (data->>'expectedCalving') stored,
  status            text generated always as (data->>'status') stored,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  updated_by        uuid default auth.uid()
);

create table if not exists public.feed_inventory (
  id             text primary key,
  seq            bigint generated always as identity unique,
  data           jsonb not null,
  feed_type      text generated always as (data->>'feedType') stored,
  current_stock  numeric generated always as (public.jnum(data->>'currentStock')) stored,
  min_stock      numeric generated always as (public.jnum(data->>'minStock')) stored,
  unit           text generated always as (data->>'unit') stored,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  updated_by     uuid default auth.uid()
);

-- ════════════════════════════════════════════════════════════════════════════
--  4. WHO MAY DO WHAT (same task list the Admin manages in Settings)
-- ════════════════════════════════════════════════════════════════════════════
create or replace function public.my_email() returns text
language sql stable security definer set search_path = public as $$
  select email from public.profiles where id = auth.uid() and active
$$;

-- Default roles for each task until the Admin assigns it to named people
create or replace function public.task_default_roles(p_task text) returns text[]
language sql immutable as $$
  select case p_task
    when 'verify_payments'     then array['ACCOUNTANT']
    when 'approve_payments'    then array['ADMIN']
    when 'record_income'       then array['ACCOUNTANT']
    when 'record_expenses'     then array['ACCOUNTANT']
    when 'post_journals'       then array['ACCOUNTANT']
    when 'loan_processing'     then array['ACCOUNTANT', 'ADMIN']
    when 'kyc_review'          then array['SECRETARY', 'ADMIN']
    when 'member_registration' then array['SECRETARY']
    when 'month_end_close'     then array['ACCOUNTANT']
    when 'dividends'           then array['ADMIN']
    when 'sms_broadcast'       then array['SECRETARY', 'ADMIN']
    when 'milk_recording'      then array['FARM_WORKER']
    when 'herd_register'       then array['FARM_WORKER']
    when 'animal_health'       then array['FARM_WORKER']
    when 'feeds_stock'         then array['FARM_WORKER']
    when 'breeding'            then array['FARM_WORKER']
    else array[]::text[]
  end
$$;

-- The Admin may do everything. Anyone else needs the task: assigned to their email in
-- Settings → Task Assignments, or (while a task is unassigned) the default role in the staff directory.
create or replace function public.has_task(p_task text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare me record;
begin
  select role, lower(email) as email into me from public.profiles where id = auth.uid() and active;
  if not found or me.role = 'MEMBER' or not public.mfa_ok() then return false; end if;
  if me.role = 'ADMIN' then return true; end if;
  if exists (select 1 from public.task_assignments where id = p_task) then
    return exists (
      select 1 from public.task_assignments ta,
             jsonb_array_elements_text(case when jsonb_typeof(ta.data->'assigneeEmails') = 'array' then ta.data->'assigneeEmails' else '[]'::jsonb end) e
       where ta.id = p_task and lower(e) = me.email);
  end if;
  return exists (select 1 from public.staff s
                  where s.email = me.email and coalesce(s.active, true) and s.role = any(public.task_default_roles(p_task)));
end $$;

create or replace function public.has_any_task(p_tasks text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(bool_or(public.has_task(t)), false) from unnest(p_tasks) t
$$;

-- Money: payments, loans, income, expenses, journals, closes, dividends
create or replace function public.sacco_finance() returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_any_task(array['verify_payments','approve_payments','record_income','record_expenses',
                                   'post_journals','loan_processing','month_end_close','dividends'])
$$;

-- Member records: registration, KYC, SMS (plus everyone with money tasks)
create or replace function public.sacco_records() returns boolean
language sql stable security definer set search_path = public as $$
  select public.sacco_finance() or public.has_any_task(array['member_registration','kyc_review','sms_broadcast'])
$$;

-- Farm: milk, herd, health, feeds, breeding
create or replace function public.farm_writer() returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_any_task(array['milk_recording','herd_register','animal_health','feeds_stock','breeding'])
$$;

create or replace function public.is_approved_member() returns boolean
language sql stable security definer set search_path = public as $$
  select public.my_member_id() is not null
$$;

-- ════════════════════════════════════════════════════════════════════════════
--  5. TRIGGERS
-- ════════════════════════════════════════════════════════════════════════════

-- member_id is a normal column kept up to date by a trigger (not a generated column), because
-- Realtime only sees normal columns — members' portals listen only for changes to their own member_id.
create or replace function public.set_member_id() returns trigger
language plpgsql as $$
begin
  if tg_table_name = 'members' then
    new.member_id := coalesce(new.data->>'memberId', new.id);
  elsif tg_table_name = 'transactions' then
    new.member_id := coalesce(
      nullif(new.data->>'memberId', ''),
      substring((coalesce(new.data->>'description', '') || ' ' || coalesce(new.data->>'reference', '') || ' ' || coalesce(new.data->>'category', '')) from 'DC-[0-9]+'));
  else
    new.member_id := new.data->>'memberId';
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['members','kyc_submissions','payment_requests','share_conversions','loans','transactions','investors'] loop
    if exists (select 1 from pg_attribute where attrelid = format('public.%I', t)::regclass and attname = 'member_id' and attgenerated = 's') then
      execute format('alter table public.%I alter column member_id drop expression', t);
    end if;
    execute format('drop trigger if exists set_member_id on public.%I', t);
    execute format('create trigger set_member_id before insert or update on public.%I for each row execute function public.set_member_id()', t);
  end loop;
end $$;

-- Every save: server time and the real user are stamped; text can never carry HTML or
-- script tags (so nothing typed in can run in a report); oversized records are refused.
create or replace function public.stamp_and_clean() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then new.created_at := now(); else new.created_at := old.created_at; end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  if auth.uid() is not null then
    new.data := regexp_replace(new.data::text, '[<>]', '', 'g')::jsonb;
    if octet_length(new.data::text) > 6000000 then raise exception 'This record is too large to save.'; end if;
  end if;
  return new;
end $$;

create or replace function public.stamp_settings() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then new.created_at := now(); else new.created_at := old.created_at; end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  if auth.uid() is not null and new.value is not null then
    new.value := regexp_replace(new.value::text, '[<>]', '', 'g')::jsonb;
    if octet_length(new.value::text) > 200000 then raise exception 'This setting is too large to save.'; end if;
  end if;
  return new;
end $$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- old trigger function from earlier versions of this file
drop function if exists public.touch_row() cascade;

do $$
declare t text;
begin
  foreach t in array array['members','member_applications','kyc_submissions','payment_requests','share_conversions','loans',
    'transactions','investors','dividends','period_closes','sms_messages','staff','task_assignments',
    'cattle','milk_logs','cow_milk_records','health_records','breeding_records','feed_inventory']
  loop
    execute format('drop trigger if exists touch_%1$s on public.%1$I', t);
    execute format('drop trigger if exists stamp_%1$s on public.%1$I', t);
    execute format('create trigger stamp_%1$s before insert or update on public.%1$I for each row execute function public.stamp_and_clean()', t);
  end loop;
  drop trigger if exists touch_app_settings on public.app_settings;
  drop trigger if exists stamp_app_settings on public.app_settings;
  create trigger stamp_app_settings before insert or update on public.app_settings for each row execute function public.stamp_settings();
  foreach t in array array['mobile_money_payments','profiles']
  loop
    execute format('drop trigger if exists touch_%1$s on public.%1$I', t);
    execute format('create trigger touch_%1$s before update on public.%1$I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- Audit entries carry the real user from the server, never what the browser claims
create or replace function public.stamp_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record;
begin
  new.created_at := now();
  new.updated_at := now();
  if auth.uid() is not null then
    new.user_id := auth.uid();
    new.updated_by := auth.uid();
    select full_name, role, email into p from public.profiles where id = auth.uid();
    new.data := regexp_replace(new.data::text, '[<>]', '', 'g')::jsonb
             || jsonb_build_object('actor', coalesce(nullif(p.full_name, ''), p.email, 'Unknown'),
                                   'role', coalesce(p.role::text, 'UNKNOWN'), 'email', p.email, 'recordedAt', now());
    if octet_length(new.data::text) > 200000 then raise exception 'Audit entry too large.'; end if;
  end if;
  return new;
end $$;
drop trigger if exists stamp_audit on public.audit_log;
create trigger stamp_audit before insert on public.audit_log
  for each row execute function public.stamp_audit();

-- The audit trail can never be edited or deleted
create or replace function public.audit_is_append_only() returns trigger
language plpgsql as $$
begin
  raise exception 'The audit trail is append-only';
end $$;
drop trigger if exists audit_append_only on public.audit_log;
create trigger audit_append_only before update or delete on public.audit_log
  for each row execute function public.audit_is_append_only();

-- Members may change only their own contact details and photo
create or replace function public.guard_member_self_edit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.sacco_records() or coalesce(current_setting('app.bypass_guard', true), '') = 'on' then
    return new;
  end if;
  new.data := old.data || jsonb_strip_nulls(jsonb_build_object(
    'name', new.data->'name', 'phone', new.data->'phone', 'email', new.data->'email', 'avatar', new.data->'avatar'));
  return new;
end $$;
drop trigger if exists guard_member_self_edit on public.members;
create trigger guard_member_self_edit before update on public.members
  for each row execute function public.guard_member_self_edit();

-- Savings, shares and monthly contributions change only through money tasks
create or replace function public.guard_member_money() returns trigger
language plpgsql security definer set search_path = public as $$
declare k text;
begin
  if auth.uid() is null or public.sacco_finance() then return new; end if;
  foreach k in array array['savings','shares','sharesValue','total','withdrawable','adminFee',
                           'jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
  loop
    if tg_op = 'UPDATE' then
      new.data := case when old.data ? k then jsonb_set(new.data, array[k], old.data->k) else new.data - k end;
    elsif k <> 'adminFee' then
      new.data := jsonb_set(new.data, array[k], '0'::jsonb);
    end if;
  end loop;
  return new;
end $$;
drop trigger if exists guard_member_money on public.members;
create trigger guard_member_money before insert or update on public.members
  for each row execute function public.guard_member_money();

-- What a member submits is cleaned: their own member number and name, no approvals, positive amounts
create or replace function public.clean_member_request() returns trigger
language plpgsql security definer set search_path = public as $$
declare nm text; mine text := public.my_member_id();
begin
  if auth.uid() is null or public.is_staff() then return new; end if;
  select data->>'name' into nm from public.members where member_id = mine;
  new.data := new.data || jsonb_build_object('memberId', mine, 'memberName', coalesce(nm, new.data->>'memberName'));
  if tg_table_name = 'payment_requests' then
    new.data := (new.data - 'verifiedBy' - 'verifiedAt' - 'approvedBy' - 'approvedAt' - 'rejectionReason' - 'postedTransactionId')
             || jsonb_build_object('status', 'PENDING_VERIFICATION');
    if coalesce(public.jnum(new.data->>'amount'), 0) <= 0 then raise exception 'The amount must be more than zero.'; end if;
  elsif tg_table_name = 'kyc_submissions' then
    new.data := (new.data - 'reviewedBy' - 'reviewedAt' - 'rejectionReason') || jsonb_build_object('status', 'PENDING');
  elsif tg_table_name = 'share_conversions' then
    new.data := (new.data - 'accountantApprovedAt' - 'accountantApprovedBy' - 'adminApprovedAt' - 'adminApprovedBy' - 'rejectionReason')
             || jsonb_build_object('status', 'PENDING', 'accountantApproved', false, 'adminApproved', false);
    if coalesce(public.jnum(new.data->>'shareCount'), 0) <= 0 then raise exception 'The number of shares must be more than zero.'; end if;
  end if;
  return new;
end $$;
do $$
declare t text;
begin
  foreach t in array array['payment_requests','kyc_submissions','share_conversions'] loop
    execute format('drop trigger if exists clean_member_request on public.%I', t);
    execute format('create trigger clean_member_request before insert or update on public.%I for each row execute function public.clean_member_request()', t);
  end loop;
end $$;

-- Nobody checks or approves their own records (a staff member who is also a SACCO member)
create or replace function public.is_own_member(p_member_id text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members m
                  where m.member_id = p_member_id and m.email is not null and m.email = public.my_email())
$$;

-- KYC: only the people assigned "Review member KYC" decide, and never on their own KYC
create or replace function public.guard_kyc_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if new.data->>'status' in ('VERIFIED', 'REJECTED')
     and (tg_op = 'INSERT' or old.data->>'status' is distinct from new.data->>'status') then
    if not public.has_task('kyc_review') then
      raise exception 'Only the people assigned "Review member KYC" can verify or return KYC.';
    end if;
    if public.is_own_member(coalesce(new.member_id, new.data->>'memberId')) then
      raise exception 'You cannot review your own KYC. Another reviewer must do it.';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists guard_kyc_review on public.kyc_submissions;
create trigger guard_kyc_review before insert or update on public.kyc_submissions
  for each row execute function public.guard_kyc_review();

-- Deposits / withdrawals: verify first, then approve, each by the person assigned that task
create or replace function public.guard_payment_workflow() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  was text := case when tg_op = 'UPDATE' then old.data->>'status' end;
  now_status text := new.data->>'status';
begin
  if auth.uid() is null or now_status is not distinct from was then return new; end if;
  if now_status in ('VERIFIED_AWAITING_ADMIN', 'APPROVED', 'REJECTED') and public.is_own_member(coalesce(new.member_id, new.data->>'memberId')) then
    raise exception 'You cannot verify or approve your own request. Another officer must do it.';
  end if;
  if now_status = 'VERIFIED_AWAITING_ADMIN' then
    if not public.has_task('verify_payments') then
      raise exception 'Only the person assigned "Verify member payments" can verify this request.';
    end if;
  elsif now_status = 'APPROVED' then
    if not public.has_task('approve_payments') then
      raise exception 'Only the person assigned "Approve member payments" can approve this request.';
    end if;
    if coalesce(was, '') <> 'VERIFIED_AWAITING_ADMIN'
       and not (coalesce(was, '') = 'PENDING_VERIFICATION' and public.has_task('verify_payments') and new.data->>'verifiedBy' is not null) then
      raise exception 'A request must be verified before it is approved.';
    end if;
  elsif now_status = 'REJECTED' then
    if not (public.has_task('verify_payments') or public.has_task('approve_payments')) then
      raise exception 'You are not allowed to reject payment requests.';
    end if;
  elsif tg_op = 'UPDATE' and was in ('APPROVED', 'REJECTED') and not public.is_admin() then
    raise exception 'A finished request cannot be reopened.';
  elsif tg_op = 'INSERT' and now_status is distinct from 'PENDING_VERIFICATION' then
    raise exception 'New requests must start as pending.';
  end if;
  return new;
end $$;
drop trigger if exists guard_payment_workflow on public.payment_requests;
create trigger guard_payment_workflow before insert or update on public.payment_requests
  for each row execute function public.guard_payment_workflow();

-- Share conversions: Accountant check, then Admin approval
create or replace function public.guard_share_conversion() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  acc_was boolean := case when tg_op = 'UPDATE' then coalesce(public.jbool(old.data->>'accountantApproved'), false) else false end;
  adm_was boolean := case when tg_op = 'UPDATE' then coalesce(public.jbool(old.data->>'adminApproved'), false) else false end;
  acc_now boolean := coalesce(public.jbool(new.data->>'accountantApproved'), false);
  adm_now boolean := coalesce(public.jbool(new.data->>'adminApproved'), false);
begin
  if auth.uid() is null then return new; end if;
  if ((acc_now and not acc_was) or (adm_now and not adm_was)) and public.is_own_member(coalesce(new.member_id, new.data->>'memberId')) then
    raise exception 'You cannot approve your own share conversion. Another officer must do it.';
  end if;
  if acc_now and not acc_was and not public.has_task('verify_payments') then
    raise exception 'Only the person assigned "Verify member payments" can check share conversions.';
  end if;
  if adm_now and not adm_was and not public.has_task('approve_payments') then
    raise exception 'Only the person assigned "Approve member payments" can approve share conversions.';
  end if;
  if new.data->>'status' = 'APPROVED' and (tg_op = 'INSERT' or old.data->>'status' is distinct from 'APPROVED') and not (acc_now and adm_now) then
    raise exception 'A share conversion needs both the Accountant check and the Admin approval.';
  end if;
  return new;
end $$;
drop trigger if exists guard_share_conversion on public.share_conversions;
create trigger guard_share_conversion before insert or update on public.share_conversions
  for each row execute function public.guard_share_conversion();

-- Membership applications: Secretary vetting + Admin approval; applicants change only contact details
create or replace function public.guard_application() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  sec_was boolean := case when tg_op = 'UPDATE' then coalesce(public.jbool(old.data->>'secretaryApproved'), false) else false end;
  adm_was boolean := case when tg_op = 'UPDATE' then coalesce(public.jbool(old.data->>'adminApproved'), false) else false end;
  sec_now boolean := coalesce(public.jbool(new.data->>'secretaryApproved'), false);
  adm_now boolean := coalesce(public.jbool(new.data->>'adminApproved'), false);
begin
  if tg_op = 'UPDATE' then new.user_id := old.user_id; end if;   -- the login an application belongs to never changes
  if auth.uid() is null or coalesce(current_setting('app.bypass_guard', true), '') = 'on' then return new; end if;
  if not public.sacco_records() then
    if tg_op = 'INSERT' then raise exception 'Use the sign-up page to apply.'; end if;
    new.data := old.data || jsonb_strip_nulls(jsonb_build_object(
      'fullName', new.data->'fullName', 'phone', new.data->'phone', 'photoUrl', new.data->'photoUrl'));
    return new;
  end if;
  if ((sec_now and not sec_was) or (adm_now and not adm_was)) and new.user_id = auth.uid() then
    raise exception 'You cannot approve your own application.';
  end if;
  if sec_now and not sec_was and not (public.has_task('member_registration') or public.has_task('kyc_review')) then
    raise exception 'Only the Secretary (member registration) can vet applications.';
  end if;
  if adm_now and not adm_was and not public.is_admin() then
    raise exception 'Only the Admin can authorise a new member.';
  end if;
  if new.data->>'status' = 'APPROVED' and (tg_op = 'INSERT' or old.data->>'status' is distinct from 'APPROVED')
     and not (sec_now and adm_now and coalesce(new.data->>'memberId', '') <> '') then
    raise exception 'An application is approved only after both the Secretary and the Admin approve it.';
  end if;
  return new;
end $$;
drop trigger if exists guard_application_self_edit on public.member_applications;
drop function if exists public.guard_application_self_edit();
drop trigger if exists guard_application on public.member_applications;
create trigger guard_application before insert or update on public.member_applications
  for each row execute function public.guard_application();

-- Only the Admin can reopen a closed month
create or replace function public.guard_period_reopen() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and new.data->>'status' = 'REOPENED' and old.data->>'status' is distinct from 'REOPENED' and not public.is_admin() then
    raise exception 'Only the Admin can reopen a closed month.';
  end if;
  return new;
end $$;
drop trigger if exists guard_period_reopen on public.period_closes;
create trigger guard_period_reopen before update on public.period_closes
  for each row execute function public.guard_period_reopen();

-- Only the Admin can change roles, member links, emails or deactivate a login
create or replace function public.guard_profile_edit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- KYC exemption is decided in Supabase only: nobody can change it through the app
  if auth.uid() is not null then new.kyc_exempt := old.kyc_exempt; end if;
  if auth.uid() is null or public.is_admin() or coalesce(current_setting('app.bypass_guard', true), '') = 'on' then
    return new;
  end if;
  new.role := old.role;
  new.member_id := old.member_id;
  new.active := old.active;
  new.email := old.email;
  new.full_name := regexp_replace(coalesce(new.full_name, ''), '[<>]', '', 'g');
  new.phone := regexp_replace(coalesce(new.phone, ''), '[<>]', '', 'g');
  return new;
end $$;
drop trigger if exists guard_profile_edit on public.profiles;
create trigger guard_profile_edit before update on public.profiles
  for each row execute function public.guard_profile_edit();

-- Sets a confirmed login's role. Keeps at least one Admin and stops an Admin removing their own access.
create or replace function public.set_profile_role(p_email text, p_role public.app_role, p_active boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and lower(p_email) = public.my_email() and public.is_admin() and (p_role <> 'ADMIN' or not p_active) then
    raise exception 'You cannot remove your own Admin access. Ask another Admin to do it.';
  end if;
  perform set_config('app.bypass_guard', 'on', true);
  update public.profiles p set role = p_role, active = p_active
   where p.email = lower(p_email)
     and exists (select 1 from auth.users u where u.id = p.id and u.email_confirmed_at is not null);
  perform set_config('app.bypass_guard', 'off', true);
  if auth.uid() is not null and not exists (select 1 from public.profiles where role = 'ADMIN' and active) then
    raise exception 'There must always be at least one active Admin.';
  end if;
end $$;

-- Link a confirmed login to the member record with the same email
create or replace function public.link_member_by_email(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare p record; m text;
begin
  select * into p from public.profiles where id = p_user;
  if not found or p.role <> 'MEMBER' or p.member_id is not null then return; end if;
  if not exists (select 1 from auth.users where id = p_user and email_confirmed_at is not null) then return; end if;
  select member_id into m from public.members where email = lower(p.email) order by seq limit 1;
  if m is not null then
    perform set_config('app.bypass_guard', 'on', true);
    update public.profiles set member_id = m where id = p_user;
    perform set_config('app.bypass_guard', 'off', true);
  end if;
end $$;

-- Staff role from the directory, applied only once the email address is confirmed
create or replace function public.apply_directory_role(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare s record; e text;
begin
  select lower(email) into e from auth.users where id = p_user and email_confirmed_at is not null;
  if e is null then return; end if;
  select role, coalesce(active, true) as active into s from public.staff where email = e order by seq limit 1;
  if found and s.role in ('ADMIN','ACCOUNTANT','SECRETARY','BOARD_MEMBER','FARM_WORKER') then
    perform set_config('app.bypass_guard', 'on', true);
    update public.profiles set role = s.role::public.app_role, active = s.active where id = p_user;
    perform set_config('app.bypass_guard', 'off', true);
  end if;
end $$;

-- New login → profile (always starts as MEMBER; staff roles only after the email is confirmed)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id, lower(new.email),
    regexp_replace(coalesce(new.raw_user_meta_data->>'full_name', ''), '[<>]', '', 'g'),
    regexp_replace(coalesce(new.raw_user_meta_data->>'phone', ''), '[<>]', '', 'g'),
    'MEMBER'
  )
  on conflict (id) do nothing;
  perform public.apply_directory_role(new.id);
  perform public.link_member_by_email(new.id);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_confirmed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    perform public.apply_directory_role(new.id);
    perform public.link_member_by_email(new.id);
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed after update of email_confirmed_at on auth.users
  for each row execute function public.handle_user_confirmed();

-- Admin adds / edits / removes staff in Settings → their login's role follows
create or replace function public.apply_staff_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if old.email is not null then perform public.set_profile_role(old.email, 'MEMBER', true); end if;
    return old;
  end if;
  if tg_op = 'UPDATE' and old.email is not null and old.email is distinct from new.email then
    perform public.set_profile_role(old.email, 'MEMBER', true);
  end if;
  if new.email is not null and new.role in ('ADMIN','ACCOUNTANT','SECRETARY','BOARD_MEMBER','FARM_WORKER') then
    perform public.set_profile_role(new.email, new.role::public.app_role, coalesce(new.active, true));
  end if;
  return new;
end $$;
drop trigger if exists apply_staff_role on public.staff;
create trigger apply_staff_role after insert or update or delete on public.staff
  for each row execute function public.apply_staff_role();

-- A member record created or edited by staff is linked to the confirmed login with the same email
create or replace function public.link_new_member() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_staff() then return new; end if;
  if new.email is not null and new.email <> '' then
    perform set_config('app.bypass_guard', 'on', true);
    update public.profiles p set member_id = new.member_id
     where p.email = new.email and p.role = 'MEMBER' and p.member_id is null
       and exists (select 1 from auth.users u where u.id = p.id and u.email_confirmed_at is not null);
    perform set_config('app.bypass_guard', 'off', true);
  end if;
  return new;
end $$;
drop trigger if exists link_new_member on public.members;
create trigger link_new_member after insert or update on public.members
  for each row execute function public.link_new_member();

-- When Secretary + Admin approve an application, the applicant's login is linked to the new member
create or replace function public.on_application_approved() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'APPROVED' and new.member_id is not null and new.user_id is not null then
    perform set_config('app.bypass_guard', 'on', true);
    update public.profiles set member_id = new.member_id, full_name = coalesce(nullif(full_name, ''), new.full_name)
     where id = new.user_id and role = 'MEMBER';
    perform set_config('app.bypass_guard', 'off', true);
  end if;
  return new;
end $$;
drop trigger if exists on_application_approved on public.member_applications;
create trigger on_application_approved after insert or update on public.member_applications
  for each row execute function public.on_application_approved();

-- ════════════════════════════════════════════════════════════════════════════
--  6. SIGN-UP: an application is only accepted with complete KYC
-- ════════════════════════════════════════════════════════════════════════════
create or replace function public.submit_membership_application(p_user_id uuid, p_application jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  u record;
  app jsonb;
  k jsonb;
  missing text;
  app_id text;
begin
  if p_application is null or jsonb_typeof(p_application) <> 'object' then raise exception 'Invalid application'; end if;
  if octet_length(p_application::text) > 6000000 then raise exception 'The photos are too large. Use smaller images.'; end if;
  app := regexp_replace(p_application::text, '[<>]', '', 'g')::jsonb;
  k := case when jsonb_typeof(app->'kyc') = 'object' then app->'kyc' else '{}'::jsonb end;

  select id, email, created_at, email_confirmed_at into u from auth.users where id = p_user_id;
  if not found then raise exception 'Account not found'; end if;
  -- allowed for a brand-new, not yet confirmed account (right after sign-up) or by the signed-in applicant
  if auth.uid() is distinct from p_user_id
     and (u.email_confirmed_at is not null or u.created_at < now() - interval '2 hours') then
    raise exception 'Sign in to complete your application';
  end if;
  -- members and staff never need an application
  if exists (select 1 from public.profiles where id = p_user_id and (role <> 'MEMBER' or member_id is not null)) then
    raise exception 'This account already has access';
  end if;
  if lower(coalesce(app->>'email', '')) <> lower(u.email) then
    raise exception 'The application email does not match the account';
  end if;
  if exists (select 1 from public.member_applications where user_id = p_user_id and status <> 'REJECTED') then
    raise exception 'An application already exists for this account';
  end if;

  select string_agg(f, ', ') into missing
    from unnest(array['fullName','phone','dob','gender']) f
   where coalesce(trim(app->>f), '') = '';
  if missing is not null then raise exception 'Missing personal details: %', missing; end if;

  select string_agg(f, ', ') into missing
    from unnest(array['idType','idNumber','dateOfBirth','nationality','countryOfResidence','address','occupation',
                      'sourceOfFunds','nextOfKinName','nextOfKinRelationship','nextOfKinPhone','idFrontImage','selfieImage']) f
   where coalesce(trim(k->>f), '') = '';
  if missing is not null then raise exception 'KYC incomplete: %', missing; end if;
  if (k->>'idFrontImage') not like 'data:image/%' or (k->>'selfieImage') not like 'data:image/%' then
    raise exception 'The ID photo and selfie must be images.';
  end if;

  app_id := 'REG-' || lpad(nextval('public.member_application_no')::text, 4, '0');
  perform set_config('app.bypass_guard', 'on', true);
  insert into public.member_applications (id, user_id, data)
  values (app_id, p_user_id,
          (app - 'password') || jsonb_build_object(
            'id', app_id, 'email', lower(u.email), 'status', 'PENDING_APPROVAL',
            'secretaryApproved', false, 'adminApproved', false, 'memberId', null,
            'userId', p_user_id, 'submittedAt', to_char(now(), 'YYYY-MM-DD')));
  perform set_config('app.bypass_guard', 'off', true);
  return app_id;
end $$;

-- ════════════════════════════════════════════════════════════════════════════
--  7. ACCESS RULES (Row Level Security)
-- ════════════════════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  foreach t in array array['profiles','members','member_applications','kyc_submissions','payment_requests','share_conversions','loans',
    'transactions','investors','dividends','period_closes','sms_messages','audit_log','staff','task_assignments','app_settings',
    'mobile_money_payments','cattle','milk_logs','cow_milk_records','health_records','breeding_records','feed_inventory']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- start clean so re-running this file never leaves old rules behind
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Profiles: your own; staff see all; only the Admin changes roles (trigger above)
create policy profiles_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_staff()));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin())) with check (id = (select auth.uid()) or (select public.is_admin()));

do $$
declare t text;
begin
  -- reading: a member sees only their own rows; staff see everything
  foreach t in array array['members','kyc_submissions','payment_requests','share_conversions','loans','transactions','investors','mobile_money_payments']
  loop
    execute format('create policy %1$s_read on public.%1$I for select to authenticated using ((select public.is_staff()) or member_id = (select public.my_member_id()))', t);
  end loop;
  foreach t in array array['dividends','period_closes','sms_messages','staff','task_assignments']
  loop
    execute format('create policy %1$s_read on public.%1$I for select to authenticated using ((select public.is_staff()))', t);
  end loop;
  foreach t in array array['cattle','milk_logs','cow_milk_records','health_records','breeding_records','feed_inventory','app_settings']
  loop
    execute format('create policy %1$s_read on public.%1$I for select to authenticated using ((select public.is_staff()) or (select public.is_approved_member()))', t);
  end loop;

  -- writing, by area of work
  foreach t in array array['members','kyc_submissions','sms_messages']
  loop
    execute format('create policy %1$s_write_ins on public.%1$I for insert to authenticated with check ((select public.sacco_records()))', t);
    execute format('create policy %1$s_write_upd on public.%1$I for update to authenticated using ((select public.sacco_records())) with check ((select public.sacco_records()))', t);
    execute format('create policy %1$s_write_del on public.%1$I for delete to authenticated using ((select public.sacco_finance()) or (select public.is_admin()))', t);
  end loop;
  foreach t in array array['payment_requests','share_conversions','loans','investors','transactions']
  loop
    execute format('create policy %1$s_write_ins on public.%1$I for insert to authenticated with check ((select public.sacco_finance()))', t);
    execute format('create policy %1$s_write_upd on public.%1$I for update to authenticated using ((select public.sacco_finance())) with check ((select public.sacco_finance()))', t);
    execute format('create policy %1$s_write_del on public.%1$I for delete to authenticated using ((select public.sacco_finance()))', t);
  end loop;
  foreach t in array array['cattle','milk_logs','cow_milk_records','health_records','breeding_records','feed_inventory']
  loop
    execute format('create policy %1$s_write_ins on public.%1$I for insert to authenticated with check ((select public.farm_writer()))', t);
    execute format('create policy %1$s_write_upd on public.%1$I for update to authenticated using ((select public.farm_writer())) with check ((select public.farm_writer()))', t);
    execute format('create policy %1$s_write_del on public.%1$I for delete to authenticated using ((select public.farm_writer()))', t);
  end loop;
  foreach t in array array['staff','task_assignments','app_settings']
  loop
    execute format('create policy %1$s_admin_ins on public.%1$I for insert to authenticated with check ((select public.is_admin()))', t);
    execute format('create policy %1$s_admin_upd on public.%1$I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format('create policy %1$s_admin_del on public.%1$I for delete to authenticated using ((select public.is_admin()))', t);
  end loop;
end $$;

-- Month-end close and dividends: only the people assigned those tasks
create policy period_closes_write_ins on public.period_closes for insert to authenticated with check ((select public.has_task('month_end_close')));
create policy period_closes_write_upd on public.period_closes for update to authenticated
  using ((select public.has_task('month_end_close')) or (select public.is_admin())) with check ((select public.has_task('month_end_close')) or (select public.is_admin()));
create policy period_closes_write_del on public.period_closes for delete to authenticated using ((select public.is_admin()));
create policy dividends_write_ins on public.dividends for insert to authenticated with check ((select public.has_task('dividends')));
create policy dividends_write_upd on public.dividends for update to authenticated
  using ((select public.has_task('dividends'))) with check ((select public.has_task('dividends')));
create policy dividends_write_del on public.dividends for delete to authenticated using ((select public.is_admin()));

-- The farm posts its own milk sales, vet and feed costs to the ledger (and nothing else)
create policy transactions_farm_ins on public.transactions for insert to authenticated
  with check ((select public.farm_writer()) and member_id is null
              and (reference like 'MLK-%' or reference like 'VET-%' or reference like 'FEED-%' or reference like 'FD-PUR-%'));
create policy transactions_farm_upd on public.transactions for update to authenticated
  using ((select public.farm_writer()) and member_id is null
         and (reference like 'MLK-%' or reference like 'VET-%' or reference like 'FEED-%' or reference like 'FD-PUR-%'))
  with check ((select public.farm_writer()) and member_id is null
              and (reference like 'MLK-%' or reference like 'VET-%' or reference like 'FEED-%' or reference like 'FD-PUR-%'));
create policy transactions_farm_del on public.transactions for delete to authenticated
  using ((select public.farm_writer()) and member_id is null
         and (reference like 'MLK-%' or reference like 'VET-%' or reference like 'FEED-%' or reference like 'FD-PUR-%'));

-- What a member can do from their own portal (requests are cleaned by triggers above)
create policy members_self_update on public.members for update to authenticated
  using (member_id = (select public.my_member_id())) with check (member_id = (select public.my_member_id()));
create policy payment_requests_member_insert on public.payment_requests for insert to authenticated
  with check (member_id = (select public.my_member_id()) and status = 'PENDING_VERIFICATION');
create policy payment_requests_member_update on public.payment_requests for update to authenticated
  using (member_id = (select public.my_member_id()) and status = 'PENDING_VERIFICATION')
  with check (member_id = (select public.my_member_id()) and status = 'PENDING_VERIFICATION');
create policy kyc_member_insert on public.kyc_submissions for insert to authenticated
  with check (member_id = (select public.my_member_id()) and status = 'PENDING');
create policy share_conversions_member_insert on public.share_conversions for insert to authenticated
  with check (member_id = (select public.my_member_id()) and status = 'PENDING');

-- Applications: the applicant sees their own; staff with member tasks manage them
create policy member_applications_read on public.member_applications for select to authenticated
  using ((select public.is_staff()) or user_id = (select auth.uid()));
create policy member_applications_staff_insert on public.member_applications for insert to authenticated
  with check ((select public.sacco_records()));
create policy member_applications_update on public.member_applications for update to authenticated
  using ((select public.sacco_records()) or user_id = (select auth.uid()))
  with check ((select public.sacco_records()) or user_id = (select auth.uid()));
create policy member_applications_admin_delete on public.member_applications for delete to authenticated
  using ((select public.is_admin()));

-- Audit trail: everyone signed in adds entries (stamped with their real identity); Admin and Board read
create policy audit_insert on public.audit_log for insert to authenticated with check (true);
create policy audit_read on public.audit_log for select to authenticated
  using ((select public.my_role()) in ('ADMIN', 'BOARD_MEMBER'));

-- Privileges: visitors who are not signed in get no tables; nobody can empty a table through the API
revoke all on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Internal helpers cannot be called directly through the API
revoke execute on function public.link_member_by_email(uuid) from public, anon, authenticated;
revoke execute on function public.apply_directory_role(uuid) from public, anon, authenticated;
revoke execute on function public.set_profile_role(text, public.app_role, boolean) from public, anon, authenticated;
revoke all on function public.submit_membership_application(uuid, jsonb) from public;
grant execute on function public.submit_membership_application(uuid, jsonb) to anon, authenticated;

-- ════════════════════════════════════════════════════════════════════════════
--  8. REALTIME — changes reach every open portal immediately (access rules still apply)
-- ════════════════════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['profiles','members','member_applications','kyc_submissions','payment_requests','share_conversions','loans',
    'transactions','investors','dividends','period_closes','sms_messages','audit_log','staff','task_assignments','app_settings',
    'mobile_money_payments','cattle','milk_logs','cow_milk_records','health_records','breeding_records','feed_inventory']
  loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════════════
--  9. REPORT VIEWS (handy in the Supabase table editor; they follow the same access rules)
-- ════════════════════════════════════════════════════════════════════════════
create or replace view public.v_member_balances with (security_invoker = true) as
  select seq as no, member_id, name, phone, email, status, shares, savings, join_date
    from public.members order by seq;

create or replace view public.v_income_expense_by_month with (security_invoker = true) as
  select substring(tx_date from 1 for 7) as month, type, category, count(*) as entries, sum(amount) as total
    from public.transactions
   where type in ('Income', 'Expense')
   group by 1, 2, 3
   order by 1 desc, 2, 5 desc;

create or replace view public.v_loan_book with (security_invoker = true) as
  select seq as no, loan_number, member_id, data->>'memberName' as member_name, principal, interest_rate,
         principal_paid, interest_paid, outstanding_balance, status
    from public.loans order by seq;
revoke all on public.v_member_balances, public.v_income_expense_by_month, public.v_loan_book from anon;

-- ════════════════════════════════════════════════════════════════════════════
--  10. ROLES ARE SET IN SUPABASE, NEVER IN THE APP CODE — see supabase/roles.sql
-- ════════════════════════════════════════════════════════════════════════════
