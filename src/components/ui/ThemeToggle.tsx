import { useCallback, useEffect, useState, type CSSProperties } from 'react';

export type Theme = 'light' | 'dark';

type ThemeToggleProps = {
  defaultTheme?: Theme;
  buttonSize?: number;
  onThemeChange?: (theme: Theme) => void;
};

const tokens: Record<Theme, Record<string, string>> = {
  light: {
    btnBg: '#F3EDE1',
    btnText: '#1A1A1A',
    btnRing: '#D0C6B6',
  },
  dark: {
    btnBg: '#11150F',
    btnText: '#C9D3B0',
    btnRing: '#303728',
  },
};

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

export function ThemeToggle({
  defaultTheme = 'dark',
  buttonSize = 36,
  onThemeChange,
}: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const currentTokens = tokens[theme];

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    onThemeChange?.(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }, [onThemeChange, theme]);

  const buttonScale = pressed ? 0.96 : hovered ? 1.1 : 1;

  const buttonStyle: CSSProperties = {
    width: buttonSize,
    height: buttonSize,
    transform: `scale(${buttonScale})`,
    background: currentTokens.btnBg,
    color: currentTokens.btnText,
    boxShadow: `0 0 0 1.5px ${currentTokens.btnRing}`,
    transition: 'transform 0.15s ease',
  };

  return (
    <span className="inline-flex rounded-full bg-bg">
      <button
        type="button"
        style={buttonStyle}
        onClick={toggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setPressed(false);
        }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        className="flex items-center justify-center rounded-full"
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        aria-pressed={theme === 'dark'}
      >
        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
      </button>
    </span>
  );
}
