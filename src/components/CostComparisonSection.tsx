import { motion, useInView, animate } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CircleCheck as CheckCircle, X, Info,
  User, Bot, TrendingDown, Star,
} from 'lucide-react';
import { type Industry, INDUSTRY_PRESETS } from './ROICalculator';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const INDUSTRY_ICONS: Record<Industry, string> = {
  Arztpraxis:     '🏥',
  Gastronomie:    '🍽️',
  Dienstleistung: '⚙️',
  Immobilien:     '🏢',
};

const KI_PRICE_MONTHLY = 297;

function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);
  useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(parseFloat(v.toFixed(decimals))),
      onComplete: () => { prevValue.current = value; },
    });
    return () => controls.stop();
  }, [value, decimals]);

  const formatted = decimals > 0
    ? display.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(display).toLocaleString('de-DE');

  return <span>{prefix}{formatted}{suffix}</span>;
}

interface SliderProps {
  label: string;
  hint?: string;
  tooltip?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}

function MiniSlider({ label, hint, tooltip, value, min, max, step, unit, onChange }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const [showTip, setShowTip] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[12.5px] font-medium text-gray-700">{label}</span>
          {hint && <span className="text-[11px] text-gray-400">{hint}</span>}
          {tooltip && (
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onMouseEnter={() => setShowTip(true)}
                onMouseLeave={() => setShowTip(false)}
                className="text-gray-300 hover:text-gray-500 transition-colors"
              >
                <Info size={11} />
              </button>
              {showTip && (
                <div className="absolute left-6 top-0 z-20 w-52 bg-gray-900 text-white text-[11px] leading-relaxed rounded-lg px-3 py-2 shadow-xl">
                  {tooltip}
                </div>
              )}
            </div>
          )}
        </div>
        <span className="text-[13px] font-bold text-gray-900 tabular-nums">
          {value.toLocaleString('de-DE')} {unit}
        </span>
      </div>
      <div className="relative h-1 bg-gray-100 rounded-full">
        <div
          className="absolute left-0 top-0 h-full bg-gray-700 rounded-full transition-all duration-150"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />
      </div>
    </div>
  );
}

const HUMAN_CAPABILITIES = [
  { label: 'Anrufe annehmen', human: true, ki: true },
  { label: 'Terminbuchung (24/7)', human: false, ki: true },
  { label: 'Gleichzeitige Anrufe', human: false, ki: true },
  { label: 'Kein Urlaub, kein Ausfall', human: false, ki: true },
  { label: 'Empathische Sonderfälle', human: true, ki: false },
  { label: 'Kalender-/CRM-Integration', human: false, ki: true },
  { label: 'Sofortige Bestätigung (SMS/Mail)', human: false, ki: true },
  { label: 'DSGVO-konform', human: true, ki: true },
];

