import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Phone, CirclePlay as PlayCircle, Zap, MessageSquare, ArrowRight, ChevronRight } from 'lucide-react';

const E: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: E } },
});

function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const nodes = Array.from({ length: 28 }, () => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.4 + 0.6,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W(), H());
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W()) n.vx *= -1;
        if (n.y < 0 || n.y > H()) n.vy *= -1;

        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const alpha = (1 - dist / 160) * 0.06;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = `rgba(46,111,143,${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(46,111,143,0.18)';
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 1 }}
    />
  );
}

function StatCard({ value, label, delay }: { value: string; label: string; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: E }}
      className="flex flex-col items-center gap-1 px-6 py-4 rounded-xl bg-white border border-gray-100 shadow-sm"
    >
      <span className="text-xl font-bold text-gray-950 tracking-tight">{value}</span>
      <span className="text-xs text-gray-500 tracking-wide text-center">{label}</span>
    </motion.div>
  );
}

interface NavCardProps {
  icon: React.ReactNode;
  title: string;
  text: string;
  btnLabel: string;
  to: string;
  delay: number;
  accent?: boolean;
}

function NavCard({ icon, title, text, btnLabel, to, delay, accent }: NavCardProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: E }}
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 p-7 shadow-sm hover:shadow-md hover:border-[#2e6f8f]/20 transition-all duration-300"
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(46,111,143,0.04) 0%, transparent 80%)',
        }}
      />
      <div className={`mb-5 w-10 h-10 rounded-xl flex items-center justify-center ${accent ? 'bg-[#2e6f8f]/10' : 'bg-gray-50'} transition-colors duration-300 group-hover:bg-[#2e6f8f]/10`}>
        <span className="text-[#2e6f8f]">{icon}</span>
      </div>
      <h3 className="text-base font-semibold text-gray-950 mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-6">{text}</p>
      <Link
        to={to}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2e6f8f] group-hover:gap-2.5 transition-all duration-200"
      >
        {btnLabel}
        <ChevronRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </motion.div>
  );
}

function ValueBlock({ title, text, delay }: { title: string; text: string; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: E }}
      className="flex flex-col gap-2 p-6 rounded-xl bg-gray-50 border border-gray-100"
    >
      <h4 className="text-sm font-semibold text-gray-950 tracking-tight">{title}</h4>
      <p className="text-sm text-gray-500 leading-relaxed">{text}</p>
    </motion.div>
  );
}

