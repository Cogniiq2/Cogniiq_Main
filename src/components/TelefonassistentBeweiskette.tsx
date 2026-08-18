// ─────────────────────────────────────────────────────────────────────────────
// Die geteilte Beweiskette für die Healthcare-Segmentseiten (Stufe 7).
//
// Reihenfolge nach COPY-BRIEF-3 §2. Die Kette ist auf drei Exporte verteilt,
// weil die segmentspezifischen Abschnitte der Seite (Problems, Solution,
// Benefits, Workflow) dazwischenliegen und M15 (Grenzen) aus der Seiten-Config
// kommt — es muss vor dem Preis stehen (§3.2):
//
//   Oben   nach den Problemen:  M20 Patientensicht · M3 Gescheiterte Versuche · M4 Säulen
//   Mitte  nach dem Workflow:   M14 Übergabe · M8 Anliegen-Katalog
//   ── hier rendert die Seite M15 Grenzen aus der Config ──
//   Unten  vor dem FAQ:         M21 Team · M17 Einrichtung · M18 Betreuung ·
//                               M10 Preis · M19 Umkehrbarkeit · M16 Nicht passend ·
//                               M7 Datenschutz
//
// M13 (Stimmprobe) rendert die Seite selbst, asset-gated. M22 (Referenz)
// existiert nicht — es gibt keine Referenzpraxis mit Einwilligung.
//
// Vier Module stehen bewusst in der Kompaktfassung: M4, M10, M19 und M7 sind
// produktweit gleich und tragen nichts Segmentspezifisches. Ihre Vollversionen
// liegen auf /praxen, der Preisseite und /datenschutz-sicherheit; jede
// Kompaktfassung verlinkt dorthin. Dieselbe Entscheidung wie bei den
// Stadtseiten, aus demselben Grund: Die Tiefe gehört an eine Stelle.
//
// Sämtliche Texte kommen aus telefonassistent-copy.ts. Hier steht kein eigener
// Fließtext — sonst entstünde die zweite Wahrheitsquelle aus HONESTY-AUDIT §7.
//
// Gestaltung nach COPY-BRIEF-3 §1: Fließtext ≥ 17 px, Trennung durch Raum,
// Bewegung ≤ 180 ms und nur Deckkraft plus kleine Verschiebung, Akzentfarbe
// bleibt dem CTA vorbehalten.
// ─────────────────────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  ANLIEGEN_IMMER_MENSCH,
  ANLIEGEN_UEBERNIMMT,
  BETREUUNG,
  EINRICHTUNG_PROJEKT,
  KOMPAKT_DATENSCHUTZ,
  KOMPAKT_KOSTEN,
  KOMPAKT_SAEULEN,
  KOMPAKT_UMKEHRBARKEIT,
  NICHT_PASSEND,
  PATIENTEN_SICHT,
  SCHEITERN_INTRO,
  SCHEITERN_MUSTER,
  TEAM_BLOCK,
  UEBERGABE,
} from "@/lib/telefonassistent-copy";

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: "easeOut" as const },
  },
};

const BODY = "text-[17px] leading-relaxed text-gray-700 dark:text-gray-300";
const LABEL =
  "text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400";

function Section({
  id,
  headline,
  tint = false,
  children,
}: {
  id: string;
  headline: string;
  tint?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`py-20 ${
        tint ? "bg-gray-50 dark:bg-gray-900/40" : "bg-white dark:bg-gray-950"
      } transition-colors duration-300`}
      aria-labelledby={id}
    >
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2
            id={id}
            className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8"
          >
            {headline}
          </h2>
          {children}
        </motion.div>
      </div>
    </section>
  );
}

