import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

import {
  CpuChipIcon,
  BoltIcon,
  FunnelIcon,
  EyeDropperIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const points = [
  {
    icon: CpuChipIcon,
    title: "Technologie soll für Unternehmen arbeiten – nicht andersherum.",
    text: "Wir bauen Systeme, die Aufgaben übernehmen, bevor sie entstehen. Automationen, die Entscheidungen treffen. Websites, die verkaufen. AI, die Prozesse steuert – unsichtbar, nahtlos, rund um die Uhr.",
  },
  {
    icon: BoltIcon,
    title: "Geschwindigkeit schlägt alles.",
    text: "Nicht in Monaten, sondern in Tagen. Keine endlosen Abstimmungen. Keine Meetings, die Zeit verbrennen. Unsere Lösungen laufen, während andere noch planen.",
  },
  {
    icon: FunnelIcon,
    title: "Fokus auf das Wesentliche.",
    text: "Keine komplizierten Tools, keine Worthülsen. Nur klare, schnelle, profitable Ergebnisse. Was Zeit spart, bringt Wachstum – sofort spürbar.",
  },
  {
    icon: EyeDropperIcon,
    title: "Perfektion, die man nicht bemerkt.",
    text: "Wir entwickeln Systeme, die reibungslos funktionieren, elegant bleiben und im Hintergrund Ihre digitale Infrastruktur tragen.",
  },
  {
    icon: ChartBarIcon,
    title: "Wir bauen die Grundlage für die nächsten 10 Jahre.",
    text: "Unternehmen, die heute nicht automatisieren, sind morgen nicht mehr da. Unsere Mission: Betriebe in die Zukunft bringen.",
  },
];

export function TrustSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
            Wie wir denken
          </h2>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Die Grundprinzipien, die Cogniiq ausmachen – klar, ruhig, kompromisslos.
          </p>
        </motion.div>

        {/* ROW 1 — 3 CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {points.slice(0, 3).map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 25 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="p-8 bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-lg transition-all h-full"
              >
                <Icon className="w-10 h-10 text-indigo-600 mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-4 leading-snug">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-lg">{item.text}</p>
              </motion.div>
            );
          })}
        </div>

        {/* ROW 2 — 2 CARDS CENTERED */}
        <div className="flex justify-center gap-10 flex-wrap">
          {points.slice(3).map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 25 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: (i + 3) * 0.1 }}
                className="p-8 bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-lg transition-all w-full max-w-md"
              >
                <Icon className="w-10 h-10 text-indigo-600 mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-4 leading-snug">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-lg">{item.text}</p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
