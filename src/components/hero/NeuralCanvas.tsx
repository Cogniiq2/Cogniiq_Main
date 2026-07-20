import { motion } from 'framer-motion';
import { useMemo } from 'react';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface NeuralCanvasProps {
  mousePos: { x: number; y: number };
  isReady: boolean;
}

interface Node {
  id: number;
  cx: number;
  cy: number;
  r: number;
  layer: number;
}

interface Connection {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay: number;
}

function generateNetwork(): { nodes: Node[]; connections: Connection[] } {
  const layers = [
    { count: 3, x: 120 },
    { count: 5, x: 220 },
    { count: 7, x: 340 },
    { count: 5, x: 460 },
    { count: 3, x: 560 },
  ];

  const nodes: Node[] = [];
  let id = 0;

  layers.forEach((layer, li) => {
    const spacing = 400 / (layer.count + 1);
    for (let i = 0; i < layer.count; i++) {
      nodes.push({
        id: id++,
        cx: layer.x,
        cy: 100 + spacing * (i + 1),
        r: li === 2 ? 5 : 3.5,
        layer: li,
      });
    }
  });

  const connections: Connection[] = [];
  let connId = 0;

  for (let li = 0; li < layers.length - 1; li++) {
    const currentNodes = nodes.filter((n) => n.layer === li);
    const nextNodes = nodes.filter((n) => n.layer === li + 1);

    currentNodes.forEach((from) => {
      nextNodes.forEach((to) => {
        const dist = Math.abs(from.cy - to.cy);
        if (dist < 180) {
          connections.push({
            id: `c-${connId++}`,
            x1: from.cx,
            y1: from.cy,
            x2: to.cx,
            y2: to.cy,
            delay: connId * 0.015,
          });
        }
      });
    });
  }

  return { nodes, connections };
}

