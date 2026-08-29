import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";
import { DATENSCHUTZ_PUNKTE, FAKTEN, GRENZEN } from "@/lib/telefonassistent-copy";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "KI Telefonassistent Arztpraxis – Terminannahme | Cogniiq",
    description:
      "KI Telefonassistent für Arztpraxen: Terminwünsche, Stornierungen und Rezeptbestellungen strukturiert aufnehmen – zugeschnitten auf Ihre Praxis, ohne Gesprächsaufzeichnung.",
    canonical: `${BUSINESS_INFO.website}/ki-telefonassistent-arzt`,
    keywords: "KI Telefonassistent Arztpraxis, Praxis Telefonservice, Telefonannahme Arztpraxis, telefonische Erreichbarkeit Praxis",
  },
  h1: "KI Telefonassistent für Arztpraxen",
  tagline: "Arztpraxis · Anmeldung entlasten · keine Gesprächsaufzeichnung",
  intro:
    "Montagmorgen, kurz nach acht: Am Tresen steht eine Patientin, dahinter wartet die nächste, und das Telefon klingelt ohne Pause. Ihre MFA entscheidet im Sekundentakt, wer warten muss – und jemand verliert immer. Der KI Telefonassistent nimmt in solchen Momenten die Anrufe an, die sonst ins Leere laufen. Er erfasst das Anliegen strukturiert – mit Ihrer Stimmauswahl, Ihrem Begrüßungssatz und Ihren Regeln.",
  serviceSlug: "ki-telefonassistent",
  serviceLabel: "KI Telefonassistent",
  costLink: "/kosten-ki-telefonassistent",
  costLinkLabel: "Kosten KI Telefonassistent",
  problems: [
    {
      title: "Die Montagsflut trifft die Anmeldung mit voller Wucht",
      description:
        "Nach dem Wochenende kommen Terminwünsche, Rezeptbestellungen und Rückrufbitten gebündelt. Ihre MFA springt zwischen Tresen, Telefon und Behandlungszimmer hin und her – und wer nicht durchkommt, versucht es oft bei der nächsten Praxis.",
    },
    {
      title: "Ständige Unterbrechungen erzeugen Fehler unter Druck",
      description:
        "Wer im Minutentakt unterbrochen wird, verhört Namen, notiert Nummern falsch und vergisst Rückrufe – nicht aus Nachlässigkeit, sondern weil niemand drei Dinge gleichzeitig fehlerfrei erledigt.",
    },
    {
      title: "Das Beschwerdegespräch dauert länger als das Anliegen",
      description:
        "Wer dreimal in der Warteschleife hing, beginnt das Gespräch mit seinem Ärger. Ihre MFA verbringt dann mehr Zeit mit Beschwichtigen als mit dem eigentlichen Terminwunsch.",
    },
    {
      title: "Außerhalb der Sprechzeiten ist niemand erreichbar",
      description:
        "39 % der Versicherten bewerten die Erreichbarkeit von Praxen außerhalb der Öffnungszeiten als schwierig (GKV-Spitzenverband, Versichertenbefragung 2025). Wer abends absagen oder einen Termin anfragen will, landet auf der Mailbox – und die hört selten jemand vollständig ab.",
    },
    {
      title: "Stornierungen kommen nicht an – Termine verfallen ungenutzt",
      description:
        "Patienten, die telefonisch nicht absagen können, erscheinen als Ausfall im Kalender. Der Termin hätte neu vergeben werden können – wenn die Absage rechtzeitig jemanden erreicht hätte.",
    },
    {
      title: "Unerreichbarkeit landet in den Online-Bewertungen",
      description:
        "Über die medizinische Qualität schreiben zufriedene Patienten selten – über besetzte Leitungen und Warteschleifen umso häufiger. Die Erreichbarkeit am Telefon prägt den öffentlichen Eindruck Ihrer Praxis mit.",
    },
  ],
  solution: {
    headline: "Gebaut für Ihre Anmeldung – nicht als Ersatz, sondern als Entlastung",
    text: "Der Assistent übernimmt die Anrufe, die Ihr Team gerade nicht annehmen kann: Terminwünsche, Stornierungen, Rezeptbestellungen, wiederkehrende Fragen. Medizinische Auskünfte gibt er grundsätzlich nicht; Notfall-Hinweise leitet er sofort an einen Menschen oder zur Notrufansage weiter. Jedes Gespräch endet als strukturierter Eintrag bei Ihrem Team – nicht als Zettel und nicht als Mailbox-Nachricht.",
  },
  benefits: [
    "Terminwünsche und Stornierungen werden nach Ihren Regeln gebucht oder zur Bestätigung vorgelegt",
    "Rezept- und Überweisungswünsche kommen als strukturierte Liste an – kein Abhören, kein Abtippen",
    "Notfall-Hinweise führen sofort zu Ihrem Team, zum Bereitschaftsdienst oder zur Ansage, den Notruf 112 zu wählen",
    "Ihre Stimmauswahl, Ihr Begrüßungssatz, Ihre Formulierungen – Anrufer erfahren im ersten Satz, dass ein KI-System spricht",
    "Auftragsverarbeitungsvertrag nach Art. 28 DSGVO; keine Gesprächsaufzeichnung, kein Training mit Ihren Daten",
    "Ob eine Anbindung an Ihre Praxissoftware möglich ist, prüfen wir vor dem Angebot – eine fertige Standardanbindung gibt es heute nicht",
    `Festes Minutenkontingent, darüber ${FAKTEN.mehrpreisProMinute}/Min. – gedeckelt auf die Obergrenze Ihres Tarifs`,
  ],
  workflow: {
    title: "So läuft ein Patientenanruf ab",
    steps: [
      {
        step: "01",
        title: "Patient ruft an",
        description:
          "Der Assistent nimmt ab, wenn die Anmeldung gebunden ist – ohne Besetztzeichen, ohne Warteschleife. Der Anrufer erfährt zu Beginn, dass ein Sprachassistent ihn betreut, und kann jederzeit einen Menschen verlangen.",
      },
      {
        step: "02",
        title: "Anliegen erkennen und bearbeiten",
        description:
          "Terminwunsch, Stornierung, Rezeptbestellung oder Frage zu Sprechzeiten: Der Assistent bearbeitet, was Sie im Anliegen-Katalog freigegeben haben. Alles andere – und jeder Notfall-Hinweis – geht sofort an einen Menschen.",
      },
      {
        step: "03",
        title: "Übergabe an Ihr Team",
        description:
          "Das Anliegen steht als strukturierter Eintrag im Dashboard – mit Anliegen, Name, Rückrufnummer und Terminwunsch. Ihre MFA arbeitet die Liste ab, wenn es in den Ablauf passt, und überträgt das Ergebnis ins Praxissystem, solange dafür keine Schnittstelle möglich ist.",
      },
    ],
  },
  cityLinks: [
    { label: "KI Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
    { label: "KI Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
    { label: "KI Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
    { label: "KI Telefonassistent Bayern", href: "/bayern/ki-telefonassistent" },
    { label: "KI Agentur Deutschland", href: "/ki-agentur-deutschland" },
  ],
  // Option B (Positionierung): Healthcare-Journey bleibt geschlossen —
  // keine Links in Hotel-/Restaurant-Inhalte.
  relatedLinks: [
    { label: "Webdesign Arzt", href: "/webdesign-arzt" },
    { label: "KI Telefonassistent Praxis", href: "/ki-telefonassistent-praxis" },
    { label: "Automatisierung Arzt", href: "/automatisierung-arzt" },
    { label: "Kosten KI Telefonassistent", href: "/kosten-ki-telefonassistent" },
    { label: "KI Telefonassistent im Überblick", href: "/ki-telefonassistent" },
  ],
  faq: [
    {
      question: "Kommen meine Patienten mit einer Computerstimme klar?",
      answer:
        "Ehrliche Antwort: nicht alle sofort. Manche Anrufer reagieren skeptisch auf synthetische Stimmen – andere gewöhnen sich schnell daran, wenn die Formulierungen nach der eigenen Praxis klingen. Deshalb wählen Sie die Stimme, formulieren Ihren Begrüßungssatz und legen fest, wie Ihre Praxis am Telefon spricht. Wer lieber mit einem Menschen sprechen möchte, wird jederzeit weitergeleitet. Die Eingewöhnungsphase begleiten wir aktiv und passen an, was nicht ankommt.",
    },
    {
      question: "Lässt sich der Assistent an unsere Praxissoftware anbinden?",
      answer:
        `${FAKTEN.keineAnbindung} Welche Schnittstelle Ihr System bietet, prüfen wir vor dem Angebot – nicht danach –, und das Ergebnis steht im Angebot, auch wenn es negativ ausfällt. Eine Liste unterstützter Systeme führen wir bewusst nicht: Sie wäre heute entweder leer oder unehrlich. Ein Wechsel Ihrer Praxissoftware ist keine Voraussetzung.`,
    },
    {
      question: "Was passiert, wenn ein Patient einen Notfall schildert?",
      answer:
        "Der Assistent beurteilt niemals selbst, wie ernst ein Anliegen ist. Bei Hinweisen auf einen Notfall leitet er sofort weiter – an Ihr Team, an den von Ihnen benannten Bereitschaftsdienst oder mit der klaren Ansage, den Notruf 112 zu wählen. Welcher Weg gilt, legen Sie bei der Einrichtung fest, inklusive der genauen Formulierungen.",
    },
    {
      question: "Was ändert sich für unsere MFA im Alltag?",
      answer:
        "Das Telefon klingelt nicht mehr in dem Moment, in dem eine Patientin am Tresen steht. Terminwünsche, Stornierungen und Rezeptbestellungen kommen als strukturierte Einträge an, die Ihr Team abarbeitet, wenn es in den Ablauf passt. Ihre MFA entscheidet weiterhin über jeden Termin und jede Rückmeldung – sie wird nur seltener dabei unterbrochen.",
    },
    {
      question: "Wie steht es um Datenschutz und Schweigepflicht?",
      answer: `Vier Punkte entscheiden, und Sie sollten sie bei jedem Anbieter abfragen: Wird das Gespräch aufgezeichnet und wie lange gespeichert. Werden Ihre Daten zum Training von Modellen verwendet. Gibt es einen Auftragsverarbeitungsvertrag nach Art. 28 DSGVO. Und wie wird die Schweigepflicht nach § 203 StGB vertraglich abgebildet. Bei uns: ${DATENSCHUTZ_PUNKTE.join(". ").replace(/\.\.$/, ".")}.`,
    },
    {
      question: "Können wir Ansagen und Öffnungszeiten selbst anpassen?",
      answer:
        "Ja. Sprechzeiten, Urlaubsansagen und aktuelle Hinweise pflegen Sie selbst über ein Dashboard – ohne Anruf beim Support, auch kurzfristig vor Feiertagen. Änderungen an Gesprächslogik und Regeln übernehmen wir; dafür haben Sie einen festen Ansprechpartner.",
    },
    {
      question: "Sind die monatlichen Kosten planbar oder wird pro Anruf abgerechnet?",
      answer:
        `Planbar: Jeder Tarif hat ein festes Minutenkontingent zu einem festen Monatspreis, keine Abrechnung pro Anruf. ${FAKTEN.deckelung} Alle Tarife, Kontingente und die Einrichtung im Detail stehen unter Kosten KI Telefonassistent.`,
    },
  ],
  grenzen: GRENZEN,
  stimmprobe: true,
  beweiskette: true,
};

export function KiTelefonassistentArzt() {
  return <NationalIndustryPage config={config} />;
}
