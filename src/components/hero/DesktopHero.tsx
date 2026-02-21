import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SplineScene } from '../ui/splite';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

function DesktopParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 1.5 + 0.5,
        duration: Math.random() * 6 + 4,
        delay: Math.random() * 4,
      })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-sky-400/40"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
          animate={{ y: [0, -25, 0], opacity: [0.02, 0.15, 0.02] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function DesktopCTA() {
  const navigate = useNavigate();

  return (
    <motion.div
      className="mt-12 flex flex-col items-start gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 2.4, ease: EASE_OUT }}
    >
      <motion.div
        className="w-12 h-px bg-gray-300"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 48, opacity: 1 }}
        transition={{ duration: 0.5, delay: 2.5 }}
      />

      <motion.button
        onClick={() => navigate('/kontakt')}
        className="group relative px-7 py-3.5 overflow-hidden cursor-pointer"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 2.7, ease: EASE_OUT }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="absolute inset-0 bg-gray-900 transition-colors duration-200 group-hover:bg-gray-700" />
        <div className="relative flex items-center gap-2.5">
          <span className="text-sm font-semibold tracking-wide text-white">
            System anfragen
          </span>
          <motion.svg
            width="14" height="14" viewBox="0 0 16 16" fill="none"
            className="text-white/60"
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 4.5, ease: 'easeInOut' }}
          >
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </div>
      </motion.button>

      <motion.span
        className="text-[11px] text-gray-400 tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 3.0 }}
      >
        Für Unternehmen in Deutschland
      </motion.span>
    </motion.div>
  );
}

export function DesktopHero() {
  return (
    <section
      className="relative w-full min-h-screen flex items-center overflow-hidden bg-white"
      aria-label="Hauptbereich"
    >
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(2,132,199,0.06) 0%, transparent 60%)',
          }}
        />
      </div>

      <motion.div
        className="absolute left-0 right-0 h-px z-30 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, rgba(3,105,161,0.15) 30%, rgba(2,132,199,0.3) 50%, rgba(3,105,161,0.15) 70%, transparent 95%)',
          boxShadow: '0 0 20px 4px rgba(3,105,161,0.06)',
        }}
        initial={{ top: 0, opacity: 0 }}
        animate={{ top: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.5, delay: 0.3, ease: EASE_OUT }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 flex items-center gap-0">
        <div className="flex-1 max-w-xl">
          <motion.p
            className="text-[11px] font-semibold tracking-[0.25em] uppercase text-gray-400 mb-10"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7, ease: EASE_OUT }}
          >
            Operative AI Systems
          </motion.p>

          <div className="relative mb-0">
            <h1 className="text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight leading-none">
              {'CogniIQ'.split('').map((char, i) => (
                <motion.span
                  key={i}
                  className="inline-block bg-clip-text text-transparent bg-gradient-to-b from-gray-900 via-gray-700 to-gray-400"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.0 + i * 0.08, ease: EASE_OUT }}
                >
                  {char}
                </motion.span>
              ))}
            </h1>

            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-[2px] h-[55%] rounded-full pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, transparent, #0284c7, transparent)',
                boxShadow: '0 0 8px 2px rgba(2,132,199,0.3)',
              }}
              initial={{ left: '5%', opacity: 0 }}
              animate={{ left: ['5%', '95%'], opacity: [0, 1, 1, 0] }}
              transition={{
                left: { duration: 0.55, delay: 1.0, ease: EASE_OUT },
                opacity: { times: [0, 0.05, 0.85, 1], duration: 0.6, delay: 0.95 },
              }}
            />
          </div>

          <motion.p
            className="mt-8 text-lg lg:text-xl text-gray-500 font-light leading-relaxed max-w-[420px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.0, ease: EASE_OUT }}
          >
            AI-Systeme, Webdesign &amp; Automatisierung für Unternehmen in Bayreuth, München und Regensburg.
          </motion.p>

          <DesktopCTA />
        </div>

        <motion.div
          className="flex-1 h-[600px] lg:h-[700px] xl:h-[800px] relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        >
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </motion.div>
      </div>

      <DesktopParticles />

      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, white)' }}
      />

      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4.0, duration: 1 }}
      >
        <motion.div
          className="w-5 h-8 rounded-full border border-gray-300 flex items-start justify-center p-1"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-1.5 rounded-full bg-gray-400"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
