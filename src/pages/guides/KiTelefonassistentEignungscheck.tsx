// ─────────────────────────────────────────────────────────────────────────────
// WERKZEUG · „Eignungscheck: Passt ein KI-Telefonassistent zu Ihrem Betrieb?“
//
// Kein Preisrechner (den gibt es, kanonisch, in `TelefonRechner`), keine
// Landingpage für einen Suchbegriff, sondern ein Entscheidungs- und
// Vorbereitungswerkzeug: Der Besucher beantwortet Fragen zu Anrufsituation,
// Anlässen, Team, Systemen und Erwartungen und bekommt je Bereich ein
// begründetes Signal, ein Gesamtbild und eine Vorbereitungsliste für ein
// Erstgespräch — bei uns oder bei jedem anderen Anbieter.
//
// ABGRENZUNG, die beim Bearbeiten erhalten bleiben muss:
// - Die Grenzen-Intention („was ein KI-Telefonassistent nicht kann“) gehört
//   /ki-telefonassistent (docs/seo/ARCHITEKTUR.md §3.1). Der Abschnitt „Wann
//   nicht" hier bleibt deshalb kurz, bezieht sich auf die Regeln des Werkzeugs
//   und verweist für die vollständigen Grenzen auf die Produktseite.
// - Die Einführung als Vorhaben gehört /ki-telefonassistent-einfuehren. Hier
//   steht nur, was das Ergebnis des Checks für eine Einführung bedeutet.
// - Kosten und Tarife gehören /kosten-ki-telefonassistent und dem Rechner.
//   Diese Seite nennt keinen Betrag und keinen Prozentwert.
//
// Bindende Grenzen für jeden Satz auf dieser Seite:
// - Keine Aussage zu Verarbeitungsort, EU-Servern, „DSGVO-konform“ oder
//   Zertifizierung (HONESTY-AUDIT §7.7).
// - Kein Name eines Praxisverwaltungssystems, keine Anbindungszusage
//   (OWNER-INPUT B). Der Stand steht in FAKTEN.keineAnbindung.
// - Keine Aussage zu Störung, Ausfall oder Rückschaltfristen (OWNER-INPUT B9).
// - Kein Anteil automatisierter Anrufe, keine Ersparnis in Prozent oder Euro,
//   keine Fremdstatistik.
// - Keine Kernzahl als Literal — alles aus FAKTEN. Diese Datei steht in der
//   CLUSTER-Liste von src/lib/telefonassistent-copy.test.ts.
//
// KEIN interner Link auf die eingefrorenen Experimentrouten
// (src/lib/routing/protectedExperiments.ts).
// ─────────────────────────────────────────────────────────────────────────────
import { Link } from "react-router-dom";

import { EignungsCheck } from "@/components/EignungsCheck";
import { PageSEO } from "@/components/PageSEO";
import { RedaktionelleVerantwortung, REDAKTION } from "@/components/RedaktionelleVerantwortung";
import { ANLAESSE, GESAMTBILD_TEXT, SCHWELLEN } from "@/lib/eignungscheck";
import { RECHNER_LINK } from "@/lib/rechner-anker";
import { canonicalFor } from "@/lib/routing/publicRoutes";
import { BUSINESS_INFO } from "@/lib/seo-data";
import { FAKTEN } from "@/lib/telefonassistent-copy";

const PFAD = "/ki-telefonassistent-eignungscheck";
const CANONICAL = canonicalFor(PFAD);

const VEROEFFENTLICHT = "2026-09-27";
const AKTUALISIERT = "2026-09-27";

const H2 = "text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2]";
const P = "text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7]";
const P2 = "text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7]";
const LINK = "underline underline-offset-4 hover:no-underline";

/** Fragen, die jeder Anbieter beantworten können muss. Bewusst ohne Cogniiq-Antworten
 *  daneben: Die Liste soll auch dann brauchbar sein, wenn wir nicht im Rennen sind. */
