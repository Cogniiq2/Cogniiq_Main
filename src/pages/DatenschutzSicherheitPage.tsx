// ─────────────────────────────────────────────────────────────────────────────
// /datenschutz-sicherheit — GRUNDGERÜST.
//
// Abgegrenzt von /datenschutz (juristische Datenschutzerklärung). Diese Seite
// ist die S4-Seite für den Datenschutz-Gatekeeper der Praxis.
//
// Freigegeben wurde die Route, nicht der Inhalt. Die inhaltlichen Aussagen
// dieser Seite hängen vollständig an OWNER-INPUT.md, Gruppen B5–B8 und C1–C5:
// Hosting-Standort, Sub-Auftragsverarbeiter, Speicherdauer, Training auf
// Patientendaten, AVV-Standard, TOM-Liste, Downloads — und C1, die Frage, ob
// der Assistent sich heute nach Art. 50 KI-VO als KI zu erkennen gibt.
//
// Bis diese Antworten vorliegen steht hier KEINE Compliance-Zusage. Was hier
// heute steht, sind ausschließlich die Fragen, die eine Praxis stellen muss —
// keine Antworten, die wir noch nicht belegen können.
//
// Die Route ist bis dahin NICHT indexierbar (siehe publicRoutes.ts).
// ─────────────────────────────────────────────────────────────────────────────
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const breadcrumbs = [
  { name: "Home", url: base },
  { name: "Datenschutz & Sicherheit", url: `${base}/datenschutz-sicherheit` },
];

// Bewusst als FRAGEN formuliert, nicht als Zusagen: Diese Punkte gehören auf
// den Prüfstand jeder Praxis — die belegten Antworten folgen nach OWNER-INPUT.
const PRUEFPUNKTE = [
  "Auftragsverarbeitungsvertrag nach Art. 28 DSGVO: Wird er gestellt, und gehört er zum Standard?",
  "Ärztliche Schweigepflicht nach § 203 StGB: Wie werden die Pflichten auf Auftragsverarbeiter übertragen?",
  "Aufzeichnung und Speicherung: Was genau wird gespeichert, wo, wie lange — und was wird nicht gespeichert (§ 201 StGB)?",
  "Hosting-Standort und Sub-Auftragsverarbeiter: Wer verarbeitet in welchem Land?",
  "Training: Werden Gesprächs- oder Patientendaten zur Modellverbesserung genutzt?",
  "Transparenz nach Art. 50 KI-VO: Erfahren Anrufer zu Gesprächsbeginn, dass ein KI-System spricht?",
  "Datenschutz-Folgenabschätzung: Welche Unterlagen erhält Ihr Datenschutzbeauftragter für seine eigene Bewertung?",
];

export function DatenschutzSicherheitPage() {
  return (
    <>
      <PageSEO
        title="Datenschutz & Sicherheit – die Prüfpunkte | Cogniiq"
        description="Welche Datenschutzfragen eine Praxis vor dem Einsatz eines Telefonassistenten klären sollte: AVV, Schweigepflicht, Speicherung, Hosting, KI-Transparenz."
        canonical={`${base}/datenschutz-sicherheit`}
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
                Datenschutz & Sicherheit
              </span>
            </nav>

            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 leading-[1.12] tracking-tight mb-6">
              Datenschutz & Sicherheit
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 leading-[1.75] mb-5">
              Wer in einer Praxis über einen Telefonassistenten entscheidet, prüft
              zuerst den Datenschutz — und zwar zu Recht. Am Telefon fallen
              Gesundheitsdaten an, und die ärztliche Schweigepflicht endet nicht
              beim Dienstleister.
            </p>

            <p className="text-lg text-gray-600 dark:text-gray-400 leading-[1.75] mb-10">
              Diese Seite wird die belegten Antworten auf die folgenden Punkte
              enthalten. Wir veröffentlichen sie erst, wenn jede einzelne Angabe
              geprüft ist — eine Datenschutzseite mit ungeprüften Zusagen wäre das
              Gegenteil dessen, wofür sie da ist.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Die Punkte, die hier beantwortet werden
            </h2>
            <ul className="space-y-4 mb-10">
              {PRUEFPUNKTE.map((punkt, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed"
                >
                  <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
                  {punkt}
                </li>
              ))}
            </ul>

            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 mb-10">
              <p className="text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Wir geben keine Rechtsberatung und beurteilen insbesondere nicht,
                ob Ihre Praxis eine Datenschutz-Folgenabschätzung durchführen
                muss. Diese Bewertung trifft Ihr Datenschutzbeauftragter — wir
                liefern ihm die Unterlagen dafür zu. Die rechtliche
                Datenschutzerklärung dieser Website finden Sie unter{" "}
                <Link
                  to="/datenschutz"
                  className="underline underline-offset-2 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                  Datenschutz
                </Link>
                .
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/kontakt"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-colors"
              >
                Fragen Ihres Datenschutzbeauftragten klären
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
