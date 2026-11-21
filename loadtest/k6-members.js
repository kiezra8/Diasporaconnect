// Load test: thousands of members opening their portal at the same time.
//
// Install k6 (https://k6.io/docs/get-started/installation/), create ONE test member login
// in Supabase (an approved member with a member number), then run:
//
//   k6 run -e SUPABASE_URL=https://cbohtkesgaxuixbdsucw.supabase.co \
//          -e ANON_KEY=<anon key> \
//          -e EMAIL=loadtest-member@example.com -e PASSWORD=<its password> \
//          -e USERS=2000 loadtest/k6-members.js
//
// Each virtual user does what a member's browser does when the portal opens: reads their
// member record, transactions, requests, KYC and loans (each checked by the access rules),
// then stays on the page. Raise USERS step by step (500 → 2000 → 5000 …) and watch
// Supabase → Reports (CPU, connections, response times). Stop when responses slow down:
// that is the size to plan for (or the point to upgrade compute).
import http from 'k6/http';
import { check, sleep } from 'k6';

const URL = __ENV.SUPABASE_URL;
const KEY = __ENV.ANON_KEY;
const USERS = Number(__ENV.USERS || 500);

export const options = {
  stages: [
    { duration: '1m', target: Math.round(USERS / 4) },
    { duration: '2m', target: USERS },
    { duration: '3m', target: USERS },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],          // under 1% errors
    http_req_duration: ['p(95)<1500'],       // 95% of requests under 1.5 s
  },
};

// sign in once and share the session (sign-ins are rate limited per IP)
export function setup() {
  const res = http.post(`${URL}/auth/v1/token?grant_type=password`, JSON.stringify({ email: __ENV.EMAIL, password: __ENV.PASSWORD }), {
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
  });
  if (res.status !== 200) throw new Error(`Test member could not sign in: ${res.status} ${res.body}`);
  return { token: res.json('access_token') };
}

const TABLES = ['members', 'transactions', 'payment_requests', 'share_conversions', 'kyc_submissions', 'loans'];

export default function (data) {
  const headers = { apikey: KEY, Authorization: `Bearer ${data.token}` };
  // the portal loads these in parallel, up to 6 at a time
  const responses = http.batch(TABLES.map(t => ['GET', `${URL}/rest/v1/${t}?select=id,data&order=seq.asc&limit=1000`, null, { headers }]));
  responses.forEach((r, i) => check(r, { [`${TABLES[i]} loaded`]: x => x.status === 200 }));
  http.get(`${URL}/rest/v1/app_settings?select=key,value`, { headers });
  // a member reads their page for a while before doing anything else
  sleep(20 + Math.random() * 20);
}
