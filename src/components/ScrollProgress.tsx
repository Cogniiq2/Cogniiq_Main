import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';

/*
  Scroll progress hairline — mobile/tablet only.

  On lg+ viewports the SectionRail (right edge) provides orientation, so this
  bar hides itself there. Below lg it renders a single quiet hairline flush
  under the navigation: no gradient sweep, no glow, no percentage chip.
  Spring physics keep the fill from jumping.
*/

const SPRING = { stiffness: 180, damping: 28, mass: 0.6 };

export function ScrollProgress() {
  const rawProgress = useMotionValue(0);
  const smoothProgress = useSpring(rawProgress, SPRING);
  const scaleX = useTransform(smoothProgress, [0, 100], [0, 1]);
  const [canScroll, setCanScroll] = useState(false);

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
      rawProgress.set(Math.min(100, (window.scrollY / scrollable) * 100));
    };

    checkScrollable();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', checkScrollable, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', checkScrollable);
    };
  }, [rawProgress]);

  if (!canScroll) return null;

  return (
    <div
      className="fixed left-0 right-0 pointer-events-none lg:hidden"
      style={{ top: '72px', zIndex: 49 }}
      aria-hidden="true"
    >
      <div className="relative w-full h-px bg-gray-950/[0.04] dark:bg-white/[0.06]">
        <motion.div
          className="absolute inset-y-0 left-0 w-full origin-left bg-gray-900 dark:bg-gray-100"
          style={{ scaleX }}
        />
      </div>
    </div>
  );
}
