// Fully fixed AboutSection.tsx — no truncation, no unterminated strings, all tags properly closed
// GlossaryWord popups + Apple-smooth animation integrated cleanly

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Target, Wrench, Award } from "lucide-react";

// CLICKABLE WORD POPUP COMPONENT -------------------------------------------------
export function GlossaryWord({ word, explanation }: { word: string; explanation: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <span className="relative inline-block">
      <motion.span
        className="cursor-pointer font-medium"
        whileHover={{ color: "#515A61", scale: 1.06 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        onClick={() => setOpen(!open)}
      >
        {word}
      </motion.span>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
            className="absolute left-1/2 top-8 z-50 w-64 -translate-x-1/2 rounded-2xl bg-white/80 backdrop-blur-xl p-4 shadow-xl border border-gray-200"
          >
            <p className="text-sm text-gray-700 leading-relaxed">{explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// HIGHLIGHTS BLOCK -------------------------------------------------------------
const highlights = [
  {
    icon: Target,
    text:
      "Seit 2025 konsequenter Fokus auf hochkonvertierende Websites, KI-Automationen und AI-Systeme, die messbar Resultate liefern – nicht nur Eindruck.",
  },
  {
    icon: Wrench,
    text:
      "Technische Präzision: Make.com, n8n, Vapi, Cal.com, Google Workspace und moderne Web-Frameworks auf Enterprise-Niveau.",
  },
  {
    icon: Award,
    text:
      "Wenige, ausgewählte Projekte. Absolute Qualität statt Masse. Direkte Zusammenarbeit aus Bayreuth für Unternehmen in ganz Deutschland.",
  },
];

// FOUNDERS BLOCK --------------------------------------------------------------
const founders = [
  {
    name: "Lazar Popovic",
    role:
      "Founder: AI-Automationen, KI-Workflows & technische Integrationen. Fokus auf präzise Prozessautomatisierung, effiziente Abläufe und skalierbare digitale Systeme – ohne unnötige Komplexität.",
  },
  {
    name: "Djordje Popovic",
    role:
      "Founder: Webdesign, System-Architektur & Performance-Optimierung. Entwickelt hochmoderne Websites und digitale Erlebnisse, die klar strukturiert sind und echten geschäftlichen Mehrwert liefern.",
  },
];

// ABOUT SECTION ---------------------------------------------------------------
export function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section id="ueber-uns" ref={ref} className="py-32 bg-white" aria-labelledby="about-heading">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* TITLE */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 id="about-heading" className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
            Wer hinter {" "}
            <span className="tracking-tight">
              <span style={{ color: "#1C2327" }}>Cogni</span>
              <span style={{ color: "#515A61" }}>IQ</span>
            </span>{" "}
            steckt
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT COLUMN */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <p className="text-lg text-gray-600 leading-relaxed">
              Cogniiq wurde 2025 von <strong>Lazar und Djordje Popovic</strong> in <strong>Bayreuth</strong> gegründet.
              Die Vision: Technologie so einsetzen, dass sie echte {" "}

              <GlossaryWord
                word="Business-Resultate"
                explanation="Messbare Ergebnisse wie mehr Anfragen, höhere Conversion-Rates, klarere Prozesse und spürbar bessere Performance. Alles darauf ausgerichtet, echten geschäftlichen Wert zu schaffen."
              />{" "}

              erzeugt – klar, präzise und ohne unnötige {" "}

              <GlossaryWord
                word="Komplexität"
                explanation="Unsere Systeme sind extrem komplex im Hintergrund – vollautomatisierte Logik, Integrationen und KI-Modelle. Für Sie bleibt alles radikal einfach: klar, intuitiv und komplett alltagstauglich – ohne technischen Aufwand."
              />
              .
              <br />
              <br />

              Heute verbindet Cogniiq erstklassiges {" "}
              <GlossaryWord
                word="Webdesign"
                explanation="Hochwertige, schnelle Websites mit klarer Struktur, moderner Ästhetik, starker UX und Conversion-Optimierung. Design, das nicht nur aussieht – sondern verkauft."
              />{" "}
              mit modernster {" "}
              <GlossaryWord
                word="AI-Automatisierung"
                explanation="Vollautomatisierte Prozesse mit KI, die Aufgaben übernehmen, Entscheidungen treffen und Abläufe selbstständig ausführen. Ergebnis: weniger manuelle Arbeit, weniger Fehler, mehr Skalierungsmöglichkeiten."
              />
              . Unternehmen in ganz Deutschland profitieren von Websites, die verkaufen – und Systemen, die Arbeit automatisieren.
            </p>

            {/* HIGHLIGHTS */}
            <div className="space-y-6">
              {highlights.map((highlight, index) => {
                const Icon = highlight.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="p-2 rounded-lg bg-gray-200/40 flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#515A61]" />
                    </div>
                    <p className="text-gray-700 leading-relaxed">{highlight.text}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* RIGHT COLUMN */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {founders.map((founder, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.2 }}
                className="group relative bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-[#515A61]/50 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#515A61] flex items-center justify-center text-2xl font-bold text-white">
                    {founder.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{founder.name}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{founder.role}</p>
                  </div>
                </div>

                <div className="absolute -bottom-px -right-px w-24 h-24 bg-[#515A61] rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
