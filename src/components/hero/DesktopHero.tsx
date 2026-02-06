import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RobotIcon } from './RobotIcon';

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
          className="absolute rounded-full bg-sky-700/60"
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
  const words = ['Erstberatung', 'vereinbaren'];

  return (
    <motion.div
      className="mt-14 flex flex-col items-center gap-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 3.4, ease: EASE_OUT }}
    >
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 3.6 }}
      >
        <motion.div
          className="w-8 h-px bg-gray-300"
          initial={{ width: 0 }}
          animate={{ width: 32 }}
          transition={{ duration: 0.6, delay: 3.8 }}
        />
        <span className="text-[11px] uppercase tracking-[0.25em] text-gray-400 font-medium">
          Ihr Weg beginnt hier
        </span>
        <motion.div
          className="w-8 h-px bg-gray-300"
          initial={{ width: 0 }}
          animate={{ width: 32 }}
          transition={{ duration: 0.6, delay: 3.8 }}
        />
      </motion.div>

      <motion.button
        onClick={() => navigate('/kontakt')}
        className="group relative px-8 py-3.5 rounded-full overflow-hidden cursor-pointer"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 4.0 }}
        whileTap={{ scale: 0.97 }}
      >
        <div className="absolute inset-0 bg-gray-900 rounded-full" />
        <motion.div
          className="absolute inset-0 rounded-full opacity-0 group-active:opacity-100"
          style={{ background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)' }}
          transition={{ duration: 0.3 }}
        />
        <div className="relative flex items-center gap-2">
          <span className="text-sm font-medium tracking-wide text-white">
            {words.map((word, wi) => (
              <motion.span
                key={wi}
                className="inline-block mr-1.5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 4.2 + wi * 0.12 }}
              >
                {word}
              </motion.span>
            ))}
          </span>
          <motion.svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            className="text-white/70"
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 5, ease: 'easeInOut' }}
          >
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </div>
      </motion.button>
    </motion.div>
  );
}

export function DesktopHero() {
  return (
    <section
      className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white"
      aria-label="Hauptbereich"
    >
      <div className="absolute inset-0 bg-white" />

      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(3,105,161,0.04) 0%, transparent 50%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 80%, rgba(8,145,178,0.02) 0%, transparent 35%)',
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

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

      <RobotIcon className="w-80 h-80 lg:w-96 lg:h-96 xl:w-[28rem] xl:h-[28rem]" />

      <div className="relative z-10 text-center px-6 mt-4">
        <div className="relative mb-4">
          <h1 className="text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight leading-none">
            {'CogniIQ'.split('').map((char, i) => (
              <motion.span
                key={i}
                className="inline-block bg-clip-text text-transparent bg-gradient-to-b from-gray-900 via-gray-800 to-gray-500"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 2.0 + i * 0.08, ease: EASE_OUT }}
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
            initial={{ left: '15%', opacity: 0 }}
            animate={{ left: ['15%', '85%'], opacity: [0, 1, 1, 0] }}
            transition={{
              left: { duration: 0.55, delay: 2.0, ease: EASE_OUT },
              opacity: { times: [0, 0.05, 0.85, 1], duration: 0.6, delay: 1.95 },
            }}
          />

          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(2,132,199,0.04) 50%, transparent 100%)',
              mixBlendMode: 'multiply',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, delay: 5, repeat: Infinity, repeatDelay: 7, ease: 'easeInOut' }}
          />
        </div>

        <motion.div
          className="mx-auto h-px bg-gradient-to-r from-transparent via-sky-700/30 to-transparent mb-4"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 48, opacity: 1 }}
          transition={{ duration: 0.6, delay: 2.8 }}
        />

        <motion.p
          className="text-xl lg:text-2xl font-light tracking-wide text-gray-500"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 3.0, ease: EASE_OUT }}
        >
          The Future is here.
        </motion.p>

        <DesktopCTA />
      </div>

      <DesktopParticles />

      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, white)' }}
      />

      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4.8, duration: 1 }}
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
