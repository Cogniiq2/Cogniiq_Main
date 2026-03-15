import { motion, useInView, animate } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Industry = 'Arztpraxis' | 'Gastronomie' | 'Dienstleistung' | 'Immobilien';

interface Preset {
  callsPerWeek: number;
  missedPercent: number;
  avgValue: number;
  adminHours: number;
  hourlyRate: number;
}

const INDUSTRY_PRESETS: Record<Industry, Preset> = {
  Arztpraxis: { callsPerWeek: 120, missedPercent: 30, avgValue: 180, adminHours: 15, hourlyRate: 28 },
  Gastronomie: { callsPerWeek: 80, missedPercent: 35, avgValue: 65, adminHours: 10, hourlyRate: 18 },
  Dienstleistung: { callsPerWeek: 50, missedPercent: 25, avgValue: 320, adminHours: 12, hourlyRate: 35 },
  Immobilien: { callsPerWeek: 40, missedPercent: 20, avgValue: 4500, adminHours: 20, hourlyRate: 45 },
};

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
      onComplete: () => { prevValue.current = value; },
    });
    return () => controls.stop();
  }, [value]);

  return (
    <span>
      {prefix}
      {display.toLocaleString('de-DE')}
      {suffix}
    </span>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step, unit, onChange }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12.5px] font-medium text-gray-600">{label}</span>
        <span className="text-[12.5px] font-semibold text-gray-900 tabular-nums">
          {value.toLocaleString('de-DE')} {unit}
        </span>
      </div>
      <div className="relative h-1.5 bg-gray-100 rounded-full">
        <div
          className="absolute left-0 top-0 h-full bg-gray-900 rounded-full"
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

export function ROICalculator() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.08 });

  const [industry, setIndustry] = useState<Industry>('Arztpraxis');
  const [callsPerWeek, setCallsPerWeek] = useState(120);
  const [missedPercent, setMissedPercent] = useState(30);
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

  return (
    <section
      ref={ref}
      className="py-28 bg-gray-50"
      aria-labelledby="roi-heading"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: EASE }}
          className="max-w-2xl mb-16"
        >
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-5">
            Potenzialrechner
          </p>
          <h2
            id="roi-heading"
            className="text-4xl lg:text-5xl font-bold text-gray-900 leading-[1.08] tracking-tight mb-5"
          >
            Was kostet Sie
            <br />
            <span className="text-gray-300">der Status quo?</span>
          </h2>
          <p className="text-[15px] text-gray-500 leading-relaxed">
            Passen Sie die Werte an Ihr Unternehmen an. Die Rechnung zeigt, was durch verpasste Anrufe und manuelle Arbeit monatlich verloren geht.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.1, ease: EASE }}
          className="grid lg:grid-cols-[1fr_440px] gap-6"
        >
          <div className="bg-white rounded-2xl border border-gray-100 p-8 lg:p-10">
            <div className="mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 mb-3">
                Branche
              </p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(INDUSTRY_PRESETS) as Industry[]).map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => handleIndustryChange(ind)}
                    className={`text-[12px] font-semibold px-4 py-2 rounded-xl border transition-all ${
                      industry === ind
                        ? 'bg-gray-950 text-white border-gray-950'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-800'
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-7">
              <Slider
                label="Anrufe pro Woche"
                value={callsPerWeek}
                min={10}
                max={300}
                step={5}
                unit="Anrufe"
                onChange={setCallsPerWeek}
              />
              <Slider
                label="Davon verpasst / unbeantwortet"
                value={missedPercent}
                min={5}
                max={60}
                step={1}
                unit="%"
                onChange={setMissedPercent}
              />
              <Slider
                label="Ø Auftragswert pro Anruf"
                value={avgValue}
                min={20}
                max={10000}
                step={10}
                unit="€"
                onChange={setAvgValue}
              />
              <Slider
                label="Manuelle Admin-Stunden pro Woche"
                value={adminHours}
                min={2}
                max={40}
                step={1}
                unit="h"
                onChange={setAdminHours}
              />
              <Slider
                label="Effektiver Stundensatz (Personal)"
                value={hourlyRate}
                min={12}
                max={80}
                step={1}
                unit="€/h"
                onChange={setHourlyRate}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-gray-950 rounded-2xl p-8 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-600 mb-7">
                Ihr monatliches Verlustpotenzial
              </p>

              <div className="space-y-5 mb-8">
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] text-gray-500">Verpasste Anrufe / Woche</span>
                  <span className="text-[15px] font-semibold text-white tabular-nums">
                    <AnimatedNumber value={missedCallsPerWeek} suffix=" Anrufe" />
                  </span>
                </div>
                <div className="w-full h-px bg-white/[0.05]" />
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] text-gray-500">Entgangener Umsatz / Monat</span>
                  <span className="text-[15px] font-semibold text-white tabular-nums">
                    <AnimatedNumber value={lostRevenueMonth} prefix="−" suffix=" €" />
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] text-gray-500">Manuelle Arbeitskosten / Monat</span>
                  <span className="text-[15px] font-semibold text-white tabular-nums">
                    <AnimatedNumber value={adminCostMonth} prefix="−" suffix=" €" />
                  </span>
                </div>
                <div className="w-full h-px bg-white/[0.05]" />
                <div className="flex items-baseline justify-between">
                  <span className="text-[13.5px] font-semibold text-gray-400">Gesamt / Monat</span>
                  <span className="text-[19px] font-bold text-white tabular-nums">
                    <AnimatedNumber value={totalLossMonth} prefix="−" suffix=" €" />
                  </span>
                </div>
              </div>

              <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={13} className="text-gray-600" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
                    Jahrespotenzial
                  </span>
                </div>
                <p className="text-3xl font-bold text-white tabular-nums">
                  <AnimatedNumber value={annualPotential} suffix=" €" />
                </p>
                <p className="text-[12px] text-gray-600 mt-1.5">
                  wiedergewinnbares Umsatz- und Einsparpotenzial
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-7">
              <p className="text-[14px] font-semibold text-gray-900 mb-1.5">
                Potenzial konkret machen?
              </p>
              <p className="text-[12.5px] text-gray-500 mb-5 leading-relaxed">
                30 Minuten Gespräch. Wir zeigen, was in Ihrem Unternehmen konkret umsetzbar ist.
              </p>
              <Link
                to="/kontakt"
                className="group w-full inline-flex items-center justify-center gap-2.5 bg-gray-950 text-white font-semibold text-[13px] rounded-xl h-11 px-6 hover:bg-gray-800 transition-colors"
              >
                Kostenloses Erstgespräch
                <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <p className="text-[11px] text-gray-400 text-center mt-3">
                Kostenlos & unverbindlich · Antwort innerhalb von 24 h
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
