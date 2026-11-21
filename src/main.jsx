import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { initTheme } from './services/theme.ts';
import { database } from './services/database.ts';
import { supabase } from './services/supabase.ts';
import { SaccoFarmStore } from './services/saccoFarmStore.ts';
import { getSession, setSession, clearSession } from './services/api.ts';

// Apply persisted theme before first render to avoid flash
initTheme();

// Who is acting (for the audit trail) + open the shared Supabase database when signed in
const applySession = () => {
  const s = getSession();
  // old demo sign-ins (not from Supabase) are no longer valid
  if (s && !s.backend) { clearSession(); return; }
  SaccoFarmStore.setActor(s ? { name: s.fullName, role: s.role, email: s.email } : { name: 'Visitor', role: 'PUBLIC' });
  if (s?.backend) database.start();
  else { database.stop(); database.forgetLocalData(); }
};
applySession();
window.addEventListener('dc_auth_change', applySession);

// The database refused a change (not allowed for this user): say so; the real data is put back
let lastRejection = '';
window.addEventListener('dc_db_rejected', (e) => {
  const msg = e.detail?.message || 'You are not allowed to make this change.';
  if (msg === lastRejection) return;
  lastRejection = msg;
  setTimeout(() => { lastRejection = ''; }, 3000);
  window.alert(`Not saved: ${msg}`);
});

// Keep the portal session in step with Supabase (token refresh, sign-out in another tab)
supabase.auth.onAuthStateChange((event, sbSession) => {
  const s = getSession();
  if (!s?.backend) return;
  if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !sbSession)) {
    clearSession();
  } else if (sbSession && sbSession.user.id === s.id && sbSession.access_token !== s.token) {
    setSession({ ...s, token: sbSession.access_token });
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

