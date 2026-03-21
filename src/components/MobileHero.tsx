import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EASE_CIRC: [number, number, number, number] = [0.16, 1, 0.3, 1];

function useParticles(count: number) {
  return useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 5 + (i / count) * 90 + (Math.sin(i * 2.4) * 8),
    y: 8 + (i / count) * 84 + (Math.cos(i * 1.7) * 10),
    size: 0.6 + (i % 4) * 0.35,
    dur: 5 + (i % 7) * 1.2,
    delay: (i * 0.19) % 3.8,
    opacity: 0.06 + (i % 5) * 0.022,
  })), [count]);
}

function NeuralGrid() {
  const lines = useMemo(() => {
    const pts: Array<{ x: number; y: number }> = [
      { x: 20, y: 15 }, { x: 50, y: 8 }, { x: 80, y: 20 },
      { x: 12, y: 40 }, { x: 38, y: 35 }, { x: 62, y: 30 }, { x: 88, y: 38 },
      { x: 25, y: 60 }, { x: 55, y: 55 }, { x: 75, y: 65 },
      { x: 15, y: 80 }, { x: 45, y: 75 }, { x: 85, y: 78 },
    ];
    const edges: Array<{ x1: number; y1: number; x2: number; y2: number; d: number }> = [];
    for (let a = 0; a < pts.length; a++) {
      for (let b = a + 1; b < pts.length; b++) {
        const dx = pts[a].x - pts[b].x, dy = pts[a].y - pts[b].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 32) edges.push({ x1: pts[a].x, y1: pts[a].y, x2: pts[b].x, y2: pts[b].y, d: dist });
      }
    }
    return { pts, edges };
  }, []);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {lines.edges.map((e, i) => (
        <motion.line
          key={i}
          x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
          stroke="rgba(15,23,42,0.06)"
          strokeWidth="0.2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.4 + i * 0.06, ease: EASE_OUT }}
        />
      ))}
      {lines.pts.map((p, i) => (
        <motion.circle
          key={`n-${i}`}
          cx={p.x} cy={p.y} r="0.6"
          fill="rgba(15,23,42,0.12)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: [0, 1, 0.6], }}
          transition={{ duration: 0.4, delay: 0.8 + i * 0.05, ease: 'backOut' }}
        />
      ))}
      {lines.edges.filter((_, i) => i % 4 === 0).map((e, i) => (
        <motion.line
          key={`pulse-${i}`}
          x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
          stroke="rgba(15,23,42,0.18)"
          strokeWidth="0.3"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [0, 0.5, 0] }}
          transition={{
            duration: 0.9,
            delay: 3 + i * 0.8,
            repeat: Infinity,
            repeatDelay: 4 + i * 0.4,
            ease: 'easeOut',
          }}
        />
      ))}
    </svg>
  );
}

function HorizonLine({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px pointer-events-none"
      style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(15,23,42,0.06) 20%, rgba(15,23,42,0.12) 50%, rgba(15,23,42,0.06) 80%, transparent 100%)',
      }}
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 1.2, delay, ease: EASE_CIRC }}
    />
  );
}


function TickerWord({ text, delay }: { text: string; delay: number }) {
  return (
    <motion.span
      className="inline-block"
      initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.55, delay, ease: EASE_OUT }}
    >
      {text}
    </motion.span>
  );
}

function MetricCard({
  value, label, delay, accent,
}: {
  value: string; label: string; delay: number; accent: string;
}) {
  return (
    <motion.div
      className="flex-1 flex flex-col items-center gap-0.5 py-3 px-2 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.7)',
        border: '1px solid rgba(15,23,42,0.07)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 2px 12px rgba(15,23,42,0.04)',
      }}
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.65, delay, ease: EASE_OUT }}
    >
      <span
        className="text-2xl font-bold tracking-tight"
        style={{ color: '#0d1821', letterSpacing: '-0.03em' }}
      >
        {value}
      </span>
      <span
        className="text-center leading-tight"
        style={{ fontSize: '10px', color: '#6b7280', fontWeight: 500, letterSpacing: '0.01em' }}
      >
        {label}
      </span>
      <div
        className="mt-1 h-0.5 rounded-full"
        style={{ width: '20px', background: accent }}
      />
    </motion.div>
  );
}

