import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode, useSyncExternalStore } from 'react';

import {
  getServerThemePathname,
  getThemePathname,
  subscribeThemePathname,
  usesPublicLightTheme,
} from '@/lib/routing/publicTheme';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'cogniiq-theme',
}: ThemeProviderProps) {
  const pathname = useSyncExternalStore(
    subscribeThemePathname,
    getThemePathname,
    getServerThemePathname
  );

  // Public marketing URLs are pinned to light through next-themes' own API.
  // `forcedTheme` makes the library itself render light — it never puts `dark` on
  // <html> — while leaving `cogniiq-theme` untouched, so a customer's explicit
  // dark choice still applies the moment they navigate into /app, /admin, /owner
  // or /auth. Suppressing the class after the fact instead of preventing it is
  // what deadlocked against next-themes' own class rewriting.
  const forcedTheme = usesPublicLightTheme(pathname) ? 'light' : undefined;

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      forcedTheme={forcedTheme}
      storageKey={storageKey}
    >
      {children}
    </NextThemesProvider>
  );
}
