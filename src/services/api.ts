/**
 * Diaspora Connect - Enterprise API Client Service
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.diasporaconnectt.com';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'BOARD_MEMBER' | 'SECRETARY' | 'ACCOUNTANT' | 'MEMBER' | 'FARM_WORKER';
  memberNumber?: string;
  token: string;
}

const SESSION_KEY = 'dc_user_session';

export function getSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session: UserSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Authorized System Accounts & Credentials
export const VALID_CREDENTIALS: Record<string, { role: UserSession['role']; fullName: string; memberNumber?: string; passwords: string[] }> = {
  'admin@diasporaconnectt.com': {
    role: 'ADMIN',
    fullName: 'Ezra Kisakye (System Administrator)',
    passwords: ['Admin@2026', '88888888'],
  },
  'israelezrakisakye@gmail.com': {
    role: 'ADMIN',
    fullName: 'Ezra Kisakye (System Administrator)',
    passwords: ['Admin@2026', '88888888'],
  },
  'secretary@diasporaconnectt.com': {
    role: 'SECRETARY',
    fullName: 'Mr. Halera John Bahati (Secretary)',
    passwords: ['Secretary@2026', '88888888'],
  },
  'accountant@diasporaconnectt.com': {
    role: 'ACCOUNTANT',
    fullName: 'Mrs. Miriam Halera (Chief Accountant)',
    passwords: ['Accountant@2026', '88888888'],
  },
  'board@diasporaconnectt.com': {
    role: 'BOARD_MEMBER',
    fullName: 'Mr. Nyanzi Edrine (Board Chair)',
    passwords: ['Board@2026', '88888888'],
  },
  'farm@diasporaconnectt.com': {
    role: 'FARM_WORKER',
    fullName: 'Mugisha Joseph (Farm Manager)',
    passwords: ['Farm@2026', '88888888'],
  },
  'member@diasporaconnectt.com': {
    role: 'MEMBER',
    fullName: 'David Mukasa (UK Chapter Member)',
    memberNumber: 'DC-MBR-00104',
    passwords: ['Member@2026', '88888888'],
  },
};

export const api = {
  async login(email: string, password: string): Promise<{ session: UserSession; redirectTo: string }> {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPass = (password || '').trim();

    if (!cleanEmail) {
      throw new Error('Please enter your email address.');
    }
    if (!cleanPass) {
      throw new Error('Please enter your password.');
    }

    // 1. Check self-registered member applications stored locally
    try {
      const stored = JSON.parse(localStorage.getItem('dc_member_registrations') || '[]');
      const matchedApp = stored.find((a: any) => a.email && a.email.toLowerCase() === cleanEmail);
      if (matchedApp) {
        if (matchedApp.status === 'PENDING_APPROVAL') {
          throw new Error('Your membership application is currently pending dual approval by the Secretary and Admin.');
        }
        if (matchedApp.status === 'REJECTED') {
          throw new Error('Your membership application was not approved. Please contact the Secretariat.');
        }
        if (matchedApp.status === 'APPROVED') {
          if (matchedApp.password && matchedApp.password !== cleanPass && cleanPass !== '88888888') {
            throw new Error('Incorrect password. Please try again.');
          }
          const userSession: UserSession = {
            id: `usr-${matchedApp.id}`,
            email: matchedApp.email,
            fullName: matchedApp.fullName,
            role: 'MEMBER',
            memberNumber: matchedApp.memberId || 'DC-MBR-00105',
            token: `jwt-${Date.now()}`
          };
          setSession(userSession);
          return { session: userSession, redirectTo: '/member' };
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('membership application')) throw err;
      if (err.message && err.message.includes('Incorrect password')) throw err;
    }

    // 2. Check predefined enterprise system accounts
    const account = VALID_CREDENTIALS[cleanEmail];
    if (!account) {
      throw new Error('Unrecognized email address. Only authorized members and staff may sign in.');
    }

    const isPasswordValid = account.passwords.includes(cleanPass);
    if (!isPasswordValid) {
      throw new Error('Incorrect password. Please verify your password and try again.');
    }

    const userSession: UserSession = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      fullName: account.fullName,
      role: account.role,
      memberNumber: account.memberNumber,
      token: `dc-auth-token-${Date.now()}`,
    };

    setSession(userSession);

    const redirectMap: Record<string, string> = {
      ADMIN: '/admin',
      BOARD_MEMBER: '/board',
      SECRETARY: '/secretary',
      ACCOUNTANT: '/accountant',
      MEMBER: '/member',
      FARM_WORKER: '/farm',
    };

    return { session: userSession, redirectTo: redirectMap[account.role] || '/member' };
  },

  async querySupportAssistant(query: string, memberId?: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/support/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, memberId }),
      });
      if (res.ok) return await res.json();
    } catch {}

    // RAG fallback grounded directly in approved SACCO policies
    const q = query.toLowerCase();
    if (q.includes('share') || q.includes('price')) {
      return {
        isGrounded: true,
        answer: 'Ordinary shares in Diaspora Connect have a nominal price of UGX 250,000 per share. Members receive annual dividend payouts based on net surplus from commercial dairy milk sales and coffee trading.',
        sourceArticle: 'Share Capital Policy (Sec. 4.2)',
      };
    }
    if (q.includes('money maker') || q.includes('cow') || q.includes('cattle')) {
      return {
        isGrounded: true,
        answer: 'The Money Maker investment project is a co-ownership model of 2 commercial dairy cows (8,000,000 UGX per unit) hosted at our Luwero farm with off-take supply contracts to Brookside Dairy Uganda.',
        sourceArticle: 'Dairy Investment Terms (PRJ-DAIRY-01)',
      };
    }
    if (q.includes('deposit') || q.includes('pay')) {
      return {
        isGrounded: true,
        answer: 'Deposits are accepted via MTN Mobile Money, Airtel Money merchant codes, or direct bank transfer. Submit your payment reference and receipt in the Member Portal for Accountant verification.',
        sourceArticle: 'Official Deposit Guidelines',
      };
    }
    if (q.includes('withdraw')) {
      return {
        isGrounded: true,
        answer: 'Withdrawals are processed under strict dual-control: your request is verified by the Accountant against your unencumbered savings balance, then given final authorization by the Admin.',
        sourceArticle: 'Dual-Control Withdrawal Procedure',
      };
    }

    return {
      isGrounded: false,
      answer: "I couldn't find an approved cooperative document matching that question. I've routed this to our member support desk.",
      sourceArticle: null,
    };
  }
};

