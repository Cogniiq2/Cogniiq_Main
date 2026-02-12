import { useEffect, useState } from 'react';
import { DesktopHero } from './hero/DesktopHero';

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

function MobileHero() {
  return (
    <section
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-white pt-24 pb-16"
      aria-label="Hauptbereich"
    >
      {/* Minimal subtle background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(250,250,250,1) 0%, rgba(255,255,255,1) 60%)',
          }}
        />
      </div>

      {/* Minimal geometric visual anchor - subtle signal lines */}
      <div className="absolute top-32 left-0 right-0 pointer-events-none opacity-20">
        <svg
          className="mx-auto"
          width="280"
          height="120"
          viewBox="0 0 280 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Minimal abstract lines representing AI/signals */}
          <line x1="40" y1="60" x2="120" y2="60" stroke="currentColor" strokeWidth="0.5" className="text-gray-300" />
          <line x1="160" y1="60" x2="240" y2="60" stroke="currentColor" strokeWidth="0.5" className="text-gray-300" />
          <circle cx="140" cy="60" r="3" fill="currentColor" className="text-gray-400" />
          <line x1="140" y1="40" x2="140" y2="56" stroke="currentColor" strokeWidth="0.5" className="text-gray-300" />
          <line x1="140" y1="64" x2="140" y2="80" stroke="currentColor" strokeWidth="0.5" className="text-gray-300" />
        </svg>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-[480px] mx-auto px-8">
        <div className="flex flex-col items-center text-center">
          {/* Compact badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white mb-10">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />
            <span className="text-[10px] uppercase tracking-[0.15em] text-gray-600 font-medium">
              AI Solutions · Webdesign
            </span>
          </div>

          {/* Headline - premium typography */}
          <h1 className="mb-6">
            <span className="block text-[56px] leading-[0.95] font-bold tracking-[-0.03em] text-gray-900 mb-3">
              CogniIQ
            </span>
            <span className="block text-[32px] leading-[1.1] font-light tracking-[-0.01em] text-gray-500">
              The Future
            </span>
            <span className="block text-[32px] leading-[1.1] font-light tracking-[-0.01em] text-gray-500">
              is here.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-[15px] leading-relaxed text-gray-600 font-light mb-12 max-w-[340px]">
            KI-Automatisierung und hochkonvertierende Websites aus Bayreuth, Bayern.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 w-full max-w-[340px] mb-8">
            {/* Primary CTA - dominant */}
            <button
              onClick={() => window.location.href = '/kontakt'}
              className="w-full px-8 py-4 rounded-full bg-gray-900 text-white text-[14px] font-medium tracking-wide transition-all hover:bg-gray-800 active:scale-[0.98]"
            >
              Erstberatung vereinbaren
            </button>

            {/* Secondary CTA - subtle */}
            <button
              onClick={() => window.location.href = '/leistungen'}
              className="w-full px-8 py-4 rounded-full border border-gray-200 text-gray-600 text-[13px] font-medium tracking-wide transition-all hover:border-gray-300 hover:text-gray-900 active:scale-[0.98]"
            >
              Leistungen entdecken
            </button>
          </div>

          {/* Compact trust line */}
          <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium tracking-wide">
            <span>Bayreuth</span>
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <span>Schnell</span>
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <span>Messbar</span>
          </div>
        </div>
      </div>

      {/* Minimal scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="w-5 h-8 rounded-full border border-gray-200 flex items-start justify-center p-1">
          <div className="w-0.5 h-1.5 rounded-full bg-gray-300" />
        </div>
      </div>
    </section>
  );
}

export function HeroSection() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <DesktopHero /> : <MobileHero />;
}

export default HeroSection;
