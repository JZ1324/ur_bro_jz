import type { Theme } from './components/ui/ThemeToggle';

export const themeStorageKey = 'theme';

export function resolveInitialTheme(storedTheme: string | null): Theme {
  return storedTheme === 'light' ? 'light' : 'dark';
}

export function readStoredTheme(): Theme {
  try {
    return resolveInitialTheme(window.localStorage.getItem(themeStorageKey));
  } catch {
    return 'dark';
  }
}

export function storeTheme(theme: Theme) {
  try {
    window.localStorage.setItem(themeStorageKey, theme);
  } catch {
    // Theme persistence is optional when storage is unavailable.
  }
}
