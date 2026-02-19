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
      className="relative w-full flex items-start justify-center overflow-hidden"
      style={{
        paddingTop: '80px',
        paddingBottom: '60px',
        minHeight: '100svh',
        background: '#ffffff',
      }}
      aria-label="Cogniiq – Operative AI Systems"
    >
      {/* Ultra-subtle atmospheric depth — removes flat white */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 45% at 50% 0%, rgba(15,23,42,0.05) 0%, transparent 100%)',
        }}
        aria-hidden="true"
      />
      {/* Very soft bottom falloff */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '160px',
          background: 'linear-gradient(to bottom, transparent, rgba(248,250,252,0.6))',
        }}
        aria-hidden="true"
      />

      <div
        className="relative z-10 w-full mx-auto flex flex-col items-center text-center"
        style={{ maxWidth: '420px', padding: '0 24px' }}
      >

        {/* Visual anchor — AI signal mark */}
        <div
          className="pointer-events-none"
          style={{ marginBottom: '28px' }}
          aria-hidden="true"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 26 26"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ opacity: 0.10 }}
          >
            <rect x="8" y="8" width="10" height="10" stroke="#111827" strokeWidth="1"/>
            <line x1="13" y1="0" x2="13" y2="8" stroke="#111827" strokeWidth="1"/>
            <line x1="13" y1="18" x2="13" y2="26" stroke="#111827" strokeWidth="1"/>
            <line x1="0" y1="13" x2="8" y2="13" stroke="#111827" strokeWidth="1"/>
            <line x1="18" y1="13" x2="26" y2="13" stroke="#111827" strokeWidth="1"/>
            <rect x="11" y="11" width="4" height="4" fill="#111827"/>
          </svg>
        </div>

        {/* Micro label with flanking lines */}
        <div
          className="flex items-center justify-center"
          style={{ gap: '14px', marginBottom: '20px' }}
        >
          <div
            style={{ width: '48px', height: '1px', background: '#e5e7eb', flexShrink: 0 }}
            aria-hidden="true"
          />
          <p
            style={{
              fontSize: '10.5px',
              fontWeight: 500,
              letterSpacing: '0.20em',
              color: '#6b7280',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}
          >
            Operative AI Systems
          </p>
          <div
            style={{ width: '48px', height: '1px', background: '#e5e7eb', flexShrink: 0 }}
            aria-hidden="true"
          />
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 'clamp(34px, 9.5vw, 36px)',
            fontWeight: 700,
            lineHeight: 1.09,
            letterSpacing: '-0.022em',
            color: '#111827',
            maxWidth: '13ch',
            marginBottom: '20px',
          }}
        >
          Digitale Systeme,
          <br />
          die Unternehmen führen.
        </h1>

        {/* Subline */}
        <p
          style={{
            fontSize: 'clamp(15px, 4vw, 15.5px)',
            fontWeight: 400,
            lineHeight: 1.70,
            color: '#4b5563',
            maxWidth: '32ch',
            marginBottom: '30px',
          }}
        >
          Wir entwickeln operative KI-Strukturen, die Anfragen übernehmen, Prozesse steuern und Wachstum automatisieren.
        </p>

        {/* CTA block */}
        <div className="w-full flex flex-col items-center" style={{ gap: '13px' }}>
          <button
            onClick={() => window.location.href = '/kontakt'}
            className="w-full text-white transition-all"
            style={{
              fontSize: '14.5px',
              fontWeight: 500,
              letterSpacing: '0.01em',
              borderRadius: '10px',
              minHeight: '51px',
              padding: '0 24px',
              background: '#111827',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              border: 'none',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.13)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
            }}
          >
            System anfragen
          </button>

          <div className="flex flex-col items-center" style={{ gap: '3px' }}>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 400,
                lineHeight: 1.45,
                color: '#9ca3af',
                letterSpacing: '0.005em',
              }}
            >
              Analysegespräch für Ihr Unternehmen
            </span>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 400,
                lineHeight: 1.45,
                color: '#9ca3af',
                letterSpacing: '0.005em',
              }}
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
