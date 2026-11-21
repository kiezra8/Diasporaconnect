# Deploying Diaspora Connect: Supabase + Contabo VPS

```
 Browser (portal) ──▶ Supabase Auth  (sign-in, sign-up with KYC)
        │        ──▶ Supabase Postgres + Realtime  (every SACCO & farm record, access rules, instant updates)
        │
        └──HTTPS──▶ Caddy on the VPS ──▶ NestJS API (Docker)
                     diasporaconnectt.com      api.diasporaconnectt.com
                                               ├─▶ MTN MoMo / Airtel Money (collections)
                                               ├─▶ Africa's Talking (SMS)
                                               └─▶ Anthropic (AI advisor)
```

* **Supabase** is the one database. Every record type has its own table (members, applications, KYC,
  deposits/withdrawals, share conversions, loans, transactions, dividends, month closes, SMS, audit trail,
  staff, task assignments, settings, cattle, milk, health, breeding, feeds, mobile-money payments). Each row has
  a running number (`seq`). Supabase Auth handles sign-in.
* **Access rules (Row Level Security)** decide who sees what: staff see the SACCO, a member sees only their own
  records, the Board is read-only, and members can only submit requests (never approve them).
* **Realtime**: when anyone saves a change, every open portal that is allowed to see it updates immediately.
  An approval by the Admin shows on the member's page straight away.
* Each browser also keeps its own copy of the records, so pages open instantly and work without internet.
  Changes made offline are sent as soon as the connection is back.
* **The Contabo VPS** runs Caddy (serves the portal, automatic HTTPS) and the API, which only does what
  needs secret keys: mobile money, SMS and the AI advisor. No database runs on the VPS.

---

## 1. Supabase (project `cbohtkesgaxuixbdsucw`)

1. **Create the tables:** open **SQL Editor → New query**, paste the whole of
   [`supabase/schema.sql`](../supabase/schema.sql) and press **Run**. It is safe to run again later.
2. **Email confirmation:** under **Authentication → Sign In / Providers → Email**, keep **Confirm email** on.
   So that members can type a code instead of clicking a link, open **Authentication → Email Templates →
   Confirm signup** and add this line to the template:
   ```
   Your code: {{ .Token }}
   ```
   (The link in the email also works.)
3. **Site URL:** under **Authentication → URL Configuration**, set the Site URL to `https://diasporaconnectt.com`
   and add `https://diasporaconnectt.com/signin` to the redirect URLs.
4. **First Admin:** **Authentication → Users → Add user**, enter your email and a strong password, and tick
   **Auto confirm user**. Then in the SQL Editor run:
   ```sql
   update public.profiles set role = 'ADMIN' where email = lower('your-email@example.com');
   ```
   Roles are kept only in Supabase, never in the app code. All the role commands are in
   [`supabase/roles.sql`](../supabase/roles.sql).
5. **The app starts empty.** There is no sample data. Add members (Members → Add member, or approved sign-ups),
   cattle, milk records and so on in the portal. If sample records reached the database earlier, run
   [`supabase/clear-data.sql`](../supabase/clear-data.sql) once in the SQL Editor; it empties every record table
   and keeps the logins.
6. **Other staff:** in the portal go to **Settings → Task Assignments → Add staff** and add each person with
   their role. Then create their login under **Authentication → Users → Add user** (auto confirm). The role is
   applied automatically. Assign their tasks in the same Settings page.
7. **Existing members:** create a login with the member's email (**Add user**, or **Invite user** so they
   choose their own password). It is linked to their member record automatically by email.
8. **New members** use **Sign Up** on the website. They cannot finish without completing KYC (ID, address,
   occupation, source of funds, next of kin, ID photo and a selfie holding the ID). The database itself refuses an
   application with missing KYC. The application goes to the Secretary and the Admin. Once both approve, the
   member gets the next member number (DC-001, DC-002 …), their KYC is recorded as verified, and they can sign in.
9. **Backups:** **Database → Backups**: confirm daily backups. Point-in-time recovery is recommended for
   financial data.
10. **SSL enforcement:** under **Database → Settings → SSL Configuration**, turn on **Enforce SSL on incoming
    connections**. The app is not affected: the website and the API only connect to Supabase over HTTPS, and
    refuse to start with a non-HTTPS Supabase address. Any tool you connect directly to Postgres (for example
    pgAdmin or DBeaver) must then use `sslmode=require`.

### Useful SQL

```sql
-- members with their running number, savings and shares
select * from public.v_member_balances;
-- income and expenses by month and category
select * from public.v_income_expense_by_month;
-- loan book with principal and interest repaid
select * from public.v_loan_book;
-- change someone's role
update public.profiles set role = 'ACCOUNTANT' where email = 'accountant@diasporaconnectt.com';
```

## 2. Contabo VPS

Two scripts do the work: [`deploy/setup-server.sh`](../deploy/setup-server.sh) prepares a new server once, and
[`deploy/deploy.sh`](../deploy/deploy.sh) builds and starts the app. Run `deploy.sh` again for every update.

1. **Install Ubuntu.** In the Contabo Customer Control Panel, install (or reinstall) **Ubuntu 24.04** on the VPS
   and set a root password. Add your SSH key if you have one. The IP address is shown in the panel and in
   Contabo's welcome email.
