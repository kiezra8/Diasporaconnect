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

-- Helpers used by the access rules (security definer so they can read profiles)
create or replace function public.my_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.my_member_id() returns text
language sql stable security definer set search_path = public as $$
  select member_id from public.profiles where id = auth.uid() and active
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role <> 'MEMBER' from public.profiles where id = auth.uid() and active), false)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'ADMIN' from public.profiles where id = auth.uid() and active), false)
$$;

-- Staff who may change SACCO / farm records (the Board is read-only)
create or replace function public.can_write() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('ADMIN', 'ACCOUNTANT', 'SECRETARY', 'FARM_WORKER') from public.profiles where id = auth.uid() and active), false)
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
--  4. TRIGGERS
-- ════════════════════════════════════════════════════════════════════════════

-- Stamp who changed a row and when
create or replace function public.touch_row() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['members','member_applications','kyc_submissions','payment_requests','share_conversions','loans',
    'transactions','investors','dividends','period_closes','sms_messages','staff','task_assignments','app_settings',
    'cattle','milk_logs','cow_milk_records','health_records','breeding_records','feed_inventory','mobile_money_payments','profiles']
  loop
    execute format('drop trigger if exists touch_%1$s on public.%1$I', t);
    if t in ('mobile_money_payments', 'profiles') then
      execute format('create trigger touch_%1$s before update on public.%1$I for each row execute function public.touch_updated_at()', t);
    else
      execute format('create trigger touch_%1$s before update on public.%1$I for each row execute function public.touch_row()', t);
    end if;
  end loop;
end $$;

-- Members may change only their own contact details and photo
create or replace function public.guard_member_self_edit() returns trigger
language plpgsql as $$
begin
  if public.can_write() or coalesce(current_setting('app.bypass_guard', true), '') = 'on' or auth.uid() is null then
    return new;
  end if;
  new.data := old.data || jsonb_strip_nulls(jsonb_build_object(
    'name', new.data->'name', 'phone', new.data->'phone', 'email', new.data->'email', 'avatar', new.data->'avatar'));
  return new;
end $$;
drop trigger if exists guard_member_self_edit on public.members;
create trigger guard_member_self_edit before update on public.members
  for each row execute function public.guard_member_self_edit();

-- Applicants may change only their contact details and photo, never the status or approvals
create or replace function public.guard_application_self_edit() returns trigger
language plpgsql as $$
begin
  new.user_id := coalesce(old.user_id, new.user_id);
  if public.can_write() or coalesce(current_setting('app.bypass_guard', true), '') = 'on' or auth.uid() is null then
    return new;
  end if;
  new.data := old.data || jsonb_strip_nulls(jsonb_build_object(
    'fullName', new.data->'fullName', 'phone', new.data->'phone', 'email', new.data->'email', 'photoUrl', new.data->'photoUrl'));
  return new;
end $$;
drop trigger if exists guard_application_self_edit on public.member_applications;
create trigger guard_application_self_edit before update on public.member_applications
  for each row execute function public.guard_application_self_edit();

-- Only the Admin can change roles, member links, emails or deactivate a login
create or replace function public.guard_profile_edit() returns trigger
language plpgsql as $$
begin
  if public.is_admin() or coalesce(current_setting('app.bypass_guard', true), '') = 'on' or auth.uid() is null then
    return new;
  end if;
  new.role := old.role;
  new.member_id := old.member_id;
  new.active := old.active;
  new.email := old.email;
  return new;
end $$;
drop trigger if exists guard_profile_edit on public.profiles;
create trigger guard_profile_edit before update on public.profiles
  for each row execute function public.guard_profile_edit();

-- The audit trail can never be edited or deleted
create or replace function public.audit_is_append_only() returns trigger
language plpgsql as $$
begin
  raise exception 'The audit trail is append-only';
end $$;
drop trigger if exists audit_append_only on public.audit_log;
create trigger audit_append_only before update or delete on public.audit_log
  for each row execute function public.audit_is_append_only();

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

-- New login → profile. Emails listed in the staff directory get their staff role.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare r text;
begin
  select role into r from public.staff where email = lower(new.email) and coalesce(active, true) order by seq limit 1;
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id, lower(new.email),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    case when r in ('ADMIN','ACCOUNTANT','SECRETARY','BOARD_MEMBER','FARM_WORKER') then r::public.app_role else 'MEMBER'::public.app_role end
  )
  on conflict (id) do nothing;
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
    perform public.link_member_by_email(new.id);
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed after update of email_confirmed_at on auth.users
  for each row execute function public.handle_user_confirmed();

