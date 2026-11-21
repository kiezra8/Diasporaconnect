# Email codes: what to put where

Members get a **6-digit code by email** when they sign up and when they reset a password. Supabase sends
these automatically. You only need to set it up once, in this order.

**Your domain today (checked 21 Nov 2026):** no SPF, no DKIM, no DMARC and no MX record for
`diasporaconnectt.com`. So right now emails from the SACCO would go to spam, anyone could fake them,
and `info@diasporaconnectt.com` cannot receive mail. Steps 1 and 2 fix that.

---

## Step 1: an email sending service

Supabase's built-in mailer only delivers to your own team's addresses, a few an hour. Members would get
nothing. Create a free account with **one** of these and add the domain `diasporaconnectt.com`:

| Service | SMTP host | Port | Username | Password |
|---|---|---|---|---|
| **Resend** (simplest) | `smtp.resend.com` | `465` | `resend` | your Resend API key |
| **Brevo** | `smtp-relay.brevo.com` | `587` | your Brevo login email | your Brevo SMTP key |
| **ZeptoMail** (Zoho) | `smtp.zeptomail.com` | `587` | `emailapikey` | your ZeptoMail token |

The service then shows you DNS records to add: that's step 2. Check the values on the service's own SMTP
page; they are the source of truth.

## Step 2: DNS records in Cloudflare

Cloudflare → `diasporaconnectt.com` → **DNS → Records → Add record**. Copy the exact values your sending
service shows. The shape is:

| What | Type | Name | Content | Proxy |
|---|---|---|---|---|
| **SPF**: who may send as you | TXT | `@` (or what the service says, e.g. `send`) | `v=spf1 include:<service domain> ~all` | — |
| **DKIM**: proves emails are genuine | TXT or CNAME | e.g. `resend._domainkey` | copied from the service | **DNS only** (grey cloud) |
| **DMARC**: tells others to reject fakes | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@diasporaconnectt.com; adkim=s; aspf=s` | — |

Rules:
- Only **one** SPF record per name. If you also do step 6, combine both into one:
  `v=spf1 include:_spf.mx.cloudflare.net include:<service domain> ~all`
- Press **Verify** in the sending service. It turns green when the records are found (minutes, sometimes an hour).
- After 2 weeks of normal sending, change DMARC `p=none` to `p=quarantine`, later to `p=reject`.

## Step 3: Supabase → Authentication → Emails → **SMTP Settings**

Turn on **Enable custom SMTP** and fill in:

| Field | Put |
|---|---|
| Sender email | `no-reply@diasporaconnectt.com` |
| Sender name | `Diaspora Connect SACCO` |
| Host / Port / Username / Password | from the table in step 1 |
| Minimum interval between emails | `60` seconds (default) |

Save.

## Step 4: Supabase → Authentication → Emails → **Templates**

The ready-made messages are in this repository. Open each template, set the subject, then paste the whole
file (below its top comment) into **Message body**:

| Template | Subject | Message body |
|---|---|---|
| **Confirm signup** | `Your Diaspora Connect code: {{ .Token }}` | [`supabase/email-templates/confirm-signup.html`](../supabase/email-templates/confirm-signup.html) |
| **Reset Password** | `Your Diaspora Connect reset code: {{ .Token }}` | [`supabase/email-templates/reset-password.html`](../supabase/email-templates/reset-password.html) |

Leave **Magic Link** and **Invite user** as they are; the app doesn't use them.

`{{ .Token }}` is the 6-digit code; `{{ .ConfirmationURL }}` is the one-tap link. Keep both exactly as written.

## Step 5: the remaining Supabase settings

| Where | Setting | Put |
|---|---|---|
| Authentication → Sign In / Providers → **Email** | Confirm email | **On** |
| same page | Email OTP length | **6** (the app's code boxes expect 6 digits) |
| same page | Email OTP expiration | `3600` (1 hour) |
| same page | Minimum password length | `10`, and require letters and digits |
| Authentication → **URL Configuration** | Site URL | `https://diasporaconnectt.com` |
| same page | Redirect URLs | `https://diasporaconnectt.com/signin` and `https://diasporaconnectt.com/reset-password` (add `http://localhost:5173/**` while testing) |
| Authentication → **Rate Limits** | Emails sent per hour | raise to what your sending service allows (e.g. `100`+) |

## Step 6 (optional): receive mail at info@diasporaconnectt.com

Cloudflare → **Email → Email Routing** (free) → forward `info@diasporaconnectt.com` to your Gmail.
Cloudflare adds the MX records itself. Merge its SPF into your one SPF record (see step 2).

---

## Test it (5 minutes)

1. Sign up on the website with your own personal email. A code should arrive within a minute. Type it in.
2. On the sign-in page, tap **Forgot password?**, enter that email, type in the code, and set a new password.
3. In Gmail, open one of the emails → ⋮ → **Show original**. It should say **SPF: PASS, DKIM: PASS, DMARC: PASS**.

If no email arrives: check spam; check Supabase → **Logs → Auth** for the error; check that the sending
service shows the domain as verified.

## Passwords: all handled by Supabase

Supabase creates every code, emails it, checks it and saves the new password. The app only shows the
boxes to type into. Nothing is sent by our own server.

- **Someone forgot their password:** sign-in page → **Forgot password?** → Supabase emails a code → they
  choose a new password. Staff also enter their two-step code.
- **You want to send someone a reset:** Supabase → Authentication → Users → open the person →
  **Send password recovery**. They get the same code email.
- **New staff logins:** Supabase → Authentication → Users → **Add user** (tick Auto confirm, any long
  temporary password), then ask them to use **Forgot password?** to set their own.
