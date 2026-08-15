import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1] as [number, number, number, number];

/**
 * Renders the real figure, always.
 *
 * This used to animate up from 0, which meant the prerendered HTML and the first
 * paint both carried "< 0 Tage bis zum Go-Live" — not an unfinished number but a
 * false one, and the claim a crawler reads as the page's own statement about its
 * delivery time. A viewport-gated count-up cannot fix that either: on a page
 * whose stats sit below the fold, the DOM holds the fabricated 0 for as long as
 * the visitor has not scrolled, which is exactly when a crawler snapshots it.
 *
 * The value is therefore stable and truthful from the first byte. The section
 * still animates: StatsSection fades and lifts each tile into view (see the
 * motion.div below), which is the enhancement — the number itself is not
 * something to animate away from the truth.
 */
function CountUp({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  return (
    <span className="tabular-nums">
      {prefix}
      {to}
      {suffix}
    </span>
  );
}

const stats = [
  {
    display: 'Auch nachts',
    numeric: null,
    label: 'Kein Anruf geht verloren',
    sub: 'Der KI-Assistent nimmt den Anruf entgegen',
    context: 'Während Wettbewerber schlafen',
    href: '/ki-telefonassistent',
    accent: false,
  },
  {
    display: null,
    numeric: { to: 14, prefix: '< ', suffix: '' },
    label: 'Tage bis zum Go-Live',
    sub: 'Kein monatelanger Vorlauf',
    context: 'Statt monatelanger Projektlaufzeiten',
    href: '/kontakt',
    accent: true,
  },
  {
    display: 'Jeder',
    numeric: null,
    label: 'Anruf wird angenommen',
    sub: 'Auch außerhalb der Öffnungszeiten',
    context: 'Verpasste Anrufe kosten Umsatz',
    href: '/verpasste-anrufe-verlust',
    accent: false,
  },
  {
    display: 'DSGVO',
    numeric: null,
    label: 'Konforme Umsetzung',
    sub: 'Verarbeitung auf europäischen Servern',
    context: 'Consent-Management ab Tag 1',
    href: '/ki-telefonassistent',
    accent: false,
  },
];

export function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} aria-label="Kennzahlen" className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: i * 0.08, ease: EASE }}
              className={`group relative flex flex-col justify-center px-8 py-12 transition-colors duration-300 hover:bg-gray-50/60 border-b border-gray-100 lg:border-b-0 ${
                i < stats.length - 1 ? 'border-r border-gray-100' : ''
              } ${i === 1 || i === 3 ? 'lg:border-r-0' : ''} ${
                stat.accent ? 'bg-gray-50/40' : ''
              }`}
            >
              {/* Hover bottom accent */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]" />

              {stat.accent && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-sky-500/40" />
              )}

              <p
                className="font-bold text-gray-900 tracking-tight leading-none mb-3 tabular-nums"
                style={{ fontSize: 'clamp(32px, 4.2vw, 48px)' }}
              >
                {stat.display ?? (
                  stat.numeric && (
                    <CountUp
                      to={stat.numeric.to}
                      prefix={stat.numeric.prefix}
                      suffix={stat.numeric.suffix}
                    />
                  )
                )}
              </p>
              <div className="w-5 h-px bg-gray-200 mb-3" />
              <p className="text-[13px] font-semibold text-gray-700 tracking-tight mb-1">
                {stat.label}
              </p>
              <p className="text-[11.5px] text-gray-400 leading-snug mb-3">{stat.sub}</p>
              <p className="text-[10.5px] text-gray-300 leading-snug font-medium italic">
                {stat.context}
              </p>
              <Link
                to={stat.href}
                className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-semibold text-gray-400 hover:text-gray-900 transition-colors opacity-0 group-hover:opacity-100"
              >
                Mehr erfahren
                <ArrowRight size={9} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