function Punkte({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className={`${BODY} pl-5 relative`}>
          <span
            aria-hidden="true"
            className="absolute left-0 top-[0.7em] w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

function Mehr({ label, href }: { label: string; href: string }) {
  return (
    <Link
      to={href}
      className="inline-flex items-center gap-2 mt-6 text-[17px] text-gray-700 dark:text-gray-300 underline underline-offset-4 decoration-gray-300 dark:decoration-gray-600 hover:decoration-gray-500 dark:hover:decoration-gray-400 transition-colors"
    >
      {label}
      <ArrowRight size={16} aria-hidden="true" className="shrink-0" />
    </Link>
  );
}

/** M20 · Patientensicht — M3 · Gescheiterte Versuche — M4 · Säulen (kompakt). */
export function BeweisketteOben() {
  return (
    <>
      <Section id="patientensicht" headline={PATIENTEN_SICHT.headline} tint>
        <div className="space-y-5">
          {PATIENTEN_SICHT.paragraphs.map((absatz) => (
            <p key={absatz} className={BODY}>
              {absatz}
            </p>
          ))}
        </div>
        <figure className="mt-8 border-l-2 border-gray-200 dark:border-gray-700 pl-6">
          <p className="text-[17px] leading-relaxed text-gray-900 dark:text-gray-100">
            <strong className="font-semibold">{PATIENTEN_SICHT.stat.value}</strong>{" "}
            {PATIENTEN_SICHT.stat.text}
          </p>
          <figcaption className="text-[14px] text-gray-500 dark:text-gray-400 mt-2">
            {PATIENTEN_SICHT.stat.source}
          </figcaption>
        </figure>
      </Section>

      <Section id="gescheitert" headline="Warum bisherige Versuche gescheitert sind">
        <p className={`${BODY} mb-8`}>{SCHEITERN_INTRO}</p>
        <div className="space-y-8">
          {SCHEITERN_MUSTER.map((muster) => (
            <div key={muster.title}>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {muster.title}
              </h3>
              <p className={BODY}>{muster.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="saeulen" headline={KOMPAKT_SAEULEN.headline} tint>
        <Punkte items={KOMPAKT_SAEULEN.punkte} />
        <Mehr {...KOMPAKT_SAEULEN.mehr} />
      </Section>
    </>
  );
}

/** M14 · Die Übergabe — M8 · Anliegen-Katalog. */
export function BeweisketteMitte() {
  return (
    <>
      <Section id="uebergabe" headline={UEBERGABE.headline}>
        <div className="space-y-5">
          {UEBERGABE.paragraphs.map((absatz) => (
            <p key={absatz} className={BODY}>
              {absatz}
            </p>
          ))}
        </div>
        <div className="mt-8">
          <h3 className={`${LABEL} mb-3`}>{UEBERGABE.wasAnkommt.headline}</h3>
          <Punkte items={UEBERGABE.wasAnkommt.items} />
          <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-4">
            {UEBERGABE.wasAnkommt.hinweis}
          </p>
        </div>
      </Section>

      <Section id="anliegen" headline="Was der Empfang übernimmt — und was nicht" tint>
        <div className="space-y-10">
          <div>
            <h3 className={`${LABEL} mb-3`}>Das übernimmt der Assistent</h3>
            <Punkte items={ANLIEGEN_UEBERNIMMT} />
          </div>
          <div>
            <h3 className={`${LABEL} mb-3`}>Das landet immer bei einem Menschen</h3>
            <Punkte items={ANLIEGEN_IMMER_MENSCH} />
          </div>
        </div>
      </Section>
    </>
  );
}

/**
 * M21 Team · M17 Einrichtung · M18 Betreuung · M10 Preis · M19 Umkehrbarkeit ·
 * M16 Nicht passend · M7 Datenschutz. Steht hinter M15 (Grenzen), damit die
 * benannten Grenzen vor dem Preis stehen (COPY-BRIEF-3 §3.2).
 */
export function BeweisketteUnten() {
  return (
    <>
      <Section id="team" headline={TEAM_BLOCK.headline} tint>
        <p className={`${BODY} mb-6`}>{TEAM_BLOCK.text}</p>
        <Punkte items={TEAM_BLOCK.points} />
      </Section>

      <Section id="einrichtung" headline={EINRICHTUNG_PROJEKT.headline}>
        <p className={`${BODY} mb-8`}>{EINRICHTUNG_PROJEKT.intro}</p>
        <ol className="space-y-6">
          {EINRICHTUNG_PROJEKT.schritte.map((schritt) => (
            <li key={schritt.nummer} className="flex gap-5">
              <span
                aria-hidden="true"
                className="shrink-0 text-[15px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums pt-0.5 w-6"
              >
                {schritt.nummer}
              </span>
              <div>
                <h3 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">
                  {schritt.title}
                  {schritt.dauer && (
                    <span className="font-normal text-gray-500 dark:text-gray-400">
                      {" · "}
                      {schritt.dauer}
                    </span>
                  )}
                </h3>
                <p className={`${BODY} mt-1`}>{schritt.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="betreuung" headline={BETREUUNG.headline} tint>
        <p className={`${BODY} mb-6`}>{BETREUUNG.text}</p>
        <p className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">
          {BETREUUNG.person.name}
          <span className="font-normal text-gray-500 dark:text-gray-400">
            {" · "}
            {BETREUUNG.person.rolle}
          </span>
        </p>
        {/* [[ASSET: Foto Lazar Popovic — bis zur Lieferung kein Bild-Slot im DOM]] */}
        <dl className="mt-6 space-y-4">
          {BETREUUNG.fakten.map((fakt) => (
            <div key={fakt.label}>
              <dt className={`${LABEL} mb-1`}>{fakt.label}</dt>
              <dd className={BODY}>{fakt.wert}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="kosten" headline={KOMPAKT_KOSTEN.headline}>
        <p className={BODY}>{KOMPAKT_KOSTEN.text}</p>
        <Mehr {...KOMPAKT_KOSTEN.mehr} />
      </Section>

      <Section id="umkehrbarkeit" headline={KOMPAKT_UMKEHRBARKEIT.headline} tint>
        <dl className="space-y-4">
          {KOMPAKT_UMKEHRBARKEIT.fakten.map((fakt) => (
            <div key={fakt.label}>
              <dt className={`${LABEL} mb-1`}>{fakt.label}</dt>
              <dd className={BODY}>{fakt.wert}</dd>
            </div>
          ))}
        </dl>
        <Mehr {...KOMPAKT_UMKEHRBARKEIT.mehr} />
      </Section>

      <Section id="nicht-passend" headline={NICHT_PASSEND.headline}>
        <p className={`${BODY} mb-6`}>{NICHT_PASSEND.intro}</p>
        <Punkte items={NICHT_PASSEND.points} />
      </Section>

      <Section id="datenschutz" headline={KOMPAKT_DATENSCHUTZ.headline} tint>
        <Punkte items={KOMPAKT_DATENSCHUTZ.punkte} />
        <Mehr {...KOMPAKT_DATENSCHUTZ.mehr} />
      </Section>
    </>
  );
}
