# What happens when 20,000 people sign in at once

## Where the load goes

```
20,000 browsers ──▶ Cloudflare (website files, cached)            ← almost free to serve
               ──▶ Supabase Auth (sign-in)                         ← rate limits matter
               ──▶ Supabase database API (reading records)         ← compute size matters
               ──▶ Supabase Realtime (instant updates)             ← connection quota matters
               ──▶ API on the VPS (only mobile money, SMS, AI)    ← small; rate limited
```

The VPS is **not** in the path for signing in or reading records, so it can't freeze the app for
members. The things to size are your **Supabase plan** and the **Cloudflare cache**.

## Already built into the app

| What | Why it matters with thousands online |
|---|---|
| The website loads in pieces: 670 KB first, each portal only when it's opened (was one 1.7 MB file) | Faster on mobile data; less to serve |
| Built files cached for a year by browsers and Cloudflare; the page itself is always re-checked | Most visits download almost nothing |
| A member's browser downloads only 6 lists, and only their own rows | Small, quick reads instead of the whole database |
| Lists load in parallel, at most 6 at a time | A quick sign-in without flooding the server |
| A member listens **only to changes to their own records** (staff listen to everything) | Realtime does far less work per change |
| `member_id` is indexed on every member table; access-rule checks are cached per request | Each read stays fast as the tables grow |
| Coming back online waits a random 0 to 15 seconds before reloading | Stops thousands of phones reloading at the same second after a network outage |
| Offline saves wait in the browser and are sent later | A busy moment never loses a member's request |
| The API has per-IP rate limits | One abuser can't slow everyone else |

## What you need to set before a big launch

1. **Supabase plan and compute.** The Free plan pauses inactive projects and is sized for testing. For
   thousands of members online at once, use **Pro** and a larger **compute add-on** (Project Settings →
   Compute). Start smaller and upgrade when the load test (below) shows it's needed. You can change
   compute at any time with a short restart.
2. **Realtime connections.** Every open portal holds one Realtime connection. Each plan has a limit on
   simultaneous connections (a few hundred on the lower plans). For 20,000 at once, ask Supabase support
   for a higher Realtime quota, or move to a plan that includes it. Check current figures at
   <https://supabase.com/pricing>. If the limit is reached, pages still work; changes then show the next
   time the page loads, instead of instantly.
3. **Sign-in rate limits.** Ugandan mobile networks put many phones behind a few shared internet
   addresses. Raise the limits in Supabase → Authentication → **Rate Limits** (sign-ins and token
   refreshes per IP) so members on the same network aren't blocked.
4. **Email.** Connect your own email sender (see [EMAIL.md](EMAIL.md)). The built-in mailer sends only a
   few emails an hour.
5. **Cloudflare.** Keep the website proxied through Cloudflare (orange cloud) so it serves the cached files.
   When the VPS is connected, set SSL/TLS mode to **Full (strict)**.

## Test it before launch

[`loadtest/k6-members.js`](../loadtest/k6-members.js) simulates members opening their portal: it signs in
one test member and repeats a member's reads with as many virtual users as you choose. Run it with 500,
then 2,000, then 5,000 users while watching Supabase → **Reports**. The point where responses pass about
1.5 seconds is your limit on that compute size. Upgrade and run it again until you have room for your
peak.

A realistic note: 20,000 people rarely press "sign in" in the same second. More often it's 20,000 over
an hour, with a few hundred at the same moment. Plan for your real peak (for example the day before an AGM
or a dividend payout) and test that number.
