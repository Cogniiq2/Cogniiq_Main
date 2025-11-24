import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

import {
  CpuChipIcon,
  BoltIcon,
  FunnelIcon,
  EyeDropperIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";

const points = [
  {
    icon: <CpuChipIcon className="w-10 h-10 text-indigo-600 mb-4" />,
    title: "Technologie soll für Unternehmen arbeiten – nicht andersherum.",
    text: "Wir bauen Systeme, die Aufgaben übernehmen, bevor sie entstehen..."
  },
  {
    icon: <BoltIcon className="w-10 h-10 text-indigo-600 mb-4" />,
    title: "Geschwindigkeit schlägt alles.",
    text: "Nicht in Monaten, sondern in Tagen..."
  },
  {
    icon: <FunnelIcon className="w-10 h-10 text-indigo-600 mb-4" />,
    title: "Fokus auf das Wesentliche.",
    text: "Keine komplizierten Tools, keine Worthülsen..."
  },
  {
    icon: <EyeDropperIcon className="w-10 h-10 text-indigo-600 mb-4" />,
    title: "Perfektion, die man nicht bemerkt.",
    text: "Wir entwickeln Systeme, die reibungslos funktionieren..."
  },
  {
    icon: <ChartBarIcon className="w-10 h-10 text-indigo-600 mb-4" />,
    title: "Wir bauen die Grundlage für die nächsten 10 Jahre.",
    text: "Unternehmen, die heute nicht automatisieren..."
  }
];

export function TrustSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      ref={ref}
      className="py-28 bg-white"
      aria-labelledby="trust-heading"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h2
            id="trust-heading"
            className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight"
          >
            Wie wir denken
          </h2>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Die Grundprinzipien, die Cogniiq ausmachen – klar, ruhig, kompromisslos.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 place-items-center">

          {/* ROW 1 — first 3 cards */}
          {points.slice(0, 3).map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="p-8 rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all w-full max-w-md"
            >
              {item.icon}
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                {item.title}
              </h3>
              <p className="text-gray-600 text-lg">
                {item.text}
              </p>
            </motion.div>
          ))}

          {/* GHOST to center the second row */}
          <div className="hidden lg:block"></div>

          {/* ROW 2 — last 2 cards */}
          {points.slice(3).map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: (index + 3) * 0.1 }}
              className="p-8 rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all w-full max-w-md"
            >
              {item.icon}
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                {item.title}
              </h3>
              <p className="text-gray-600 text-lg">
                {item.text}
              </p>
            </motion.div>
          ))}

        </div>

        {/* Closing text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-28"
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
