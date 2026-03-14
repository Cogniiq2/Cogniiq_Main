import { useEffect, useState } from 'react';
import { DesktopHero } from './hero/DesktopHero';
import { MobileHero } from './MobileHero';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    setIsDesktop(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isDesktop;
}

export function HeroSection() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <DesktopHero /> : <MobileHero />;
}

export default HeroSection;
