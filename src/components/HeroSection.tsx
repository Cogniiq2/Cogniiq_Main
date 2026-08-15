import { lazy, Suspense, useEffect, useState } from 'react';
import { MobileHero } from './MobileHero';

const DesktopHero = lazy(() =>
  import('./hero/DesktopHero').then((module) => ({
    default: module.DesktopHero,
  }))
);

function useIsDesktop() {
  // Starts `false` unconditionally — NOT from window.innerWidth. The homepage is
  // prerendered at build time (scripts/prerender.mjs), where there is no window, so
  // the server markup is always MobileHero. Seeding this from innerWidth would make
  // the first client render disagree with that markup on every desktop viewport,
  // which is a hydration mismatch on the single most important page of the site.
  // The effect below immediately promotes desktop viewports via matchMedia, and the
  // Suspense fallback for the lazy DesktopHero chunk is already MobileHero, so what
  // a desktop visitor sees is unchanged.
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');

    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };

    setIsDesktop(mq.matches);
    mq.addEventListener('change', handler);

    return () => {
      mq.removeEventListener('change', handler);
    };
  }, []);

  return isDesktop;
}

export function HeroSection() {
  const isDesktop = useIsDesktop();

  if (!isDesktop) {
    return <MobileHero />;
  }

  return (
    <Suspense fallback={<MobileHero />}>
      <DesktopHero />
    </Suspense>
  );
}

export default HeroSection;