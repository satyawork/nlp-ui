import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'chat_theme_pref';
const DEFAULT = 'dark';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(DEFAULT);

  useEffect(() => {
    // pick saved, else OS preference, else default
    const saved = (typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY)) || null;
    const prefersLight = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    const initial = saved || (prefersLight ? 'light' : DEFAULT);
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function toggleTheme(next) {
    const newTheme = next || (theme === 'dark' ? 'light' : 'dark');
    setTheme(newTheme);
    document.documentElement.dataset.theme = newTheme;
    try { localStorage.setItem(STORAGE_KEY, newTheme); } catch (e) {}
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
