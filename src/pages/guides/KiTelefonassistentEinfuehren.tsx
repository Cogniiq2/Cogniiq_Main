// ─────────────────────────────────────────────────────────────────────────────
// FACHBEITRAG · „Einen KI-Telefonassistenten in der Praxis einführen"
//
// Zielintention: „KI Telefonassistent einführen" / „… in der Praxis einführen".
// Diese Absicht war auf der Website bisher unbesetzt — es gab die Produktseite
// (/ki-telefonassistent) und die Praxisseite (/praxen), aber keine Seite, die
// die EINFÜHRUNG als eigenes Vorhaben beschreibt.
//
// ABGRENZUNG, die beim Bearbeiten erhalten bleiben muss:
// Diese Seite beschreibt ausschliesslich die Entscheidungen und Pruefungen, die
// bei der PRAXIS liegen. Der Ablauf, den Cogniiq liefert, ist
// EINRICHTUNG_PROJEKT bzw. EINRICHTUNG_SCHRITTE (M17) und steht auf der
// Produktseite. Diese Seite darf dazu keinen zweiten, konkurrierenden Ablauf
// aufstellen und nummeriert ihre Abschnitte deshalb bewusst NICHT: zwei
// nummerierte Prozesse auf einer Website sind zwei Antworten auf dieselbe Frage.
//
// Ebenso wenig werden Module der Beweiskette hier nachgetippt. Wo sich ein Thema
// ueberschneidet (etwa "wann wir nicht passen", M16), steht hier nur der Teil,
// der die EINFUEHRUNG betrifft, und im Uebrigen ein Verweis.
//
// Woher der Inhalt stammt: aus dem tatsächlich betriebenen Einführungsprozess
// (interne Projektvorlage). Veröffentlicht werden ausschließlich das VORGEHEN
// und die PRÜFKATEGORIEN — nie die interne Aufgabenliste als Zusage, nie ein
// Kundenname, nie ein Anbieter- oder Systemname.
//
// Bindende Grenzen für jeden Satz auf dieser Seite:
// - Keine Aussage zu Verarbeitungsort, EU-Servern, „DSGVO-konform" oder
//   Zertifizierung, in keiner Beugung (HONESTY-AUDIT §7.7).
// - Kein Name eines Praxisverwaltungssystems und keine Anbindungszusage
//   (OWNER-INPUT B). Der Stand dazu steht in FAKTEN.keineAnbindung.
// - KEINE Aussage zum Verhalten bei Stoerung oder Ausfall und keine Frist fuer
//   eine Rueckschaltung: OWNER-INPUT B9 ist unbeantwortet, und die Folgezeile
//   dort verlangt ausdruecklich, dass die Fallback-Aussagen von allen Seiten
//   verschwinden. Dass ein Rueckweg VEREINBART wird, darf gesagt werden; wie
//   schnell er greift, nicht.
// - Kein Name eines eingesetzten Dienstleisters oder Modellanbieters: die
//   Unterauftragnehmerliste ist noch nicht veröffentlichungsreif.
// - Keine Triage, keine medizinische Einschätzung — Notfälle werden erkannt
//   und sofort weitergeleitet, nie bewertet.
// - Kein Anteil automatisierter Anrufe, keine Zeitersparnis in Prozent.
// - Keine weiteren Fristen als die zwei belegten (Übergabefrist, Testphase).
// - Fremdstatistiken NUR in der vom Inhaber am Primaerbeleg geprueften Fassung.
//   Zwei sind zugelassen, jeweils mit ihrer Bezugsgroesse:
//     * Zi-PVS-Monitoring 2025 (Zi-Paper 32/2026, veroeffentlicht 14.01.2026):
//       52,1 % — Bezugsgroesse sind die 901 WECHSELWILLIGEN Teilnehmenden, nicht
//       alle Praxen. Die Studie heisst PVS-Monitoring 2025, nicht 2026. Niemals
//       zu "52 % der Praxen sind mit dem Support unzufrieden" verkuerzen.
//     * GKV-Versichertenbefragung 2025 (n = 3.520): 39 % bewerteten die
//       ERREICHBARKEIT MEDIZINISCHER VERSORGUNG ausserhalb der ueblichen
//       Praxisoeffnungszeiten als schwierig. Das ist eine Aussage ueber die
//       Versorgung insgesamt — niemals zu "39 % erreichen ihre Praxis nicht"
//       umdeuten.
//   Beide betreffen NICHT Telefonassistenten. Der Text sagt das jeweils dazu.
//   Jede weitere Fremdzahl braucht denselben Weg: Primaerquelle oeffnen,
//   Bezugsgroesse und Ausgabe pruefen, erst dann zitieren.
// - Keine Kernzahl als Literal — alles aus FAKTEN. Diese Datei steht dafür in
//   der CLUSTER-Liste von src/lib/telefonassistent-copy.test.ts.
//
// KEIN interner Link auf die sechs eingefrorenen Experimentrouten. Ein neuer
// Link dorthin würde deren Messung verfälschen; siehe
// src/lib/routing/protectedExperiments.ts. Deshalb verweist diese Seite bei
// Kostenfragen bewusst NICHT auf die Preisseite.
// ─────────────────────────────────────────────────────────────────────────────
import { Link } from "react-router-dom";

