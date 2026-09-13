// ─────────────────────────────────────────────────────────────────────────────
// Rahmen für den kanonischen Preis- und Wirtschaftlichkeitsrechner.
//
// Überschrift, Einleitung und Nachsatz stehen hier STATISCH im HTML — sie sind
// Textinhalt und gehören in den Prerender.
//
// DER RECHNER WIRD HIER NICHT MEHR LAZY GELADEN, und das ist eine
// Hydratationsentscheidung, keine Geschmacksfrage.
//
// Das Bauteil hing an einem eigenen `React.lazy` INNERHALB dieses Rahmens.
// Diese Verschachtelung liegt eine Ebene unter dem, was der Prerender in
// `window.__COGNIIQ_ROUTE_CHUNKS__` ankündigt: Der Rahmen stand in der Liste,
// der Rechner nicht. `main.tsx` wartet vor dem Mount nur auf die angekündigten
// Chunks — die Suspense-Grenze um den Rechner blieb also für eine volle
// Netzrunde DEHYDRIERT, während die Seite bereits hydratisiert war und
// Effekte liefen.
//
// In diesem Fenster bricht jede Zustandsänderung die Hydratation genau dieser
// Grenze ab (React #421, gemessen von
// `.github/scripts/test-browser-hydration.mjs` mit
// STATIC_SERVER_ASSET_DELAY_MS=600). Ausgelöst hat es die Viewport-Umschaltung
// des Heros; der Auslöser war austauschbar, die offene Grenze war die Ursache.
//
// Als statischer Import liegt der Rechner im selben Modulgraphen wie dieser
// Rahmen und damit in der angekündigten Chunk-Liste. Er wird weiterhin nicht
// in das Hauptbündel gelegt, sondern bleibt ein eigener, von mehreren Seiten
// geteilter Chunk — nur eben einer, der VOR dem Mount da ist. Es gibt keine
// Suspense-Grenze mehr, die aufbrechen könnte.
//
// `/ki-telefonassistent` lädt denselben Rechner weiterhin über ein eigenes
// `lazy` mit eigener Grenze; dort steht er weit unterhalb des ersten
// Bildschirms und ist nicht Teil dieses Problems.
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
import { TelefonRechner, type RechnerVariante } from "@/components/TelefonRechner";

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
      className={`${tone === "alt" ? "border-t border-pub-hairline-soft bg-pub-paper-2 py-20 dark:bg-gray-900/40 lg:py-28" : "py-20 lg:py-28"} ${
        id ? "scroll-mt-24" : ""
      }`}
      aria-labelledby={headingId}
    >
      <div className={`mx-auto px-6 lg:px-10 ${variante === "kompakt" ? "max-w-[1200px]" : "max-w-5xl"}`}>
        <h2 id={headingId} className={headingClassName}>
          {headline}
        </h2>
        <div className="mb-10 max-w-[58ch] space-y-5 text-[17px] leading-[1.65] text-pub-ink-2 dark:text-gray-400">
          {intro.map((absatz) => (
            <p key={absatz}>{absatz}</p>
          ))}
        </div>

        <TelefonRechner variante={variante} />

        {nachsatz && (
          <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7] mt-8 max-w-3xl">
            {nachsatz}
          </p>
        )}
      </div>
    </section>
  );
}
