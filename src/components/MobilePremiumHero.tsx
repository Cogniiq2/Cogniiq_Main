import { motion } from 'framer-motion';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const HEAD_WIREFRAME = [
  'M50 18 L35 28 L30 44 L35 58 L42 62 L50 64 L58 62 L65 58 L70 44 L65 28 Z',
  'M35 28 L65 28',
  'M30 44 L70 44',
  'M35 58 L65 58',
  'M42 62 L58 62',
  'M50 18 L50 64',
  'M35 28 L50 44',
  'M65 28 L50 44',
  'M30 44 L50 58',
  'M70 44 L50 58',
  'M35 28 L30 44',
  'M65 28 L70 44',
  'M50 44 L42 62',
  'M50 44 L58 62',
];

const FACE_NODES = [
  { x: 50, y: 18, s: 1.8 },
  { x: 35, y: 28, s: 1.4 },
  { x: 65, y: 28, s: 1.4 },
  { x: 30, y: 44, s: 1.2 },
  { x: 50, y: 44, s: 2.2 },
  { x: 70, y: 44, s: 1.2 },
  { x: 35, y: 58, s: 1.0 },
  { x: 65, y: 58, s: 1.0 },
  { x: 42, y: 62, s: 0.8 },
  { x: 50, y: 64, s: 1.0 },
  { x: 58, y: 62, s: 0.8 },
];

const DATA_STREAMS = [
  { x1: 15, y1: 35, x2: 28, y2: 40 },
  { x1: 85, y1: 35, x2: 72, y2: 40 },
  { x1: 12, y1: 50, x2: 27, y2: 48 },
  { x1: 88, y1: 50, x2: 73, y2: 48 },
  { x1: 18, y1: 60, x2: 32, y2: 56 },
  { x1: 82, y1: 60, x2: 68, y2: 56 },
  { x1: 42, y1: 70, x2: 46, y2: 65 },
  { x1: 58, y1: 70, x2: 54, y2: 65 },
  { x1: 50, y1: 72, x2: 50, y2: 66 },
];

