// ─────────────────────────────────────────────────────────────────────────────
// Mobilnavigation der öffentlichen Seite — ein typografisches Register.
//
// WARUM SO UND NICHT ANDERS
//
// Vorher: ein dunkles Bottom-Sheet mit Federphysik, gestaffelten Einträgen,
// Icon-Kacheln und drei ineinander verschachtelten Akkordeons. Das widersprach
// COPY-BRIEF-3 §1 an fast jeder Stelle (Bewegung, Kontrast — `white/40` erreicht
// kein AA —, Effekte ohne Funktion) und sah aus wie jede zweite App-Vorlage.
// Dazu eine eigene Kopie der Aktiv-Logik, die gegen navigation-data.ts gedriftet
// war (/praxen und /prozessautomatisierung wurden nicht hervorgehoben), und
// Einträge als <button>, die per `navigate()` sprangen statt echte Verweise zu
// sein.
//
// Jetzt: eine ruhige, vollflächige Ebene auf Papier, die wie ein Register
// gesetzt ist. Ebene 1 zeigt drei nummerierte Hauptziele in großer Schrift und
// darunter die Nebenziele. Leistungen und Standorte öffnen je eine eigene Ebene
// (Drill-down) statt aufzuklappen — pro Bildschirm genau eine Entscheidung,
// dieselbe schrittweise Offenlegung wie auf dem Desktop:
//
//   Menü → Leistungen → KI-Telefonassistent → Für Arzt- und Zahnarztpraxen
//
// Die Handlung („Erstgespräch vereinbaren") steht auf jeder Ebene an derselben
// Stelle im Fuß. Der Schließen-Knopf liegt pixelgenau auf dem Menü-Auslöser,
// sodass sich der Auslöser zu einem X zu verwandeln scheint.
//
// GESTALTUNG nach COPY-BRIEF-3 §1: Bewegung 120–180 ms, nur Deckkraft und
// kleine Verschiebung, `prefers-reduced-motion` entfernt die Verschiebung;
// kein Text unter 14 px; Tap-Ziele ab 44 px; Füllfarbe nur für die Handlung.
//
// Die Ebene wird nur geöffnet gerendert. Das vorgerenderte Dokument enthält —
// wie vorher — nur den Auslöser; die Links der Desktop-Panels und des Footers
// sind für Crawler maßgeblich.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, UserRound } from 'lucide-react';
import {
  HAUPTSITZ_SLUG,
  LEISTUNGEN,
  LEISTUNGEN_AUSWEG,
  STANDORTE,
  istAktiv,
} from '@/lib/navigation-data';
import { Logo } from '@/components/Logo';
import { PubLinkButton, pubFocus } from '@/components/public/PublicUI';
import { useAuth } from '@/contexts/AuthContext';

/* ─── Ebenen ──────────────────────────────────────────────────────────── */

type Ebene =
  | { art: 'start' }
  | { art: 'leistungen' }
  | { art: 'leistung'; key: string }
  | { art: 'standorte' };

const START: Ebene = { art: 'start' };

function elternVon(ebene: Ebene): Ebene {
  return ebene.art === 'leistung' ? { art: 'leistungen' } : START;
}

function titelVon(ebene: Ebene): string {
  switch (ebene.art) {
    case 'start':
      return 'Menü';
    case 'leistungen':
      return 'Leistungen';
    case 'standorte':
      return 'Standorte';
    case 'leistung':
      return LEISTUNGEN.find((l) => l.key === ebene.key)?.label ?? 'Leistungen';
  }
}

function schluesselVon(ebene: Ebene): string {
  return ebene.art === 'leistung' ? `leistung:${ebene.key}` : ebene.art;
}

const NEBENZIELE = [
  { label: 'FAQ', href: '/faq' },
  { label: 'Blog', href: '/blog' },
  { label: 'Kontakt', href: '/kontakt' },
];

