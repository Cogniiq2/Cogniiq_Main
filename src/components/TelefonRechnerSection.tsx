// ─────────────────────────────────────────────────────────────────────────────
// Rahmen für den kanonischen Preis- und Wirtschaftlichkeitsrechner.
//
// Überschrift, Einleitung und Nachsatz stehen hier STATISCH im HTML — sie sind
// Textinhalt und gehören in den Prerender. Nur das interaktive Bauteil wird
// lazy nachgeladen, damit der Rechner den LCP der Seite nicht belastet.
//
// WARUM ES DIESE DATEI GIBT. Vorher hatte jede Seite ihren eigenen Rahmen um
// ihren eigenen Rechner — und mit dem Rahmen driftete die Rechnung. Der Rahmen
// ist hier verhandelbar (Überschrift, Einleitung, Variante), die Rechnung nicht:
// Sie kommt in jedem Fall aus `TelefonRechner` und damit aus
// `src/lib/telefonassistent-rechner.ts`.
//
// KEIN SCHEMA. Berechnete Werte sind keine Produktaussagen und gehören nicht in
// strukturierte Daten.
// ─────────────────────────────────────────────────────────────────────────────
import { Suspense, lazy } from "react";
import type { RechnerVariante } from "@/components/TelefonRechner";

const TelefonRechner = lazy(() =>
  import("@/components/TelefonRechner").then((m) => ({ default: m.TelefonRechner }))
);

export function TelefonRechnerSection({
  id,
  headline,
  intro,
  nachsatz,
  variante = "voll",
  tone = "plain",
  headingClassName = "text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-6",
}: {
  /** Sprungziel. Auf der Flaggschiff-Seite `RECHNER_ANKER`. */
  id?: string;
  headline: string;
  intro: string[];
  nachsatz?: string;
  variante?: RechnerVariante;
  tone?: "plain" | "alt";
  headingClassName?: string;
}) {
  const headingId = id ? `${id}-heading` : "telefon-rechner-heading";
  return (
    <section
      id={id}
      className={`${tone === "alt" ? "py-24 bg-gray-50 dark:bg-gray-900/40" : "py-24"} ${
        id ? "scroll-mt-24" : ""
      }`}
      aria-labelledby={headingId}
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <h2 id={headingId} className={headingClassName}>
          {headline}
        </h2>
        <div className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7] space-y-5 mb-10 max-w-3xl">
          {intro.map((absatz) => (
            <p key={absatz}>{absatz}</p>
          ))}
        </div>

        <Suspense
          fallback={
            <p className="text-[17px] text-gray-500 dark:text-gray-500">Rechner wird geladen …</p>
          }
        >
          <TelefonRechner variante={variante} />
        </Suspense>

        {nachsatz && (
          <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7] mt-8 max-w-3xl">
            {nachsatz}
          </p>
        )}
      </div>
    </section>
  );
}
