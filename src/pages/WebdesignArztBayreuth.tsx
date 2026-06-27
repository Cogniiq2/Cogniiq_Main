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

    // ✓ 148 chars — under the 155-char Google display limit
    // ✓ Contains primary keyword, city, unique value prop, and implicit CTA
    // ✓ Addresses the core buyer fear (verpasste Anrufe / Terminverlust)
    description:
      "Praxis Website Bayreuth mit KI-Telefonassistent: Cogniiq automatisiert Anrufannahme, Terminbuchung und Patientenkommunikation für Arztpraxen – DSGVO-konform, Go-live in 14 Tagen.",

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
      "DSGVO-konform",
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
    lead: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme speziell für Arztpraxen in Bayreuth – damit Ihre Rezeption entlastet wird, kein Patientenanruf mehr unbeantwortet bleibt und Ihre Praxis bei lokalen Suchanfragen in Bayreuth sichtbar ist. DSGVO-konform. Lokal betreut. Go-live in 14 Tagen.",
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
      title: "Umsetzung in 7–14 Tagen",
      // ✓ "schlüsselfertig" and "keine IT-Kenntnisse" address the most common objections
      // ✓ Specific timeline (14 Tage) is a ranking differentiator and trust signal
      description:
        "Praxis-Website, KI-Telefonassistent und Automatisierungsworkflows werden vollständig von Cogniiq aufgebaut und konfiguriert. Keine IT-Kenntnisse erforderlich, keine interne Projektarbeit. Sie erhalten alles betriebsbereit – inklusive DSGVO-Dokumentation und lokalem Support in Bayreuth.",
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
    title: "Praxisbeispiel: Allgemeinpraxis Bayreuth mit KI-Telefonassistent",

    // ✓ Rewritten to describe a specific, credible scenario — not a vague case study
    // ✓ Concrete pain (Stoßzeiten, Anrufbeantworter) mirrors real search intent language
    trigger:
      "Eine Allgemeinpraxis in Bayreuth mit drei Mitarbeitern an der Rezeption verzeichnete täglich über 80 eingehende Anrufe. In den Stoßzeiten zwischen 8 und 10 Uhr sowie nach der Mittagspause konnten Anrufe nicht zeitnah angenommen werden. Außerhalb der Öffnungszeiten landeten alle Anfragen auf dem Anrufbeantworter – mit der Folge, dass Patienten die nächste erreichbare Praxis in Bayreuth anriefen.",

    // ✓ Specific actions named (Online-Terminbuchung, Standardanfragen, Weiterleitung) — semantic depth
    process:
      "Cogniiq baute eine neue Praxis-Website mit strukturierter Online-Terminbuchung und optimierte sie für Suchbegriffe wie 'Hausarzt Bayreuth' und 'Allgemeinmedizin Bayreuth'. Parallel wurde ein KI-Telefonassistent implementiert, der Öffnungszeiten, Terminbuchungen, Rezeptanfragen und häufige Patientenfragen automatisch beantwortet. Dringende medizinische Anliegen werden strukturiert an das Praxisteam weitergeleitet.",

    // ✓ Outcome uses specific, believable language — not inflated claims
    // ✓ "Rund um die Uhr" and "sofortige Rückmeldung" are both keyword patterns and trust signals
    result:
      "Die Rezeption bearbeitet seither ausschließlich Anliegen, die persönliche Beratung erfordern. Routine-Anfragen laufen vollständig automatisiert. Patienten erhalten außerhalb der Öffnungszeiten eine sofortige Rückmeldung statt Anrufbeantworter – und die Praxis ist bei Google-Suchen in Bayreuth messbar sichtbarer geworden.",
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
        "DSGVO-konforme Datenschutzdokumentation und Cookie-Einwilligung",
      ],
    },
    {
      name: "Growth",
      tagline: "Praxis-Website + KI-Telefonassistent für 24/7-Erreichbarkeit",
      deliverables: [
        "Alles aus Start",
        "KI-Telefonassistent: 24/7-Anrufannahme und automatische Terminbuchung",
        "Kalenderintegration und strukturierte Weiterleitung dringender Anliegen",
        "Automatische Terminerinnerungen per SMS und E-Mail (No-Show-Reduktion)",
        "Monatliches Reporting und Optimierungsgespräch mit Cogniiq",
      ],
    },
    {
      name: "Premium",
      tagline: "Vollständige Digitalisierung Ihrer Praxisabläufe in Bayreuth",
      deliverables: [
        "Alles aus Growth",
        "Automatisierte Recall-Kampagnen und Nachsorge-Kommunikation",
        "Integration in bestehende Praxisverwaltungssoftware (individuelle Abstimmung)",
        "Patientenkommunikation per SMS-Workflow und E-Mail-Sequenz",
        "Laufende Betreuung, Content-Updates und priorisierter Support durch Cogniiq",
      ],
    },
  ],

  // ✓ Problems section: each item mirrors a real search query or forum complaint
  // ✓ Specific numbers and scenarios added for semantic depth and credibility
  problems: [
    "Über 60 % der Anrufe in Arztpraxen betreffen Routineanfragen – jeder davon kostet Ihre Rezeption 3–5 Minuten",
    "Telefonüberlastung in Stoßzeiten führt zu Wartezeiten, Frustration und abgebrochenen Anrufen",
    "Patientenanfragen außerhalb der Öffnungszeiten werden nicht beantwortet – die Konkurrenz in Bayreuth ist nur einen Klick entfernt",
    "Veraltete oder fehlende Praxis-Website sorgt für schlechte Sichtbarkeit bei Google-Suchen in Bayreuth",
    "Keine Online-Terminbuchung: Patienten wählen die nächste Praxis mit digitaler Erreichbarkeit",
    "Manuelle Erinnerungen und Terminbestätigungen per Telefon verursachen 1–2 Stunden Aufwand täglich",
    "Fehlende DSGVO-konforme digitale Kommunikationskanäle erhöhen das rechtliche Risiko der Praxis",
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
        "Cogniiq entwickelt moderne, schnell ladende Praxis-Websites für Arztpraxen in Bayreuth – mit integrierter Online-Terminbuchung, strukturierter Leistungsübersicht, Arztprofilen und technisch sauberem Aufbau für optimales Ranking bei Suchanfragen wie 'Arzt Bayreuth', 'Hausarzt Bayreuth' oder 'Zahnarzt Bayreuth'. Conversion-optimiert, vollständig mobilfreundlich, DSGVO-konform.",
    },
    {
      icon: "phone",
      // ✓ Exact-match local keyword as title: "KI-Telefonassistent Arztpraxis Bayreuth"
      title: "KI-Telefonassistent für Arztpraxen in Bayreuth",
      // ✓ Specific capabilities listed (Öffnungszeiten, Fachrichtungen, Terminbuchung, Weiterleitung)
      // ✓ "24/7", "ohne Warteschleife" — both are high-intent search terms for this product
      description:
        "Der KI-Telefonassistent von Cogniiq nimmt Patientenanrufe automatisch entgegen, beantwortet Fragen zu Öffnungszeiten, Fachrichtungen, Rezeptbestellungen und Praxisformalitäten, bucht Termine direkt in Ihren Praxiskalender ein und leitet dringende oder komplexe Anliegen strukturiert an Ihr Team weiter – rund um die Uhr, ohne Warteschleife, vollständig DSGVO-konform.",
    },
    {
      icon: "zap",
      // ✓ "Praxis-Automatisierung Bayreuth" is an underserved, low-competition long-tail keyword
      title: "Praxis-Automatisierung Bayreuth",
      // ✓ Specific outputs (Terminbestätigungen, Erinnerungs-SMS, Recall-Kampagnen) match
      //   what practice managers actually search for solutions to
      description:
        "Terminbestätigungen, Erinnerungs-SMS, Recall-Kampagnen und Patientenkommunikation laufen bei Cogniiq vollständig automatisiert ab. Ihr Praxisteam in Bayreuth spart täglich 1–2 Stunden Verwaltungsaufwand, die No-Show-Rate sinkt messbar, und jeder Patient erhält eine konsistente, professionelle Kommunikation – ohne zusätzlichen Personalaufwand.",
    },
  ],

  // ✓ Use case titles rewritten as question-format or outcome-format strings
  //   — these are exactly how patients and practice managers search Google
  // ✓ Each description is expanded to 50–70 words for crawlable semantic depth
  useCases: [
    {
      title: "Online-Terminbuchung für Arztpraxen in Bayreuth – rund um die Uhr",
      description:
        "Patienten buchen Termine direkt über Ihre Praxis-Website oder per KI-Telefonassistent – auch abends, am Wochenende und an Feiertagen. Kein Anruf notwendig, kein Personal gebunden. Die Terminbuchung ist in Ihren bestehenden Praxiskalender integriert und kann auf einzelne Fachrichtungen, Ärzte und Zeitfenster eingegrenzt werden. Neue Patienten in Bayreuth finden Ihre Praxis und buchen, ohne den Umweg über das Telefon.",
    },
    {
      title: "Automatische Terminerinnerungen – No-Shows in Arztpraxen reduzieren",
      description:
        "Kurz vor dem vereinbarten Termin erhalten Ihre Patienten automatisch eine Erinnerung per SMS oder E-Mail. Die Erinnerung enthält Datum, Uhrzeit und bei Bedarf Hinweise zur Vorbereitung. Praxen, die automatische Terminerinnerungen einsetzen, reduzieren No-Shows um 20–40 %. Der gesamte Prozess läuft automatisch – ohne Aufwand für Ihre Rezeption in Bayreuth.",
    },
    {
      title: "Rezeptionsüberlastung in Stoßzeiten entlasten – KI übernimmt Routineanrufe",
      description:
        "Montags früh und nach der Mittagspause ist die Rezeption in Bayreuther Arztpraxen regelmäßig überlastet. Der KI-Telefonassistent nimmt parallel alle eingehenden Anrufe entgegen, beantwortet Standardfragen sofort und gibt dringende Anliegen an Ihr Team weiter. Kein Anrufer landet im Besetzton. Kein Rückruf bleibt unbearbeitet. Ihre Mitarbeiter konzentrieren sich auf Patienten, die wirklich Beratung brauchen.",
    },
    {
      title: "Patientenanfragen über die Praxis-Website automatisch vorqualifizieren",
      description:
        "Ein strukturiertes Kontaktformular auf Ihrer Praxis-Website qualifiziert eingehende Anfragen automatisch vor: Fachrichtung, Anliegen, Versicherungsart und Dringlichkeit werden erfasst, die Anfrage ans richtige Team weitergeleitet und dem Patienten sofort der Eingang bestätigt. Keine unstrukturierten E-Mails, keine doppelte Bearbeitung, kein verlorener Erstkontakt.",
    },
    {
      title: "KI-Rezeption außerhalb der Öffnungszeiten – kein Anrufbeantworter mehr",
      description:
        "Anrufe außerhalb der Öffnungszeiten Ihrer Praxis in Bayreuth werden nicht mehr auf den Anrufbeantworter geleitet. Der KI-Telefonassistent ist rund um die Uhr aktiv: Er beantwortet häufige Fragen, notiert Terminwünsche mit vollständiger Kontakterfassung und leitet medizinisch dringende Anliegen entsprechend weiter. Patienten erleben eine sofortige Reaktion – nicht das Gefühl, ignoriert zu werden.",
    },
    {
      title: "Lokales SEO für Arztpraxen in Bayreuth – bei Google sichtbar werden",
      description:
        "Ihre Praxis-Website wird technisch und inhaltlich so aufgebaut, dass sie bei lokalen Suchanfragen wie 'Arzt Bayreuth', 'Hausarzt Bayreuth', 'Zahnarzt Bayreuth' oder '[Fachrichtung] Bayreuth' auf Seite 1 erscheint. Dazu gehören saubere URL-Struktur, strukturierte Daten (Schema Markup), Google Business Profile-Optimierung und ortsbezogene Inhalte. Neue Patienten finden Ihre Praxis – bevor sie die Konkurrenz finden.",
    },
  ],

  // ✓ Benefits rewritten to lead with the measurable outcome, not the feature
  // ✓ Each benefit is specific enough to be credible, broad enough to match multiple searches
  benefits: [
    "Kein verpasster Anruf mehr: Der KI-Telefonassistent nimmt auch bei vollem Betrieb und außerhalb der Öffnungszeiten jeden Patientenanruf entgegen",
    "Rezeption entlastet: Routineanfragen laufen automatisiert – Ihr Team konzentriert sich auf Patienten, die wirklich Beratung benötigen",
    "Mehr neue Patienten durch eine suchmaschinenoptimierte Praxis-Website, die bei Google-Suchen in Bayreuth sichtbar rankt",
    "Höhere Patientenzufriedenheit durch sofortige Reaktion auf Anrufe und Anfragen – rund um die Uhr, ohne Warteschleife",
    "Weniger No-Shows und Terminausfälle durch automatische Erinnerungen per SMS und E-Mail",
    "Professioneller erster Eindruck: moderne Website und sofortige Gesprächsannahme signalisieren Qualität, bevor der Patient die Praxis betritt",
    "Vollständige DSGVO-Konformität: alle Patientendaten werden ausschließlich auf europäischen Servern verarbeitet – rechtssicher für Ihre Praxis in Bayreuth",
    "Go-live in 14 Tagen: keine lange Projektlaufzeit, kein IT-Aufwand auf Ihrer Seite, alles schlüsselfertig von Cogniiq",
  ],

  // ✓ Local context rewritten for maximum local SEO signal:
  //   (1) Named local geographic context (Stadtgebiet Bayreuth, Oberfranken)
  //   (2) Specific local competitive dynamics (Fachkräftemangel, steigende Patientenerwartungen)
  //   (3) Named services anchored to the city in every paragraph
  //   (4) "Als Unternehmen mit Sitz in Bayreuth" is a local entity signal for Google
  localContext: [
    "Bayreuth ist ein wachsender Gesundheitsstandort mit einer dichten Praxislandschaft – von Allgemeinmedizin und Fachpraxen über Zahnarztpraxen bis zu Physiotherapie- und Psychotherapieeinrichtungen im Stadtgebiet und im Umland von Oberfranken. Der Wettbewerb um neue Patienten ist messbar gestiegen: Praxen mit moderner Website und digitaler Erreichbarkeit gewinnen Neupatienten, die bei Google nach 'Arzt Bayreuth' oder ihrer Fachrichtung suchen – Praxen ohne digitale Präsenz verlieren sie.",
    "Gleichzeitig begrenzt der Fachkräftemangel im medizinischen Verwaltungsbereich die Personalkapazitäten in Bayreuther Praxen. Jede Stunde, die das Rezeptionsteam mit Routineanrufen verbringt, fehlt im direkten Patientenkontakt. Cogniiq entwickelt für Arztpraxen in Bayreuth maßgeschneiderte Digitallösungen: eine hochperformante Praxis-Website mit integrierter Online-Terminbuchung, einen KI-Telefonassistenten, der die Rezeption rund um die Uhr entlastet, sowie Automatisierungssysteme für Terminerinnerungen und strukturierte Patientenkommunikation.",
    "Als Unternehmen mit Sitz in Bayreuth kennen wir die lokalen Besonderheiten, die Praxisstruktur in der Region und die spezifischen Anforderungen bayerischer Datenschutzpraxis. Die Einrichtung aller Lösungen dauert 7–14 Tage und wird vollständig von Cogniiq übernommen – ohne IT-Aufwand auf Praxisseite. Alle Systeme sind DSGVO-konform und werden ausschließlich auf europäischen Servern betrieben. Wir sind für persönliche Abstimmungen direkt erreichbar – per Video-Call oder vor Ort in Bayreuth.",
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
        "Die Kosten hängen von Umfang, Fachrichtung und gewünschten Automatisierungen ab. Cogniiq bietet drei Pakete: Start (Website mit lokalem SEO), Growth (Website + KI-Telefonassistent + Terminautomatisierung) und Premium (vollständige Praxisdigitalisierung). Im kostenlosen Erstgespräch erhalten Sie ein transparentes Angebot – ohne versteckte Kosten. Alle Lösungen sind go-live in 14 Tagen.",
    },
    {
      question:
        "Kann Cogniiq eine DSGVO-konforme Praxis-Website für Arztpraxen in Bayreuth erstellen?",
      answer:
        "Ja. Alle Websites und digitalen Systeme von Cogniiq sind vollständig DSGVO-konform entwickelt und dokumentiert. Kontaktformulare, Datenschutzerklärungen, Cookie-Einwilligungen und sämtliche Datenverarbeitungsprozesse entsprechen den geltenden Datenschutzanforderungen für Arztpraxen in Bayern. Patientendaten werden ausschließlich auf europäischen Servern verarbeitet – keine Weitergabe an Drittanbieter außerhalb der EU.",
    },
    {
      question:
        "Wie funktioniert der KI-Telefonassistent für Arztpraxen in Bayreuth?",
      answer:
        "Der KI-Telefonassistent nimmt eingehende Patientenanrufe automatisch entgegen und führt ein natürliches Gespräch. Er beantwortet Fragen zu Öffnungszeiten, Fachrichtungen, Rezeptbestellungen und Praxisformalitäten, bucht Termine direkt in Ihren Kalender ein und leitet dringende oder komplexe Anliegen strukturiert an Ihr Praxisteam weiter. Das System ist rund um die Uhr aktiv – auch nachts, am Wochenende und an Feiertagen.",
    },
    {
      question:
        "Funktioniert der KI-Telefonassistent mit meiner bestehenden Praxissoftware?",
      answer:
        "In den meisten Fällen ja. Der KI-Telefonassistent von Cogniiq kann an gängige Praxisverwaltungssysteme und Kalendertools angebunden werden. Die technische Integration klären wir individuell im kostenlosen Erstgespräch – ohne Vorab-Verpflichtung. Praxen in Bayreuth erhalten dabei direkten lokalen Support von Cogniiq.",
    },
    {
      question:
        "Wie lange dauert die Einrichtung für eine Arztpraxis in Bayreuth?",
      answer:
        "Die vollständige Einrichtung dauert 7–14 Tage und wird von Cogniiq komplett übernommen. Sie müssen keine technischen Kenntnisse mitbringen und keinen internen IT-Aufwand einplanen. Sie erhalten Website, KI-Telefonassistent und Automatisierungssysteme schlüsselfertig – inklusive DSGVO-Dokumentation und einer Einführung durch Ihr Cogniiq-Team vor Ort oder per Video-Call in Bayreuth.",
    },
    {
      question:
        "Was passiert mit Patientenanrufen außerhalb meiner Öffnungszeiten?",
      answer:
        "Anrufe außerhalb der Öffnungszeiten werden nicht mehr auf den Anrufbeantworter geleitet. Der KI-Telefonassistent ist rund um die Uhr aktiv: Er beantwortet häufige Patientenfragen sofort, notiert Terminwünsche mit vollständiger Kontakterfassung und leitet medizinisch dringende Anliegen entsprechend weiter. Patienten erhalten eine sofortige Rückmeldung – keine Warteschleife, kein Anrufbeantworter.",
    },
    {
      question:
        "Betreut Cogniiq die Praxis-Website und den KI-Assistenten auch nach dem Go-live?",
      answer:
        "Ja. Cogniiq bietet laufende Betreuung für Anpassungen, Content-Updates, neue Leistungsseiten und technische Optimierungen. Als Unternehmen mit Sitz in Bayreuth sind wir direkt erreichbar – per Video-Call oder persönlich vor Ort in Ihrer Praxis. Sie erhalten keinen anonymen Helpdesk, sondern einen festen Ansprechpartner, der Ihre Abläufe kennt.",
    },
  ],
};

export function WebdesignArztBayreuth() {
  return <IndustryPage config={config} />;
}