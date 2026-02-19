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
      className="relative w-full flex items-start justify-center overflow-hidden bg-white"
      style={{ paddingTop: '100px', paddingBottom: '76px', minHeight: '100svh' }}
      aria-label="Cogniiq – Operative AI Systems"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(15,23,42,0.035) 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[420px] mx-auto px-6 flex flex-col items-center text-center">

        <div className="mb-6 pointer-events-none" aria-hidden="true">
          <svg width="64" height="24" viewBox="0 0 64 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.10 }}>
            <line x1="0" y1="12" x2="26" y2="12" stroke="#111827" strokeWidth="0.75"/>
            <line x1="38" y1="12" x2="64" y2="12" stroke="#111827" strokeWidth="0.75"/>
            <rect x="28" y="8" width="8" height="8" stroke="#111827" strokeWidth="0.75"/>
            <line x1="32" y1="0" x2="32" y2="8" stroke="#111827" strokeWidth="0.75"/>
            <line x1="32" y1="16" x2="32" y2="24" stroke="#111827" strokeWidth="0.75"/>
            <rect x="30" y="10.5" width="4" height="3" fill="#111827"/>
          </svg>
        </div>

        <p
          className="text-[10px] uppercase tracking-[0.20em] text-gray-400 font-medium mb-6"
          style={{ letterSpacing: '0.20em' }}
        >
          Operative AI Systems
        </p>

        <h1
          className="font-semibold text-gray-900 mb-7"
          style={{
            fontSize: 'clamp(32px, 9vw, 36px)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            maxWidth: '13ch',
          }}
        >
          Digitale Systeme,
          <br />
          die Unternehmen führen.
        </h1>

        <p
          className="text-gray-500 font-light mb-10"
          style={{
            fontSize: 'clamp(15px, 4vw, 16px)',
            lineHeight: 1.6,
            maxWidth: '36ch',
          }}
        >
          Wir entwickeln operative KI-Strukturen, die Anfragen übernehmen, Prozesse steuern und Wachstum automatisieren.
        </p>

        <div className="w-full flex flex-col items-center" style={{ gap: '10px' }}>
          <button
            onClick={() => window.location.href = '/kontakt'}
            className="w-full bg-gray-900 text-white font-medium transition-transform active:scale-[0.98]"
            style={{
              fontSize: '14px',
              letterSpacing: '0.01em',
              borderRadius: '4px',
              minHeight: '50px',
              padding: '0 24px',
            }}
          >
            System anfragen
          </button>

          <div className="flex flex-col items-center" style={{ gap: '2px' }}>
            <span
              className="text-gray-400 font-light"
              style={{ fontSize: '11px', letterSpacing: '0.01em' }}
            >
              Analysegespräch für Ihr Unternehmen
            </span>
            <span
              className="text-gray-400 font-light"
              style={{ fontSize: '11px', letterSpacing: '0.01em' }}
            >
              Für Unternehmen in Deutschland
            </span>
          </div>
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