import { PageSEO } from "@/components/PageSEO";
import { RedaktionelleVerantwortung, REDAKTION } from "@/components/RedaktionelleVerantwortung";
import { BUSINESS_INFO } from "@/lib/seo-data";
import { canonicalFor } from "@/lib/routing/publicRoutes";
import { FAKTEN, GRENZEN } from "@/lib/telefonassistent-copy";

/**
 * Die beiden Grenzen, die auf dieser Seite wiederholt werden, stammen woertlich
 * aus GRENZEN.points — derselben Quelle, aus der /praxen und die Produktseite
 * sie beziehen. Nachgetippt waeren sie eine zweite Fassung derselben Zusage in
 * einem medizinnahen Kontext, und die beiden Fassungen wuerden auseinander
 * laufen, sobald eine davon praezisiert wird. Der Index ist bewusst benannt
 * statt hartkodiert kommentarlos: faellt ein Punkt weg, faellt der Build auf.
 */
const GRENZEN_TRIAGE = GRENZEN.points.find((p) => p.startsWith("Keine medizinische Einschätzung"));
const GRENZEN_NOTFALL = GRENZEN.points.find((p) => p.startsWith("Notfälle werden erkannt"));
if (!GRENZEN_TRIAGE || !GRENZEN_NOTFALL) {
  throw new Error(
    "GRENZEN.points hat die Triage- oder Notfall-Zusage verloren oder umformuliert. " +
      "Diese Seite zitiert sie woertlich; bitte hier nachziehen statt neu zu formulieren."
  );
}

const PFAD = "/ki-telefonassistent-einfuehren";
const CANONICAL = canonicalFor(PFAD);

const VEROEFFENTLICHT = "2026-08-29";
const AKTUALISIERT = "2026-08-29";

/**
 * Prüfkategorien vor der Freigabe.
 *
 * [[CLAIM: verify — dass in genau diesen vier Gruppen geprüft wird, ist eine
 * Aussage über das eigene Vorgehen. Sie ist aus der internen Projektvorlage
 * abgeleitet und vom Inhaber zu bestätigen. Die einzelnen Beispiele sind
 * Fallkategorien, keine Zusagen über Ergebnisse.]]
 */
