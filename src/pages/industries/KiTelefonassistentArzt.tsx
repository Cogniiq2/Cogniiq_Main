import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "KI Telefonassistent Arztpraxis – Terminannahme | Cogniiq",
    description:
      "KI Telefonassistent für Arztpraxen: Terminwünsche, Stornierungen und Rezeptbestellungen strukturiert aufnehmen – zugeschnitten auf Ihre Praxis, DSGVO-konform.",
    canonical: `${BUSINESS_INFO.website}/ki-telefonassistent-arzt`,
    keywords: "KI Telefonassistent Arztpraxis, Praxis Telefonservice, Telefonannahme Arztpraxis, telefonische Erreichbarkeit Praxis",
  },
  h1: "KI Telefonassistent für Arztpraxen",
  tagline: "Arztpraxis · Anmeldung entlasten · DSGVO-konform",
  intro:
    "Montagmorgen, kurz nach acht: Am Tresen steht eine Patientin, dahinter wartet die nächste, und das Telefon klingelt ohne Pause. Ihre MFA entscheidet im Sekundentakt, wer warten muss – und jemand verliert immer. Der KI Telefonassistent nimmt in solchen Momenten die Anrufe an, die sonst ins Leere laufen. Er erfasst das Anliegen strukturiert und übergibt es dorthin, wo Ihr Team arbeitet – mit Ihren Ansagen, nach Ihren Regeln.",
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
        "39 % der Versicherten bewerten die Erreichbarkeit von Praxen außerhalb der Öffnungszeiten als schwierig (GKV-Spitzenverband, Versichertenbefragung 2025). Wer abends absagen oder einen Termin anfragen will, landet auf der Mailbox – und die hört selten jemand vollständig ab.",
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
    "Ihre eigenen Ansagen, auf Wunsch selbst aufgesprochen – Anrufer erfahren transparent, dass ein Sprachassistent sie betreut",
    "Auftragsverarbeitungsvertrag nach Art. 28 DSGVO, Verarbeitung auf europäischen Servern",
    // [[CLAIM: verify — konkrete PVS-Anbindungen (Tomedo, Medistar, Dampsoft, CGM) je Praxis bestätigen]]
    "Anbindung an Ihre Praxissoftware wird vor dem Angebot geprüft – ein Systemwechsel ist nicht Voraussetzung",
    "Feste monatliche Kosten – keine Abrechnung pro Anruf, keine Überraschung nach einer Grippewelle",
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
          "Der Termin steht im Kalender, das Anliegen als strukturierter Eintrag bei Ihrem Team – mit Rückrufnummer, Kontext und nächstem Schritt. Ihre MFA arbeitet die Liste ab, wenn es in den Ablauf passt.",
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
        "Ehrliche Antwort: nicht alle sofort. Manche Anrufer reagieren skeptisch auf synthetische Stimmen – andere gewöhnen sich schnell daran, wenn die Ansagen nach der eigenen Praxis klingen. Deshalb stimmen wir Begrüßung und Ansagen auf Ihre Praxis ab, auf Wunsch mit Ihren selbst aufgesprochenen Aufnahmen. Wer lieber mit einem Menschen sprechen möchte, wird jederzeit weitergeleitet. Die Eingewöhnungsphase begleiten wir aktiv und passen an, was nicht ankommt.",
    },
    {
      question: "Lässt sich der Assistent an unsere Praxissoftware anbinden?",
      // [[CLAIM: verify — PVS-Integrationsliste (Tomedo, Medistar, Dampsoft, CGM) und Anbindungstiefe bestätigen]]
      answer:
        "Das prüfen wir vor dem Angebot – nicht danach. Für gängige Systeme wie Tomedo, Medistar, Dampsoft oder CGM klären wir konkret, in welcher Form die Übergabe ankommt: als Termin im Kalender, als strukturierter Eintrag oder als Nachricht an Ihr Team. Wichtig für Ihre Entscheidung: Ein Wechsel Ihrer Praxissoftware ist nicht Voraussetzung.",
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
      answer:
        "Ein Auftragsverarbeitungsvertrag nach Art. 28 DSGVO gehört zur Einrichtung. Die Verarbeitung läuft auf europäischen Servern; Gespräche werden als strukturierte Zusammenfassung übergeben und nicht als Rohaudio gespeichert, sofern Sie das nicht ausdrücklich wünschen. Anrufer werden zu Gesprächsbeginn über den Sprachassistenten informiert. Ob Ihre Praxis eine Datenschutz-Folgenabschätzung benötigt, entscheidet Ihr Datenschutzbeauftragter – wir liefern die Dokumentation dafür zu.",
    },
    {
      question: "Können wir Ansagen und Öffnungszeiten selbst anpassen?",
      answer:
        "Ja. Sprechzeiten, Urlaubsansagen und aktuelle Hinweise pflegen Sie selbst über ein Dashboard – ohne Anruf beim Support, auch kurzfristig vor Feiertagen. Änderungen an Gesprächslogik und Regeln übernehmen wir; dafür haben Sie einen festen Ansprechpartner.",
    },
  ],
};

export function KiTelefonassistentArzt() {
  return <NationalIndustryPage config={config} />;
}
