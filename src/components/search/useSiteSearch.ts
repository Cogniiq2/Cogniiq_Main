// ─────────────────────────────────────────────────────────────────────────────
// Zustand der Seitensuche — gehört der Navigation, weil sie auf jeder
// öffentlichen Seite steht.
//
// Drei Wege öffnen die Suche: der Auslöser in der Kopfzeile, ⌘K / Strg K, und
// das Ereignis aus openSiteSearch() (404-Seite, mit vorbelegter Eingabe).
// Der Dialog samt Index wird erst beim ersten Öffnen nachgeladen; ein Zeigen
// auf den Auslöser wärmt den Chunk vor, damit das Öffnen keinen Moment wartet.
// ─────────────────────────────────────────────────────────────────────────────
import { lazy, useCallback, useEffect, useId, useRef, useState } from 'react';
import { SITE_SEARCH_OPEN_EVENT, type SiteSearchOpenDetail } from '@/lib/search/openSiteSearch';

const loadDialog = () => import('./SiteSearchDialog');

export const LazySiteSearchDialog = lazy(() =>
  loadDialog().then((m) => ({ default: m.SiteSearchDialog }))
);

/** Tippt der Besucher gerade in ein Feld? Dann gehört die Tastatur dem Feld. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export function useSiteSearch() {
  const [open, setOpen] = useState(false);
  // Einmal geöffnet, bleibt der Dialog eingehängt — Radix spielt sonst keine
  // Ausblendung, und der Index muss nicht neu gebaut werden.
  const [mounted, setMounted] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const dialogId = useId();
  // Wer die Suche geöffnet hat, bekommt beim Schließen den Fokus zurück — der
  // Auslöser in der Kopfzeile, der Knopf der 404-Seite, oder niemand (Tastatur).
  const returnFocusTo = useRef<HTMLElement | null>(null);

  const warm = useCallback(() => {
    void loadDialog();
  }, []);

  const openSearch = useCallback((query = '') => {
    returnFocusTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setInitialQuery(query);
    setMounted(true);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearch();
        return;
      }
      // „/" wie in vielen Dokumentationen — nur außerhalb von Eingabefeldern.
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        openSearch();
      }
    };
    const onRequest = (e: Event) => {
      const detail = (e as CustomEvent<SiteSearchOpenDetail>).detail;
      openSearch(detail?.query ?? '');
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener(SITE_SEARCH_OPEN_EVENT, onRequest);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(SITE_SEARCH_OPEN_EVENT, onRequest);
    };
  }, [openSearch]);

  return { open, setOpen, mounted, initialQuery, openSearch, warm, dialogId, returnFocusTo };
}
