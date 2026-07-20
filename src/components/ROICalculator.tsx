import { motion, useInView, animate } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Info, TrendingDown, Phone, ChevronDown } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type Industry = 'Arztpraxis' | 'Gastronomie' | 'Dienstleistung' | 'Immobilien';

interface Preset {
  callsPerWeek: number;
  missedPercent: number;
  avgValue: number;
  adminHours: number;
  hourlyRate: number;
}

export const INDUSTRY_PRESETS: Record<Industry, Preset> = {
  Arztpraxis:     { callsPerWeek: 120, missedPercent: 32, avgValue: 180,  adminHours: 15, hourlyRate: 28 },
  Gastronomie:    { callsPerWeek: 80,  missedPercent: 35, avgValue: 65,   adminHours: 10, hourlyRate: 18 },
  Dienstleistung: { callsPerWeek: 50,  missedPercent: 28, avgValue: 320,  adminHours: 12, hourlyRate: 35 },
  Immobilien:     { callsPerWeek: 40,  missedPercent: 22, avgValue: 4500, adminHours: 20, hourlyRate: 45 },
};

const INDUSTRY_CONTEXT: Record<Industry, string> = {
  Arztpraxis:     'Praxen verlieren im Schnitt 38 Neupatienten pro Monat durch verpasste Anrufe.',
  Gastronomie:    'Restaurants entgehen täglich 4–8 Reservierungen, die nie zurückrufen.',
  Dienstleistung: 'Jeder verpasste Anruf entspricht im Schnitt einem abgesprungenen Auftrag.',
  Immobilien:     'Ein unbeantworteter Anruf kann eine Provision von mehreren tausend Euro kosten.',
};

const INDUSTRY_ICONS: Record<Industry, string> = {
  Arztpraxis:     '🏥',
  Gastronomie:    '🍽️',
  Dienstleistung: '⚙️',
  Immobilien:     '🏢',
};

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);
  useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      onUpdate: (v) => setDisplay(Math.round(v)),
      onComplete: () => { prevValue.current = value; },
    });
    return () => controls.stop();
  }, [value]);
  return <span>{prefix}{display.toLocaleString('de-DE')}{suffix}</span>;
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

function Slider({ label, hint, tooltip, value, min, max, step, unit, onChange }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const [showTip, setShowTip] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div>
            <span className="text-[13px] font-medium text-gray-800">{label}</span>
            {hint && <span className="ml-1.5 text-[11px] text-gray-400 font-normal">{hint}</span>}
          </div>
          {tooltip && (
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onMouseEnter={() => setShowTip(true)}
                onMouseLeave={() => setShowTip(false)}
                className="text-gray-300 hover:text-gray-500 transition-colors"
              >
                <Info size={12} />
              </button>
              {showTip && (
                <div className="absolute left-6 top-0 z-20 w-52 bg-gray-900 text-white text-[11px] leading-relaxed rounded-lg px-3 py-2 shadow-xl">
                  {tooltip}
                </div>
              )}
            </div>
          )}
        </div>
        <span className="text-[14px] font-bold text-gray-900 tabular-nums ml-4 flex-shrink-0">
          {value.toLocaleString('de-DE')} {unit}
        </span>
      </div>
      <div className="relative h-1.5 bg-gray-100 rounded-full mt-1.5">
        <div
          className="absolute left-0 top-0 h-full bg-gray-900 rounded-full transition-all duration-150"
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
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-300">{min.toLocaleString('de-DE')} {unit}</span>
        <span className="text-[10px] text-gray-300">{max.toLocaleString('de-DE')} {unit}</span>
      </div>
    </div>
  );
}

