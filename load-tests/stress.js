/**
 * STRESS TEST — pushes well beyond normal load to find the breaking point.
 * Purpose: see how Supabase + the site handle extreme traffic.
 * Run: k6 run load-tests/stress.js
 * WARNING: Run this outside business hours; it will spike your Supabase usage.
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
    { duration: '2m',  target: 50  },  // normal load
    { duration: '3m',  target: 100 },  // push harder
    { duration: '2m',  target: 200 },  // stress point
    { duration: '2m',  target: 0   },  // ramp down
  ],
  thresholds: {
    http_req_failed:   ['rate<0.10'],   // allow up to 10% errors under stress
    http_req_duration: ['p(95)<5000'],  // 95% under 5s under stress
  },
};

const headers = {
  'apikey':       ANON_KEY,
  'Content-Type': 'application/json',
};

export default function () {
  // Public homepage hit
  const home = http.get(SITE_URL, { tags: { name: 'homepage' } });
  check(home, { 'homepage ok': (r) => r.status === 200 });
  errorRate.add(home.status !== 200);
  sleep(0.5);

  // Auth
  const loginRes = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers, tags: { name: 'login' } }
  );
  const loginOk = check(loginRes, { 'login ok': (r) => r.status === 200 });
  errorRate.add(!loginOk);

  if (!loginOk) { sleep(1); return; }

  const token = loginRes.json('access_token');
  const authHeaders = { ...headers, Authorization: `Bearer ${token}` };

  // Batch queries (what a member portal page triggers)
  const responses = http.batch([
    ['GET', `${SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`, null, { headers: authHeaders, tags: { name: 'profile' } }],
    ['GET', `${SUPABASE_URL}/rest/v1/transactions?select=*&order=created_at.desc&limit=20`, null, { headers: authHeaders, tags: { name: 'transactions' } }],
    ['GET', `${SUPABASE_URL}/rest/v1/share_conversion_requests?select=*&limit=10`, null, { headers: authHeaders, tags: { name: 'shares' } }],
  ]);

  responses.forEach((res) => {
    errorRate.add(res.status >= 500);
  });

  http.post(`${SUPABASE_URL}/auth/v1/logout`, null, { headers: authHeaders });

  sleep(1);
}
