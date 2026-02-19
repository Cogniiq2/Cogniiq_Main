import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';

const faqs = [
  {
    question: 'Was kostet ein Projekt mit euch?',
    answer:
      'Das hängt von Ziel und Umfang ab. Wir arbeiten nicht mit pauschalen Paketpreisen, sondern mit individuellen Angeboten — abgestimmt auf Ihre Prozesse und Systeme. Das Erstgespräch und eine erste Einschätzung sind kostenlos.',
    category: 'Kosten',
  },
  {
    question: 'Wie schnell könnt ihr starten?',
    answer:
      'In der Regel innerhalb von 7–14 Tagen nach dem Analysegespräch. Je nach Auslastung und Projektumfang kann das auch schneller möglich sein — sprechen Sie uns direkt darauf an.',
    category: 'Ablauf',
  },
  {
    question: 'Könnt ihr bestehende Systeme übernehmen und verbessern?',
    answer:
      'Ja. Wir analysieren bestehende Websites, Buchungssysteme und Automationen und modernisieren sie gezielt — anstatt alles neu zu bauen. Wir setzen dort an, wo der größte Hebel liegt.',
    category: 'Leistungen',
  },
  {
    question: 'Muss ich mich nach dem Launch um Technik und Wartung kümmern?',
    answer:
      'Nein. Wir bieten auf Wunsch laufende Betreuung für Updates, Anpassungen und System-Monitoring. Ihre Systeme laufen — wir halten sie am Laufen.',
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
      'Wir bauen keine Websites — wir bauen Systeme. Jedes Projekt ist darauf ausgelegt, operative Kosten zu senken, Prozesse zu automatisieren und messbar mehr Umsatz zu erzeugen. Design ist Mittel, nicht Zweck.',
    category: 'Positionierung',
  },
  {
    question: 'Wie läuft ein Projekt typischerweise ab?',
    answer:
      'Erstgespräch und Analyse, dann ein maßgeschneidertes Systemkonzept, danach Umsetzung in klar definierten Phasen. Kein Agentur-Chaos — klare Verantwortlichkeiten und direkte Kommunikation.',
    category: 'Ablauf',
  },
];

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(f => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: f.answer,
    },
  })),
};

export function FAQSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.08 });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(prev => (prev === i ? null : i));

  return (
    <section
      id="faq"
      ref={ref}
      className="relative py-24 lg:py-32 bg-white overflow-hidden"
      aria-labelledby="faq-heading"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* Left — header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-4 lg:sticky lg:top-32"
          >
            <p
              className="text-gray-400 uppercase mb-4"
              style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.20em' }}
            >
              FAQ
            </p>
            <h2
              id="faq-heading"
              className="text-gray-900"
              style={{
                fontSize: 'clamp(26px, 3.5vw, 36px)',
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: '-0.022em',
                maxWidth: '16ch',
              }}
            >
              Häufige Fragen.
            </h2>
            <p
              className="text-gray-500 mt-4"
              style={{ fontSize: '14.5px', fontWeight: 400, lineHeight: 1.65, maxWidth: '34ch' }}
            >
              Alles Wichtige zu Prozess, Leistungen und Zusammenarbeit — auf einen Blick.
            </p>

            <div className="mt-10 flex flex-col gap-0">
              {[
                { count: faqs.length.toString(), label: 'Fragen' },
                { count: '7–14', label: 'Tage bis Start' },
                { count: '100%', label: 'Remote-fähig' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0"
                >
                  <span
                    className="text-gray-900 tabular-nums"
                    style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.03em', minWidth: '48px' }}
                  >
                    {stat.count}
                  </span>
                  <span
                    className="text-gray-400"
                    style={{ fontSize: '12px', fontWeight: 400 }}
                  >
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — accordion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-8 flex flex-col"
          >
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i;

              return (
                <div
                  key={i}
                  className="border-b border-gray-100 first:border-t"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggle(i)}
                    className="w-full flex items-start justify-between gap-6 py-6 text-left group"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <span
                        className="text-gray-300 tabular-nums flex-shrink-0"
                        style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.05em', paddingTop: '3px', minWidth: '20px' }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className="text-gray-900 transition-colors"
                        style={{ fontSize: '15px', fontWeight: 500, lineHeight: 1.35, letterSpacing: '-0.01em' }}
                      >
                        {faq.question}
                      </span>
                    </div>
                    <span
                      className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-md border border-gray-200 transition-all"
                      style={{
                        background: isOpen ? '#111827' : '#ffffff',
                        borderColor: isOpen ? '#111827' : '#e5e7eb',
                        marginTop: '1px',
                      }}
                    >
                      <motion.span
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="flex items-center justify-center"
                      >
                        <Plus
                          size={12}
                          style={{ color: isOpen ? '#ffffff' : '#6b7280' }}
                          strokeWidth={2}
                        />
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
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="pb-6 pl-9">
                          <p
                            className="text-gray-500 leading-relaxed"
                            style={{ fontSize: '14px', lineHeight: 1.7 }}
                          >
                            {faq.answer}
                          </p>
                          <span
                            className="inline-block mt-3 text-gray-300"
                            style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                          >
                            {faq.category}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 border border-gray-100 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{ background: '#fafafa' }}
            >
              <div>
                <p
                  className="text-gray-900"
                  style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.01em' }}
                >
                  Noch eine offene Frage?
                </p>
                <p
                  className="text-gray-400 mt-0.5"
                  style={{ fontSize: '12.5px' }}
                >
                  Wir antworten direkt — kein Formular-Chaos.
                </p>
              </div>
              <a
                href="#kontakt"
                className="flex-shrink-0 flex items-center gap-2 text-white transition-opacity hover:opacity-80"
                style={{
                  background: '#111827',
                  fontSize: '13.5px',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  borderRadius: '8px',
                  height: '40px',
                  padding: '0 18px',
                  textDecoration: 'none',
                }}
              >
                Gespräch anfragen
              </a>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
