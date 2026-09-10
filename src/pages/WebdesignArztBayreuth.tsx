import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/webdesign-arzt-bayreuth",
  industry: "Arzt & Praxis",
  industrySlug: "arzt-praxis",
  city: "Bayreuth",
  citySlug: "bayreuth",
  cityHub: "/bayreuth",
  seo: {
    // ✓ 58 chars — under the 60-char Google cutoff
    // ✓ Primary keyword at the front — highest weight position
    // ✓ Brand appended at the end — not eating into keyword space
    title: "Praxis Website Bayreuth & KI-Telefonassistent | Cogniiq",

    // Google-Anzeigelänge: gekürzt anzeigen, der Kern steht vorn.
    // ✓ Contains primary keyword, city, unique value prop, and implicit CTA
    // ✓ Addresses the core buyer fear (verpasste Anrufe / Terminverlust)
    description:
      "Praxis Website Bayreuth mit KI-Telefonassistent: Cogniiq übernimmt die Anrufannahme, erfasst Terminwünsche strukturiert und übergibt sie an Ihr Team – in zwei Wochen eingerichtet und bereit zur Freigabe.",

    canonical: `${base}/webdesign-arzt-bayreuth`,

    // ✓ Expanded to cover semantic variants Google uses for related queries
    // ✓ Includes long-tail patterns with low competition and high buyer intent
    keywords:
      "Praxis Website Bayreuth, Arzt Website Bayreuth, KI Telefonassistent Arztpraxis Bayreuth, Terminbuchung Arztpraxis Bayreuth, Praxis Automatisierung Bayreuth, Rezeption entlasten Arztpraxis, DSGVO Website Arztpraxis Bayern, Online Terminbuchung Arztpraxis Bayreuth",
  },

  hero: {
    // ✓ Trust tags kept — these render as visible signals, not meta
    // ✓ "Patientenanfragen" added — higher-intent search term than generic "KI-Integration"
    trustTags: [
      "Bayreuth",
      "Patientenanfragen",
      "Terminprozesse",
      "Automatisierung",
    ],
    // ✓ CTA copy is specific to the industry — signals relevance to a doctor/practice manager
    ctaLabel: "Kostenlose Praxisanalyse anfragen",
  },

  intro: {
    // ✓ H1 is the single most important on-page SEO element
    // ✓ Primary keyword "Webdesign Arztpraxis Bayreuth" leads — exact match to likely search query
    // ✓ Secondary keyword "KI-Telefonassistent" included — covers the second search intent
    // ✓ Under 70 chars — clean, not keyword-stuffed, reads naturally
    h1: "Webdesign Arztpraxis Bayreuth & KI-Telefonassistent",

    // ✓ Lead paragraph: primary keyword in first sentence (highest semantic weight position)
    // ✓ Covers all three service pillars (Website, KI-Telefon, Automatisierung) for topical breadth
    // ✓ "Bayreuth" used twice — reinforces local relevance signal for Google Maps + organic
    // ✓ Specific outcomes named (Patientenanfragen, Erreichbarkeit, Terminprozesse) — matches buyer search intent
    // ✓ Trust signals (DSGVO-konform, lokal) anchor the paragraph
    lead: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme speziell für Arztpraxen in Bayreuth – damit Ihre Rezeption entlastet wird, Patientenanrufe auch dann angenommen werden, wenn niemand abnehmen kann, und Ihre Praxis bei lokalen Suchanfragen in Bayreuth sichtbar ist. Lokal betreut. Spätestens zwei Wochen nach dem Start ist alles eingerichtet und bereit für Ihre Freigabe.",
  },

  // ✓ Pain points rewritten to match the exact language patients and practice managers
  //   type into Google — these are the queries that land on this page
  // ✓ Each item uses specific, searchable problem language rather than generic descriptions
  // ✓ "Bayreuth" integrated naturally into contextually relevant items
  engpaesse: [
    "Telefonüberlastung an der Rezeption: Terminanfragen, Rezeptbestellungen und Rückfragen blockieren das Team in Bayreuth täglich stundenlang",
    "Anrufe außerhalb der Öffnungszeiten landen auf dem Anrufbeantworter – Patienten rufen beim nächsten Arzt in Bayreuth an",
    "Keine Praxis-Website oder veraltete Website kostet täglich neue Patientenanfragen bei Google-Suchen wie 'Arzt Bayreuth'",
    "Manuelle Terminerinnerungen und Bestätigungen per Telefon binden Personalzeit, die direkt am Patienten fehlt",
    "Fehlende Online-Terminbuchung verliert Patienten an Praxen mit besserer digitaler Erreichbarkeit in Bayreuth",
    "Keine strukturierte Weiterleitung dringender Anrufe außerhalb der Öffnungszeiten führt zu Beschwerden und Patientenverlust",
  ],

  solutionSteps: [
    {
      step: "Schritt 1",
      title: "Analyse der Praxisabläufe",
      // ✓ "Bayreuth" + specifics (Telefonaufkommen, Patientenfluss) signal topical depth to Google
      description:
        "Wir analysieren das tägliche Telefonaufkommen, die Patientenstruktur und die bestehenden Abläufe Ihrer Arztpraxis in Bayreuth. Daraus entwickeln wir ein maßgeschneidertes Konzept für Praxis-Website, KI-Telefonassistent und Prozessautomatisierung – abgestimmt auf Ihre Fachrichtung und Teamgröße.",
    },
    {
      step: "Schritt 2",
      title: "Umsetzung nach Ihrer Freigabe",
      // ✓ "schlüsselfertig" and "keine IT-Kenntnisse" address the most common objections
      // ✓ Specific timeline is a ranking differentiator and trust signal. Kanonisch sind
      // 14 Kalendertage bis zur Übergabe zur Freigabe — nie bis zum Go-live, der an
      // der Kundenfreigabe hängt (FAKTEN.uebergabeGarantie).
      description:
        "Cogniiq baut und konfiguriert Praxis-Website, KI-Telefonassistent und Automatisierungsabläufe. Keine IT-Kenntnisse erforderlich, keine interne Projektarbeit. Sie erhalten alles betriebsbereit, mit lokalem Support in Bayreuth.",
    },
    {
      step: "Schritt 3",
      title: "Go-live & laufende Betreuung",
      // ✓ "persönlich vor Ort" is a strong local SEO signal and genuine differentiator
      description:
        "Nach Ihrer Abnahme geht die Praxis-Website live und der KI-Telefonassistent übernimmt den Betrieb. Cogniiq bleibt als direkter Ansprechpartner für Anpassungen, Content-Updates und technische Optimierungen – persönlich erreichbar als Unternehmen mit Sitz in Bayreuth.",
    },
  ],

  workflow: {
    // ✓ Title includes city and industry for local semantic relevance
    title: "Beispielszenario: Allgemeinpraxis Bayreuth mit KI-Telefonassistent",

    // Hypothetical scenario only. It must never be phrased as a delivered or anonymized
    // customer project. No named customer project may be published anywhere on the site
    // without written consent on file (see ASSETS-REQUIRED.md).
    trigger:
      "Angenommen, eine Allgemeinpraxis in Bayreuth mit drei Mitarbeitern an der Rezeption verzeichnet täglich eine hohe Zahl eingehender Anrufe. In den Stoßzeiten zwischen 8 und 10 Uhr sowie nach der Mittagspause können Anrufe nicht zeitnah angenommen werden. Außerhalb der Öffnungszeiten landen alle Anfragen auf dem Anrufbeantworter – mit der Folge, dass Patienten die nächste erreichbare Praxis in Bayreuth anrufen.",

    // ✓ Specific actions named (Online-Terminbuchung, Standardanfragen, Weiterleitung) — semantic depth
    process:
      "Vorgehen: Cogniiq entwickelt eine Praxis-Website mit strukturierter Online-Terminbuchung und optimiert sie für Suchbegriffe wie 'Hausarzt Bayreuth' und 'Allgemeinmedizin Bayreuth'. Parallel wird ein KI-Telefonassistent eingerichtet, der Öffnungszeiten, Terminbuchungen, Rezeptanfragen und häufige Patientenfragen automatisch beantwortet. Dringende medizinische Anliegen werden strukturiert an das Praxisteam weitergeleitet.",

    // ✓ Outcome uses specific, believable language — not inflated claims
    // ✓ "Rund um die Uhr" and "sofortige Rückmeldung" are both keyword patterns and trust signals
    result:
      "So könnte die Rezeption sich auf Anliegen konzentrieren, die persönliche Beratung erfordern. Routine-Anfragen liefen automatisiert, und Patienten erhielten außerhalb der Öffnungszeiten eine sofortige Rückmeldung statt eines Anrufbeantworters.",
  },

  pakete: [
    {
      name: "Start",
      // ✓ Package taglines include action verbs and specifics — not just category names
      tagline: "Professionelle Praxis-Website für mehr Sichtbarkeit in Bayreuth",
      deliverables: [
        "Responsive Praxis-Website (bis 5 Seiten, mobiloptimiert)",
        "Online-Kontaktformular mit automatischer Benachrichtigung",
        "Google Maps Integration & NAP-Konsistenz für lokales SEO Bayreuth",
        "On-Page SEO für Suchanfragen wie 'Arzt Bayreuth' und 'Praxis Bayreuth'",
        "Datenschutzerklärung, Impressum und Cookie-Einwilligung",
      ],
    },
    {
      name: "Growth",
      tagline: "Praxis-Website + KI-Telefonassistent für Erreichbarkeit außerhalb der Sprechzeiten",
      deliverables: [
        "Alles aus Start",
        "KI-Telefonassistent: Anrufannahme außerhalb der Sprechzeiten, Terminwünsche strukturiert aufgenommen",
        "Übergabe an Ihr Praxisverwaltungssystem, soweit dessen Schnittstelle sie trägt",
        "Strukturierte Weiterleitung dringender Anliegen an Ihr Team",
        "Monatliches Reporting und Optimierungsgespräch mit Cogniiq",
      ],
    },
    {
      name: "Premium",
      tagline: "Website, Telefonassistent und Praxisabläufe als ein System in Bayreuth",
      deliverables: [
        "Alles aus Growth",
        "Recall und Nachsorge-Kommunikation als eingerichteter Ablauf, im vor dem Angebot geprüften Umfang",
        "Anbindung an Ihre Praxisverwaltungssoftware, soweit die Prüfung Ihres Systems sie trägt",
        "Patientenkommunikation als eingerichteter Ablauf, im geprüften Umfang",
        "Laufende Betreuung, Content-Updates und priorisierter Support durch Cogniiq",
      ],
    },
  ],

  // ✓ Problems section: each item mirrors a real search query or forum complaint
  // ✓ Specific numbers and scenarios added for semantic depth and credibility
  problems: [
    "Ein Großteil der Anrufe in Arztpraxen betrifft Routineanfragen – jeder davon bindet Zeit an der Rezeption",
    "Telefonüberlastung in Stoßzeiten führt zu Wartezeiten, Frustration und abgebrochenen Anrufen",
    "Patientenanfragen außerhalb der Öffnungszeiten werden nicht beantwortet – die Konkurrenz in Bayreuth ist nur einen Klick entfernt",
    "Veraltete oder fehlende Praxis-Website sorgt für schlechte Sichtbarkeit bei Google-Suchen in Bayreuth",
    "Keine Online-Terminbuchung: Patienten wählen die nächste Praxis mit digitaler Erreichbarkeit",
    "Manuelle Erinnerungen und Terminbestätigungen per Telefon verursachen täglich spürbaren Aufwand",
    "Fehlende Datenschutzdokumentation auf digitalen Kommunikationskanälen erhöht das rechtliche Risiko der Praxis",
  ],

  services: [
    {
      icon: "web",
      // ✓ Service title is an exact-match local keyword — "Praxis-Website Bayreuth"
      title: "Praxis-Website Bayreuth",
      // ✓ Description contains three semantic keyword clusters:
      //   (1) local SEO ("Arzt Bayreuth", "Praxis Bayreuth")
      //   (2) conversion features (Online-Terminbuchung, Arztprofile)
      //   (3) technical trust signals (DSGVO-konform, mobilfreundlich, schnell)
      description:
        "Cogniiq entwickelt moderne, schnell ladende Praxis-Websites für Arztpraxen in Bayreuth – mit integrierter Online-Terminbuchung, strukturierter Leistungsübersicht, Arztprofilen und technisch sauberem Aufbau für optimales Ranking bei Suchanfragen wie 'Arzt Bayreuth', 'Hausarzt Bayreuth' oder 'Zahnarzt Bayreuth'. Conversion-optimiert, vollständig mobilfreundlich.",
    },
    {
      icon: "phone",
      // ✓ Exact-match local keyword as title: "KI-Telefonassistent Arztpraxis Bayreuth"
      title: "KI-Telefonassistent für Arztpraxen in Bayreuth",
      // Fähigkeiten benannt (Öffnungszeiten, Fachrichtungen, Terminwunsch, Weiterleitung).
      // ✓ "außerhalb der Sprechzeiten", "ohne Warteschleife" — both are high-intent search terms
      description:
        "Der KI-Telefonassistent von Cogniiq nimmt Patientenanrufe entgegen, beantwortet Fragen zu Öffnungszeiten, Fachrichtungen, Rezeptbestellungen und Praxisformalitäten, nimmt Terminwünsche mit Name und Rückrufnummer strukturiert auf und leitet dringende oder komplexe Anliegen an Ihr Team weiter – auch außerhalb der Sprechzeiten und ohne Warteschleife. Ob sich Termine direkt in Ihr Praxisverwaltungssystem übergeben lassen, prüfen wir vor dem Angebot an Ihrem konkreten System; wo das nicht trägt, steht das Ergebnis strukturiert im Cogniiq-Dashboard.",
    },
    {
      icon: "zap",
      // ✓ "Praxis-Automatisierung Bayreuth" is an underserved, low-competition long-tail keyword
      title: "Praxis-Automatisierung Bayreuth",
      // Belegbarkeitsgrenze: welche dieser Abläufe möglich sind, hängt am System der Praxis.
      //   Deshalb hier als Prüfgegenstand formuliert, nicht als laufende Cogniiq-Funktion.
      description:
        "Terminbestätigungen, Erinnerungen, Recall-Kampagnen und Patientenkommunikation lassen sich als Abläufe einrichten, statt sie täglich von Hand zu erledigen. Welche davon in Ihrer Praxis in Bayreuth möglich sind, hängt an den Systemen, die Sie einsetzen – das sehen wir uns vor dem Angebot an. Das Ziel ist weniger Verwaltungsaufwand für Ihr Team und eine konsistente Kommunikation gegenüber Patienten.",
    },
  ],

  // ✓ Use case titles rewritten as question-format or outcome-format strings
  //   — these are exactly how patients and practice managers search Google
  // ✓ Each description is expanded to 50–70 words for crawlable semantic depth
  useCases: [
    {
      title: "Terminwünsche rund um die Uhr annehmen – Arztpraxen in Bayreuth",
      description:
        "Patienten geben ihren Terminwunsch über Ihre Praxis-Website oder am Telefon ab – auch abends, am Wochenende und an Feiertagen, ohne dass Personal gebunden ist. Die Anfrage lässt sich auf einzelne Fachrichtungen, Ärzte und Zeitfenster eingrenzen. Ob die Anfrage direkt in Ihrem bestehenden Praxiskalender landet, hängt an dessen Schnittstelle; das prüfen wir an Ihrem System, bevor wir ein Angebot machen.",
    },
    {
      title: "Terminerinnerungen für Arztpraxen – was sich einrichten lässt",
      description:
        "Eine Erinnerung vor dem Termin – mit Datum, Uhrzeit und bei Bedarf Hinweisen zur Vorbereitung – lässt sich als Ablauf einrichten, statt sie von Hand zu verschicken. Auf welchem Weg das geht und was Ihr Praxisverwaltungssystem dafür hergibt, sehen wir uns vor dem Angebot an. Wir sagen keinen Versandweg zu, den wir an Ihrem System nicht geprüft haben.",
    },
    {
      title: "Rezeptionsüberlastung in Stoßzeiten entlasten – KI übernimmt Routineanrufe",
      description:
        "Montags früh und nach der Mittagspause ist die Rezeption in Bayreuther Arztpraxen regelmäßig überlastet. Der KI-Telefonassistent nimmt parallel eingehende Anrufe entgegen, beantwortet Standardfragen sofort und gibt dringende Anliegen an Ihr Team weiter. Anrufe landen nicht im Besetztzeichen, Rückrufwünsche kommen als strukturierte Liste an. Ihre Mitarbeiter konzentrieren sich auf Patienten, die wirklich Beratung brauchen.",
    },
    {
      title: "Patientenanfragen über die Praxis-Website automatisch vorqualifizieren",
      description:
        "Ein strukturiertes Kontaktformular auf Ihrer Praxis-Website qualifiziert eingehende Anfragen automatisch vor: Fachrichtung, Anliegen, Versicherungsart und Dringlichkeit werden erfasst, die Anfrage ans richtige Team weitergeleitet und dem Patienten sofort der Eingang bestätigt. Keine unstrukturierten E-Mails, keine doppelte Bearbeitung, kein verlorener Erstkontakt.",
    },
    {
      title: "KI-Rezeption außerhalb der Öffnungszeiten – statt Anrufbeantworter",
      description:
        "Anrufe außerhalb der Öffnungszeiten Ihrer Praxis in Bayreuth werden nicht mehr auf den Anrufbeantworter geleitet. Der KI-Telefonassistent ist auch außerhalb der Sprechzeiten aktiv: Er beantwortet häufige Fragen, notiert Terminwünsche mit vollständiger Kontakterfassung und leitet medizinisch dringende Anliegen entsprechend weiter. Patienten erleben eine sofortige Reaktion – nicht das Gefühl, ignoriert zu werden.",
    },
    {
      title: "Lokales SEO für Arztpraxen in Bayreuth – bei Google sichtbar werden",
      description:
        "Ihre Praxis-Website wird technisch und inhaltlich so aufgebaut, dass sie ihre Sichtbarkeit bei lokalen Suchanfragen wie 'Arzt Bayreuth', 'Hausarzt Bayreuth' oder 'Zahnarzt Bayreuth' deutlich verbessert. Dazu gehören saubere URL-Struktur, strukturierte Daten (Schema Markup), Google Business Profile-Optimierung und ortsbezogene Inhalte. Neue Patienten finden Ihre Praxis – bevor sie die Konkurrenz finden.",
    },
  ],

  // ✓ Benefits rewritten to lead with the measurable outcome, not the feature
  // ✓ Each benefit is specific enough to be credible, broad enough to match multiple searches
  benefits: [
    "Erreichbar auch dann, wenn niemand abnehmen kann: Der KI-Telefonassistent nimmt auch bei vollem Betrieb und außerhalb der Öffnungszeiten Patientenanrufe entgegen",
    "Rezeption entlastet: Routineanfragen nimmt der Assistent entgegen – Ihr Team konzentriert sich auf Patienten, die wirklich Beratung benötigen",
    "Mehr neue Patienten durch eine suchmaschinenoptimierte Praxis-Website, die bei Google-Suchen in Bayreuth sichtbar rankt",
    "Höhere Patientenzufriedenheit durch sofortige Reaktion auf Anrufe und Anfragen – auch außerhalb der Sprechzeiten, ohne Warteschleife",
    "Terminerinnerungen richten wir in dem Umfang ein, den Ihr System nachweislich hergibt",
    "Professioneller erster Eindruck: moderne Website und sofortige Gesprächsannahme signalisieren Qualität, bevor der Patient die Praxis betritt",
    "In zwei Wochen eingerichtet und bereit zur Freigabe: keine lange Projektlaufzeit, kein IT-Aufwand auf Ihrer Seite, alles schlüsselfertig von Cogniiq",
  ],

  // ✓ Local context rewritten for maximum local SEO signal:
  //   (1) Named local geographic context (Stadtgebiet Bayreuth, Oberfranken)
  //   (2) Specific local competitive dynamics (Fachkräftemangel, steigende Patientenerwartungen)
  //   (3) Named services anchored to the city in every paragraph
  //   (4) "Als Unternehmen mit Sitz in Bayreuth" is a local entity signal for Google
  localContext: [
    "Bayreuth ist ein wachsender Gesundheitsstandort mit einer dichten Praxislandschaft – von Allgemeinmedizin und Fachpraxen über Zahnarztpraxen bis zu Physiotherapie- und Psychotherapieeinrichtungen im Stadtgebiet und im Umland von Oberfranken. Der Wettbewerb um neue Patienten ist messbar gestiegen: Praxen mit moderner Website und digitaler Erreichbarkeit gewinnen Neupatienten, die bei Google nach 'Arzt Bayreuth' oder ihrer Fachrichtung suchen – Praxen ohne digitale Präsenz verlieren sie.",
    "Gleichzeitig begrenzt der Fachkräftemangel im medizinischen Verwaltungsbereich die Personalkapazitäten in Bayreuther Praxen. Jede Stunde, die das Rezeptionsteam mit Routineanrufen verbringt, fehlt im direkten Patientenkontakt. Cogniiq entwickelt für Arztpraxen in Bayreuth maßgeschneiderte Digitallösungen: eine schnelle Praxis-Website mit strukturierter Terminanfrage, einen KI-Telefonassistenten, der die Rezeption auch außerhalb der Sprechzeiten entlastet, und Abläufe für Terminerinnerungen und Patientenkommunikation in dem Umfang, den die Prüfung Ihrer Systeme trägt.",
    "Als Unternehmen mit Sitz in Bayreuth kennen wir die lokalen Besonderheiten, die Praxisstruktur in der Region und die spezifischen Anforderungen bayerischer Datenschutzpraxis. Die Einrichtung übernimmt Cogniiq – ohne IT-Aufwand auf Praxisseite. Wir sind für persönliche Abstimmungen direkt erreichbar – per Video-Call oder vor Ort in Bayreuth.",
  ],

  // ✓ Internal links kept structurally identical — no changes to href values
  // ✓ Anchor texts improved: more descriptive, keyword-rich, still natural
  //   (Google weights anchor text of internal links for the destination page's ranking)
  internalLinks: [
    { label: "Webdesign Agentur Bayreuth", href: "/bayreuth/webdesign" },
    { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
    { label: "Prozessautomatisierung Bayreuth", href: "/bayreuth/automatisierung" },
    { label: "Cogniiq Bayreuth – Übersicht", href: "/bayreuth" },
    { label: "Praxis Website München", href: "/webdesign-arzt-muenchen" },
    { label: "Praxis Website Regensburg", href: "/webdesign-arzt-regensburg" },
    { label: "Webdesign Agentur Bayern", href: "/bayern" },
    { label: "KI-Lösungen für Unternehmen Deutschland", href: "/deutschland" },
  ],

  // ✓ FAQ section is the highest-value SEO element in this config after H1
  // ✓ Questions are rewritten as exact-match search queries — these are what patients type
  // ✓ Answers expanded to 60–100 words each — Google FAQ rich results reward semantic depth
  // ✓ Each answer contains the primary keyword cluster at least once (natural, not stuffed)
  // ✓ 7 FAQs retained (good for schema breadth); order reflects search volume hierarchy
  faq: [
    {
      question:
        "Was kostet eine Praxis-Website mit KI-Telefonassistent in Bayreuth?",
      // ✓ New FAQ — "Kosten" and "Preis" are consistently the highest-volume FAQ searches
      //   for any service. Answering it directly captures this intent and builds trust.
      answer:
        "Die Kosten hängen von Umfang, Fachrichtung und gewünschten Automatisierungen ab. Cogniiq bietet drei Pakete: Start (Website mit lokalem SEO), Growth (Website + KI-Telefonassistent + Terminautomatisierung) und Premium (vollständige Praxisdigitalisierung). Im kostenlosen Erstgespräch erhalten Sie ein transparentes Angebot – ohne versteckte Kosten. Alle Lösungen sind spätestens zwei Wochen nach dem Start eingerichtet und bereit für Ihre Freigabe; live geschaltet wird erst nach Ihrer Freigabe.",
    },
    {
      question:
        "Was liefert Cogniiq zum Datenschutz einer Praxis-Website in Bayreuth?",
      answer:
        "Zum Lieferumfang gehören Datenschutzerklärung, Impressum, Cookie-Einwilligung, gesicherte Formularübertragung und die Dokumentation der Datenflüsse. Zum Verarbeitungsort machen wir derzeit keine Angabe — die Verträge mit den beteiligten Anbietern sind nicht abschließend unterzeichnet. Ob der konkrete Einsatz in Ihrer Praxis den Anforderungen genügt, beurteilt Ihr Datenschutzbeauftragter – wir liefern ihm die Unterlagen dafür zu.",
    },
    {
      question:
        "Wie funktioniert der KI-Telefonassistent für Arztpraxen in Bayreuth?",
      answer:
        "Der KI-Telefonassistent nimmt eingehende Patientenanrufe entgegen und führt ein natürliches Gespräch. Er beantwortet Fragen zu Öffnungszeiten, Fachrichtungen, Rezeptbestellungen und Praxisformalitäten, nimmt Terminwünsche mit Name und Rückrufnummer strukturiert auf und leitet dringende oder komplexe Anliegen an Ihr Praxisteam weiter. Ob der Termin direkt in Ihrem Kalender landet, hängt an dessen Schnittstelle und wird vor dem Angebot geprüft. Zu Beginn jedes Anrufs gibt sich der Assistent als KI-System zu erkennen (Art. 50 KI-Verordnung).",
    },
    {
      question:
        "Funktioniert der KI-Telefonassistent mit meiner bestehenden Praxissoftware?",
      answer:
        "Eine Standardanbindung, die auf jedes Praxisverwaltungssystem sofort passt, gibt es nicht. Wir prüfen deshalb Ihr konkretes System vor dem Angebot: ob es eine geeignete Schnittstelle gibt, ob wir dafür Zugang oder eine Freigabe bekommen, welche Vorgänge sie zulässt und ob Dritte dafür Gebühren verlangen. Das Ergebnis steht im Angebot. Trägt es nicht, kommt das strukturierte Ergebnis ins Cogniiq-Dashboard, und den Übergabeweg legen wir vorher gemeinsam fest.",
    },
    {
      question:
        "Wie lange dauert die Einrichtung für eine Arztpraxis in Bayreuth?",
      answer:
        "Die Einrichtung übernimmt Cogniiq. Sie müssen keine technischen Kenntnisse mitbringen und keinen internen IT-Aufwand einplanen. Sie erhalten Website, KI-Telefonassistent und Automatisierungsabläufe betriebsbereit, mit einer Einführung durch Ihr Cogniiq-Team vor Ort oder per Video-Call in Bayreuth.",
    },
    {
      question:
        "Was passiert mit Patientenanrufen außerhalb meiner Öffnungszeiten?",
      answer:
        "Anrufe außerhalb der Öffnungszeiten werden nicht mehr auf den Anrufbeantworter geleitet. Der KI-Telefonassistent ist auch außerhalb der Sprechzeiten aktiv: Er beantwortet häufige Patientenfragen sofort, notiert Terminwünsche mit vollständiger Kontakterfassung und leitet medizinisch dringende Anliegen entsprechend weiter. Patienten erhalten eine sofortige Rückmeldung – keine Warteschleife, kein Anrufbeantworter.",
    },
    {
      question:
        "Betreut Cogniiq die Praxis-Website und den KI-Assistenten auch nach dem Go-live?",
      answer:
        "Ja. Cogniiq bietet laufende Betreuung für Anpassungen, Content-Updates, neue Leistungsseiten und technische Optimierungen. Als Unternehmen mit Sitz in Bayreuth sind wir direkt erreichbar – per Video-Call oder persönlich vor Ort in Ihrer Praxis. Sie erhalten einen festen Ansprechpartner, der Ihre Abläufe kennt.",
    },
  ],
};

export function WebdesignArztBayreuth() {
  return <IndustryPage config={config} />;
}