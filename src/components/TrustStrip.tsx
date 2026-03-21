import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Shield, Clock, Users, Award, Lock, TrendingUp } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const ITEMS = [
  { icon: Shield, label: 'DSGVO-konform', sub: 'Daten bleiben in Deutschland' },
  { icon: Clock, label: 'Go-Live in 7–14 Tagen', sub: 'Nicht Monate – Wochen' },
  { icon: Users, label: 'Direkter Ansprechpartner', sub: 'Kein Ticket-System' },
  { icon: Award, label: 'Keine Templates', sub: 'Gebaut für Ihren Prozess' },
  { icon: Lock, label: 'Festpreis', sub: 'Kein verstecktes Scope-Creep' },
];

function LiveCounter() {
  const [count, setCount] = useState(247);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setCount(c => c + 1);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-50 border border-emerald-100">
      <motion.div
        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
        animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      />
      <motion.span
        key={count}
        className="text-[10.5px] font-bold text-emerald-700 tabular-nums"
        initial={{ y: -6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {count}
      </motion.span>
      <span className="text-[10.5px] font-medium text-emerald-600">Anrufe heute beantwortet</span>
      <TrendingUp size={10} className="text-emerald-500" />
    </div>
  );
}

export function TrustStrip() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <div ref={ref} className="w-full bg-white border-t border-b border-gray-100/80">
      <motion.div
        className="max-w-7xl mx-auto px-6 lg:px-8 py-4"
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, ease: EASE }}
      >
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 lg:gap-x-8">
          {ITEMS.map(({ icon: Icon, label, sub }, i) => (
            <motion.div
              key={label}
              className="flex items-center gap-2 group"
              initial={{ opacity: 0, y: 6 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: i * 0.06, ease: EASE }}
            >
              <div className="w-[26px] h-[26px] rounded-[7px] bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon size={11} className="text-gray-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-800 leading-none mb-[2px] tracking-[-0.01em]">{label}</p>
                <p className="text-[10px] text-gray-400 leading-none">{sub}</p>
              </div>
            </motion.div>
          ))}

        </div>
      </motion.div>
    </div>
  );
}
