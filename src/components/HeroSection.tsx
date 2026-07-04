import { lazy, Suspense, useEffect, useState } from 'react';
import { MobileHero } from './MobileHero';

const DesktopHero = lazy(() =>
  import('./hero/DesktopHero').then((module) => ({
    default: module.DesktopHero,
  }))
);

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );

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