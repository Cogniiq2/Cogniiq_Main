// ─────────────────────────────────────────────────────────────────────────────
// Segmentseite: KI-Telefonassistent für Arztpraxen (/ki-telefonassistent-arzt).
//
// Bis zum 2026-10-23 war diese Route ein eingefrorenes Suchexperiment und lief
// über die Branchenvorlage `NationalIndustryPage`: eine kompakte Einstiegsseite,
// die ihre Substanz per sechs „mehr dazu"-Verweisen an /praxen abgab, mit
// Chips und Zwischentiteln, die wortgleich auf der Hotel- und Restaurantseite
// standen. Für die volumenstärkste kommerzielle Query-Familie der Domain
// („ki telefonassistent arztpraxis", „telefonassistent arzt") war das die
// falsche Form: Google fand die URL, aber auf ihr stand wenig, was eine
// Arztpraxis nicht auch auf drei anderen Seiten der Domain lesen konnte.
//
// Diese Fassung ist eigenständig. Sie beantwortet, was in einer Hausarzt- oder
// Facharztpraxis am Telefon anders ist als in jeder anderen Branche: welche
// Anrufanlässe anfallen (Akuttermin, Rezept, Überweisung, Befund, AU), welche
// davon der Assistent zu Ende führt, welche er immer übergibt, wie die
// Trennlinie zwischen Routine und Einschätzung gezogen wird und was die
// Anbindung an die Praxissoftware voraussetzt.
//
// Eigentümerfrage im Praxis-Cluster (F3, entschieden 2026-10-23):
//   /praxen                              → Hub aller Praxisformen, Produktkette
//   /ki-telefonassistent-arzt (hier)     → Arzt- und Facharztpraxis
//   /ki-telefonassistent-zahnarztpraxis  → Zahnarztpraxis (Fachbeitrag)
//   /ki-telefonassistent-praxis          → Therapiepraxen
//
// Jede Zahl stammt aus FAKTEN; jede Produktgrenze aus GRENZEN; die
// Anbindungsaussage aus ANBINDUNG. Keine Fremdstatistik außer den beiden
// freigegebenen (GKV-Spitzenverband 2025). Die Aussagen über den Praxisalltag
// sind Beschreibungen, keine Erhebung, und sagen das an der Stelle auch.
// ─────────────────────────────────────────────────────────────────────────────
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";

import { PageSEO } from "@/components/PageSEO";
import { RechnerCta } from "@/components/RechnerCta";
import { BUSINESS_INFO } from "@/lib/seo-data";
import { canonicalFor } from "@/lib/routing/publicRoutes";
import {
  ANBINDUNG,
  BETREUUNG,
  DATENSCHUTZ_PUNKTE,
  FAKTEN,
  GRENZEN,
  TEAM_BLOCK,
  EINRICHTUNG,
} from "@/lib/telefonassistent-copy";

const PFAD = "/ki-telefonassistent-arzt";
const CANONICAL = canonicalFor(PFAD);

/**
 * Die drei Grenzen, die auf dieser Seite wörtlich zitiert werden, stammen aus
 * GRENZEN.points — derselben Quelle wie /praxen und die Zahnarzt-Seite. Fällt
 * ein Punkt weg oder wird er umformuliert, fällt der Build, statt dass hier eine
 * zweite Fassung derselben Zusage stehen bleibt.
 */
const GRENZEN_TRIAGE = GRENZEN.points.find((p) => p.startsWith("Keine medizinische Einschätzung"));
const GRENZEN_NOTFALL = GRENZEN.points.find((p) => p.startsWith("Hinweise auf einen Notfall"));
const GRENZEN_NICHT_ALLE = GRENZEN.points.find((p) => p.startsWith("Der Assistent übernimmt nicht alle Anrufe"));
if (!GRENZEN_TRIAGE || !GRENZEN_NOTFALL || !GRENZEN_NICHT_ALLE) {
  throw new Error(
    "GRENZEN.points hat die Triage-, Notfall- oder Umfangs-Zusage verloren oder umformuliert. " +
      "Diese Seite zitiert sie wörtlich; bitte hier nachziehen statt neu zu formulieren."
  );
}

type Regel = "erledigt" | "team" | "mensch" | "praxis";

const REGEL_LABEL: Record<Regel, string> = {
  erledigt: "Erledigt der Assistent im Gespräch",
  team: "Nimmt der Assistent auf, entscheidet Ihr Team",
  mensch: "Immer ein Mensch",
  praxis: "Legt Ihre Praxis fest",
};

/**
 * Der Anrufanlass-Katalog der Arztpraxis.
 *
 * Die Einordnung ist unser Vorschlag als Ausgangspunkt für die Liste der
 * Praxis — kein Messergebnis und keine Zusage über Anteile. „Erledigt" setzt
 * voraus, dass der Ablauf freigegeben ist und, wo er in die Praxissoftware
 * schreibt, die Anbindung vorher geprüft wurde (ANBINDUNG). „Immer ein Mensch"
 * folgt GRENZEN und ANLIEGEN_IMMER_MENSCH.
 */
