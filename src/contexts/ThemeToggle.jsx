import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      className={className}
      onClick={() => toggleTheme()}
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      style={{ padding: 6, borderRadius: 6, cursor: 'pointer' }}
    >
      {theme === 'dark' ? '🌞 Light' : '🌙 Dark'}
    </button>
  );
}
