import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const points = [
  {
    title: "Technologie soll für Unternehmen arbeiten – nicht andersherum.",
    text: "Wir bauen Systeme, die Aufgaben übernehmen, bevor sie entstehen. Automationen, die Entscheidungen treffen. Websites, die verkaufen. AI, die Prozesse steuert – unsichtbar, nahtlos, rund um die Uhr.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[#6d28d9]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m-7.5-9h3.75a2.25 2.25 0 012.25 2.25v3.75m0 0H6.75A2.25 2.25 0 014.5 12.75V9m15 6h-3.75a2.25 2.25 0 01-2.25-2.25V9m0 0h3.75A2.25 2.25 0 0119.5 11.25V15" />
      </svg>
    )
  },
  {
    title: "Geschwindigkeit schlägt alles.",
    text: "Nicht in Monaten, sondern in Tagen. Keine endlosen Abstimmungen. Keine Meetings, die Zeit verbrennen. Unsere Lösungen laufen, während andere noch planen.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[#6d28d9]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    title: "Fokus auf das Wesentliche.",
    text: "Keine komplizierten Tools, keine Worthülsen. Nur klare, schnelle, profitable Ergebnisse. Was Zeit spart, bringt Wachstum – sofort spürbar.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[#6d28d9]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5M3.75 6h16.5M3.75 18h16.5" />
      </svg>
    )
  },
  {
    title: "Perfektion, die man nicht bemerkt.",
    text: "Wir entwickeln Systeme, die reibungslos funktionieren, elegant bleiben und im Hintergrund Ihre digitale Infrastruktur tragen. Technologie ist dann am stärksten, wenn man sie nicht sieht.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[#6d28d9]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 2.899-1.092 5.449-2.828 7.174M7.5 6.75c0 2.899 1.092 5.449 2.828 7.174m0 0A9.005 9.005 0 0112 21a9.005 9.005 0 011.672-7.076" />
      </svg>
    )
  },
  {
    title: "Wir bauen die Grundlage für die nächsten 10 Jahre.",
    text: "Unternehmen, die heute nicht automatisieren, sind morgen nicht mehr da. Unsere Mission: Betriebe in die Zukunft bringen – schneller, einfacher, besser.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[#6d28d9]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 13l3 3 7-7" />
      </svg>
    )
  }
];

export function TrustSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <section ref={ref} className="py-28 bg-white" aria-labelledby="philosophy-heading">
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
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
                boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1), 0 8px 20px -10px rgba(0,0,0,0.05)"
              }}
              className={`
                p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white 
                border border-gray-200 shadow-sm transition-all duration-300 cursor-default 
                w-full max-w-md mx-auto
                ${index >= 3 ? "col-span-3 flex justify-center lg:col-span-1 lg:mx-auto" : ""}
              `}
            >
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
