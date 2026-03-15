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
    title: "Systeme, nicht Beratung.",
    text: "Wir liefern operative KI-Systeme, die laufen – nicht Konzepte, die in der Schublade landen. Websites, die konvertieren. Automationen, die entscheiden. Assistenten, die antworten.",
    link: "/leistungen",
    linkLabel: "Leistungen ansehen",
  },
  {
    icon: Zap,
    title: "Wochen, nicht Monate.",
    text: "Go-Live in 7–14 Tagen. Keine endlosen Abstimmungsrunden, keine Wasserfall-Projektphasen. Das System läuft, bevor andere noch angebote verschicken.",
    link: "/kontakt",
    linkLabel: "Jetzt starten",
  },
  {
    icon: Target,
    title: "Präzise. Ohne Overhead.",
    text: "Keine Software-Lizenzen für Tools, die 80% der Funktionen nicht brauchen. Keine Generalist-Agenturen mit 12-köpfigen Teams. Fokus auf das, was wirkt.",
    link: "/leistungen",
    linkLabel: "Unsere Methode",
  },
  {
    icon: Shield,
    title: "Komplexität bleibt unsichtbar.",
    text: "Die Infrastruktur ist komplex – Ihre tägliche Arbeit nicht. Systeme, die im Hintergrund laufen, ohne dass jemand sie überwachen muss.",
    link: "/ueber-uns",
    linkLabel: "Über Cogniiq",
  },
  {
    icon: TrendingUp,
    title: "Wer heute nicht automatisiert, verliert morgen.",
    text: "Der Wettbewerbsvorteil liegt nicht in mehr Budget oder mehr Personal. Er liegt im System. Wir bauen das Fundament, bevor andere noch darüber nachdenken.",
    link: "/leistungen",
    linkLabel: "Mehr erfahren",
  },
  {
    icon: Clock,
    title: "Ergebnisse, die sich messen lassen.",
    text: "Mehr Anfragen. Mehr Buchungen. Weniger Zeitaufwand. Jedes Projekt startet mit einem klaren Ziel – und endet mit einer messbaren Veränderung.",
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
      className="py-28 bg-white"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={0}
          className="max-w-2xl mb-16"
        >
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-5">
            Wie wir arbeiten
          </p>
          <h2
            id="trust-heading"
            className="text-4xl lg:text-5xl font-bold text-gray-900 leading-[1.08] tracking-tight mb-5"
          >
            Was uns von
            <br />
            <span className="text-gray-300">anderen Agenturen trennt.</span>
          </h2>
          <p className="text-[15px] text-gray-500 leading-relaxed">
            Sechs Prinzipien, die erklären, warum{" "}
            <Link
              to="/"
              className="font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cogniiq
            </Link>{" "}
            anders arbeitet – und warum das für Ihre Ergebnisse einen Unterschied macht.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
          {principles.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                variants={fadeUp}
                custom={i * 0.07}
                className="bg-white p-8 group hover:bg-gray-50/70 transition-colors duration-300"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center mb-5 group-hover:bg-gray-200 transition-colors">
                  <Icon size={15} className="text-gray-600" />
                </div>
                <h3 className="text-[14.5px] font-semibold text-gray-900 mb-3 leading-snug tracking-tight">
                  {item.title}
                </h3>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-5">
                  {item.text}
                </p>
                <Link
                  to={item.link}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-[0.1em]"
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
