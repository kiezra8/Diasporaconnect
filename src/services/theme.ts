/**
 * Diaspora Connect — Centralised Theme Manager
 * 
 * Uses Tailwind's class-based dark mode strategy.
 * When 'dark' class is on <html>, Tailwind's `dark:` prefixes activate.
 */

const THEME_KEY = 'dc_portal_theme';

export type ThemeMode = 'dark' | 'light';

/** Read theme from localStorage, default light */
export function getTheme(): ThemeMode {
  return (localStorage.getItem(THEME_KEY) as ThemeMode) || 'light';
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
  // Ensure existing sessions transition to light mode by default
  if (localStorage.getItem('dc_theme_v2') !== '1') {
    localStorage.removeItem(THEME_KEY);
    localStorage.setItem('dc_theme_v2', '1');
  }
  applyTheme(getTheme());
}

