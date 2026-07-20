import { motion } from 'framer-motion';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const ROBOT_OUTLINE =
  'M36 12 L64 12 L68 16 L72 16 L72 24 L68 24 L68 20 L66 18 L34 18 L32 20 L32 24 L28 24 L28 16 L32 16 Z ' +
  'M32 24 L32 52 L36 58 L44 62 L44 66 L42 68 L42 72 L44 74 L56 74 L58 72 L58 68 L56 66 L56 62 L64 58 L68 52 L68 24';

const ROBOT_INNER_FRAME =
  'M35 22 L65 22 L65 50 L62 54 L58 57 L42 57 L38 54 L35 50 Z';

const HELMET_TOP = 'M38 12 L38 8 L42 6 L58 6 L62 8 L62 12';
const HELMET_RIDGE = 'M44 6 L44 3 L50 1 L56 3 L56 6';

const EAR_LEFT = 'M28 26 L24 28 L22 32 L22 42 L24 46 L28 48';
const EAR_RIGHT = 'M72 26 L76 28 L78 32 L78 42 L76 46 L72 48';

const CIRCUIT_PATHS = [
  'M32 30 L24 30',
  'M68 30 L76 30',
  'M32 40 L22 40',
  'M68 40 L78 40',
  'M50 57 L50 62',
  'M44 57 L44 62 L44 66',
  'M56 57 L56 62 L56 66',
  'M50 12 L50 6 L50 3',
  'M38 8 L34 8 L30 8',
  'M62 8 L66 8 L70 8',
  'M24 34 L18 34 L14 34',
  'M76 34 L82 34 L86 34',
  'M24 44 L18 44',
  'M76 44 L82 44',
];

const CIRCUIT_NODES = [
  { x: 24, y: 30, s: 1.0 },
  { x: 76, y: 30, s: 1.0 },
  { x: 22, y: 40, s: 0.8 },
  { x: 78, y: 40, s: 0.8 },
  { x: 50, y: 1, s: 1.4 },
  { x: 30, y: 8, s: 0.9 },
  { x: 70, y: 8, s: 0.9 },
  { x: 14, y: 34, s: 1.0 },
  { x: 86, y: 34, s: 1.0 },
  { x: 18, y: 44, s: 0.7 },
  { x: 82, y: 44, s: 0.7 },
];

const INNER_DETAILS = [
  'M37 25 L63 25',
  'M37 28 L45 28',
  'M55 28 L63 28',
  'M39 46 L45 46 L45 50 L39 50',
  'M55 46 L61 46 L61 50 L55 50',
  'M47 42 L53 42',
  'M48 52 L52 52',
  'M36 37 L38 37',
  'M62 37 L64 37',
  'M47 25 L47 28',
  'M53 25 L53 28',
  'M50 50 L50 53',
  'M40 42 L43 42',
  'M57 42 L60 42',
];

const DATA_FLOW_PATHS = [
  { d: 'M8 30 L24 30', delay: 0 },
  { d: 'M92 30 L76 30', delay: 0.3 },
  { d: 'M6 40 L22 40', delay: 0.6 },
  { d: 'M94 40 L78 40', delay: 0.9 },
  { d: 'M50 -6 L50 1', delay: 1.2 },
  { d: 'M22 8 L30 8', delay: 1.5 },
  { d: 'M78 8 L70 8', delay: 1.8 },
  { d: 'M6 34 L14 34', delay: 2.1 },
  { d: 'M94 34 L86 34', delay: 2.4 },
  { d: 'M6 44 L18 44', delay: 2.7 },
  { d: 'M94 44 L82 44', delay: 3.0 },
];

