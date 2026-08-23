import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/*
  SectionRail — minimal section orientation, fixed to the right viewport edge.

  One hairline per top-level `<section id>` on the current page. The line of
  the section currently in view extends and its name fades in beside it.
  Hovering the rail reveals all names; clicking a line scrolls to its section.

  Design constraints (deliberate):
  - Desktop only (lg+). Mobile keeps the slim top progress hairline instead.
  - Hidden when a page has fewer than 3 sections — no rail for thin pages.
  - No gradients, no glow, no percentages. Ink on paper.
  - Respects prefers-reduced-motion via framer-motion's global handling and
    by using `behavior: auto` scrolling when the user asks for reduced motion.

  Labels resolve in priority order:
  1. `data-rail-label` attribute on the section
  2. text of the first h1/h2 inside the section (trimmed to 28 chars)
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
  const heading = el.querySelector('h1, h2');
  const text = heading?.textContent?.replace(/\s+/g, ' ').trim();
  if (text) return text.length > 28 ? `${text.slice(0, 27)}…` : text;
  return prettify(el.id);
}

function collectSections(): RailSection[] {
  const nodes = Array.from(document.querySelectorAll('section[id]'));
  return nodes
    .filter(el => {
      // ignore invisible or tiny sections (spacers, hidden variants)
      const rect = el.getBoundingClientRect();
      return rect.height > 160;
    })
    .map(el => ({ id: el.id, label: labelFor(el) }));
}

export function SectionRail() {
  const location = useLocation();
  const [sections, setSections] = useState<RailSection[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const rafRef = useRef<number | null>(null);

  const rescan = useCallback(() => {
    setSections(prev => {
      const next = collectSections();
      if (prev.length === next.length && prev.every((s, i) => s.id === next[i].id && s.label === next[i].label)) {
        return prev;
      }
      return next;
    });
  }, []);

  /* Discover sections on route change; keep watching for lazy-loaded ones. */
  useEffect(() => {
    setSections([]);
    setActiveId(null);
    rescan();

    let debounce: ReturnType<typeof setTimeout> | null = null;
    const observer = new MutationObserver(() => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(rescan, 300);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (debounce) clearTimeout(debounce);
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
        const rect = el.getBoundingClientRect();
        if (rect.top <= line) current = s.id;
      }
      setActiveId(current ?? sections[0]?.id ?? null);
    };

    const onScroll = () => {
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(update);
      }
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
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  if (sections.length < 3) return null;

  return (
    <nav
      aria-label="Abschnitte dieser Seite"
      className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 flex-col items-end gap-[14px] py-4 pl-10 pr-5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {sections.map((s) => {
        const active = s.id === activeId;
        const showLabel = active || hovered;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollTo(s.id)}
            aria-current={active ? 'true' : undefined}
            aria-label={s.label}
            className="group flex items-center justify-end gap-3 cursor-pointer"
            style={{ minHeight: '14px' }}
          >
            <AnimatePresence>
              {showLabel && (
                <motion.span
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="whitespace-nowrap select-none text-right"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    color: active ? 'rgb(17,24,39)' : 'rgb(107,114,128)',
                  }}
                >
                  {s.label}
                </motion.span>
              )}
            </AnimatePresence>
            <motion.span
              className="block h-px rounded-full"
              animate={{
                width: active ? 28 : 16,
                backgroundColor: active ? 'rgb(17,24,39)' : 'rgba(17,24,39,0.16)',
              }}
              whileHover={{ backgroundColor: 'rgba(17,24,39,0.45)' }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            />
          </button>
        );
      })}
    </nav>
  );
}
