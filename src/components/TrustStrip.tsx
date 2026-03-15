import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Shield, Clock, Users, Award, Lock } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const ITEMS = [
  { icon: Shield, label: 'DSGVO-konform', sub: 'Daten bleiben in Deutschland' },
  { icon: Clock, label: 'Go-Live in 7–14 Tagen', sub: 'Nicht Monate – Wochen' },
  { icon: Users, label: 'Direkter Ansprechpartner', sub: 'Kein Ticket-System, kein Account-Manager' },
  { icon: Award, label: 'Keine Templates', sub: 'Gebaut für Ihren Prozess' },
  { icon: Lock, label: 'Festpreis-Projekte', sub: 'Kein verstecktes Scope-Creep' },
];

export function TrustStrip() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <div ref={ref} className="w-full bg-white border-t border-b border-gray-100/80">
      <motion.div
        className="max-w-7xl mx-auto px-6 lg:px-8 py-5"
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, ease: EASE }}
      >
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 lg:gap-x-12">
          {ITEMS.map(({ icon: Icon, label, sub }, i) => (
            <motion.div
              key={label}
              className="flex items-center gap-2.5 group"
              initial={{ opacity: 0, y: 6 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: i * 0.06, ease: EASE }}
            >
              <div className="w-[28px] h-[28px] rounded-[8px] bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon size={12} className="text-gray-400" />
              </div>
              <div>
                <p className="text-[11.5px] font-semibold text-gray-800 leading-none mb-[3px] tracking-[-0.01em]">{label}</p>
                <p className="text-[10.5px] text-gray-400 leading-none">{sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