/* ─── Bewegung ────────────────────────────────────────────────────────── */

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Form des Auslösers — der Schließen-Knopf übernimmt sie exakt. */
const knopfForm =
  'inline-flex h-11 items-center gap-2.5 rounded-full border border-pub-hairline ' +
  'bg-white/95 pl-4 pr-[18px] text-[15px] font-semibold tracking-[-0.005em] text-pub-ink ' +
  'shadow-[0_1px_2px_rgba(11,15,20,0.05)] backdrop-blur transition-colors duration-150 ' +
  'active:bg-pub-paper-2 ' +
  pubFocus;

/**
 * Position des Auslösers. Der Schließen-Knopf im Dialog steht an derselben
 * Stelle, sodass sich der Auslöser zu einem X zu verwandeln scheint. Steht ein
 * Such-Auslöser daneben, sitzt er LINKS vom Menü — die rechte Kante bleibt.
 */
const knopfKlassen = `fixed top-[14px] right-4 lg:hidden ${knopfForm}`;

/**
 * Zwei Linien ungleicher Länge, die sich zu einem X drehen. Die ungleiche Länge
 * ist das einzige Detail, das hier „Handschrift" trägt — kein Glyph von der
 * Stange.
 */
function MenuGlyph({ offen, animiert }: { offen: boolean; animiert: boolean }) {
  const zu = { top: { rotate: 0, y: -3.5, width: 16 }, bottom: { rotate: 0, y: 3.5, width: 10 } };
  const auf = { top: { rotate: 45, y: 0, width: 16 }, bottom: { rotate: -45, y: 0, width: 16 } };
  const ziel = offen ? auf : zu;
  const start = animiert ? (offen ? zu : auf) : ziel;
  const transition = { duration: 0.18, ease: EASE_OUT };
  return (
    <span aria-hidden="true" className="relative flex h-4 w-4 items-center justify-end">
      <motion.span
        className="absolute right-0 h-[1.5px] rounded-full bg-current"
        initial={start.top}
        animate={ziel.top}
        transition={transition}
      />
      <motion.span
        className="absolute right-0 h-[1.5px] rounded-full bg-current"
        initial={start.bottom}
        animate={ziel.bottom}
        transition={transition}
      />
    </span>
  );
}

/* ─── Hauptkomponente ─────────────────────────────────────────────────── */

