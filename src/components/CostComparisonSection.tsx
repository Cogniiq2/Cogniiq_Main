// ─────────────────────────────────────────────────────────────────────────────
// Mensch vs. KI-Empfang — ein VERGLEICH, kein Rechner (Stand 11.09.2026).
//
// WAS HIER VORHER STAND UND WARUM ES WEG MUSSTE.
//
// Diese Datei war der zweite Rechner der Startseite. Sie hatte eigene Regler
// für Personalkosten, einen eigenen Wochenfaktor (4,3, während der Praxis-
// Rechner mit 4,33 rechnete) und — das Schwerwiegendste — eine eigene
// Preisbehauptung:
//
//     const KI_PRICE_MONTHLY = 297;
//
// 297 € stand in keiner Tarifliste. Die veröffentlichten Tarife beginnen bei
// 300 € und richten sich nach dem Minutenkontingent; für einen Besucher mit
// 800 Anrufen im Monat rechnet das kanonische Modell etwas völlig anderes aus.
// Die Seite behauptete damit einen Preis, den sie im selben Atemzug an anderer
// Stelle widerlegte, und leitete daraus eine „Ersparnis" und eine
// „Jahresersparnis" ab — zwei große grüne Zahlen auf einer erfundenen Basis.
//
// WAS JETZT HIER STEHT. Der Vergleich, der tatsächlich trägt: was ein Mensch
// am Empfang leisten kann und was ein Assistent leisten kann, Eigenschaft für
// Eigenschaft, mit den Grenzen beider Seiten offen benannt. Keine Zahl, die
// nicht aus `telefonassistent-copy.ts` kommt.
//
// WER DEN PREIS WISSEN WILL, bekommt ihn eine Sektion weiter oben — aus dem
// einen Rechenkern des Projekts, mit den eigenen Zahlen des Besuchers. Der
// Verweis unten führt dorthin.
// ─────────────────────────────────────────────────────────────────────────────
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calculator, CircleCheck as CheckCircle, X, User, Bot } from 'lucide-react';
import { trackEvent } from '@/lib/consent';
import { RECHNER_LINK, RECHNER_VERSPRECHEN } from '@/lib/rechner-anker';
import { FAKTEN } from '@/lib/telefonassistent-copy';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1] as [number, number, number, number];

/*
  Der Vergleich ist bewusst in beide Richtungen ehrlich. Eine Tabelle, in der
  eine Spalte durchgehend gewinnt, liest sich als Werbung und wird nicht
  geglaubt — und wäre hier auch falsch: Es gibt Anliegen, die ein Mensch besser
  auffängt, und die stehen als solche drin.
*/
const VERGLEICH: Array<{ label: string; mensch: boolean; ki: boolean; hinweis?: string }> = [
  { label: 'Anrufe zu den Öffnungszeiten annehmen', mensch: true, ki: true },
  { label: 'Anrufe außerhalb der Öffnungszeiten annehmen', mensch: false, ki: true },
  { label: 'Mehrere Anrufe zur selben Zeit annehmen', mensch: false, ki: true },
  {
    label: 'Konfigurierte Routineabläufe vollständig abwickeln',
    mensch: true,
    ki: true,
    hinweis: 'Termin buchen, verschieben, absagen, vorgegebene Fragen beantworten — ohne dass daraus eine Aufgabe für einen Menschen entsteht.',
  },
  {
    label: 'Anliegen außerhalb des konfigurierten Umfangs entscheiden',
    mensch: true,
    ki: false,
    hinweis: 'Der Assistent eskaliert diese Fälle nach Ihren Regeln, statt sie zu raten.',
  },
  {
    label: 'Notfälle und heikle Situationen einschätzen',
    mensch: true,
    ki: false,
    hinweis: 'Notfälle werden erkannt und sofort weitergeleitet, nie eingeschätzt.',
  },
  { label: 'Kein Urlaub, keine Krankheit, keine Pause', mensch: false, ki: true },
  { label: 'Auftragsverarbeitungsvertrag nach Art. 28 DSGVO', mensch: true, ki: true },
];

const MENSCH_GRENZEN = [
  'Nur zu den Zeiten erreichbar, zu denen jemand am Platz ist',
  'Ein Gespräch zur selben Zeit, danach besetzt',
  'Urlaub, Krankheit und Stoßzeiten fallen auf den Rest des Teams zurück',
  'Zusätzliches Aufkommen kostet zusätzliche Stunden',
];

