import { motion, useInView } from 'framer-motion';
import { useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, PhoneCall, Globe, Zap, CircleCheck as CheckCircle, Star, Lock } from 'lucide-react';
import { SplineScene } from '../ui/splite';

const E: [number, number, number, number] = [0.22, 1, 0.36, 1];

const AVATAR_INITIALS = ['MK', 'SR', 'TH', 'AB'];
const AVATAR_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'];

function Particles() {
  const pts = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: Math.random() * 1.4 + 0.5,
        dur: Math.random() * 8 + 6,
        delay: Math.random() * 5,
      })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none">
      {pts.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-sky-400/20"
          style={{ width: p.s, height: p.s, left: `${p.x}%`, top: `${p.y}%` }}
          animate={{ y: [0, -22, 0], opacity: [0, 0.15, 0] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

const trustItems = [
  'DSGVO-konform',
  'Deutsche Server',
  'Live in < 14 Tagen',
  'Persönliche Betreuung',
];

const services = [
  { icon: PhoneCall, label: 'KI-Telefonassistent', href: '/ki-telefonassistent' },
  { icon: Globe, label: 'Webdesign', href: '/webdesign-agentur-deutschland' },
  { icon: Zap, label: 'Automatisierung', href: '/automatisierung-unternehmen' },
];

const proof = [
  { value: '24/7', label: 'Kein Anruf verpasst' },
  { value: '< 14d', label: 'Go-Live garantiert' },
  { value: '100%', label: 'DSGVO-konform' },
];

export function DesktopHero() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const navigate = useNavigate();

  return (
    <section
      ref={ref}
      className="relative w-full min-h-screen flex items-center overflow-hidden bg-white"
      aria-label="Cogniiq — Operative KI-Systeme"
    >
      {/* Background treatments */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 70% at 68% 50%, rgba(2,132,199,0.04) 0%, transparent 65%), radial-gradient(ellipse 40% 40% at 10% 20%, rgba(16,185,129,0.03) 0%, transparent 55%)',
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(2,132,199,0.12), transparent)' }}
      />

      {/* Animated scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px z-30 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, rgba(3,105,161,0.1) 30%, rgba(2,132,199,0.2) 50%, rgba(3,105,161,0.1) 70%, transparent 95%)',
        }}
        initial={{ top: 0, opacity: 0 }}
        animate={{ top: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.8, delay: 0.3, ease: E }}
      />

      <Particles />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 lg:px-12 flex items-center gap-4">

        {/* ─── LEFT: Copy ─── */}
        <div className="flex-1 max-w-[560px]">

          {/* Main headline */}
          <h1 className="mb-6">
            <div className="overflow-hidden">
              <motion.div
                className="text-[clamp(44px,5.2vw,68px)] font-bold tracking-[-0.025em] leading-[1.04] text-gray-950"
                initial={{ y: '110%' }}
                animate={inView ? { y: 0 } : {}}
                transition={{ duration: 0.75, delay: 0.65, ease: E }}
              >
                Kein Anruf
              </motion.div>
            </div>
            <div className="overflow-hidden">
              <motion.div
                className="text-[clamp(44px,5.2vw,68px)] font-bold tracking-[-0.025em] leading-[1.04] text-gray-950"
                initial={{ y: '110%' }}
                animate={inView ? { y: 0 } : {}}
                transition={{ duration: 0.75, delay: 0.78, ease: E }}
              >
                mehr verpasst.
              </motion.div>
            </div>
            <div className="overflow-hidden mt-1">
              <motion.div
                className="text-[clamp(44px,5.2vw,68px)] font-bold tracking-[-0.025em] leading-[1.04] text-gray-300"
                initial={{ y: '110%' }}
                animate={inView ? { y: 0 } : {}}
                transition={{ duration: 0.75, delay: 0.91, ease: E }}
              >
                Kein Lead verloren.
              </motion.div>
            </div>
          </h1>

          {/* Sub copy */}
          <motion.p
            className="text-[16px] text-gray-500 leading-[1.75] max-w-[420px] mb-7"
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.75, delay: 1.15, ease: E }}
          >
            Cogniiq baut KI-Telefonsysteme, Websites und operative Automationen —
            für Unternehmen, die aufgehört haben, Kunden zu verlieren.
          </motion.p>

          {/* Result guarantee strip */}
          <motion.div
            className="flex items-center gap-2.5 mb-8 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl w-fit"
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 1.25, ease: E }}
          >
            <Lock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="text-[12px] font-semibold text-gray-700">
              Go-Live in 14 Tagen — oder Geld zurück
            </span>
          </motion.div>

          {/* Service pills */}
          <motion.div
            className="flex items-center gap-2 mb-10"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 1.3, ease: E }}
          >
            {services.map(({ icon: Icon, label, href }, i) => (
              <motion.a
                key={label}
                href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50 hover:border-sky-200 hover:bg-sky-50 transition-colors group cursor-pointer"
                initial={{ opacity: 0, y: 6 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 1.35 + i * 0.08, ease: E }}
              >
                <Icon className="w-3 h-3 text-sky-500 group-hover:text-sky-600 transition-colors" />
                <span className="text-[11.5px] font-medium text-gray-600 group-hover:text-gray-900 transition-colors whitespace-nowrap">
                  {label}
                </span>
              </motion.a>
            ))}
          </motion.div>

          {/* Primary CTA */}
          <motion.div
            className="flex flex-col gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 1.55, ease: E }}
          >
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => navigate('/kontakt')}
                className="group relative flex items-center gap-3 px-7 py-3.5 bg-gray-950 text-white text-[13.5px] font-semibold overflow-hidden hover:bg-gray-800 transition-colors"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.975 }}
              >
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'linear-gradient(120deg, rgba(2,132,199,0.18) 0%, transparent 60%)' }}
                />
                <span className="relative whitespace-nowrap">Kostenloses Erstgespräch sichern</span>
                <motion.div
                  className="relative"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 3, ease: 'easeInOut' }}
                >
                  <ArrowRight className="w-3.5 h-3.5 text-white/70 group-hover:text-white transition-colors" />
                </motion.div>
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-sky-500/40 via-sky-500/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>

              <button
                onClick={() => navigate('/ki-telefonassistent')}
                className="group flex items-center gap-1.5 text-[12.5px] font-medium text-gray-400 hover:text-gray-800 transition-colors"
              >
                Demo anhören
                <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-gray-600 transition-colors" />
              </button>
            </div>

            {/* Social proof under CTA */}
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-1.5">
                {AVATAR_COLORS.map((c, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border-[1.5px] border-white flex items-center justify-center text-[7px] font-bold"
                    style={{ background: c + '22', borderColor: c + '66', color: c }}
                  >
                    {AVATAR_INITIALS[i]}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={9} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <span className="text-[11px] text-gray-400">
                <span className="font-semibold text-gray-600">40+</span> Unternehmen in Deutschland
              </span>
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            className="mt-10 pt-8 border-t border-gray-100 grid grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 1.9, ease: E }}
          >
            {proof.map(({ value, label }, i) => (
              <motion.div
                key={label}
                className="flex flex-col gap-1"
                initial={{ opacity: 0, y: 8 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 2.0 + i * 0.1, ease: E }}
              >
                <span className="text-[26px] font-bold text-gray-900 tabular-nums tracking-tight">
                  {value}
                </span>
                <span className="text-[11.5px] text-gray-400 leading-tight">{label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust items */}
          <motion.div
            className="mt-6 flex flex-wrap gap-x-4 gap-y-1"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 2.2, ease: E }}
          >
            {trustItems.map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle size={10} className="text-emerald-500 flex-shrink-0" />
                <span className="text-[11px] text-gray-400">{t}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ─── RIGHT: 3D Scene ─── */}
        <motion.div
          className="flex-1 h-[600px] lg:h-[700px] xl:h-[800px] relative"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 1.6, delay: 0.4 }}
        >
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, white)' }}
      />

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-10"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 3.0, duration: 1 }}
      >
        <motion.div
          className="w-5 h-8 rounded-full border border-gray-200 flex items-start justify-center p-1"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-1.5 rounded-full bg-gray-400"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
