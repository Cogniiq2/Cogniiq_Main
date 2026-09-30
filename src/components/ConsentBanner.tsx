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
import { spotlightHandlers } from '@/lib/publicMotion';

// Cookie/consent UI. Renders:
//   • an equal-choice banner when no decision has been stored yet, and
//   • a settings dialog that can be reopened at any time (e.g. from the footer
//     "Cookie-Einstellungen" action) to change or revoke consent.
// Accept and reject are given equal visual weight; reject is never hidden.
//
// Statistik (GA4) and Marketing (Google Ads) are INDEPENDENT purposes: each can
// be granted or denied on its own. "Alle akzeptieren" grants both, and the
// banner text names both purposes so that single click is informed.
//
// DESIGN NOTE. The first layer is a single ink card, not a full-width bar: a
// bar reads as a browser chrome interruption, a card reads as a considered
// element of the page. Every word of the notice is unchanged — what it says is
// a legal question, how it is set is a design one. Both layers mount only
// after the stored decision has been read, so their entrance animations never
// touch the prerendered HTML.

const spotlight = spotlightHandlers();

const focusOnInk =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-pub-ink';
const focusOnPaper =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2';

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
    const el = dialogRef.current?.querySelector<HTMLElement>('button, a, input, [tabindex]');
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

  const hasGrant =
    current !== null && (current.marketing === 'granted' || current.analytics === 'granted');

  return (
    <>
      {/* ─── Equal-choice banner (only until a decision exists) ─── */}
      {showBanner && !showSettings && (
        /* Below lg the card must clear the floating mobile nav pill
           (premium-mobile-nav.tsx: `fixed bottom-6 ... z-50`). The card is
           z-60 and anchored to bottom-3, so it floats above the pill instead of
           covering it — the only navigation that exists on mobile stays
           reachable while consent is still open. From lg up it becomes a
           bottom-left card of fixed width, which is where a visitor reading a
           German-language page has already finished reading the line. */
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Cookie-Einwilligung"
          {...spotlight}
          className="cq-consent-in cq-surface cq-surface-edge fixed inset-x-3 bottom-3 z-[60] max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain rounded-[22px] bg-pub-ink text-white ring-1 ring-white/[0.08] lg:inset-x-auto lg:bottom-6 lg:left-6 lg:w-[440px]"
        >
          <div className="p-5 sm:p-6">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full rounded-full bg-white/40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-white/60">
                Cookies &amp; Einwilligung
              </p>
            </div>

            {/* Tighter type below sm purely to reduce how much of a 844px phone
                viewport the first consent layer occupies. Not one word of the notice
                is removed or clamped: what it says is a legal question, only how
                much room it takes is a layout one. */}
            <p className="text-[12.5px] leading-[1.55] text-white/70 sm:text-[13.5px] sm:leading-[1.6]">
              Wir verwenden technisch notwendige Speicherung – dafür ist keine Einwilligung nötig
              und die Website funktioniert vollständig. Mit Ihrer Einwilligung laden wir zusätzlich{' '}
              <span className="font-medium text-white">
                Google Analytics (Statistik und Nutzungsanalyse)
              </span>
              , um zu verstehen, wie die Website genutzt wird, und sie zu verbessern, sowie{' '}
              <span className="font-medium text-white">
                Google Ads (Marketing: Messung der Werbewirkung)
              </span>
              . „Alle akzeptieren“ erlaubt beides; unter „Einstellungen“ können Sie Statistik und
              Marketing einzeln auswählen. Details in unserer{' '}
              <Link
                to="/datenschutz"
                className={`cq-underline font-medium text-white ${focusOnInk} focus-visible:rounded-sm`}
              >
                Datenschutzerklärung
              </Link>
              . Sie können Ihre Wahl jederzeit ändern.
            </p>

            {/* Reject and accept: same size, same row, same weight of type. The
                only difference is fill, and the fill does not make one of them
                the "right" answer. */}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={reject}
                className={`inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-white/25 px-3 text-[13.5px] font-semibold text-white sm:px-4 sm:text-[14px] transition-[background-color,border-color,transform] duration-200 hover:border-white/50 hover:bg-white/[0.06] active:scale-[0.98] ${focusOnInk}`}
              >
                Ablehnen
              </button>
              <button
                type="button"
                onClick={accept}
                className={`inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full bg-white px-3 text-[13.5px] font-semibold text-pub-ink sm:px-4 sm:text-[14px] transition-[background-color,transform] duration-200 hover:bg-white/90 active:scale-[0.98] ${focusOnInk}`}
              >
                Alle akzeptieren
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className={`cq-underline mt-3.5 inline-flex min-h-[32px] items-center text-[13px] font-medium text-white/65 hover:text-white ${focusOnInk} focus-visible:rounded-sm`}
            >
              Einstellungen
            </button>
          </div>
        </div>
      )}

      {/* ─── Settings / revoke dialog (reopenable any time) ─── */}
      {showSettings && (
        <div
          className="cq-fade-in fixed inset-0 z-[70] flex items-end justify-center bg-pub-ink/45 backdrop-blur-[6px] sm:items-center sm:p-6"
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
            className="cq-sheet-in max-h-[calc(100dvh-2rem)] w-full max-w-[560px] overflow-y-auto overscroll-contain rounded-t-[26px] bg-white text-pub-ink shadow-[0_32px_96px_-24px_rgba(11,15,20,0.5)] ring-1 ring-pub-hairline sm:rounded-[26px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 sm:px-8 sm:pt-8">
              <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-pub-ink-3">
                Cookies &amp; Einwilligung
              </p>
              <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-pub-ink">
                Cookie-Einstellungen
              </h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-pub-ink-3">
                Aktueller Status:{' '}
                <span className="font-medium text-pub-ink">{statusLabel(current)}</span>
              </p>
            </div>

            <div className="mt-6 divide-y divide-pub-hairline-soft border-y border-pub-hairline-soft">
              {/* Always-on row. The control is a static "Immer aktiv" mark, not
                  a disabled switch — a switch that cannot move invites a tap. */}
              <div className="flex items-start gap-5 px-6 py-5 sm:px-8">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-pub-ink">Technisch notwendig</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-pub-ink-3">
                    Immer aktiv. Speichert z. B. Ihre Cookie-Auswahl und Anzeige-Einstellungen im
                    Browser. Kein Tracking. Die Website funktioniert auch ohne die beiden folgenden
                    Optionen vollständig.
                  </p>
                </div>
                <span className="mt-0.5 inline-flex h-[26px] shrink-0 items-center rounded-full bg-pub-verify-wash px-2.5 text-[11.5px] font-semibold text-pub-verify">
                  Immer aktiv
                </span>
              </div>

              <label className="flex cursor-pointer items-start gap-5 px-6 py-5 sm:px-8">
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-pub-ink">
                    Statistik und Nutzungsanalyse – Google Analytics
                  </span>
                  <span className="mt-1 block text-[13.5px] leading-relaxed text-pub-ink-3">
                    Hilft uns zu verstehen, wie die Website genutzt wird (z. B. welche Seiten
                    aufgerufen werden), damit wir sie verbessern können. Dabei wird eine
                    pseudonyme Kennung in einem Cookie gespeichert; die Daten sind nicht
                    vollständig anonym. Wird ausschließlich nach Ihrer Einwilligung geladen. Beim
                    Widerruf entfernen wir die zugehörigen First-Party-Cookies, soweit technisch
                    über die Website möglich. Details in unserer Datenschutzerklärung.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={draft.analytics === 'granted'}
                  onChange={toggle('analytics')}
                  className="sr-only"
                />
                <span className="cq-switch mt-0.5" aria-hidden="true" />
              </label>

              <label className="flex cursor-pointer items-start gap-5 px-6 py-5 sm:px-8">
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-pub-ink">
                    Marketing – Google Ads
                  </span>
                  <span className="mt-1 block text-[13.5px] leading-relaxed text-pub-ink-3">
                    Wird nur nach Ihrer Einwilligung geladen und misst die Wirkung unserer
                    Anzeigen. Beim Widerruf entfernen wir die zugehörigen First-Party-Cookies,
                    soweit technisch über die Website möglich. Bereits übertragene Daten können
                    über die Website nicht nachträglich zurückgezogen werden.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={draft.marketing === 'granted'}
                  onChange={toggle('marketing')}
                  className="sr-only"
                />
                <span className="cq-switch mt-0.5" aria-hidden="true" />
              </label>
            </div>

            <div className="flex flex-col gap-2.5 px-6 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-8 sm:py-6">
              {hasGrant ? (
                <button
                  type="button"
                  onClick={revoke}
                  className={`inline-flex h-11 items-center justify-center rounded-full border border-pub-ink/20 px-5 text-[14px] font-semibold text-pub-ink transition-[border-color,background-color,transform] duration-200 hover:border-pub-ink/45 hover:bg-pub-paper-2 active:scale-[0.98] ${focusOnPaper}`}
                >
                  Einwilligung widerrufen
                </button>
              ) : (
                <button
                  type="button"
                  onClick={reject}
                  className={`inline-flex h-11 items-center justify-center rounded-full border border-pub-ink/20 px-5 text-[14px] font-semibold text-pub-ink transition-[border-color,background-color,transform] duration-200 hover:border-pub-ink/45 hover:bg-pub-paper-2 active:scale-[0.98] ${focusOnPaper}`}
                >
                  Ablehnen
                </button>
              )}
              <button
                type="button"
                onClick={saveSelection}
                className={`inline-flex h-11 items-center justify-center rounded-full border border-pub-ink/20 px-5 text-[14px] font-semibold text-pub-ink transition-[border-color,background-color,transform] duration-200 hover:border-pub-ink/45 hover:bg-pub-paper-2 active:scale-[0.98] ${focusOnPaper}`}
              >
                Auswahl speichern
              </button>
              <button
                type="button"
                onClick={accept}
                className={`inline-flex h-11 items-center justify-center rounded-full bg-pub-ink px-5 text-[14px] font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-[#1f2933] active:scale-[0.98] ${focusOnPaper}`}
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