const ANLAESSE: Array<{ anlass: string; regel: Regel; text: string; festlegen: string }> = [
  {
    anlass: "Routinetermin vereinbaren, verschieben oder absagen",
    regel: "erledigt",
    text: "Vorsorge, Kontrolle, Impfung, Blutabnahme, Nachkontrolle: Anliegen mit festen Angaben – Terminart, Wunschzeitraum, Name, Rückrufnummer. Der Assistent vergibt den Termin nach Ihren Regeln oder legt ihn Ihrem Team zur Bestätigung vor. Eine Absage ist mit dem Auflegen erledigt, der frei gewordene Termin sofort wieder vergebbar.",
    festlegen:
      "Welche Terminarten der Assistent überhaupt vergeben darf, in welchen Zeitfenstern, und ob Neupatientinnen und Neupatienten anders behandelt werden als Bestandspatienten.",
  },
  {
    anlass: "Akuttermin – „ich müsste heute noch kommen“",
    regel: "mensch",
    text: "Der Satz, an dem sich zeigt, ob ein Assistent richtig eingestellt ist. Er verlangt eine Einschätzung, und die gibt der Assistent nicht. Er erkennt das Anliegen und leitet sofort an Ihr Team weiter – oder gibt außerhalb der Sprechzeit die Ansage aus, die Sie für diesen Fall festgelegt haben.",
    festlegen:
      "Wohin während der Sprechstunde weitergeleitet wird, welche Ansage außerhalb gilt – etwa der Hinweis auf den ärztlichen Bereitschaftsdienst – und wer diese Ansage vor Wochenenden und Feiertagen prüft.",
  },
  {
    anlass: "Wiederholungsrezept bestellen",
    regel: "team",
    text: "Der häufigste Anruf, der nicht in die Behandlung gehört und trotzdem die Anmeldung bindet. Der Assistent nimmt die Bestellung strukturiert auf – wer bestellt, welches Medikament, Abholung oder Versand – und legt sie Ihrem Team vor. Ob und was verordnet wird, entscheidet die Ärztin oder der Arzt; der Assistent sagt dazu nichts zu.",
    festlegen:
      "Welche Angaben für eine Bestellung reichen, ab wann das Rezept abholbereit ist und wie der Assistent das formuliert – ohne eine Zusage, die Ihre Praxis nicht halten kann.",
  },
  {
    anlass: "Überweisung oder Folgeverordnung anfragen",
    regel: "team",
    text: "Fachärztliche Überweisung, Heilmittelverordnung, Hilfsmittel: Der Anruf ist klar, die Entscheidung ist medizinisch. Der Assistent nimmt das Anliegen mit Rückrufnummer auf und stellt es Ihrem Team zur Bearbeitung – als Vorgang, nicht als Mailbox-Nachricht, die jemand abhören muss.",
    festlegen: "Wer Überweisungswünsche sichtet, in welchem Zeitraum die Rückmeldung erfolgt und wie der Assistent das dem Anrufer sagt.",
  },
  {
    anlass: "Krankschreibung oder Folgebescheinigung",
    regel: "team",
    text: "Ob eine Arbeitsunfähigkeit bescheinigt oder verlängert wird, ist eine ärztliche Entscheidung. Der Assistent nimmt den Wunsch auf und übergibt ihn – er stellt nichts aus und stellt nichts in Aussicht.",
    festlegen:
      "Ob solche Anrufe als Rückrufwunsch aufgenommen oder sofort an die Anmeldung weitergeleitet werden, und wie Ihre Praxis mit Anfragen zur telefonischen Krankschreibung umgeht.",
  },
  {
    anlass: "Befund, Laborwerte, Medikation",
    regel: "mensch",
    text: "Auskünfte zu Befunden und Laborwerten unterliegen der Schweigepflicht und brauchen eine medizinische Einordnung. Der Assistent gibt keine Auskunft dazu – auch nicht „ist alles in Ordnung“. Er nimmt den Rückrufwunsch auf oder leitet weiter.",
    festlegen: "Wer Befundrückrufe übernimmt und wie der Anrufer erfährt, wann er mit dem Rückruf rechnen kann.",
  },
  {
    anlass: "Sprechzeiten, Vertretung, Anfahrt, Unterlagen",
    regel: "erledigt",
    text: "Wiederkehrende Fragen mit einer Antwort, die Sie einmal hinterlegen: Sprechzeiten, Urlaubsvertretung, Parkplatz, Chipkarte und Überweisungsschein zum ersten Termin. Der Assistent beantwortet sie direkt – auch dann, wenn die Anmeldung gerade besetzt ist.",
    festlegen: `Den Wortlaut der Antworten – und wer ihn nach einem Urlaub oder einer neuen Sprechzeit anpasst. ${FAKTEN.aenderungen}`,
  },
  {
    anlass: "Hausbesuch anfragen",
    regel: "praxis",
    text: "Ob ein Hausbesuch infrage kommt, entscheidet die Praxis von Fall zu Fall. Manche Praxen wollen jeden dieser Anrufe sofort bei einem Menschen; andere lassen das Anliegen mit Adresse und Rückrufnummer aufnehmen und rufen zurück.",
    festlegen: "Ob Hausbesuchswünsche als Chefsache immer an einen Menschen gehen oder als Rückrufwunsch aufgenommen werden.",
  },
  {
    anlass: "Apotheke, Labor, Pharmareferent, Krankenkasse",
    regel: "praxis",
    text: "Anrufe, die nicht von Patientinnen und Patienten kommen und meistens eine bestimmte Person brauchen, keine Terminlogik.",
    festlegen: "Ob solche Anrufe zu einer benannten Person durchgestellt werden, auf die Rückrufliste gehen oder ein eigenes Zeitfenster bekommen.",
  },
];