export function PremiumMobileNav({ sucheAusloeser }: { sucheAusloeser?: ReactNode } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [ebene, setEbene] = useState<Ebene>(START);
  // 1 = tiefer, -1 = zurück. Bestimmt nur die Richtung der kleinen Verschiebung.
  const [richtung, setRichtung] = useState<1 | -1>(1);
  // Wurde die Ebene durch eine Eingabe gewechselt, bekommt die neue Überschrift
  // den Fokus — Screenreader kündigen so den Wechsel an.
  const [fokusAufTitel, setFokusAufTitel] = useState(false);

  const location = useLocation();
  const { user, isLoading } = useAuth();
  const reduzieren = useReducedMotion();
  const dialogId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Nur beim Schließen per Knopf oder Escape geht der Fokus an den Auslöser
  // zurück. Nach einem Seitenwechsel gehört er der neuen Seite.
  const fokusZurueck = useRef(false);

  // Nach dem Mount abgeleitet, nie während des ersten Renders: dist/404.html ist
  // EIN Dokument für jede unbekannte URL, Server- und Browserpfad weichen also
  // ab (React #418/#425). Siehe Navigation.tsx.
  const [pfad, setPfad] = useState('');
  useEffect(() => {
    setPfad(location.pathname);
  }, [location.pathname]);

  const customerNav = {
    label: !isLoading && user ? 'Dashboard' : 'Kundenlogin',
    href: !isLoading && user ? '/app' : '/app/login',
  };

  const schliessen = useCallback((fokus = false) => {
    fokusZurueck.current = fokus;
    setIsOpen(false);
  }, []);

  const wechseln = useCallback((ziel: Ebene, dir: 1 | -1) => {
    setRichtung(dir);
    setFokusAufTitel(true);
    setEbene(ziel);
  }, []);

  // Seitenwechsel schließt.
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Jede Öffnung beginnt auf Ebene 1 — vorhersehbar statt „wo war ich".
  useEffect(() => {
    if (isOpen) return;
    setEbene(START);
    setRichtung(1);
    setFokusAufTitel(false);
  }, [isOpen]);

  // Neue Ebene beginnt oben.
  useEffect(() => {
    scrollRef.current?.scrollTo?.({ top: 0 });
  }, [ebene]);

  // Seite darunter festhalten. <html> UND <body>, sonst scrollt iOS Safari weiter.
  useEffect(() => {
    if (!isOpen) return;
    const html = document.documentElement;
    const body = document.body;
    const vorher = [html.style.overflow, body.style.overflow] as const;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = vorher[0];
      body.style.overflow = vorher[1];
    };
  }, [isOpen]);

  // Dialog-Semantik: Escape schließt, Tab bleibt im Dialog, Fokus rein und
  // wieder zurück.
  useEffect(() => {
    if (!isOpen) return;
    const trigger = triggerRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        schliessen(true);
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const fokussierbar = [
        ...dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
      ];
      if (fokussierbar.length === 0) return;
      const erstes = fokussierbar[0];
      const letztes = fokussierbar[fokussierbar.length - 1];
      if (e.shiftKey && document.activeElement === erstes) {
        e.preventDefault();
        letztes.focus();
      } else if (!e.shiftKey && document.activeElement === letztes) {
        e.preventDefault();
        erstes.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>('[data-erster-eintrag]')?.focus();
    }, 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
      if (fokusZurueck.current) trigger?.focus();
      fokusZurueck.current = false;
    };
  }, [isOpen, schliessen]);

  const verschiebung = reduzieren ? 0 : 20;
  const ebenenVarianten = {
    rein: (d: number) => ({ opacity: 0, x: d * verschiebung }),
    da: { opacity: 1, x: 0, transition: { duration: 0.18, ease: EASE_OUT } },
    raus: (d: number) => ({ opacity: 0, x: d * -verschiebung, transition: { duration: 0.12, ease: 'easeIn' as const } }),
  };

  const nav = (href: string) => ({
    href,
    aktiv: pfad === href,
    onNavigate: () => schliessen(false),
  });

  return (
    <>
      {/* AUSLÖSER — in der Kopfzeile, oben rechts, unterhalb von `lg`. Die
          Suche steht links daneben; „Menü" bleibt ganz rechts, damit der
          Schließen-Knopf weiterhin genau auf ihm liegt. */}
      <div className="fixed top-[14px] right-4 z-50 flex items-center gap-2 lg:hidden">
        {sucheAusloeser}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(true)}
          className={knopfForm}
          aria-label="Navigation öffnen"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={isOpen ? dialogId : undefined}
        >
          <MenuGlyph offen={false} animiert={false} />
          Menü
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobilnavigation"
            ref={dialogRef}
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="fixed inset-0 z-[70] flex h-[100dvh] flex-col bg-pub-paper lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.18, ease: EASE_OUT } }}
            exit={{ opacity: 0, transition: { duration: 0.14, ease: 'easeIn' } }}
          >
            {/* KOPF — deckungsgleich mit der Seitenkopfzeile */}
            <div className="flex h-[72px] shrink-0 items-center px-6">
              <Link
                to="/"
                aria-label="Cogniiq Startseite"
                onClick={() => schliessen(false)}
                className={`rounded-md ${pubFocus}`}
              >
                <Logo />
              </Link>
            </div>
            <button
              type="button"
              onClick={() => schliessen(true)}
              className={knopfKlassen}
              aria-label="Navigation schließen"
            >
              <MenuGlyph offen animiert />
              Schließen
            </button>

            {/* EBENEN */}
            <div
              ref={scrollRef}
              className="relative flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
            >
              <AnimatePresence mode="wait" initial={false} custom={richtung}>
                <motion.div
                  key={schluesselVon(ebene)}
                  custom={richtung}
                  variants={ebenenVarianten}
                  initial="rein"
                  animate="da"
                  exit="raus"
                  className="px-6 pb-10"
                >
                  {ebene.art === 'start' && (
                    <EbeneStart
                      pfad={pfad}
                      onLeistungen={() => wechseln({ art: 'leistungen' }, 1)}
                      onStandorte={() => wechseln({ art: 'standorte' }, 1)}
                      nav={nav}
                    />
                  )}

                  {ebene.art === 'leistungen' && (
                    <EbeneRahmen
                      zurueck={titelVon(elternVon(ebene))}
                      onZurueck={() => wechseln(elternVon(ebene), -1)}
                      titel="Leistungen"
                      fokus={fokusAufTitel}
                    >
                      <ul className="mt-6 divide-y divide-pub-hairline-soft border-y border-pub-hairline-soft">
                        {LEISTUNGEN.map((leistung, i) => {
                          const aktiv =
                            pfad === leistung.href ||
                            [...leistung.nischen, ...leistung.abschluss].some((z) => z.href === pfad);
                          return (
                            <li key={leistung.key}>
                              <button
                                type="button"
                                onClick={() => wechseln({ art: 'leistung', key: leistung.key }, 1)}
                                className={zeilenKlassen('py-4')}
                              >
                                <Index n={i + 1} oben />
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center gap-2 text-[20px] font-semibold leading-snug tracking-[-0.015em] text-pub-ink">
                                    {leistung.label}
                                    {aktiv && <AktivMarke />}
                                  </span>
                                  <span className="mt-1 block text-[15px] leading-relaxed text-pub-ink-3">
                                    {leistung.claim}
                                  </span>
                                </span>
                                <Weiter />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                      <Link
                        to={LEISTUNGEN_AUSWEG.href}
                        onClick={() => schliessen(false)}
                        aria-current={pfad === LEISTUNGEN_AUSWEG.href ? 'page' : undefined}
                        className={zeilenKlassen('mt-4 min-h-[52px] text-[15px] font-medium text-pub-ink-2')}
                      >
                        <span className="flex-1">{LEISTUNGEN_AUSWEG.label}</span>
                        <ArrowRight size={17} aria-hidden="true" className="shrink-0 text-pub-ink-3" />
                      </Link>
                    </EbeneRahmen>
                  )}

                  {ebene.art === 'leistung' && (
                    <EbeneLeistung
                      leistungKey={ebene.key}
                      fokus={fokusAufTitel}
                      onZurueck={() => wechseln(elternVon(ebene), -1)}
                      nav={nav}
                    />
                  )}

                  {ebene.art === 'standorte' && (
                    <EbeneRahmen
                      zurueck={titelVon(elternVon(ebene))}
                      onZurueck={() => wechseln(elternVon(ebene), -1)}
                      titel="Standorte"
                      fokus={fokusAufTitel}
                    >
                      <Gruppe titel="Städte">
                        {STANDORTE.staedte.map((stadt) => (
                          <Ziel key={stadt.href} {...nav(stadt.href)} groesse="gross">
                            {stadt.label}
                            {stadt.href === HAUPTSITZ_SLUG && (
                              <span className="ml-auto pl-3 text-[14px] font-medium text-pub-ink-3">
                                Hauptsitz
                              </span>
                            )}
                          </Ziel>
                        ))}
                      </Gruppe>
                      <Gruppe titel="Regionen">
                        {STANDORTE.regionen.map((region) => (
                          <Ziel key={region.href} {...nav(region.href)} groesse="gross">
                            {region.label}
                          </Ziel>
                        ))}
                      </Gruppe>
                    </EbeneRahmen>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* FUSS — die eine Handlung, auf jeder Ebene an derselben Stelle */}
            <div className="shrink-0 border-t border-pub-hairline bg-pub-paper px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <PubLinkButton
                to="/kontakt"
                size="lg"
                icon={ArrowRight}
                iconTrailing
                className="w-full"
                onClick={() => schliessen(false)}
              >
                Erstgespräch vereinbaren
              </PubLinkButton>
              <Link
                to={customerNav.href}
                onClick={() => schliessen(false)}
                className={`mt-2 flex min-h-[44px] items-center justify-center gap-2 rounded-full text-[15px] font-medium text-pub-ink-2 transition-colors duration-150 active:text-pub-ink ${pubFocus}`}
              >
                <UserRound size={17} aria-hidden="true" className="text-pub-ink-3" />
                {customerNav.label}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Ebene 1 ─────────────────────────────────────────────────────────── */

type NavProps = { href: string; aktiv: boolean; onNavigate: () => void };

function EbeneStart({
  pfad,
  onLeistungen,
  onStandorte,
  nav,
}: {
  pfad: string;
  onLeistungen: () => void;
  onStandorte: () => void;
  nav: (href: string) => NavProps;
}) {
  const ueberUns = nav('/ueber-uns');
  return (
    <>
      <h2 className="sr-only">Menü</h2>
      <ul className="mt-4 divide-y divide-pub-hairline-soft border-b border-pub-hairline-soft">
        <li>
          <button type="button" data-erster-eintrag onClick={onLeistungen} className={zeilenKlassen('min-h-[76px]')}>
            <Index n={1} />
            <HauptLabel aktiv={istAktiv(pfad, 'leistungen')}>
              Leistungen
            </HauptLabel>
            <Weiter />
          </button>
        </li>
        <li>
          <button type="button" onClick={onStandorte} className={zeilenKlassen('min-h-[76px]')}>
            <Index n={2} />
            <HauptLabel aktiv={istAktiv(pfad, 'standorte')}>
              Standorte
            </HauptLabel>
            <Weiter />
          </button>
        </li>
        <li>
          <Link
            to={ueberUns.href}
            onClick={ueberUns.onNavigate}
            aria-current={ueberUns.aktiv ? 'page' : undefined}
            className={zeilenKlassen('min-h-[76px]')}
          >
            <Index n={3} />
            <HauptLabel aktiv={ueberUns.aktiv}>
              Über uns
            </HauptLabel>
          </Link>
        </li>
      </ul>

      <Gruppe titel="Mehr">
        {NEBENZIELE.map((z) => (
          <Ziel
            key={z.href}
            {...nav(z.href)}
            aktiv={z.href === '/blog' ? pfad.startsWith('/blog') : pfad === z.href}
          >
            {z.label}
          </Ziel>
        ))}
      </Gruppe>
    </>
  );
}

/* ─── Ebene 3: eine Leistung ──────────────────────────────────────────── */

function EbeneLeistung({
  leistungKey,
  fokus,
  onZurueck,
  nav,
}: {
  leistungKey: string;
  fokus: boolean;
  onZurueck: () => void;
  nav: (href: string) => NavProps;
}) {
  const leistung = LEISTUNGEN.find((l) => l.key === leistungKey);
  if (!leistung) return null;
  const ueberblick = nav(leistung.href);
  return (
    <EbeneRahmen zurueck="Leistungen" onZurueck={onZurueck} titel={leistung.label} fokus={fokus}>
      <p className="mt-2 text-[17px] leading-relaxed text-pub-ink-3">{leistung.claim}</p>

      <Link
        to={ueberblick.href}
        onClick={ueberblick.onNavigate}
        aria-current={ueberblick.aktiv ? 'page' : undefined}
        className={`mt-6 flex min-h-[60px] items-center gap-3 rounded-2xl border border-pub-hairline px-5 text-[17px] font-semibold text-pub-ink transition-colors duration-150 active:bg-pub-paper-2 ${pubFocus}`}
      >
        <span className="flex-1">Überblick</span>
        {ueberblick.aktiv && <AktivMarke />}
        <ArrowRight size={18} aria-hidden="true" className="shrink-0 text-pub-ink-3" />
      </Link>

      <Gruppe titel="Für wen">
        {leistung.nischen.map((z) => (
          <Ziel key={z.href} {...nav(z.href)}>
            {z.label}
          </Ziel>
        ))}
      </Gruppe>

      <Gruppe titel="Nächster Schritt">
        {leistung.abschluss.map((z) => (
          <Ziel key={z.href} {...nav(z.href)} pfeil>
            {z.label}
          </Ziel>
        ))}
      </Gruppe>
    </EbeneRahmen>
  );
}

/* ─── Bausteine ───────────────────────────────────────────────────────── */

function zeilenKlassen(extra = '') {
  return (
    `group -mx-3 flex w-[calc(100%+1.5rem)] items-center gap-4 rounded-xl px-3 text-left ` +
    `transition-colors duration-150 active:bg-pub-ink/[0.04] ${pubFocus} ${extra}`
  );
}

function EbeneRahmen({
  zurueck,
  onZurueck,
  titel,
  fokus,
  children,
}: {
  zurueck: string;
  onZurueck: () => void;
  titel: string;
  fokus: boolean;
  children: ReactNode;
}) {
  const titelRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (fokus) titelRef.current?.focus();
    // Nur beim Einhängen der Ebene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <button
        type="button"
        data-erster-eintrag
        onClick={onZurueck}
        aria-label={`Zurück zu ${zurueck}`}
        className={`-ml-2 mt-1 inline-flex min-h-[44px] items-center gap-1 rounded-lg pl-1 pr-3 text-[15px] font-medium text-pub-ink-2 transition-colors duration-150 active:text-pub-ink ${pubFocus}`}
      >
        <ChevronLeft size={18} aria-hidden="true" />
        {zurueck}
      </button>
      <h2
        ref={titelRef}
        tabIndex={-1}
        className="mt-3 text-[32px] font-semibold leading-[1.1] tracking-[-0.025em] text-pub-ink outline-none"
      >
        {titel}
      </h2>
      {children}
    </>
  );
}

function Gruppe({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <section className="mt-9">
      <h3 className="text-[14px] font-semibold uppercase tracking-[0.08em] text-pub-ink-4">{titel}</h3>
      <ul className="mt-2 divide-y divide-pub-hairline-soft border-y border-pub-hairline-soft">{children}</ul>
    </section>
  );
}

function Ziel({
  href,
  aktiv,
  onNavigate,
  groesse = 'normal',
  pfeil = false,
  children,
}: NavProps & { groesse?: 'normal' | 'gross'; pfeil?: boolean; children: ReactNode }) {
  return (
    <li>
      <Link
        to={href}
        onClick={onNavigate}
        aria-current={aktiv ? 'page' : undefined}
        className={zeilenKlassen(
          `min-h-[56px] py-2 font-medium ${
            groesse === 'gross' ? 'text-[19px] tracking-[-0.01em]' : 'text-[17px]'
          } ${aktiv ? 'text-pub-ink' : 'text-pub-ink-2'}`
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {children}
          {aktiv && <AktivMarke />}
        </span>
        {pfeil && <ArrowRight size={17} aria-hidden="true" className="shrink-0 text-pub-ink-3" />}
      </Link>
    </li>
  );
}

function HauptLabel({ aktiv, children }: { aktiv: boolean; children: ReactNode }) {
  return (
    <>
      <span className="flex-1 text-[28px] font-semibold leading-none tracking-[-0.025em] text-pub-ink">{children}</span>
      {aktiv && <AktivMarke />}
    </>
  );
}

/** Nummer im Register — dekorativ, daher `aria-hidden`. */
function Index({ n, oben = false }: { n: number; oben?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`w-7 shrink-0 text-[14px] font-medium tabular-nums text-pub-ink-4 ${oben ? 'self-start pt-[5px]' : ''}`}
    >
      {String(n).padStart(2, '0')}
    </span>
  );
}

/** Sichtbar statt nur farbig: „Aktuell" liest jeder, einen Punkt deutet nicht jeder. */
function AktivMarke() {
  return <span className="ml-auto shrink-0 pl-3 text-[14px] font-medium text-pub-ink-3">Aktuell</span>;
}

function Weiter() {
  return (
    <ChevronRight
      size={20}
      aria-hidden="true"
      className="shrink-0 text-pub-ink-4 transition-transform duration-150 group-active:translate-x-0.5"
    />
  );
}
