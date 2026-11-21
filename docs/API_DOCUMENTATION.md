# Diaspora Connect - API Specification & Integration Guide

## Where things live

| What | Where |
|---|---|
| Sign-in, sign-up, email confirmation | **Supabase Auth** (`https://cbohtkesgaxuixbdsucw.supabase.co`) |
| Every SACCO and farm record, access rules, instant updates | **Supabase Postgres + Realtime**: tables and rules in [`supabase/schema.sql`](../supabase/schema.sql) |
| Mobile money, SMS, AI advisor | **API on the VPS (Contabo)**: `https://api.diasporaconnectt.com` |

The API accepts the user's Supabase access token: `Authorization: Bearer <access_token>`. It checks the token
with Supabase Auth and reads the role and member number from `profiles`.

---

## 1. Database (Supabase)

Each table has `id` (text), `seq` (running number), `data` (the full record, jsonb), typed columns generated from
`data`, and `created_at` / `updated_at` / `updated_by`.

| Table | Who reads | Who writes |
|---|---|---|
| `profiles` | own row; staff | own name/phone; Admin changes roles |
| `members` | staff; the member's own row | staff; a member edits only name, phone, email, photo |
| `member_applications` | staff; the applicant | via `submit_membership_application` (sign-up); staff approve |
| `kyc_submissions`, `payment_requests`, `share_conversions` | staff; own rows | staff; a member submits new *pending* items for themselves |
| `loans`, `transactions`, `investors` | staff; own rows | staff (not the Board) |
| `dividends`, `period_closes`, `sms_messages` | staff | staff (not the Board) |
| `cattle`, `milk_logs`, `cow_milk_records`, `health_records`, `breeding_records`, `feed_inventory` | everyone signed in | staff (not the Board) |
| `staff`, `task_assignments`, `app_settings` | everyone signed in | Admin |
| `audit_log` | Admin, Board | everyone adds entries; nobody can edit or delete |
| `mobile_money_payments` | staff; own rows | the API only |

### `rpc submit_membership_application(p_user_id uuid, p_application jsonb) → text`
Called right after `auth.signUp`. It refuses the application unless the personal details and every KYC item are
present (ID type and number, date of birth, nationality, country of residence, address, occupation, source of
funds, next of kin name, relationship and phone, ID front photo, selfie). Returns the application number
(`REG-0001` …). The password is never stored.

When the Secretary and Admin both approve, the new member gets the next member number, and the applicant's login
is linked to it (`profiles.member_id`).

---

## 2. Mobile Money (MTN MoMo / Airtel Money)

### `POST /payments/mobile-money/collect`
* **Body**: `{ provider: "MTN" | "AIRTEL", phone, amount, memberId, purpose: "savings" | "shares" | "welfare" | "project" | "other", month?, otherLabel? }`
* Members can only pay into their own account. Sends a PIN prompt to the phone and returns `{ id, status: "PENDING", message }`.

### `GET /payments/mobile-money/:id`
* Polls the provider. When the status is **SUCCESSFUL**, a deposit request is written to `payment_requests` already
  marked verified, so it goes straight to the Admin, and the member gets an SMS.

### `POST /payments/mtn/callback`, `POST /payments/airtel/callback`
* Public webhooks. The body is only used to find the payment; the status is always re-checked with the provider.

## 3. SMS (Africa's Talking)

### `POST /notifications/sms`
* **Body**: `{ id, to, message, event, senderId? }`
* **Role**: `ADMIN`, `ACCOUNTANT`, `SECRETARY`, `FARM_WORKER`. Idempotent on `id` (a message already sent is not sent again).
* **Returns**: `{ status: "SENT" | "FAILED", providerRef?, error? }`. Recorded in `sms_messages`.

### `GET /notifications/sms`
* The latest 500 messages. **Role**: `ADMIN`, `SECRETARY`.

## 4. AI SACCO Advisor

### `POST /ai/sacco-advisor`
* **Role**: `ADMIN`
* **Body**: `{ mode: "report" | "question", question?: string, snapshot: object }`. The snapshot is built in the Admin portal from the SACCO data.
* **Returns**: `{ answer: string, model: string }`. Requires `ANTHROPIC_API_KEY` on the server; returns 503 when not configured (the portal then uses its built-in analysis).

## 5. Health

### `GET /health`
* Reports whether Supabase is reachable and which integrations are configured. No secrets are returned.
