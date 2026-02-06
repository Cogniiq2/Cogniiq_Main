import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState, useMemo, useRef } from 'react';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const NODES = [
  { x: 50, y: 18, s: 3.5 },
  { x: 30, y: 28, s: 3 },
  { x: 70, y: 28, s: 3 },
  { x: 15, y: 40, s: 2.5 },
  { x: 50, y: 42, s: 5 },
  { x: 85, y: 40, s: 2.5 },
  { x: 25, y: 55, s: 3 },
  { x: 75, y: 55, s: 3 },
  { x: 40, y: 65, s: 2.5 },
  { x: 60, y: 65, s: 2.5 },
  { x: 50, y: 75, s: 3 },
  { x: 8, y: 48, s: 2 },
  { x: 92, y: 48, s: 2 },
];

const EDGES: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5],
  [3, 6], [4, 6], [4, 7], [5, 7],
  [6, 8], [7, 9], [8, 10], [9, 10],
  [3, 11], [6, 11], [5, 12], [7, 12],
  [0, 4], [4, 10],
];

function NeuralNetwork() {
  return (
    <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex-shrink-0">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="m-edge-g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.15" />
          </linearGradient>
          <radialGradient id="m-node-glow">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="m-core-glow">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
            <stop offset="40%" stopColor="#0ea5e9" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </radialGradient>
        </defs>

        <motion.circle
          cx="50" cy="42" r="28"
          fill="url(#m-core-glow)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />

        {EDGES.map(([from, to], i) => (
          <motion.line
            key={`e-${i}`}
            x1={NODES[from].x}
            y1={NODES[from].y}
            x2={NODES[to].x}
            y2={NODES[to].y}
            stroke="url(#m-edge-g)"
            strokeWidth="0.4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 + i * 0.06, ease: EASE_OUT }}
          />
        ))}

        {EDGES.slice(0, 12).map(([from, to], i) => (
          <motion.line
            key={`pulse-${i}`}
            x1={NODES[from].x}
            y1={NODES[from].y}
            x2={NODES[to].x}
            y2={NODES[to].y}
            stroke="#38bdf8"
            strokeWidth="0.8"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1], opacity: [0, 0.8, 0] }}
            transition={{
              duration: 1.2,
              delay: 3.5 + i * 0.5,
              repeat: Infinity,
              repeatDelay: 6,
              ease: 'easeInOut',
            }}
          />
        ))}

        {NODES.map((node, i) => (
          <g key={`node-${i}`}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.s * 1.8}
              fill="url(#m-node-glow)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.9, 1.2, 0.9] }}
              transition={{
                duration: 3 + i * 0.2,
                repeat: Infinity,
                delay: 1.2 + i * 0.1,
                ease: 'easeInOut',
              }}
            />
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={i === 4 ? node.s * 0.9 : node.s * 0.6}
              fill={i === 4 ? '#38bdf8' : '#0ea5e9'}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 1 + i * 0.07, ease: 'backOut' }}
            />
          </g>
        ))}
      </svg>

      {[
        { r: 50, dur: 12, s: 3 },
        { r: 72, dur: 18, s: 2.5 },
        { r: 95, dur: 25, s: 2 },
      ].map((orbit, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute left-1/2 top-[42%] pointer-events-none"
          style={{ width: 0, height: 0 }}
          initial={{ rotate: i * 120, opacity: 0 }}
          animate={{ rotate: [i * 120, i * 120 + 360], opacity: 1 }}
          transition={{
            rotate: { duration: orbit.dur, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 0.8, delay: 2 + i * 0.4 },
          }}
        >
          <div
            className="absolute rounded-full bg-sky-400"
            style={{
              width: orbit.s,
              height: orbit.s,
              left: -orbit.s / 2,
              top: -orbit.r,
              boxShadow: `0 0 ${orbit.s * 3}px ${orbit.s}px rgba(14,165,233,0.5)`,
            }}
          />
        </motion.div>
      ))}

      {[55, 80, 110, 140].map((size, i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute rounded-full border border-sky-500/10"
          style={{
            width: size,
            height: size,
            left: '50%',
            top: '42%',
            marginLeft: -size / 2,
            marginTop: -size / 2,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [1, 1.03, 1],
            opacity: [0.15 - i * 0.03, 0.3 - i * 0.05, 0.15 - i * 0.03],
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

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 2,
      delay: 3.8,
      ease: EASE_OUT,
    });
    const unsub = rounded.on('change', setDisplay);
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, count, rounded]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

function StatsBar() {
  const stats = [
    { label: 'Accuracy', value: 99, suffix: '%' },
    { label: 'Uptime', value: 100, suffix: '%' },
    { label: 'Clients', value: 500, suffix: '+' },
  ];

  return (
    <motion.div
      className="flex items-center justify-center gap-6 mt-10"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 3.6, ease: EASE_OUT }}
    >
      {stats.map((stat, i) => (
        <div key={i} className="text-center">
          <div className="text-lg font-semibold text-white tracking-tight">
            <AnimatedCounter value={stat.value} suffix={stat.suffix} />
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-0.5">
            {stat.label}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

export function MobilePremiumHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);

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
      <div className="absolute inset-0 bg-gray-950" />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(14,165,233,0.1) 0%, transparent 50%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 80%, rgba(6,182,212,0.04) 0%, transparent 35%)',
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <motion.div
        className="absolute left-0 right-0 h-px z-30 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, rgba(14,165,233,0.25) 30%, rgba(56,189,248,0.5) 50%, rgba(14,165,233,0.25) 70%, transparent 95%)',
          boxShadow: '0 0 30px 6px rgba(14,165,233,0.12)',
        }}
        initial={{ top: 0, opacity: 0 }}
        animate={{ top: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.5, delay: 0.3, ease: EASE_OUT }}
      />

      <NeuralNetwork />

      <div className="relative z-10 text-center px-6 mt-2">
        <div className="relative mb-4">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-none">
            {'CogniIQ'.split('').map((char, i) => (
              <motion.span
                key={i}
                className="inline-block bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-100 to-gray-400"
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
              background: 'linear-gradient(to bottom, transparent, #38bdf8, transparent)',
              boxShadow: '0 0 10px 3px rgba(56,189,248,0.4)',
            }}
            initial={{ left: '15%', opacity: 0 }}
            animate={{ left: ['15%', '85%'], opacity: [0, 1, 1, 0] }}
            transition={{
              left: { duration: 0.55, delay: 2.0, ease: EASE_OUT },
              opacity: { times: [0, 0.05, 0.85, 1], duration: 0.6, delay: 1.95 },
            }}
          />
        </div>

        <motion.div
          className="mx-auto h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent mb-4"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 48, opacity: 1 }}
          transition={{ duration: 0.6, delay: 2.8 }}
        />

        <motion.p
          className="text-lg sm:text-xl font-light tracking-wide text-gray-400"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 3.0, ease: EASE_OUT }}
        >
          The Future is here.
        </motion.p>

        <StatsBar />
      </div>

      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-sky-400/80"
            style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
            animate={{ y: [0, -25, 0], opacity: [0.03, 0.25, 0.03] }}
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
            background: 'radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 55%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        />
      )}

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 35%, rgba(3,7,18,0.6) 100%)',
        }}
      />

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4.5, duration: 1 }}
      >
        <motion.div
          className="w-5 h-8 rounded-full border border-gray-600/40 flex items-start justify-center p-1"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-1.5 rounded-full bg-gray-500"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