const PRUEFGRUPPEN: Array<{ titel: string; text: string; beispiele: string[] }> = [
  {
    titel: "Die normalen Abläufe",
    text: "Der Anteil, an den jeder zuerst denkt – und der am schnellsten für erledigt gehalten wird. Interessant sind hier nicht die geglückten Fälle, sondern die Ränder.",
    beispiele: [
      "Es ist kein Termin frei",
      "Der gewünschte Termin wird während des Gesprächs vergeben",
      "Ein Termin soll verschoben oder abgesagt werden",
      "Dieselbe Person ruft zweimal an",
      "Die Verbindung zum System bricht mitten im Gespräch ab",
      "Die Weiterleitung an einen Menschen gelingt nicht",
    ],
  },
  {
    titel: "Verwechslung und Zugriff",
    text: "Die Gruppe, die in einer Praxis am schwersten wiegt und beim Testen am leichtesten untergeht: Wer bekommt am Telefon welche Auskunft?",
    beispiele: [
      "Ein falsches Geburtsdatum wird abgewiesen",
      "Zwei Personen tragen denselben Namen",
      "Die angezeigte Rufnummer stimmt nicht mit der Person überein",
      "Es wird nach Daten einer anderen Person gefragt",
      "Jemand versucht, den Assistenten durch Anweisungen im Gespräch umzusteuern",
    ],
  },
  {
    titel: "Deutsch am Telefon, nicht im Labor",
    text: "Sprachqualität entscheidet sich nicht an gut ausgesprochenen Beispielsätzen, sondern an dem, was in Ihrer Anmeldung tatsächlich ankommt.",
    beispiele: [
      "Schwierige Nachnamen und Straßennamen",
      "Geburtsdaten, gesprochen statt buchstabiert",
      "Ältere Anrufende und langsames Sprechtempo",
      "Ausgeprägter Dialekt oder Akzent",
      "Hintergrundgeräusche, Unterbrechungen, längeres Schweigen",
    ],
  },
  {
    titel: "Wenn es ernst wird",
    text: "Die Gruppe, an der eine Einführung scheitern muss, wenn sie nicht sitzt. Ein Assistent, der hier nicht sauber aussteigt, gehört nicht ans Telefon einer Praxis.",
    beispiele: [
      "Eine medizinische Frage wird nicht beantwortet, sondern abgegeben",
      "Um eine Einschätzung wird gebeten – und sie wird verweigert",
      "Ein Notfall wird erkannt und sofort weitergeleitet",
      "Jemand ist verwirrt oder erkennbar in einer belastenden Lage",
      "Jemand möchte ausdrücklich mit einem Menschen sprechen",
    ],
  },
];

/**
 * Beobachtungspunkte der ersten Betriebswoche.
 *
 * [[CLAIM: verify — abgeleitet aus der internen Projektvorlage. Bestätigung des
 * Inhabers ausstehend; formuliert als Beobachtungspunkte, nicht als zugesagter
 * Leistungsumfang.]]
 */
const ERSTE_WOCHE: string[] = [
  "Abgebrochene Gespräche und die Stelle, an der sie abbrechen",
  "Anliegen, die der Assistent nicht zuordnen konnte",
  "Wie oft an einen Menschen weitergeleitet wurde – und warum",
  "Verzögerungen, die im Gespräch spürbar sind",
  "Einträge, mit denen Ihr Team im Alltag nichts anfangen kann",
  "Rückmeldungen aus der Anmeldung, gesammelt statt nebenbei",
];

const FAQ: Array<{ question: string; answer: string }> = [
  {
    question: "Wie lange dauert die Einführung eines KI-Telefonassistenten?",
    answer:
      "Das hängt an drei Dingen, die bei Ihnen liegen: wie schnell die Liste der Anrufanlässe steht, wie schnell entschieden ist, welche Anliegen immer zu einem Menschen gehören, und wie lange Sie prüfen wollen. Die Einrichtungsarbeit selbst ist der kürzeste Teil. Wer Ihnen eine Gesamtdauer nennt, ohne diese drei Punkte zu kennen, schätzt.",
  },
  {
    question: "Muss unser Praxisverwaltungssystem angebunden werden?",
    answer: FAKTEN.keineAnbindung,
  },
  {
    question: "Übernimmt der Assistent eine Ersteinschätzung am Telefon?",
    answer:
      `Nein. ${GRENZEN_TRIAGE} ${GRENZEN_NOTFALL} Dass diese Fälle sauber aussteigen, gehört zu den Punkten, die vor der Freigabe geprüft werden.`,
  },
  {
    question: "Merken Anrufende, dass sie mit einem KI-System sprechen?",
    answer: FAKTEN.art50,
  },
  {
    question: "Was ist, wenn das Team nicht mitzieht?",
    answer:
      "Dann tragen Sie die Einführung nicht. Lassen Sie die Anmeldung deshalb selbst testen, bevor irgendetwas live geht, und hängen Sie die Freigabe nicht allein an die Praxisleitung. Wer den Assistenten täglich neben sich hat, muss vorher gesagt haben, dass die Regeln stimmen.",
  },
];

