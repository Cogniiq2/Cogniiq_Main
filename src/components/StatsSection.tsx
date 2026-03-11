import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stats = [
  { value: '24/7', label: 'KI-Verfügbarkeit', sub: 'Kein Ausfall, kein Urlaub' },
  { value: '< 14', label: 'Tage bis Go-Live', sub: 'Schnell. Präzise. Messbar.' },
  { value: '3×', label: 'Systeme integriert', sub: 'Web · KI · Automation' },
  { value: '100%', label: 'Remote-fähig', sub: 'Ganz Deutschland' },
];

export function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section
      ref={ref}
      aria-label="Kennzahlen"
      className="py-16 bg-gray-900 dark:bg-gray-900"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-700/40 border border-gray-700/40 rounded-2xl overflow-hidden">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              variants={fadeUp}
              custom={i * 0.08}
              className="bg-gray-900 px-8 py-10 group hover:bg-gray-800 transition-colors duration-300"
            >
              <p className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-1.5">
                {stat.value}
              </p>
              <p className="text-sm font-semibold text-gray-300 mb-1">{stat.label}</p>
              <p className="text-xs text-gray-500">{stat.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