export function CostComparisonSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.06 });

  return (
    <section
      ref={ref}
      className="py-28 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 overflow-hidden"
      aria-labelledby="cost-compare-heading"
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">

        <div className="max-w-2xl mb-14">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400 mb-5">
            Direktvergleich
          </p>
          <h2
            id="cost-compare-heading"
            className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-[1.06] tracking-[-0.022em] mb-5"
          >
            Menschlicher Empfang
            <br />
            <span className="text-pub-ink-3 dark:text-gray-600">und KI-Telefonassistent</span>
          </h2>
          <p className="text-[15.5px] text-gray-500 dark:text-gray-400 leading-[1.72]">
            Der Vergleich nach Eigenschaften, in beide Richtungen. Was der
            Assistent bei Ihrem Anrufaufkommen kostet, rechnen Sie eine Sektion
            weiter oben mit Ihren eigenen Zahlen aus — hier steht bewusst kein
            Beispielpreis, der für Ihren Betrieb ohnehin nicht gälte.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.1, ease: EASE }}
          className="grid lg:grid-cols-[1fr_320px] gap-6 items-start"
        >

          {/* ─── Eigenschaftsvergleich ─── */}
          <div className="bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl p-7 sm:p-8">
            <div className="flex justify-end gap-6 pb-3 mb-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <User size={10} aria-hidden="true" /> Mensch
              </span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Bot size={10} aria-hidden="true" /> Assistent
              </span>
            </div>
            {VERGLEICH.map((zeile, i) => (
              <div
                key={zeile.label}
                className={`flex items-start justify-between gap-6 py-3.5 ${
                  i > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''
                }`}
              >
                <div className="min-w-0">
                  <span className="text-[13.5px] text-gray-700 dark:text-gray-300">{zeile.label}</span>
                  {zeile.hinweis && (
                    <p className="text-[12px] text-pub-ink-3 dark:text-gray-500 mt-0.5 leading-relaxed">
                      {zeile.hinweis}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-6 flex-shrink-0 pt-0.5">
                  <Marke an={zeile.mensch} />
                  <Marke an={zeile.ki} gruen />
                </div>
              </div>
            ))}
          </div>

          {/* ─── Seitenspalte ─── */}
          <div className="flex flex-col gap-4">
            <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 mb-4">
                Woran ein reiner Personalempfang hängt
              </p>
              <div className="space-y-2.5">
                {MENSCH_GRENZEN.map((grenze) => (
                  <div key={grenze} className="flex items-start gap-2.5">
                    <X size={11} className="text-gray-400 flex-shrink-0 mt-1" aria-hidden="true" />
                    <span className="text-[12.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
                      {grenze}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/*
              Der Verweis auf den Rechner steht bewusst HIER: Wer bis hierher
              gelesen hat, hat die Leistungsfrage geklärt und stellt als
              nächstes die Preisfrage. Das Versprechen daneben ist das, was sich
              belegen lässt — nicht „keine versteckten Kosten", denn Gebühren
              Dritter für eine Schnittstelle stehen erst nach der technischen
              Prüfung fest.
            */}
            <div className="bg-gray-950 dark:bg-gray-900 rounded-2xl p-6">
              <p className="text-[14px] font-bold text-white mb-1.5">
                Was kostet das bei Ihnen?
              </p>
              <p className="text-[12px] text-gray-400 mb-5 leading-relaxed">
                {RECHNER_VERSPRECHEN}
              </p>
              <a
                href={RECHNER_LINK}
                onClick={() => trackEvent('calculator_anchor_click', 'Direktvergleich')}
                className="group w-full inline-flex items-center justify-center gap-2.5 bg-white text-gray-900 font-semibold text-[13px] rounded-xl h-11 px-5 hover:bg-gray-100 transition-colors"
              >
                <Calculator size={13} aria-hidden="true" />
                Eigenen Preis berechnen
              </a>
              <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
                {FAKTEN.preisgarantie}
              </p>
            </div>

            <Link
              to="/kontakt"
              onClick={() => trackEvent('cta_kontakt_click', 'Direktvergleich')}
              className="group inline-flex items-center justify-center gap-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-[13px] rounded-xl h-11 px-5 hover:border-gray-400 transition-colors"
            >
              Kostenloses Erstgespräch
              <ArrowRight size={13} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

        </motion.div>
      </div>
    </section>
  );
}

function Marke({ an, gruen = false }: { an: boolean; gruen?: boolean }) {
  return (
    <div
      className={`w-5 h-5 rounded-full flex items-center justify-center ${
        an
          ? gruen
            ? 'bg-emerald-50 dark:bg-emerald-500/10'
            : 'bg-gray-100 dark:bg-gray-800'
          : 'bg-gray-50 dark:bg-gray-800/50'
      }`}
    >
      {an ? (
        <CheckCircle
          size={9}
          className={gruen ? 'text-emerald-500' : 'text-gray-400'}
          aria-label="ja"
        />
      ) : (
        <X size={8} className="text-pub-ink-3 dark:text-gray-600" aria-label="nein" />
      )}
    </div>
  );
}
