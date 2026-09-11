// ─────────────────────────────────────────────────────────────────────────────
// Der eine Verweis-Baustein auf den Preis- und Wirtschaftlichkeitsrechner.
//
// WOZU EIN EIGENES BAUTEIL. Der Rechner ist die Konversionsfunktion des
// Clusters, und er wirkt nur, wenn das Versprechen daneben überall dasselbe
// ist: sofort, ohne E-Mail, und was noch nicht feststeht, steht als offen da.
// Zehn handgeschriebene Varianten dieses Versprechens wären zehn Gelegenheiten,
// es versehentlich zu überdehnen.
//
// WAS HIER BEWUSST NICHT STEHT: „keine versteckten Kosten". Gebühren, die
// Dritte für eine Schnittstelle verlangen, stehen erst nach der technischen
// Prüfung fest — ein Versprechen, das sie ausschließt, wäre nicht haltbar.
// Haltbar ist das engere: Keine Kostenposition wird still weggelassen.
//
// ANKERTEXT IST PFLICHTPARAMETER, KEIN VORGABEWERT. Zehn identische
// Exact-Match-Anker („KI Telefonassistent Kosten") auf zehn Seiten sind ein
// Muster, das Suchmaschinen als Manipulation lesen und Besucher als Fließband.
// Jede Seite formuliert den Anker aus ihrem eigenen Kontext heraus.
//
// DAS ZIEL IST IMMER `RECHNER_LINK`. Kein DOM-Index, kein Selektor, kein
// Scroll-Skript: ein gewöhnlicher Fragment-Link, der auch ohne JavaScript und
// aus dem Prerender heraus funktioniert.
// ─────────────────────────────────────────────────────────────────────────────
import { Calculator } from "lucide-react";
import { trackEvent } from "@/lib/consent";
import { RECHNER_LINK, RECHNER_VERSPRECHEN } from "@/lib/rechner-anker";

export function RechnerCta({
  ankertext,
  kontext,
  einleitung,
  variante = "karte",
  className = "",
}: {
  /** Die Worte, mit denen DIESE Seite auf den Rechner zeigt. */
  ankertext: string;
  /** Kurzer Name der Seite/Sektion für die Messung. Nie ein Eingabewert. */
  kontext: string;
  /** Optionaler Satz darüber, warum der Rechner hier hilft. */
  einleitung?: string;
  /** `karte` für eigenständige Abschnitte, `zeile` für Fließtextnähe. */
  variante?: "karte" | "zeile";
  className?: string;
}) {
  const link = (
    <a
      href={RECHNER_LINK}
      onClick={() => trackEvent("calculator_anchor_click", kontext)}
      className={
        variante === "karte"
          ? "inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-[15px] hover:bg-gray-700 dark:hover:bg-white transition-colors"
          : "inline-flex items-center gap-2 text-[16px] font-semibold text-gray-900 dark:text-gray-100 underline decoration-gray-300 dark:decoration-gray-600 underline-offset-4 hover:decoration-gray-900 dark:hover:decoration-gray-100 transition-colors"
      }
    >
      <Calculator size={15} aria-hidden="true" />
      {ankertext}
    </a>
  );

  if (variante === "zeile") {
    return (
      <div className={className}>
        {link}
        <p className="text-[14px] text-gray-500 dark:text-gray-500 mt-1.5">{RECHNER_VERSPRECHEN}</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-7 ${className}`}
    >
      {einleitung && (
        <p className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] mb-5 max-w-2xl">
          {einleitung}
        </p>
      )}
      {link}
      <p className="text-[14px] text-gray-500 dark:text-gray-500 mt-3">{RECHNER_VERSPRECHEN}</p>
    </div>
  );
}
