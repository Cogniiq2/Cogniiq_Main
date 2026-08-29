import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DENIED_STATE,
  OPEN_CONSENT_EVENT,
  denyAll,
  getStoredConsent,
  grantAll,
  hasDecision,
  revokeConsent,
  setConsent,
  type ConsentState,
  type ConsentStatus,
} from '@/lib/consent';

// Cookie/consent UI. Renders:
//   • an equal-choice banner when no decision has been stored yet, and
//   • a settings dialog that can be reopened at any time (e.g. from the footer
//     "Cookie-Einstellungen" action) to change or revoke consent.
// Accept and reject are given equal visual weight; reject is never hidden.
//
// Statistik (GA4) and Marketing (Google Ads) are INDEPENDENT purposes: each can
// be granted or denied on its own. "Alle akzeptieren" grants both, and the
// banner text names both purposes so that single click is informed.
export function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [current, setCurrent] = useState<ConsentState | null>(null);
  // Draft toggle state inside the settings dialog, committed by "Auswahl speichern".
  const [draft, setDraft] = useState<ConsentState>(DENIED_STATE);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrent(getStoredConsent());
    setDraft(getStoredConsent() ?? DENIED_STATE);
    setShowBanner(!hasDecision());

    const openSettings = () => {
      setCurrent(getStoredConsent());
      setDraft(getStoredConsent() ?? DENIED_STATE);
      setShowSettings(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, openSettings);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, openSettings);
  }, []);

  // Move focus into the settings dialog and trap Escape-to-close for keyboard users.
  useEffect(() => {
    if (!showSettings) return;
    const el = dialogRef.current?.querySelector<HTMLElement>('button, a, [tabindex]');
    el?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSettings(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSettings]);

  const close = (state: ConsentState) => {
    setCurrent(state);
    setDraft(state);
    setShowBanner(false);
    setShowSettings(false);
  };

  const accept = () => {
    grantAll();
    close({ marketing: 'granted', analytics: 'granted' });
  };

  const reject = () => {
    denyAll();
    close(DENIED_STATE);
  };

  /** Commits the per-purpose toggles exactly as chosen. */
  const saveSelection = () => {
    setConsent(draft);
    close(draft);
  };

  const revoke = () => {
    revokeConsent();
    close(DENIED_STATE);
  };

  const toggle = (purpose: keyof ConsentState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const status: ConsentStatus = e.target.checked ? 'granted' : 'denied';
    setDraft((d) => ({ ...d, [purpose]: status }));
  };

  const statusLabel = (state: ConsentState | null) => {
    if (!state) return 'Noch keine Auswahl';
    const parts = [
      `Statistik ${state.analytics === 'granted' ? 'aktiviert' : 'deaktiviert'}`,
      `Marketing ${state.marketing === 'granted' ? 'aktiviert' : 'deaktiviert'}`,
    ];
    return parts.join(' · ');
  };

  return (
    <>
      {/* ─── Equal-choice banner (only until a decision exists) ─── */}
      {showBanner && !showSettings && (
        /* Below lg the banner must clear the floating mobile nav pill
           (premium-mobile-nav.tsx: `fixed bottom-6 ... z-50`). The banner is
           z-60, so anchored to bottom-0 it covered the pill outright and
           elementFromPoint over the nav button returned the banner — the only
           navigation that exists on mobile was unreachable until the visitor
           dealt with consent. It now floats above the pill as a card, and only
           becomes a full-width bottom bar from lg up, where no pill exists. */
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Cookie-Einwilligung"
          className="fixed inset-x-0 bottom-24 z-[60] mx-3 rounded-2xl border border-gray-200 bg-white/95 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-gray-950/95 lg:mx-0 lg:rounded-none lg:border-x-0 lg:border-b-0 lg:border-t lg:bottom-0 lg:shadow-none"
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4 lg:px-8">
            {/* Tighter type below sm purely to reduce how much of a 844px phone
                viewport the first consent layer occupies. Not one word of the notice
                is removed or clamped: what it says is a legal question, only how
                much room it takes is a layout one. */}
            <p className="text-[12px] leading-snug text-gray-600 dark:text-gray-300 sm:text-[13px] sm:leading-relaxed">
              Wir verwenden technisch notwendige Speicherung – dafür ist keine Einwilligung nötig
              und die Website funktioniert vollständig. Mit Ihrer Einwilligung laden wir zusätzlich{' '}
              <span className="font-medium text-gray-800 dark:text-gray-100">
                Google Analytics (Statistik und Nutzungsanalyse)
              </span>
              , um zu verstehen, wie die Website genutzt wird, und sie zu verbessern, sowie{' '}
              <span className="font-medium text-gray-800 dark:text-gray-100">
                Google Ads (Marketing: Messung der Werbewirkung)
              </span>
              . „Alle akzeptieren“ erlaubt beides; unter „Einstellungen“ können Sie Statistik und
              Marketing einzeln auswählen. Details in unserer{' '}
              <Link to="/datenschutz" className="underline hover:text-gray-900 dark:hover:text-white">
                Datenschutzerklärung
              </Link>
              . Sie können Ihre Wahl jederzeit ändern.
            </p>
            <div className="flex flex-shrink-0 flex-wrap items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-[13px] font-medium text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900 dark:border-white/15 dark:text-gray-300 dark:hover:text-white"
              >
                Einstellungen
              </button>
              <button
                type="button"
                onClick={reject}
                className="rounded-lg border border-gray-300 px-5 py-2 text-[13px] font-semibold text-gray-800 transition-colors hover:border-gray-400 hover:bg-gray-50 dark:border-white/15 dark:text-gray-100 dark:hover:bg-white/[0.06]"
              >
                Ablehnen
              </button>
              <button
                type="button"
                onClick={accept}
                className="rounded-lg bg-gray-900 px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                Alle akzeptieren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Settings / revoke dialog (reopenable any time) ─── */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
          onClick={() => setShowSettings(false)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Cookie-Einstellungen"
            /* max-h + overflow-y-auto because the panel is taller than a phone in
               landscape (390px): all three actions — Ablehnen, Auswahl speichern,
               Alle akzeptieren — rendered below the fold with no way to scroll to
               them, so granular consent could not be saved at all in that
               orientation while "Alle akzeptieren" stayed reachable in the banner
               behind it. Rejecting or refining consent must never be harder to
               reach than accepting it. */
            className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-2xl bg-white p-6 shadow-2xl dark:bg-gray-950 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">
              Cookie-Einstellungen
            </h2>
            <p className="mb-4 text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">
              Aktueller Status:{' '}
              <span className="font-medium text-gray-900 dark:text-gray-200">
                {statusLabel(current)}
              </span>
            </p>

            <div className="mb-5 space-y-3 text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">
              <div className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
                <p className="font-medium text-gray-800 dark:text-gray-200">Technisch notwendig</p>
                <p>
                  Immer aktiv. Speichert z. B. Ihre Cookie-Auswahl und Anzeige-Einstellungen im
                  Browser. Kein Tracking. Die Website funktioniert auch ohne die beiden folgenden
                  Optionen vollständig.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={draft.analytics === 'granted'}
                    onChange={toggle('analytics')}
                    className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-gray-300 accent-gray-900 dark:border-white/20 dark:accent-white"
                  />
                  <span>
                    <span className="block font-medium text-gray-800 dark:text-gray-200">
                      Statistik und Nutzungsanalyse – Google Analytics
                    </span>
                    <span>
                      Hilft uns zu verstehen, wie die Website genutzt wird (z. B. welche Seiten
                      aufgerufen werden), damit wir sie verbessern können. Dabei wird eine
                      pseudonyme Kennung in einem Cookie gespeichert; die Daten sind nicht
                      vollständig anonym. Wird ausschließlich nach Ihrer Einwilligung geladen. Beim
                      Widerruf entfernen wir die zugehörigen First-Party-Cookies, soweit technisch
                      über die Website möglich. Details in unserer Datenschutzerklärung.
                    </span>
                  </span>
                </label>
              </div>

              <div className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={draft.marketing === 'granted'}
                    onChange={toggle('marketing')}
                    className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-gray-300 accent-gray-900 dark:border-white/20 dark:accent-white"
                  />
                  <span>
                    <span className="block font-medium text-gray-800 dark:text-gray-200">
                      Marketing – Google Ads
                    </span>
                    <span>
                      Wird nur nach Ihrer Einwilligung geladen und misst die Wirkung unserer
                      Anzeigen. Beim Widerruf entfernen wir die zugehörigen First-Party-Cookies,
                      soweit technisch über die Website möglich. Bereits übertragene Daten können
                      über die Website nicht nachträglich zurückgezogen werden.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5">
              {current && (current.marketing === 'granted' || current.analytics === 'granted') ? (
                <button
                  type="button"
                  onClick={revoke}
                  className="rounded-lg border border-gray-300 px-5 py-2 text-[13px] font-semibold text-gray-800 transition-colors hover:border-gray-400 hover:bg-gray-50 dark:border-white/15 dark:text-gray-100 dark:hover:bg-white/[0.06]"
                >
                  Einwilligung widerrufen
                </button>
              ) : (
                <button
                  type="button"
                  onClick={reject}
                  className="rounded-lg border border-gray-300 px-5 py-2 text-[13px] font-semibold text-gray-800 transition-colors hover:border-gray-400 hover:bg-gray-50 dark:border-white/15 dark:text-gray-100 dark:hover:bg-white/[0.06]"
                >
                  Ablehnen
                </button>
              )}
              <button
                type="button"
                onClick={saveSelection}
                className="rounded-lg border border-gray-300 px-5 py-2 text-[13px] font-semibold text-gray-800 transition-colors hover:border-gray-400 hover:bg-gray-50 dark:border-white/15 dark:text-gray-100 dark:hover:bg-white/[0.06]"
              >
                Auswahl speichern
              </button>
              <button
                type="button"
                onClick={accept}
                className="rounded-lg bg-gray-900 px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                Alle akzeptieren
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