const ANBIETERFRAGEN: Array<{ frage: string; warum: string }> = [
  {
    frage: "Wie und wann gibt sich das System als KI zu erkennen?",
    warum: "Die Transparenzpflicht gilt für alle Anbieter. Wer hier ausweicht, weicht auch anderswo aus.",
  },
  {
    frage: "Welche Anliegen werden im Gespräch abgeschlossen, welche nur erfasst?",
    warum: "„Terminbuchung“ kann heißen: vergeben, oder: als Wunsch notiert. Der Unterschied ist Ihre Arbeit danach.",
  },
  {
    frage: "Was passiert mit einem Anruf, den das System nicht zu Ende bringen darf?",
    warum: "Beschwerden, Notfälle, Fachfragen: Wohin geht der Anruf, auch nachts, und wer merkt es?",
  },
  {
    frage: "Wird aufgezeichnet? Was wird gespeichert, wie lange, und wer hat Zugriff?",
    warum: "Eine Aufnahme ist ein Datensatz, der geschützt, aufbewahrt und gelöscht werden muss.",
  },
  {
    frage: "Wie wird geprüft, ob unsere Terminsoftware angebunden werden kann, und was steht vor dem Vertrag fest?",
    warum: "Eine Anbindungszusage vor der Prüfung ist ein Versprechen ins Blaue.",
  },
  {
    frage: "Wer ändert die Konfiguration, wenn sich Sprechzeiten oder Abläufe ändern, und in welcher Frist?",
    warum: "Ein einmal eingerichtetes und dann sich selbst überlassenes System veraltet mit dem ersten Urlaubsplan.",
  },
  {
    frage: "Wie wird vor der Freigabe getestet, und wer entscheidet über den Start?",
    warum: "Getestet gehören die Ränder: kein Termin frei, zweiter Anruf derselben Person, Verbindung bricht ab.",
  },
  {
    frage: "Was ist gedeckelt, was kommt dazu, und was steht erst nach der Prüfung fest?",
    warum: "Ein Monatspreis ohne Angabe, was darüber liegt, ist kein Preis.",
  },
];

const FAQ: Array<{ question: string; answer: string }> = [
  {
    question: "Warum gibt der Check keinen Prozentwert oder Score aus?",
    answer:
      "Weil es dafür keine Grundlage gäbe. Eine Zahl wie „78 % Eignung“ sähe präzise aus und wäre erfunden. Der Check gibt je Bereich ein Signal mit Begründung und daraus ein Gesamtbild nach einer Regel, die auf dieser Seite steht.",
  },
  {
    question: "Gilt der Check nur für Arztpraxen?",
    answer:
      "Nein. Die Fragen sind für jeden Betrieb mit eingehenden Anrufen formuliert. Die Beispiele stammen aus Praxen, weil dort Anrufspitzen, Rückrufwünsche und Gesundheitsdaten zusammenkommen; die Trennlinie zwischen Routine und Mensch gilt in einer Kanzlei oder einem Handwerksbetrieb genauso.",
  },
  {
    question: "Was passiert mit meinen Angaben?",
    answer:
      "Sie bleiben in Ihrem Browser. Es gibt keinen Server, an den sie übertragen werden, und keine Speicherung. Gemeldet wird nur, dass der Check genutzt wurde, und auch das nur, wenn Sie der Reichweitenmessung zugestimmt haben.",
  },
  {
    question: "Warum rechnet der Check keine Ersparnis aus?",
    answer:
      "Weil das ein anderes Werkzeug ist. Ob sich ein Assistent rechnet, hängt an Ihrem Aufkommen, Ihren Personalkosten und den Anrufen, die Sie heute nicht erreichen. Das rechnet der Preis- und Wirtschaftlichkeitsrechner auf der Produktseite mit Ihren Zahlen; der Check sagt vorher, ob die Rechnung überhaupt lohnt.",
  },
];

