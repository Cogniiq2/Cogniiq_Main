import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Shield, Clock, Users, MapPin, Star } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const ITEMS = [
  { icon: Shield, label: 'DSGVO-konforme Systeme', sub: 'Daten bleiben in Deutschland' },
  { icon: Clock, label: 'Go-Live in 1–2 Wochen', sub: 'Kein langer Vorlauf' },
  { icon: Users, label: 'Persönlicher Ansprechpartner', sub: 'Direkt, kein Ticket-System' },
  { icon: MapPin, label: '100% Remote', sub: 'Ganz Deutschland betreut' },
  { icon: Star, label: 'Auf echte Prozesse gebaut', sub: 'Keine Generic-Templates' },
];

export function TrustStrip() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <div ref={ref} className="w-full bg-white border-t border-gray-100">
      <motion.div
        className="max-w-7xl mx-auto px-6 lg:px-8 py-10"
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.65, ease: EASE }}
      >
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {ITEMS.map(({ icon: Icon, label, sub }, i) => (
            <motion.div
              key={label}
              className="flex items-center gap-2.5"
              initial={{ opacity: 0, y: 8 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.07, ease: EASE }}
            >
              <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon size={13} className="text-gray-400" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-gray-700 leading-none mb-0.5">{label}</p>
                <p className="text-[11px] text-gray-400 leading-none">{sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