function TouchRipple({ x, y }: { x: number; y: number }) {
  return (
    <motion.div
      className="fixed rounded-full pointer-events-none z-50"
      style={{
        width: 200,
        height: 200,
        left: x - 100,
        top: y - 100,
        background: 'radial-gradient(circle, rgba(15,23,42,0.04) 0%, transparent 65%)',
      }}
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 1, opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    />
  );
}

function ScanBeam() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px pointer-events-none z-10"
      style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(15,23,42,0.12) 30%, rgba(15,23,42,0.2) 50%, rgba(15,23,42,0.12) 70%, transparent 100%)',
        boxShadow: '0 0 8px 2px rgba(15,23,42,0.04)',
      }}
      initial={{ top: '0%', opacity: 0 }}
      animate={{ top: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 2.2, delay: 0.2, ease: EASE_OUT, times: [0, 0.05, 0.9, 1] }}
    />
  );
}

function DiamondMark() {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: 56, height: 56 }}
      initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.8, delay: 0.5, ease: EASE_OUT }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(15,23,42,0.05) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <defs>
          <linearGradient id="mh-g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0d1821" />
            <stop offset="100%" stopColor="#2e6f8f" />
          </linearGradient>
          <linearGradient id="mh-g2" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#1a4a62" />
            <stop offset="100%" stopColor="#3d8fad" />
          </linearGradient>
        </defs>

        <motion.polygon
          points="20,1 37,19 20,37 3,19"
          fill="none"
          stroke="rgba(13,31,45,0.15)"
          strokeWidth="0.8"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.8, ease: EASE_OUT }}
        />
        <polygon points="20,1 3,19 20,19" fill="rgba(13,31,45,0.06)" />
        <polygon points="20,1 37,19 20,19" fill="rgba(46,111,143,0.08)" />
        <polygon points="3,19 20,37 20,19" fill="rgba(46,111,143,0.05)" />
        <polygon points="37,19 20,37 20,19" fill="rgba(13,31,45,0.03)" />

        <motion.line x1="20" y1="1" x2="20" y2="37"
          stroke="rgba(46,111,143,0.2)" strokeWidth="0.5"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 1.2, ease: EASE_OUT }}
        />
        <motion.line x1="3" y1="19" x2="37" y2="19"
          stroke="rgba(46,111,143,0.14)" strokeWidth="0.5"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 1.3, ease: EASE_OUT }}
        />

        <motion.circle cx="20" cy="19" r="3"
          fill="url(#mh-g1)"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 1.6, ease: 'backOut' }}
        />
        <motion.circle cx="20" cy="19" r="1.2"
          fill="white" opacity="0.95"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 1.8, ease: 'backOut' }}
        />

        <motion.circle cx="20" cy="1" r="1.5" fill="url(#mh-g1)"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 1.9, ease: 'backOut' }}
        />
        <motion.circle cx="37" cy="19" r="1.5" fill="url(#mh-g1)"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 2.0, ease: 'backOut' }}
        />
        <motion.circle cx="3" cy="19" r="1.2" fill="url(#mh-g2)"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 2.1, ease: 'backOut' }}
        />
        <motion.circle cx="20" cy="37" r="1" fill="url(#mh-g2)"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 2.2, ease: 'backOut' }}
        />

        <motion.circle cx="11" cy="10" r="0.7" fill="#2e6f8f" opacity="0.5"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 2.4, ease: 'easeInOut' }}
        />
        <motion.circle cx="29" cy="10" r="0.7" fill="#2e6f8f" opacity="0.5"
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.8, repeat: Infinity, delay: 2.8, ease: 'easeInOut' }}
        />
        <motion.circle cx="11" cy="28" r="0.6" fill="#1a4a62" opacity="0.4"
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 3.2, repeat: Infinity, delay: 3.0, ease: 'easeInOut' }}
        />
        <motion.circle cx="29" cy="28" r="0.6" fill="#1a4a62" opacity="0.4"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.6, repeat: Infinity, delay: 3.4, ease: 'easeInOut' }}
        />

        <motion.polygon
          points="20,1 37,19 20,37 3,19"
          fill="none"
          stroke="rgba(46,111,143,0.4)"
          strokeWidth="0.8"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 2, delay: 4, repeat: Infinity, repeatDelay: 6, ease: 'easeInOut' }}
        />
      </svg>
    </motion.div>
  );
}

