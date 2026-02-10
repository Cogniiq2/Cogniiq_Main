import { motion } from 'framer-motion';
import { useEffect, useState, useRef, useCallback } from 'react';
import { HeroText } from './hero/HeroText';
import { HeroCTA } from './hero/HeroCTA';
import { HeroParticles } from './hero/HeroParticles';
import { DesktopHero } from './hero/DesktopHero';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-white pt-20"
      aria-label="Hauptbereich"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 80% 60% at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(2,132,199,0.03) 0%, transparent 60%)`,
            transition: 'background 0.8s ease-out',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 70% 50%, rgba(14,165,233,0.02) 0%, transparent 50%)',
          }}
        />
      </div>

      <motion.div
        className="absolute left-0 right-0 h-px pointer-events-none z-20"
        style={{
          background: 'linear-gradient(90deg, transparent 10%, rgba(2,132,199,0.12) 30%, rgba(14,165,233,0.2) 50%, rgba(2,132,199,0.12) 70%, transparent 90%)',
          boxShadow: '0 0 30px 6px rgba(2,132,199,0.04)',
        }}
        initial={{ top: 0, opacity: 0 }}
        animate={{ top: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 3, delay: 0.5, ease: EASE_OUT }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 min-h-screen flex items-center">
        <div className="w-full flex flex-col items-center">
          <div className="flex flex-col items-center">
            <HeroText />
            <HeroCTA />
          </div>
        </div>
      </div>

      <HeroParticles />

      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, white)' }}
      />

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4.5, duration: 1 }}
      >
        <motion.div
          className="w-5 h-8 rounded-full border border-gray-200 flex items-start justify-center p-1"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-0.5 h-1.5 rounded-full bg-gray-300"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

export function HeroSection() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <DesktopHero /> : <MobileHero />;
}

export default HeroSection;
