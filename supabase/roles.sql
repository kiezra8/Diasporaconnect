-- ════════════════════════════════════════════════════════════════════════════
--  Diaspora Connect — make yourself Admin (and manage other roles)
--
--  Roles live only in your Supabase database, never in the app code.
--
--  HOW TO USE
--   1. Supabase → SQL Editor → New query → paste this whole file.
--   2. In the block below, replace  PUT-YOUR-EMAIL-HERE  with the email you sign in with
--      (in both places), and your name.
--   3. Press Run. You should see a table with your email and role ADMIN.
--   4. On the website: sign out, sign in again. You will be asked to set up two-step login.
--
--  Running this file again is safe. Everything below block 1 is commented out (starts
--  with --) so nothing else happens by accident.
-- ════════════════════════════════════════════════════════════════════════════


-- ── 1. MAKE ME ADMIN ─────────────────────────────────────────────────────────
do $$
declare
  admin_email text := 'PUT-YOUR-EMAIL-HERE';   -- ← the email you sign in with
  admin_name  text := 'Your Name';             -- ← your name
  uid uuid;
begin
  admin_email := lower(trim(admin_email));
  if admin_email = 'put-your-email-here' or admin_email not like '%@%' then
    raise exception 'Put your own email in the line admin_email := ... first.';
  end if;

  select id into uid from auth.users where lower(email) = admin_email;
  if uid is null then
    raise exception 'There is no login for %. Create it first: Authentication → Users → Add user (tick "Auto confirm user"). Then run this again.', admin_email;
  end if;

  -- the email counts as confirmed (the Admin login is created by you in Supabase)
  begin
    update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()) where id = uid;
  exception when others then
    raise notice 'Could not mark the email as confirmed (%). Confirm it under Authentication → Users if sign-in asks for a code.', sqlerrm;
  end;

  -- the login's profile (created now if the login existed before schema.sql was run)
  insert into public.profiles (id, email, full_name, role)
  values (uid, admin_email, admin_name, 'ADMIN')
  on conflict (id) do nothing;

  -- staff directory entry, so the role sticks and you appear in Task Assignments
  insert into public.staff (id, data)
  values ('STF-ADMIN-' || left(md5(admin_email), 8), jsonb_build_object('id', 'STF-ADMIN-' || left(md5(admin_email), 8), 'email', admin_email, 'name', admin_name, 'role', 'ADMIN', 'active', true))
  on conflict (id) do update set data = excluded.data;

  -- Admin, active, no KYC needed, not tied to a half-finished sign-up
  update public.profiles
     set role = 'ADMIN', active = true, kyc_exempt = true, email = admin_email,
         full_name = coalesce(nullif(full_name, ''), admin_name)
   where id = uid;
end $$;

-- Check: your email should appear here with role ADMIN and active true
select email, full_name, role, active, kyc_exempt from public.profiles where role = 'ADMIN';


-- ════════════════════════════════════════════════════════════════════════════
--  EVERYTHING BELOW IS OPTIONAL. Remove the "-- " at the start of a line to use it,
--  run just that line, then put the "-- " back.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 2. Other staff (recommended: in the app) ───────────────────────────────
--  Sign in as Admin → Settings → Task Assignments → Add staff (name, email, role).
--  Then create their login: Authentication → Users → Add user (tick Auto confirm,
--  any long temporary password) and ask them to use "Forgot password?" to set their own.
--  The role is applied automatically. Roles: ACCOUNTANT, SECRETARY, BOARD_MEMBER,
--  FARM_WORKER, ADMIN. The Board can have as many members as you like.

-- ── 3. Take access away ─────────────────────────────────────────────────────
-- update public.profiles set active = false  where email = lower('person@example.com');   -- lock out
-- update public.profiles set role = 'MEMBER' where email = lower('person@example.com');   -- staff → member
--  (or remove/deactivate them in Settings → Task Assignments)

-- ── 4. No KYC for someone (only possible here, never from the app) ─────────
-- update public.profiles set kyc_exempt = true  where email = lower('person@example.com');
-- update public.profiles set kyc_exempt = false where email = lower('person@example.com');

-- ── 5. Two-step login ───────────────────────────────────────────────────────
--  Lost phone: Authentication → Users → open the person → delete their MFA factor.
--  They set it up again at their next sign-in.

-- ── 6. See everyone's role ──────────────────────────────────────────────────
-- select seq as no, email, full_name, role, member_id, active, kyc_exempt from public.profiles order by role, email;

-- ── 7. Link a member record to a login (normally automatic by email) ───────
-- update public.profiles set member_id = 'DC-001' where email = lower('member@example.com');
