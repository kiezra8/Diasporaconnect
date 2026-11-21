# Email for diasporaconnectt.com: SPF, DKIM, DMARC

## What the domain has today (checked 21 Nov 2026)

| Record | Status | What it means |
|---|---|---|
| **SPF** (`v=spf1 …` TXT on `diasporaconnectt.com`) | ❌ missing | Nothing says which servers may send mail as `@diasporaconnectt.com`. Anyone can pretend to be you. |
| **DKIM** (`…._domainkey` TXT/CNAME) | ❌ none found | Mail from you can't be proved genuine, so it tends to land in spam. |
| **DMARC** (`_dmarc` TXT) | ❌ missing | Receivers have no instruction to reject fake mail claiming to be from you. |
| **MX** (where mail is received) | ❌ missing | `info@diasporaconnectt.com` (shown on the Contact page) **cannot receive email** at the moment. |

The DNS is managed in **Cloudflare**, so all the records below are added in Cloudflare → your domain → **DNS → Records**.

## Why this matters for the app

Sign-up confirmation codes, invitations and password resets are sent by **Supabase Auth**. Supabase's
built-in mailer is only for testing: it sends very few emails an hour, and only to your own team's
addresses. **Members would not receive their sign-up codes.** So before launch, connect your own
sending service using your domain. Then SPF, DKIM and DMARC make those emails trusted.

## Step 1: choose a sending service

Any of these works with Supabase (Authentication → Emails → **SMTP Settings**): **Resend**, **Brevo**,
**ZeptoMail (Zoho)** or **Amazon SES**. Add the domain `diasporaconnectt.com` in that service. It then shows
you the exact SPF and DKIM values to copy into Cloudflare.

## Step 2: add the records in Cloudflare

| Type | Name | Value | Notes |
|---|---|---|---|
| TXT | `@` | `v=spf1 include:<your provider's SPF domain> ~all` | **Only one SPF record per name.** If you also use Cloudflare Email Routing (step 4), combine both: `v=spf1 include:_spf.mx.cloudflare.net include:<provider> ~all`. Some providers (e.g. Resend) ask for SPF on a sub-domain such as `send`; follow what they show. |
| TXT or CNAME | `<selector>._domainkey` | copied exactly from the provider | Usually 1 to 3 records. Set Cloudflare's proxy to **DNS only** (grey cloud) for CNAMEs. |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@diasporaconnectt.com; adkim=s; aspf=s; pct=100` | Start with `p=none` (report only). |

After 2 weeks with no problems, change DMARC to `p=quarantine`, and later to `p=reject`, so fake
"Diaspora Connect" emails are blocked.

## Step 3: connect Supabase

Supabase → Authentication → Emails → **SMTP Settings** → enable custom SMTP:
- Sender email: `no-reply@diasporaconnectt.com`, sender name: `Diaspora Connect SACCO`
- Host, port (465 or 587), username and password: from your sending service
- Then Authentication → **Rate Limits**: raise "emails sent per hour" to what your provider allows.

Send yourself a sign-up test, open the email, and use "Show original" (Gmail). It should say
**SPF: PASS, DKIM: PASS, DMARC: PASS**.

## Step 4 (optional): receive mail at info@diasporaconnectt.com

Cloudflare → **Email → Email Routing** (free) forwards `info@…` to a Gmail address. It adds the MX
records and asks you to include `_spf.mx.cloudflare.net` in your one SPF record (see step 2).

## Check it

- Gmail "Show original" on a test email: SPF, DKIM and DMARC all PASS.
- Or <https://mxtoolbox.com/SuperTool.aspx>: look up `spf:diasporaconnectt.com`, `dmarc:diasporaconnectt.com`.
