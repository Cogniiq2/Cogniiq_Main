import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

const faqs = [
  {
    question: 'Was kostet ein Projekt mit euch?',
    answer:
      'Das hängt komplett von Ziel und Umfang ab. Wir arbeiten nicht mit pauschalen Paketpreisen, sondern mit individuellen Angeboten. Erstgespräch & grobe Einschätzung sind kostenlos.',
  },
  {
    question: 'Wie schnell könnt ihr starten?',
    answer:
      'In der Regel innerhalb von 7–14 Tagen. Manchmal schneller, je nach Auslastung und Umfang.',
  },
  {
    question: 'Könnt ihr bestehende Systeme übernehmen und verbessern?',
    answer:
      'Ja. Wir können bestehende Websites, Buchungssysteme oder Automationen analysieren und modernisieren, anstatt alles neu zu bauen.',
  },
  {
    question: 'Muss ich mich später um Technik & Wartung kümmern?',
    answer:
      'Nein, wir bieten auf Wunsch laufende Betreuung für Updates, Anpassungen und Monitoring.',
  },
  {
    question: 'Arbeitet ihr nur mit Unternehmen in Bayreuth / Regensburg?',
    answer:
      'Nein, wir arbeiten remote in ganz Deutschland und darüber hinaus. Persönliche Termine sind im Raum Bayreuth / Regensburg / München möglich.',
  },
];

export function FAQSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="faq" ref={ref} className="py-32 bg-gray-50" aria-labelledby="faq-heading">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 id="faq-heading" className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
            Häufige{' '}
            <span className="bg-gradient-to-r from-[#8b5cf6] to-[#22d3ee] bg-clip-text text-transparent">
              Fragen
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Antworten auf die wichtigsten Fragen zu unserer AI Agentur und Webdesign-Leistungen
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white rounded-2xl border border-gray-200 px-6 data-[state=open]:border-[#8b5cf6]/50 data-[state=open]:shadow-lg transition-all"
              >
                <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 hover:text-[#8b5cf6] transition-colors py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
