-- ════════════════════════════════════════════════════════════════════════════
--  Diaspora Connect — setting up the Admin and other roles
--
--  Roles live only in your Supabase database (table `profiles`). They are not in
--  the app code or on GitHub, so nobody can read or change them from there.
--  Only people who can sign in to your Supabase dashboard can run these.
--
--  Run each block on its own in Supabase → SQL Editor. Replace the emails.
--  Every person first needs a login: Authentication → Users → Add user
--  (tick "Auto confirm user") — or Invite user, so they choose their own password.
-- ════════════════════════════════════════════════════════════════════════════


-- ── 1. Make the first Admin (do this once, for yourself) ─────────────────────
update public.profiles set role = 'ADMIN', active = true
 where email = lower('your-email@example.com');

-- Check it worked (should show ADMIN):
select email, role, active from public.profiles where email = lower('your-email@example.com');


-- ── 2. Other staff — recommended way: in the app ─────────────────────────────
--  Sign in as Admin → Settings → Task Assignments → Add staff (name, email, role).
--  When that person's login exists (or as soon as they confirm their email), the
--  role is applied automatically. Removing them there removes the role;
--  setting them inactive locks them out completely.
--  Then tick which tasks each person does on the same page.


-- ── 2b. Other staff — directly in SQL (if you prefer) ───────────────────────
--  Roles: ADMIN, ACCOUNTANT, SECRETARY, BOARD_MEMBER, FARM_WORKER, MEMBER
update public.profiles set role = 'ACCOUNTANT'   where email = lower('accountant-email@example.com');
update public.profiles set role = 'SECRETARY'    where email = lower('secretary-email@example.com');
update public.profiles set role = 'BOARD_MEMBER' where email = lower('board-email@example.com');
update public.profiles set role = 'FARM_WORKER'  where email = lower('farm-email@example.com');
--  Note: a role set only here can see that area, but can do tasks only once the
--  person is in the staff directory (step 2) or assigned the task by email.


-- ── 3. Take access away ──────────────────────────────────────────────────────
-- lock someone out completely (they can no longer sign in to any data):
update public.profiles set active = false where email = lower('person@example.com');
-- or turn a staff login back into an ordinary member login:
update public.profiles set role = 'MEMBER' where email = lower('person@example.com');
-- to stop a login altogether, also delete it in Authentication → Users.


-- ── 4. See who has which role ────────────────────────────────────────────────
select seq as no, email, full_name, role, member_id, active, created_at
  from public.profiles
 order by role, email;


-- ── 5. Link an existing member record to a login (normally automatic by email) ─
update public.profiles set member_id = 'DC-001' where email = lower('member-email@example.com');
