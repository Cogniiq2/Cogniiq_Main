import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Trophy, Utensils, Shirt, ArrowRight, TrendingUp, Quote, CircleCheck as CheckCircle } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (d = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: d, ease: EASE },
  }),
};

const cases = [
  {
    icon: Building2,
    category: 'Medizin & Gesundheit',
    title: 'Arztpraxis',
    headline: 'KI-Rezeptionistin eliminiert täglich 20–30 verpasste Anrufe.',
    situation: 'Das Empfangsteam war ausgelastet. Neupatienten sprangen ab, bevor jemand abnahm.',
    solution: 'KI-Telefonassistentin übernimmt Anrufannahme 24/7, bucht Termine direkt, sendet Bestätigungs-SMS.',
    outcomes: [
      { label: 'Verpasste Anrufe', before: '20–30/Tag', after: '0', positive: true },
      { label: 'Empfang fokussiert auf', before: 'Telefon', after: 'Patienten vor Ort', positive: true },
      { label: 'Neupatienten', before: 'stagnierend', after: 'spürbar angestiegen', positive: true },
    ],
    quote: 'Das System nimmt ab, qualifiziert und bucht — ohne unser Team zu belasten.',
    quoteRole: 'Praxisinhaber, Bayern',
    link: '/ki-telefonassistent',
    linkLabel: 'KI-Telefonassistent ansehen',
    accentColor: 'sky',
  },
  {
    icon: Trophy,
    category: 'Sport & Freizeit',
    title: 'Sportanlage',
    headline: 'Website + vollautomatischer Zugang — ohne Personalaufwand.',
    situation: 'Personal täglich belastet mit Buchungsanfragen und Zugangsproblemen. Keine Online-Präsenz.',
    solution: 'Website mit Buchungssystem, automatische Lichtsteuerung und KI-gesteuerte Türöffnung — synchron mit Zahlungen.',
    outcomes: [
      { label: 'Buchungen', before: 'nur persönlich', after: '24/7 online', positive: true },
      { label: 'Personalaufwand', before: 'täglich', after: 'eliminiert', positive: true },
      { label: 'Umsatz außerhalb Kernzeit', before: 'nicht möglich', after: 'voll aktiviert', positive: true },
    ],
    quote: 'Kunden buchen und kommen rein — wir müssen nichts tun.',
    quoteRole: 'Betreiber Sportanlage, Bayern',
    link: '/leistungen',
    linkLabel: 'Automation ansehen',
    accentColor: 'emerald',
  },
  {
    icon: Utensils,
    category: 'Gastronomie',
    title: 'Restaurant',
    headline: 'No-Show-Rate um 40% reduziert. Service-Team entlastet.',
    situation: 'Serviceteam verlor täglich Stunden am Telefon. Tischreservierungen liefen chaotisch, No-Shows häufig.',
    solution: 'Website mit Speisekarte, KI-Telefonistin für Reservierungen, automatische Bestätigungs- und Erinnerungssequenz.',
    outcomes: [
      { label: 'No-Show-Rate', before: 'hoch', after: '↓ 40%', positive: true },
      { label: 'Anrufe durch Service-Team', before: 'täglich viele', after: 'fast keine mehr', positive: true },
      { label: 'Online-Reservierungen', before: 'kaum', after: 'primärer Kanal', positive: true },
    ],
    quote: 'Das System reserviert, erinnert und reduziert No-Shows. Wir kochen.',
    quoteRole: 'Restaurantinhaber, Bayern',
    link: '/webdesign-gastronomie-bayreuth',
    linkLabel: 'Webdesign Gastronomie',
    accentColor: 'amber',
  },
  {
    icon: Shirt,
    category: 'Fashion & E-Commerce',
    title: 'Fashion-Brand',
    headline: 'Kampagnenproduktion von Wochen auf Tage reduziert.',
    situation: 'Kampagnenproduktion dauerte Wochen und war teuer. Shooting-Setups für jede Kollektion nicht skalierbar.',
    solution: 'AI-generierte Produktbilder und Social-Content im exakten Brand-Look, kombiniert mit Landingpages für jeden Drop.',
    outcomes: [
      { label: 'Kampagnenzeit', before: 'Wochen', after: 'Tage', positive: true },
      { label: 'Shooting-Kosten', before: 'hoch', after: 'erheblich gesunken', positive: true },
      { label: 'Brand-Konsistenz', before: 'variierend', after: 'kanalübergreifend', positive: true },
    ],
    quote: 'AI produziert Content in unserem Look — schneller und günstiger als jedes Shooting.',
    quoteRole: 'Creative Director, Fashion-Brand',
    link: '/leistungen',
    linkLabel: 'Alle Leistungen',
    accentColor: 'rose',
  },
];