export function NeuralCanvas({ mousePos, isReady }: NeuralCanvasProps) {
  const { nodes, connections } = useMemo(() => generateNetwork(), []);

  const orbitalRings = [
    { r: 160, dur: 40, dotSize: 3 },
    { r: 220, dur: 55, dotSize: 2.5 },
    { r: 280, dur: 70, dotSize: 2 },
  ];

  return (
    <div className="relative w-full aspect-square max-w-[600px]" data-ready={isReady ? 'true' : 'false'}>
      <svg
        viewBox="0 0 680 600"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 0 40px rgba(2,132,199,0.03))' }}
      >
        <defs>
          <radialGradient id="nc-ambient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.06" />
            <stop offset="40%" stopColor="#0284c7" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="nc-conn" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.08" />
            <stop offset="50%" stopColor="#94a3b8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="nc-pulse" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0" />
            <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="nc-node">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#0284c7" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nc-core">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#0284c7" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </radialGradient>
          <filter id="nc-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="nc-soft">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        <motion.circle
          cx="340" cy="300" r="200"
          fill="url(#nc-core)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        {orbitalRings.map((ring, i) => (
          <motion.circle
            key={`ring-${i}`}
            cx="340" cy="300" r={ring.r}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="0.5"
            strokeDasharray="4 8"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.1 }}
            transition={{ duration: 1.2, delay: 0.8 + i * 0.2, ease: EASE_OUT }}
          />
        ))}

        {connections.map((conn) => (
          <motion.line
            key={conn.id}
            x1={conn.x1} y1={conn.y1} x2={conn.x2} y2={conn.y2}
            stroke="url(#nc-conn)"
            strokeWidth="0.8"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 0.5, delay: 1.2 + conn.delay, ease: EASE_OUT },
              opacity: { duration: 0.3, delay: 1.2 + conn.delay },
            }}
          />
        ))}

        {connections.filter((_, i) => i % 4 === 0).map((conn, i) => (
          <motion.line
            key={`pulse-${conn.id}`}
            x1={conn.x1} y1={conn.y1} x2={conn.x2} y2={conn.y2}
            stroke="#0ea5e9"
            strokeWidth="1.5"
            filter="url(#nc-glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1], opacity: [0, 0.4, 0] }}
            transition={{
              duration: 1.2,
              delay: 3 + i * 0.6,
              repeat: Infinity,
              repeatDelay: 8,
              ease: 'easeInOut',
            }}
          />
        ))}

        {nodes.map((node, i) => (
          <g key={`node-${node.id}`}>
            <motion.circle
              cx={node.cx} cy={node.cy} r={node.r * 4}
              fill="url(#nc-node)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: 2 + i * 0.15,
                ease: 'easeInOut',
              }}
            />
            <motion.circle
              cx={node.cx} cy={node.cy} r={node.r}
              fill="none"
              stroke={node.layer === 2 ? '#0284c7' : '#94a3b8'}
              strokeWidth={node.layer === 2 ? 1 : 0.6}
              strokeOpacity={node.layer === 2 ? 0.4 : 0.25}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.5 + i * 0.04, ease: 'backOut' }}
            />
            <motion.circle
              cx={node.cx} cy={node.cy} r={node.r * 0.4}
              fill={node.layer === 2 ? '#0284c7' : '#94a3b8'}
              fillOpacity={node.layer === 2 ? 0.5 : 0.2}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 1.6 + i * 0.04, ease: 'backOut' }}
            />
          </g>
        ))}

        {nodes.filter((n) => n.layer === 2).map((node, i) => (
          <motion.circle
            key={`glow-${node.id}`}
            cx={node.cx} cy={node.cy} r={node.r * 2}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="0.8"
            filter="url(#nc-glow)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
            transition={{
              duration: 4,
              delay: 3 + i * 0.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        ))}

        <motion.circle
          cx="340" cy="300" r="6"
          fill="#0284c7"
          fillOpacity="0.2"
          stroke="#0284c7"
          strokeWidth="1"
          strokeOpacity="0.3"
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity, delay: 2, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="340" cy="300" r="3"
          fill="#0ea5e9"
          fillOpacity="0.4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 2.2, duration: 0.3, ease: 'backOut' }}
        />
        <motion.circle
          cx="340" cy="300" r="20"
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="0.5"
          strokeOpacity="0.15"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
          transition={{ duration: 3, delay: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeOut' }}
        />

        {[0, 72, 144, 216, 288].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x = 340 + Math.cos(rad) * 120;
          const y = 300 + Math.sin(rad) * 120;
          return (
            <motion.line
              key={`radial-${i}`}
              x1="340" y1="300" x2={x} y2={y}
              stroke="#94a3b8"
              strokeWidth="0.3"
              strokeDasharray="2 6"
              strokeOpacity="0.15"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 2.0 + i * 0.1, ease: EASE_OUT }}
            />
          );
        })}

        <motion.rect
          x="120" y="295"
          width="440" height="1.5"
          fill="url(#nc-pulse)"
          initial={{ x: 120, opacity: 0 }}
          animate={{ x: [120, 120], opacity: [0, 0.3, 0.3, 0] }}
          transition={{ duration: 2, delay: 4, repeat: Infinity, repeatDelay: 6, ease: 'easeInOut' }}
        />
      </svg>

      {orbitalRings.map((ring, i) => (
        <motion.div
          key={`orbit-dot-${i}`}
          className="absolute pointer-events-none"
          style={{
            width: 0,
            height: 0,
            left: '50%',
            top: '50%',
          }}
          initial={{ rotate: i * 120, opacity: 0 }}
          animate={{ rotate: [i * 120, i * 120 + 360], opacity: 1 }}
          transition={{
            rotate: { duration: ring.dur, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 0.8, delay: 2 + i * 0.3 },
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: ring.dotSize,
              height: ring.dotSize,
              left: -ring.dotSize / 2,
              top: -(ring.r * 0.42),
              background: '#0284c7',
              boxShadow: `0 0 ${ring.dotSize * 4}px ${ring.dotSize}px rgba(2,132,199,0.2)`,
            }}
          />
        </motion.div>
      ))}

      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(14,165,233,0.04) 0%, transparent 40%)`,
          transition: 'background 0.5s ease-out',
        }}
      />
    </div>
  );
}