export function ScanPage() {
  useEffect(() => {
    document.title = 'Cogniiq Scan | Digitale KI-Systeme für Unternehmen';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'Private Einstiegseite von Cogniiq: KI-Telefonassistent, Automatisierungen, digitale Systeme und direkter Kontakt auf einen Blick.'
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-24 px-6">
        <NeuralBackground />

        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(46,111,143,0.055) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-3xl mx-auto text-center">
          {/* Eyebrow */}
          <motion.div {...fadeUp(0.1)} className="mb-6">
            <span className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.18em] uppercase text-[#2e6f8f] border border-[#2e6f8f]/20 rounded-full px-4 py-1.5 bg-[#2e6f8f]/04">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2e6f8f] opacity-70 animate-pulse" />
              Private Einstiegseite
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fadeUp(0.22)}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-950 tracking-tight leading-[1.08] mb-6"
          >
            Willkommen bei{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #1a4a62 0%, #2e6f8f 60%, #3d8fad 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Cogniiq.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            {...fadeUp(0.36)}
            className="text-base sm:text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto mb-10"
          >
            Sie haben unsere Karte gescannt. Hier sehen Sie auf einen Blick, welche digitalen
            Systeme wir für Unternehmen entwickeln — und wie Sie direkt den passenden nächsten
            Schritt wählen.
          </motion.p>

          {/* CTAs */}
          <motion.div
            {...fadeUp(0.48)}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              to="/kontakt"
              className="group inline-flex items-center gap-2 bg-gray-950 text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-sm"
            >
              Kostenloses Gespräch sichern
              <ArrowRight
                size={15}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              to="/ki-telefonassistent"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 px-6 py-3 rounded-xl hover:border-[#2e6f8f]/40 hover:text-[#2e6f8f] transition-all duration-200"
            >
              KI-Telefonassistent ansehen
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── TRUST STRIP ───────────────────────────────────────── */}
      <section className="pb-20 px-6">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-3">
          <StatCard value="48h" label="bis zum ersten System" delay={0} />
          <StatCard value="100%" label="operative Systeme" delay={0.08} />
          <StatCard value="3×" label="mehr Anfragen" delay={0.16} />
        </div>
      </section>

      {/* ── NAV CARDS ─────────────────────────────────────────── */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: E }}
            className="mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight mb-2">
              Was wir für Sie bereitstellen.
            </h2>
            <p className="text-sm text-gray-400">Wählen Sie direkt den für Sie passenden Einstieg.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NavCard
              icon={<Phone size={18} />}
              title="KI-Telefonassistent"
              text="Ein digitaler Mitarbeiter, der Anrufe entgegennimmt, Fragen beantwortet und Termine vorbereitet — auch außerhalb der Öffnungszeiten."
              btnLabel="Zur Leistung"
              to="/ki-telefonassistent"
              delay={0}
              accent
            />
            <NavCard
              icon={<PlayCircle size={18} />}
              title="Live-Demo erleben"
              text="Sehen Sie direkt, wie ein KI-Telefonassistent im Alltag eines Unternehmens wirkt."
              btnLabel="Demo öffnen"
              to="/ki-telefonassistent/demo"
              delay={0.08}
            />
            <NavCard
              icon={<Zap size={18} />}
              title="Automatisierungen"
              text="Wir verbinden Website, Kalender, Zahlung, E-Mail, CRM und interne Prozesse zu einem sauberen System."
              btnLabel="Mehr erfahren"
              to="/automatisierung-unternehmen"
              delay={0.16}
            />
            <NavCard
              icon={<MessageSquare size={18} />}
              title="Kontakt aufnehmen"
              text="Wenn Sie direkt wissen möchten, was für Ihr Unternehmen sinnvoll ist, starten Sie mit einem kurzen Gespräch."
              btnLabel="Kontakt öffnen"
              to="/kontakt"
              delay={0.24}
            />
          </div>
        </div>
      </section>

      {/* ── QR / CONTACT SECTION ──────────────────────────────── */}
      <section className="pb-24 px-6 bg-gray-50/60">
        <div className="max-w-5xl mx-auto pt-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Text side */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, ease: E }}
            >
              <p className="text-xs font-medium tracking-[0.16em] uppercase text-[#2e6f8f] mb-3">
                Kontakt
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight mb-4">
                Kontakt sofort speichern.
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-8">
                Scannen Sie den Code, um Cogniiq direkt zu speichern oder die wichtigsten
                Kontaktpunkte erneut aufzurufen.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/kontakt"
                  className="group inline-flex items-center gap-2 bg-gray-950 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-all duration-200"
                >
                  Kontaktseite öffnen
                  <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/kontakt"
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 px-5 py-2.5 rounded-xl hover:border-[#2e6f8f]/40 hover:text-[#2e6f8f] transition-all duration-200"
                >
                  Erstgespräch buchen
                </Link>
              </div>
            </motion.div>

            {/* QR Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: 0.1, ease: E }}
              className="flex justify-center md:justify-end"
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-4 w-fit">
                {/* QR image */}
                <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-xl overflow-hidden border border-gray-100 bg-white flex items-center justify-center">
                  <img
                    src="/Lazar_Popovic.png"
                    alt="Cogniiq Kontakt QR Code"
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      // Fallback: show a styled placeholder
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:16px;">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2e6f8f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                              <path d="M14 14h.01M18 14h.01M14 18h.01M18 18h.01M14 21h.01M21 14h.01M21 18h.01M21 21h.01"/>
                            </svg>
                            <span style="font-size:11px;color:#9ca3af;text-align:center;">QR-Code wird geladen</span>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-950">Cogniiq Kontakt</p>
                  <p className="text-xs text-gray-400 mt-0.5">Für später speichern</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── VALUE SECTION ─────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: E }}
            className="mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight mb-4">
              Keine Website. Kein Tool.{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #1a4a62 0%, #2e6f8f 60%, #3d8fad 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Ein System.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-gray-500 leading-relaxed max-w-2xl">
              Cogniiq entwickelt digitale Strukturen, die nicht nur gut aussehen, sondern echte
              Arbeit übernehmen: Anfragen aufnehmen, Prozesse steuern, Termine vorbereiten, Daten
              weiterleiten und Wachstum messbar machen.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ValueBlock
              title="Für Anfragen"
              text="Mehr Anfragen sauber erfassen — ohne Chaos in E-Mail, Telefon oder WhatsApp."
              delay={0}
            />
            <ValueBlock
              title="Für Prozesse"
              text="Wiederkehrende Aufgaben automatisieren, damit Ihr Team weniger manuell nacharbeiten muss."
              delay={0.08}
            />
            <ValueBlock
              title="Für Wachstum"
              text="Digitale Systeme bauen, die skalierbar sind und nicht bei jedem neuen Kunden brechen."
              delay={0.16}
            />
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="px-6 pb-28">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: E }}
            className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gray-950 px-8 py-14 sm:px-14 text-center"
          >
            {/* Subtle glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 60% 55% at 50% 0%, rgba(46,111,143,0.18) 0%, transparent 65%)',
              }}
            />
            <div className="relative">
              <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#3d8fad] mb-4">
                Jetzt starten
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight mb-4 leading-snug">
                Bereit für ein digitales System,{' '}
                <br className="hidden sm:block" />
                das Ihr Unternehmen nach vorne bringt?
              </h2>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-xl mx-auto mb-10">
                Starten Sie mit einem kurzen Gespräch. Wir prüfen, was bei Ihnen sinnvoll ist —
                ohne komplizierten Verkaufsdruck.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/kontakt"
                  className="group inline-flex items-center gap-2 bg-white text-gray-950 text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-sm"
                >
                  Kostenloses Gespräch sichern
                  <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/ki-telefonassistent"
                  className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200 underline underline-offset-4"
                >
                  KI-Telefonassistent ansehen
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
