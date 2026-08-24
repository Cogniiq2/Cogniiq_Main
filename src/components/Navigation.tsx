// ─────────────────────────────────────────────────────────────────────────────
// Öffentliche Hauptnavigation.
//
// AUFBAU: SCHRITTWEISE OFFENLEGUNG
//
// Vorher standen im Leistungs-Panel 37 Verweise gleichzeitig, in vier Spalten,
// alle im selben visuellen Gewicht und aus drei verschiedenen Ordnungsachsen
// gemischt (Leistung, Problem, Unternehmen). Dazu acht gleichrangige Einträge in
// der Kopfzeile. Wer eine Sache suchte, musste alles lesen.
//
// Jetzt: Ebene 1 beantwortet „Was macht ihr?" mit drei Antworten. Ebene 2
// beantwortet „Für wen?" und erscheint erst, wenn eine Leistung gewählt ist.
// Die Kopfzeile trägt drei Ziele plus Handlung.
//
// Die Struktur liegt in src/lib/navigation-data.ts — eine Quelle für diese
// Datei und die Mobilnavigation, damit beide nicht wieder auseinanderlaufen.
//
// BEDIENUNG
//
// Die Panels öffnen auf Zeigen UND auf Klick, Eingabe- oder Leertaste. Vorher
// öffneten sie ausschließlich auf `mouseenter`: Die Auslöser waren `<button>`
// mit `aria-expanded`, das für Tastaturbedienung immer „false" meldete, weil
// kein Klick- oder Fokus-Handler existierte. Wer mit der Tastatur navigiert, kam
// nicht in das Menü. Escape schließt und gibt den Fokus zurück; Pfeiltasten
// wechseln in der Leistungsspalte.
//
// GESTALTUNG nach COPY-BRIEF-3 §1: kein Text unter 14 px (vorher 10–13 px),
// Bewegung höchstens 180 ms und nur Deckkraft plus kleine Verschiebung,
// Trennung durch Raum, Akzentfarbe ausschließlich für die Handlung.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowUpRight, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';
import { PremiumMobileNav } from './ui/premium-mobile-nav';
import { ScrollProgress } from './ScrollProgress';
import { SectionRail } from './SectionRail';
import { useAuth } from '@/contexts/AuthContext';
import {
  HAUPTSITZ_SLUG,
  LEISTUNGEN,
  LEISTUNGEN_AUSWEG,
  STANDORTE,
  istAktiv,
} from '@/lib/navigation-data';

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** §1.4: höchstens 180 ms, nur Deckkraft und kleine Verschiebung. */
const panelMotion = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.18, ease: 'easeOut' as const },
};

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  // Merkt sich, welches Panel per Klick geöffnet wurde.
  //
  // Ohne diese Unterscheidung schließt ein Klick das Panel sofort wieder: Ein
  // Zeigegerät sendet `mouseenter` VOR `click`, das Panel ist beim Klick also
  // längst offen, und ein reines Umschalten macht daraus ein Schließen —
  // Klicken zum Öffnen wäre unmöglich. Zeigen öffnet, ohne die Marke zu setzen;
  // der erste Klick übernimmt das offene Panel, der zweite schließt es.
  const perKlickGeoeffnet = useRef<string | null>(null);

  const customerNav = {
    label: !isLoading && user ? 'Dashboard' : 'Kundenlogin',
    href: !isLoading && user ? '/app' : '/app/login',
  };

  // Active-link styling is derived AFTER mount, never during the first render.
  //
  // dist/404.html is ONE prerendered document that Netlify serves under every
  // unknown URL, so the pathname the browser hydrates at is not the pathname the
  // server rendered. Highlighting from `location.pathname` during hydration
  // therefore disagreed with the served markup on any 404 under a highlighted
  // section — /blog/kein-artikel marked the Blog link active against markup that
  // had it inactive, which is React #418/#425 on every unknown blog URL. Both
  // sides now start unhighlighted and the effect highlights immediately after.
  const [activePath, setActivePath] = useState('');

  useEffect(() => {
    setActivePath(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setActiveMenu(null);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const openMenu = useCallback((name: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMenu(name);
  }, []);

  const closeMenu = useCallback(() => {
    closeTimer.current = setTimeout(() => setActiveMenu(null), 120);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const closeNow = useCallback(
    (fokusZurueck?: string) => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setActiveMenu(null);
      perKlickGeoeffnet.current = null;
      if (fokusZurueck) triggerRefs.current[fokusZurueck]?.focus();
    },
    []
  );

  /** Klick auf einen Auslöser: übernehmen, wenn per Zeigen geöffnet; sonst umschalten. */
  const toggleMenu = useCallback(
    (name: string) => {
      if (perKlickGeoeffnet.current === name) {
        closeNow();
        return;
      }
      perKlickGeoeffnet.current = name;
      openMenu(name);
    },
    [closeNow, openMenu]
  );

  // Escape schließt; ein Klick oder Fokus außerhalb ebenfalls.
  useEffect(() => {
    if (!activeMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeNow(activeMenu);
    };
    const onOutside = (e: Event) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        closeNow();
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onOutside);
    document.addEventListener('focusin', onOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onOutside);
      document.removeEventListener('focusin', onOutside);
    };
  }, [activeMenu, closeNow]);

  return (
    <>
      <motion.nav
        ref={navRef}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-white/[0.97] dark:bg-gray-950/[0.97] backdrop-blur-xl border-b border-gray-100/80 dark:border-white/[0.05] shadow-[0_1px_0_0_rgba(0,0,0,0.04)]'
            : 'bg-transparent'
        }`}
        role="navigation"
        aria-label="Hauptnavigation"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">

            {/* LOGO */}
            <Link to="/" aria-label="Cogniiq Startseite" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="flex items-center"
              >
                <Logo />
              </motion.div>
            </Link>

            {/* MITTE — drei Ziele, mehr nicht */}
            <motion.div
              className="hidden lg:flex items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
            >
              <NavDropdownTrigger
                name="leistungen"
                label="Leistungen"
                isActive={istAktiv(activePath, 'leistungen')}
                isOpen={activeMenu === 'leistungen'}
                onOpen={() => openMenu('leistungen')}
                onClose={closeMenu}
                onToggle={() => toggleMenu('leistungen')}
                registerRef={(el) => (triggerRefs.current.leistungen = el)}
              />
              <NavDropdownTrigger
                name="standorte"
                label="Standorte"
                isActive={istAktiv(activePath, 'standorte')}
                isOpen={activeMenu === 'standorte'}
                onOpen={() => openMenu('standorte')}
                onClose={closeMenu}
                onToggle={() => toggleMenu('standorte')}
                registerRef={(el) => (triggerRefs.current.standorte = el)}
              />
              <SimpleNavItem label="Über uns" href="/ueber-uns" isActive={activePath === '/ueber-uns'} />
            </motion.div>

            {/* RECHTS — genau eine Handlung */}
            <motion.div
              className="hidden lg:flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <SimpleNavItem
                label={customerNav.label}
                href={customerNav.href}
                isActive={activePath.startsWith('/app')}
                className="min-w-[104px] text-center"
              />
              <Link
                to="/kontakt"
                className="group relative flex items-center gap-1.5 px-5 py-2.5 bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-sm font-semibold tracking-wide rounded-full overflow-hidden transition-colors duration-200"
              >
                <span className="relative z-10">Erstgespräch</span>
                <ArrowUpRight size={14} className="relative z-10" />
                <div className="absolute inset-0 bg-gray-800 dark:bg-gray-100 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out" />
              </Link>
            </motion.div>

          </div>
        </div>

        <AnimatePresence>
          {activeMenu === 'leistungen' && (
            <LeistungenPanel
              onMouseEnter={cancelClose}
              onMouseLeave={closeMenu}
              currentPath={activePath}
              onNavigate={() => closeNow()}
            />
          )}
          {activeMenu === 'standorte' && (
            <StandortePanel
              onMouseEnter={cancelClose}
              onMouseLeave={closeMenu}
              currentPath={activePath}
            />
          )}
        </AnimatePresence>
      </motion.nav>

      <PremiumMobileNav />
      <ScrollProgress />
      {/* Section orientation for every public page, not just the homepage. The rail
          hides itself on pages with fewer than three qualifying sections. */}
      <SectionRail />
    </>
  );
}

/* ─── Einfacher Eintrag ───────────────────────────────────────────────── */
function SimpleNavItem({
  label, href, isActive, className = '',
}: {
  label: string; href: string; isActive: boolean; className?: string;
}) {
  return (
    <Link to={href} className={`relative px-4 py-2 group ${className}`}>
      <span className={`text-sm font-medium tracking-wide transition-colors duration-200 ${
        isActive
          ? 'text-gray-900 dark:text-gray-100'
          : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100'
      }`}>
        {label}
      </span>
      <span
        aria-hidden="true"
        className={`absolute bottom-0 left-4 right-4 h-px bg-gray-900 dark:bg-gray-100 origin-left transition-transform duration-200 ease-out ${
          isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
        }`}
      />
    </Link>
  );
}

/* ─── Auslöser ────────────────────────────────────────────────────────── */
function NavDropdownTrigger({
  name, label, isActive, isOpen, onOpen, onClose, onToggle, registerRef,
}: {
  name: string;
  label: string;
  isActive: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
  registerRef: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={registerRef}
      type="button"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown' && !isOpen) {
          e.preventDefault();
          onOpen();
        }
      }}
      className="relative flex items-center gap-1 px-4 py-2 group"
      aria-expanded={isOpen}
      aria-controls={`nav-panel-${name}`}
      aria-haspopup="true"
    >
      <span className={`text-sm font-medium tracking-wide transition-colors duration-200 ${
        isActive || isOpen
          ? 'text-gray-900 dark:text-gray-100'
          : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100'
      }`}>
        {label}
      </span>
      <ChevronDown
        size={14}
        aria-hidden="true"
        className={`text-gray-400 transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`}
      />
      <span
        aria-hidden="true"
        className={`absolute bottom-0 left-4 right-4 h-px bg-gray-900 dark:bg-gray-100 origin-left transition-transform duration-200 ease-out ${
          isActive || isOpen ? 'scale-x-100' : 'scale-x-0'
        }`}
      />
    </button>
  );
}

const PANEL_FLAECHE =
  'absolute top-full left-0 right-0 bg-white/[0.98] dark:bg-gray-950/[0.98] backdrop-blur-xl border-b border-gray-100 dark:border-white/[0.05]';

/* ─── Leistungen: Ebene 1 links, Ebene 2 rechts ───────────────────────── */
function LeistungenPanel({
  onMouseEnter, onMouseLeave, currentPath, onNavigate,
}: {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  currentPath: string;
  onNavigate: () => void;
}) {
  // Beim Öffnen steht die Leistung vorn, in der sich der Besucher gerade
  // befindet — sonst die erste. Er sieht damit sofort seinen eigenen Kontext.
  const startIndex = Math.max(
    0,
    LEISTUNGEN.findIndex(
      (l) => currentPath.startsWith(l.href) || l.nischen.some((n) => currentPath.startsWith(n.href))
    )
  );
  const [gewaehlt, setGewaehlt] = useState(startIndex);
  const aktiv = LEISTUNGEN[gewaehlt];

  return (
    <motion.div
      {...panelMotion}
      id="nav-panel-leistungen"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={PANEL_FLAECHE}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-10">
        <div className="grid grid-cols-[1.1fr_1fr] gap-16">

          {/* Ebene 1 — drei Antworten auf „Was macht ihr?" */}
          <div
            role="tablist"
            aria-label="Leistungen"
            className="space-y-1"
            onKeyDown={(e) => {
              if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
              e.preventDefault();
              setGewaehlt((i) =>
                e.key === 'ArrowDown'
                  ? (i + 1) % LEISTUNGEN.length
                  : (i - 1 + LEISTUNGEN.length) % LEISTUNGEN.length
              );
            }}
          >
            {LEISTUNGEN.map((leistung, i) => {
              const offen = i === gewaehlt;
              return (
                <Link
                  key={leistung.key}
                  to={leistung.href}
                  role="tab"
                  aria-selected={offen}
                  aria-controls="nav-nischen"
                  tabIndex={offen ? 0 : -1}
                  onMouseEnter={() => setGewaehlt(i)}
                  onFocus={() => setGewaehlt(i)}
                  onClick={onNavigate}
                  className={`group block rounded-xl px-4 py-4 transition-colors duration-200 ${
                    offen ? 'bg-gray-50 dark:bg-white/[0.05]' : 'hover:bg-gray-50/60 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">
                      {leistung.label}
                    </span>
                    <ArrowRight
                      size={15}
                      aria-hidden="true"
                      className={`text-gray-400 transition-opacity duration-200 ${offen ? 'opacity-100' : 'opacity-0'}`}
                    />
                  </span>
                  <span className="block text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-1">
                    {leistung.claim}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Ebene 2 — „Für wen?", erst nach der Wahl */}
          <div id="nav-nischen" role="tabpanel" aria-label={aktiv.label} className="pt-4">
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500 mb-5">
              {aktiv.label} für
            </p>
            <div className="space-y-0.5">
              {aktiv.nischen.map((n) => (
                <PanelLink key={n.href} {...n} isActive={currentPath === n.href} onClick={onNavigate} />
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/[0.06] space-y-0.5">
              {aktiv.abschluss.map((n) => (
                <PanelLink key={n.href} {...n} isActive={currentPath === n.href} onClick={onNavigate} quiet />
              ))}
            </div>
          </div>
        </div>

        {/* Der zweite Einstiegsweg — eine Zeile, nicht fünf Verweise */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/[0.06]">
          <Link
            to={LEISTUNGEN_AUSWEG.href}
            onClick={onNavigate}
            className="group inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
          >
            {LEISTUNGEN_AUSWEG.label}
            <ArrowRight size={14} aria-hidden="true" className="transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Standorte: fünf Ziele brauchen keine volle Bühne ────────────────── */
function StandortePanel({
  onMouseEnter, onMouseLeave, currentPath,
}: {
  onMouseEnter: () => void; onMouseLeave: () => void; currentPath: string;
}) {
  return (
    <motion.div
      {...panelMotion}
      id="nav-panel-standorte"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={PANEL_FLAECHE}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        <div className="max-w-xs">
          <p className="text-sm font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500 mb-4">
            Städte
          </p>
          <div className="space-y-0.5">
            {STANDORTE.staedte.map((s) => (
              <PanelLink
                key={s.href}
                {...s}
                isActive={currentPath === s.href}
                note={s.href === HAUPTSITZ_SLUG ? 'Hauptsitz' : undefined}
              />
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/[0.06] space-y-0.5">
            {STANDORTE.regionen.map((r) => (
              <PanelLink key={r.href} {...r} isActive={currentPath === r.href} quiet />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Verweis im Panel ────────────────────────────────────────────────── */
function PanelLink({
  label, href, isActive, quiet = false, note, onClick,
}: {
  label: string;
  href: string;
  isActive: boolean;
  quiet?: boolean;
  note?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      to={href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-[15px] transition-colors duration-200 ${
        isActive
          ? 'bg-gray-50 dark:bg-white/[0.06] text-gray-900 dark:text-gray-100 font-medium'
          : quiet
          ? 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
      }`}
    >
      <span>{label}</span>
      {note && <span className="text-sm text-gray-400 dark:text-gray-500">{note}</span>}
    </Link>
  );
}
