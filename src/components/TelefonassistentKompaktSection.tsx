// ─────────────────────────────────────────────────────────────────────────────
// Kompaktfassungen der geteilten Telefonassistent-Module für die drei
// Stadtseiten (Inhaber-Entscheidung „Option A“, 18.08.2026).
//
// Reihenfolge nach der Beweiskette aus COPY-BRIEF-3 §2: Säulen (6) → Preis und
// Deckelung (13) → Umkehrbarkeit (14) → Datenschutz (16). Der Block steht nach
// dem lokalen Teil der Seite und vor dem FAQ, damit die Stadtseite lokal
// beginnt und die Tiefe auf /praxen liegt.
//
// Sämtliche Sätze kommen aus src/lib/telefonassistent-copy.ts. Hier steht
// bewusst kein eigener Fließtext — nur Überschriften der Abschnitte und die
// Verweise auf die jeweilige Vollversion.
//
// Gestaltung nach COPY-BRIEF-3 §1: Fließtext ≥ 17 px, Trennung durch Raum statt
// durch Rahmen oder Farbflächen, Bewegung höchstens 180 ms und nur Deckkraft
// plus kleine Verschiebung, Akzentfarbe bleibt dem CTA vorbehalten.
// ─────────────────────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  KOMPAKT_DATENSCHUTZ,
  KOMPAKT_KOSTEN,
  KOMPAKT_SAEULEN,
  KOMPAKT_UMKEHRBARKEIT,
} from "@/lib/telefonassistent-copy";

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: "easeOut" as const },
  },
};

function Mehr({ label, href }: { label: string; href: string }) {
  return (
    <Link
      to={href}
      className="group inline-flex items-center gap-2 mt-5 text-[17px] text-gray-700 dark:text-gray-300 underline underline-offset-4 decoration-gray-300 dark:decoration-gray-600 hover:decoration-gray-500 dark:hover:decoration-gray-400 transition-colors"
    >
      {label}
      <ArrowRight size={16} aria-hidden="true" className="shrink-0" />
    </Link>
  );
}

function Block({
  id,
  headline,
  children,
}: {
  id: string;
  headline: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
    >
      <h3
        id={id}
        className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4"
      >
        {headline}
      </h3>
      {children}
    </motion.div>
  );
}

/**
 * Rendert die vier Kompaktfassungen. Wird ausschließlich auf den
 * Telefonassistent-Stadtseiten eingebunden.
 */
export function TelefonassistentKompaktSection({ city }: { city: string }) {
  return (
    <section
      className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300"
      aria-labelledby="kompakt-heading"
    >
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <motion.h2
          id="kompakt-heading"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4"
        >
          Preis, Vertrag und Datenschutz — kurz gefasst
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-[17px] leading-relaxed text-gray-600 dark:text-gray-400 mb-14"
        >
          Was für Betriebe in {city} genauso gilt wie überall sonst. Ausführlich
          steht es dort, wo es hingehört — verlinkt bei jedem Abschnitt.
        </motion.p>

        <div className="space-y-14">
          {/* M4 · Die vier Säulen — Titel statt der vier Absätze. */}
          <Block id="kompakt-saeulen" headline={KOMPAKT_SAEULEN.headline}>
            <ul className="space-y-3">
              {KOMPAKT_SAEULEN.punkte.map((punkt) => (
                <li
                  key={punkt}
                  className="text-[17px] leading-relaxed text-gray-700 dark:text-gray-300 pl-5 relative"
                >
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-[0.7em] w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"
                  />
                  {punkt}
                </li>
              ))}
            </ul>
            <Mehr {...KOMPAKT_SAEULEN.mehr} />
          </Block>

          {/* M10 · Planbare Kosten — die Deckelungsaussage, sonst nichts. */}
          <Block id="kompakt-kosten" headline={KOMPAKT_KOSTEN.headline}>
            <p className="text-[17px] leading-relaxed text-gray-700 dark:text-gray-300">
              {KOMPAKT_KOSTEN.text}
            </p>
            <Mehr {...KOMPAKT_KOSTEN.mehr} />
          </Block>

          {/* M19 · Umkehrbarkeit — Laufzeit und Kündigung. */}
          <Block
            id="kompakt-umkehrbarkeit"
            headline={KOMPAKT_UMKEHRBARKEIT.headline}
          >
            <dl className="space-y-4">
              {KOMPAKT_UMKEHRBARKEIT.fakten.map((fakt) => (
                <div key={fakt.label}>
                  <dt className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                    {fakt.label}
                  </dt>
                  <dd className="text-[17px] leading-relaxed text-gray-700 dark:text-gray-300">
                    {fakt.wert}
                  </dd>
                </div>
              ))}
            </dl>
            <Mehr {...KOMPAKT_UMKEHRBARKEIT.mehr} />
          </Block>

          {/* M7 · Datenschutz in drei Punkten. */}
          <Block id="kompakt-datenschutz" headline={KOMPAKT_DATENSCHUTZ.headline}>
            <ul className="space-y-3">
              {KOMPAKT_DATENSCHUTZ.punkte.map((punkt) => (
                <li
                  key={punkt}
                  className="text-[17px] leading-relaxed text-gray-700 dark:text-gray-300 pl-5 relative"
                >
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-[0.7em] w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"
                  />
                  {punkt}
                </li>
              ))}
            </ul>
            <Mehr {...KOMPAKT_DATENSCHUTZ.mehr} />
          </Block>
        </div>
      </div>
    </section>
  );
}
