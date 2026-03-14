import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight } from 'lucide-react';
import { FAQQuestionModal } from './FAQQuestionModal';

const faqs = [
  {
    question: 'Was kostet ein Projekt mit euch?',
    answer:
      'Das hängt von Ziel und Umfang ab. Wir arbeiten nicht mit pauschalen Paketpreisen, sondern mit individuellen Angeboten – abgestimmt auf Ihre Prozesse und Systeme. Das Erstgespräch und eine erste Einschätzung sind kostenlos.',
    category: 'Kosten',
  },
  {
    question: 'Wie schnell könnt ihr starten?',
    answer:
      'In der Regel innerhalb von 7–14 Tagen nach dem Analysegespräch. Je nach Auslastung und Projektumfang kann das auch schneller möglich sein – sprechen Sie uns direkt an.',
    category: 'Ablauf',
  },
  {
    question: 'Könnt ihr bestehende Systeme übernehmen und verbessern?',
    answer:
      'Ja. Wir analysieren bestehende Websites, Buchungssysteme und Automationen und modernisieren sie gezielt – anstatt alles neu zu bauen. Wir setzen dort an, wo der größte Hebel liegt.',
    category: 'Leistungen',
  },
  {
    question: 'Muss ich mich nach dem Launch um Technik und Wartung kümmern?',
    answer:
      'Nein. Wir bieten auf Wunsch laufende Betreuung für Updates, Anpassungen und System-Monitoring. Ihre Systeme laufen – wir halten sie am Laufen.',
    category: 'Betrieb',
  },
  {
    question: 'Arbeitet ihr nur in Bayreuth und Regensburg?',
    answer:
      'Nein. Wir arbeiten vollständig remote in ganz Deutschland und darüber hinaus. Persönliche Vor-Ort-Termine sind im Raum Bayreuth, Regensburg und München möglich.',
    category: 'Region',
  },
  {
    question: 'Für welche Unternehmensgrößen seid ihr geeignet?',
    answer:
      'Für Unternehmen ab ca. 5 Mitarbeitern, die operative Prozesse skalieren wollen. Wir arbeiten sowohl mit mittelständischen Unternehmen als auch mit wachsenden Scale-ups zusammen.',
    category: 'Zielgruppe',
  },
  {
    question: 'Was unterscheidet euch von einer klassischen Webdesign-Agentur?',
    answer:
      'Wir bauen keine Websites – wir bauen Systeme. Jedes Projekt ist darauf ausgelegt, operative Kosten zu senken, Prozesse zu automatisieren und messbar mehr Umsatz zu erzeugen. Design ist Mittel, nicht Zweck.',
    category: 'Positionierung',
  },
  {
    question: 'Wie läuft ein Projekt typischerweise ab?',
    answer:
      'Erstgespräch und Analyse, dann ein maßgeschneidertes Systemkonzept, danach Umsetzung in klar definierten Phasen. Kein Agentur-Chaos – klare Verantwortlichkeiten und direkte Kommunikation.',
    category: 'Ablauf',
  },
];

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: f.answer,
    },
  })),
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function FAQSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.08 });
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <section
      id="faq"
      ref={ref}
      className="relative py-28 bg-white dark:bg-gray-950"
      aria-labelledby="faq-heading"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: EASE }}
            className="lg:col-span-4 lg:sticky lg:top-32"
          >
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500 mb-5">
              FAQ
            </p>
            <h2
              id="faq-heading"
              className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-[1.08] tracking-tight mb-5"
            >
              Häufige
              <br />
              <span className="text-gray-400 dark:text-gray-600">Fragen.</span>
            </h2>
            <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed mb-8 max-w-xs">
              Alles Wichtige zu Prozess,{' '}
              <Link
                to="/leistungen"
                className="font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors underline underline-offset-2 decoration-gray-300 dark:decoration-gray-600"
              >
                Leistungen
              </Link>{' '}
              und{' '}
              <Link
                to="/kontakt"
                className="font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors underline underline-offset-2 decoration-gray-300 dark:decoration-gray-600"
              >
                Zusammenarbeit
              </Link>{' '}
              – auf einen Blick.
            </p>

            <div className="flex flex-col gap-0 mb-8">
              {[
                { count: String(faqs.length), label: 'Antworten' },
                { count: '7–14', label: 'Tage bis Start' },
                { count: '100%', label: 'Remote-fähig' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-4 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <span className="text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums min-w-[52px] tracking-tight">
                    {stat.count}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{stat.label}</span>
                </div>
              ))}
            </div>

            <Link
              to="/faq"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors group"
            >
              Alle Fragen ansehen
              <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="lg:col-span-8 flex flex-col"
          >
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={i} className="border-b border-gray-100 dark:border-gray-800 first:border-t first:border-gray-100 dark:first:border-gray-800">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggle(i)}
                    className="w-full flex items-start justify-between gap-6 py-6 text-left"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <span className="text-[11px] font-medium text-gray-300 dark:text-gray-600 tabular-nums flex-shrink-0 pt-0.5 min-w-[20px]">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[15px] font-medium text-gray-900 dark:text-gray-100 leading-snug tracking-tight">
                        {faq.question}
                      </span>
                    </div>
                    <span
                      className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-md border transition-all duration-200 mt-0.5"
                      style={{
                        background: isOpen ? '#111827' : 'transparent',
                        borderColor: isOpen ? '#111827' : '#e5e7eb',
                      }}
                    >
                      <motion.span
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.2, ease: EASE }}
                        className="flex items-center justify-center"
                      >
                        <Plus size={12} style={{ color: isOpen ? '#ffffff' : '#9ca3af' }} strokeWidth={2} />
                      </motion.span>
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="pb-6 pl-9">
                          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            {faq.answer}
                          </p>
                          <span className="inline-block mt-3 text-[10px] font-semibold tracking-[0.14em] uppercase text-gray-300 dark:text-gray-600">
                            {faq.category}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 border border-gray-100 dark:border-gray-800 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-transparent"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                  Noch eine offene Frage?
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Wir antworten direkt – kein Formular-Chaos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex-shrink-0 inline-flex items-center gap-2 text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-white transition-colors text-sm font-semibold rounded-xl h-10 px-5"
              >
                Frage stellen
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <FAQQuestionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}
