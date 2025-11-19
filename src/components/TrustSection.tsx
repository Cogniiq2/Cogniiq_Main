import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const stats = [
  { value: '+40%', label: 'mehr Online-Anfragen' },
  { value: 'x3', label: 'mehr gebuchte Erstgespräche' },
  { value: '20h', label: 'pro Woche durch Automationen eingespart' },
];

export function TrustSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="py-20 bg-white border-y border-gray-200" aria-labelledby="trust-heading">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 id="trust-heading" className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">
            Nicht nur Optik –{' '}
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#C9A961] bg-clip-text text-transparent">
              sondern messbare Ergebnisse
            </span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="text-center p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-[#D4AF37]/50 hover:shadow-lg transition-all"
            >
              <div className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#C9A961] bg-clip-text text-transparent mb-3">
                {stat.value}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center text-gray-600 mt-12 max-w-3xl mx-auto"
        >
          Transparente Erfolge: Diese Zahlen basieren auf realen Projektergebnissen unserer Kunden in Deutschland.
          Unser Ziel ist stets messbare Performance-Steigerung und ROI-Optimierung.
        </motion.p>
      </div>
    </section>
  );
}