function ScrollCue() {
  return (
    <motion.div
      className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 4.5, duration: 1 }}
      aria-hidden="true"
    >
      <motion.div
        style={{ width: 1, height: 28, background: 'linear-gradient(to bottom, transparent, rgba(15,23,42,0.15), transparent)', borderRadius: 1 }}
        animate={{ scaleY: [1, 0.4, 1], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span style={{ fontSize: 9, letterSpacing: '0.18em', color: 'rgba(15,23,42,0.3)', fontWeight: 500, textTransform: 'uppercase' }}>
        scroll
      </span>
    </motion.div>
  );
}

export function MobileHero() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const rippleId = useRef(0);

  const particles = useParticles(28);

  const handleTouch = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const t = e.touches[0];
      const id = rippleId.current++;
      setRipples(r => [...r.slice(-3), { id, x: t.clientX, y: t.clientY }]);
      setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 700);
    }
  }, []);

  const headline1 = 'Digitale Systeme,';
  const headline2 = 'die Unternehmen';
  const headline3 = 'führen.';

  return (
    <section
      ref={sectionRef}
      className="relative w-full flex flex-col items-center overflow-hidden"
      style={{ minHeight: '100svh', background: '#ffffff' }}
      aria-label="CogniIQ – Operative AI Systems"
      onTouchStart={handleTouch}
    >
      <AnimatePresence>
        {ripples.map(r => <TouchRipple key={r.id} x={r.x} y={r.y} />)}
      </AnimatePresence>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(160deg, #ffffff 0%, #fafafa 60%, #f5f5f5 100%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(15,23,42,0.04) 0%, transparent 100%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 110%, rgba(15,23,42,0.03) 0%, transparent 100%)' }}
        aria-hidden="true"
      />

      <NeuralGrid />
      <ScanBeam />

      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: 'rgba(15,23,42,0.35)',
            }}
            animate={{ y: [0, -18, 0], opacity: [p.opacity, p.opacity * 2.5, p.opacity] }}
            transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
          />
        ))}
      </div>

      <HorizonLine delay={1.0} />

      <div
        className="relative z-10 w-full flex flex-col items-center"
        style={{ paddingTop: '88px', paddingBottom: '96px', maxWidth: 440, padding: '88px 28px 96px' }}
      >


        <DiamondMark />

        <div className="w-full text-center mt-8 mb-6" style={{ position: 'relative' }}>
          <h1
            className="w-full"
            style={{
              fontSize: 'clamp(32px, 8.5vw, 38px)',
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: '-0.025em',
              color: '#0d1821',
            }}
          >
            {headline1.split(' ').map((w, i) => (
              <TickerWord key={`h1-${i}`} text={w + (i < headline1.split(' ').length - 1 ? '\u00A0' : '')} delay={1.1 + i * 0.1} />
            ))}
            <br />
            {headline2.split(' ').map((w, i) => (
              <TickerWord key={`h2-${i}`} text={w + (i < headline2.split(' ').length - 1 ? '\u00A0' : '')} delay={1.4 + i * 0.1} />
            ))}
            <br />
            <span style={{ color: '#2e6f8f' }}>
              {headline3.split('').map((c, i) => (
                <motion.span
                  key={`h3-${i}`}
                  className="inline-block"
                  initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.45, delay: 1.7 + i * 0.04, ease: EASE_OUT }}
                >
                  {c}
                </motion.span>
              ))}
            </span>
          </h1>
        </div>

        <motion.div
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 2.0, ease: EASE_CIRC }}
          style={{ transformOrigin: 'center' }}
        >
          <div style={{ width: 32, height: 1, background: 'rgba(15,23,42,0.12)' }} />
          <div style={{ width: 5, height: 5, background: '#2e6f8f', borderRadius: '50%', opacity: 0.6 }} />
          <div style={{ width: 32, height: 1, background: 'rgba(15,23,42,0.12)' }} />
        </motion.div>

        <motion.p
          style={{
            fontSize: 'clamp(14.5px, 3.8vw, 15.5px)',
            fontWeight: 400,
            lineHeight: 1.72,
            color: '#4b5563',
            maxWidth: '30ch',
            textAlign: 'center',
            marginBottom: '36px',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.2, ease: EASE_OUT }}
        >
          Wir entwickeln operative KI-Strukturen, die Anfragen übernehmen, Prozesse steuern und Wachstum automatisieren.
        </motion.p>

        <motion.div
          className="w-full flex gap-3 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 2.5 }}
        >
          <MetricCard value="48h" label="bis zum ersten System" delay={2.6} accent="rgba(15,23,42,0.5)" />
          <MetricCard value="100%" label="operative Systeme" delay={2.75} accent="#2e6f8f" />
          <MetricCard value="3×" label="mehr Anfragen" delay={2.9} accent="rgba(15,23,42,0.3)" />
        </motion.div>

        <motion.div
          className="w-full flex flex-col gap-3 mt-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 3.1, ease: EASE_OUT }}
        >
          <motion.button
            onClick={() => navigate('/kontakt')}
            className="w-full relative overflow-hidden"
            style={{
              minHeight: 54,
              borderRadius: 14,
              background: '#0d1821',
              border: 'none',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 600,
              color: '#ffffff',
              letterSpacing: '-0.01em',
              boxShadow: '0 4px 20px rgba(13,24,33,0.18), 0 1px 3px rgba(13,24,33,0.12)',
            }}
            whileTap={{ scale: 0.975 }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, rgba(46,111,143,0.15) 0%, transparent 60%)' }}
              initial={{ opacity: 0 }}
              whileTap={{ opacity: 1 }}
            />
            <span className="relative flex items-center justify-center gap-2">
              Kostenloses Gespräch sichern
              <motion.svg
                width="16" height="16" viewBox="0 0 16 16" fill="none"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: 4, ease: 'easeInOut' }}
              >
                <path d="M6 3L11 8L6 13" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
            </span>
          </motion.button>

          <motion.button
            onClick={() => navigate('/leistungen')}
            className="w-full"
            style={{
              minHeight: 48,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(15,23,42,0.1)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              letterSpacing: '-0.005em',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
            }}
            whileTap={{ scale: 0.975 }}
          >
            Leistungen entdecken
          </motion.button>
        </motion.div>

        {/* Social proof row */}
        <motion.div
          className="flex items-center justify-center gap-2 mt-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5, duration: 0.7 }}
        >
          <div style={{ display: 'flex', marginRight: 2 }}>
            {['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'].map((c, i) => (
              <div
                key={i}
                style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: '1.5px solid white',
                  background: c + '22',
                  borderColor: c + '66',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '7px', fontWeight: 700, color: c,
                  marginLeft: i > 0 ? -6 : 0,
                }}
              >
                {['MK','SR','TH','AB'][i]}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 1 }}>
            {[1,2,3,4,5].map(s => (
              <svg key={s} width="9" height="9" viewBox="0 0 9 9" fill="#f59e0b">
                <polygon points="4.5,0.5 5.5,3.5 8.5,3.5 6.1,5.5 7,8.5 4.5,6.8 2,8.5 2.9,5.5 0.5,3.5 3.5,3.5" />
              </svg>
            ))}
          </div>
          <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 400 }}>
            <strong style={{ color: '#374151' }}>40+</strong> Unternehmen
          </span>
        </motion.div>

        {/* Guarantee strip */}
        <motion.div
          className="flex items-center justify-center gap-1.5 mt-3"
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            background: 'rgba(22,163,74,0.06)',
            border: '1px solid rgba(22,163,74,0.15)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.8, duration: 0.6 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1L1.5 3v3.5C1.5 9.5 3.5 11 6 11s4.5-1.5 4.5-4.5V3L6 1z" stroke="#16a34a" strokeWidth="1" fill="rgba(22,163,74,0.12)" />
            <path d="M4 6l1.5 1.5L8 4" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#15803d' }}>
            Go-Live in 14 Tagen — oder Geld zurück
          </span>
        </motion.div>

        <motion.div
          className="flex flex-col items-center gap-1.5 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.0, duration: 0.8 }}
        >
          <div className="flex items-center gap-1.5">
            {['DE', 'AT', 'CH'].map((flag, i) => (
              <motion.span
                key={flag}
                style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.06em', color: '#9ca3af' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 4.1 + i * 0.1 }}
              >
                {flag}{i < 2 ? ' ·' : ''}
              </motion.span>
            ))}
          </div>
          <span style={{ fontSize: '10.5px', fontWeight: 400, color: '#9ca3af', letterSpacing: '0.005em' }}>
            Kostenlos & unverbindlich
          </span>
        </motion.div>

      </div>

      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{ height: 100, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.9))' }}
        aria-hidden="true"
      />

      <ScrollCue />
    </section>
  );
}
