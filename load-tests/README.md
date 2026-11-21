# Load Tests — Diaspora Connect

Three k6 scripts to test the app at different traffic levels.

## Scripts

| Script | Users | Duration | Purpose |
|---|---|---|---|
| `smoke.js` | 1 | 30s | Quick sanity check — is the app up? |
| `load.js` | up to 50 | ~6 min | Normal member traffic simulation |
| `stress.js` | up to 200 | ~9 min | Find the breaking point |

## What each test covers
- Public homepage loading
- Member sign-in (Supabase Auth)
- Profile data fetch
- Transactions fetch
- Share conversion requests fetch
- Sign-out

## How to run

```bash
# 1. Smoke test first (always start here)
k6 run load-tests/smoke.js

# 2. Load test
k6 run load-tests/load.js

# 3. Stress test (run outside business hours)
k6 run load-tests/stress.js
```

## Reading the results

After each run k6 prints a summary. Key numbers to look at:

| Metric | What it means | Good threshold |
|---|---|---|
| `http_req_failed` | % of requests that errored | < 1% (smoke/load), < 5% (stress) |
| `http_req_duration p(95)` | 95% of requests completed in X ms | < 2s (smoke), < 3s (load), < 5s (stress) |
| `errors` | custom error rate from checks | < 5% |

## Thresholds
Each script has thresholds built in. If a threshold is breached, k6 exits with a **non-zero code** (fails) and marks ✗ next to that metric.

> **Note:** The stress test will spike your Supabase free-tier usage. Run it sparingly.
