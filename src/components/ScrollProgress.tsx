import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, useMotionValue, type MotionValue } from 'framer-motion';

/*
  Scroll progress component.

  Visual design:
  - A hairline track that runs the full width of the viewport, flush against
    the very bottom edge of the navigation bar (position: fixed, z-index 49,
    below nav z-50 so it never obscures nav chrome).
  - The fill is a luminous gradient that shifts from the brand blue-grey on
    the left to a slightly lighter, near-cyan on the right, with a subtle
    glowing "head" dot that trails the fill edge.
  - The head dot pulses with a soft box-shadow glow when the user is actively
    scrolling and fades when idle — creating a living, breathing effect.
  - A small floating chip appears at the fill edge (only while scrolling)
    showing the exact percentage. It fades out 1.4 s after scrolling stops.
  - Everything uses a spring-physics value so the bar never jumps — it always
    eases into the current scroll position with a natural, fluid feel.
  - On pages shorter than the viewport (no real scroll) the bar stays hidden.
*/

const SPRING = { stiffness: 180, damping: 28, mass: 0.6 };

export function ScrollProgress() {
  const rawProgress = useMotionValue(0);
  const smoothProgress = useSpring(rawProgress, SPRING);

  // scaleX: 0 → 1 mapped from progress 0 → 100
  const scaleX = useTransform(smoothProgress, [0, 100], [0, 1]);

  // Head dot opacity: visible when progress > 0.5 and < 99.5
  const headOpacity = useTransform(smoothProgress, [0, 1, 99, 100], [0, 1, 1, 0]);

  const [isScrolling, setIsScrolling] = useState(false);
  const [pct, setPct] = useState(0);
  const [canScroll, setCanScroll] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkScrollable = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight > 80;
      setCanScroll(scrollable);
    };

    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 80) { setCanScroll(false); return; }

      setCanScroll(true);
      const p = Math.min(100, (window.scrollY / scrollable) * 100);
      rawProgress.set(p);
      setPct(Math.round(p));

      setIsScrolling(true);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setIsScrolling(false), 1400);
    };

    checkScrollable();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', checkScrollable, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', checkScrollable);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [rawProgress]);

  if (!canScroll) return null;

  return (
    /* Container: sits right below the nav bar (top: 72px) */
    <div
      className="fixed left-0 right-0 pointer-events-none"
      style={{ top: '72px', zIndex: 49 }}
      aria-hidden="true"
    >
      {/* Track — hairline, full width */}
      <div className="relative w-full h-[2px] bg-gray-950/[0.04] dark:bg-white/[0.06] overflow-visible">

        {/* Fill bar */}
        <motion.div
          className="absolute inset-y-0 left-0 w-full origin-left"
          style={{ scaleX }}
        >
          {/* Gradient fill */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, #1a4a62 0%, #2e6f8f 45%, #3d9fbe 100%)',
            }}
          />

          {/* Shimmer sweep — animates continuously across the fill */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
          />

          {/* Head glow — positioned at the right edge of the fill */}
          <motion.div
            ref={headRef}
            className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-0"
            style={{ opacity: headOpacity }}
          >
            {/* Outer soft halo */}
            <motion.div
              className="absolute -inset-3 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(61,159,190,0.35) 0%, transparent 70%)',
              }}
              animate={
                isScrolling
                  ? { scale: [1, 1.5, 1], opacity: [0.5, 0.9, 0.5] }
                  : { scale: 1, opacity: 0.3 }
              }
              transition={
                isScrolling
                  ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.5 }
              }
            />
            {/* Crisp dot */}
            <div
              className="relative w-[7px] h-[7px] rounded-full"
              style={{
                background: '#3d9fbe',
                boxShadow: '0 0 8px 2px rgba(61,159,190,0.6)',
                transform: 'translateX(50%) translateY(50%) translateY(-50%) translateX(-50%)',
              }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Floating percentage chip — appears while scrolling, fades out on idle */}
      <PercentChip pct={pct} smoothProgress={smoothProgress} visible={isScrolling} />
    </div>
  );
}

/* ── Percentage chip ─────────────────────────────────────────────── */

function PercentChip({
  pct,
  smoothProgress,
  visible,
}: {
  pct: number;
  smoothProgress: MotionValue<number>;
  visible: boolean;
}) {
  // left position tracks the progress percentage across the viewport
  const left = useTransform(smoothProgress, [0, 100], ['0%', '100%']);

  return (
    <motion.div
      className="absolute top-[6px] pointer-events-none"
      style={{ left }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -4 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Offset chip so it doesn't overflow viewport edges */}
      <div
        className="relative flex items-center justify-center"
        style={{ transform: 'translateX(-50%)' }}
      >
        {/* Tiny connector line from track to chip */}
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 w-px h-[4px]"
          style={{ background: 'rgba(61,159,190,0.4)' }}
        />

        {/* Chip body */}
        <div
          className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tabular-nums tracking-tight select-none whitespace-nowrap"
          style={{
            background: 'rgba(10,18,26,0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(61,159,190,0.25)',
            color: '#a8d8ea',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
            letterSpacing: '0.01em',
          }}
        >
          {pct}
          <span style={{ color: 'rgba(168,216,234,0.55)', fontSize: '9px' }}>%</span>
        </div>
      </div>
    </motion.div>
  );
}
