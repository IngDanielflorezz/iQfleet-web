import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ThemeContext, THEME_STORAGE_KEY } from './themeContext';

const ANIM_ATTRIBUTE = 'data-theme-anim';
const ANIM_DURATION_MS = 300;

function resolveInitialTheme() {
  if (typeof window === 'undefined') return 'light';

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(resolveInitialTheme);
  const animTimeoutRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => () => {
    if (animTimeoutRef.current) window.clearTimeout(animTimeoutRef.current);
  }, []);

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    root.setAttribute(ANIM_ATTRIBUTE, '');

    if (animTimeoutRef.current) window.clearTimeout(animTimeoutRef.current);
    animTimeoutRef.current = window.setTimeout(() => {
      root.removeAttribute(ANIM_ATTRIBUTE);
    }, ANIM_DURATION_MS);

    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({ theme, toggleTheme, isDark: theme === 'dark' }),
    [theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
