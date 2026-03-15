import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  PhoneCall, ArrowRight, CircleCheck as CheckCircle, PhoneMissed,
  Mic, Calendar, TrendingUp, Stethoscope, UtensilsCrossed, Dumbbell, Building2,
  Play,
} from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const trust = [
  { icon: CheckCircle, text: 'Einrichtung in unter 14 Tagen' },
  { icon: CheckCircle, text: 'Integration mit Kalender & CRM' },
  { icon: CheckCircle, text: 'DSGVO-konform & Made in Germany' },
  { icon: CheckCircle, text: 'Kein Ausfall, kein Urlaub — 24/7' },
];

const facts = [
  { stat: '30%', label: 'aller Anrufe gehen unbeantwortet', icon: PhoneMissed, color: '#ef4444' },
  { stat: '67%', label: 'dieser Anrufer rufen nicht zurück', icon: PhoneCall, color: '#f59e0b' },
  { stat: '< 3s', label: 'Reaktionszeit des KI-Assistenten', icon: Mic, color: '#22c55e' },
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
  const isInView = useInView(ref, { once: true, amount: 0.12 });

  return (
    <section
      ref={ref}
      aria-labelledby="ki-cta-heading"
      className="py-20 bg-white border-t border-gray-100 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, ease: EASE }}
          className="relative bg-gray-950 rounded-2xl overflow-hidden"
        >
          {/* Ambient lighting */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 20% 50%, rgba(2,132,199,0.09) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(16,185,129,0.06) 0%, transparent 45%), radial-gradient(ellipse at 60% 10%, rgba(245,158,11,0.04) 0%, transparent 40%)',
            }}
          />
          {/* Top shimmer */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(2,132,199,0.35) 35%, rgba(16,185,129,0.2) 65%, transparent 95%)' }}
          />

          <div className="relative grid lg:grid-cols-[1fr_300px_290px] gap-0">

            {/* ─── Main content ─── */}
            <div className="px-10 py-12 lg:px-14 lg:py-14">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                  <PhoneCall size={14} className="text-sky-400" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-500">
                  KI Telefonassistent
                </span>
                <span className="ml-auto flex items-center gap-1.5">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                  <span className="text-[10px] text-emerald-400/70 font-medium">Live in 14 Tagen</span>
                </span>
              </div>

              <h2
                id="ki-cta-heading"
                className="text-3xl lg:text-[2.4rem] font-bold text-white leading-[1.08] tracking-[-0.02em] mb-5 max-w-lg"
              >
                Jeder Anruf beantwortet.
                <br />
                <span className="text-gray-500">Jeder Termin gebucht. Automatisch.</span>
              </h2>

              <p className="text-[14.5px] text-gray-400 leading-[1.72] max-w-[420px] mb-7">
                Die meisten Unternehmen verlieren täglich Kunden ans Besetztzeichen. Unser
                KI-Telefonassistent übernimmt jeden Anruf, bucht Termine und beantwortet Fragen —
                vollautomatisch, in natürlicher Sprache.
              </p>

              {/* ROI callout */}
              <div className="flex items-start gap-3 mb-8 px-4 py-3.5 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/[0.14]">
                <TrendingUp size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-[12.5px] text-emerald-300/80 leading-relaxed">
                  Kunden berichten im Schnitt{' '}
                  <strong className="text-emerald-300 font-semibold">+28% mehr Terminbuchungen</strong>{' '}
                  in den ersten 30 Tagen nach Go-Live
                </p>
              </div>

              {/* Trust checkmarks */}
              <div className="grid sm:grid-cols-2 gap-2.5 mb-8 max-w-[420px]">
                {trust.map((item) => (
                  <div key={item.text} className="flex items-center gap-2.5">
                    <item.icon size={11} className="text-emerald-500/70 flex-shrink-0" />
                    <span className="text-[12.5px] text-gray-400">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Industry pills */}
              <div className="mb-9">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-gray-700 mb-3">
                  Bewährt in diesen Branchen
                </p>
                <div className="flex flex-wrap gap-2">
                  {industries.map((ind) => (
                    <Link
                      key={ind.href}
                      to={ind.href}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-gray-500 hover:text-gray-200 hover:border-white/20 hover:bg-white/[0.07] transition-all text-[11.5px] font-medium"
                    >
                      <ind.icon size={10} />
                      {ind.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/ki-telefonassistent"
                  className="group inline-flex items-center justify-center gap-2.5 bg-white text-gray-900 font-semibold text-[13px] rounded-xl h-11 px-6 hover:bg-gray-50 transition-all"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                >
                  <Play size={11} className="fill-gray-700 text-gray-700" />
                  Demo ansehen
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/kontakt"
                  className="inline-flex items-center justify-center gap-2 bg-white/[0.05] border border-white/[0.09] text-gray-300 font-semibold text-[13px] rounded-xl h-11 px-6 hover:bg-white/[0.09] hover:border-white/20 transition-all"
                >
                  <Calendar size={12} />
                  Kostenloses Gespräch
                </Link>
              </div>
              <p className="text-[11px] text-gray-700 mt-3">
                30 Min · kostenlos & unverbindlich · kein Sales-Pitch
              </p>
            </div>

            {/* ─── Facts sidebar ─── */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.18, ease: EASE }}
              className="hidden lg:flex flex-col justify-center px-8 py-14 bg-white/[0.02] border-l border-white/[0.05]"
            >
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-gray-600 mb-8">
                Branchen-Realität
              </p>
              <div className="space-y-8">
                {facts.map((fact, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.12, ease: EASE }}
                  >
                    <div className="flex items-end gap-2 mb-1.5">
                      <p className="text-[28px] font-bold tabular-nums leading-none" style={{ color: fact.color + 'cc' }}>
                        {fact.stat}
                      </p>
                      <fact.icon size={11} className="mb-1" style={{ color: fact.color + '60' }} />
                    </div>
                    <p className="text-[11.5px] text-gray-500 leading-snug">{fact.label}</p>
                    {i < facts.length - 1 && (
                      <div className="mt-8 w-8 h-px bg-white/[0.05]" />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ─── Live call preview ─── */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.28, ease: EASE }}
              className="hidden lg:flex flex-col justify-center px-8 py-14 bg-white/[0.015] border-l border-white/[0.04]"
            >
              <div className="flex items-center gap-2 mb-6">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-red-500"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-gray-600">
                  Live Gespräch
                </p>
              </div>
              <div className="space-y-2.5">
                {callPreview.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.55 + i * 0.14, ease: EASE }}
                    className={`flex ${msg.from === 'ai' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[92%] px-3 py-2 rounded-xl text-[10.5px] leading-snug ${
                        msg.from === 'ai'
                          ? 'bg-sky-500/10 text-sky-200/80 border border-sky-500/10 rounded-tl-sm'
                          : 'bg-white/[0.05] text-gray-400 rounded-tr-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-[10px] text-gray-700">
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