export function ROICalculator() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.06 });

  const [industry, setIndustry] = useState<Industry>('Arztpraxis');
  const [callsPerWeek, setCallsPerWeek] = useState(120);
  const [missedPercent, setMissedPercent] = useState(32);
  const [avgValue, setAvgValue] = useState(180);
  const [adminHours, setAdminHours] = useState(15);
  const [hourlyRate, setHourlyRate] = useState(28);

  const applyPreset = useCallback((ind: Industry) => {
    const p = INDUSTRY_PRESETS[ind];
    setCallsPerWeek(p.callsPerWeek);
    setMissedPercent(p.missedPercent);
    setAvgValue(p.avgValue);
    setAdminHours(p.adminHours);
    setHourlyRate(p.hourlyRate);
  }, []);

  const handleIndustryChange = (ind: Industry) => {
    setIndustry(ind);
    applyPreset(ind);
  };

  const missedCallsPerWeek = Math.round((callsPerWeek * missedPercent) / 100);
  const lostRevenueMonth = Math.round(missedCallsPerWeek * 4.3 * avgValue);
  const adminCostMonth = Math.round(adminHours * 4.3 * hourlyRate);
  const totalLossMonth = lostRevenueMonth + adminCostMonth;
  const annualPotential = totalLossMonth * 12;

  const severityLevel = totalLossMonth < 3000 ? 'low' : totalLossMonth < 8000 ? 'medium' : 'high';

  return (
    <section ref={ref} className="py-28 bg-gray-50" aria-labelledby="roi-heading">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* ─── Section header ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: EASE }}
          className="max-w-2xl mb-14"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400 mb-5">
            Ihr persönlicher Potenzialrechner
          </p>
          <h2
            id="roi-heading"
            className="text-4xl lg:text-5xl font-bold text-gray-900 leading-[1.06] tracking-[-0.022em] mb-5"
          >
            Was verliert Ihr
            <br />
            <span className="text-gray-200">Unternehmen gerade?</span>
          </h2>
          <p className="text-[15.5px] text-gray-500 leading-[1.72]">
            Stellen Sie die Regler auf Ihre Situation ein — die Kalkulation zeigt Ihnen in
            Echtzeit, wie viel durch verpasste Anrufe und manuelle Verwaltung jeden Monat
            verloren geht.{' '}
            <span className="font-medium text-gray-700">Konservativ gerechnet.</span>
          </p>
        </motion.div>

        {/* ─── Calculator grid ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.1, ease: EASE }}
          className="grid lg:grid-cols-[1fr_420px] gap-6"
        >
          {/* LEFT: Input panel */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 lg:p-10">

            {/* Step 1 */}
            <div className="mb-10">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white text-[10px] font-bold flex-shrink-0">1</span>
                <p className="text-[13.5px] font-semibold text-gray-800">
                  Wählen Sie Ihre Branche
                </p>
                <span className="text-[11px] text-gray-400 hidden sm:inline">— wir befüllen die Startwerte vor</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(INDUSTRY_PRESETS) as Industry[]).map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => handleIndustryChange(ind)}
                    className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-xl border transition-all duration-200 ${
                      industry === ind
                        ? 'bg-gray-950 text-white border-gray-950 shadow-sm'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-800'
                    }`}
                  >
                    <span className="text-sm">{INDUSTRY_ICONS[ind]}</span>
                    {ind}
                  </button>
                ))}
              </div>

              <motion.div
                key={industry}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3"
              >
                <TrendingDown size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-700 leading-relaxed font-medium">
                  {INDUSTRY_CONTEXT[industry]}
                </p>
              </motion.div>
            </div>

            {/* Step 2 */}
            <div>
              <div className="flex items-center gap-2.5 mb-6">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white text-[10px] font-bold flex-shrink-0">2</span>
                <p className="text-[13.5px] font-semibold text-gray-800">
                  Passen Sie die Werte an Ihre Realität an
                </p>
              </div>

              <div className="space-y-8">
                <Slider
                  label="Anrufe pro Woche"
                  hint="eingehend gesamt"
                  tooltip="Wie viele Anrufe gehen bei Ihnen pro Woche ein? Zählen Sie alle — auch die, die Sie nicht annehmen."
                  value={callsPerWeek}
                  min={10} max={300} step={5} unit="Anrufe"
                  onChange={setCallsPerWeek}
                />
                <Slider
                  label="Davon verpasst oder unbeantwortet"
                  hint="branchenüblich: 25–40%"
                  tooltip="Wie viel Prozent Ihrer Anrufe werden nicht beantwortet? Bei Stoßzeiten, Urlaub oder Mittagspause schnell 30–40%."
                  value={missedPercent}
                  min={5} max={60} step={1} unit="%"
                  onChange={setMissedPercent}
                />
                <Slider
                  label="Ø Umsatz pro erfolgreichem Anruf"
                  hint="konservativ schätzen"
                  tooltip="Was bringt ein gebuchter Termin oder ein gewonnener Auftrag im Schnitt ein? Schätzen Sie eher niedrig."
                  value={avgValue}
                  min={20} max={10000} step={10} unit="€"
                  onChange={setAvgValue}
                />
                <Slider
                  label="Manuelle Admin-Stunden pro Woche"
                  hint="Terminkoord., Follow-ups, Rückrufe"
                  tooltip="Stunden Ihres Teams für Verwaltungsaufgaben, die ein KI-System übernehmen könnte."
                  value={adminHours}
                  min={2} max={40} step={1} unit="h"
                  onChange={setAdminHours}
                />
                <Slider
                  label="Effektiver Stundensatz Ihres Personals"
                  hint="inkl. Arbeitgeberkosten"
                  tooltip="Bruttogehalt + Sozialabgaben + Arbeitgeberbeiträge pro Stunde. Typisch: 25–50 €/h."
                  value={hourlyRate}
                  min={12} max={80} step={1} unit="€/h"
                  onChange={setHourlyRate}
                />
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <Info size={11} className="text-gray-400 flex-shrink-0" />
                  <p className="text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide">
                    Rechenweg
                  </p>
                </div>
                <p className="text-[11.5px] text-gray-400 leading-relaxed">
                  Verpasste Anrufe × Wochen × Ø-Umsatz + Admin-Stunden × Wochen × Stundensatz.
                  Alle Zahlen konservativ angesetzt — die Realität ist oft höher.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Results panel */}
          <div className="flex flex-col gap-4">
            <div className="bg-gray-950 rounded-2xl p-8 flex-1 relative overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    severityLevel === 'high'
                      ? 'radial-gradient(ellipse at 60% 10%, rgba(239,68,68,0.09) 0%, transparent 55%)'
                      : severityLevel === 'medium'
                      ? 'radial-gradient(ellipse at 60% 10%, rgba(245,158,11,0.07) 0%, transparent 55%)'
                      : 'radial-gradient(ellipse at 60% 10%, rgba(2,132,199,0.07) 0%, transparent 55%)',
                }}
              />
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background:
                    severityLevel === 'high'
                      ? 'linear-gradient(90deg, transparent, rgba(239,68,68,0.4), transparent)'
                      : 'linear-gradient(90deg, transparent, rgba(2,132,199,0.3), transparent)',
                }}
              />

              <div className="relative">
                <div className="flex items-center justify-between mb-7">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600">
                    Ihre Verlustanalyse
                  </p>
                  <motion.span
                    key={severityLevel}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`text-[9.5px] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border ${
                      severityLevel === 'high'
                        ? 'border-red-900/50 text-red-400/80 bg-red-950/40'
                        : severityLevel === 'medium'
                        ? 'border-orange-900/50 text-orange-400/70 bg-orange-950/30'
                        : 'border-white/[0.08] text-gray-500'
                    }`}
                  >
                    {severityLevel === 'high' ? 'Kritisch' : severityLevel === 'medium' ? 'Erheblich' : 'Erkennbar'}
                  </motion.span>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                    <div className="flex items-center gap-2">
                      <Phone size={11} className="text-gray-600" />
                      <span className="text-[12px] text-gray-500">Verpasste Anrufe / Woche</span>
                    </div>
                    <span className="text-[13.5px] font-semibold text-white/80 tabular-nums">
                      <AnimatedNumber value={missedCallsPerWeek} suffix=" Stk." />
                    </span>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between mb-0.5">
                      <span className="text-[12px] text-gray-500">Entgangener Umsatz / Monat</span>
                      <span className="text-[14px] font-semibold text-white/80 tabular-nums">
                        <AnimatedNumber value={lostRevenueMonth} prefix="−" suffix=" €" />
                      </span>
                    </div>
                    <p className="text-[10.5px] text-gray-700">Anrufe × Ø-Umsatz, konservativ gerechnet</p>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between mb-0.5">
                      <span className="text-[12px] text-gray-500">Manuelle Personalkosten / Monat</span>
                      <span className="text-[14px] font-semibold text-white/80 tabular-nums">
                        <AnimatedNumber value={adminCostMonth} prefix="−" suffix=" €" />
                      </span>
                    </div>
                    <p className="text-[10.5px] text-gray-700">Stunden × Stundensatz × 4,3 Wochen</p>
                  </div>
                  <div className="flex items-baseline justify-between pt-2 border-t border-white/[0.05]">
                    <span className="text-[14px] font-semibold text-gray-300">Verlust gesamt / Monat</span>
                    <span className="text-[22px] font-bold text-white tabular-nums">
                      <AnimatedNumber value={totalLossMonth} prefix="−" suffix=" €" />
                    </span>
                  </div>
                </div>

                <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-5">
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gray-600 mb-2">
                    Wiedergewinnbares Jahrespotenzial
                  </p>
                  <p className="text-[34px] font-bold text-white tabular-nums leading-none mb-1">
                    <AnimatedNumber value={annualPotential} suffix=" €" />
                  </p>
                  <p className="text-[11px] text-gray-600 mt-1.5">
                    durch vollständige Automatisierung zurückgewinnbar
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-7">
              <p className="text-[14.5px] font-semibold text-gray-900 mb-1.5">
                Diese Zahlen konkret machen?
              </p>
              <p className="text-[12.5px] text-gray-500 mb-5 leading-relaxed">
                30 Minuten. Wir zeigen, welcher Teil in Ihrem Unternehmen sofort
                automatisierbar ist — ohne großen Aufwand.
              </p>
              <Link
                to="/kontakt"
                className="group w-full inline-flex items-center justify-center gap-2.5 bg-gray-950 text-white font-semibold text-[13.5px] rounded-xl h-11 px-6 hover:bg-gray-800 transition-colors"
              >
                Kostenloses Erstgespräch
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <p className="text-[11px] text-gray-400 text-center mt-3">
                Kostenlos & unverbindlich · Antwort innerhalb 24 h
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 py-1">
              <ChevronDown size={14} className="text-gray-300 animate-bounce" />
              <p className="text-[11.5px] text-gray-400">
                Weiter: KI vs. menschlicher Assistent im Direktvergleich
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
