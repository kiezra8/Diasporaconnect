/**
 * LOAD TEST — ramps up to 50 virtual users over 5 minutes.
 * Purpose: simulate real member traffic hitting sign-in and portal data.
 * Run: k6 run load-tests/load.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const SUPABASE_URL  = 'https://cbohtkesgaxuixbdsucw.supabase.co';
const ANON_KEY      = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib2h0a2VzZ2F4dWl4YmRzdWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxOTI5NzQsImV4cCI6MjExMDc2ODk3NH0.aMzi4NDm2_5RWYDqe6KCwgDYFH9tioRsN5uFaymE7XQ';
const SITE_URL      = 'https://diasporaconnectt.com';

const TEST_EMAIL    = 'member@diasporaconnectt.com';
const TEST_PASSWORD = 'Member@2026';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m',  target: 10 },  // ramp up to 10 users
    { duration: '2m',  target: 50 },  // ramp up to 50 users
    { duration: '2m',  target: 50 },  // hold at 50 users
    { duration: '1m',  target: 0  },  // ramp down
  ],
  thresholds: {
    http_req_failed:   ['rate<0.05'],   // less than 5% errors
    http_req_duration: ['p(95)<3000'],  // 95% of requests under 3s
    errors:            ['rate<0.05'],
  },
};

const headers = {
  'apikey':       ANON_KEY,
  'Content-Type': 'application/json',
};

export default function () {
  // 1 — Homepage
  const home = http.get(SITE_URL, { tags: { name: 'homepage' } });
  errorRate.add(home.status !== 200);
  check(home, { 'homepage: 200': (r) => r.status === 200 });
  sleep(1);

  // 2 — Sign in
  const loginRes = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers, tags: { name: 'login' } }
  );
  const loginOk = check(loginRes, {
    'login: 200':      (r) => r.status === 200,
    'login: token':    (r) => r.json('access_token') !== undefined,
  });
  errorRate.add(!loginOk);

  if (!loginOk) { sleep(2); return; }

  const token = loginRes.json('access_token');
  const authHeaders = { ...headers, Authorization: `Bearer ${token}` };

  sleep(1);

  // 3 — Load profile
  const profileRes = http.get(
    `${SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`,
    { headers: authHeaders, tags: { name: 'profile' } }
  );
  check(profileRes, { 'profile: 200': (r) => r.status === 200 });
  errorRate.add(profileRes.status !== 200);

  sleep(1);

  // 4 — Load member transactions (savings/deposits)
  const txRes = http.get(
    `${SUPABASE_URL}/rest/v1/transactions?select=*&order=created_at.desc&limit=20`,
    { headers: authHeaders, tags: { name: 'transactions' } }
  );
  check(txRes, { 'transactions: 200': (r) => r.status === 200 });
  errorRate.add(txRes.status !== 200);

  sleep(1);

  // 5 — Load share conversion requests
  const sharesRes = http.get(
    `${SUPABASE_URL}/rest/v1/share_conversion_requests?select=*&order=created_at.desc&limit=10`,
    { headers: authHeaders, tags: { name: 'shares' } }
  );
  check(sharesRes, { 'shares: 200 or 400': (r) => r.status < 500 });

  // 6 — Sign out
  http.post(`${SUPABASE_URL}/auth/v1/logout`, null,
    { headers: authHeaders, tags: { name: 'logout' } }
  );

  sleep(2);
}
