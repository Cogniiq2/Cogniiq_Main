import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Globe, Brain } from 'lucide-react';
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

function AnimatedCounter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const timeout = setTimeout(() => {
      const start = Date.now();
      const duration = 1800;

      const tick = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(eased * to));
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    }, 3200);

    return () => clearTimeout(timeout);
  }, [to]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

const SERVICES = [
  { icon: Brain, label: 'KI-Systeme' },
  { icon: Globe, label: 'Webdesign' },
  { icon: Zap, label: 'Automatisierung' },
];

const STATS = [
  { value: 48, suffix: 'h', label: 'Bis zum ersten Workflow' },
  { value: 100, suffix: '%', label: 'DSGVO-konform' },
  { value: 3, suffix: 'x', label: 'Mehr Effizienz' },
];

function DesktopCTA() {
  const navigate = useNavigate();

  return (
    <motion.div
      className="mt-10 flex items-center gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 2.8, ease: EASE_OUT }}
    >
      <motion.button
        onClick={() => navigate('/kontakt')}
        className="group relative flex items-center gap-3 px-6 py-3.5 overflow-hidden cursor-pointer"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 2.9, ease: EASE_OUT }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <div className="absolute inset-0 bg-gray-950 transition-colors duration-300 group-hover:bg-gray-800" />
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'linear-gradient(120deg, rgba(2,132,199,0.18) 0%, transparent 60%)',
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="text-[13px] font-semibold tracking-wide text-white whitespace-nowrap">
            System anfragen
          </span>
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: 4, ease: 'easeInOut' }}
          >
            <ArrowRight className="w-3.5 h-3.5 text-white/60 group-hover:text-white transition-colors" />
          </motion.div>
        </div>
        <motion.div
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-sky-500 to-transparent"
          initial={{ width: 0 }}
          whileHover={{ width: '100%' }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>

      <motion.button
        onClick={() => navigate('/leistungen')}
        className="group relative flex items-center gap-2 px-6 py-3.5 cursor-pointer border border-gray-200 hover:border-gray-400 transition-colors duration-300"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 3.1, ease: EASE_OUT }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <span className="text-[13px] font-medium tracking-wide text-gray-500 group-hover:text-gray-900 transition-colors whitespace-nowrap">
          Leistungen ansehen
        </span>
      </motion.button>
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

          <motion.div
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7, ease: EASE_OUT }}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 bg-gray-50">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-500">
                Operative AI Systems
              </span>
            </div>
          </motion.div>

          <div className="relative mb-0">
            <h1 className="text-7xl lg:text-8xl xl:text-[6.5rem] font-bold tracking-tight leading-none">
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
            className="mt-7 text-[15px] lg:text-base text-gray-500 font-light leading-[1.75] max-w-[400px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.0, ease: EASE_OUT }}
          >
            AI-Systeme, Webdesign &amp; Automatisierung für Unternehmen in Bayreuth, München und Regensburg.
          </motion.p>

          <motion.div
            className="mt-8 flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 2.3, ease: EASE_OUT }}
          >
            {SERVICES.map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-100 bg-white/80"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 2.4 + i * 0.1, ease: EASE_OUT }}
              >
                <Icon className="w-3 h-3 text-sky-600" />
                <span className="text-[11px] font-medium text-gray-600 whitespace-nowrap">{label}</span>
              </motion.div>
            ))}
          </motion.div>

          <DesktopCTA />

          <motion.div
            className="mt-10 pt-8 border-t border-gray-100 grid grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 3.0, ease: EASE_OUT }}
          >
            {STATS.map(({ value, suffix, label }, i) => (
              <motion.div
                key={label}
                className="flex flex-col gap-0.5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 3.1 + i * 0.12, ease: EASE_OUT }}
              >
                <span className="text-2xl font-bold text-gray-900 tabular-nums">
                  <AnimatedCounter to={value} suffix={suffix} />
                </span>
                <span className="text-[11px] text-gray-400 font-light leading-tight">{label}</span>
              </motion.div>
            ))}
          </motion.div>
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
