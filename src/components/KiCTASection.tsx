import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { PhoneCall, ArrowRight, CircleCheck as CheckCircle, PhoneMissed, Mic, Calendar, TrendingUp, Stethoscope, UtensilsCrossed, Dumbbell, Building2 } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const trust = [
  { icon: CheckCircle, text: 'Einrichtung in unter 14 Tagen' },
  { icon: CheckCircle, text: 'Integration mit Kalender & CRM' },
  { icon: CheckCircle, text: 'DSGVO-konform & Made in Germany' },
  { icon: CheckCircle, text: 'Kein Ausfall, kein Urlaub — 24/7' },
];

const facts = [
  { stat: '30%', label: 'aller Anrufe unbeantwortet', icon: PhoneMissed },
  { stat: '67%', label: 'rufen danach nicht zurück', icon: PhoneCall },
  { stat: '< 3s', label: 'Reaktionszeit des KI-Assistenten', icon: Mic },
];

const industries = [
  { icon: Stethoscope, label: 'Arztpraxen', href: '/ki-telefonassistent-arzt' },
  { icon: UtensilsCrossed, label: 'Restaurants', href: '/ki-telefonassistent-restaurant' },
  { icon: Dumbbell, label: 'Fitnessstudios', href: '/ki-telefonassistent-praxis' },
  { icon: Building2, label: 'Immobilien', href: '/webdesign-immobilien' },
];

const callPreview = [
  { from: 'caller', text: 'Guten Tag, ich würde gerne einen Termin buchen.' },
  { from: 'ai', text: 'Guten Tag! Sehr gerne. Haben Sie einen bestimmten Tag im Kopf?' },
  { from: 'caller', text: 'Am besten Donnerstag Nachmittag.' },
  { from: 'ai', text: 'Donnerstag, 14:30 Uhr wäre frei. Soll ich den Termin für Sie buchen?' },
  { from: 'caller', text: 'Ja, perfekt.' },
  { from: 'ai', text: 'Erledigt. Sie erhalten eine Bestätigungs-SMS. Bis Donnerstag!' },
];

export function KiCTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section
      ref={ref}
      aria-labelledby="ki-cta-heading"
      className="py-20 bg-white border-t border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
          className="bg-gray-950 rounded-2xl overflow-hidden"
        >
          <div className="grid lg:grid-cols-[1fr_300px_280px] gap-0">

            {/* ─── Main content ─── */}
            <div className="px-10 py-12 lg:px-14 lg:py-14">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                  <PhoneCall size={15} className="text-sky-400" />
                </div>
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-500">
                  KI Telefonassistent
                </span>
                <span className="ml-auto flex items-center gap-1.5">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                  <span className="text-[10px] text-emerald-500/70 font-medium">Live</span>
                </span>
              </div>

              <h2
                id="ki-cta-heading"
                className="text-3xl lg:text-[2.2rem] font-bold text-white leading-[1.1] tracking-tight mb-5 max-w-md"
              >
                Jeder Anruf beantwortet.
                <br />
                <span className="text-gray-500">Jeder Termin gebucht. Automatisch.</span>
              </h2>

              <p className="text-[14.5px] text-gray-400 leading-relaxed max-w-md mb-6">
                Die meisten Unternehmen verlieren täglich Kunden ans Besetztzeichen. Unser
                KI-Telefonassistent übernimmt jeden Anruf, bucht Termine und beantwortet Fragen —
                vollautomatisch, in natürlicher Sprache.
              </p>

              {/* ROI callout */}
              <div className="flex items-center gap-3 mb-7 px-4 py-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/[0.12]">
                <TrendingUp size={14} className="text-emerald-400 flex-shrink-0" />
                <p className="text-[12.5px] text-emerald-300/80">
                  Kunden berichten im Schnitt <strong className="text-emerald-300">+28% mehr Terminbuchungen</strong> in den ersten 30 Tagen
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5 mb-7 max-w-md">
                {trust.map((item) => (
                  <div key={item.text} className="flex items-center gap-2.5">
                    <item.icon size={12} className="text-emerald-500/70 flex-shrink-0" />
                    <span className="text-[12.5px] text-gray-400">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Industry pills */}
              <div className="mb-8">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gray-700 mb-3">
                  Bewährt in diesen Branchen
                </p>
                <div className="flex flex-wrap gap-2">
                  {industries.map((ind) => (
                    <Link
                      key={ind.href}
                      to={ind.href}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-gray-500 hover:text-gray-300 hover:border-white/15 transition-all text-[11.5px] font-medium"
                    >
                      <ind.icon size={10} />
                      {ind.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/ki-telefonassistent"
                  className="group inline-flex items-center justify-center gap-2.5 bg-white text-gray-900 font-semibold text-[13px] rounded-xl h-11 px-6 hover:bg-gray-100 transition-colors"
                >
                  <Calendar size={13} />
                  Demo ansehen
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/kontakt"
                  className="inline-flex items-center justify-center gap-2 bg-white/[0.05] border border-white/[0.08] text-white font-semibold text-[13px] rounded-xl h-11 px-6 hover:bg-white/[0.09] transition-colors"
                >
                  Kostenloses Gespräch
                </Link>
              </div>
              <p className="text-[11px] text-gray-700 mt-3">
                30 Min. · kostenlos & unverbindlich
              </p>
            </div>

            {/* ─── Facts sidebar ─── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
              className="hidden lg:flex flex-col justify-center px-8 py-12 bg-white/[0.02] border-l border-white/[0.05]"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-600 mb-7">
                Branchen-Realität
              </p>
              <div className="space-y-7">
                {facts.map((fact, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.25 + i * 0.1, ease: EASE }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <fact.icon size={11} className="text-gray-600" />
                      <p className="text-[26px] font-bold text-white/80 tabular-nums leading-none">
                        {fact.stat}
                      </p>
                    </div>
                    <p className="text-[11.5px] text-gray-500 leading-snug">{fact.label}</p>
                    {i < facts.length - 1 && (
                      <div className="mt-7 w-8 h-px bg-white/[0.05]" />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ─── Live call preview ─── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
              className="hidden lg:flex flex-col justify-center px-8 py-12 bg-white/[0.015] border-l border-white/[0.04]"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-600 mb-5">
                Live Gespräch
              </p>
              <div className="space-y-3">
                {callPreview.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.5 + i * 0.15, ease: EASE }}
                    className={`flex ${msg.from === 'ai' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[90%] px-3 py-2 rounded-xl text-[11px] leading-snug ${
                      msg.from === 'ai'
                        ? 'bg-white/[0.07] text-gray-300 rounded-tl-sm'
                        : 'bg-white/[0.04] text-gray-500 rounded-tr-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[10px] text-gray-700">
                <motion.div
                  className="w-1 h-1 rounded-full bg-emerald-500"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                Termin automatisch gebucht & bestätigt
              </div>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
