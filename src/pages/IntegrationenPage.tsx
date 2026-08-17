// ─────────────────────────────────────────────────────────────────────────────
// /integrationen — GRUNDGERÜST.
//
// Freigegeben wurde die Route, nicht der Inhalt. Die eigentliche Substanz
// dieser Seite ist die dreistufige Anbindungsliste (direkt angebunden / über
// Schnittstelle möglich / auf Anfrage prüfen). Diese Liste existiert noch
// nicht in verifizierter Form — siehe OWNER-INPUT.md, Gruppe B (B1–B4).
//
// Deshalb steht hier bewusst KEINE Fachaussage: keine PVS-Namen, keine
// Telefonanlagen, keine Aussage darüber, was anbindbar ist. Eine Seite, die
// Integrationen verspricht, ohne sie belegen zu können, wäre genau das leere
// Versprechen, das der Brief untersagt.
//
// Die Route ist bis dahin NICHT indexierbar (siehe publicRoutes.ts) — eine
// leere Seite gehört nicht in den Suchindex.
// ─────────────────────────────────────────────────────────────────────────────
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const breadcrumbs = [
  { name: "Home", url: base },
  { name: "Integrationen", url: `${base}/integrationen` },
];

export function IntegrationenPage() {
  return (
    <>
      <PageSEO
        title="Anbindungen an Ihr System | Cogniiq"
        description="Welche Anbindung an Praxissoftware, Kalender und Telefonanlage möglich ist, prüfen wir vor dem Angebot. Die verifizierte Übersicht folgt an dieser Stelle."
        canonical={`${base}/integrationen`}
        breadcrumbs={breadcrumbs}
      />

      <main className="min-h-screen bg-white dark:bg-gray-950">
        <section className="pt-32 pb-24">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 mb-8"
            >
              <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                Home
              </Link>
              <ChevronRight size={12} aria-hidden="true" />
              <span className="text-gray-600 dark:text-gray-300" aria-current="page">
                Integrationen
              </span>
            </nav>

            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.12] tracking-tight mb-6">
              Anbindung an Ihr System
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 leading-[1.75] mb-5">
              Ob ein Telefonassistent Ihren Alltag entlastet, entscheidet sich
              selten am Gespräch — sondern daran, ob das Ergebnis danach dort
              ankommt, wo Sie arbeiten. Deshalb prüfen wir die Anbindung an Ihre
              Praxissoftware, Ihren Kalender und Ihre Telefonanlage vor dem
              Angebot und sagen Ihnen konkret, in welcher Form die Übergabe
              ankommt.
            </p>

            <p className="text-lg text-gray-600 dark:text-gray-400 leading-[1.75] mb-10">
              Eine belastbare Übersicht — welche Systeme direkt angebunden sind,
              welche über eine Schnittstelle möglich sind und welche wir im
              Einzelfall prüfen — veröffentlichen wir an dieser Stelle, sobald
              sie vollständig geprüft ist. Bis dahin steht hier keine Liste:
              Systemnamen ohne belegte Anbindungstiefe wären eine Zusage, die wir
              nicht halten könnten.
            </p>

            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 mb-10">
              <p className="text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Wenn Sie wissen möchten, ob Ihr konkretes System angebunden werden
                kann: Nennen Sie es uns im Erstgespräch. Wir prüfen es und
                antworten verbindlich — auch dann, wenn die Antwort „geht heute
                nicht" lautet.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/kontakt"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-colors"
              >
                Anbindung prüfen lassen
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link
                to="/praxen"
                className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-400 transition-colors"
              >
                Für Praxen
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
