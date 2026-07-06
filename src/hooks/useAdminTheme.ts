import { useState, useEffect } from 'react';

export type AdminTheme = 'dark' | 'light';

const STORAGE_KEY = 'cogniiq_admin_theme';

export function useAdminTheme() {
  const [theme, setThemeState] = useState<AdminTheme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'light' || stored === 'dark') ? stored : 'dark';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.setAttribute('data-admin-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: AdminTheme) => setThemeState(newTheme);
  const toggleTheme = () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark'));

  return { theme, setTheme, toggleTheme };
}
