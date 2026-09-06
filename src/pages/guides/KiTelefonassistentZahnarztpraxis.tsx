// ─────────────────────────────────────────────────────────────────────────────
// Fachbeitrag: KI-Telefonassistent in der Zahnarztpraxis.
//
// Zweiter Beitrag im Cluster neben /ki-telefonassistent-einfuehren. Dort steht
// das allgemeine Vorgehen einer Einführung (Trennlinie, Übergabe, Prüfgruppen,
// Freigabe, erste Woche). Hier steht, was in einer Zahnarztpraxis anders ist:
// welche Anrufanlässe es gibt, welche Regel je Anlass gilt, was während der
// Behandlung mit dem Telefon passiert und wie Absagen geregelt werden. Das
// allgemeine Vorgehen wird verlinkt, nicht wiederholt.
//
// Seitentyp: operativer Fachbeitrag, keine Branchen-Landingpage. Der Abschnitt
// „So sieht das bei Cogniiq aus" ist bewusst kurz, steht hinten und zitiert
// ausschließlich FAKTEN und ANBINDUNG — dieselben Sätze wie /praxen.
//
// Kommerzieller Eigentümer der Praxis-Intention bleibt /praxen. Dieser Beitrag
// verweist dorthin (Breadcrumb, Weiterlesen, Cogniiq-Abschnitt).
//
// Verweist absichtlich NICHT auf die eingefrorenen Experimentrouten des
// Clusters (Arzt-Segmentseite, Preisseite): jeder neue Link dorthin würde deren
// Messung verfälschen; siehe src/lib/routing/protectedExperiments.ts. Die Pfade
// stehen hier auch nicht im Kommentar, weil der Schutz Quelltext-Vorkommen zählt.
//
// Keine Fremdstatistik, keine Anteile, keine Zahlen außer denen aus FAKTEN.
// Die Aussagen über den Praxisalltag sind Beschreibungen, keine Erhebung, und
// sagen das an der Stelle auch.
// ─────────────────────────────────────────────────────────────────────────────
import { Link } from "react-router-dom";

import { PageSEO } from "@/components/PageSEO";
import { RedaktionelleVerantwortung, REDAKTION } from "@/components/RedaktionelleVerantwortung";
import { BUSINESS_INFO } from "@/lib/seo-data";
import { canonicalFor } from "@/lib/routing/publicRoutes";
import { ANBINDUNG, FAKTEN, GRENZEN } from "@/lib/telefonassistent-copy";

/**
 * Die beiden Grenzen stammen wörtlich aus GRENZEN.points — derselben Quelle wie
 * auf /praxen, der Produktseite und im Einführungsleitfaden. Fällt ein Punkt
 * weg oder wird er umformuliert, fällt der Build, statt dass hier eine zweite
 * Fassung derselben Zusage stehen bleibt.
 */
const GRENZEN_TRIAGE = GRENZEN.points.find((p) => p.startsWith("Keine medizinische Einschätzung"));
const GRENZEN_NOTFALL = GRENZEN.points.find((p) => p.startsWith("Notfälle werden erkannt"));
const GRENZEN_NICHT_ALLE = GRENZEN.points.find((p) => p.startsWith("Der Assistent übernimmt nicht alle Anrufe"));
if (!GRENZEN_TRIAGE || !GRENZEN_NOTFALL || !GRENZEN_NICHT_ALLE) {
  throw new Error(
    "GRENZEN.points hat die Triage-, Notfall- oder Umfangs-Zusage verloren oder umformuliert. " +
      "Diese Seite zitiert sie wörtlich; bitte hier nachziehen statt neu zu formulieren."
  );
}

const PFAD = "/ki-telefonassistent-zahnarztpraxis";
const CANONICAL = canonicalFor(PFAD);

const VEROEFFENTLICHT = "2026-09-05";
const AKTUALISIERT = "2026-09-05";

type Regel = "uebernimmt" | "mensch" | "praxis";