function RobotIcon() {
  return (
    <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex-shrink-0">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="ai-ambient">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.12" />
            <stop offset="50%" stopColor="#0369a1" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="wire-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0369a1" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#0284c7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="visor-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0" />
            <stop offset="30%" stopColor="#0284c7" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="node-pulse">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="scan-line" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </linearGradient>
          <filter id="glow-sm">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-lg">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="head-clip">
            <path d="M50 16 L33 27 L28 44 L33 60 L41 64 L50 66 L59 64 L67 60 L72 44 L67 27 Z" />
          </clipPath>
        </defs>

        <motion.circle
          cx="50" cy="42" r="32"
          fill="url(#ai-ambient)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />

        {HEAD_WIREFRAME.map((d, i) => (
          <motion.path
            key={`wire-${i}`}
            d={d}
            fill="none"
            stroke="url(#wire-grad)"
            strokeWidth={i === 0 ? '0.6' : '0.3'}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 0.8, delay: 0.8 + i * 0.06, ease: EASE_OUT },
              opacity: { duration: 0.3, delay: 0.8 + i * 0.06 },
            }}
          />
        ))}

        {HEAD_WIREFRAME.slice(1).map((d, i) => (
          <motion.path
            key={`pulse-wire-${i}`}
            d={d}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="0.6"
            strokeLinecap="round"
            filter="url(#glow-sm)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1], opacity: [0, 0.7, 0] }}
            transition={{
              duration: 1.0,
              delay: 3.5 + i * 0.7,
              repeat: Infinity,
              repeatDelay: 8,
              ease: 'easeInOut',
            }}
          />
        ))}

        {FACE_NODES.map((node, i) => (
          <g key={`fn-${i}`}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.s * 2.5}
              fill="url(#node-pulse)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ opacity: [0.1, 0.4, 0.1], scale: [0.8, 1.2, 0.8] }}
              transition={{
                duration: 3 + i * 0.3,
                repeat: Infinity,
                delay: 1.5 + i * 0.12,
                ease: 'easeInOut',
              }}
            />
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.s}
              fill={i === 4 ? '#0284c7' : '#0369a1'}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 1.2 + i * 0.08, ease: 'backOut' }}
            />
          </g>
        ))}

        <motion.g filter="url(#glow-lg)">
          <motion.line
            x1="36" y1="38" x2="47" y2="38"
            stroke="url(#visor-grad)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.8, ease: EASE_OUT }}
          />
          <motion.line
            x1="53" y1="38" x2="64" y2="38"
            stroke="url(#visor-grad)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.9, ease: EASE_OUT }}
          />
        </motion.g>

        <motion.line
          x1="36" y1="38" x2="64" y2="38"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#glow-lg)"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{
            duration: 0.15,
            delay: 2.2,
            repeat: Infinity,
            repeatDelay: 4,
            ease: 'easeOut',
          }}
        />

        <motion.rect
          x="28" y="20"
          width="44" height="2"
          fill="url(#scan-line)"
          clipPath="url(#head-clip)"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: [20, 60, 20], opacity: [0, 0.6, 0.6, 0] }}
          transition={{
            duration: 3,
            delay: 2.5,
            repeat: Infinity,
            repeatDelay: 5,
            ease: 'easeInOut',
          }}
        />

        {DATA_STREAMS.map((s, i) => (
          <motion.line
            key={`ds-${i}`}
            x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke="#0369a1"
            strokeWidth="0.3"
            strokeLinecap="round"
            strokeDasharray="1.5 2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1], opacity: [0, 0.4, 0] }}
            transition={{
              duration: 1.5,
              delay: 3 + i * 0.5,
              repeat: Infinity,
              repeatDelay: 4,
              ease: 'easeOut',
            }}
          />
        ))}

        {DATA_STREAMS.map((s, i) => (
          <motion.circle
            key={`dp-${i}`}
            cx={s.x2} cy={s.y2} r="0.8"
            fill="#38bdf8"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{
              duration: 0.8,
              delay: 4.2 + i * 0.5,
              repeat: Infinity,
              repeatDelay: 4.7,
              ease: 'easeOut',
            }}
          />
        ))}

        {[
          { cx: 50, cy: 42, r: 18, dur: 20, dir: 1 },
          { cx: 50, cy: 42, r: 25, dur: 30, dir: -1 },
        ].map((ring, i) => (
          <motion.circle
            key={`hex-ring-${i}`}
            cx={ring.cx} cy={ring.cy} r={ring.r}
            fill="none"
            stroke="#0369a1"
            strokeWidth="0.2"
            strokeDasharray="2 4"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.1, 0.25, 0.1] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 + i * 0.5, ease: 'easeInOut' }}
            style={{
              transformOrigin: `${ring.cx}px ${ring.cy}px`,
            }}
          />
        ))}

        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const r = 22;
          const cx = 50 + Math.cos(rad) * r;
          const cy = 42 + Math.sin(rad) * r;
          return (
            <motion.circle
              key={`orbit-node-${i}`}
              cx={cx} cy={cy} r="0.6"
              fill="#0284c7"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 2.5 + i * 0.3,
                ease: 'easeInOut',
              }}
            />
          );
        })}

        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1 }}
        >
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            const innerR = 30;
            const outerR = 38;
            return (
              <motion.line
                key={`ray-${i}`}
                x1={50 + Math.cos(angle) * innerR}
                y1={42 + Math.sin(angle) * innerR}
                x2={50 + Math.cos(angle) * outerR}
                y2={42 + Math.sin(angle) * outerR}
                stroke="#0369a1"
                strokeWidth="0.15"
                strokeLinecap="round"
                animate={{ opacity: [0.05, 0.2, 0.05] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: 3 + i * 0.2,
                  ease: 'easeInOut',
                }}
              />
            );
          })}
        </motion.g>
      </svg>

      {[
        { r: 52, dur: 14, s: 2.5 },
        { r: 74, dur: 20, s: 2 },
        { r: 100, dur: 28, s: 1.5 },
      ].map((orbit, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute left-1/2 top-[45%] pointer-events-none"
          style={{ width: 0, height: 0 }}
          initial={{ rotate: i * 120, opacity: 0 }}
          animate={{ rotate: [i * 120, i * 120 + 360], opacity: 1 }}
          transition={{
            rotate: { duration: orbit.dur, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 0.8, delay: 2 + i * 0.4 },
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: orbit.s,
              height: orbit.s,
              left: -orbit.s / 2,
              top: -orbit.r,
              background: '#0284c7',
              boxShadow: `0 0 ${orbit.s * 4}px ${orbit.s * 1.5}px rgba(2,132,199,0.3)`,
            }}
          />
        </motion.div>
      ))}

      {[60, 90, 125, 160].map((size, i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            left: '50%',
            top: '45%',
            marginLeft: -size / 2,
            marginTop: -size / 2,
            border: '1px solid rgba(3,105,161,0.08)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [1, 1.02, 1],
            opacity: [0.1 - i * 0.015, 0.2 - i * 0.03, 0.1 - i * 0.015],
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
