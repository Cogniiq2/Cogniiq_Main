import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const results = [
  {
    title: 'Padel Club Heinersreuth',
    result: 'Vollautomatisierte Buchungen + Smart Locks',
    metric: '0 Personal – läuft komplett autonom',
  },
  {
    title: 'L’Osteria Automation',
    result: 'AI-Rezeptionist beantwortet alle Anrufe',
    metric: '100% telefonische Entlastung',
  },
  {
    title: 'Lokale Dienstleister',
    result: 'Demo-Websites & klare Positionierung',
    metric: 'Erstgespräche innerhalb von 24 Stunden',
  },
];

export function TrustSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section
      ref={ref}
      className="py-24 bg-white border-y border-gray-200"
      aria-labelledby="trust-heading"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2
            id="trust-heading"
            className="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight"
          >
            Ergebnisse, die für sich sprechen
          </h2>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Keine theoretischen Zahlen. Sondern echte Resultate aus realen
            Projekten, die Unternehmen sofort entlasten, automatisieren
            und skalieren.
          </p>
        </motion.div>

        {/* Result Grid */}
        <div className="grid md:grid-cols-3 gap-10">
          {results.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="p-10 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 shadow-sm hover:shadow-xl hover:border-[#8b5cf6]/50 transition-all"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                {item.title}
              </h3>

              <p className="text-lg text-gray-700 font-medium leading-snug">
                {item.result}
              </p>

              <p className="mt-5 text-[#6d28d9] text-xl font-semibold">
                {item.metric}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom Line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center text-lg text-gray-600 mt-16 max-w-3xl mx-auto leading-relaxed"
        >
          Wir entwickeln Systeme, die wie Mitarbeiter arbeiten – nur schneller,
          zuverlässiger und rund um die Uhr.
        </motion.p>
      </div>
    </section>
  );
}
