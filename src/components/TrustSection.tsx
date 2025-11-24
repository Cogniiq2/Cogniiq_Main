import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

import {
  CpuChipIcon,
  BoltIcon,
  AdjustmentsHorizontalIcon,
  EyeDropperIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";

const points = [
  {
    title: "Technologie soll für Unternehmen arbeiten – nicht andersherum.",
    text: "Wir bauen Systeme, die Aufgaben übernehmen, bevor sie entstehen. Automationen, die Entscheidungen treffen. Websites, die verkaufen. AI, die Prozesse steuert – unsichtbar, nahtlos, rund um die Uhr.",
    icon: <CpuChipIcon className="w-12 h-12 text-[#6d28d9]" />
  },
  {
    title: "Geschwindigkeit schlägt alles.",
    text: "Nicht in Monaten, sondern in Tagen. Keine endlosen Abstimmungen. Keine Meetings, die Zeit verbrennen. Unsere Lösungen laufen, während andere noch planen.",
    icon: <BoltIcon className="w-12 h-12 text-[#6d28d9]" />
  },
  {
    title: "Fokus auf das Wesentliche.",
    text: "Keine komplizierten Tools, keine Worthülsen. Nur klare, schnelle, profitable Ergebnisse. Was Zeit spart, bringt Wachstum – sofort spürbar.",
    icon: <AdjustmentsHorizontalIcon className="w-12 h-12 text-[#6d28d9]" />
  },
  {
    title: "Perfektion, die man nicht bemerkt.",
    text: "Wir entwickeln Systeme, die reibungslos funktionieren, elegant bleiben und im Hintergrund Ihre digitale Infrastruktur tragen. Technologie ist dann am stärksten, wenn man sie nicht sieht.",
    icon: <EyeDropperIcon className="w-12 h-12 text-[#6d28d9]" />
  },
  {
    title: "Wir bauen die Grundlage für die nächsten 10 Jahre.",
    text: "Unternehmen, die heute nicht automatisieren, sind morgen nicht mehr da. Unsere Mission: Betriebe in die Zukunft bringen – schneller, einfacher, besser.",
    icon: <ChartBarIcon className="w-12 h-12 text-[#6d28d9]" />
  }
];

export function TrustSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <section
      ref={ref}
      className="py-28 bg-white"
      aria-labelledby="philosophy-heading"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            Wie wir denken
          </h2>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Die Grundprinzipien, die Cogniiq ausmachen – klar, ruhig, kompromisslos.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-10 place-items-center">
          {points.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{
                duration: 0.7,
                delay: index * 0.15,
                ease: [0.22, 1, 0.36, 1]
              }}
              whileHover={{
                y: -6,
                scale: 1.02,
                boxShadow:
                  "0 20px 40px -10px rgba(0,0,0,0.1), 0 8px 20px -10px rgba(0,0,0,0.05)"
              }}
              className="p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 shadow-sm transition-all duration-300 cursor-default w-full max-w-md"
            >
              {/* Icon */}
              <div className="mb-4">{item.icon}</div>

              <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-4 leading-snug">
                {item.title}
              </h3>

              <p className="text-gray-600 text-base leading-relaxed">
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Closing */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: points.length * 0.15 }}
          className="text-center mt-24"
        >
          <p className="text-2xl lg:text-3xl font-semibold text-gray-900 tracking-tight">
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
