/**
 * SMOKE TEST — runs 1 virtual user for 30 seconds.
 * Purpose: confirm the app is up and basic flows work before running heavier tests.
 * Run: k6 run load-tests/smoke.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://cbohtkesgaxuixbdsucw.supabase.co';
const ANON_KEY      = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib2h0a2VzZ2F4dWl4YmRzdWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxOTI5NzQsImV4cCI6MjExMDc2ODk3NH0.aMzi4NDm2_5RWYDqe6KCwgDYFH9tioRsN5uFaymE7XQ';
const SITE_URL      = 'https://diasporaconnectt.com';

// Test member credentials (must exist in your Supabase)
const TEST_EMAIL    = 'member@diasporaconnectt.com';
const TEST_PASSWORD = 'Member@2026';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_failed:   ['rate<0.01'],   // less than 1% errors
    http_req_duration: ['p(95)<2000'],  // 95% of requests under 2s
  },
};

const headers = {
  'apikey':       ANON_KEY,
  'Content-Type': 'application/json',
};

export default function () {
  // 1 — Public site loads
  const home = http.get(SITE_URL);
  check(home, { 'site is up (200)': (r) => r.status === 200 });

  // 2 — Supabase auth sign-in
  const loginRes = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers }
  );
  const loginOk = check(loginRes, {
    'login: status 200':   (r) => r.status === 200,
    'login: has token':    (r) => r.json('access_token') !== undefined,
  });

  if (loginOk) {
    const token = loginRes.json('access_token');
    const authHeaders = { ...headers, Authorization: `Bearer ${token}` };

    // 3 — Read own profile
    const profileRes = http.get(
      `${SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`,
      { headers: authHeaders }
    );
    check(profileRes, { 'profile: status 200': (r) => r.status === 200 });

    // 4 — Sign out
    http.post(`${SUPABASE_URL}/auth/v1/logout`, null, { headers: authHeaders });
  }

  sleep(1);
}
