/**
 * Diaspora Connect - Enterprise API Client Service
 */
import { supabase, accessToken } from './supabase';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.diasporaconnectt.com';
// Sign-in is Supabase Auth.

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'BOARD_MEMBER' | 'SECRETARY' | 'ACCOUNTANT' | 'MEMBER' | 'FARM_WORKER';
  memberNumber?: string;
  token: string;
  /** true when signed in with Supabase (shared database, mobile money, SMS, AI) */
  backend?: boolean;
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
  window.dispatchEvent(new Event('dc_auth_change'));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  supabase.auth.signOut().catch(() => {});
  window.dispatchEvent(new Event('dc_auth_change'));
}

const REDIRECT_BY_ROLE: Record<string, string> = {
  ADMIN: '/admin',
  BOARD_MEMBER: '/board',
  SECRETARY: '/secretary',
  ACCOUNTANT: '/accountant',
  MEMBER: '/member',
  FARM_WORKER: '/farm',
};

/** Sign-in outcomes the sign-in page shows its own screen for. */
export class AuthFlowError extends Error {
  constructor(public code: 'EMAIL_NOT_CONFIRMED' | 'APPLICATION_PENDING' | 'APPLICATION_REJECTED' | 'NO_APPLICATION', message: string, public extra: any = {}) {
    super(message);
  }
}

export interface MembershipApplication {
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  chapter: string;
  photoUrl?: string;
  kyc: {
    idType: string; idNumber: string; dateOfBirth: string; nationality: string; countryOfResidence: string;
    address: string; occupation: string; sourceOfFunds: string;
    nextOfKinName: string; nextOfKinRelationship: string; nextOfKinPhone: string;
    idFrontImage: string; idBackImage?: string; selfieImage: string;
  };
}

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

    // Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPass });
    if (error) {
      if (/not confirmed/i.test(error.message)) {
        throw new AuthFlowError('EMAIL_NOT_CONFIRMED', 'Confirm your email first: enter the code we sent you, or open the link in the email.', { email: cleanEmail });
      }
      if (/invalid login credentials/i.test(error.message)) throw new Error('Incorrect email or password.');
      if (/fetch|network/i.test(error.message)) throw new Error('Cannot reach the SACCO server. Check your internet connection.');
      throw new Error(error.message);
    }
    return api.completeSignIn(data.user!.id, data.session!.access_token);
  },

  /** Loads the signed-in user's profile and opens their portal (members only once approved). */
  async completeSignIn(userId: string, token: string): Promise<{ session: UserSession; redirectTo: string }> {
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error || !profile) {
      await supabase.auth.signOut();
      throw new Error(error ? `Could not load your account: ${error.message}` : 'Your account is not set up yet. Contact the SACCO office.');
    }
    if (!profile.active) {
      await supabase.auth.signOut();
      throw new Error('This account has been deactivated. Contact the SACCO office.');
    }

    if (profile.role === 'MEMBER' && !profile.member_id) {
      const { data: app } = await supabase.from('member_applications').select('id,data,status')
        .eq('user_id', userId).order('seq', { ascending: false }).limit(1).maybeSingle();
      if (!app) {
        // signed in but never finished the application + KYC: stay signed in so they can finish it
        throw new AuthFlowError('NO_APPLICATION', 'Finish your membership application and KYC to continue.', { userId, email: profile.email, fullName: profile.full_name });
      }
      await supabase.auth.signOut();
      if (app.status === 'REJECTED') throw new AuthFlowError('APPLICATION_REJECTED', 'Your membership application was not approved. Please contact the Secretariat.', { application: app.data });
      throw new AuthFlowError('APPLICATION_PENDING', 'Your membership application is waiting for approval by the Secretary and Admin.', { application: app.data });
    }

    const userSession: UserSession = {
      id: userId,
      email: profile.email,
      fullName: profile.full_name || profile.email,
      role: profile.role,
      memberNumber: profile.member_id || undefined,
      token,
      backend: true,
    };
    setSession(userSession);
    return { session: userSession, redirectTo: REDIRECT_BY_ROLE[profile.role] || '/member' };
  },

  /**
   * Member sign-up. The application (personal details + full KYC) is saved together with the
   * account; the database refuses it if any KYC item is missing.
   */
  async signUpMember(app: MembershipApplication, password: string): Promise<{ applicationId: string; needsEmailConfirmation: boolean }> {
    const email = app.email.toLowerCase().trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: app.fullName, phone: app.phone }, emailRedirectTo: `${window.location.origin}/signin` },
    });
    if (error) throw new Error(/registered|exists/i.test(error.message) ? 'An account with this email already exists. Sign in instead.' : error.message);
    if (!data.user || (data.user.identities && data.user.identities.length === 0)) {
      throw new Error('An account with this email already exists. Sign in instead.');
    }
    const applicationId = await api.submitApplication(data.user.id, { ...app, email });
    if (data.session) await supabase.auth.signOut(); // no portal access until approved
    return { applicationId, needsEmailConfirmation: !data.session };
  },

  async submitApplication(userId: string, app: MembershipApplication): Promise<string> {
    const { data, error } = await supabase.rpc('submit_membership_application', { p_user_id: userId, p_application: app });
    if (error) throw new Error(error.message);
    return data as string;
  },

  async confirmEmail(email: string, code: string) {
    const { error } = await supabase.auth.verifyOtp({ email: email.toLowerCase().trim(), token: code.trim(), type: 'signup' });
    if (error) throw new Error(/expired|invalid/i.test(error.message) ? 'That code is wrong or has expired. Request a new one.' : error.message);
    await supabase.auth.signOut();
  },

  async resendConfirmation(email: string) {
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.toLowerCase().trim() });
    if (error) throw new Error(error.message);
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
        answer: 'Ordinary shares in Diaspora Connect have a nominal price of UGX 250,000 per share. Members receive annual dividend payouts based on net surplus from commercial dairy milk sales and loan interest.',
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
  },

  /**
   * Admin AI advisor. Sends the SACCO data snapshot to the backend, which asks Claude for a
   * report or an answer. Returns null when the AI service is unreachable so the caller can
   * fall back to the built-in analysis.
   */
  async querySaccoAdvisor(payload: { mode: 'report' | 'question'; question?: string; snapshot: unknown }): Promise<{ answer: string; model?: string } | null> {
    const token = await accessToken();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 90000);
      const res = await fetch(`${API_BASE_URL}/ai/sacco-advisor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      const data = await res.json();
      return typeof data?.answer === 'string' && data.answer.trim() ? data : null;
    } catch {
      return null;
    }
  }
};

