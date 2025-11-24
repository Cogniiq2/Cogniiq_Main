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
      className="py-20 bg-white border-y border-gray-200"
      aria-labelledby="trust-heading"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <h2
            id="trust-heading"
            className="text-3xl lg:text-4xl font-bold text-gray-900"
          >
            Ergebnisse, die für sich sprechen
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Keine hypothetischen Zahlen. Echte Resultate aus realen Projekten,
            die Unternehmen sofort entlasten, automatisieren und wachsen lassen.
          </p>
        </motion.div>

        {/* Result Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {results.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-[#8b5cf6]/50 hover:shadow-lg transition-all"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {item.title}
              </h3>
              <p className="text-gray-700 font-medium">{item.result}</p>
              <p className="mt-4 text-[#6d28d9] font-semibold">{item.metric}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom Line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center text-gray-600 mt-14 max-w-3xl mx-auto"
        >
          Wir entwickeln Systeme, die wie Mitarbeiter arbeiten – nur schneller,
          zuverlässiger und rund um die Uhr. Keine Theorie. Nur umsetzbare
          Ergebnisse.
        </motion.p>
      </div>
    </section>
  );
}
