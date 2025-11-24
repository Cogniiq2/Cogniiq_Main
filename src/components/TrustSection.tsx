import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const points = [
  {
    title: "Technologie soll für Unternehmen arbeiten – nicht andersherum.",
    text: "Wir bauen Systeme, die Aufgaben übernehmen, bevor sie entstehen. Automationen, die Entscheidungen treffen. Websites, die verkaufen. AI, die Prozesse steuert – unsichtbar, nahtlos, rund um die Uhr."
  },
  {
    title: "Geschwindigkeit schlägt alles.",
    text: "Nicht in Monaten, sondern in Tagen. Keine endlosen Abstimmungen. Keine Meetings, die Zeit verbrennen. Unsere Lösungen laufen, während andere noch planen."
  },
  {
    title: "Fokus auf das Wesentliche.",
    text: "Keine komplizierten Tools, keine Worthülsen. Nur klare, schnelle, profitable Ergebnisse. Was Zeit spart, bringt Wachstum – sofort spürbar."
  },
  {
    title: "Perfektion, die man nicht bemerkt.",
    text: "Wir entwickeln Systeme, die reibungslos funktionieren, elegant bleiben und im Hintergrund Ihre digitale Infrastruktur tragen. Technologie ist dann am stärksten, wenn man sie nicht sieht."
  },
  {
    title: "Wir bauen die Grundlage für die nächsten 10 Jahre.",
    text: "Unternehmen, die heute nicht automatisieren, sind morgen nicht mehr da. Unsere Mission: Betriebe in die Zukunft bringen – schneller, einfacher, besser."
  }
];

export function TrustSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      ref={ref}
      className="py-28 bg-white"
      aria-labelledby="philosophy-heading"
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">

        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2
            id="philosophy-heading"
            className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight tracking-tight"
          >
            Wie wir denken
          </h2>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Die Grundprinzipien, die Cogniiq ausmachen – klar, ruhig, kompromisslos.
          </p>
        </motion.div>

        {/* Philosophy Items */}
        <div className="space-y-20">
          {points.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-4xl mx-auto"
            >
              <h3 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-4 tracking-tight leading-snug">
                {item.title}
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Closing Line */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: points.length * 0.15 }}
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