function RobotIcon() {
  return (
    <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex-shrink-0">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 82"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="ai-ambient" cx="50%" cy="40%" r="45%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.12" />
            <stop offset="60%" stopColor="#0369a1" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="outline-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#0284c7" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="inner-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="visor-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0" />
            <stop offset="15%" stopColor="#0ea5e9" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
            <stop offset="85%" stopColor="#0ea5e9" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="scan-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="circuit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0369a1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="ear-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.25" />
          </linearGradient>
          <radialGradient id="node-glow">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </radialGradient>
          <filter id="glow-sm">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-md">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-lg">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="head-clip">
            <path d="M28 12 L72 12 L72 58 L56 74 L44 74 L28 58 Z" />
          </clipPath>
        </defs>

        <motion.ellipse
          cx="50" cy="38" rx="32" ry="30"
          fill="url(#ai-ambient)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />

        <motion.path
          d={ROBOT_OUTLINE}
          fill="none"
          stroke="url(#outline-grad)"
          strokeWidth="0.7"
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ pathLength: { duration: 1.8, delay: 0.6, ease: EASE_OUT }, opacity: { duration: 0.3, delay: 0.6 } }}
        />

        <motion.path
          d={ROBOT_INNER_FRAME}
          fill="none"
          stroke="url(#inner-grad)"
          strokeWidth="0.4"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ pathLength: { duration: 1.2, delay: 1.0, ease: EASE_OUT }, opacity: { duration: 0.3, delay: 1.0 } }}
        />

        <motion.path
          d={HELMET_TOP}
          fill="none"
          stroke="url(#outline-grad)"
          strokeWidth="0.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ pathLength: { duration: 0.8, delay: 0.9, ease: EASE_OUT }, opacity: { duration: 0.3, delay: 0.9 } }}
        />
        <motion.path
          d={HELMET_RIDGE}
          fill="none"
          stroke="url(#outline-grad)"
          strokeWidth="0.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ pathLength: { duration: 0.6, delay: 1.1, ease: EASE_OUT }, opacity: { duration: 0.3, delay: 1.1 } }}
        />

        {[EAR_LEFT, EAR_RIGHT].map((d, i) => (
          <motion.path
            key={`ear-${i}`}
            d={d}
            fill="none"
            stroke="url(#ear-grad)"
            strokeWidth="0.6"
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ pathLength: { duration: 0.8, delay: 1.3 + i * 0.15, ease: EASE_OUT }, opacity: { duration: 0.3, delay: 1.3 + i * 0.15 } }}
          />
        ))}

        <motion.path
          d={ROBOT_OUTLINE}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter="url(#glow-md)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [0, 0.4, 0] }}
          transition={{ duration: 2.5, delay: 4, repeat: Infinity, repeatDelay: 6, ease: 'easeInOut' }}
        />

        {[EAR_LEFT, EAR_RIGHT].map((d, i) => (
          <motion.path
            key={`ear-glow-${i}`}
            d={d}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="0.8"
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#glow-sm)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1], opacity: [0, 0.5, 0] }}
            transition={{ duration: 1.5, delay: 5.5 + i * 0.8, repeat: Infinity, repeatDelay: 7, ease: 'easeInOut' }}
          />
        ))}

        {CIRCUIT_PATHS.map((d, i) => (
          <motion.path
            key={`cp-${i}`}
            d={d}
            fill="none"
            stroke="url(#circuit-grad)"
            strokeWidth="0.35"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 0.6, delay: 1.6 + i * 0.07, ease: EASE_OUT },
              opacity: { duration: 0.2, delay: 1.6 + i * 0.07 },
            }}
          />
        ))}

        {CIRCUIT_NODES.map((n, i) => (
          <g key={`cn-${i}`}>
            <motion.circle
              cx={n.x} cy={n.y} r={n.s * 2.5}
              fill="url(#node-glow)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 2.5 + i * 0.25, ease: 'easeInOut' }}
            />
            <motion.circle
              cx={n.x} cy={n.y} r={n.s}
              fill="#0284c7"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 2.0 + i * 0.07, ease: 'backOut' }}
            />
          </g>
        ))}

        {INNER_DETAILS.map((d, i) => (
          <motion.path
            key={`id-${i}`}
            d={d}
            fill="none"
            stroke="#0369a1"
            strokeWidth="0.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.3"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 0.4, delay: 1.8 + i * 0.05, ease: EASE_OUT },
              opacity: { duration: 0.2, delay: 1.8 + i * 0.05 },
            }}
          />
        ))}

        <motion.g filter="url(#glow-md)">
          <motion.path
            d="M37 32 L47 32 L47 38 L37 38 Z"
            fill="none"
            stroke="url(#visor-grad)"
            strokeWidth="0.8"
            strokeLinejoin="round"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.6, ease: EASE_OUT }}
            style={{ transformOrigin: '42px 35px' }}
          />
          <motion.path
            d="M53 32 L63 32 L63 38 L53 38 Z"
            fill="none"
            stroke="url(#visor-grad)"
            strokeWidth="0.8"
            strokeLinejoin="round"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.7, ease: EASE_OUT }}
            style={{ transformOrigin: '58px 35px' }}
          />
        </motion.g>

        <motion.rect
          x="38" y="33" width="8" height="4" rx="0.5"
          fill="#38bdf8"
          fillOpacity="0.12"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.12, 0.25, 0.12] }}
          transition={{ duration: 3, repeat: Infinity, delay: 2, ease: 'easeInOut' }}
        />
        <motion.rect
          x="54" y="33" width="8" height="4" rx="0.5"
          fill="#38bdf8"
          fillOpacity="0.12"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.12, 0.25, 0.12] }}
          transition={{ duration: 3, repeat: Infinity, delay: 2.2, ease: 'easeInOut' }}
        />

        <motion.g>
          <motion.rect
            x="38" y="33" width="8" height="4" rx="0.5"
            fill="#38bdf8"
            filter="url(#glow-lg)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.1, delay: 3, repeat: Infinity, repeatDelay: 5 }}
          />
          <motion.rect
            x="54" y="33" width="8" height="4" rx="0.5"
            fill="#38bdf8"
            filter="url(#glow-lg)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.1, delay: 3, repeat: Infinity, repeatDelay: 5 }}
          />
        </motion.g>

        <motion.line
          x1="48" y1="35" x2="52" y2="35"
          stroke="#0369a1"
          strokeWidth="0.3"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 2, repeat: Infinity, delay: 2.5, ease: 'easeInOut' }}
        />

        <motion.path
          d="M44 44 L46 45 L48 44 L50 45 L52 44 L54 45 L56 44"
          fill="none"
          stroke="#0369a1"
          strokeWidth="0.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{ opacity: 0.25, pathLength: 1 }}
          transition={{ duration: 0.6, delay: 2.0 }}
        />

        {[
          { x1: 22, y1: 34, x2: 22, y2: 32, w: 3, h: 6 },
          { x1: 78, y1: 34, x2: 78, y2: 32, w: 3, h: 6 },
        ].map((vent, i) => (
          <g key={`vent-${i}`}>
            {[0, 2.5, 5].map((offset, j) => (
              <motion.line
                key={`vl-${i}-${j}`}
                x1={vent.x1 - 1.2} y1={vent.y1 - 2.5 + offset}
                x2={vent.x1 + 1.2} y2={vent.y1 - 2.5 + offset}
                stroke="#0369a1"
                strokeWidth="0.25"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.15, 0.4, 0.15] }}
                transition={{ duration: 2, repeat: Infinity, delay: 2.8 + i * 0.3 + j * 0.15, ease: 'easeInOut' }}
              />
            ))}
          </g>
        ))}

        <motion.rect
          x="28" y="16"
          width="44" height="2"
          fill="url(#scan-grad)"
          clipPath="url(#head-clip)"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: [16, 65, 16], opacity: [0, 0.5, 0.5, 0] }}
          transition={{ duration: 3.5, delay: 3, repeat: Infinity, repeatDelay: 4.5, ease: 'easeInOut' }}
        />

        {DATA_FLOW_PATHS.map((flow, i) => (
          <motion.path
            key={`df-${i}`}
            d={flow.d}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="0.4"
            strokeLinecap="round"
            filter="url(#glow-sm)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1], opacity: [0, 0.6, 0] }}
            transition={{
              duration: 0.8,
              delay: 3.5 + flow.delay,
              repeat: Infinity,
              repeatDelay: 5,
              ease: 'easeOut',
            }}
          />
        ))}

        {CIRCUIT_PATHS.map((d, i) => (
          <motion.path
            key={`pulse-${i}`}
            d={d}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow-sm)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1], opacity: [0, 0.6, 0] }}
            transition={{
              duration: 0.8,
              delay: 4 + i * 0.35,
              repeat: Infinity,
              repeatDelay: 6,
              ease: 'easeOut',
            }}
          />
        ))}

        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 0.5 }}
        >
          {[
            { x1: 36, y1: 25, x2: 64, y2: 25 },
            { x1: 36, y1: 40, x2: 64, y2: 40 },
            { x1: 38, y1: 53, x2: 62, y2: 53 },
          ].map((l, i) => (
            <motion.line
              key={`hline-${i}`}
              x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="#0369a1"
              strokeWidth="0.15"
              strokeDasharray="1 2"
              animate={{ opacity: [0.08, 0.2, 0.08] }}
              transition={{ duration: 3, repeat: Infinity, delay: 3 + i * 0.4, ease: 'easeInOut' }}
            />
          ))}
        </motion.g>
      </svg>

      {[
        { r: 58, dur: 16, s: 2 },
        { r: 82, dur: 22, s: 1.5 },
        { r: 110, dur: 30, s: 1.2 },
      ].map((orbit, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute left-1/2 top-[44%] pointer-events-none"
          style={{ width: 0, height: 0 }}
          initial={{ rotate: i * 120, opacity: 0 }}
          animate={{ rotate: [i * 120, i * 120 + 360], opacity: 1 }}
          transition={{
            rotate: { duration: orbit.dur, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 0.8, delay: 2.2 + i * 0.4 },
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
              boxShadow: `0 0 ${orbit.s * 4}px ${orbit.s * 1.5}px rgba(2,132,199,0.25)`,
            }}
          />
        </motion.div>
      ))}

      {[68, 100, 136].map((size, i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            left: '50%',
            top: '44%',
            marginLeft: -size / 2,
            marginTop: -size / 2,
            border: '1px solid rgba(3,105,161,0.06)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [1, 1.02, 1],
            opacity: [0.08, 0.16, 0.08],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: 2 + i * 0.4,
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
          className="w-8 h-px bg-gray-300 dark:bg-gray-600"
          initial={{ width: 0 }}
          animate={{ width: 32 }}
          transition={{ duration: 0.6, delay: 3.8 }}
        />
        <span className="text-[11px] uppercase tracking-[0.25em] text-gray-400 font-medium">
          Ihr Weg beginnt hier
        </span>
        <motion.div
          className="w-8 h-px bg-gray-300 dark:bg-gray-600"
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
      <div className="absolute inset-0 bg-white dark:bg-gray-950 transition-colors duration-300" />

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
                className="inline-block bg-clip-text text-transparent bg-gradient-to-b from-gray-900 via-gray-800 to-gray-500 dark:from-gray-100 dark:via-gray-300 dark:to-gray-500"
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
          className="text-lg sm:text-xl font-light tracking-wide text-gray-500 dark:text-gray-400"
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
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none dark:[--mobile-hero-fade:rgb(3_7_18)]"
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--mobile-hero-fade, white))',
        }}
      />

      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4.8, duration: 1 }}
      >
        <motion.div
          className="w-5 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-start justify-center p-1"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
