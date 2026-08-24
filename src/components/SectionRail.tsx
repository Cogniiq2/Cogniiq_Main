import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

import { railWindow } from './sectionRailWindow';

/*
  SectionRail — minimal section orientation, fixed to the right viewport edge.

  One hairline per top-level `<section>` on the current page. The line of the
  section currently in view extends and its name fades in beside it. Hovering
  the rail reveals all names; clicking a line scrolls to that section.

  Design constraints (deliberate):
  - Desktop only (lg+). Mobile keeps the slim top progress hairline instead.
  - Hidden when a page has fewer than 3 sections — no rail for thin pages.
  - No gradients, no glow, no percentages. Ink on paper.
  - Reduced motion disables both the reveal animation and smooth scrolling.

  Labels resolve in priority order:
  1. `data-rail-label` on the section
  2. the first heading inside it, first rendered line only, trimmed to 28 chars
  3. the section id, prettified
*/

interface RailSection {
  id: string;
  label: string;
}

function prettify(id: string): string {
  return id
    .split('-')
    .map(w => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function labelFor(el: Element): string {
  const explicit = el.getAttribute('data-rail-label');
  if (explicit) return explicit;
  const heading = el.querySelector('h1, h2, h3');
  // Headings break across <br>/<span> lines and textContent glues those without
  // spaces ("Was verliert IhrUnternehmen"), so read only the first rendered line.
  let text = '';
  if (heading) {
    for (const node of Array.from(heading.childNodes)) {
      if (node.nodeName === 'BR') break;
      const piece = node.textContent?.replace(/\s+/g, ' ').trim();
      if (piece) text += (text ? ' ' : '') + piece;
    }
    if (!text) text = heading.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }
  if (text) return text.length > 28 ? `${text.slice(0, 27)}…` : text;
  return prettify(el.id);
}

/*
  Most pages ship `<section>` elements without an id, so the rail discovers
  every top-level section itself and assigns a stable id where none exists.
  Nested sections, chrome and short strips are skipped.

  EVERY qualifying section is tracked. An earlier version capped the tracked
  list at MAX_LINES, which silently truncated long pillar pages: /praxen has 19
  sections over 21,000px, so the ninth line stayed active for the final ~66% of
  the page and the rail claimed the reader was still in section 9 while they
  were in pricing, support or the FAQ. The cap belongs to the DISPLAY, not to
  the tracking — see `railWindow`.
*/
const MIN_SECTION_HEIGHT = 220;

function collectSections(): RailSection[] {
  const nodes = Array.from(document.querySelectorAll('section'));
  const top = nodes.filter(el => {
    if (el.closest('nav, header, footer, [data-rail-ignore]')) return false;
    if (el.parentElement?.closest('section')) return false; // nested section
    return el.getBoundingClientRect().height > MIN_SECTION_HEIGHT;
  });
  return top.map((el, i) => {
    if (!el.id) el.id = `abschnitt-${i + 1}`;
    // keep scrolled-to sections clear of the fixed navigation
    (el as HTMLElement).style.scrollMarginTop = '84px';
    return { id: el.id, label: labelFor(el) };
  });
}

/*
  The rail stays compact — at most MAX_LINES slots — while the section list behind it
  may be far longer. `railWindow` owns that reduction; see sectionRailWindow.ts.
*/

export function SectionRail() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [sections, setSections] = useState<RailSection[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const rafRef = useRef<number | null>(null);

  const rescan = useCallback(() => {
    setSections(prev => {
      const next = collectSections();
      if (prev.length === next.length && prev.every((s, i) => s.id === next[i].id && s.label === next[i].label)) {
        return prev; // identical — avoid a needless re-render on every mutation
      }
      return next;
    });
  }, []);

  /*
    Discovery has to survive lazy-mounted content. Nearly every public page
    code-splits its sections, so a single scan at mount finds too few and the
    rail hides itself under its own "fewer than 3" rule — which is why it only
    ever appeared on pages whose sections happened to be mounted already.

    Three overlapping mechanisms, because each alone has a hole:
      - MutationObserver catches sections that mount after the first scan.
      - Scheduled re-scans catch content that mounted between paint and the
        observer attaching, and heights that were still 0 at scan time.
      - A resize listener catches sections crossing the height threshold when
        the viewport changes.
  */
  useEffect(() => {
    setSections([]);
    setActiveId(null);
    rescan();

    let debounce: ReturnType<typeof setTimeout> | null = null;
    const scheduleRescan = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(rescan, 250);
    };

    const observer = new MutationObserver(scheduleRescan);
    observer.observe(document.body, { childList: true, subtree: true });

    // Settle passes: after paint, after lazy chunks typically resolve, and after
    // late layout (webfonts, images). Cheap — rescan bails out when nothing changed.
    const frame = requestAnimationFrame(rescan);
    const timers = [400, 1200, 2500].map(ms => setTimeout(rescan, ms));
    window.addEventListener('resize', scheduleRescan, { passive: true });
    window.addEventListener('load', rescan);

    return () => {
      observer.disconnect();
      if (debounce) clearTimeout(debounce);
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', scheduleRescan);
      window.removeEventListener('load', rescan);
    };
  }, [location.pathname, rescan]);

  /* Track the section crossing the 38%-viewport reading line. */
  useEffect(() => {
    if (sections.length < 3) return;

    const update = () => {
      rafRef.current = null;
      const line = window.innerHeight * 0.38;
      let current: string | null = null;
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = s.id;
      }
      setActiveId(current ?? sections[0]?.id ?? null);
    };

    const onScroll = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  if (sections.length < 3) return null;

  // The active line is always inside the window, so the reader is never shown a
  // rail whose highlighted section is the wrong one.
  const activeIndex = Math.max(0, sections.findIndex((s) => s.id === activeId));
  const items = railWindow(sections.length, activeIndex);

  return (
    <nav
      aria-label="Abschnitte dieser Seite"
      className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-[14px] py-4 pl-10 pr-5 lg:flex"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {items.map((item) => {
        if (item.kind === 'gap') {
          // A collapsed stretch. Decorative and inert: the sections it stands
          // for are still tracked and still reachable by scrolling.
          return (
            <span
              key={item.key}
              aria-hidden="true"
              className="block h-px w-2 rounded-full bg-pub-hairline-soft"
            />
          );
        }
        const s = sections[item.index];
        const active = s.id === activeId;
        const showLabel = active || hovered;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollTo(s.id)}
            aria-current={active ? 'true' : undefined}
            aria-label={s.label}
            className="group flex min-h-[14px] cursor-pointer items-center justify-end gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-4 focus-visible:ring-offset-pub-paper"
          >
            <AnimatePresence>
              {showLabel && (
                <motion.span
                  initial={reduceMotion ? false : { opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 6 }}
                  transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
                  className={`select-none whitespace-nowrap text-right text-[14px] font-medium tracking-[0.01em] ${
                    active ? 'text-pub-ink' : 'text-pub-ink-3'
                  }`}
                >
                  {s.label}
                </motion.span>
              )}
            </AnimatePresence>
            <motion.span
              className="block h-px rounded-full"
              animate={{
                width: active ? 28 : 16,
                // The active mark is the one place the rail earns colour: it is
                // orientation, not decoration.
                backgroundColor: active ? 'var(--pub-signal)' : 'var(--pub-hairline)',
              }}
              whileHover={{ backgroundColor: 'var(--pub-ink-3)' }}
              transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
            />
          </button>
        );
      })}
    </nav>
  );
}

export default SectionRail;