2. **Point the domain at the VPS.** Where you manage `diasporaconnectt.com`, add three **A records** with the
   VPS IPv4 address: `@`, `www` and `api`. Don't add AAAA (IPv6) records unless you've confirmed IPv6 works
   on the VPS: a broken AAAA record stops the HTTPS certificates from being issued.
3. **Prepare the server** (from your computer, in PowerShell or a terminal):
   ```bash
   ssh root@<VPS-IP>
   curl -fsSL https://raw.githubusercontent.com/kiezra8/Diasporaconnect/main/deploy/setup-server.sh -o setup-server.sh
   bash setup-server.sh
   ```
   This updates Ubuntu, adds swap, installs Docker, opens only SSH/HTTP/HTTPS in the firewall, blocks repeated
   SSH password guessing, creates a `deploy` user and downloads the app to `/opt/diaspora-connect`.
   The repository must be public for this download; for a private repository, clone it with a GitHub token.
4. **Add the secret keys:**
   ```bash
   nano /opt/diaspora-connect/backend/.env
   ```
   Fill in at least `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API → service_role). Add the
   MTN, Airtel, Africa's Talking and Anthropic keys when you have them. Save with Ctrl+O, Enter, Ctrl+X.
5. **Start the app:**
   ```bash
   su - deploy
   cd /opt/diaspora-connect && bash deploy/deploy.sh
   ```
   The website is built inside Docker, so Node.js isn't needed on the server.
6. **Check:** open `https://diasporaconnectt.com` and `https://api.diasporaconnectt.com/health`. The health page
   should say `"database":"ok"`. The first visit can take a minute while the HTTPS certificates are issued.

`SUPABASE_SERVICE_ROLE_KEY` bypasses the access rules, so it goes only in `backend/.env` on the VPS, never in
the website build or in git.

**Optional hardening**, once you can log in as `deploy` with an SSH key: set `PermitRootLogin no` and
`PasswordAuthentication no` in `/etc/ssh/sshd_config`, then run `sudo systemctl restart ssh`.

## 3. Mobile money

| Provider | Where to get keys | Callback URL to register |
|---|---|---|
| MTN MoMo (Collection) | <https://momodeveloper.mtn.com>: subscribe to **Collection**, create an API user and key. For live use, apply to MTN Uganda for production credentials. | `https://api.diasporaconnectt.com/payments/mtn/callback` |
| Airtel Money (Collection) | <https://developers.airtel.africa>: create an app with **Collection**, get the client id and secret. Go-live approval comes from Airtel Uganda. | `https://api.diasporaconnectt.com/payments/airtel/callback` |

The member chooses **Pay now** in the Deposit form and gets a PIN prompt on their phone. When the provider
confirms the payment, the API writes a deposit request into Supabase that is **already verified**, so it goes
straight to the Admin for approval. The member's page shows it immediately, and they get an SMS. Callbacks are
never trusted on their own: the API always re-checks the status with the provider.

> ⚠️ **Test in sandbox before going live.** The endpoint paths, headers and status codes in
> `backend/src/payments/providers.ts` follow the providers' published Collection APIs, but I could not open
> their documentation to confirm them. Every path can be overridden from `.env` (`MTN_TOKEN_PATH`,
> `MTN_REQUEST_TO_PAY_PATH`, `AIRTEL_TOKEN_PATH`, `AIRTEL_COLLECT_PATH`, `AIRTEL_STATUS_PATH`). Run one
> successful and one declined sandbox payment per provider before switching to live keys.

## 4. SMS: Africa's Talking

1. Create an account at <https://africastalking.com> and start with the **sandbox** app (`AT_USERNAME=sandbox`).
2. For production, top up, request an alphanumeric **sender ID** (for example `DIASPORA`), and set
   `AT_USERNAME`, `AT_API_KEY` and `AT_SENDER_ID`.
3. Choose which events send SMS under **Settings → SMS Alerts**. Every message is stored in `sms_messages`.

> ⚠️ The default endpoint is `https://api.africastalking.com/version1/messaging` (override with `AT_SMS_URL`).
> Send a test from the sandbox simulator to confirm it.

## 5. Production checklist

The full security list (every attack, what stops it, and the settings only you can switch on) is in
[`docs/SECURITY.md`](SECURITY.md).

- [ ] `supabase/schema.sql` has been run, and the first Admin's role is set.
- [ ] **Confirm email** is on, and the signup template includes `{{ .Token }}`.
- [ ] **Enforce SSL** is on in Supabase (§1.10).
- [ ] Every staff member has their own login and a role in the staff directory.
- [ ] Supabase backups are on.
- [ ] MTN, Airtel and SMS have been tested in sandbox, and the callback URLs are registered.
- [ ] `backend/.env` (service-role key) is never committed. It is in `.gitignore`.
- [ ] An uptime monitor watches `https://api.diasporaconnectt.com/health`.

## Updating

After pushing new code to GitHub:

```bash
ssh deploy@<VPS-IP>
cd /opt/diaspora-connect && bash deploy/deploy.sh
# database changes: paste the updated supabase/schema.sql into the Supabase SQL Editor and run it
```

Logs: `docker compose -f docker/docker-compose.yml logs -f`