export function CostComparisonSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.06 });

  const [industry, setIndustry] = useState<Industry>('Arztpraxis');

  const preset = INDUSTRY_PRESETS[industry];
  const [humanHours, setHumanHours] = useState(preset.adminHours);
  const [humanRate, setHumanRate] = useState(preset.hourlyRate);
  const [humanAbsence, setHumanAbsence] = useState(15);

  const applyPreset = useCallback((ind: Industry) => {
    const p = INDUSTRY_PRESETS[ind];
    setHumanHours(p.adminHours);
    setHumanRate(p.hourlyRate);
  }, []);

  const handleIndustryChange = (ind: Industry) => {
    setIndustry(ind);
    applyPreset(ind);
  };

  const humanBaseCost = Math.round(humanHours * 4.3 * humanRate);
  const humanAbsenceCost = Math.round((humanAbsence / 100) * humanBaseCost);
  const humanTotalMonth = humanBaseCost + humanAbsenceCost;

  const kiMonthly = KI_PRICE_MONTHLY;
  const saving = humanTotalMonth - kiMonthly;
  const savingPercent = humanTotalMonth > 0 ? Math.round((saving / humanTotalMonth) * 100) : 0;
  const annualSaving = saving * 12;

  return (
    <section
      ref={ref}
      className="py-28 bg-white border-t border-gray-100 overflow-hidden"
      aria-labelledby="cost-compare-heading"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* ─── Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: EASE }}
          className="max-w-2xl mb-14"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400 mb-5">
            Direktvergleich
          </p>
          <h2
            id="cost-compare-heading"
            className="text-4xl lg:text-5xl font-bold text-gray-900 leading-[1.06] tracking-[-0.022em] mb-5"
          >
            Menschlicher Assistent
            <br />
            <span className="text-gray-200">vs. KI-Telefonassistent</span>
          </h2>
          <p className="text-[15.5px] text-gray-500 leading-[1.72]">
            Stellen Sie Ihre Personalkosten ein — und sehen Sie sofort, was der Unterschied
            für Ihr Unternehmen bedeutet. Die Zahlen sind Ihre, nicht unsere.
          </p>
        </motion.div>

        {/* ─── Industry selector ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
          className="flex flex-wrap gap-2 mb-10"
        >
          <span className="text-[12px] text-gray-400 self-center mr-1">Branche:</span>
          {(Object.keys(INDUSTRY_PRESETS) as Industry[]).map((ind) => (
            <button
              key={ind}
              type="button"
              onClick={() => handleIndustryChange(ind)}
              className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-1.5 rounded-xl border transition-all duration-200 ${
                industry === ind
                  ? 'bg-gray-950 text-white border-gray-950'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
              }`}
            >
              <span>{INDUSTRY_ICONS[ind]}</span>
              {ind}
            </button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.12, ease: EASE }}
          className="grid lg:grid-cols-[1fr_1fr_400px] gap-5 items-start"
        >

          {/* ─── COLUMN 1: Human assistant ─── */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200 bg-gray-100/50">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                  <User size={14} className="text-gray-500" />
                </div>
                <h3 className="text-[15px] font-bold text-gray-800">Menschlicher Assistent</h3>
              </div>
              <p className="text-[11.5px] text-gray-500">Ihre heutige Situation — personalisierbar</p>
            </div>

            <div className="px-8 py-6 space-y-6">
              <MiniSlider
                label="Admin-Stunden / Woche"
                hint="für Telefon & Koordination"
                tooltip="Wie viele Stunden verbringt Ihr Personal pro Woche mit Telefonie und Terminverwaltung?"
                value={humanHours}
                min={2} max={40} step={1} unit="h"
                onChange={setHumanHours}
              />
              <MiniSlider
                label="Stundensatz (inkl. AG-Kosten)"
                tooltip="Bruttogehalt + Sozialabgaben + Nebenkosten. Typisch: 25–50 €/h."
                value={humanRate}
                min={12} max={80} step={1} unit="€/h"
                onChange={setHumanRate}
              />
              <MiniSlider
                label="Ausfallquote"
                hint="Urlaub, Krankheit, Pausen"
                tooltip="Wie viel Prozent der Arbeitszeit ist Ihr Assistent durch Urlaub, Krankheit oder Pausen nicht erreichbar? Durchschnitt: 15–25%."
                value={humanAbsence}
                min={0} max={40} step={1} unit="%"
                onChange={setHumanAbsence}
              />

              <div className="pt-2 border-t border-gray-200 space-y-2.5">
                <div className="flex justify-between text-[12.5px]">
                  <span className="text-gray-500">Grundkosten / Monat</span>
                  <span className="font-semibold text-gray-700 tabular-nums">
                    <AnimatedNumber value={humanBaseCost} suffix=" €" />
                  </span>
                </div>
                <div className="flex justify-between text-[12.5px]">
                  <span className="text-gray-500">Ausfallkosten / Monat</span>
                  <span className="font-semibold text-gray-700 tabular-nums">
                    + <AnimatedNumber value={humanAbsenceCost} suffix=" €" />
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-[14px] font-bold text-gray-900">Gesamt / Monat</span>
                  <span className="text-[20px] font-bold text-gray-900 tabular-nums">
                    <AnimatedNumber value={humanTotalMonth} suffix=" €" />
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 mb-3">
                  Einschränkungen
                </p>
                {[
                  'Nur zu Öffnungszeiten erreichbar',
                  'Kein Anruf nach Feierabend',
                  'Krank, Urlaub, Stoßzeiten',
                  'Teuer in der Skalierung',
                ].map((limit) => (
                  <div key={limit} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                      <X size={8} className="text-red-400" />
                    </div>
                    <span className="text-[12px] text-gray-500">{limit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── COLUMN 2: KI assistant ─── */}
          <div className="bg-gray-950 border border-white/[0.06] rounded-2xl overflow-hidden relative">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 60% 0%, rgba(2,132,199,0.10) 0%, transparent 55%)' }}
            />
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(2,132,199,0.4), rgba(16,185,129,0.2), transparent)' }}
            />

            <div className="relative px-8 py-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                  <Bot size={14} className="text-sky-400" />
                </div>
                <h3 className="text-[15px] font-bold text-white">Cogniiq KI-Assistent</h3>
                <span className="ml-auto text-[9.5px] font-semibold text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 rounded-full">
                  Empfohlen
                </span>
              </div>
              <p className="text-[11.5px] text-gray-500">Fixpreis. Transparent. Sofort einsetzbar.</p>
            </div>

            <div className="relative px-8 py-6">
              {/* Fixed price display */}
              <div className="mb-6 pb-6 border-b border-white/[0.05]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600 mb-3">
                  Monatliche Investition
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[42px] font-bold text-white tabular-nums leading-none">
                    {KI_PRICE_MONTHLY} €
                  </span>
                  <span className="text-[13px] text-gray-500">/ Monat</span>
                </div>
                <p className="text-[11.5px] text-gray-600 mt-2">
                  Einmalige Einrichtung · kündbar monatlich · kein verstecktes
                </p>
              </div>

              {/* What's included */}
              <div className="space-y-2 mb-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-600 mb-3">
                  Was enthalten ist
                </p>
                {[
                  '24/7 Anrufannahme — kein Besetztzeichen',
                  'Automatische Terminbuchung',
                  'Integration Kalender & CRM',
                  'Sofortbestätigung per SMS oder Mail',
                  'Unbegrenzte gleichzeitige Anrufe',
                  'DSGVO-konform · deutsche Server',
                  'Laufende Optimierung inklusive',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={8} className="text-emerald-400" />
                    </div>
                    <span className="text-[12px] text-gray-400">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Simulated cost total */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="flex justify-between pt-2">
                  <span className="text-[14px] font-bold text-gray-300">Gesamt / Monat</span>
                  <span className="text-[20px] font-bold text-white tabular-nums">
                    {KI_PRICE_MONTHLY} €
                  </span>
                </div>
                <p className="text-[10.5px] text-gray-700 mt-1.5">
                  Fixpreis. Keine Überraschungen.
                </p>
              </div>
            </div>
          </div>

          {/* ─── COLUMN 3: Saving summary ─── */}
          <div className="flex flex-col gap-4">

            {/* Savings card */}
            <div className="relative bg-emerald-950/80 border border-emerald-900/40 rounded-2xl p-7 overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.15) 0%, transparent 60%)' }}
              />
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)' }}
              />

              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown size={13} className="text-emerald-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                    Ihre Ersparnis
                  </p>
                </div>

                <p className="text-[13px] text-emerald-300/70 mb-1">Sie sparen jeden Monat</p>
                <p className="text-[40px] font-bold text-emerald-300 tabular-nums leading-none mb-1">
                  <AnimatedNumber value={Math.max(saving, 0)} suffix=" €" />
                </p>
                <p className="text-[12px] text-emerald-500/60 mb-6">
                  = <AnimatedNumber value={Math.max(savingPercent, 0)} suffix="%" /> weniger als heute
                </p>

                <div className="flex items-baseline gap-1.5 bg-emerald-900/40 border border-emerald-800/40 rounded-xl p-4">
                  <div>
                    <p className="text-[10px] text-emerald-600 uppercase tracking-wide font-semibold mb-1">
                      Jahresersparnis
                    </p>
                    <p className="text-[26px] font-bold text-emerald-300 tabular-nums leading-none">
                      <AnimatedNumber value={Math.max(annualSaving, 0)} suffix=" €" />
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Capability comparison */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 mb-4">
                Leistungsvergleich
              </p>
              <div className="space-y-0">
                {HUMAN_CAPABILITIES.map((cap, i) => (
                  <div
                    key={cap.label}
                    className={`flex items-center justify-between py-2.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                  >
                    <span className="text-[12px] text-gray-600">{cap.label}</span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${cap.human ? 'bg-gray-100' : 'bg-red-50'}`}
                      >
                        {cap.human
                          ? <CheckCircle size={9} className="text-gray-400" />
                          : <X size={8} className="text-red-400" />
                        }
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${cap.ki ? 'bg-emerald-50' : 'bg-gray-50'}`}
                      >
                        {cap.ki
                          ? <CheckCircle size={9} className="text-emerald-500" />
                          : <X size={8} className="text-gray-300" />
                        }
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end gap-5 pt-3 border-t border-gray-100">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <User size={9} /> Mensch
                  </span>
                  <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                    <Bot size={9} /> KI
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gray-950 rounded-2xl p-6 relative overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 70% 20%, rgba(2,132,199,0.08) 0%, transparent 55%)' }}
              />
              <div className="relative">
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={10} className="text-amber-400 fill-amber-400" />
                  ))}
                  <span className="text-[11px] text-gray-500 ml-1">40+ Kunden</span>
                </div>
                <p className="text-[14px] font-bold text-white mb-1.5">
                  KI-Assistent live in 14 Tagen
                </p>
                <p className="text-[12px] text-gray-500 mb-5 leading-relaxed">
                  Kündbar monatlich · DSGVO-konform · persönliche Einrichtung
                </p>
                <Link
                  to="/kontakt"
                  className="group w-full inline-flex items-center justify-center gap-2.5 bg-white text-gray-900 font-semibold text-[13px] rounded-xl h-11 px-5 hover:bg-gray-50 transition-colors"
                >
                  Jetzt starten
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
