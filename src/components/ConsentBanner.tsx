import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  OPEN_CONSENT_EVENT,
  denyConsent,
  getStoredConsent,
  grantConsent,
  hasDecision,
  revokeConsent,
  type ConsentStatus,
} from '@/lib/consent';

// Cookie/consent UI. Renders:
//   • an equal-choice banner when no decision has been stored yet, and
//   • a settings dialog that can be reopened at any time (e.g. from the footer
//     "Cookie-Einstellungen" action) to change or revoke consent.
// Accept and reject are given equal visual weight; reject is never hidden.
export function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [current, setCurrent] = useState<ConsentStatus | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrent(getStoredConsent());
    setShowBanner(!hasDecision());

    const openSettings = () => {
      setCurrent(getStoredConsent());
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

  const accept = () => {
    grantConsent();
    setCurrent('granted');
    setShowBanner(false);
    setShowSettings(false);
  };

  const reject = () => {
    denyConsent();
    setCurrent('denied');
    setShowBanner(false);
    setShowSettings(false);
  };

  const revoke = () => {
    revokeConsent();
    setCurrent('denied');
    setShowSettings(false);
  };

  return (
    <>
      {/* ─── Equal-choice banner (only until a decision exists) ─── */}
      {showBanner && !showSettings && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Cookie-Einwilligung"
          className="fixed inset-x-0 bottom-0 z-[60] border-t border-gray-200 bg-white/95 backdrop-blur-md dark:border-white/10 dark:bg-gray-950/95"
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <p className="text-[13px] leading-relaxed text-gray-600 dark:text-gray-300">
              Wir verwenden technisch notwendige Speicherung. Mit Ihrer Einwilligung laden wir
              zusätzlich Google Ads, um Werbewirkung zu messen. Details in unserer{' '}
              <Link to="/datenschutz" className="underline hover:text-gray-900 dark:hover:text-white">
                Datenschutzerklärung
              </Link>
              . Sie können Ihre Wahl jederzeit ändern.
            </p>
            <div className="flex flex-shrink-0 flex-wrap items-center gap-2.5">
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
            className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-2xl dark:bg-gray-950 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">
              Cookie-Einstellungen
            </h2>
            <p className="mb-4 text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">
              Aktueller Status:{' '}
              <span className="font-medium text-gray-900 dark:text-gray-200">
                {current === 'granted'
                  ? 'Google Ads aktiviert'
                  : current === 'denied'
                    ? 'Nur notwendige Speicherung'
                    : 'Noch keine Auswahl'}
              </span>
            </p>

            <div className="mb-5 space-y-3 text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">
              <div className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
                <p className="font-medium text-gray-800 dark:text-gray-200">Technisch notwendig</p>
                <p>
                  Immer aktiv. Speichert z. B. Ihre Cookie-Auswahl und Anzeige-Einstellungen im
                  Browser. Kein Tracking.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  Marketing – Google Ads
                </p>
                <p>
                  Wird nur nach Ihrer Einwilligung geladen und misst die Wirkung unserer Anzeigen.
                  Beim Widerruf entfernen wir die zugehörigen First-Party-Cookies, soweit technisch
                  über die Website möglich. Bereits übertragene Daten können über die Website nicht
                  nachträglich zurückgezogen werden.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5">
              {current === 'granted' ? (
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