const REGEL_LABEL: Record<Regel, string> = {
  uebernimmt: "Übernimmt der Assistent",
  mensch: "Immer ein Mensch",
  praxis: "Entscheidet die Praxis",
};

/**
 * Der Anrufanlass-Katalog der Zahnarztpraxis.
 *
 * Jeder Anlass ist an den drei Prüffragen des Einführungsleitfadens gemessen:
 * eindeutig benennbar, mit festen Angaben zu erledigen, folgenlos korrigierbar.
 * Die Einordnung ist unser Vorschlag als Ausgangspunkt für die Liste der Praxis,
 * kein Ergebnis einer Messung und keine Zusage über Anteile.
 *
 * [[CLAIM: verify — dass genau dieser Katalog der Ausgangspunkt einer Einrichtung
 * in einer Zahnarztpraxis ist, ist eine Aussage über das eigene Vorgehen und vom
 * Inhaber zu bestätigen. Die Zeilen „Übernimmt der Assistent" bleiben innerhalb
 * von ANLIEGEN_UEBERNIMMT; die Zeilen „Immer ein Mensch" innerhalb von
 * ANLIEGEN_IMMER_MENSCH und GRENZEN.]]
 */
const ANLAESSE: Array<{
  anlass: string;
  regel: Regel;
  text: string;
  festlegen: string;
}> = [
  {
    anlass: "Kontroll- oder Prophylaxetermin vereinbaren",
    regel: "uebernimmt",
    text: "Das Anliegen ist eindeutig, die Angaben sind fest: Name, Rückrufnummer, Terminart, Wunschzeitraum. Der Assistent nimmt den Wunsch auf und vergibt nach Ihren Regeln oder legt ihn Ihrem Team zur Bestätigung vor.",
    festlegen:
      "Welche Terminarten der Assistent überhaupt vergeben darf, welche Zeitfenster dafür infrage kommen und ob die Prophylaxe getrennt vom Behandlerkalender geplant wird.",
  },
  {
    anlass: "Termin absagen oder verschieben",
    regel: "uebernimmt",
    text: "Der häufigste Anruf, der an einem besetzten Telefon verloren geht. Der Assistent nimmt die Absage nach Ihren Regeln entgegen; der frei werdende Termin ist für Ihr Team sofort sichtbar.",
    festlegen:
      "Ab wann eine Absage als kurzfristig gilt, welche Absagen Ihr Team zuerst ansehen soll und wer die Nachbesetzung übernimmt. Die Regeln zu Ausfallhonoraren erklärt ein Mensch, nicht der Assistent.",
  },
  {
    anlass: "Rückruf nach einer Recall-Erinnerung",
    regel: "uebernimmt",
    text: "Wer auf eine Erinnerung zur Prophylaxe oder zur Kontrolle antwortet, hat ein klares Anliegen: einen Termin. Für den Assistenten ist das ein Terminwunsch mit Bezug – nicht mehr und nicht weniger.",
    festlegen:
      "Ob Recall-Termine in ein eigenes Zeitfenster fallen und wie der Bezug zur Erinnerung im Ergebnis vermerkt wird. Dieser Beitrag beschreibt die eingehende Seite: Die Erinnerung selbst versendet Ihre Praxis wie bisher.",
  },
  {
    anlass: "Sprechzeiten, Anfahrt, Unterlagen, Bonusheft",
    regel: "uebernimmt",
    text: "Wiederkehrende Fragen mit einer festen Antwort, die Sie einmal hinterlegen: Sprechzeiten, Parkplatz, welche Unterlagen zum ersten Termin mitkommen, ob das Bonusheft mitzubringen ist.",
    festlegen:
      "Den Wortlaut der Antworten – und wer sie nach einem Urlaub oder einer neuen Sprechzeit aktualisiert.",
  },
  {
    anlass: "Schmerzen, Schwellung, abgebrochener Zahn, Nachblutung",
    regel: "mensch",
    text: "Alles, was eine Einschätzung verlangt, bekommt keine. Der Assistent beurteilt nicht, wie dringend es ist. Er erkennt das Anliegen und leitet sofort an Ihr Team weiter oder gibt die Ansage aus, die Sie für diesen Fall festgelegt haben – etwa den Hinweis auf den zahnärztlichen Notdienst.",
    festlegen:
      "Wohin während der Sprechzeit weitergeleitet wird, welche Ansage außerhalb der Sprechzeit gilt und wer diese Ansage vor jedem Wochenende und Feiertag prüft.",
  },
  {
    anlass: "Kosten, Heil- und Kostenplan, Erstattung, Zuzahlung",
    regel: "mensch",
    text: "Fragen zu Kosten sind fast immer individuell und selten mit festen Angaben zu beantworten. Der Assistent nimmt das Anliegen mit Rückrufnummer auf die Rückrufliste; die Auskunft gibt Ihr Team.",
    festlegen: "Wer Rückrufe zu Kosten übernimmt und in welchem Zeitraum sie erfolgen.",
  },
  {
    anlass: "Fragen nach einem Eingriff",
    regel: "mensch",
    text: "Nachsorge, Medikamente, Verhalten nach einer Behandlung: medizinische Fragen jeder Art. Der Assistent gibt keine Auskunft dazu, sondern übergibt.",
    festlegen: "Ob solche Anrufe sofort weitergeleitet oder mit Rückrufwunsch aufgenommen werden – und wer sie am selben Tag bearbeitet.",
  },
  {
    anlass: "Angstpatienten, Kinder, Eltern",
    regel: "praxis",
    text: "Kein Fall für eine allgemeine Regel. Manche Praxen wollen, dass jeder erste Kontakt mit einem Kind oder einem Angstpatienten von einem Menschen geführt wird. Andere lassen den Terminwunsch aufnehmen und rufen zurück.",
    festlegen:
      "Ob diese Anliegen als Chefsache markiert werden und damit immer an einen Menschen gehen – oder als Terminwunsch mit Rückruf.",
  },
  {
    anlass: "Labor, Depot, Vertreter",
    regel: "praxis",
    text: "Anrufe, die nicht von Patientinnen und Patienten kommen. Sie brauchen meistens eine bestimmte Person, keine Terminlogik.",
    festlegen:
      "Ob solche Anrufe auf die Rückrufliste gehen oder zu einer benannten Person durchgestellt werden – und ob es dafür ein eigenes Zeitfenster gibt.",
  },
];