const FAQ: Array<{ question: string; answer: string }> = [
  {
    question: "Was macht ein KI-Telefonassistent in der Arztpraxis konkret?",
    answer:
      "Er nimmt Anrufe an, die Ihre Anmeldung gerade nicht annehmen kann, und führt die freigegebenen Routineabläufe im Gespräch zu Ende: Routinetermine vergeben, verschieben und absagen, wiederkehrende Fragen zu Sprechzeiten und Vertretung beantworten. Rezept- und Überweisungswünsche nimmt er strukturiert auf und legt sie Ihrem Team vor. Alles, was eine medizinische Einschätzung verlangt, geht an einen Menschen.",
  },
  {
    question: "Erkennt der Assistent Notfälle – und was passiert dann?",
    answer: `${GRENZEN_NOTFALL} Welcher Weg in Ihrer Praxis gilt – Durchstellen an die Anmeldung, Hinweis auf den ärztlichen Bereitschaftsdienst, Ansage mit der Notrufnummer –, legen Sie bei der Einrichtung fest, einschließlich der genauen Formulierungen.`,
  },
  {
    question: "Bucht der Assistent Termine direkt in unsere Praxissoftware?",
    answer: `${FAKTEN.keineAnbindung} Das Ergebnis dieser Prüfung steht im Angebot – auch wenn es negativ ausfällt. Trägt die Anbindung nicht, wird der Termin im Gespräch nach Ihren Regeln vergeben und steht Ihrem Team als fertiger Vorgang bereit.`,
  },
  {
    question: "Nimmt der Assistent Rezeptbestellungen an?",
    answer:
      "Ja, als strukturierte Bestellung: wer bestellt, welches Medikament, Abholung oder Versand. Ob verordnet wird, entscheidet die Ärztin oder der Arzt – der Assistent sagt kein Rezept zu und nennt keinen Abholtermin, den Ihre Praxis nicht bestätigt hat.",
  },
  {
    question: "Kommen ältere Patientinnen und Patienten mit einer Computerstimme zurecht?",
    answer:
      "Nicht alle sofort, und das nehmen wir ernst. Sie wählen die Stimme, formulieren Ihren Begrüßungssatz und legen fest, wie Ihre Praxis am Telefon spricht. Der Assistent sagt im ersten Satz, dass ein KI-System spricht, und wer lieber mit einem Menschen sprechen möchte, wird nach Ihrer Regel weitergeleitet oder auf die Rückrufliste gesetzt – niemand wird in ein Menü gezwungen.",
  },
  {
    question: "Wie steht es um Schweigepflicht und Datenschutz?",
    answer: `${DATENSCHUTZ_PUNKTE.slice(0, 5).map((p) => p.replace(/\.$/, "")).join(". ")}. Ob Ihre Praxis eine Datenschutz-Folgenabschätzung braucht, entscheidet Ihr Datenschutzbeauftragter – wir liefern die Unterlagen zu.`,
  },
];

const H2 =
  "text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-6 before:block before:w-8 before:h-1 before:rounded-full before:bg-pub-accent dark:before:bg-blue-400 before:mb-4";
const PROSE = "text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7]";
const LINK = "text-pub-accent-ink underline underline-offset-4 decoration-pub-accent-line hover:no-underline";
const STRONG = "font-semibold text-gray-900 dark:text-gray-100";
const SECTION = "py-14";
const SECTION_ALT = "py-14 bg-gray-50 dark:bg-gray-900/40";

