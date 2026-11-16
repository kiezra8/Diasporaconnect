/**
 * Diaspora Connect — Centralised Theme Manager
 * 
 * Uses Tailwind's class-based dark mode strategy.
 * When 'dark' class is on <html>, Tailwind's `dark:` prefixes activate.
 */

const THEME_KEY = 'dc_portal_theme';

export type ThemeMode = 'dark' | 'light';

/** Read theme from localStorage, default dark */
export function getTheme(): ThemeMode {
  return (localStorage.getItem(THEME_KEY) as ThemeMode) || 'dark';
}

/** Write theme to localStorage and toggle the `dark` class on <html> */
export function applyTheme(mode: ThemeMode) {
  localStorage.setItem(THEME_KEY, mode);
  if (mode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

/** Call once on app boot to restore persisted theme */
export function initTheme() {
  applyTheme(getTheme());
}

