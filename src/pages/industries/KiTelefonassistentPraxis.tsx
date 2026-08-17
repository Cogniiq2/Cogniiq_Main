import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";
import { GRENZEN } from "@/lib/telefonassistent-copy";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "KI Telefonassistent für Therapiepraxen | Cogniiq",
    description:
      "KI Telefonassistent für Physio-, Ergo- und Logopädie-Praxen: erreichbar bleiben, während Sie behandeln. Terminwünsche strukturiert erfasst, ohne Gesprächsaufzeichnung.",
    canonical: `${BUSINESS_INFO.website}/ki-telefonassistent-praxis`,
    keywords: "KI Telefonassistent Praxis, Physiotherapie Telefonannahme, telefonische Erreichbarkeit Therapiepraxis, Terminbuchung Therapeut",
  },
  h1: "KI Telefonassistent für Therapeuten & Praxen",
  tagline: "Physio · Ergo · Logo · Erreichbar ohne besetzten Empfang",
  intro:
    "Ihre Hände sind am Patienten, und das Telefon klingelt im Flur. Nach Feierabend sitzen Sie über der Rückrufliste – falls die Mailbox überhaupt verwertbare Nachrichten enthält. Viele Therapiepraxen besetzen den Empfang nur wenige Stunden pro Woche; den Rest erledigt die Inhaberin abends selbst. Der KI Telefonassistent nimmt die Anrufe an, während Sie behandeln, erfasst Terminwünsche strukturiert und legt sie Ihnen so vor, dass der Rückruf in Minuten erledigt ist – oder gar nicht mehr nötig.",
  serviceSlug: "ki-telefonassistent",
  serviceLabel: "KI Telefonassistent",
  costLink: "/kosten-ki-telefonassistent",
  costLinkLabel: "Kosten KI Telefonassistent",
  problems: [
    {
      title: "Behandlung und Telefon konkurrieren um dieselben Hände",
      description:
        "Eine Sitzung lässt sich nicht unterbrechen, um einen Terminwunsch aufzunehmen. Jeder Anruf während der Behandlung landet auf der Mailbox – oder nirgends.",
    },
    {
      title: "Die Rückrufliste gehört dem Feierabend",
      description:
        "Wo kein Empfang dauerhaft besetzt ist, bleibt das Zurückrufen an der Inhaberin hängen – abends, nach der letzten Behandlung, oft bei Anrufern, die dann selbst nicht mehr abnehmen.",
    },
    {
      title: "Mailbox-Nachrichten sind selten vollständig",
      description:
        "Name verstanden, Nummer fehlt – oder umgekehrt. Wer Nachrichten abhört, bekommt kein strukturiertes Anliegen, sondern ein Ratespiel. Und viele Anrufer sprechen gar nicht erst auf Band.",
    },
    {
      title: "Absagen erreichen niemanden – der Termin verfällt",
      description:
        "Wer kurzfristig absagen will und nicht durchkommt, erscheint als Ausfall im Plan. In einer Einzelpraxis lässt sich diese Stunde nicht auffangen – dabei hätte jemand von der Warteliste sie gern übernommen.",
    },
    {
      title: "Anfragen nach Feierabend laufen ins Leere",
      description:
        "Berufstätige Patienten rufen an, wenn Ihre Praxis geschlossen ist. Ohne verlässliche Annahme gehen genau die Anfragen verloren, die tagsüber nicht kommen konnten.",
    },
    {
      title: "Zettel und Gedächtnis sind kein System für Patientendaten",
      description:
        "Name, Anliegen und Rückrufnummer zwischen zwei Behandlungen auf einen Block zu notieren, ist fehleranfällig – und für Gesundheitsdaten kein dokumentierter Prozess. Eine strukturierte Erfassung ist beides: verlässlicher und sauberer dokumentiert.",
    },
  ],
  solution: {
    headline: "Erreichbar bleiben, ohne den Empfang zu besetzen",
    text: "Der Assistent nimmt Anrufe an, während Sie behandeln: Er erfasst Terminwünsche, nimmt Absagen entgegen und beantwortet wiederkehrende Fragen nach Ihren Vorgaben. Fachliche und therapeutische Auskünfte gibt er nicht – solche Anliegen landen mit Rückrufnummer und Kontext auf Ihrer Liste. Sie entscheiden abends nicht mehr, wen Sie zuerst zurückrufen müssen, sondern sehen es.",
  },
  benefits: [
    "Anrufe werden angenommen, während Sie behandeln – ohne dass jemand am Empfang sitzt",
    "Terminwünsche und Absagen kommen als strukturierte Einträge an – mit Name, Nummer und Anliegen",
    "Frei werdende Termine sind sofort sichtbar und können neu vergeben werden",
    "Wiederkehrende Fragen zu Zeiten, Anfahrt oder Unterlagen beantwortet der Assistent nach Ihren Vorgaben",
    "Ihre Stimmauswahl, Ihr Begrüßungssatz, Ihre Formulierungen – Anrufer erfahren im ersten Satz, dass ein KI-System spricht",
    "Auftragsverarbeitungsvertrag nach Art. 28 DSGVO; keine Gesprächsaufzeichnung, kein Training mit Ihren Daten",
    "Festes Minutenkontingent, darüber 0,39 €/Min. – die Rechnung übersteigt nie den nächsthöheren Tarif",
  ],
  workflow: {
    title: "So läuft ein Terminanruf in der Therapiepraxis ab",
    steps: [
      {
        step: "01",
        title: "Patient ruft an – Sie behandeln weiter",
        description:
          "Der Assistent nimmt ab, ohne dass eine Sitzung unterbrochen wird. Der Anrufer erfährt zu Beginn, dass ein Sprachassistent ihn betreut, und kann jederzeit um einen Rückruf bitten.",
      },
      {
        step: "02",
        title: "Anliegen strukturiert erfassen",
        description:
          "Terminwunsch, Absage oder Frage zur Praxis: Der Assistent bearbeitet, was Sie freigegeben haben – nach Ihren Zeitfenstern und Regeln. Therapeutische Fragen nimmt er nur auf, beantwortet sie aber nicht.",
      },
      {
        step: "03",
        title: "Übergabe statt Rückruf-Marathon",
        description:
          "Termine stehen im Kalender, offene Anliegen als sortierte Liste mit Rückrufnummer und Kontext. Was sich ohne Sie klären ließ, ist geklärt – der Rest ist in Minuten abgearbeitet.",
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
    { label: "KI Telefonassistent Arzt", href: "/ki-telefonassistent-arzt" },
    { label: "Automatisierung Arzt", href: "/automatisierung-arzt" },
    { label: "Webdesign Arzt", href: "/webdesign-arzt" },
    { label: "Kosten KI Telefonassistent", href: "/kosten-ki-telefonassistent" },
    { label: "KI Telefonassistent im Überblick", href: "/ki-telefonassistent" },
  ],
  faq: [
    {
      question: "Für welche Praxisformen eignet sich der Assistent?",
      answer:
        "Für Praxen, in denen Behandlungszeit und Telefonzeit direkt konkurrieren: Physiotherapie, Ergotherapie, Logopädie, Heilpraxis. Je seltener der Empfang besetzt ist, desto größer die spürbare Entlastung – vom Einzelkämpfer bis zur Praxis mit mehreren Behandlungsräumen.",
    },
    {
      question: "Kommen meine Patienten mit einer Computerstimme klar?",
      answer:
        "Nicht jeder Anrufer mag synthetische Stimmen – das nehmen wir ernst. Sie wählen die Stimme, formulieren Ihren Begrüßungssatz und legen fest, wie Ihre Praxis am Telefon spricht. Wer nicht mit dem Assistenten sprechen möchte, kann jederzeit einen Rückruf hinterlassen und wird nicht in ein Menü gezwungen. In der Anfangszeit werten wir die Gespräche mit Ihnen aus und passen an, was nicht ankommt.",
    },
    {
      question: "Worauf müssen Sie bei DSGVO und Gesundheitsdaten in Therapiepraxen achten?",
      answer:
        "Vier Punkte entscheiden, und Sie sollten sie bei jedem Anbieter abfragen: Wird das Gespräch aufgezeichnet und wie lange gespeichert. Werden Ihre Daten zum Training von Modellen verwendet. Gibt es einen Auftragsverarbeitungsvertrag nach Art. 28 DSGVO. Und wie wird die Schweigepflicht nach § 203 StGB vertraglich abgebildet. Bei uns: Gespräche werden nicht aufgezeichnet – gespeichert wird ausschließlich das strukturierte Ergebnis. Ihre Daten werden nicht zum Training von Modellen verwendet. Einen AVV nach Art. 28 DSGVO stellen wir jedem Kunden bereit. Cogniiq und alle Mitarbeitenden werden vertraglich auf das Berufsgeheimnis nach § 203 StGB verpflichtet. Der Assistent gibt sich zu Beginn jedes Anrufs als KI-System zu erkennen. Ob Ihre Praxis eine Datenschutz-Folgenabschätzung benötigt, entscheidet Ihr Datenschutzbeauftragter – wir liefern die Unterlagen dafür zu.",
    },
    {
      question: "Was passiert mit Anliegen, die der Assistent nicht klären kann?",
      answer:
        "Therapeutische Fragen, unklare Anliegen und alles, was Sie festgelegt haben, nimmt der Assistent nur strukturiert auf – mit Name, Rückrufnummer und Anliegen. Sie sehen die Liste, wenn Sie aus der Behandlung kommen, und entscheiden selbst über jede Rückmeldung.",
    },
    {
      question: "Kann ich den Assistenten hören, bevor ich mich entscheide?",
      answer:
        "Ja. Im unverbindlichen Erstgespräch gehen wir Ihre typischen Anrufe durch und zeigen an einer Beispielkonfiguration, wie der Assistent für Ihre Praxis klingt und was er übernimmt. Vor dem Start testen Sie mit echten Szenarien – erst wenn es sitzt, geht er live.",
    },
  ],
  grenzen: GRENZEN,
  stimmprobe: true,
};

export function KiTelefonassistentPraxis() {
  return <NationalIndustryPage config={config} />;
}
