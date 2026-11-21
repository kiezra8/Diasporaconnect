# Diaspora Connect: how the system could be attacked, and what protects it

No system can be made impossible to hack. The aim is that every way in is closed, so one mistake (a
leaked password, a trick in a form) cannot cost members money or expose their data, and anything that
does happen is recorded. Below is each way an attacker could try, what now stops it, and what you must
still do yourself. The access rules were tested with 124 automated checks, run both on a fresh install
and on an upgrade over the previous version (see "Checks").

---

## Where the protection is

The website runs in the visitor's browser, and anyone can change what runs there. **So no rule that
matters lives only in the website.** The real rules are in the Supabase database
([`supabase/schema.sql`](../supabase/schema.sql)). They run on every read and every save, whoever
sends it and however they send it.

| Layer | What it protects |
|---|---|
| Supabase database rules (Row Level Security + triggers) | Who can read or change every record, the approval steps, the audit trail |
| Supabase Auth | Passwords, email confirmation, sessions |
| API on the VPS (NestJS) | Mobile money, SMS and the AI advisor, plus the secret keys for them |
| Caddy web server | HTTPS, security headers, which scripts may run in the browser |
| VPS (Contabo) | Firewall, SSH, updates, containers |

---

## 1. Becoming Admin (or any staff role) without permission

| How they would try | What stops it |
|---|---|
| Look in the code or on GitHub for admin emails and passwords | **None exist any more.** The demo accounts, demo passwords, the hard-coded staff list and the "PIN 8888" override are all removed. Roles live only in the Supabase `profiles` table. |
| Edit the role saved in their browser (`localStorage`) to `ADMIN` | Each time the app opens, it re-reads the role from the database and corrects the browser. Every save is checked again in the database, so a fake role gets them nothing. |
| Change their own role through the database API | Only an Admin can change `role`, `member_id`, `active` or `email`. The database silently keeps the old values for anyone else. |
| Add themselves to the staff directory | Only an Admin can write the staff directory. |
| Sign up using a staff email they don't own (for example the accountant's) | Staff roles are applied **only after the email address is confirmed**, so they would need the real mailbox. |
| Call the database's internal helper functions directly | Those functions are locked; only the database itself can run them. |
| Lock out the real Admin | An Admin cannot remove their own Admin access, and the system refuses any change that would leave no active Admin. |

## 2. Stealing a staff password (phishing, a reused password, guessing)

This is the most likely real-world attack.

| How they would try | What stops it |
|---|---|
| Guess passwords | Supabase limits sign-in attempts. New passwords must be at least 10 characters, with letters and numbers. **You must also set the minimum in Supabase** (see "Your checklist"). |
| Use a stolen password to steal money | Separation of duties is enforced **in the database**. A deposit or withdrawal must be verified by the person holding "Verify member payments" and only then approved by the holder of "Approve member payments". A share conversion needs the Accountant check and the Admin approval. A new member needs the Secretary and the Admin. Only the Admin can reopen a closed month. Dividends need the "dividends" task. So one stolen staff login cannot both create and approve a payment. |
| Use a stolen login quietly | Every change is written to the audit trail, stamped by the database with the **real** user (not what the browser claims). The trail cannot be edited or deleted, even by the database owner. |
| Keep using a login after the person leaves | Set them inactive or remove them in Settings → Task Assignments. Their access ends straight away. |
| Read data left on a shared computer | On sign-out, the copy of SACCO records kept in the browser is erased. Only changes not yet saved are kept, until they are sent. |

**Remaining risk:** someone who steals the *Admin* password has Admin powers. Protect that account
best: use a long unique password and two-step login on your email (and, recommended, see "Next step").

## 3. A member (or anyone who signs up) reaching other people's data or money

| How they would try | What stops it |
|---|---|
| Read other members' savings, loans, KYC or transactions | A member sees only rows with their own member number. Someone who signed up but isn't approved yet sees nothing at all: no staff list, no farm, no settings. |
| Give themselves savings or shares | A member can change only their own name, phone, email and photo. Money fields are kept as they were. |
| Submit an "already approved" deposit, or one in someone else's name | The database rewrites what members submit: their own member number and real name, status "pending", approval fields removed. Amounts must be above zero. |
| Self-verify their KYC | It is saved as pending and the reviewer field is removed. |
| Approve their own membership application | Applicants can change only their contact details; the Secretary and Admin approvals are refused. |
| Sign up without KYC | The database refuses an application unless every KYC item is present, and the ID photo and selfie must be real images. |
| File an application for someone else's account | Before signing in, only a brand-new, unconfirmed account can apply, and never one that is already a member or staff. |
| Forge audit entries ("approved by Admin") | Every audit entry is stamped by the database with the user who really sent it. |
| Send mobile-money PIN prompts to other people's phones | A member can only send a prompt to the phone number registered on their own account. |

## 4. Hidden code typed into forms (cross-site scripting)

The attack: a member puts something like `<img onerror=…>` in their name or a note. When the Admin
prints a report, it would run with the Admin's access.

| What stops it | |
|---|---|
| The database removes `<` and `>` from everything saved, so HTML can't be stored at all | `stamp_and_clean` trigger |
| The website shows text as text (React) | built in |
| The web server's Content-Security-Policy lets the browser run **only the site's own scripts**, and talk only to Supabase and the API. Report windows follow the same policy. | `docker/Caddyfile` |
| The KYC viewer only shows real JPEG/PNG/WebP images | `ApplicationKycSummary.tsx` |
| The site cannot be shown inside another site (stops clickjacking) | `X-Frame-Options: DENY`, `frame-ancestors 'none'` |