const accentMap: Record<string, string> = {
  sky: 'bg-sky-50 text-sky-600 border-sky-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  rose: 'bg-rose-50 text-rose-600 border-rose-100',
};

const accentBar: Record<string, string> = {
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
};

export function CasesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.06 });

  return (
    <section
      id="cases"
      ref={ref}
      className="py-28 bg-white border-t border-gray-100"
      aria-labelledby="cases-heading"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-20">
          <motion.div
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={fadeUp}
            custom={0}
            className="max-w-xl"
          >
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-5">
              Referenzen
            </p>
            <h2
              id="cases-heading"
              className="text-4xl lg:text-5xl font-bold text-gray-900 leading-[1.08] tracking-tight"
            >
              Reale Probleme.
              <br />
              <span className="text-gray-300">Messbare Ergebnisse.</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={fadeUp}
            custom={0.1}
            className="flex flex-col gap-3 max-w-sm"
          >
            <p className="text-[14.5px] text-gray-500 leading-relaxed">
              Projekte, die mit einem konkreten Problem starteten — und mit einem System endeten, das selbstständig arbeitet.
            </p>
            <Link
              to="/referenzen"
              className="group inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-400 hover:text-gray-900 transition-colors"
            >
              Alle Referenzen ansehen
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* Cases grid */}
        <div className="grid lg:grid-cols-2 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
          {cases.map((c, index) => {
            const Icon = c.icon;
            return (
              <motion.article
                key={index}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={fadeUp}
                custom={index * 0.09}
                className="group relative bg-white p-10 transition-colors duration-300 hover:bg-gray-50/40 flex flex-col"
              >
                {/* Top accent bar on hover */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] ${accentBar[c.accentColor]} scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left`} />

                {/* Header row */}
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border ${accentMap[c.accentColor]}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-300 mb-1.5">
                      {c.category} · {c.title}
                    </p>
                    <h3 className="text-[15px] font-bold text-gray-900 leading-snug tracking-tight">
                      {c.headline}
                    </h3>
                  </div>
                </div>

                {/* Situation + Solution */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gray-300 mb-2">Vorher</p>
                    <p className="text-[12.5px] text-gray-500 leading-relaxed">{c.situation}</p>
                  </div>
                  <div className="bg-gray-950/[0.02] rounded-xl p-4 border border-gray-100">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-2">Lösung</p>
                    <p className="text-[12.5px] text-gray-600 leading-relaxed">{c.solution}</p>
                  </div>
                </div>

                {/* Outcomes */}
                <div className="pt-5 border-t border-gray-100 mb-6">
                  <div className="flex items-center gap-1.5 mb-3">
                    <TrendingUp size={11} className="text-gray-400" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                      Ergebnisse
                    </p>
                  </div>
                  <div className="space-y-2">
                    {c.outcomes.map((o, oi) => (
                      <div key={oi} className="flex items-center gap-2.5">
                        <CheckCircle size={11} className="text-emerald-500 flex-shrink-0" />
                        <span className="text-[12.5px] text-gray-500">
                          <span className="font-medium text-gray-700">{o.label}:</span>{' '}
                          <span className="line-through text-gray-300">{o.before}</span>
                          {' → '}
                          <span className="font-semibold text-gray-800">{o.after}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quote */}
                <div className="mt-auto pt-5 border-t border-gray-100">
                  <div className="flex items-start gap-3">
                    <Quote size={14} className="text-gray-200 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[13px] text-gray-500 italic leading-relaxed mb-1.5">
                        "{c.quote}"
                      </p>
                      <p className="text-[11px] font-medium text-gray-400">{c.quoteRole}</p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  to={c.link}
                  className="group/link mt-6 inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-[0.12em]"
                >
                  {c.linkLabel}
                  <ArrowRight size={11} className="transition-transform group-hover/link:translate-x-1" />
                </Link>
              </motion.article>
            );
          })}
        </div>

      </div>
    </section>
  );
}
