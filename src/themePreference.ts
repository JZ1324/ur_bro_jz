export type Theme = 'light' | 'dark';

export const themeStorageKey = 'theme';

export function resolveInitialTheme(storedTheme: string | null, legacyGardenTime: unknown = null): Theme {
  if (storedTheme === null && legacyGardenTime === 'dusk') return 'dark';
  return storedTheme === 'dark' ? 'dark' : 'light';
}

export function readStoredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(themeStorageKey);
    if (stored !== null) return resolveInitialTheme(stored);
    return resolveInitialTheme(null, JSON.parse(window.localStorage.getItem('garden:time') ?? 'null'));
  } catch {
    return 'light';
  }
}

export function storeTheme(theme: Theme) {
  try {
    window.localStorage.setItem(themeStorageKey, theme);
  } catch {
    // Theme persistence is optional when storage is unavailable.
  }
}