## 5. Reaching the database or the secret keys directly

| How they would try | What stops it |
|---|---|
| Use the public "anon" key in the website | That key is public by design. It can do nothing beyond the access rules: a visitor who isn't signed in can read no tables, and can only call the sign-up function. |
| Find the `service_role` key, or the MTN, Airtel, SMS or AI keys | They live only in `backend/.env` on the VPS, which git ignores. They are never in the website or on GitHub. |
| Connect straight to Postgres | Turn on **Enforce SSL** and **Network Restrictions** in Supabase (checklist). The app never connects straight to Postgres, so blocking it changes nothing for the app. |
| Empty a whole table through the API | `TRUNCATE` is revoked for app users. |
| Intercept traffic | HTTPS everywhere (HSTS). The app refuses to start with a non-HTTPS Supabase address. |

## 6. Attacking the API server (mobile money, SMS, AI)

| How they would try | What stops it |
|---|---|
| Call it without signing in | Every endpoint except the provider callbacks checks the Supabase sign-in, then reads the user's role from the database. |
| Fake a "payment successful" callback | Callbacks are never trusted on their own. The API always asks MTN or Airtel for the real status, and a payment is recorded only once. |
| Flood it | Rate limits per IP: 60 requests a minute in general; 5 a minute to start a payment; 30 SMS a minute; 10 AI requests a minute. Requests over 2 MB are refused, and Caddy refuses anything over 3 MB first. |
| Text strangers at the SACCO's cost | SMS can only go to members' registered numbers, and only from Admin, Accountant or Secretary logins. |
| Use known bugs in the server's libraries | NestJS was upgraded to version 11. Both the website and the API currently report **0 known vulnerabilities** (`npm audit`). |
| Call it from another website | CORS allows only your own website. |
| Break out of the server program | The API runs as an unprivileged user in a read-only container with no extra Linux privileges, and it isn't reachable from the internet except through Caddy. |

## 7. Attacking the VPS (Contabo)

| How they would try | What stops it |
|---|---|
| Open ports | The firewall allows only SSH, HTTP and HTTPS. The API port isn't published. |
| Guess the SSH password | fail2ban blocks repeated failures. When you've installed an SSH key, `setup-server.sh` turns password login off. |
| Use old, vulnerable software | Automatic security updates are on. |

## 8. Supply chain (bad packages, a stolen GitHub account)

| Risk | What was done |
|---|---|
| Unknown packages | Removed `g` and `@anthropic-ai/claude-code` from the website's packages. Neither was used, and their install scripts would have run on your server. |
| Someone pushes bad code to your GitHub | Turn on two-step login for GitHub. Only you should have write access. |
| Old demo passwords in the git history | Earlier versions contained demo passwords such as `88888888` and `Admin@2026`. They no longer work anywhere in the app. **Never use them, or anything like them, as a real password.** |

---

## Your checklist (things only you can switch on)

In **Supabase**:
- [ ] Run the new `supabase/schema.sql` (replaces the old rules; safe to re-run).
- [ ] Authentication → Sign In / Providers → Email: **Confirm email ON**, minimum password length **10**, require letters and digits. Turn on **leaked-password protection** if your plan has it.
- [ ] Authentication → Sign In / Providers: turn **off** anonymous sign-ins and every provider you don't use.
- [ ] Authentication → URL Configuration: Site URL `https://diasporaconnectt.com`; redirect URLs only your own domain.
- [ ] Authentication → Attack Protection: turn on **CAPTCHA** (hCaptcha or Cloudflare Turnstile). Tell me the site key and I'll add it to the sign-up form.
- [ ] Database → Settings: **Enforce SSL** ON; **Network Restrictions**: allow no outside addresses (the app doesn't need direct database access).
- [ ] Database → Backups: daily backups on; point-in-time recovery recommended.
- [ ] Your Supabase account: **two-step login (MFA)** on. Anyone in your Supabase dashboard controls everything.

Elsewhere:
- [ ] Two-step login on your GitHub account and on the email account you use for Supabase.
- [ ] On the VPS: install your SSH key, then re-run `setup-server.sh` so password logins turn off.
- [ ] Give each staff member their own login. Never share one login.
- [ ] Check the audit trail (Settings → Audit Trail) every week.

## Next step I recommend

**Two-step login (MFA) for staff.** Supabase supports authenticator-app codes. With it, a stolen staff
password alone is not enough to sign in, and the database can require two-step login for every money
action. It needs a new screen in the app to set it up, so I haven't switched it on yet. Say the word and
I'll build it.

---

## Checks

- **Database access rules:** 124 automated checks, run in a local copy of Postgres. They cover each attack in sections 1 to 5 with a stranger, a member, an applicant, and accountant, secretary, farm worker, Board and Admin logins. They pass on a fresh install, on a second run of the file, and on an upgrade over the previous version. They don't replace a test against your real Supabase project.
- **API:** started locally; checked that requests without a valid sign-in are refused, security headers are sent, and rate limits apply.
- **Both apps** build, and `npm audit` reports 0 known vulnerabilities in what runs in production.
- **Web server config:** I couldn't check the Caddy file on this computer, so `deploy.sh` now checks it on the server before restarting anything.

## How roles are set up (never in the code)

See [`supabase/roles.sql`](../supabase/roles.sql). In short:
1. Create your login in Supabase (Authentication → Users → Add user, auto confirm).
2. In the SQL Editor: `update public.profiles set role = 'ADMIN' where email = lower('your-email');`
3. Everyone else: sign in as Admin, then Settings → Task Assignments → Add staff (email and role), then create their login in Supabase. Their role is applied automatically once their email is confirmed. Removing them there removes their access.