export function KiTelefonassistentEinfuehren() {
  /**
   * Article statt WebPage-only: Das ist ein Fachbeitrag mit benannter
   * Verantwortung. `author` ist dieselbe Person wie im sichtbaren Kasten —
   * eine Auszeichnung, die vom sichtbaren Text abweicht, wäre irreführend.
   */
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${CANONICAL}#article`,
    headline: "Einen KI-Telefonassistenten in der Praxis einführen",
    description:
      "Vorgehen, Prüfkategorien und Freigabe bei der Einführung eines KI-Telefonassistenten in einer Praxis.",
    // Das reguläre OG-Bild der Website (public/og-image.png) — ein real
    // vorhandenes Asset, kein Stockfoto und kein Platzhalter.
    image: `${BUSINESS_INFO.website}/og-image.png`,
    datePublished: VEROEFFENTLICHT,
    dateModified: AKTUALISIERT,
    inLanguage: "de-DE",
    author: {
      "@type": "Person",
      name: REDAKTION.name,
      jobTitle: REDAKTION.schemaJobTitle,
      worksFor: {
        "@type": "Organization",
        "@id": `${BUSINESS_INFO.website}/#organization`,
        name: BUSINESS_INFO.name,
      },
    },
    publisher: {
      "@type": "Organization",
      "@id": `${BUSINESS_INFO.website}/#organization`,
      name: BUSINESS_INFO.name,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${CANONICAL}#webpage` },
  };

  return (
    <div className="bg-white dark:bg-gray-950">
      <PageSEO
        title="KI-Telefonassistent in der Praxis einführen | Cogniiq"
        description="Wie eine Praxis einen KI-Telefonassistenten einführt: welche Anrufe infrage kommen, wie die Übergabe geklärt wird und was vor der Freigabe geprüft gehört."
        canonical={CANONICAL}
        breadcrumbs={[
          { name: "Startseite", url: BUSINESS_INFO.website },
          { name: "KI Telefonassistent", url: canonicalFor("/ki-telefonassistent") },
          { name: "In der Praxis einführen", url: CANONICAL },
        ]}
        faqItems={FAQ}
        additionalSchema={articleSchema}
      />

      <nav aria-label="Breadcrumb" className="max-w-3xl mx-auto px-6 lg:px-8 pt-10">
        <ol className="flex flex-wrap gap-2 text-[15px] text-gray-500 dark:text-gray-500">
          <li>
            <Link to="/" className="underline underline-offset-4 hover:no-underline">
              Startseite
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              to="/ki-telefonassistent"
              className="underline underline-offset-4 hover:no-underline"
            >
              KI Telefonassistent
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-gray-700 dark:text-gray-300">
            In der Praxis einführen
          </li>
        </ol>
      </nav>

      {/* ── Einstieg: direkte Antwort oben ─────────────────────────────────── */}
      <header className="max-w-3xl mx-auto px-6 lg:px-8 pt-10 pb-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15]">
          Einen KI-Telefonassistenten in der Praxis einführen
        </h1>
        <p className="text-[19px] text-gray-700 dark:text-gray-300 leading-[1.7] mt-8">
          Vier Fragen entscheiden über die Einführung: Welche Anrufe kommen überhaupt
          infrage, wo landet das Ergebnis eines Gesprächs, was passiert, wenn es ernst wird,
          und wer in Ihrem Haus gibt frei. Dieser Beitrag beschreibt, wie wir diese Fragen
          angehen und was vor einer Freigabe geprüft gehört.
        </p>
        <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7] mt-5">
          Er ist für Praxen geschrieben, die vor der Entscheidung stehen, und als Maßstab,
          um Angebote zu vergleichen. Was hier steht, gilt unabhängig davon, mit wem Sie
          arbeiten.
        </p>
        <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7] mt-5">
          Es geht um die Entscheidungen, die bei Ihnen liegen. Wie die Einrichtung auf
          unserer Seite abläuft, steht im Abschnitt{" "}
          <Link
            to="/ki-telefonassistent#einrichtung"
            className="underline underline-offset-4 hover:no-underline"
          >
            Einrichtung auf der Produktseite
          </Link>
          .
        </p>
      </header>

      {/* ── Warum Einführungen scheitern ───────────────────────────────────── */}
      <section className="py-14" aria-labelledby="scheitern-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2
            id="scheitern-heading"
            className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-6"
          >
            Woran Einführungen in der Praxis scheitern
          </h2>
          <div className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] space-y-5">
            <p>
              Drei Muster begegnen uns immer wieder, wenn eine Einführung nicht hält. Es
              ist unsere Beobachtung, keine Erhebung – prüfen Sie sie an Ihrem eigenen
              Alltag. Das erste Muster hat keinen technischen Grund. Der Assistent nimmt Anrufe
              an, das Ergebnis steht sauber da – und Ihre MFA überträgt es anschließend von
              Hand. Die Arbeit ist dann nicht verschwunden, sie ist umgezogen. Nach ein paar
              Wochen fragt jemand, wozu das gut sein soll, und die Umleitung wird wieder
              abgeschaltet.
            </p>
            <p>
              Das zweite Muster ist die Trennlinie. Wo nicht vorher festgelegt wurde, welche
              Anliegen immer zu einem Menschen gehören, entscheidet das im Zweifel ein
              System – und das fällt genau bei den Anrufen auf, bei denen es nicht auffallen
              darf.
            </p>
            <p>
              Das dritte Muster ist die Betreuung nach dem Start. Ansagen und Regeln ändern
              sich nach dem Urlaub, nach einer neuen Sprechzeit, nach der ersten Woche im
              Betrieb. Wer nach dem Go-live niemanden hat, der diese Änderungen einpflegt,
              betreibt mit der Zeit ein System, das die Praxis von gestern abbildet – und
              schaltet es irgendwann ab.
            </p>
            <p>
              Dass Betreuung dabei schwer wiegt, ist für ein Nachbarfeld erhoben: Unter
              den wechselwilligen
              Teilnehmenden des Zi-PVS-Monitorings 2025 nannten 52,1&nbsp;% mangelnden
              Kundensupport als einen ausschlaggebenden Grund für einen möglichen
              PVS-Wechsel
              <span className="text-gray-500 dark:text-gray-500">
                {" "}
                (Zi, PVS-Monitoring 2025 / Zi-Paper 32/2026)
              </span>
              . Die Erhebung betrifft Praxisverwaltungssysteme, nicht Telefonassistenten,
              und ihre Bezugsgröße sind die wechselwilligen Befragten – nicht alle Praxen.
              Übertragbar ist daraus nichts als die Richtung: Software scheitert in einer
              Praxis selten allein an ihren Funktionen.
            </p>
            <p>
              Alle drei Muster haben gemeinsam, dass sie vor dem Start entschieden werden
              und nach dem Start teuer sind. Dass Bedarf an Entlastung besteht, ist für die
              Versorgung insgesamt erhoben: 39&nbsp;% der Befragten bewerteten die
              Erreichbarkeit medizinischer Versorgung außerhalb der üblichen
              Praxisöffnungszeiten – etwa abends oder am Wochenende – als schwierig
              <span className="text-gray-500 dark:text-gray-500">
                {" "}
                (GKV-Spitzenverband, GKV-Versichertenbefragung 2025, n&nbsp;=&nbsp;3.520)
              </span>
              . Das ist eine Aussage über die Versorgung insgesamt, nicht über die
              Erreichbarkeit einer einzelnen Praxis. Die Frage ist deshalb nicht, ob eine
              Praxis Entlastung am Telefon braucht, sondern ob die Einführung so angelegt
              wird, dass sie hält.
            </p>
          </div>
        </div>
      </section>

      {/* ── Trennlinie ─────────────────────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="trennlinie-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2
            id="trennlinie-heading"
            className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-6"
          >
            Die Trennlinie ziehen
          </h2>
          <div className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] space-y-5">
            <p>
              Diese Entscheidung gehört der Praxis, nicht dem Anbieter. Wir schlagen dafür
              drei Prüffragen je Anrufanlass vor. Nur wenn alle drei mit Ja beantwortet
              werden, kommt der Anlass überhaupt für eine Übernahme in Frage.
            </p>
            <ol className="space-y-3 list-decimal pl-6">
              <li>
                Ist das Anliegen <strong className="font-semibold">eindeutig benennbar</strong>,
                ohne dass jemand die Lage beurteilen muss?
              </li>
              <li>
                Kommt man mit <strong className="font-semibold">festen Angaben</strong> aus –
                Name, Rückrufnummer, Terminwunsch – ohne freie Auskunft?
              </li>
              <li>
                Ist ein Fehler an dieser Stelle{" "}
                <strong className="font-semibold">folgenlos korrigierbar</strong>, solange er
                am selben Tag auffällt?
              </li>
            </ol>
            <p>
              Anliegen, bei denen eine der drei Fragen mit Nein beantwortet wird, gehören
              auf die Liste „immer an einen Menschen“. Diese Liste ist der wichtigste
              Bestandteil der Einrichtung – und der einzige, den niemand außerhalb Ihrer
              Praxis für Sie ausfüllen kann.
            </p>
            <p>
              Alles, was mit Beschwerden, Befunden, Medikation oder der Einschätzung von
              Beschwerden zu tun hat, gehört unabhängig von dieser Prüfung auf diese Liste.
              Ein Assistent, der hier verhandelt, ist falsch eingestellt.
            </p>
          </div>
        </div>
      </section>

      {/* ── Übergabe ───────────────────────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="uebergabe-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2
            id="uebergabe-heading"
            className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-6"
          >
            Die Übergabe klären, bevor Sie unterschreiben
          </h2>
          <div className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] space-y-5">
            <p>
              Das ist die Frage, an der sich entscheidet, ob die Einführung Arbeit abnimmt
              oder nur verschiebt. Sie gehört vor die Unterschrift, nicht in die
              Einrichtungsphase.
            </p>
            <p>{FAKTEN.keineAnbindung}</p>
            <p>
              Was Sie unabhängig vom Anbieter fragen sollten – und worauf Sie eine Antwort
              vor der Unterschrift verlangen können:
            </p>
            <ul className="space-y-3 list-disc pl-6">
              <li>Gibt es für unser System überhaupt eine geeignete Schnittstelle?</li>
              <li>Bekommen Sie dafür Zugang, und wer erteilt die Freigabe dazu?</li>
              <li>Welche Vorgänge lässt die Schnittstelle zu – lesen, eintragen, ändern?</li>
              <li>Verlangt jemand dafür Gebühren, und wer trägt sie?</li>
              <li>Und wenn nichts davon trägt: Wie sieht der Weg dann konkret aus?</li>
            </ul>
            <p>
              Eine Antwort, die diese Fragen auf „das schauen wir uns später an“ verschiebt,
              ist die Antwort, aus der später Handarbeit wird.
            </p>
          </div>
        </div>
      </section>

      {/* ── Diagramm: der Weg eines Anrufs ─────────────────────────────────── */}
      <section className="py-14" aria-labelledby="weg-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2
            id="weg-heading"
            className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-6"
          >
            Der Weg eines Anrufs und seine zwei Ausstiege
          </h2>
          <p className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] mb-8">
            Vier Stationen, und an zwei Stellen ein Ausstieg zum Menschen. Wer die beiden
            Ausstiege nicht festlegt, hat die Einführung nicht zu Ende gedacht.
          </p>

          {/*
            Diagramm als Liste, nicht als Bild: So ist es vorgerendert lesbar,
            skaliert auf schmalen Geräten, funktioniert ohne JavaScript und
            bleibt für Screenreader eine geordnete Abfolge. Die Pfeile sind
            dekorativ und werden ausgeblendet.
          */}
          <ol className="space-y-0">
            {[
              {
                titel: "Anruf",
                text: "Jemand ruft Ihre gewohnte Nummer an. Für die anrufende Person ändert sich nichts.",
              },
              {
                titel: "Umleitung",
                text: FAKTEN.rufumleitung,
              },
              {
                titel: "Gespräch",
                text: "Der Assistent gibt sich als KI-System zu erkennen, nimmt das Anliegen auf und folgt Ihren Regeln. Ausstieg 1: Notfallanzeichen oder der Wunsch nach einem Menschen führen sofort zur Weiterleitung.",
              },
              {
                titel: "Ergebnis",
                text: "Anliegen, Name, Rückrufnummer und Terminwunsch stehen strukturiert bereit. Ausstieg 2: Was der Assistent nicht zuordnen kann, geht als offener Fall an Ihr Team statt geraten zu werden.",
              },
            ].map((station, index, alle) => (
              <li key={station.titel}>
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                  <p className="text-[15px] uppercase tracking-wide text-gray-500 dark:text-gray-500">
                    Station {index + 1}
                  </p>
                  <p className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mt-1">
                    {station.titel}
                  </p>
                  <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7] mt-2">
                    {station.text}
                  </p>
                </div>
                {index < alle.length - 1 && (
                  <div aria-hidden="true" className="grid place-items-center py-2 text-gray-400">
                    ↓
                  </div>
                )}
              </li>
            ))}
          </ol>

          <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7] mt-8">
            {FAKTEN.keineAufzeichnung}
          </p>
        </div>
      </section>

      {/* ── Prüfkategorien ─────────────────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="pruefen-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2
            id="pruefen-heading"
            className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-6"
          >
            Was vor der Freigabe geprüft gehört
          </h2>
          <div className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] space-y-5 mb-10">
            <p>
              Vor einer Freigabe gehören vier Gruppen von Fällen geprüft. Wir beschreiben
              sie hier, damit eine Praxis denselben Maßstab an jedes Angebot anlegen kann –
              unseres eingeschlossen. Fragen Sie, was ein Anbieter zu jeder der vier Gruppen
              sagen kann.
            </p>
            <p>
              Entscheidend ist dabei nicht die Zahl der Prüfungen, sondern dass die
              schwierigen Fälle darin vorkommen. Ein Ablauf, der nur mit gelungenen
              Gesprächen getestet wurde, ist nicht geprüft.
            </p>
          </div>

          <div className="space-y-6">
            {PRUEFGRUPPEN.map((gruppe) => (
              <div
                key={gruppe.titel}
                className="rounded-xl border border-gray-200 dark:border-gray-800 p-6"
              >
                <h3 className="text-[19px] font-semibold text-gray-900 dark:text-gray-100">
                  {gruppe.titel}
                </h3>
                <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7] mt-2">
                  {gruppe.text}
                </p>
                <ul className="mt-4 space-y-2">
                  {gruppe.beispiele.map((beispiel) => (
                    <li
                      key={beispiel}
                      className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] pl-5 relative"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-[0.7em] w-2 h-px bg-gray-400"
                      />
                      {beispiel}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Freigabe ───────────────────────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="freigabe-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2
            id="freigabe-heading"
            className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-6"
          >
            Wer freigibt, und was freigegeben wird
          </h2>
          <div className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] space-y-5">
            <p>
              Eine Freigabe „durch die Praxis“ ist keine Freigabe. Lassen Sie zuerst die
              Anmeldung testen – die Menschen, die den Assistenten täglich neben sich haben
              –, danach die Leitung. Wer das umdreht, erfährt die Einwände erst im
              laufenden Betrieb.
            </p>
            <p>Freigegeben wird nicht „das System“, sondern einzeln:</p>
            <ul className="space-y-2 list-disc pl-6">
              <li>die hinterlegten Informationen über Ihre Praxis,</li>
              <li>die Terminlogik,</li>
              <li>wie am Telefon die Identität geprüft wird,</li>
              <li>die Weiterleitungsregeln,</li>
              <li>die Notfallregeln,</li>
              <li>Stimme und Tonfall,</li>
              <li>der Hinweis, dass ein KI-System spricht.</li>
            </ul>
            <p>
              Erst wenn diese Punkte einzeln bestätigt sind, wird umgeschaltet. Und bevor
              umgeschaltet wird, wird festgelegt, auf welchem Weg wieder auf den bisherigen
              Ablauf zurückgeschaltet wird. Dieser Weg gehört vorher vereinbart.
            </p>
            <p className="rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              {FAKTEN.freigabeNachUebergabe} {FAKTEN.pruefzeitNeutral}
            </p>
          </div>
        </div>
      </section>

      {/* ── Erste Woche ────────────────────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="woche-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2
            id="woche-heading"
            className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-6"
          >
            Die erste Woche im Betrieb
          </h2>
          <p className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] mb-6">
            In der ersten Woche entscheidet sich, ob nachgeschärft wird oder ob sich
            Ärgernisse festsetzen. Beobachtet wird nicht nach Gefühl, sondern an festen
            Punkten:
          </p>
          <ul className="space-y-3">
            {ERSTE_WOCHE.map((punkt) => (
              <li
                key={punkt}
                className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] pl-5 relative"
              >
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-[0.7em] w-2 h-px bg-gray-400"
                />
                {punkt}
              </li>
            ))}
          </ul>
          <p className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] mt-6">
            {FAKTEN.aenderungen}
          </p>
        </div>
      </section>

      {/* ── Grenzen ────────────────────────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="grenzen-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2
            id="grenzen-heading"
            className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-6"
          >
            Wann eine Einführung nichts bringt
          </h2>
          <div className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] space-y-5">
            <p>
              Zwei Konstellationen, die sich erst bei der Einführung zeigen und in denen
              wir abraten:
            </p>
            <ul className="space-y-3 list-disc pl-6">
              <li>
                Ihre Anrufe bestehen überwiegend aus Anliegen, die eine Beurteilung
                verlangen. Dann bleibt nach der Trennlinie zu wenig übrig, als dass sich der
                Aufwand lohnt.
              </li>
              <li>
                Niemand in Ihrem Haus kann die Regeln verantworten und pflegen. Ein
                Assistent ohne Zuständigen bildet mit der Zeit eine Praxis ab, die es so
                nicht mehr gibt.
              </li>
            </ul>
            <p>
              Die übrigen Fälle, in denen wir von vornherein abraten, stehen gesammelt im
              Abschnitt{" "}
              <Link
                to="/ki-telefonassistent"
                className="underline underline-offset-4 hover:no-underline"
              >
                wann wir nicht die richtige Lösung sind
              </Link>{" "}
              auf der Produktseite.
            </p>
            <p>
              Zur Erwartungshaltung noch ein Wort: Wir nennen bewusst keinen Anteil von
              Anrufen, den ein Assistent übernimmt. Diese Zahl hängt vollständig an Ihrer
              eigenen Trennlinie, und jede allgemeine Angabe dazu wäre geraten.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="faq-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2
            id="faq-heading"
            className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-8"
          >
            Häufige Fragen zur Einführung
          </h2>
          <dl className="space-y-8">
            {FAQ.map((item) => (
              <div key={item.question}>
                <dt className="text-[19px] font-semibold text-gray-900 dark:text-gray-100">
                  {item.question}
                </dt>
                <dd className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] mt-2">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <RedaktionelleVerantwortung
        veroeffentlicht={VEROEFFENTLICHT}
        aktualisiert={AKTUALISIERT}
        grundlage="Beschrieben ist das Vorgehen, das wir für eine Einführung vorsehen, nicht die eingesetzte Technik. Es ist als Maßstab gedacht, an dem Sie ein Angebot prüfen können — auch unseres."
      />

      {/* ── Weiterlesen + ein Abschluss ────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="weiter-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2
            id="weiter-heading"
            className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-6"
          >
            Weiterlesen
          </h2>
          <ul className="space-y-4 text-[17px] leading-[1.7]">
            <li>
              <Link
                to="/ki-telefonassistent"
                className="underline underline-offset-4 hover:no-underline font-semibold text-gray-900 dark:text-gray-100"
              >
                KI-Telefonassistent: Aufbau, Grenzen und Preislogik
              </Link>
              <span className="block text-gray-600 dark:text-gray-400">
                Was der Empfang leistet, wo er aussteigt und wie er abgerechnet wird.
              </span>
            </li>
            <li>
              <Link
                to="/praxen"
                className="underline underline-offset-4 hover:no-underline font-semibold text-gray-900 dark:text-gray-100"
              >
                Der KI-Empfang für Arzt- und Zahnarztpraxen
              </Link>
              <span className="block text-gray-600 dark:text-gray-400">
                Dieselbe Sache aus Sicht einer Praxis, mit den Anliegen Ihres Alltags.
              </span>
            </li>
            <li>
              <Link
                to="/ki-telefonassistent/demo"
                className="underline underline-offset-4 hover:no-underline font-semibold text-gray-900 dark:text-gray-100"
              >
                Den Assistenten im Gespräch erleben
              </Link>
              <span className="block text-gray-600 dark:text-gray-400">
                Ein Termin, in dem wir an Ihren eigenen Anrufanlässen durchgehen, was trägt.
              </span>
            </li>
          </ul>

          <div className="mt-12 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
            <p className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7]">
              Wenn Sie die Trennlinie für Ihre Praxis durchgehen möchten: Wir nehmen Ihre
              Anrufanlässe auf und sagen Ihnen, was davon trägt und was nicht – auch
              dann, wenn die Antwort gegen eine Einführung spricht.
            </p>
            <Link
              to="/kontakt"
              className="inline-block mt-6 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 text-[17px] font-semibold min-h-[44px]"
            >
              Anrufanlässe gemeinsam durchgehen
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
