import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Zap, Target, Shield, TrendingUp, Cpu, Clock } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

const principles = [
  {
    icon: Cpu,
    title: "Technologie, die für Sie arbeitet.",
    text: "Wir bauen operative KI-Systeme, die Aufgaben übernehmen, bevor sie entstehen. Automationen, die entscheiden. Websites, die konvertieren. AI, die Prozesse steuert – nahtlos, 24/7.",
    link: "/leistungen",
    linkLabel: "Leistungen ansehen",
  },
  {
    icon: Zap,
    title: "Geschwindigkeit schlägt alles.",
    text: "Nicht in Monaten – in Tagen. Keine endlosen Abstimmungsrunden. Unsere Systeme laufen, während andere noch planen.",
    link: "/kontakt",
    linkLabel: "Jetzt starten",
  },
  {
    icon: Target,
    title: "Fokus auf das Wesentliche.",
    text: "Keine komplizierten Tools. Keine Worthülsen. Klare, schnelle, profitable Ergebnisse. Was Zeit spart, bringt Wachstum – sofort messbar.",
    link: "/leistungen",
    linkLabel: "Unsere Methode",
  },
  {
    icon: Shield,
    title: "Perfektion im Hintergrund.",
    text: "Komplexität gehört in die Infrastruktur – nicht in Ihre tägliche Arbeit. Systeme, die reibungslos funktionieren und elegant bleiben.",
    link: "/ueber-uns",
    linkLabel: "Über Cogniiq",
  },
  {
    icon: TrendingUp,
    title: "Fundament für die nächsten 10 Jahre.",
    text: "Unternehmen, die heute nicht automatisieren, sind morgen nicht mehr da. Unsere Mission: Betriebe strukturiert, skalierbar und zukunftssicher aufstellen.",
    link: "/leistungen",
    linkLabel: "Mehr erfahren",
  },
  {
    icon: Clock,
    title: "Ergebnisse, nicht Versprechen.",
    text: "Jedes Projekt wird an messbaren Zielen gemessen: mehr Anfragen, mehr Buchungen, weniger manuelle Arbeit. Wir liefern – nachweislich.",
    link: "/kontakt",
    linkLabel: "Demo anfragen",
  },
];

export function TrustSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.12 });

  return (
    <section
      ref={ref}
      id="prinzipien"
      aria-labelledby="trust-heading"
      className="py-28 bg-white dark:bg-gray-950"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={0}
          className="max-w-2xl mb-16"
        >
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500 mb-5">
            Wie wir denken
          </p>
          <h2
            id="trust-heading"
            className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-[1.08] tracking-tight mb-5"
          >
            Die Grundlage für
            <br />
            <span className="text-gray-400 dark:text-gray-600">operative Exzellenz.</span>
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
            Sechs Prinzipien, die jede Entscheidung bei{" "}
            <Link
              to="/"
              className="font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Cogniiq
            </Link>{" "}
            treiben – klar, direkt, kompromisslos.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
          {principles.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                variants={fadeUp}
                custom={i * 0.08}
                className="bg-white dark:bg-gray-950 p-8 group hover:bg-gray-50 dark:hover:bg-gray-900/70 transition-colors duration-300"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-5 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                  <Icon size={16} className="text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 leading-snug">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
                  {item.text}
                </p>
                <Link
                  to={item.link}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors uppercase tracking-[0.1em]"
                >
                  {item.linkLabel}
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="opacity-60">
                    <path
                      d="M4 2L8 6L4 10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
