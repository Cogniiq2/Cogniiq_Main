// ─────────────────────────────────────────────────────────────────────────────
// Redaktionelle Verantwortung — der Kasten unter einem Fachbeitrag.
//
// Warum es diesen Baustein gibt: Die Website veröffentlicht fachliche
// Anleitungen, ohne dass erkennbar wäre, wer dafür geradesteht. Der Beitrag
// trägt damit weniger Gewicht, als er verdient, und der Leser kann die
// Perspektive nicht einordnen.
//
// Was hier stehen DARF, ist eng begrenzt und stammt ausschließlich aus dem
// bereits veröffentlichten Impressum (src/lib/legal-content.tsx):
//   - Name und Anschrift der nach § 18 Abs. 2 MStV verantwortlichen Person,
//   - die Rolle „Inhaber und Gründer" — beides im Impressum bzw. in
//     BUSINESS_INFO belegt,
//   - die Perspektive: technische Umsetzung.
//
// Was hier NIEMALS stehen darf (HONESTY-AUDIT §7.7, COPY-BRIEF §2):
//   - Titel, Abschlüsse, Zertifikate, Mitgliedschaften, Berufsjahre. Im
//     Repository ist keine einzige solche Qualifikation belegt.
//   - Irgendein Anschein von ärztlicher, juristischer, datenschutzrechtlicher
//     oder sicherheitsprüfender Qualifikation. Der Kasten sagt deshalb
//     ausdrücklich, was dieser Text NICHT ist.
//   - Eine Aufgabenteilung zwischen den beiden Gründern. Zwei Quellen haben
//     sich dazu einmal widersprochen; die neutrale Rolle ist bewusst gewählt
//     (src/lib/seo-data.ts, Z13).
//
// Kein Foto: Der Bild-Slot für Lazar Popovic ist projektweit noch nicht
// freigegeben (ASSETS-REQUIRED.md §C). Ein Baustein, dessen Asset fehlt,
// rendert hier gar nichts statt eines Platzhalters.
//
// Die Person-Angaben spiegeln das Article-Schema der Seite. Wer diesen Kasten
// einsetzt, muss `author` im Schema auf dieselbe Person setzen — sonst
// widerspricht die strukturierte Auszeichnung dem sichtbaren Text.
// ─────────────────────────────────────────────────────────────────────────────
import { Link } from "react-router-dom";

import { BUSINESS_INFO } from "@/lib/seo-data";

/** Die nach § 18 Abs. 2 MStV verantwortliche Person. Deckungsgleich mit dem
 *  Impressum — dort ist sie bereits veröffentlicht. */
export const REDAKTION = {
  name: "Lazar Popovic",
  rolle: "Inhaber und Gründer von Cogniiq",
  ort: `${BUSINESS_INFO.address.postalCode} ${BUSINESS_INFO.address.addressLocality}`,
} as const;

interface RedaktionelleVerantwortungProps {
  /** Datum der Erstveröffentlichung, ISO (JJJJ-MM-TT). */
  veroeffentlicht: string;
  /** Datum der letzten inhaltlichen Überarbeitung, ISO. */
  aktualisiert: string;
  /**
   * Ein Satz dazu, woher das Wissen in diesem Beitrag stammt. Bewusst je
   * Beitrag verschieden: Eine allgemeine Floskel („langjährige Erfahrung")
   * wäre genau die unbelegte Behauptung, die dieser Kasten vermeiden soll.
   */
  grundlage: string;
}

function datumDe(iso: string): string {
  const [jahr, monat, tag] = iso.split("-");
  return `${tag}.${monat}.${jahr}`;
}

export function RedaktionelleVerantwortung({
  veroeffentlicht,
  aktualisiert,
  grundlage,
}: RedaktionelleVerantwortungProps) {
  return (
    <section className="py-16" aria-labelledby="redaktion-heading">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
          <h2
            id="redaktion-heading"
            className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-5"
          >
            Wer für diesen Beitrag geradesteht
          </h2>

          <p className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7]">
            <strong className="font-semibold text-gray-900 dark:text-gray-100">
              {REDAKTION.name}
            </strong>
            , {REDAKTION.rolle}, {REDAKTION.ort}. Verantwortlich für den Inhalt nach
            § 18 Abs. 2 MStV; die vollständige Anbieterkennzeichnung steht im{" "}
            <Link
              to="/impressum"
              className="underline underline-offset-4 hover:no-underline focus-visible:outline-2"
            >
              Impressum
            </Link>
            .
          </p>

          <p className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] mt-4">
            {grundlage}
          </p>

          {/*
            Die Abgrenzung ist kein Kleingedrucktes, sondern der Grund, warum der
            Rest des Beitrags glaubwürdig ist. Sie steht deshalb im selben
            Schriftgrad wie der übrige Text.
          */}
          <p className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] mt-4">
            Wir schreiben hier aus der Sicht der technischen Umsetzung. Dieser Beitrag ist
            keine ärztliche, rechtliche oder datenschutzrechtliche Beratung und ersetzt
            weder Ihre eigene Prüfung noch die Ihres Datenschutzbeauftragten.
          </p>

          <p className="text-[15px] text-gray-500 dark:text-gray-500 mt-6">
            Veröffentlicht am {datumDe(veroeffentlicht)}
            {aktualisiert !== veroeffentlicht && <> · Zuletzt überarbeitet am {datumDe(aktualisiert)}</>}
          </p>
        </div>
      </div>
    </section>
  );
}