/**
 * Zahnärztliche Prüffälle, die zu den vier Prüfgruppen des Einführungsleitfadens
 * hinzukommen. Die vier Gruppen selbst werden dort beschrieben und hier nicht
 * wiederholt.
 *
 * [[CLAIM: verify — Fallkategorien aus der internen Projektvorlage, als
 * Beispiele formuliert, keine Zusage über Ergebnisse.]]
 */
const PRUEFFAELLE: string[] = [
  "Jemand hat Schmerzen und möchte „heute noch“ kommen – der Assistent gibt keine Einschätzung ab und leitet weiter oder gibt die festgelegte Ansage aus",
  "Eine Frage zum Heil- und Kostenplan – der Assistent verspricht keine Auskunft, sondern nimmt den Rückrufwunsch auf",
  "Eine Absage für einen langen Behandlungstermin am nächsten Morgen – der frei werdende Termin ist sofort sichtbar",
  "Ein Rückruf auf eine Recall-Erinnerung – der Bezug steht im Ergebnis, der Termin liegt im richtigen Zeitfenster",
  "Eine Absage für eine andere Person – der Assistent hält sich an die Regel, die Sie für diesen Fall festgelegt haben",
  "Das Labor ruft an – der Anruf landet dort, wo Sie ihn haben wollen, nicht in der Terminlogik",
  "Jemand meldet sich außerhalb der Sprechzeit mit einer Nachblutung – die Notdienst-Ansage ist aktuell und vollständig",
];

