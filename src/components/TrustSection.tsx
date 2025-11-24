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
    text: "Wir entwickeln Systeme, die reibungslos funktionieren, elegant bleiben und im Hintergrund Ihre digitale Infrastruktur tragen. Technologie ist dann am stärksten, wenn man sie nicht sieht.",
  },
  {
    icon: ChartBarIcon,
    title: "Wir bauen die Grundlage für die nächsten 10 Jahre.",
    text: "Unternehmen, die heute nicht automatisieren, sind morgen nicht mehr da. Unsere Mission: Betriebe in die Zukunft bringen – schneller, einfacher, besser.",
  },
];

export function PhilosophySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <section ref={ref} className="py-28 bg-white" aria-labelledby="philosophy-heading">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            Wie wir denken
          </h2>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Die Grundprinzipien, die Cogniiq ausmachen – klar, ruhig, kompromisslos.
          </p>
        </motion.div>

        {/* ROW 1 */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{
            visible: { transition: { staggerChildren: 0.15 } },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-10"
        >
          {points.slice(0, 3).map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="p-8 h-full rounded-3xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 shadow-sm hover:shadow-lg transition-all max-w-md mx-auto"
              >
                <Icon className="w-10 h-10 text-indigo-600 mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">{item.text}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ROW 2 — centered */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{
            visible: { transition: { staggerChildren: 0.15 } },
          }}
          className="flex justify-center gap-10 flex-wrap"
        >
          {points.slice(3).map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 shadow-sm hover:shadow-lg transition-all max-w-md w-full sm:w-[48%] lg:w-[30%]"
              >
                <Icon className="w-10 h-10 text-indigo-600 mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">{item.text}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Closing Text */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mt-28"
        >
          <p className="text-2xl lg:text-3xl font-semibold text-gray-900">
            Das ist Cogniiq.
          </p>
          <p className="mt-4 text-lg text-gray-600">
            Mehr als Systeme. Mehr als AI. Eine neue Art, wie Unternehmen funktionieren.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