export function KiTelefonassistentEignungscheck() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${CANONICAL}#article`,
    headline: "Eignungscheck: Passt ein KI-Telefonassistent zu Ihrem Betrieb?",
    description:
      "Interaktiver Eignungs- und Vorbereitungscheck für einen KI-Telefonassistenten: Anrufsituation, Anlässe, Team, Systeme, Erwartungen. Mit Methodik, Grenzen und Fragen an jeden Anbieter.",
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

  const routine = ANLAESSE.filter((a) => a.klasse === "routine");
  const mensch = ANLAESSE.filter((a) => a.klasse === "mensch");

  return (
    <div className="bg-white dark:bg-gray-950">
      <PageSEO
        title="KI-Telefonassistent Eignungscheck: Passt er zu Ihrem Betrieb? | Cogniiq"
        description="In fünf Schritten prüfen, ob ein KI-Telefonassistent zu Ihrem Betrieb passt: Anrufsituation, Anrufanlässe, Team, Systeme, Erwartungen. Ohne Anmeldung, mit offengelegter Methodik und Vorbereitungsliste."
        canonical={CANONICAL}
        breadcrumbs={[
          { name: "Startseite", url: BUSINESS_INFO.website },
          { name: "KI Telefonassistent", url: canonicalFor("/ki-telefonassistent") },
          { name: "Eignungscheck", url: CANONICAL },
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
            <Link to="/ki-telefonassistent" className={LINK}>
              KI Telefonassistent
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-gray-700 dark:text-gray-300">
            Eignungscheck
          </li>
        </ol>
      </nav>

      {/* ── Einstieg ───────────────────────────────────────────────────────── */}
      <header className="max-w-3xl mx-auto px-6 lg:px-8 pt-10 pb-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15]">
          Eignungscheck: Passt ein KI-Telefonassistent zu Ihrem Betrieb?
        </h1>
        <p className={`text-[19px] ${P} mt-8`}>
          Fünf Schritte, ein paar Minuten, keine Anmeldung. Sie beantworten Fragen zu Ihrer
          Anrufsituation, Ihren Anrufanlässen, Ihrem Team, Ihren Systemen und Ihren Erwartungen.
          Das Werkzeug sagt Ihnen je Bereich, ob die Voraussetzung trägt, offen ist oder nicht
          hält, und was Sie vor einem Erstgespräch klären sollten.
        </p>
        <p className={`${P2} mt-5`}>
          Es rechnet bewusst keine Ersparnis und vergibt keinen Score. Es beantwortet die Frage,
          die vor jeder Rechnung steht: Gibt es bei Ihnen ein Problem, das ein Telefonassistent
          löst, und stehen die Voraussetzungen dafür. Die Regeln, nach denen das Ergebnis
          entsteht, stehen unter dem Werkzeug.
        </p>
        <p className={`${P2} mt-5`}>
          Das Ergebnis ist als Vorbereitung gedacht, für ein Gespräch mit uns oder mit jedem
          anderen Anbieter. Deshalb endet die Seite mit den Fragen, die Sie jedem stellen sollten.
        </p>
      </header>

      {/* ── Das Werkzeug ───────────────────────────────────────────────────── */}
      <section className="py-10" aria-labelledby="check-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="check-heading" className={`${H2} mb-6`}>
            Der Check
          </h2>
          <EignungsCheck quelle={CANONICAL} />
        </div>
      </section>

      {/* ── Methodik ───────────────────────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="methodik-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="methodik-heading" className={`${H2} mb-6`}>
            So entsteht das Ergebnis
          </h2>
          <p className={P}>
            Das Werkzeug prüft fünf Bereiche und vergibt je Bereich eines von drei Signalen.
            Es gibt keine Punktzahl und keine Gewichtung zwischen den Bereichen, weil beides eine
            Genauigkeit vortäuschen würde, die es nicht gibt.
          </p>

          <h3 className="text-[21px] font-semibold text-gray-900 dark:text-gray-100 mt-10 mb-3">
            Die fünf Bereiche
          </h3>
          <dl className="space-y-5">
            <div>
              <dt className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">
                Anrufsituation
              </dt>
              <dd className={`${P2} mt-1`}>
                Ob heute Anrufe verloren gehen. Gehen kaum welche verloren und liegt das
                Aufkommen unter {SCHWELLEN.geringesAufkommenProWoche} Anrufen pro Woche, hält der
                Bereich nicht: Dann fehlt das Problem, das ein Assistent löst. Gehen kaum welche
                verloren bei höherem Aufkommen, ist das Ziel Entlastung, nicht Erreichbarkeit,
                und der Bereich bleibt offen. Wissen Sie es nicht, bleibt er offen, bis Sie eine
                Woche gezählt haben.
              </dd>
            </div>
            <div>
              <dt className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">
                Anrufanlässe
              </dt>
              <dd className={`${P2} mt-1`}>
                Vier Anlässe kann ein Assistent im Gespräch erledigen oder strukturiert erfassen
                ({routine.map((a) => a.label.toLowerCase()).join(", ")}). Vier bleiben immer bei
                einem Menschen ({mensch.map((a) => a.label.toLowerCase()).join(", ")}). Gezählt
                werden nur die ersten vier: „häufig“ zählt {SCHWELLEN.gewicht.haeufig},
                „gelegentlich“ {SCHWELLEN.gewicht.gelegentlich}, „selten“ und „nie“ zählen
                nicht. Ab {SCHWELLEN.routineTraegtAb} trägt der Bereich, bei 0 hält er nicht,
                dazwischen ist er offen.
              </dd>
            </div>
            <div>
              <dt className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">
                Team und Übergabe
              </dt>
              <dd className={`${P2} mt-1`}>
                Ob ein Mensch übernehmen kann, ob sich Terminregeln aufschreiben lassen und ob
                jemand freigibt. Dieser Bereich hält immer, er ist höchstens offen: Jede Lücke
                ist eine Vorbereitung, kein Ausschlussgrund. Die Terminregeln werden nur gefragt,
                wenn Termine bei Ihnen überhaupt vorkommen.
              </dd>
            </div>
            <div>
              <dt className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">
                Systeme und Daten
              </dt>
              <dd className={`${P2} mt-1`}>
                Wie Termine verwaltet werden und ob Gesundheitsdaten oder Berufsgeheimnisse
                anfallen. Auch dieser Bereich hält immer, er ist offen, sobald eine Prüfung
                aussteht: die der Schnittstelle oder die Ihrer Datenschutzbeauftragten. Er trägt
                nur dann ohne offenen Punkt, wenn Termine ohne Software laufen und keine
                Gesundheitsdaten anfallen.
              </dd>
            </div>
            <div>
              <dt className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">
                Erwartungen
              </dt>
              <dd className={`${P2} mt-1`}>
                Fünf Erwartungen sind Ausschlussgründe: Telefonie ganz ohne Team, ein
                KI-System, das sich nicht zu erkennen gibt, eine Anbindungszusage vor der Prüfung,
                der Wortlaut von Gesprächen und fachliche Auskünfte durch das System. Jede
                einzelne davon führt zum Abraten.
              </dd>
            </div>
          </dl>

          <h3 className="text-[21px] font-semibold text-gray-900 dark:text-gray-100 mt-10 mb-3">
            Die Regel für das Gesamtbild
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[15px] text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th scope="col" className="py-2 pr-4 font-semibold text-gray-900 dark:text-gray-100">
                    Wenn
                  </th>
                  <th scope="col" className="py-2 font-semibold text-gray-900 dark:text-gray-100">
                    Dann
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2.5 pr-4 align-top">Mindestens ein Bereich hält nicht</td>
                  <td className="py-2.5 align-top">{GESAMTBILD_TEXT.abraten.titel}</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2.5 pr-4 align-top">
                    Kein Bereich hält nicht, aber {SCHWELLEN.offenAbKlaeren} oder mehr sind offen
                  </td>
                  <td className="py-2.5 align-top">{GESAMTBILD_TEXT["erst-klaeren"].titel}</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2.5 pr-4 align-top">Ein oder zwei Bereiche sind offen</td>
                  <td className="py-2.5 align-top">{GESAMTBILD_TEXT["offene-punkte"].titel}</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 align-top">Alle fünf Bereiche tragen</td>
                  <td className="py-2.5 align-top">{GESAMTBILD_TEXT.geeignet.titel}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={`${P2} mt-5`}>
            Solange eine Pflichtangabe fehlt, gibt es kein Gesamtbild, auch kein vorläufiges. Ein
            Urteil aus unvollständigen Angaben wäre kein vorsichtiges Urteil, sondern ein
            falsches.
          </p>

          <h3 className="text-[21px] font-semibold text-gray-900 dark:text-gray-100 mt-10 mb-3">
            Die eine Rechnung
          </h3>
          <p className={P2}>
            Aus Ihren Anrufen pro Woche und der Gesprächsdauer entstehen Anrufe und
            Gesprächsminuten je Monat. Die einzige Annahme dabei sind{" "}
            {String(SCHWELLEN.wochenProMonat).replace(".", ",")} Wochen je Monat, dieselbe
            Umrechnung, mit der auch der{" "}
            <Link to={RECHNER_LINK} className={LINK}>
              Preis- und Wirtschaftlichkeitsrechner
            </Link>{" "}
            arbeitet. Die Minuten sind die Größe, die dort den Tarif bestimmt; Sie können sie
            direkt übernehmen.
          </p>
        </div>
      </section>

      {/* ── Grenzen des Werkzeugs ──────────────────────────────────────────── */}
      <section className="py-14 bg-gray-50 dark:bg-gray-900/40" aria-labelledby="grenzen-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="grenzen-heading" className={`${H2} mb-6`}>
            Was der Check nicht leistet
          </h2>
          <ul className="space-y-4">
            {[
              "Er rechnet mit Ihren Schätzungen. Eine Woche Strichliste am Telefon ist genauer als jede Angabe aus dem Gedächtnis, und sie ist der erste Punkt auf jeder Vorbereitungsliste, in der die Zahl fehlt.",
              "Er kennt keine Branchendurchschnitte und nennt keine. Es gibt keinen Wert, der für „eine typische Praxis“ oder „ein typisches Handwerksunternehmen“ stünde und Ihre Zählung ersetzen könnte.",
              "Er beziffert keinen Nutzen. Zeitersparnis, gewonnene Anrufe und Kosten sind eine eigene Rechnung mit eigenen Eingaben; sie steht auf der Produktseite und ist bewusst nicht hier verdoppelt.",
              "Er ersetzt keine rechtliche oder datenschutzrechtliche Prüfung. Ob eine Datenschutz-Folgenabschätzung nötig ist, entscheidet Ihre Datenschutzbeauftragte oder Ihr Datenschutzbeauftragter, nicht ein Werkzeug auf einer Anbieterseite.",
              "Zwei der fünf Ausschlussgründe sind unsere: keine Aufzeichnung und keine verborgene KI. Ein anderer Anbieter mag beides anders halten. Der Check sagt dann, dass wir nicht passen, nicht, dass niemand passt.",
              "Er prüft nicht, ob Ihre Terminsoftware angebunden werden kann. Das steht erst nach einer technischen Prüfung fest, und jede Aussage davor wäre geraten.",
            ].map((satz) => (
              <li key={satz} className={`${P} flex gap-3`}>
                <span aria-hidden="true" className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                <span>{satz}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Wann nicht ─────────────────────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="wann-nicht-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="wann-nicht-heading" className={`${H2} mb-6`}>
            Wann der Check abrät
          </h2>
          <p className={P}>
            Die Konstellationen, in denen das Werkzeug zum Abraten kommt, sind dieselben, die wir
            auch im Erstgespräch nennen würden:
          </p>
          <ul className="mt-6 space-y-4">
            {[
              "Ihr Aufkommen ist gering und Ihr Team gut erreichbar. Ein System ohne Problem ist nur ein Kostenpunkt.",
              "Ihre Anrufe bestehen fast nur aus Beschwerden, Fachfragen, Notfällen und Einzelfallentscheidungen. Davon übernimmt ein Assistent nichts; er könnte nur weiterleiten, und das kann eine Ansage auch.",
              "Sie erwarten, dass die Telefonie ohne Ihr Team läuft. Ein Assistent entlastet zu Stoßzeiten und außerhalb der Öffnungszeiten; er ersetzt keine Anmeldung und keine fachliche Entscheidung.",
              "Sie brauchen die Anbindungszusage vor der Prüfung, den Wortlaut der Gespräche oder ein System, das sich nicht als KI zu erkennen gibt.",
            ].map((satz) => (
              <li key={satz} className={`${P} flex gap-3`}>
                <span aria-hidden="true" className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                <span>{satz}</span>
              </li>
            ))}
          </ul>
          <p className={`${P2} mt-6`}>
            Die vollständigen Grenzen unseres Empfangs, auch die, die kein Ausschlussgrund sind,
            stehen auf der{" "}
            <Link to="/ki-telefonassistent" className={LINK}>
              Produktseite des KI-Telefonassistenten
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── Einführung ─────────────────────────────────────────────────────── */}
      <section className="py-14 bg-gray-50 dark:bg-gray-900/40" aria-labelledby="einfuehrung-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="einfuehrung-heading" className={`${H2} mb-6`}>
            Was das Ergebnis für eine Einführung bedeutet
          </h2>
          <p className={P}>
            Die Vorbereitungsliste des Checks ist die Liste der Entscheidungen, die bei Ihnen
            liegen. Vier davon kommen fast immer vor:
          </p>
          <dl className="mt-6 space-y-5">
            <div>
              <dt className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">
                Der Anliegen-Katalog
              </dt>
              <dd className={`${P2} mt-1`}>
                Welche Anlässe der Assistent erledigt, welche er nur erfasst und welche immer zu
                einem Menschen gehen. Der Check liefert dafür den Rohentwurf: die Anlässe, die Sie
                als häufig oder gelegentlich markiert haben, mit ihrer Klasse.
              </dd>
            </div>
            <div>
              <dt className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">
                Der Rückweg zum Menschen
              </dt>
              <dd className={`${P2} mt-1`}>
                Wohin ein Anruf geht, den der Assistent nicht zu Ende bringen darf, zu jeder Zeit,
                zu der Anrufe kommen. Dass ein Rückweg vereinbart wird, ist Teil jeder Einrichtung;
                wie er bei Ihnen aussieht, entscheiden Sie.
              </dd>
            </div>
            <div>
              <dt className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">
                Die Terminregeln
              </dt>
              <dd className={`${P2} mt-1`}>
                Welche Termine, welche Zeiten, welche Ausnahmen, wer bestätigt. Ohne diese Regeln
                kann ein Assistent Termine nicht vergeben, nur den Wunsch vorlegen. Das ist ein
                legitimer Anfang, aber ein anderer Umfang.
              </dd>
            </div>
            <div>
              <dt className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">
                Die Systemfrage
              </dt>
              <dd className={`${P2} mt-1`}>{FAKTEN.keineAnbindung}</dd>
            </div>
          </dl>
          <p className={`${P2} mt-6`}>
            Wie eine Einführung als Vorhaben abläuft, welche Ränder vor der Freigabe getestet
            gehören und wer bei Ihnen freigibt, steht im Beitrag{" "}
            <Link to="/ki-telefonassistent-einfuehren" className={LINK}>
              Einen KI-Telefonassistenten in der Praxis einführen
            </Link>
            . Was ein Assistent kostet und wie die Tarife gedeckelt sind, steht auf der{" "}
            <Link to="/kosten-ki-telefonassistent" className={LINK}>
              Kostenseite
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── Datenfluss ─────────────────────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="daten-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="daten-heading" className={`${H2} mb-6`}>
            Welche Daten am Telefon entstehen
          </h2>
          <p className={P}>
            Unabhängig vom Anbieter entstehen in jedem Gespräch dieselben Daten: das Anliegen,
            der Name der anrufenden Person, eine Rückrufnummer und, soweit genannt, ein
            Terminwunsch. Dazu kommt, was der Anbieter zusätzlich festhält. Drei Fragen
            entscheiden über den Datenfluss: Wird das Gespräch aufgezeichnet? Werden die Daten
            zum Training von Modellen verwendet? Erfährt die anrufende Person, dass sie mit einem
            KI-System spricht?
          </p>
          <div className="mt-8 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
            <p className="text-[15px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Unsere Antworten
            </p>
            <ul className="mt-4 space-y-4">
              {[
                FAKTEN.keineAufzeichnung,
                FAKTEN.keinTraining,
                "Der Assistent gibt sich zu Beginn jedes Anrufs als KI-System zu erkennen (Art. 50 KI-Verordnung). Abschalten lässt sich das nicht.",
              ].map((satz) => (
                <li key={satz} className={`${P} flex gap-3`}>
                  <span aria-hidden="true" className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-gray-900 dark:bg-gray-100" />
                  <span>{satz}</span>
                </li>
              ))}
            </ul>
            <p className={`${P2} mt-6`}>
              Was wir hier nicht behaupten: Aussagen zum Verarbeitungsort, zu Zertifizierungen
              oder eine pauschale Konformitätszusage. Was dazu belegt ist, steht auf der Seite{" "}
              <Link to="/datenschutz-sicherheit" className={LINK}>
                Datenschutz und Sicherheit
              </Link>
              ; was dort nicht steht, ist nicht belegt.
            </p>
          </div>
          <p className={`${P2} mt-6`}>
            Fallen bei Ihnen Gesundheitsdaten oder Berufsgeheimnisse an, gehört Ihre
            Datenschutzbeauftragte oder Ihr Datenschutzbeauftragter vor dem ersten Angebot an
            den Tisch. Die Frage, ob eine Datenschutz-Folgenabschätzung nötig ist, wird dort
            beantwortet; ein Anbieter kann die Unterlagen dafür zuliefern, die Entscheidung nicht
            abnehmen.
          </p>
        </div>
      </section>

      {/* ── Fragen an jeden Anbieter ───────────────────────────────────────── */}
      <section className="py-14 bg-gray-50 dark:bg-gray-900/40" aria-labelledby="fragen-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="fragen-heading" className={`${H2} mb-3`}>
            Acht Fragen an jeden Anbieter
          </h2>
          <p className={`${P2} mb-8`}>
            Ohne unsere Antworten daneben. Die Liste soll auch dann brauchbar sein, wenn wir nicht
            im Rennen sind.
          </p>
          <ol className="space-y-6">
            {ANBIETERFRAGEN.map((f, i) => (
              <li key={f.frage} className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[14px] font-bold flex items-center justify-center tabular-nums">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 leading-[1.5]">
                    {f.frage}
                  </p>
                  <p className={`${P2} mt-1`}>{f.warum}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="faq-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="faq-heading" className={`${H2} mb-8`}>
            Häufige Fragen zum Check
          </h2>
          <dl className="space-y-8">
            {FAQ.map((f) => (
              <div key={f.question}>
                <dt className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 leading-[1.4]">
                  {f.question}
                </dt>
                <dd className={`${P} mt-2`}>{f.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <RedaktionelleVerantwortung
        veroeffentlicht={VEROEFFENTLICHT}
        aktualisiert={AKTUALISIERT}
        grundlage="Die Fragen und Trennlinien des Checks stammen aus den Erstgesprächen und Einführungen, die wir führen; die Regeln sind auf dieser Seite vollständig offengelegt. Er ist als Maßstab gedacht, an dem Sie ein Angebot prüfen können, auch unseres."
      />

      {/* ── Weiterlesen ────────────────────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="weiter-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="weiter-heading" className={`${H2} mb-6`}>
            Weiterlesen
          </h2>
          <ul className="space-y-4 text-[17px] leading-[1.7]">
            <li>
              <Link
                to="/ki-telefonassistent"
                className={`${LINK} font-semibold text-gray-900 dark:text-gray-100`}
              >
                KI-Telefonassistent: Aufbau, Grenzen und Preislogik
              </Link>
              <span className="block text-gray-600 dark:text-gray-400">
                Was der Empfang leistet, wo er aussteigt und wie er abgerechnet wird.
              </span>
            </li>
            <li>
              <Link
                to="/kosten-ki-telefonassistent"
                className={`${LINK} font-semibold text-gray-900 dark:text-gray-100`}
              >
                Was ein KI-Telefonassistent kostet
              </Link>
              <span className="block text-gray-600 dark:text-gray-400">
                Tarife, Minutenkontingente, Obergrenzen und was erst nach der Prüfung feststeht.
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
                Welche Anrufe infrage kommen, wie die Übergabe geklärt wird und was vor der
                Freigabe geprüft gehört.
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
                Ein Termin, in dem wir an Ihren eigenen Anrufanlässen durchgehen, was trägt.
              </span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