const FAQ: Array<{ question: string; answer: string }> = [
  {
    question: "Kann der Assistent Schmerzpatienten einordnen und passende Termine vergeben?",
    answer: `Nein. ${GRENZEN_TRIAGE} Schmerzen, Schwellungen und Nachblutungen gehen deshalb immer an einen Menschen oder erhalten die Ansage, die Ihre Praxis für diesen Fall festgelegt hat.`,
  },
  {
    question: "Ruft der Assistent Patientinnen und Patienten für den Recall an?",
    answer:
      "Dieser Beitrag beschreibt eingehende Anrufe. Die Recall-Erinnerung versenden Sie wie bisher; wer darauf zurückruft, erreicht den Assistenten mit einem Terminwunsch. Ob ausgehende Anrufe für Ihre Praxis infrage kommen, klären wir im Erstgespräch – zugesagt ist es an dieser Stelle nicht.",
  },
  {
    question: "Was passiert mit einer Absage, während das Team behandelt?",
    answer:
      "Der Assistent nimmt sie nach den Regeln entgegen, die Sie festgelegt haben. Der frei werdende Termin steht sofort im Ergebnis, sodass Ihr Team ihn nachbesetzen kann, sobald es in den Ablauf passt. Die Nachbesetzung entscheidet Ihr Team.",
  },
  {
    question: "Muss unsere Praxissoftware angebunden werden?",
    answer: FAKTEN.keineAnbindung,
  },
  {
    question: "Übernimmt der Assistent dann alle Anrufe der Praxis?",
    answer: `Nein. ${GRENZEN_NICHT_ALLE} Wie groß der Anteil in Ihrer Praxis ist, hängt an Ihrer eigenen Liste der Anrufanlässe – eine allgemeine Zahl dazu wäre geraten.`,
  },
];

