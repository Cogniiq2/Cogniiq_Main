import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const stats = [
  {
    value: '24/7',
    label: 'Kein Anruf geht verloren',
    sub: 'Der KI-Assistent antwortet – immer',
  },
  {
    value: '< 14',
    label: 'Tage bis zum Go-Live',
    sub: 'Kein monatelanger Vorlauf',
  },
  {
    value: '3×',
    label: 'Systeme gebündelt',
    sub: 'Web · KI-Telefon · Automation',
  },
  {
    value: '∅ 30%',
    label: 'Anrufe gehen unbeantwortet',
    sub: 'In deutschen KMU – täglich',
  },
];

export function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} aria-label="Kennzahlen" className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.07, ease: EASE }}
              className={`group relative flex flex-col justify-center px-8 py-12 border-b border-gray-100 lg:border-b-0 transition-colors duration-300 hover:bg-gray-50/50 ${
                i < stats.length - 1 ? 'border-r border-gray-100' : ''
              } ${i === 1 || i === 3 ? 'lg:border-r-0' : ''}`}
            >
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                style={{ transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)' }}
              />
              <p
                className="font-bold text-gray-900 tracking-tight leading-none mb-3"
                style={{ fontSize: 'clamp(32px, 4.2vw, 48px)', fontVariantNumeric: 'tabular-nums' }}
              >
                {stat.value}
              </p>
              <div className="w-5 h-px bg-gray-200 mb-3" />
              <p className="text-[13px] font-semibold text-gray-700 tracking-tight mb-1">{stat.label}</p>
              <p className="text-[11.5px] text-gray-400 leading-snug">{stat.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
