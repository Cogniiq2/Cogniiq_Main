import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Star, TrendingUp, Quote } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const testimonials = [
  {
    quote: 'In der ersten Woche nach dem Go-Live haben wir 11 Terminbuchungen über den KI-Assistenten erhalten — ohne einen einzigen Anruf selbst annehmen zu müssen.',
    name: 'Dr. Michael K.',
    role: 'Allgemeinarzt',
    city: 'München',
    result: '+11 Buchungen / Woche 1',
    resultColor: '#22c55e',
    initials: 'MK',
    color: '#0ea5e9',
    service: 'KI-Telefonassistent',
  },
  {
    quote: 'Die neue Website hat unsere Anfragen binnen 6 Wochen vervierfacht. Früher haben wir auf Google kaum existiert — heute kommen täglich qualifizierte Leads.',
    name: 'Sarah R.',
    role: 'Inhaberin, Immobilienbüro',
    city: 'Bayreuth',
    result: '4× mehr Anfragen',
    resultColor: '#0ea5e9',
    initials: 'SR',
    color: '#22c55e',
    service: 'Webdesign',
  },
  {
    quote: 'Unsere Follow-up-Automation läuft jetzt vollautomatisch. Was früher 3 Stunden täglich gekostet hat, passiert jetzt im Hintergrund — ohne einen Klick.',
    name: 'Thomas H.',
    role: 'Geschäftsführer, Fitness Studio',
    city: 'Regensburg',
    result: '−18h Arbeit / Woche',
    resultColor: '#f59e0b',
    initials: 'TH',
    color: '#f59e0b',
    service: 'Automatisierung',
  },
  {
    quote: 'Ich war skeptisch, ob KI wirklich für meine Praxis funktioniert. Nach 30 Tagen sehe ich: Kein Anruf geht mehr verloren, alle Termine sind sauber im Kalender.',
    name: 'Dr. Andrea B.',
    role: 'Zahnarztpraxis',
    city: 'München',
    result: '0 verpasste Anrufe',
    resultColor: '#22c55e',
    initials: 'AB',
    color: '#ef4444',
    service: 'KI-Telefonassistent',
  },
  {
    quote: 'Cogniiq hat nicht einfach eine Website gebaut — sie haben unseren kompletten Buchungsprozess digitalisiert. Vom Erstbesuch bis zur Bestätigungs-SMS läuft alles automatisch.',
    name: 'Lena P.',
    role: 'Restaurantbesitzerin',
    city: 'Bayreuth',
    result: '+230% Online-Buchungen',
    resultColor: '#0ea5e9',
    initials: 'LP',
    color: '#64748b',
    service: 'Webdesign + Automation',
  },
];

const overallStats = [
  { value: '40+', label: 'zufriedene Kunden' },
  { value: '4.9', label: 'Ø Bewertung', suffix: '★' },
  { value: '100%', label: 'empfehlen weiter' },
];

export function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section
      ref={ref}
      aria-labelledby="testimonials-heading"
      className="py-28 bg-white border-t border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, ease: EASE }}
            className="max-w-xl"
          >
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-5">
              Kundenergebnisse
            </p>
            <h2
              id="testimonials-heading"
              className="text-4xl lg:text-5xl font-bold text-gray-900 leading-[1.08] tracking-tight"
            >
              Ergebnisse, die
              <br />
              <span className="text-gray-300">sich messen lassen.</span>
            </h2>
          </motion.div>

          {/* Overall trust stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.1, ease: EASE }}
            className="flex items-center gap-8"
          >
            {overallStats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-[28px] font-bold text-gray-900 tracking-tight tabular-nums leading-none mb-1">
                  {s.value}{s.suffix ?? ''}
                </p>
                <p className="text-[11px] text-gray-400 font-medium">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Masonry-style testimonial grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.07, ease: EASE }}
              className={`relative bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-200 hover:shadow-sm transition-all group ${
                i === 0 ? 'lg:col-span-1 lg:row-span-1' : ''
              } ${i === 4 ? 'md:col-span-2 lg:col-span-1' : ''}`}
            >
              {/* Service badge */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100">
                  {t.service}
                </span>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={9} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>

              {/* Quote icon */}
              <Quote size={16} className="text-gray-150 mb-3" style={{ color: '#e5e7eb' }} />

              {/* Quote text */}
              <p className="text-[14px] text-gray-700 leading-relaxed mb-5 italic">
                "{t.quote}"
              </p>

              {/* Result metric */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mb-5"
                style={{ background: t.resultColor + '10', border: `1px solid ${t.resultColor}22` }}
              >
                <TrendingUp size={11} style={{ color: t.resultColor }} />
                <span
                  className="text-[11.5px] font-bold"
                  style={{ color: t.resultColor }}
                >
                  {t.result}
                </span>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold border-2 flex-shrink-0"
                  style={{ background: t.color + '18', borderColor: t.color + '40', color: t.color }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-[12.5px] font-semibold text-gray-900 leading-none mb-0.5">{t.name}</p>
                  <p className="text-[11px] text-gray-400">{t.role} · {t.city}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