export function KiTelefonassistentZahnarztpraxis() {
  /**
   * Article statt WebPage-only: Fachbeitrag mit benannter Verantwortung.
   * `author` ist dieselbe Person wie im sichtbaren Kasten am Ende der Seite.
   */
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${CANONICAL}#article`,
    headline: "KI-Telefonassistent in der Zahnarztpraxis: welche Anrufe er übernimmt und welche nicht",
    description:
      "Anrufanlässe einer Zahnarztpraxis, die Regel je Anlass, der Umgang mit Absagen und Recall-Rückrufen und was vor der Freigabe geprüft gehört.",
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

  const H2 = "text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-6";
  const PROSE = "text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7]";
  const LINK = "underline underline-offset-4 hover:no-underline";

  return (
    <div className="bg-white dark:bg-gray-950">
      <PageSEO
        title="KI-Telefonassistent in der Zahnarztpraxis: Anrufe und Grenzen | Cogniiq"
        description="Welche Anrufe einer Zahnarztpraxis ein KI-Telefonassistent übernimmt, welche beim Team bleiben – und wie Absagen, Recall-Rückrufe und Behandlungszeit geregelt werden."
        canonical={CANONICAL}
        breadcrumbs={[
          { name: "Startseite", url: BUSINESS_INFO.website },
          { name: "Für Praxen", url: canonicalFor("/praxen") },
          { name: "Zahnarztpraxis", url: CANONICAL },
        ]}
        additionalSchema={articleSchema}
      />

      <nav aria-label="Breadcrumb" className="max-w-3xl mx-auto px-6 lg:px-8 pt-10">
        <ol className="flex flex-wrap gap-2 text-[15px] text-gray-500 dark:text-gray-500">
          <li>
            <Link to="/" className={LINK}>
              Startseite
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/praxen" className={LINK}>
              Für Praxen
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-gray-700 dark:text-gray-300">
            Zahnarztpraxis
          </li>
        </ol>
      </nav>

      {/* ── Einstieg: direkte Antwort oben ─────────────────────────────────── */}
      <header className="max-w-3xl mx-auto px-6 lg:px-8 pt-10 pb-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15]">
          KI-Telefonassistent in der Zahnarztpraxis: welche Anrufe er übernimmt und welche
          nicht
        </h1>
        <p className="text-[19px] text-gray-700 dark:text-gray-300 leading-[1.7] mt-8">
          In einer Zahnarztpraxis klingelt das Telefon in die Behandlung hinein. Ein
          Telefonassistent kann dort die Anrufe übernehmen, die ein klares Anliegen und
          feste Angaben haben: Termine, Absagen, Rückrufe auf eine Recall-Erinnerung,
          wiederkehrende Fragen. Alles, was eine Einschätzung verlangt – Schmerzen, Kosten,
          Fragen nach einem Eingriff – bleibt bei Ihrem Team. Dieser Beitrag geht die
          Anrufanlässe einer Zahnarztpraxis einzeln durch und nennt zu jedem die Regel, die
          vorher stehen muss.
        </p>
        <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7] mt-5">
          Er ist für Praxisinhaberinnen und -inhaber und für die Leitung der Anmeldung
          geschrieben und gilt unabhängig davon, mit welchem Anbieter Sie arbeiten. Das
          allgemeine Vorgehen einer Einführung – Trennlinie, Übergabe, Prüfgruppen,
          Freigabe – steht im{" "}
          <Link to="/ki-telefonassistent-einfuehren" className={LINK}>
            Leitfaden zur Einführung in der Praxis
          </Link>
          . Hier steht, was in der Zahnarztpraxis anders ist.
        </p>
      </header>

      {/* ── Was anders ist ─────────────────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="anders-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="anders-heading" className={H2}>
            Warum das Telefon in der Zahnarztpraxis anders klingelt
          </h2>
          <div className={`${PROSE} space-y-5`}>
            <p>
              Vier Dinge unterscheiden die Zahnarztpraxis am Telefon von einer Hausarztpraxis.
              Es sind Beobachtungen, keine Erhebung – prüfen Sie sie an Ihrem eigenen Alltag.
            </p>
            <p>
              <strong className="font-semibold text-gray-900 dark:text-gray-100">
                Die Behandlung bindet Hände.
              </strong>{" "}
              Wer am Stuhl assistiert, kann nicht abnehmen. In vielen Praxen ist die Anmeldung
              deshalb während der Behandlungszeiten dünn besetzt oder gar nicht – und genau
              dann rufen Patientinnen und Patienten an.
            </p>
            <p>
              <strong className="font-semibold text-gray-900 dark:text-gray-100">
                Termine sind lang und teuer.
              </strong>{" "}
              Eine kurzfristige Absage für einen Behandlungsblock reißt eine Lücke, die sich
              nur füllen lässt, wenn die Absage rechtzeitig ankommt. Eine Absage, die in der
              Mailbox liegt, bis jemand sie abhört, ist praktisch keine Absage.
            </p>
            <p>
              <strong className="font-semibold text-gray-900 dark:text-gray-100">
                Der Recall erzeugt Anrufspitzen.
              </strong>{" "}
              Nach einer Erinnerungswelle zur Prophylaxe oder Kontrolle rufen viele in kurzer
              Zeit mit demselben Anliegen an. Das sind die einfachsten Anrufe der Praxis –
              und die, die am häufigsten in der Warteschleife enden.
            </p>
            <p>
              <strong className="font-semibold text-gray-900 dark:text-gray-100">
                Schmerz und Kosten brauchen einen Menschen.
              </strong>{" "}
              Der Schmerzpatient, der „heute noch“ kommen möchte, und die Frage zum Heil- und
              Kostenplan sind die beiden Anrufe, an denen sich zeigt, ob ein Assistent richtig
              eingestellt ist. Beide verlangen eine Einschätzung. Beide bekommen keine.
            </p>
          </div>
        </div>
      </section>

      {/* ── Anrufanlass-Katalog ────────────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="anlaesse-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="anlaesse-heading" className={H2}>
            Die Anrufanlässe der Zahnarztpraxis – und die Regel je Anlass
          </h2>
          <div className={`${PROSE} space-y-5 mb-10`}>
            <p>
              Jeder Anlass ist an den drei Prüffragen des{" "}
              <Link to="/ki-telefonassistent-einfuehren" className={LINK}>
                Einführungsleitfadens
              </Link>{" "}
              gemessen – eindeutig benennbar, mit festen Angaben zu erledigen, folgenlos
              korrigierbar. Nur ein Anlass, der alle drei erfüllt, kommt für eine Übernahme
              infrage.
            </p>
            <p>
              Die Einordnung unten ist unser Vorschlag als Ausgangspunkt. Die Liste, die am
              Ende gilt, schreibt Ihre Praxis – sie ist der wichtigste Bestandteil der
              Einrichtung.
            </p>
          </div>

          <ul className="space-y-5">
            {ANLAESSE.map((a) => (
              <li
                key={a.anlass}
                className="rounded-xl border border-gray-200 dark:border-gray-800 p-6"
              >
                <p className="text-[15px] uppercase tracking-wide text-gray-500 dark:text-gray-500">
                  {REGEL_LABEL[a.regel]}
                </p>
                <h3 className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {a.anlass}
                </h3>
                <p className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] mt-3">
                  {a.text}
                </p>
                <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7] mt-3">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    Vorher festlegen:
                  </span>{" "}
                  {a.festlegen}
                </p>
              </li>
            ))}
          </ul>

          <p className={`${PROSE} mt-8`}>
            Alles, was mit Beschwerden, Befunden, Medikation oder der Einschätzung von
            Beschwerden zu tun hat, gehört unabhängig von dieser Prüfung auf die Liste
            „immer an einen Menschen“. {GRENZEN_NOTFALL}
          </p>
        </div>
      </section>

      {/* ── Behandlungszeit ────────────────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="behandlung-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="behandlung-heading" className={H2}>
            Die Behandlungszeit: wann der Assistent überhaupt ans Telefon geht
          </h2>
          <div className={`${PROSE} space-y-5`}>
            <p>
              Die zweite Entscheidung nach der Liste der Anlässe ist die Zeit. Ein Assistent,
              der jeden Anruf sofort übernimmt, nimmt Ihrem Team auch die Anrufe ab, die es
              gern selbst führt. Drei Muster kommen als Ausgangspunkt infrage; welches passt,
              hängt an Ihrer Besetzung.
            </p>
            <ol className="space-y-3 list-decimal pl-6">
              <li>
                <strong className="font-semibold text-gray-900 dark:text-gray-100">
                  Überlauf.
                </strong>{" "}
                Die Anmeldung nimmt ab, solange sie kann. Erst wenn besetzt ist oder niemand
                abnimmt, übernimmt der Assistent. Das ist der vorsichtigste Einstieg.
              </li>
              <li>
                <strong className="font-semibold text-gray-900 dark:text-gray-100">
                  Behandlungsfenster.
                </strong>{" "}
                In festen Zeiten – etwa während der Behandlungsblöcke am Vormittag – geht der
                Assistent zuerst ans Telefon, außerhalb davon die Anmeldung.
              </li>
              <li>
                <strong className="font-semibold text-gray-900 dark:text-gray-100">
                  Außerhalb der Sprechzeit.
                </strong>{" "}
                Abends, mittags, am Wochenende nimmt der Assistent Terminwünsche und Absagen
                auf; Ihr Team findet sie am nächsten Morgen als Liste vor.
              </li>
            </ol>
            <p>{FAKTEN.rufumleitung}</p>
            <p>{GRENZEN_NICHT_ALLE}</p>
          </div>
        </div>
      </section>

      {/* ── Absagen ────────────────────────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="absagen-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="absagen-heading" className={H2}>
            Absagen und Verschiebungen: die Regeln, die vorher stehen müssen
          </h2>
          <div className={`${PROSE} space-y-5`}>
            <p>
              Die Absage ist der Anruf mit dem größten Hebel in der Zahnarztpraxis – und der
              mit den meisten Regeln. Vier davon gehören vor dem Start festgelegt.
            </p>
            <ul className="space-y-3 list-disc pl-6">
              <li>
                <strong className="font-semibold text-gray-900 dark:text-gray-100">
                  Berechtigung.
                </strong>{" "}
                Eine Absage greift in Ihren Kalender ein. Legen Sie fest, welche Angaben
                dafür abgefragt werden und ob eine Absage für eine andere Person überhaupt
                angenommen wird. Welche Angaben Ihr Assistent abfragen kann und woran sie
                sich prüfen lassen, hängt daran, was die Übergabe in Ihr System hergibt –
                das steht vor dem Angebot fest, nicht danach.
              </li>
              <li>
                <strong className="font-semibold text-gray-900 dark:text-gray-100">
                  Kurzfristigkeit.
                </strong>{" "}
                Ob eine Absage am Vortag sofort ans Team gemeldet wird oder in die Liste
                fällt, ist Ihre Grenze. Sie hängt an der Länge der Termine und daran, wie
                schnell Sie nachbesetzen können.
              </li>
              <li>
                <strong className="font-semibold text-gray-900 dark:text-gray-100">
                  Nachbesetzung.
                </strong>{" "}
                Der Assistent macht den frei gewordenen Termin sichtbar. Wer aus der
                Warteliste nachrückt, entscheidet Ihr Team.
              </li>
              <li>
                <strong className="font-semibold text-gray-900 dark:text-gray-100">
                  Ausfallhonorare.
                </strong>{" "}
                Ob und wie eine Praxis nicht wahrgenommene Termine in Rechnung stellt, ist
                eine Entscheidung mit Erklärungsbedarf. Der Assistent nimmt die Absage an und
                vermerkt den Zeitpunkt; das Gespräch darüber führt ein Mensch.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Prüffälle ──────────────────────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="pruefen-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="pruefen-heading" className={H2}>
            Was vor der Freigabe zusätzlich geprüft gehört
          </h2>
          <div className={`${PROSE} space-y-5 mb-8`}>
            <p>
              Die vier Prüfgruppen – normale Abläufe, Verwechslung und Zugriff, Deutsch am
              Telefon, der Ernstfall – beschreibt der{" "}
              <Link to="/ki-telefonassistent-einfuehren" className={LINK}>
                Leitfaden zur Einführung
              </Link>
              . Für die Zahnarztpraxis kommen Fälle hinzu, die dort nicht vorkommen und an
              denen eine Einführung trotzdem scheitern kann:
            </p>
          </div>
          <ul className="space-y-3">
            {PRUEFFAELLE.map((fall) => (
              <li
                key={fall}
                className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] pl-5 relative"
              >
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-[0.7em] w-2 h-px bg-gray-400"
                />
                {fall}
              </li>
            ))}
          </ul>
          <p className={`${PROSE} mt-8`}>
            Lassen Sie diese Fälle von der Anmeldung testen, bevor die Praxisleitung
            freigibt – die Reihenfolge begründet der Einführungsleitfaden.
          </p>
        </div>
      </section>

      {/* ── Grenzen ────────────────────────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="grenzen-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="grenzen-heading" className={H2}>
            Was der Assistent in der Zahnarztpraxis nicht macht
          </h2>
          <div className={`${PROSE} space-y-5`}>
            <p>{GRENZEN_TRIAGE}</p>
            <ul className="space-y-3 list-disc pl-6">
              <li>
                Er entscheidet nicht, ob ein Schmerzpatient heute noch drankommt. Er erkennt
                das Anliegen und übergibt.
              </li>
              <li>
                Er gibt keine Auskunft zu Kosten, Heil- und Kostenplänen, Erstattungen oder
                Zuzahlungen. Er nimmt den Rückrufwunsch auf.
              </li>
              <li>
                Er beantwortet keine Fragen zur Nachsorge, zu Medikamenten oder zum Verhalten
                nach einer Behandlung.
              </li>
              <li>
                Ausgehende Anrufe – für den Recall oder zur Nachbesetzung – sind nicht
                Gegenstand dieses Beitrags und hier nicht zugesagt.
              </li>
              <li>Er ersetzt keine Anmeldung.</li>
            </ul>
            <p>
              Die übrigen Grenzen, die für jede Praxis gelten, stehen gesammelt im Abschnitt{" "}
              <Link to="/ki-telefonassistent" className={LINK}>
                was unser Empfang nicht macht
              </Link>{" "}
              auf der Produktseite.
            </p>
          </div>
        </div>
      </section>

      {/* ── So sieht das bei Cogniiq aus ───────────────────────────────────── */}
      <section className="py-14" aria-labelledby="cogniiq-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="cogniiq-heading" className={H2}>
            So sieht das bei Cogniiq aus
          </h2>
          <div className={`${PROSE} space-y-5`}>
            <p>
              Der Praxis-Empfang von Cogniiq arbeitet nach der Liste, die Sie mit uns
              festlegen – die Anrufanlässe oben sind der Ausgangspunkt dafür.{" "}
              {ANBINDUNG.heute.absaetze[0]}
            </p>
            <p>{FAKTEN.keineAnbindung}</p>
            <p>{FAKTEN.keineAufzeichnung}</p>
            <p>{FAKTEN.art50}</p>
            <p>
              Was der Empfang für Arzt-, Zahnarzt- und Therapiepraxen leistet, wie er
              eingerichtet wird und was er kostet, steht auf der{" "}
              <Link to="/praxen" className={LINK}>
                Seite für Praxen
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="faq-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="faq-heading" className={`${H2} mb-8`}>
            Häufige Fragen aus Zahnarztpraxen
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
        grundlage="Beschrieben sind die Anrufanlässe und Regeln, die wir als Ausgangspunkt für eine Einrichtung in einer Zahnarztpraxis vorschlagen, nicht die eingesetzte Technik. Die Einordnung ist ein Vorschlag als Maßstab für Ihre eigene Liste – und für jedes Angebot, auch unseres."
      />

      {/* ── Weiterlesen + ein Abschluss ────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="weiter-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="weiter-heading" className={H2}>
            Weiterlesen
          </h2>
          <ul className="space-y-4 text-[17px] leading-[1.7]">
            <li>
              <Link
                to="/praxen"
                className={`${LINK} font-semibold text-gray-900 dark:text-gray-100`}
              >
                Der KI-Empfang für Arzt- und Zahnarztpraxen
              </Link>
              <span className="block text-gray-600 dark:text-gray-400">
                Was der Empfang übernimmt, wie er eingerichtet wird und was er kostet.
              </span>
            </li>
            <li>
              <Link
                to="/ki-telefonassistent-einfuehren"
                className={`${LINK} font-semibold text-gray-900 dark:text-gray-100`}
              >
                Einen KI-Telefonassistenten in der Praxis einführen
              </Link>
              <span className="block text-gray-600 dark:text-gray-400">
                Trennlinie, Übergabe, Prüfgruppen, Freigabe und die erste Woche im Betrieb.
              </span>
            </li>
            <li>
              <Link
                to="/ki-telefonassistent/demo"
                className={`${LINK} font-semibold text-gray-900 dark:text-gray-100`}
              >
                Den Assistenten im Gespräch erleben
              </Link>
              <span className="block text-gray-600 dark:text-gray-400">
                Ein Termin, in dem wir Ihre eigenen Anrufanlässe durchgehen.
              </span>
            </li>
          </ul>

          <div className="mt-12 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
            <p className={PROSE}>
              Wenn Sie die Liste für Ihre Zahnarztpraxis durchgehen möchten: Wir nehmen Ihre
              Anrufanlässe auf und sagen Ihnen, was davon trägt und was nicht – auch dann,
              wenn die Antwort gegen eine Einführung spricht.
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
