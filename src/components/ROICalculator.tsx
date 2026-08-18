import { motion, useInView } from 'framer-motion';
import { useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Info, TrendingDown, Phone, ChevronDown } from 'lucide-react';
import { INDUSTRY_PRESETS, type Industry } from '@/lib/roi-presets';


const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1] as [number, number, number, number];


const INDUSTRY_CONTEXT: Record<Industry, string> = {
  Arztpraxis:     'Verpasste Anrufe kosten Praxen regelmäßig Neupatienten, die sich anderswo melden.',
  Gastronomie:    'Reservierungsanrufe, die niemand annimmt, werden selten wiederholt.',
  Dienstleistung: 'Ein verpasster Anruf ist oft ein verlorener Auftrag.',
  Immobilien:     'Ein unbeantworteter Anruf kann eine Provision von mehreren tausend Euro kosten.',
};

const INDUSTRY_ICONS: Record<Industry, string> = {
  Arztpraxis:     '🏥',
  Gastronomie:    '🍽️',
  Dienstleistung: '⚙️',
  Immobilien:     '🏢',
};

// Zahlen aktualisieren sich sofort und zaehlen nicht hoch (COPY-BRIEF-3 §1.4).
function Amount({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  return <span>{prefix}{Math.round(value).toLocaleString('de-DE')}{suffix}</span>;
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
            <span className="font-medium text-gray-700">Gerechnet wird nur mit Ihren Eingaben.</span>
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
                  hint="Beispielwert – bitte anpassen"
                  tooltip="Wie viel Prozent Ihrer Anrufe werden nicht beantwortet? Der Startwert ist ein frei änderbares Beispiel, keine Branchenstatistik."
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
                  tooltip="Bruttogehalt + Sozialabgaben + Arbeitgeberbeiträge pro Stunde – schätzen Sie mit Ihren eigenen Werten."
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
                  Die Startwerte sind frei gewählte Beispiele — maßgeblich sind Ihre eigenen Eingaben.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Results panel */}
          <div className="flex flex-col gap-4">
            <div className="bg-gray-950 rounded-2xl p-8 flex-1 relative overflow-hidden">
              <div className="relative">
                {/* Kein Severity-Badge: Rot bleibt Fehlerzustaenden vorbehalten
                    (COPY-BRIEF-3 §1.1), und eine Dringlichkeitsstufe aus den
                    eigenen Eingaben des Besuchers abzuleiten ist Dramatisierung. */}
                <div className="mb-7">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600">
                    Ergebnis Ihrer Eingaben
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                    <div className="flex items-center gap-2">
                      <Phone size={11} className="text-gray-600" />
                      <span className="text-[12px] text-gray-500">Verpasste Anrufe / Woche</span>
                    </div>
                    <span className="text-[13.5px] font-semibold text-white/80 tabular-nums">
                      <Amount value={missedCallsPerWeek} suffix=" Stk." />
                    </span>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between mb-0.5">
                      <span className="text-[12px] text-gray-500">Entgangener Umsatz / Monat</span>
                      <span className="text-[14px] font-semibold text-white/80 tabular-nums">
                        <Amount value={lostRevenueMonth} prefix="−" suffix=" €" />
                      </span>
                    </div>
                    <p className="text-[10.5px] text-gray-700">Anrufe × Ø-Umsatz, aus Ihren Eingaben</p>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between mb-0.5">
                      <span className="text-[12px] text-gray-500">Manuelle Personalkosten / Monat</span>
                      <span className="text-[14px] font-semibold text-white/80 tabular-nums">
                        <Amount value={adminCostMonth} prefix="−" suffix=" €" />
                      </span>
                    </div>
                    <p className="text-[10.5px] text-gray-700">Stunden × Stundensatz × 4,3 Wochen</p>
                  </div>
                  <div className="flex items-baseline justify-between pt-2 border-t border-white/[0.05]">
                    <span className="text-[14px] font-semibold text-gray-300">Summe / Monat</span>
                    <span className="text-[22px] font-bold text-white tabular-nums">
                      <Amount value={totalLossMonth} prefix="−" suffix=" €" />
                    </span>
                  </div>
                </div>

                <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-5">
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gray-600 mb-2">
                    Summe Ihrer Eingaben, auf zwoelf Monate
                  </p>
                  <p className="text-[34px] font-bold text-white tabular-nums leading-none mb-1">
                    <Amount value={annualPotential} suffix=" €" />
                  </p>
                  <p className="text-[11px] text-gray-600 mt-1.5 leading-relaxed">
                    Das ist die Hochrechnung Ihrer eigenen Angaben, kein Betrag, der
                    sich zurückgewinnen lässt. Ein Telefonassistent nimmt Anrufe an,
                    die sonst niemand annimmt — er ersetzt nicht die Arbeit, die
                    danach folgt. Welcher Anteil in Ihrem Betrieb überhaupt
                    beeinflussbar ist, klären wir im Gespräch.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-7">
              <p className="text-[14.5px] font-semibold text-gray-900 mb-1.5">
                Diese Zahlen konkret machen?
              </p>
              <p className="text-[12.5px] text-gray-500 mb-5 leading-relaxed">
                30&nbsp;Minuten. Wir zeigen, welcher Teil in Ihrem Unternehmen sofort
                automatisierbar ist — ohne großen Aufwand.
              </p>
              <Link
                to="/kontakt"
                className="group w-full inline-flex items-center justify-center gap-2.5 bg-gray-950 text-white font-semibold text-[13.5px] rounded-xl h-11 px-6 hover:bg-gray-800 transition-colors"
              >
                Kostenloses Erstgespräch
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </Link>
              {/* [[CLAIM: verify — Reaktionszeit 24 h (OWNER-INPUT D3)]] */}
              <p className="text-[11px] text-gray-400 text-center mt-3">
                Kostenlos & unverbindlich · Antwort in der Regel innerhalb 24 h
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 py-1">
              <ChevronDown size={14} className="text-gray-300" />
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
