// ─────────────────────────────────────────────────────────────────────────────
// Rahmen des Praxis-Rechners.
//
// Überschrift, Einleitung, Rahmung und der Hinweis zur PVS-Anbindung stehen
// hier STATISCH — sie sind Textinhalt und müssen im vorgerenderten HTML
// stehen. Nur das interaktive Widget wird lazy nachgeladen, damit der
// Rechner den LCP der Seite nicht belastet.
//
// Kein Schema: Berechnete Werte sind keine Produktaussagen und gehören nicht
// in strukturierte Daten.
// ─────────────────────────────────────────────────────────────────────────────
import { Suspense, lazy } from "react";
import { RECHNER } from "@/lib/telefonassistent-copy";

const PraxisRechnerWidget = lazy(() =>
  import("@/components/PraxisRechnerWidget").then((m) => ({ default: m.PraxisRechnerWidget }))
);

export function PraxisRechnerSection({ tone = "plain" }: { tone?: "plain" | "alt" }) {
  return (
    <section
      className={tone === "alt" ? "py-24 bg-gray-50 dark:bg-gray-900/40" : "py-24"}
      aria-labelledby="rechner-heading"
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <h2
          id="rechner-heading"
          className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-6"
        >
          {RECHNER.headline}
        </h2>
        <div className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7] space-y-5 mb-10 max-w-3xl">
          <p>{RECHNER.intro}</p>
          <p>{RECHNER.rahmung}</p>
        </div>

        <Suspense
          fallback={
            <p className="text-[17px] text-gray-500 dark:text-gray-500">Rechner wird geladen …</p>
          }
        >
          <PraxisRechnerWidget />
        </Suspense>

        <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7] mt-8 max-w-3xl">
          {RECHNER.anbindungsHinweis}
        </p>
      </div>
    </section>
  );
}
