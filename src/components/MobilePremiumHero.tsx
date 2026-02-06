import { motion } from 'framer-motion';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

function RobotIcon() {
  return (
    <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex-shrink-0">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="robot-body" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0369a1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.6" />
          </linearGradient>
          <radialGradient id="robot-glow">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="core-energy">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#0284c7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="eye-glow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>

        <motion.circle
          cx="50" cy="50" r="35"
          fill="url(#robot-glow)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />

        <motion.g
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2, ease: EASE_OUT }}
        >
          <motion.line
            x1="50" y1="20" x2="50" y2="28"
            stroke="#0369a1"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          />
          <motion.circle
            cx="50" cy="18" r="2.5"
            fill="#0284c7"
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 2, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="50" cy="18" r="5"
            fill="none"
            stroke="#0284c7"
            strokeWidth="0.5"
            opacity="0.3"
            animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 2, ease: 'easeOut' }}
          />
        </motion.g>

        <motion.rect
          x="37" y="30" width="26" height="20" rx="4"
          fill="url(#robot-body)"
          stroke="#0369a1"
          strokeWidth="1"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0, ease: 'backOut' }}
        />

        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.4 }}
        >
          <motion.rect
            x="41" y="37" width="6" height="4" rx="2"
            fill="url(#eye-glow)"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 3, repeat: Infinity, delay: 2.5, ease: 'easeInOut' }}
          />
          <motion.rect
            x="53" y="37" width="6" height="4" rx="2"
            fill="url(#eye-glow)"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 3, repeat: Infinity, delay: 2.5, ease: 'easeInOut' }}
          />
        </motion.g>

        <motion.rect
          x="40" y="52" width="20" height="24" rx="3"
          fill="url(#robot-body)"
          stroke="#0369a1"
          strokeWidth="1"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1, ease: 'backOut' }}
        />

        <motion.circle
          cx="50" cy="62" r="5"
          fill="url(#core-energy)"
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 1.8, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="50" cy="62" r="3"
          fill="#38bdf8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 1.6, ease: 'backOut' }}
        />

        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.7 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.line
              key={`energy-${i}`}
              x1="45" y1={62 + (i - 1) * 2.5}
              x2="55" y2={62 + (i - 1) * 2.5}
              stroke="#38bdf8"
              strokeWidth="0.5"
              strokeLinecap="round"
              opacity="0.4"
              animate={{ x1: [45, 43], x2: [55, 57], opacity: [0.4, 0, 0.4] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 2.5 + i * 0.2,
                ease: 'easeOut',
              }}
            />
          ))}
        </motion.g>

        <motion.g
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1.3, ease: EASE_OUT }}
        >
          <motion.line
            x1="39" y1="56" x2="30" y2="58"
            stroke="#0369a1"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ x2: [30, 28, 30] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 3, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="29" cy="58" r="2.5"
            fill="#0284c7"
            animate={{ x: [0, -2, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 3, ease: 'easeInOut' }}
          />
        </motion.g>

        <motion.g
          initial={{ opacity: 0, x: 5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1.3, ease: EASE_OUT }}
        >
          <motion.line
            x1="61" y1="56" x2="70" y2="58"
            stroke="#0369a1"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ x2: [70, 72, 70] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 3, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="71" cy="58" r="2.5"
            fill="#0284c7"
            animate={{ x: [0, 2, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 3, ease: 'easeInOut' }}
          />
        </motion.g>

        <motion.g
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.4, ease: EASE_OUT }}
        >
          <motion.rect
            x="43" y="77" width="4" height="8" rx="1"
            fill="#0369a1"
            animate={{ height: [8, 6, 8] }}
            transition={{ duration: 2, repeat: Infinity, delay: 3.5, ease: 'easeInOut' }}
          />
          <motion.rect
            x="53" y="77" width="4" height="8" rx="1"
            fill="#0369a1"
            animate={{ height: [8, 6, 8] }}
            transition={{ duration: 2, repeat: Infinity, delay: 3.7, ease: 'easeInOut' }}
          />
        </motion.g>

        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 1, delay: 2, repeat: Infinity, repeatDelay: 4 }}
        >
          {[1, 2, 3].map((i) => (
            <motion.circle
              key={`particle-${i}`}
              cx="50"
              cy="62"
              r="1"
              fill="#38bdf8"
              initial={{ opacity: 0 }}
              animate={{
                cy: [62, 62 - 15],
                opacity: [0.8, 0],
                scale: [1, 0.3],
              }}
              transition={{
                duration: 1.5,
                delay: 3 + i * 0.3,
                repeat: Infinity,
                repeatDelay: 4,
                ease: 'easeOut',
              }}
            />
          ))}
        </motion.g>
      </svg>

      {[
        { r: 50, dur: 12, s: 3 },
        { r: 72, dur: 18, s: 2.5 },
        { r: 95, dur: 25, s: 2 },
      ].map((orbit, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{ width: 0, height: 0 }}
          initial={{ rotate: i * 120, opacity: 0 }}
          animate={{ rotate: [i * 120, i * 120 + 360], opacity: 1 }}
          transition={{
            rotate: { duration: orbit.dur, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 0.8, delay: 2 + i * 0.4 },
          }}
        >
          <div
            className="absolute rounded-full bg-sky-600"
            style={{
              width: orbit.s,
              height: orbit.s,
              left: -orbit.s / 2,
              top: -orbit.r,
              boxShadow: `0 0 ${orbit.s * 3}px ${orbit.s}px rgba(2,132,199,0.35)`,
            }}
          />
        </motion.div>
      ))}

      {[55, 80, 110, 140].map((size, i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute rounded-full border border-sky-600/8"
          style={{
            width: size,
            height: size,
            left: '50%',
            top: '50%',
            marginLeft: -size / 2,
            marginTop: -size / 2,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [1, 1.03, 1],
            opacity: [0.12 - i * 0.02, 0.25 - i * 0.04, 0.12 - i * 0.02],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: 1.8 + i * 0.3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function PersonalCTA() {
  const navigate = useNavigate();
  const words = ['Erstberatung', 'vereinbaren'];

  return (
    <motion.div
      className="mt-12 flex flex-col items-center gap-5"
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
          style={{
            background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
          }}
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
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
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

export function MobilePremiumHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);

  const particles = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 1.5 + 0.5,
        duration: Math.random() * 6 + 4,
        delay: Math.random() * 4,
      })),
    []
  );

  useEffect(() => {
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        setTouchPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    };
    const onEnd = () => setTouchPos(null);
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchend', onEnd);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-white" />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(3,105,161,0.04) 0%, transparent 50%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 80%, rgba(8,145,178,0.02) 0%, transparent 35%)',
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
          background:
            'linear-gradient(90deg, transparent 5%, rgba(3,105,161,0.15) 30%, rgba(2,132,199,0.3) 50%, rgba(3,105,161,0.15) 70%, transparent 95%)',
          boxShadow: '0 0 20px 4px rgba(3,105,161,0.06)',
        }}
        initial={{ top: 0, opacity: 0 }}
        animate={{ top: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.5, delay: 0.3, ease: EASE_OUT }}
      />

      <RobotIcon />

      <div className="relative z-10 text-center px-6 mt-2">
        <div className="relative mb-4">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-none">
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
          className="text-lg sm:text-xl font-light tracking-wide text-gray-500"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 3.0, ease: EASE_OUT }}
        >
          The Future is here.
        </motion.p>

        <PersonalCTA />
      </div>

      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-sky-700/60"
            style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
            animate={{ y: [0, -25, 0], opacity: [0.02, 0.15, 0.02] }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {touchPos && (
        <motion.div
          className="fixed w-48 h-48 rounded-full pointer-events-none z-20"
          style={{
            left: touchPos.x - 96,
            top: touchPos.y - 96,
            background: 'radial-gradient(circle, rgba(3,105,161,0.06) 0%, transparent 55%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        />
      )}

      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, white)',
        }}
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
    </div>
  );
}
