// Supabase: sign-in (Auth) and the SACCO database (Postgres).
// The anon key is a public key; what each user can read or change is enforced in the database
// by the access rules in supabase/schema.sql.
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || 'https://cbohtkesgaxuixbdsucw.supabase.co';
export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib2h0a2VzZ2F4dWl4YmRzdWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxOTI5NzQsImV4cCI6MjExMDc2ODk3NH0.aMzi4NDm2_5RWYDqe6KCwgDYFH9tioRsN5uFaymE7XQ';

// SSL enforcement: the app only ever connects to Supabase over HTTPS / secure WebSockets (wss)
if (!/^https:\/\//i.test(SUPABASE_URL)) {
  throw new Error(`Supabase must be reached over HTTPS (SSL). Got: ${SUPABASE_URL}`);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  realtime: { params: { eventsPerSecond: 20 } },
});

/** Current access token (refreshed automatically) for calls to the API server on the VPS. */
export async function accessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
