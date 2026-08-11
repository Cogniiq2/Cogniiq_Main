import { useCallback, useState } from 'react';

// Persisted collapse preference for a sidebar rail. The initial value is read synchronously in the
// useState initializer so a collapsed rail never renders expanded for one frame and then snaps.
// This is a client-rendered SPA, so there is no server/client markup to disagree about.

const STORAGE_PREFIX = 'cogniiq.nav.collapsed.';

function readPreference(surface: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(`${STORAGE_PREFIX}${surface}`) === '1';
  } catch {
    // Private mode / blocked storage: fall back to the expanded default rather than throwing.
    return false;
  }
}

/**
 * @param surface stable key per navigation surface ('customer', 'internal'), so the customer portal
 *   and the internal workspace keep independent preferences.
 */
export function useNavCollapse(surface: string) {
  const [collapsed, setCollapsed] = useState(() => readPreference(surface));

  const toggle = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(`${STORAGE_PREFIX}${surface}`, next ? '1' : '0');
      } catch {
        // Preference is a convenience; failing to persist must never break navigation.
      }
      return next;
    });
  }, [surface]);

  return { collapsed, toggle };
}