-- Admin adds / edits staff in Settings → their login gets that role
create or replace function public.apply_staff_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role in ('ADMIN','ACCOUNTANT','SECRETARY','BOARD_MEMBER','FARM_WORKER') then
    perform set_config('app.bypass_guard', 'on', true);
    update public.profiles
       set role = new.role::public.app_role,
           active = coalesce(new.active, true),
           full_name = coalesce(nullif(full_name, ''), new.name)
     where email = new.email;
    perform set_config('app.bypass_guard', 'off', true);
  end if;
  return new;
end $$;
drop trigger if exists apply_staff_role on public.staff;
create trigger apply_staff_role after insert or update on public.staff
  for each row execute function public.apply_staff_role();

-- A member record whose email matches a confirmed login is linked to it
create or replace function public.link_new_member() returns trigger
language plpgsql security definer set search_path = public as $$
begin
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
--  5. SIGN-UP: an application is only accepted with complete KYC
-- ════════════════════════════════════════════════════════════════════════════
create or replace function public.submit_membership_application(p_user_id uuid, p_application jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  u record;
  k jsonb := coalesce(p_application->'kyc', '{}'::jsonb);
  missing text;
  app_id text;
begin
  select id, email, created_at into u from auth.users where id = p_user_id;
  if not found then raise exception 'Account not found'; end if;
  -- allowed right after sign-up (before the email is confirmed) or by the signed-in applicant
  if auth.uid() is distinct from p_user_id and u.created_at < now() - interval '2 hours' then
    raise exception 'Sign in to complete your application';
  end if;
  if lower(coalesce(p_application->>'email', '')) <> lower(u.email) then
    raise exception 'The application email does not match the account';
  end if;
  if exists (select 1 from public.member_applications where user_id = p_user_id and status <> 'REJECTED') then
    raise exception 'An application already exists for this account';
  end if;

  select string_agg(f, ', ') into missing
    from unnest(array['fullName','phone','dob','gender']) f
   where coalesce(trim(p_application->>f), '') = '';
  if missing is not null then raise exception 'Missing personal details: %', missing; end if;

  select string_agg(f, ', ') into missing
    from unnest(array['idType','idNumber','dateOfBirth','nationality','countryOfResidence','address','occupation',
                      'sourceOfFunds','nextOfKinName','nextOfKinRelationship','nextOfKinPhone','idFrontImage','selfieImage']) f
   where coalesce(trim(k->>f), '') = '';
  if missing is not null then raise exception 'KYC incomplete: %', missing; end if;

  app_id := 'REG-' || lpad(nextval('public.member_application_no')::text, 4, '0');
  insert into public.member_applications (id, user_id, data)
  values (app_id, p_user_id,
          (p_application - 'password') || jsonb_build_object(
            'id', app_id, 'email', lower(u.email), 'status', 'PENDING_APPROVAL',
            'secretaryApproved', false, 'adminApproved', false, 'memberId', null,
            'userId', p_user_id, 'submittedAt', to_char(now(), 'YYYY-MM-DD')));
  return app_id;
end $$;
revoke all on function public.submit_membership_application(uuid, jsonb) from public;
grant execute on function public.submit_membership_application(uuid, jsonb) to anon, authenticated;

-- ════════════════════════════════════════════════════════════════════════════
--  6. ACCESS RULES (Row Level Security)
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

-- Profiles
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

do $$
declare t text;
begin
  -- a member sees only their own rows; staff see everything
  foreach t in array array['members','kyc_submissions','payment_requests','share_conversions','loans','transactions','investors','mobile_money_payments']
  loop
    execute format('create policy %1$s_read on public.%1$I for select to authenticated using (public.is_staff() or member_id = public.my_member_id())', t);
  end loop;
  -- staff (not the Board) add, change and remove records
  foreach t in array array['members','kyc_submissions','payment_requests','share_conversions','loans','transactions','investors',
    'dividends','period_closes','sms_messages','cattle','milk_logs','cow_milk_records','health_records','breeding_records','feed_inventory']
  loop
    execute format('create policy %1$s_staff_insert on public.%1$I for insert to authenticated with check (public.can_write())', t);
    execute format('create policy %1$s_staff_update on public.%1$I for update to authenticated using (public.can_write()) with check (public.can_write())', t);
    execute format('create policy %1$s_staff_delete on public.%1$I for delete to authenticated using (public.can_write())', t);
  end loop;
  -- staff-only reading
  foreach t in array array['dividends','period_closes','sms_messages']
  loop
    execute format('create policy %1$s_read on public.%1$I for select to authenticated using (public.is_staff())', t);
  end loop;
  -- farm records: every signed-in user can read
  foreach t in array array['cattle','milk_logs','cow_milk_records','health_records','breeding_records','feed_inventory']
  loop
    execute format('create policy %1$s_read on public.%1$I for select to authenticated using (true)', t);
  end loop;
  -- reference data: everyone signed in reads, only the Admin changes
  foreach t in array array['staff','task_assignments','app_settings']
  loop
    execute format('create policy %1$s_read on public.%1$I for select to authenticated using (true)', t);
    execute format('create policy %1$s_admin_insert on public.%1$I for insert to authenticated with check (public.is_admin())', t);
    execute format('create policy %1$s_admin_update on public.%1$I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy %1$s_admin_delete on public.%1$I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

-- What a member can do from their own portal
create policy members_self_update on public.members for update to authenticated
  using (member_id = public.my_member_id()) with check (member_id = public.my_member_id());

create policy payment_requests_member_insert on public.payment_requests for insert to authenticated
  with check (member_id = public.my_member_id() and status = 'PENDING_VERIFICATION'
              and data->>'verifiedBy' is null and data->>'approvedBy' is null);
create policy payment_requests_member_update on public.payment_requests for update to authenticated
  using (member_id = public.my_member_id() and status = 'PENDING_VERIFICATION')
  with check (member_id = public.my_member_id() and status = 'PENDING_VERIFICATION'
              and data->>'verifiedBy' is null and data->>'approvedBy' is null);

create policy kyc_member_insert on public.kyc_submissions for insert to authenticated
  with check (member_id = public.my_member_id() and status = 'PENDING' and data->>'reviewedBy' is null);

create policy share_conversions_member_insert on public.share_conversions for insert to authenticated
  with check (member_id = public.my_member_id() and status = 'PENDING'
              and coalesce(public.jbool(data->>'accountantApproved'), false) = false
              and coalesce(public.jbool(data->>'adminApproved'), false) = false);

-- Applications: the applicant sees and edits their own (contact details only); staff manage them
create policy member_applications_read on public.member_applications for select to authenticated
  using (public.is_staff() or user_id = auth.uid());
create policy member_applications_staff_insert on public.member_applications for insert to authenticated
  with check (public.can_write());
create policy member_applications_update on public.member_applications for update to authenticated
  using (public.can_write() or user_id = auth.uid()) with check (public.can_write() or user_id = auth.uid());
create policy member_applications_admin_delete on public.member_applications for delete to authenticated
  using (public.is_admin());

-- Audit trail: everyone signed in adds entries; Admin and Board read; nobody edits
create policy audit_insert on public.audit_log for insert to authenticated with check (true);
create policy audit_read on public.audit_log for select to authenticated
  using (public.my_role() in ('ADMIN', 'BOARD_MEMBER'));

-- Visitors who are not signed in get nothing (they can only call the sign-up function)
revoke all on all tables in schema public from anon;
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
--  7. REALTIME — changes reach every open portal immediately
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
--  8. REPORT VIEWS (handy in the Supabase table editor; they follow the same access rules)
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

-- ════════════════════════════════════════════════════════════════════════════
--  9. FIRST ADMIN — create your own login (Authentication → Users → Add user,
--     tick "Auto confirm"), then run once with that email:
--
--     update public.profiles set role = 'ADMIN' where email = 'admin@diasporaconnectt.com';
--
--  Other staff: the staff directory (Settings → Task Assignments → Add staff) decides
--  their role. Create their login under Authentication → Users and the role is applied
--  automatically. Existing members: create a login with the member's email and it is
--  linked to their member record automatically.
-- ════════════════════════════════════════════════════════════════════════════