export function KiTelefonassistentArzt() {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${CANONICAL}#service`,
    name: "KI-Telefonassistent für Arztpraxen",
    serviceType: "KI-Telefonassistent",
    description:
      "KI-Telefonassistent für Arztpraxen: nimmt Patientenanrufe an, vergibt, verschiebt und storniert Routinetermine im Gespräch nach den Regeln der Praxis, nimmt Rezept- und Überweisungswünsche strukturiert auf und übergibt alles, was eine medizinische Einschätzung verlangt, an einen Menschen. Keine Gesprächsaufzeichnung.",
    url: CANONICAL,
    provider: { "@id": `${BUSINESS_INFO.website}/#organization` },
    areaServed: { "@type": "Country", name: "Deutschland" },
    audience: { "@type": "Audience", audienceType: "Arztpraxen, Facharztpraxen, MVZ" },
    inLanguage: "de-DE",
  };

  return (
    <div className="bg-white dark:bg-gray-950">
      <PageSEO
        title="KI-Telefonassistent Arztpraxis: Anrufe erledigen | Cogniiq"
        description="KI-Telefonassistent für Arztpraxen: Termine im Gespräch vergeben, verschieben, absagen; Rezept- und Überweisungswünsche strukturiert ans Team. Keine Triage."
        canonical={CANONICAL}
        breadcrumbs={[
          { name: "Startseite", url: BUSINESS_INFO.website },
          { name: "Für Praxen", url: canonicalFor("/praxen") },
          { name: "Arztpraxis", url: CANONICAL },
        ]}
        faqItems={FAQ}
        additionalSchema={serviceSchema}
      />

      {/* ── Einstieg ───────────────────────────────────────────────────────── */}
      <header className="pt-32 pb-16">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[14px] text-gray-500 dark:text-gray-500 mb-10"
          >
            <Link to="/" className="hover:text-pub-accent dark:hover:text-blue-400 transition-colors">
              Startseite
            </Link>
            <ChevronRight size={13} aria-hidden="true" />
            <Link to="/praxen" className="hover:text-pub-accent dark:hover:text-blue-400 transition-colors">
              Für Praxen
            </Link>
            <ChevronRight size={13} aria-hidden="true" />
            <span className="text-gray-700 dark:text-gray-300" aria-current="page">
              Arztpraxis
            </span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-[1.12] tracking-tight">
            KI-Telefonassistent für Arztpraxen: Anrufe erledigen, nicht notieren
          </h1>
          <p className="text-[19px] text-gray-700 dark:text-gray-300 leading-[1.7] mt-8">
            Montagmorgen, kurz nach acht. Am Tresen steht eine Patientin, dahinter wartet
            die nächste, und das Telefon klingelt ohne Pause. Ihre MFA entscheidet im
            Sekundentakt, wer warten muss – und jemand verliert immer. Der
            KI-Telefonassistent von Cogniiq nimmt in diesen Momenten die Anrufe an, die sonst
            ins Leere laufen, und führt die Routine zu Ende: Routinetermine vergeben,
            verschieben, absagen; Fragen zu Sprechzeiten und Vertretung beantworten.
          </p>
          <p className={`${PROSE} mt-5`}>
            Was eine medizinische Einschätzung verlangt – der Akuttermin, der Befund, die
            Krankschreibung –, erreicht Ihr Team: sofort durchgestellt oder als strukturierter
            Vorgang mit Anliegen und Rückrufnummer. Der Assistent beurteilt nichts, bescheinigt
            nichts und verordnet nichts. Diese Seite geht die Anrufanlässe einer Arztpraxis
            einzeln durch und nennt zu jedem die Regel, die vorher stehen muss.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-9">
            <Link
              to="/kontakt"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-pub-signal text-white hover:bg-pub-signal-ink px-6 py-3.5 text-[16px] font-semibold min-h-[44px]"
            >
              Unverbindliches Erstgespräch vereinbaren
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              to="/kosten-ki-telefonassistent"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 px-6 py-3.5 text-[16px] font-semibold text-gray-900 dark:text-gray-100 min-h-[44px] hover:border-pub-signal/45 hover:text-pub-signal-ink transition-colors"
            >
              Was es für eine Praxis kostet
            </Link>
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 mt-7 text-[15px] text-gray-600 dark:text-gray-400 [&>li]:inline-flex [&>li]:items-center [&>li]:gap-2 [&>li]:before:content-[''] [&>li]:before:w-1.5 [&>li]:before:h-1.5 [&>li]:before:rounded-full [&>li]:before:bg-pub-accent dark:[&>li]:before:bg-blue-400">
            <li>Übergabe in {FAKTEN.einrichtungsfrist}</li>
            <li>Keine Gesprächsaufzeichnung</li>
            <li>{FAKTEN.abrechnungKurz}</li>
            <li>Abrechnung pro Praxis, nicht pro Behandler</li>
          </ul>
        </div>
      </header>

      {/*
        Die Patientensicht (Erreichbarkeit aus Sicht der Anrufer, GKV-Zahl)
        steht einmal auf dem Hub /praxen und wird hier nicht wiederholt —
        zwei identische Abschnitte auf zwei Seiten derselben Familie waren ein
        Befund des Reviews vom 23.10.2026. Diese Seite beginnt mit dem, was an
        der Arztpraxis anders ist.
      */}

      {/* ── Was anders ist ─────────────────────────────────────────────────── */}
      <section className={SECTION} aria-labelledby="anders-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="anders-heading" className={H2}>
            Warum das Telefon in der Arztpraxis anders klingelt
          </h2>
          <div className={`${PROSE} space-y-5`}>
            <p>
              Vier Dinge unterscheiden die Hausarzt- oder Facharztpraxis am Telefon von anderen
              Betrieben. Es sind Beobachtungen aus Einrichtungen, keine Erhebung – prüfen Sie sie
              an Ihrem eigenen Alltag.
            </p>
            <p>
              <span className={STRONG}>Ein großer Teil der Anrufe ist keine Terminfrage.</span> Rezept,
              Überweisung, Krankschreibung, Befund: Anliegen, die medizinisch entschieden werden
              und trotzdem die Anmeldung binden, weil jemand sie entgegennehmen, notieren und
              weitergeben muss. Ein Assistent, der nur Termine kann, löst in der Arztpraxis nur
              einen Teil des Problems.
            </p>
            <p>
              <span className={STRONG}>Die Dringlichkeit entscheidet ein Mensch.</span> „Ich müsste
              heute noch kommen“ ist in der Zahnarztpraxis ein Schmerzpatient, in der Hausarztpraxis
              alles von der Erkältung bis zum Notfall. Die Trennlinie zwischen Routine und
              Einschätzung ist in der Arztpraxis die wichtigste Regel der Einrichtung – und sie
              muss vor dem Start stehen.
            </p>
            <p>
              <span className={STRONG}>Die Sprechstunde hat Spitzen.</span> Montagmorgen, nach den
              Ferien, in der Infektwelle: Dann ruft die ganze Praxis gleichzeitig an, und die
              Anmeldung entscheidet im Sekundentakt. Genau dort ist Entlastung realistisch –
              nicht die vollständige Übernahme Ihrer Telefonie.
            </p>
            <p>
              <span className={STRONG}>Die Schweigepflicht gilt am Telefon.</span> Befundauskünfte,
              Laborwerte, Medikation: Was eine Praxis am Telefon sagen darf und wem, ist geregelt.
              Ein Assistent darf hier nicht „hilfsbereit“ sein. Er gibt keine Auskunft und
              übergibt.
            </p>
          </div>
        </div>
      </section>

      {/* ── Anrufanlass-Katalog ────────────────────────────────────────────── */}
      <section className={SECTION_ALT} aria-labelledby="anlaesse-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="anlaesse-heading" className={H2}>
            Welche Anrufe in der Arztpraxis anfallen – und was mit jedem passiert
          </h2>
          <div className={`${PROSE} space-y-5 mb-10`}>
            <p>
              Vier Wege, und die Zuordnung treffen Sie, nicht wir: Ein Anlass wird im Gespräch
              erledigt, er wird aufgenommen und Ihrem Team vorgelegt, er geht immer an einen
              Menschen, oder Ihre Praxis entscheidet von Fall zu Fall. Die Einordnung unten ist
              unser Vorschlag als Ausgangspunkt. Die Liste, die am Ende gilt, schreibt Ihre
              Praxis – sie ist der wichtigste Teil der Einrichtung.
            </p>
          </div>

          <ul className="space-y-5">
            {ANLAESSE.map((a) => (
              <li
                key={a.anlass}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6"
              >
                <p className="text-[14px] uppercase tracking-wide text-pub-accent-ink dark:text-blue-300">
                  {REGEL_LABEL[a.regel]}
                </p>
                <h3 className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {a.anlass}
                </h3>
                <p className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] mt-3">{a.text}</p>
                <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7] mt-3">
                  <span className={STRONG}>Vorher festlegen:</span> {a.festlegen}
                </p>
              </li>
            ))}
          </ul>

          <p className={`${PROSE} mt-8`}>
            Alles, was mit Beschwerden, Befunden, Medikation oder der Einschätzung von Beschwerden zu
            tun hat, gehört unabhängig von dieser Liste auf „immer an einen Menschen“. {GRENZEN_NOTFALL}
          </p>
        </div>
      </section>

      {/* ── Trennlinie Akut / Routine ──────────────────────────────────────── */}
      <section className={SECTION} aria-labelledby="trennlinie-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="trennlinie-heading" className={H2}>
            Akut oder Routine: die Trennlinie, die vor dem Start stehen muss
          </h2>
          <div className={`${PROSE} space-y-5`}>
            <p>{GRENZEN_TRIAGE}</p>
            <p>
              Das klingt nach einer Einschränkung und ist die wichtigste Zusage dieser Seite. Ein
              System, das Dringlichkeit „einschätzt“, trifft in der Arztpraxis medizinische
              Entscheidungen ohne Approbation. Der Assistent von Cogniiq tut das nicht – zu keinem
              Zeitpunkt, in keiner Konfiguration. Was er stattdessen tut, ist dreierlei:
            </p>
            <ol className="space-y-3 list-decimal pl-6 marker:text-pub-accent marker:font-semibold dark:marker:text-blue-400">
              <li>
                <span className={STRONG}>Er erkennt das Anliegen.</span> Signalwörter und
                Formulierungen, die Sie festlegen – „heute noch“, „Schmerzen“, „Notfall“ –, lösen
                keinen Routineablauf aus, sondern den Weg zum Menschen.
              </li>
              <li>
                <span className={STRONG}>Er leitet weiter.</span> Während der Sprechstunde an die
                Anmeldung oder eine benannte Person; außerhalb gibt er die Ansage aus, die Sie
                hinterlegt haben – etwa den Hinweis auf den ärztlichen Bereitschaftsdienst oder, bei
                Hinweisen auf einen Notfall, auf den Notruf.
              </li>
              <li>
                <span className={STRONG}>Er hält sich an die Grenze.</span> Kein „das klingt nicht
                so schlimm“, kein „kommen Sie morgen“. Er sagt, dass er dazu nichts beurteilen kann,
                und bringt den Anrufer zum nächsten Schritt.
              </li>
            </ol>
            <p>
              Die Trennlinie zieht Ihre Praxis. Wie das Verfahren dafür aussieht – Anrufanlässe
              sammeln, drei Prüffragen je Anlass, Freigabe durch die Praxisleitung –, beschreibt der{" "}
              <Link to="/ki-telefonassistent-einfuehren" className={LINK}>
                Leitfaden zur Einführung in der Praxis
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ── Rezept & Überweisung ───────────────────────────────────────────── */}
      <section className={SECTION_ALT} aria-labelledby="rezept-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="rezept-heading" className={H2}>
            Rezept- und Überweisungswünsche: strukturiert statt Mailbox
          </h2>
          <div className={`${PROSE} space-y-5`}>
            <p>
              In vielen Praxen landen Rezeptbestellungen heute auf einer Mailbox oder einem
              Rezept-Telefon mit Ansage. Jemand hört ab, schreibt mit, fragt nach, wenn der Name
              unverständlich war, und trägt ein. Der Assistent macht aus diesem Anruf einen
              fertigen Vorgang: Er fragt die Angaben ab, die Ihre Praxis für eine Bestellung
              braucht, wiederholt sie, und stellt sie Ihrem Team als Liste bereit – lesbar,
              sortiert, ohne Audiodatei.
            </p>
            <p>
              Was der Assistent dabei nicht tut: Er sagt kein Rezept zu, nennt keinen Abholtermin,
              den Ihre Praxis nicht bestätigt hat, und beantwortet keine Frage zur Dosierung oder
              zu Wechselwirkungen. Ob verordnet wird, entscheidet die Ärztin oder der Arzt. Der
              Assistent übernimmt den Teil des Anrufs, der heute die Anmeldung bindet – nicht den
              Teil, der Medizin ist.
            </p>
            <p>
              Dasselbe gilt für Überweisungen, Folgeverordnungen und Krankschreibungen: Anliegen
              aufnehmen, Rückrufnummer sichern, dem Team vorlegen. Die Entscheidung bleibt, wo sie
              hingehört.
            </p>
          </div>
        </div>
      </section>

      {/* ── Wann der Assistent ans Telefon geht ───────────────────────────── */}
      <section className={SECTION} aria-labelledby="zeit-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="zeit-heading" className={H2}>
            Wann der Assistent ans Telefon geht – und wann Ihre Anmeldung
          </h2>
          <div className={`${PROSE} space-y-5`}>
            <p>
              Ein Assistent, der jeden Anruf sofort übernimmt, nimmt Ihrem Team auch die Anrufe ab,
              die es gern selbst führt. Drei Muster kommen als Ausgangspunkt infrage; welches passt,
              hängt an Ihrer Besetzung.
            </p>
            <ol className="space-y-3 list-decimal pl-6 marker:text-pub-accent marker:font-semibold dark:marker:text-blue-400">
              <li>
                <span className={STRONG}>Überlauf.</span> Die Anmeldung nimmt ab, solange sie kann.
                Erst wenn besetzt ist oder niemand abnimmt, übernimmt der Assistent. Der
                vorsichtigste Einstieg, und für die meisten Praxen der richtige erste Schritt.
              </li>
              <li>
                <span className={STRONG}>Sprechstundenfenster.</span> In festen Zeiten – etwa in der
                Akutsprechstunde am Morgen – geht der Assistent zuerst ans Telefon, außerhalb davon
                die Anmeldung.
              </li>
              <li>
                <span className={STRONG}>Außerhalb der Sprechzeit.</span> Mittags, abends, am
                Wochenende nimmt der Assistent Terminwünsche, Absagen und Rezeptbestellungen auf;
                Ihr Team findet sie am nächsten Morgen als Liste vor – und die Akutansage ist
                aktuell.
              </li>
            </ol>
            <p>{FAKTEN.rufumleitung}</p>
            <p>{GRENZEN_NICHT_ALLE}</p>
          </div>
        </div>
      </section>

      {/* ── Anbindung Praxissoftware ───────────────────────────────────────── */}
      <section className={SECTION_ALT} aria-labelledby="anbindung-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="anbindung-heading" className={H2}>
            Anbindung an Ihre Praxissoftware: geprüft, nicht behauptet
          </h2>
          <div className={`${PROSE} space-y-5`}>
            {ANBINDUNG.nichtBehauptet.absaetze.map((absatz) => (
              <p key={absatz.slice(0, 40)}>{absatz}</p>
            ))}
            <p className={STRONG}>So läuft die Prüfung vor dem Angebot:</p>
            <ol className="space-y-2 list-decimal pl-6 marker:text-pub-accent marker:font-semibold dark:marker:text-blue-400">
              {ANBINDUNG.pruefen.schritte.map((schritt) => (
                <li key={schritt}>{schritt}</li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Grenzen ────────────────────────────────────────────────────────── */}
      <section className={SECTION} aria-labelledby="grenzen-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="grenzen-heading" className={H2}>
            {GRENZEN.headline}
          </h2>
          <p className={`${PROSE} mb-6`}>{GRENZEN.intro}</p>
          <ul className="space-y-3">
            {GRENZEN.points.map((punkt) => (
              <li
                key={punkt.slice(0, 40)}
                className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] pl-5 relative"
              >
                <span aria-hidden="true" className="absolute left-0 top-[0.62em] w-2 h-0.5 rounded-full bg-pub-accent-soft dark:bg-blue-400" />
                {punkt}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Für Ihr Team ───────────────────────────────────────────────────── */}
      <section className={SECTION_ALT} aria-labelledby="team-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="team-heading" className={H2}>
            {TEAM_BLOCK.headline}
          </h2>
          <p className={`${PROSE} mb-6`}>{TEAM_BLOCK.textAbwicklung}</p>
          <ul className="space-y-3">
            {TEAM_BLOCK.points.map((punkt) => (
              <li
                key={punkt.slice(0, 40)}
                className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] pl-5 relative"
              >
                <span aria-hidden="true" className="absolute left-0 top-[0.62em] w-2 h-0.5 rounded-full bg-pub-accent-soft dark:bg-blue-400" />
                {punkt}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Datenschutz ────────────────────────────────────────────────────── */}
      <section className={SECTION} aria-labelledby="datenschutz-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="datenschutz-heading" className={H2}>
            Schweigepflicht und Datenschutz: was gilt
          </h2>
          <p className={`${PROSE} mb-6`}>
            Vier Punkte sollten Sie bei jedem Anbieter abfragen: ob Gespräche aufgezeichnet werden,
            ob Ihre Daten zum Training von Modellen verwendet werden, ob es einen
            Auftragsverarbeitungsvertrag gibt und wie die Schweigepflicht nach § 203 StGB vertraglich
            abgebildet ist. Bei uns:
          </p>
          <ul className="space-y-3">
            {DATENSCHUTZ_PUNKTE.map((punkt) => (
              <li
                key={punkt.slice(0, 40)}
                className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] pl-5 relative"
              >
                <span aria-hidden="true" className="absolute left-0 top-[0.62em] w-2 h-0.5 rounded-full bg-pub-accent-soft dark:bg-blue-400" />
                {punkt}
              </li>
            ))}
          </ul>
          <p className={`${PROSE} mt-6`}>
            Keine Aussage machen wir zum Verarbeitungsort und zu Unterauftragsverarbeitern, solange
            die Verträge dafür nicht abschließend unterzeichnet sind. Was Ihr Datenschutzbeauftragter
            vor einer Entscheidung schriftlich braucht, besprechen wir vor dem Angebot – nicht
            danach.
          </p>
        </div>
      </section>

      {/* ── Kosten ─────────────────────────────────────────────────────────── */}
      <section className={SECTION_ALT} aria-labelledby="kosten-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="kosten-heading" className={H2}>
            Was es kostet: Kontingent, Mehrminuten, einmalige Einrichtung
          </h2>
          <div className={`${PROSE} space-y-5`}>
            <p>{FAKTEN.abrechnung}</p>
            <p>{FAKTEN.abrechnungGeltung}</p>
            <p>
              {FAKTEN.nichtProBehandler} {FAKTEN.preisgarantie} {EINRICHTUNG.standard}
            </p>
            <p>
              <Link to="/kosten-ki-telefonassistent" className={`${LINK} ${STRONG}`}>
                Alle Tarife und Kontingente für Praxen
              </Link>
            </p>
          </div>
          <div className="mt-10">
            <RechnerCta
              ankertext="Was es bei Ihrem Anrufaufkommen kostet"
              kontext="arztpraxis"
              einleitung="Anrufe pro Monat und Minuten pro Anruf eingeben – der Rechner zeigt den günstigsten Tarif, Grundgebühr und Mehrminuten getrennt sowie die einmalige Einrichtung; die Anbindung steht als offene Position dabei."
            />
          </div>
        </div>
      </section>

      {/* ── Einführung & Betreuung ─────────────────────────────────────────── */}
      <section className={SECTION} aria-labelledby="einfuehrung-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="einfuehrung-heading" className={H2}>
            Einführung in {FAKTEN.einrichtungsfrist} – und wer sich danach kümmert
          </h2>
          <div className={`${PROSE} space-y-5`}>
            <p>{FAKTEN.uebergabeGarantie}</p>
            <p>{FAKTEN.startDefinition}</p>
            <p>{FAKTEN.freigabeNachUebergabe}</p>
            <p>
              Ihr Aufwand konzentriert sich auf das Aufnahmegespräch: Sie beschreiben Ihre Anrufe,
              wir bauen daraus Regeln und Ansagen. Konfiguration, Anbindung und Tests übernehmen wir.
              Die acht Schritte im Einzelnen stehen auf der{" "}
              <Link to="/praxen" className={LINK}>
                Seite für Praxen
              </Link>
              ; was vor der Freigabe geprüft gehört, im{" "}
              <Link to="/ki-telefonassistent-einfuehren" className={LINK}>
                Einführungsleitfaden
              </Link>
              .
            </p>
            <p>
              <span className={STRONG}>{BETREUUNG.headline}:</span> {BETREUUNG.text}{" "}
              {BETREUUNG.person.name}, {BETREUUNG.person.rolle} – erreichbar {FAKTEN.erreichbarkeit},
              Antwort {FAKTEN.antwortzeit}. {FAKTEN.aenderungen}
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className={SECTION_ALT} aria-labelledby="faq-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="faq-heading" className={`${H2} mb-8`}>
            Häufige Fragen aus Arztpraxen
          </h2>
          <dl className="space-y-8">
            {FAQ.map((item) => (
              <div key={item.question}>
                <dt className="text-[19px] font-semibold text-gray-900 dark:text-gray-100">{item.question}</dt>
                <dd className="text-[17px] text-gray-700 dark:text-gray-300 leading-[1.7] mt-2">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Weiterlesen + Abschluss ────────────────────────────────────────── */}
      <section className={SECTION} aria-labelledby="weiter-heading">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 id="weiter-heading" className={H2}>
            Weiterlesen
          </h2>
          <ul className="space-y-4 text-[17px] leading-[1.7]">
            <li>
              <Link to="/praxen" className={`${LINK} ${STRONG}`}>
                Der KI-Empfang für Praxen im Überblick
              </Link>
              <span className="block text-gray-600 dark:text-gray-400">
                Die vier Säulen, die acht Einrichtungsschritte, Testphase und Vetorecht – für Arzt-,
                Zahnarzt- und Therapiepraxen.
              </span>
            </li>
            <li>
              <Link to="/ki-telefonassistent-zahnarztpraxis" className={`${LINK} ${STRONG}`}>
                KI-Telefonassistent in der Zahnarztpraxis
              </Link>
              <span className="block text-gray-600 dark:text-gray-400">
                Schmerzpatienten, Recall-Rückrufe, Absagen in der Behandlungszeit – was dort anders ist.
              </span>
            </li>
            <li>
              <Link to="/ki-telefonassistent-einfuehren" className={`${LINK} ${STRONG}`}>
                Einen KI-Telefonassistenten in der Praxis einführen
              </Link>
              <span className="block text-gray-600 dark:text-gray-400">
                Trennlinie, Übergabe, Prüfgruppen, Freigabe und die erste Woche im Betrieb.
              </span>
            </li>
            <li>
              <Link to="/kosten-ki-telefonassistent" className={`${LINK} ${STRONG}`}>
                Was ein KI-Telefonassistent kostet
              </Link>
              <span className="block text-gray-600 dark:text-gray-400">
                Tarife, Kontingente, Einrichtung – und ein Rechner ohne Anmeldung.
              </span>
            </li>
            <li>
              <Link to="/automatisierung-arzt" className={`${LINK} ${STRONG}`}>
                Automatisierung für Arztpraxen
              </Link>
              <span className="block text-gray-600 dark:text-gray-400">
                Terminbestätigungen, Erinnerungen und Wartelistenkontakt ohne Handarbeit – das Thema
                neben dem Telefon.
              </span>
            </li>
            <li>
              <Link to="/ki-telefonassistent" className={`${LINK} ${STRONG}`}>
                Wie der KI-Telefonassistent arbeitet
              </Link>
              <span className="block text-gray-600 dark:text-gray-400">
                Branchenoffen: was ein KI-Telefonassistent ist, wie ein Gespräch läuft und woran Sie
                Anbieter messen.
              </span>
            </li>
          </ul>

          <div className="mt-12 rounded-2xl border border-pub-accent-line dark:border-blue-500/30 bg-pub-accent-wash/60 dark:bg-blue-500/5 p-8">
            <p className={PROSE}>
              Wenn Sie die Liste für Ihre Praxis durchgehen möchten: Wir nehmen Ihre Anrufanlässe
              auf und sagen Ihnen, was davon trägt und was nicht – auch dann, wenn die Antwort gegen
              eine Einführung spricht. Kein Verkaufsgespräch, keine Präsentation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link
                to="/kontakt"
                className="inline-flex items-center justify-center rounded-xl bg-pub-signal text-white hover:bg-pub-signal-ink px-6 py-3 text-[17px] font-semibold min-h-[44px]"
              >
                Anrufanlässe gemeinsam durchgehen
              </Link>
              <Link
                to="/ki-telefonassistent/demo"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-700 px-6 py-3 text-[17px] font-semibold text-gray-900 dark:text-gray-100 min-h-[44px] hover:border-pub-signal/45 hover:text-pub-signal-ink transition-colors"
              >
                Den Assistenten im Gespräch erleben
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
