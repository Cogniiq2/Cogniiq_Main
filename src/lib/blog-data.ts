export interface BlogArticle {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
  readingTime: number;
  publishedAt: string;
  updatedAt: string;
  excerpt: string;
  heroKeyword: string;
  sections: BlogSection[];
  faqItems?: { question: string; answer: string }[];
  relatedSlugs: string[];
  canonical: string;
  /**
   * The service pages this article's reader is actually looking for next.
   * Rendered as a contextual "Passende Leistung" block on the article — the
   * only editorial links from the blog into the money pages. Targets must be
   * indexable manifest routes and must never point at a frozen search
   * experiment (src/lib/routing/protectedExperiments.ts); blog-data.test.ts
   * enforces both.
   */
  serviceLinks: ServiceLink[];
}

export interface ServiceLink {
  /** Anchor text. Names the page's topic, not a call to action. */
  label: string;
  /** Site-relative path of an indexable public route. */
  href: string;
  /** One sentence on why this page follows from the article. */
  note: string;
}

export interface BlogSection {
  type: "h2" | "h3" | "p" | "ul" | "ol" | "callout" | "table";
  heading?: string;
  content?: string;
  items?: string[];
  rows?: { label: string; value: string }[];
  calloutType?: "tip" | "warning" | "info";
}

export const BLOG_CATEGORIES = [
  "KI-Automatisierung",
  "Webdesign",
  "KI-Telefonassistent",
  "Digitalisierung",
  "Local SEO",
];

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: "ki-automatisierung-kleine-unternehmen",
    title: "KI-Automatisierung für kleine Unternehmen: Der komplette Leitfaden",
    metaTitle: "KI-Automatisierung für kleine Unternehmen | Leitfaden",
    metaDescription:
      "KI-Automatisierung für kleine Unternehmen: Welche Prozesse sich lohnen, was es kostet und wie der Einstieg gelingt. Mit konkreten Beispielen aus der Praxis.",
    category: "KI-Automatisierung",
    readingTime: 9,
    publishedAt: "2025-01-20",
    updatedAt: "2026-09-05",
    excerpt:
      "Viele Inhaber kleiner Unternehmen verbringen einen erheblichen Teil ihrer Arbeitszeit mit Aufgaben, die eine KI in Sekunden erledigen könnte. Dieser Leitfaden zeigt, wo der Hebel am größten ist.",
    heroKeyword: "KI-Automatisierung kleine Unternehmen",
    sections: [
      {
        type: "p",
        content:
          "Mittelständische Unternehmen und Selbstständige verlieren täglich wertvolle Stunden durch sich wiederholende Aufgaben: E-Mails beantworten, Termine koordinieren, Rechnungen prüfen, Daten übertragen. Künstliche Intelligenz kann diese Prozesse übernehmen – ohne dass ein eigenes IT-Team nötig ist.",
      },
      {
        type: "h2",
        heading: "Warum KI-Automatisierung jetzt für kleine Unternehmen relevant ist",
        content:
          "Die Kosten für KI-Tools sind in den letzten Jahren deutlich gesunken. Was früher nur Konzernen vorbehalten war, ist heute für Unternehmen ab fünf Mitarbeitenden wirtschaftlich sinnvoll. Gleichzeitig steigen Lohnkosten, Fachkräftemangel wächst, und Kunden erwarten rund-um-die-Uhr-Erreichbarkeit.",
      },
      {
        type: "ul",
        heading: "Die fünf häufigsten automatisierbaren Prozesse",
        items: [
          "Terminvereinbarung und Erinnerungen",
          "Eingehende Kundenanfragen per E-Mail oder Telefon qualifizieren",
          "Rechnungsstellung und Zahlungserinnerungen",
          "Lead-Nurturing und Follow-up-Sequenzen",
          "Dateneingabe zwischen verschiedenen Softwaresystemen (CRM, Buchhaltung, Kalender)",
        ],
      },
      {
        type: "h2",
        heading: "Welche Branchen profitieren am meisten",
        content:
          "Arztpraxen, Anwaltskanzleien, Handwerksbetriebe, Gastronomie und Immobilienmakler gehören zu den Branchen mit dem höchsten Automatisierungspotenzial – nicht weil sie technologisch vorn liegen, sondern weil sie besonders viele repetitive Kommunikations- und Verwaltungsaufgaben haben.",
      },
      {
        type: "table",
        heading: "Vergleich: Manuell vs. automatisiert",
        rows: [
          { label: "Terminbuchung (30 Anfragen/Monat)", value: "Manuell: ~6 Std. | Automatisiert: <5 Min." },
          { label: "E-Mail-Erstkontakt beantworten", value: "Manuell: 2–5 Min. pro Mail | Automatisiert: sofort" },
          { label: "Rechnungsversand", value: "Manuell: 15 Min./Rechnung | Automatisiert: <1 Min." },
        ],
      },
      {
        type: "h2",
        heading: "Schritt für Schritt: So startet man mit KI-Automatisierung",
        content:
          "Der häufigste Fehler beim Start ist, zu viel auf einmal automatisieren zu wollen. Empfehlenswert ist ein schrittweiser Ansatz: Zuerst den einen Prozess identifizieren, der am meisten Zeit kostet – und diesen mit einem einzelnen Tool lösen.",
      },
      {
        type: "ol",
        items: [
          "Zeitfresser identifizieren: Welche Aufgabe wiederholt sich täglich oder wöchentlich?",
          "Prozess dokumentieren: Den aktuellen Ablauf Schritt für Schritt aufschreiben",
          "Tool oder Dienstleister wählen: Eigenentwicklung vs. fertiges System vs. Agentur",
          "Pilotphase: Zwei Wochen testen, Ergebnisse messen",
          "Skalieren: Weitere Prozesse nach demselben Schema angehen",
        ],
      },
      {
        type: "h2",
        heading: "Was KI-Automatisierung realistisch kostet",
        content:
          "Ein einfaches Automatisierungssystem (z. B. automatische Terminbestätigung + CRM-Eintrag) ist ab 150 € monatlich umsetzbar. Komplexere Lösungen mit mehreren verbundenen Systemen liegen bei 300–800 € pro Monat. Wann sich das rechnet, hängt vom Betrieb ab – rechnen Sie mit Ihren eigenen Zahlen.",
      },
      {
        type: "callout",
        calloutType: "tip",
        content:
          "Tipp: Beginnen Sie mit dem Prozess, der Sie persönlich am meisten nervt. Das erhöht die Motivation, das System tatsächlich zu nutzen und weiterzuentwickeln.",
      },
      {
        type: "h2",
        heading: "Häufige Fehler und wie man sie vermeidet",
        content:
          "Viele Unternehmen scheitern nicht am System, sondern an der Einführung. Fehlende Dokumentation, unklare Verantwortlichkeiten und mangelndes Testing sind die häufigsten Ursachen. Wer mit einer KI-Agentur zusammenarbeitet, sollte auf klare SLAs, Übergabedokumentation und laufenden Support bestehen.",
      },
    ],
    faqItems: [
      {
        question: "Ab welcher Unternehmensgröße lohnt sich KI-Automatisierung?",
        answer:
          "Ab einem Mitarbeitenden oder Selbstständigen mit wiederkehrenden Prozessen lohnt sich Automatisierung. Entscheidend ist nicht die Größe, sondern die Häufigkeit der Aufgabe.",
      },
      {
        question: "Brauche ich technisches Know-how für KI-Automatisierung?",
        answer:
          "Nein. Moderne No-Code-Plattformen und spezialisierte Agenturen ermöglichen die Umsetzung ohne eigenes IT-Wissen.",
      },
      {
        question: "Wie lange dauert die Einrichtung eines Automatisierungssystems?",
        answer:
          "Einfache Workflows sind in wenigen Tagen live. Komplexere Systeme benötigen zwei bis vier Wochen für Analyse, Aufbau und Testing.",
      },
      {
        question: "Ist KI-Automatisierung DSGVO-konform?",
        answer:
          "Das hängt vom Anbieter und der Umsetzung ab. Systeme mit europäischen Servern und DSGVO-konformen Tools sind verfügbar und sollten bevorzugt werden.",
      },
    ],
    relatedSlugs: [
      "ki-telefonassistent-arztpraxis",
      "webdesign-konversion-tipps",
      "prozessautomatisierung-roi",
    ],
    canonical: "https://cogniiq.de/blog/ki-automatisierung-kleine-unternehmen",
    serviceLinks: [
      { label: "Prozessautomatisierung für Unternehmen", href: "/prozessautomatisierung", note: "Wie Cogniiq wiederkehrende Abläufe in Betrieben aufnimmt, abbildet und automatisiert." },
      { label: "Was kostet Automatisierung?", href: "/kosten-automatisierung", note: "Kostenrahmen und Einflussfaktoren, bevor Sie ein Projekt anfragen." },
    ],
  },
  {
    slug: "ki-telefonassistent-arztpraxis",
    title: "KI-Telefonassistent für Arztpraxen: Weniger Stress, mehr freie Leitungen",
    metaTitle: "KI-Telefonassistent Arztpraxis | Vorteile & Kosten",
    metaDescription:
      "Wie ein KI-Telefonassistent Arztpraxen dabei hilft, verpasste Anrufe zu reduzieren, Termine automatisch zu buchen und das Praxisteam zu entlasten.",
    category: "KI-Telefonassistent",
    readingTime: 7,
    publishedAt: "2025-01-28",
    updatedAt: "2026-09-05",
    excerpt:
      "Eine Arztpraxis mit hohem Anrufaufkommen verliert ohne funktionierendes Telefonmanagement Patienten. Der KI-Telefonassistent übernimmt Annahme, strukturierte Aufnahme und Terminbuchung – auch außerhalb der Öffnungszeiten.",
    heroKeyword: "KI-Telefonassistent Arztpraxis",
    sections: [
      {
        type: "p",
        content:
          "Das Telefon in einer Arztpraxis steht selten still. Ein großer Teil der Anrufe sind Terminanfragen – Aufgaben, die eine gut konfigurierte KI vollständig übernehmen kann. Der Rest, also Notfälle, komplexe Fragen oder spezifische Anliegen, bleibt beim Team.",
      },
      {
        type: "h2",
        heading: "Das Problem: Überlastete Leitungen und verpasste Patienten",
        content:
          "Wenn Patienten morgens um 8 Uhr nicht durchkommen, rufen sie bei einer anderen Praxis an. Dieser stille Verlust ist schwer messbar, hat aber direkte Auswirkungen auf Patientenbindung und Praxisumsatz. Wie groß das Problem ist, zeigt der vzbv (2025): Über ein Drittel der Befragten scheiterte bereits an der telefonischen Terminbuchung.",
      },
      {
        type: "ul",
        heading: "Was ein KI-Telefonassistent für Arztpraxen übernimmt",
        items: [
          "Anrufannahme ohne Warteschleife – auch bei parallelen Anrufen",
          "Terminwünsche strukturiert erfassen – und, wo die vorhandene Praxissoftware eine geeignete Schnittstelle bietet, direkt an sie übergeben",
          "Terminbestätigung und -erinnerung per SMS oder E-Mail",
          "Beantwortung häufiger Fragen (Öffnungszeiten, Parkplatz, Zuzahlung, Impftermine)",
          "Weiterleitung dringlicher Anliegen ans Praxisteam",
          "Rückrufwunsch erfassen und Ticket erstellen",
        ],
      },
      {
        type: "h2",
        heading: "Integration in bestehende Praxissoftware",
        content:
          "Ein Telefonassistent ist erst dann wirklich entlastend, wenn das Ergebnis eines Anrufs ohne Umweg dort landet, wo die Praxis ohnehin arbeitet. Ob das geht, entscheidet die vorhandene Software, nicht der Anbieter — weshalb eine pauschale Zusage vor der Prüfung nichts wert ist und wir auch keine Liste unterstützter Systeme führen. Cogniiq nimmt das eingesetzte Praxisverwaltungs- und Terminsystem im Erstgespräch auf und prüft vor dem Angebot, ob eine geeignete Schnittstelle existiert, ob Zugang oder Partnerfreigabe erreichbar ist, welche Vorgänge sie zulässt und ob Dritte dafür Gebühren verlangen. Trägt die Prüfung, werden Termine und Ergebnisse direkt in das bestehende System übergeben. Trägt sie nicht, wird der Übergabeweg vorher festgelegt und das Ergebnis steht strukturiert im Dashboard. In beiden Fällen stehen der vereinbarte Umfang und die dafür bekannten Kosten im Angebot, bevor unterschrieben wird. DSGVO-Konformität ist dabei nicht optional, sondern Pflicht.",
      },
      {
        type: "callout",
        calloutType: "info",
        content:
          "Wichtig: Klären Sie vor der Auswahl, wo verarbeitet wird, welche Unterauftragsverarbeiter beteiligt sind, was aufgezeichnet und gespeichert wird und ob ein Auftragsverarbeitungsvertrag nach Art. 28 DSGVO gestellt wird.",
      },
      {
        type: "h2",
        heading: "Kosten und ROI in der Praxis",
        content:
          "Was ein KI-Telefonassistent für Ihre Praxis kostet, hängt vom Anrufaufkommen ab; die aktuellen Tarife stehen auf der Kostenseite. Demgegenüber stehen entlastete Personalstunden sowie Patienten, die sonst zur Konkurrenz wechseln würden. Wann sich das rechnet, hängt von Anrufaufkommen und Praxisstruktur ab – rechnen Sie mit Ihren eigenen Zahlen.",
      },
      {
        type: "table",
        heading: "Vergleich: Rezeptionskraft vs. KI-Telefonassistent",
        rows: [
          { label: "Erreichbarkeit", value: "Rezeption: Mo–Fr 8–17 Uhr | KI: auch außerhalb der Öffnungszeiten" },
          { label: "Reaktionszeit", value: "Rezeption: je nach Auslastung Warteschleife | KI: ohne Warteschleife" },
          { label: "Parallelgespräche", value: "Rezeption: 1 | KI: mehrere gleichzeitig" },
          { label: "DSGVO-Protokoll", value: "Manuell | Automatisch" },
        ],
      },
      {
        type: "h2",
        heading: "Fazit: Wann lohnt sich der KI-Telefonassistent für Arztpraxen?",
        content:
          "Wenn in Ihrer Praxis regelmäßig Anrufe unbeantwortet bleiben und Ihre Rezeptionskraft überlastet ist, kann ein KI-Telefonassistent spürbar entlasten. Besonders in der Hochsaison – Grippezeit, Impfkampagnen – ist die Entlastung messbar.",
      },
    ],
    faqItems: [
      {
        question: "Kann der KI-Telefonassistent wirklich Termine direkt buchen?",
        answer:
          "Das hängt an Ihrer Praxissoftware, und genau das prüfen wir vor dem Angebot: geeignete Schnittstelle vorhanden, Zugang oder Freigabe erreichbar, welche Vorgänge möglich sind, welche Kosten Dritte dafür berechnen. Trägt die Prüfung, bucht das System direkt in Ihr Praxisverwaltungssystem. Trägt sie nicht, nimmt es den Terminwunsch strukturiert auf und Ihr Team übernimmt ihn aus dem Dashboard. Das Ergebnis der Prüfung steht im Angebot, mit allen dafür bekannten Kosten für den vereinbarten Umfang.",
      },
      {
        question: "Was passiert bei Notfällen?",
        answer:
          "Das System erkennt Notfallsignale in der Sprache des Anrufenden und leitet sofort ans Team weiter oder wählt einen festgelegten Notfallkontakt.",
      },
      {
        question: "Sprechen Patienten lieber mit einem Menschen?",
        answer:
          "Das ist unterschiedlich. Die Akzeptanz steigt deutlich, wenn die Praxis den Assistenten selbst ankündigt, das System schnell und korrekt reagiert und jederzeit ein klarer Weg zu einem Menschen offensteht.",
      },
    ],
    relatedSlugs: [
      "ki-automatisierung-kleine-unternehmen",
      "verpasste-anrufe-kosten",
      "ki-telefonassistent-restaurant",
    ],
    canonical: "https://cogniiq.de/blog/ki-telefonassistent-arztpraxis",
    serviceLinks: [
      { label: "KI Telefonassistent für Praxen", href: "/praxen", note: "Anrufannahme mit Ihren Ansagen und Regeln, strukturierte Übergabe an das Praxisteam." },
      { label: "KI-Telefonassistent in der Praxis einführen", href: "/ki-telefonassistent-einfuehren", note: "Der Ablauf von der Rufumleitung bis zur Freigabe, Schritt für Schritt." },
    ],
  },
  {
    slug: "webdesign-konversion-tipps",
    title: "Webdesign für mehr Anfragen: 8 Konversionsfaktoren, die wirklich zählen",
    metaTitle: "Webdesign für mehr Anfragen & Konversion | 8 Tipps",
    metaDescription:
      "Warum viele Unternehmenswebsites keine Anfragen generieren – und wie Sie mit gezielten Webdesign-Entscheidungen die Konversionsrate deutlich steigern können.",
    category: "Webdesign",
    readingTime: 8,
    publishedAt: "2025-02-03",
    updatedAt: "2026-09-05",
    excerpt:
      "Die meisten Unternehmenswebsites sind Visitenkarten – keine Verkaufsmaschinen. Dieser Artikel erklärt, welche acht Design- und Inhaltsentscheidungen den größten Einfluss auf Anfragen haben.",
    heroKeyword: "Webdesign Konversion",
    sections: [
      {
        type: "p",
        content:
          "Eine Website, die schön aussieht, aber keine Anfragen generiert, ist ein Kostenfaktor – keine Ressource. Viele B2B-Unternehmenswebsites machen aus ihren Besuchern nur selten Anfragen – gut optimierte Seiten erreichen deutlich mehr. Die Unterschiede liegen selten im Design, sondern in strategischen Entscheidungen zu Struktur, Text und Vertrauen.",
      },
      {
        type: "h2",
        heading: "1. Der Held-Abschnitt muss eine einzige Frage beantworten",
        content:
          "Der erste Bildschirm Ihrer Website hat nur wenige Sekunden, um den Besucher zu halten. Diese Zeit reicht für genau eine Botschaft: Was bieten Sie an, und warum ist das für mich relevant? Allgemeine Slogans wie 'Ihr Partner für Erfolg' schaffen keine Verbindung. Spezifische Versprechen wie 'Mehr Patienten durch eine Website, die in Google sichtbar ist' – schon.",
      },
      {
        type: "h2",
        heading: "2. Social Proof muss konkret und früh kommen",
        content:
          "Allgemeine Aussagen wie 'Seit Jahren vertrauen uns Unternehmen' wirken nicht. Konkrete Zahlen und Kundenzitate mit Name und Unternehmen wirken: Echte, belegbare Referenzen schaffen Vertrauen – erfundene zerstören es. Am wirkungsvollsten: ein Kundenzitat direkt unter der Hauptaussage – nicht erst nach drei Scroll-Ebenen.",
      },
      {
        type: "h2",
        heading: "3. Der CTA muss wissen, wen er ansprechen soll",
        content:
          "Ein 'Jetzt kontaktieren'-Button spricht niemanden spezifisch an. 'Kostenloses Analysegespräch sichern' oder 'Website-Check anfordern' adressieren eine konkrete Situation. Je klarer das angebotene nächste Schritt ist, desto höher die Klickrate.",
      },
      {
        type: "h2",
        heading: "4. Ladezeit ist ein Konversionsfaktor",
        content:
          "Jede Sekunde zusätzliche Ladezeit kostet Besucher und Anfragen. Eine Website, die auf dem Desktop schnell lädt, aber auf dem Smartphone spürbar länger braucht, verliert einen großen Teil ihrer mobilen Besucher. Core Web Vitals sind kein technischer Luxus – sie sind Umsatz.",
      },
      {
        type: "h2",
        heading: "5. Vertrauenssignale müssen spezifisch sein",
        content:
          "Zertifikate, Auszeichnungen, Mitgliedschaften in Berufsverbänden, Presseerwähnungen – all das wirkt. Wichtiger als die Menge ist die Glaubwürdigkeit. Verlinkte, verifizierbare Auszeichnungen überzeugen mehr als anonyme Logos.",
      },
      {
        type: "h2",
        heading: "6. Mobile First ist keine Option",
        content:
          "Ein großer Teil des Web-Traffics kommt heute von mobilen Geräten. Wer sein Webdesign noch von Desktop auf Mobile anpasst, denkt rückwärts. Konversionsorientiertes Design startet mit dem Smartphone-Erlebnis und erweitert es für größere Bildschirme.",
      },
      {
        type: "h2",
        heading: "7. Navigationskomplexität tötet Anfragen",
        content:
          "Jede unnötige Navigationsoption ist eine Ablenkung von der einen Handlung, die Sie vom Besucher wollen. Landing Pages mit einer einzigen klaren Handlungsaufforderung konvertieren in der Regel deutlich besser als vollständige Unternehmenswebsites.",
      },
      {
        type: "h2",
        heading: "8. Formulare müssen kurz und eindeutig sein",
        content:
          "Jedes zusätzliche Pflichtfeld in einem Kontaktformular senkt die Ausfüllrate spürbar. Name, E-Mail und ein offenes Feld für das Anliegen sind in den meisten Fällen ausreichend für eine erste Kontaktaufnahme. Alle weiteren Informationen können im Gespräch geklärt werden.",
      },
      {
        type: "callout",
        calloutType: "tip",
        content:
          "A/B-Test-Tipp: Testen Sie zuerst Ihren CTA-Text. Das ist die einfachste Änderung mit dem schnellsten messbaren Effekt auf Anfragen.",
      },
    ],
    faqItems: [
      {
        question: "Was kostet eine konversionsorientierte Unternehmenswebsite?",
        answer:
          "Professionelle konversionsorientierte Websites für kleine und mittlere Unternehmen liegen in Deutschland bei 2.500 bis 8.000 €, je nach Umfang und Funktionen.",
      },
      {
        question: "Wie lange dauert es, bis eine neue Website Anfragen generiert?",
        answer:
          "Über bezahlte Kanäle (Google Ads) sofort. Über organische Suche (SEO) in der Regel drei bis sechs Monate, je nach Wettbewerb.",
      },
    ],
    relatedSlugs: [
      "lokales-seo-unternehmen",
      "ki-automatisierung-kleine-unternehmen",
      "website-ohne-anfragen",
    ],
    canonical: "https://cogniiq.de/blog/webdesign-konversion-tipps",
    serviceLinks: [
      { label: "Webdesign von Cogniiq", href: "/webdesign", note: "Websites, die auf Anfragen ausgelegt sind – Struktur, Ladezeit und Nutzerführung." },
      { label: "Website bringt keine Anfragen?", href: "/keine-anfragen-website", note: "Die typischen Ursachen im Überblick und was sich daran ändern lässt." },
    ],
  },
  {
    slug: "lokales-seo-unternehmen",
    title: "Lokales SEO für Unternehmen: Wie Sie in Google Maps und lokalen Suchen erscheinen",
    metaTitle: "Lokales SEO für Unternehmen | Google Maps & lokale Suche",
    metaDescription:
      "Lokales SEO erklärt: Wie Unternehmen in Google Maps sichtbar werden, welche Faktoren wirklich zählen und welche Fehler die meisten Betriebe machen.",
    category: "Local SEO",
    readingTime: 10,
    publishedAt: "2025-02-10",
    updatedAt: "2026-09-05",
    excerpt:
      "Wenn jemand 'Zahnarzt Bayreuth' oder 'Restaurant München Innenstadt' googelt, erscheinen die ersten drei Ergebnisse in einem Kartenblock. Wer dort nicht ist, existiert für diesen Suchenden nicht.",
    heroKeyword: "Lokales SEO Unternehmen",
    sections: [
      {
        type: "p",
        content:
          "Ein erheblicher Teil aller Google-Suchen hat einen lokalen Bezug. Und lokale Suchanfragen auf dem Smartphone führen oft schon kurz darauf zu einem Besuch oder Kontakt. Lokales SEO ist für ortsgebundene Unternehmen damit wichtiger als jede andere Marketingmaßnahme.",
      },
      {
        type: "h2",
        heading: "Was lokales SEO von klassischem SEO unterscheidet",
        content:
          "Klassisches SEO zielt darauf ab, für bestimmte Keywords auf google.de zu ranken. Lokales SEO zielt auf die 'Local Pack' – die Kartenbox, die bei lokalen Suchanfragen erscheint – sowie auf Suchen mit Ortsbezug (z. B. 'Steuerberater in Regensburg'). Die Rankingfaktoren überschneiden sich, aber lokale Signale wie der Google Business-Eintrag, Bewertungen und NAP-Konsistenz spielen eine größere Rolle.",
      },
      {
        type: "ul",
        heading: "Die wichtigsten Rankingfaktoren für lokales SEO",
        items: [
          "Google Business Profile: Vollständigkeit, Aktualität, Kategorie, Fotos",
          "Bewertungen: Anzahl, Durchschnittswert, Antwortrate",
          "NAP-Konsistenz: Name, Adresse und Telefonnummer müssen überall identisch sein",
          "Lokale Backlinks: Erwähnungen in regionalen Medien, Branchenverzeichnissen",
          "On-Page-Optimierung: Standort-Keywords in Titel, H1 und Text",
          "Entfernung: Physische Nähe des Unternehmens zur Suchanfrage",
          "Mobile Nutzbarkeit: Da lokale Suchen mehrheitlich mobil sind",
        ],
      },
      {
        type: "h2",
        heading: "Google Business Profile: Die wichtigste Stellschraube",
        content:
          "Das Google Business Profile (früher: Google My Business) ist der wichtigste Hebel im lokalen SEO. Ein vollständig ausgefülltes Profil mit korrekter Kategorie, aktuellen Öffnungszeiten, hochwertigen Fotos und regelmäßigen Posts erhält deutlich mehr Interaktionen als ein unvollständiges Profil.",
      },
      {
        type: "ol",
        heading: "Checkliste: Google Business Profile optimieren",
        items: [
          "Primärkategorie korrekt wählen (z. B. 'Allgemeinmediziner', nicht nur 'Arzt')",
          "Adresse, Telefonnummer und Öffnungszeiten vollständig eintragen",
          "Mindestens 10 hochwertige Fotos hochladen (Innen, Außen, Team, Produkte)",
          "Beschreibung mit relevanten Keywords und Stadtbezug verfassen",
          "Wöchentlich Google-Posts veröffentlichen (Angebote, Neuigkeiten, Ereignisse)",
          "Bewertungen aktiv anfragen und konsequent beantworten",
          "Fragen & Antworten pflegen",
        ],
      },
      {
        type: "h2",
        heading: "NAP-Konsistenz: Der unterschätzte Faktor",
        content:
          "NAP steht für Name, Address, Phone. Wenn Ihr Unternehmen unter verschiedenen Namen oder Adressen in verschiedenen Verzeichnissen (Yelp, Gelbe Seiten, Branchenbuch.de) gelistet ist, sendet das widersprüchliche Signale an Google. Eine NAP-Bereinigung aller relevanten Einträge ist oft der schnellste Weg zu besseren lokalen Rankings.",
      },
      {
        type: "h2",
        heading: "Bewertungsmanagement: Quantität und Qualität",
        content:
          "Unternehmen mit einer soliden Zahl authentischer Google-Bewertungen und einem guten Durchschnittswert erscheinen häufiger in der Local Pack als Konkurrenten mit wenigen Bewertungen. Automatisierte Bewertungsanfragen (per SMS oder E-Mail nach einem Kauf oder Termin) sind erlaubt und effektiv.",
      },
      {
        type: "callout",
        calloutType: "warning",
        content:
          "Achtung: Das Kaufen von Bewertungen oder das Erstellen gefälschter Rezensionen verstößt gegen die Google-Richtlinien und kann zur dauerhaften Sperrung des Profils führen.",
      },
      {
        type: "h2",
        heading: "Lokale Backlinks aufbauen",
        content:
          "Ein Link von der Website der lokalen IHK, einer regionalen Tageszeitung oder eines Branchenverbands ist im lokalen SEO oft mehr wert als zehn allgemeine Backlinks. Strategien dazu: Pressearbeit, Sponsoring lokaler Veranstaltungen, Mitgliedschaften in Berufsverbänden und Gastbeiträge in regionalen Medien.",
      },
    ],
    faqItems: [
      {
        question: "Wie lange dauert es, bis lokale SEO-Maßnahmen wirken?",
        answer:
          "Erste Effekte (z. B. mehr Profilaufrufe) sind nach zwei bis vier Wochen sichtbar. Signifikante Ranking-Verbesserungen zeigen sich nach drei bis sechs Monaten.",
      },
      {
        question: "Muss ich für jede Stadt eine eigene Website haben?",
        answer:
          "Nein. Für mehrere Standorte empfehlen sich separate Standortseiten auf derselben Domain (z. B. cogniiq.de/bayreuth) anstelle mehrerer Domains.",
      },
      {
        question: "Welche Verzeichnisse sind für Deutschland besonders wichtig?",
        answer:
          "Google Business, Yelp, Das Örtliche, Gelbe Seiten, Branchenbuch.de, Bing Places und branchenspezifische Portale (z. B. jameda für Ärzte, trivago für Hotels).",
      },
    ],
    relatedSlugs: [
      "webdesign-konversion-tipps",
      "ki-automatisierung-kleine-unternehmen",
      "website-ohne-anfragen",
    ],
    canonical: "https://cogniiq.de/blog/lokales-seo-unternehmen",
    serviceLinks: [
      { label: "Lokales SEO in Bayreuth", href: "/bayreuth/lokales-seo", note: "Google-Unternehmensprofil, lokale Landingpages und Bewertungen für Betriebe in Bayreuth." },
      { label: "Webdesign von Cogniiq", href: "/webdesign", note: "Die Website als Grundlage lokaler Sichtbarkeit." },
    ],
  },
  {
    slug: "prozessautomatisierung-roi",
    title: "Prozessautomatisierung ROI: So messen Sie den echten Nutzen",
    metaTitle: "Prozessautomatisierung ROI berechnen | Leitfaden",
    metaDescription:
      "Wie Sie den Return on Investment einer Prozessautomatisierung korrekt berechnen – mit Formel, konkreten Beispielen und typischen Kostenfallen.",
    category: "KI-Automatisierung",
    readingTime: 7,
    publishedAt: "2025-02-17",
    updatedAt: "2026-09-05",
    excerpt:
      "Viele Unternehmen scheuen die Investition in Automatisierung, weil sie den Nutzen nicht greifbar machen können. Dieser Artikel zeigt, wie ein einfaches ROI-Modell in unter 30 Minuten aufgestellt werden kann.",
    heroKeyword: "Prozessautomatisierung ROI",
    sections: [
      {
        type: "p",
        content:
          "Eine Automatisierungsinvestition zu rechtfertigen ist intern oft schwieriger als die technische Umsetzung. Das liegt daran, dass Zeitersparnis und Fehlerreduktion selten in Euro ausgedrückt werden. Mit einem einfachen Framework lässt sich das ändern.",
      },
      {
        type: "h2",
        heading: "Die ROI-Formel für Automatisierungsprojekte",
        content:
          "ROI (%) = ((Gesamtnutzen in € – Gesamtkosten in €) / Gesamtkosten in €) × 100. Der Gesamtnutzen setzt sich zusammen aus: Eingesparte Arbeitsstunden × Stundensatz + vermiedene Fehlerkosten + Umsatzsteigerung durch schnellere Prozesse. Die Gesamtkosten umfassen: Einmalige Einrichtungskosten + monatliche Betriebskosten über den Betrachtungszeitraum.",
      },
      {
        type: "h2",
        heading: "Schritt 1: Zeitersparnis messen",
        content:
          "Starten Sie mit einer Zeiterfassung: Wie viele Minuten pro Vorgang × wie viele Vorgänge pro Woche. Multiplizieren Sie das mit 52 (Wochen/Jahr) und mit dem internen Stundensatz der betroffenen Person. Ein frei erfundenes Rechenbeispiel – setzen Sie Ihre eigenen Werte ein: 15 Minuten pro Rechnungsversand × 60 Rechnungen/Monat × 12 Monate × 35 €/Stunde = 6.300 € Jahresersparnis.",
      },
      {
        type: "h2",
        heading: "Schritt 2: Fehlerkosten einrechnen",
        content:
          "Manuelle Prozesse sind fehleranfällig. Jeder Fehler kostet Zeit zur Korrektur, manchmal Kundenvertrauen und gelegentlich direkte Kosten (z. B. falsch versandte Rechnungen, doppelte Buchungen). Diese Kosten werden bei der ROI-Berechnung oft vergessen.",
      },
      {
        type: "h2",
        heading: "Schritt 3: Indirekte Nutzen bewerten",
        content:
          "Schnellere Prozesse bedeuten schnellere Reaktion auf Kundenanfragen, was die Abschlusswahrscheinlichkeit erhöht. Wer auf eine Anfrage schnell antwortet, hat deutlich bessere Chancen auf den Abschluss als wer erst nach 24 Stunden reagiert.",
      },
      {
        type: "table",
        heading: "Frei erfundenes Rechenbeispiel Terminautomatisierung – setzen Sie Ihre eigenen Werte ein",
        rows: [
          { label: "Manueller Aufwand vorher", value: "8 Std./Woche × 40 €/Std. = 320 €/Woche" },
          { label: "Jahreskosten manuell", value: "16.640 €" },
          { label: "Einrichtungskosten Automatisierung", value: "1.200 €" },
          { label: "Jährliche Betriebskosten", value: "1.800 €/Jahr" },
          { label: "Jahresersparnis", value: "16.640 – 3.000 = 13.640 €" },
          { label: "ROI Jahr 1", value: "355 %" },
        ],
      },
      {
        type: "h2",
        heading: "Häufige Kostenfallen bei Automatisierungsprojekten",
        content:
          "Unterschätzte Integrationsarbeit, mangelnde Dokumentation und fehlender Support sind die häufigsten Kostentreiber. Wer bei einem Dienstleister kauft, sollte auf Pauschalen statt Stundenabrechnung für laufende Anpassungen bestehen.",
      },
      {
        type: "callout",
        calloutType: "tip",
        content:
          "Berechnen Sie den ROI immer für 12 Monate und 24 Monate. Viele Projekte rechnen sich erst im zweiten Jahr richtig – was trotzdem eine sehr gute Investition ist.",
      },
    ],
    faqItems: [
      {
        question: "Was ist ein guter ROI für ein Automatisierungsprojekt?",
        answer:
          "Das lässt sich nicht pauschal beziffern – der erreichbare ROI hängt von Prozess, Volumen und Stundensätzen ab. Rechnen Sie mit Ihren eigenen Zahlen über 12 und 24 Monate.",
      },
      {
        question: "Wie berechne ich den internen Stundensatz?",
        answer:
          "Bruttogehalt + Arbeitgeberanteil Sozialversicherung + anteilige Gemeinkosten, dividiert durch tatsächliche Arbeitsstunden pro Jahr (ca. 1.600–1.800 bei Vollzeit).",
      },
    ],
    relatedSlugs: [
      "ki-automatisierung-kleine-unternehmen",
      "ki-telefonassistent-arztpraxis",
      "digitalisierung-mittelstand",
    ],
    canonical: "https://cogniiq.de/blog/prozessautomatisierung-roi",
    serviceLinks: [
      { label: "Prozessautomatisierung für Unternehmen", href: "/prozessautomatisierung", note: "Welche Abläufe Cogniiq automatisiert und wie ein Projekt abläuft." },
      { label: "Was kostet Automatisierung?", href: "/kosten-automatisierung", note: "Die Kostenseite der ROI-Rechnung: Einrichtung, Betrieb, Abhängigkeiten." },
    ],
  },
  {
    slug: "verpasste-anrufe-kosten",
    title: "Was verpasste Anrufe Ihr Unternehmen wirklich kosten – eine Kalkulation",
    metaTitle: "Verpasste Anrufe Kosten berechnen | KI-Telefonassistent",
    metaDescription:
      "Wie teuer sind verpasste Anrufe wirklich? Eine ehrliche Kalkulation zum Nachrechnen mit eigenen Zahlen – und wie ein KI-Telefonassistent dagegen hilft.",
    category: "KI-Telefonassistent",
    readingTime: 6,
    publishedAt: "2025-02-24",
    updatedAt: "2026-09-05",
    excerpt:
      "Was ein verpasster Anruf kostet, hängt vom Auftragswert ab – rechnen Sie mit Ihren eigenen Zahlen. Dieser Artikel zeigt, wie die Kalkulation funktioniert.",
    heroKeyword: "verpasste Anrufe Kosten",
    sections: [
      {
        type: "p",
        content:
          "Die meisten Unternehmen wissen nicht, wie viele Anrufe sie täglich verpassen. Ein Anrufbeantworter gibt keine Statistiken. Ein KI-System hingegen protokolliert die angenommenen Gespräche – und macht damit sichtbar, wie viele Anrufe sonst verloren gingen.",
      },
      {
        type: "h2",
        heading: "Die Kalkulation: Was kostet ein verpasster Anruf?",
        content:
          "Der Wert eines verpassten Anrufs hängt von Ihrer Branche und Ihrem durchschnittlichen Auftragswert ab. Die Grundformel lautet: (Abschlusswahrscheinlichkeit bei Anrufannahme) × (durchschnittlicher Auftragswert) × (Anteil Neukunden unter den Anrufenden).",
      },
      {
        type: "table",
        heading: "Beispielrechnung mit frei gewählten Werten – setzen Sie Ihre eigenen ein",
        rows: [
          { label: "Arztpraxis (Neupatienten)", value: "60 € × 12 Monate Ø-Umsatz = 720 € pro verlorenem Patient" },
          { label: "Handwerk (Neukunde)", value: "Ø-Auftrag 1.200 € × 40% Abschlussrate = 480 € pro Anruf" },
          { label: "Immobilienmakler", value: "Ø-Provision 8.000 € × 20% = 1.600 € pro verpasstem Anruf" },
          { label: "Restaurant (Reservierung)", value: "Ø-Tisch 80 € × 3 Besuche/Jahr = 240 € pro verpasstem Tisch" },
        ],
      },
      {
        type: "h2",
        heading: "Warum Unternehmen Anrufe verpassen",
        content:
          "Die häufigsten Gründe: Stoßzeiten morgens und über Mittagspause, Urlaubszeiten, Meetings, parallele Anrufe und schlicht zu wenig Personal für die Anrufmenge. Besonders kritisch: In vielen Branchen ruft ein potenzieller Neukunde zwei oder drei Mitbewerber an – wer zuerst antwortet, bekommt oft den Auftrag.",
      },
      {
        type: "callout",
        calloutType: "warning",
        content:
          "Wer nicht zeitnah zurückgerufen wird, ruft oft schon kurz darauf beim nächsten Anbieter an – der erste erreichbare Betrieb ist klar im Vorteil.",
      },
      {
        type: "h2",
        heading: "Wie ein KI-Telefonassistent den Verlust stoppt",
        content:
          "Ein KI-Telefonassistent nimmt Anrufe ohne Warteschleife an – auch zu Stoßzeiten und bei parallelen Gesprächen. Er qualifiziert den Anruf, bucht Termine direkt und gibt kritische Informationen sofort weiter. Das Ergebnis: Anrufe werden angenommen statt verpasst.",
      },
      {
        type: "h2",
        heading: "Die Schwellenwertberechnung",
        content:
          "Ab wie vielen verpassten Anrufen pro Monat rechnet sich ein KI-Telefonassistent? Ein frei erfundenes Rechenbeispiel – setzen Sie Ihre eigenen Werte ein: Bei einem monatlichen Systempreis von 300 € und einem angenommenen Anrufwert von 150 € würde sich die Investition bei zwei zusätzlich gewonnenen Aufträgen pro Monat rechnen.",
      },
    ],
    faqItems: [
      {
        question: "Wie finde ich heraus, wie viele Anrufe ich verpasse?",
        answer:
          "Die meisten Telefonanlagen zeigen verpasste Anrufstatistiken. Alternativ können auch Mobilfunkanbieter Gesprächsstatistiken liefern. Ein KI-System protokolliert die angenommenen Gespräche mit Zeitstempel.",
      },
      {
        question: "Gilt die Kalkulation auch für Bestandskunden?",
        answer:
          "Ja. Unzureichende Erreichbarkeit bei Bestandskunden führt zu Abwanderung und negativen Bewertungen, was ebenfalls messbaren Umsatzverlust bedeutet.",
      },
    ],
    relatedSlugs: [
      "ki-telefonassistent-arztpraxis",
      "ki-automatisierung-kleine-unternehmen",
      "ki-telefonassistent-restaurant",
    ],
    canonical: "https://cogniiq.de/blog/verpasste-anrufe-kosten",
    serviceLinks: [
      { label: "KI Telefonassistent", href: "/ki-telefonassistent", note: "Erreichbar, wenn niemand abnehmen kann – konfiguriert auf Ihren Betrieb." },
      { label: "Verpasste Anrufe kosten Umsatz", href: "/verpasste-anrufe-verlust", note: "Wo Anrufe verloren gehen und welche Gegenmaßnahmen sich rechnen." },
    ],
  },
  {
    slug: "ki-telefonassistent-restaurant",
    title: "KI-Telefonassistent für Restaurants: Mehr Reservierungen, weniger Arbeit",
    metaTitle: "KI-Telefonassistent Restaurant | Reservierungen automatisieren",
    metaDescription:
      "Wie Restaurants mit einem KI-Telefonassistenten Reservierungen automatisch annehmen, Wartelisten führen und Gäste nachqualifizieren – ohne zusätzliches Personal.",
    category: "KI-Telefonassistent",
    readingTime: 6,
    publishedAt: "2025-03-03",
    updatedAt: "2026-09-05",
    excerpt:
      "Freitagabend, 19 Uhr: Das Restaurant ist voll, das Telefon klingelt, aber das Team hat beide Hände voll. Ein KI-Telefonassistent nimmt die Anrufe an, die sonst verloren gingen – auch in der Stoßzeit.",
    heroKeyword: "KI-Telefonassistent Restaurant",
    sections: [
      {
        type: "p",
        content:
          "In der Gastronomie ist das Telefon für viele Gäste noch immer der bevorzugte Reservierungskanal. Gleichzeitig ist es in Stoßzeiten das am schwersten zu managende Medium. Ein KI-Telefonassistent schließt diese Lücke ohne zusätzliches Personal.",
      },
      {
        type: "h2",
        heading: "Was der KI-Telefonassistent für Restaurants leistet",
        content:
          "Das System nimmt Reservierungsanfragen an, prüft verfügbare Tische in Echtzeit (bei Integration mit dem Reservierungssystem), bestätigt die Buchung und sendet eine automatische Erinnerung am Vortag. Zusätzlich beantwortet es Standardfragen zu Öffnungszeiten, Parkmöglichkeiten, Allergien und Menükarten.",
      },
      {
        type: "ul",
        heading: "Typische Anrufgründe im Restaurant (und KI-Abdeckung)",
        items: [
          "Reservierung anfragen → in der Regel automatisierbar",
          "Tisch für größere Gruppe anfragen → meist automatisierbar",
          "Öffnungszeiten erfragen → in der Regel automatisierbar",
          "Menü erfragen → in der Regel automatisierbar (mit Menülink oder Vorlesen)",
          "Reservierung stornieren → in der Regel automatisierbar",
          "Besondere Wünsche (z. B. Geburtstagsdeko) → Weiterleitung ans Team",
          "Catering-Anfrage → Weiterleitung ans Team",
        ],
      },
      {
        type: "h2",
        heading: "Integration mit Reservierungssystemen",
        content:
          "Ob sich ein bestehendes Reservierungssystem anbinden lässt, hängt von dessen Schnittstelle ab und wird vor der Beauftragung geprüft. Ohne Anbindung nimmt der Assistent die Reservierung strukturiert auf, und das Team überträgt sie.",
      },
      {
        type: "h2",
        heading: "No-Show-Prävention durch automatische Erinnerungen",
        content:
          "No-Shows kosten Restaurants bares Geld. Der KI-Assistent sendet automatisch 24 Stunden vor der Reservierung eine Erinnerung per SMS oder WhatsApp und ermöglicht die einfache Stornierung – Erinnerungen am Vortag wirken No-Shows entgegen.",
      },
      {
        type: "table",
        heading: "Vergleich: Ohne vs. mit KI-Telefonassistent",
        rows: [
          { label: "Anrufannahme Stoßzeiten", value: "Ohne: Warteschleife/Beantworter | Mit KI: sofort" },
          { label: "Reservierungen außerhalb Öffnungszeit", value: "Ohne: nicht möglich | Mit KI: möglich" },
          { label: "No-Show-Prävention", value: "Ohne: keine systematische Erinnerung | Mit KI: automatische Erinnerung am Vortag" },
          { label: "Personalaufwand Telefon", value: "Ohne: hoch, besonders in Stoßzeiten | Mit KI: deutlich reduziert" },
        ],
      },
      {
        type: "callout",
        calloutType: "tip",
        content:
          "Tipp für die Einführung: Starten Sie mit dem KI-System als Overflow-Kanal, der nur dann antwortet, wenn alle Leitungen belegt sind. So gewinnen Sie Erfahrung ohne Risiko.",
      },
    ],
    faqItems: [
      {
        question: "Versteht der KI-Telefonassistent Dialekte oder Akzente?",
        answer:
          "Moderne Sprachmodelle verstehen Hochdeutsch, regionale Dialekte und häufige Akzente zuverlässig. Bei Verständnisproblemen leitet das System automatisch ans Team weiter.",
      },
      {
        question: "Was passiert, wenn ein Tisch nicht verfügbar ist?",
        answer:
          "Das System bietet alternative Zeiten an, trägt den Gast auf eine Warteliste ein oder empfiehlt einen Folgetermin – automatisch nach Ihren Vorgaben.",
      },
    ],
    relatedSlugs: [
      "verpasste-anrufe-kosten",
      "ki-telefonassistent-arztpraxis",
      "ki-automatisierung-kleine-unternehmen",
    ],
    canonical: "https://cogniiq.de/blog/ki-telefonassistent-restaurant",
    serviceLinks: [
      { label: "KI-Telefonassistent für Restaurants", href: "/ki-telefonassistent-restaurant", note: "Reservierungsanfragen annehmen, auch während des Service." },
      { label: "KI Telefonassistent", href: "/ki-telefonassistent", note: "Funktionsweise, Grenzen und Einrichtung im Überblick." },
    ],
  },
  {
    slug: "website-ohne-anfragen",
    title: "Warum Ihre Website keine Anfragen bringt – und wie Sie das ändern",
    metaTitle: "Website bringt keine Anfragen? Ursachen & Lösungen",
    metaDescription:
      "Die häufigsten Gründe, warum Unternehmenswebsites keine Anfragen generieren – und konkrete Schritte, um das in wenigen Wochen zu ändern.",
    category: "Webdesign",
    readingTime: 7,
    publishedAt: "2025-03-06",
    updatedAt: "2026-09-05",
    excerpt:
      "Eine Website zu haben und eine Website zu haben, die Anfragen bringt, sind zwei verschiedene Dinge. Die meisten Unternehmenswebsites gehören zur ersten Kategorie.",
    heroKeyword: "Website keine Anfragen",
    sections: [
      {
        type: "p",
        content:
          "Viele deutsche KMU-Websites generieren keine messbaren Leads. Sie sind online präsent, aber unsichtbar für potenzielle Kunden – entweder weil niemand die Seite findet oder weil niemand, der sie findet, eine Anfrage stellt.",
      },
      {
        type: "h2",
        heading: "Problem 1: Die Website wird nicht gefunden",
        content:
          "Ohne SEO ist eine Website in Google auf Seite 5 oder schlechter. Die große Mehrheit der Klicks entfällt auf die erste Seite. Wenn Ihre Website für relevante Suchbegriffe nicht auf Seite 1 erscheint, existiert sie für die meisten potenziellen Kunden nicht.",
      },
      {
        type: "h2",
        heading: "Problem 2: Die Botschaft trifft nicht",
        content:
          "Viele Unternehmenswebsites kommunizieren primär, was das Unternehmen tut – nicht, was es für den Kunden löst. Die entscheidende Frage, die ein Besucher in den ersten Sekunden beantwortet haben möchte: 'Bin ich hier richtig für mein Problem?' Wer diese Frage nicht sofort klar beantwortet, verliert den Besucher.",
      },
      {
        type: "h2",
        heading: "Problem 3: Fehlende Vertrauenssignale",
        content:
          "Online kauft man von Unternehmen, denen man vertraut. Vertrauen entsteht durch konkrete Bewertungen (mit Namen), nachvollziehbare Referenzen, transparente Preise oder zumindest Preisindikatoren, klare Ansprechpartner (mit Foto) und erkennbare Qualitätsnachweise.",
      },
      {
        type: "h2",
        heading: "Problem 4: Zu viele Optionen, zu wenig Richtung",
        content:
          "Je mehr Navigationspunkte, Angebote und Handlungsaufforderungen eine Seite hat, desto weniger klickt der Besucher. Das 'Paradox of Choice' gilt auch im Web: Wer dem Besucher eine klare, einfache nächste Aktion anbietet, erhält mehr Reaktionen.",
      },
      {
        type: "h2",
        heading: "Problem 5: Das Formular ist zu umständlich",
        content:
          "Formulare mit vielen Feldern verlieren einen großen Teil ihrer potenziellen Ausfüller. Dazu kommen technische Hürden: CAPTCHA, mehrstufige Bestätigungen, Pflichtfelder ohne erkennbaren Nutzen. Ein gut gestaltetes Formular hat maximal drei Felder und erscheint auf jeder relevanten Unterseite.",
      },
      {
        type: "h2",
        heading: "Der Aktionsplan: Mehr Anfragen in 4 Wochen",
        content:
          "Woche 1: Google-Rankings prüfen (Google Search Console), Heatmap einrichten (z. B. Hotjar Free). Woche 2: Hauptbotschaft auf der Startseite überarbeiten, klaren CTA einführen. Woche 3: Formular vereinfachen, erste Kundenbewertungen einholen und einbinden. Woche 4: Google Business Profil optimieren, erste SEO-Anpassungen auf den meistbesuchten Seiten.",
      },
      {
        type: "callout",
        calloutType: "tip",
        content:
          "Schnelltest: Zeigen Sie Ihrer Website jemandem, der Ihr Unternehmen nicht kennt. Fragen Sie nach 15 Sekunden: Was macht dieses Unternehmen? Für welche Kunden? Und was soll ich jetzt tun? Wenn die Antworten nicht klar sind, ist Handlungsbedarf.",
      },
    ],
    faqItems: [
      {
        question: "Wie viele Anfragen sollte eine gute Unternehmenswebsite bringen?",
        answer:
          "Das hängt vom Traffic ab. Als grobe Faustregel: 1–3 % der Besucher stellen eine Anfrage. Bei 300 Besuchern/Monat wären das 3–9 Anfragen.",
      },
      {
        question: "Kann ich das selbst verbessern oder brauche ich eine Agentur?",
        answer:
          "Viele Optimierungen (Texte, CTA, Formular) sind ohne technische Kenntnisse umsetzbar. Für SEO und technische Performance empfiehlt sich professionelle Unterstützung.",
      },
    ],
    relatedSlugs: [
      "webdesign-konversion-tipps",
      "lokales-seo-unternehmen",
      "ki-automatisierung-kleine-unternehmen",
    ],
    canonical: "https://cogniiq.de/blog/website-ohne-anfragen",
    serviceLinks: [
      { label: "Website bringt keine Anfragen?", href: "/keine-anfragen-website", note: "Die Problemseite zum Thema mit konkreten Prüfpunkten." },
      { label: "Webdesign von Cogniiq", href: "/webdesign", note: "Websites, die auf Anfragen ausgelegt sind." },
    ],
  },
  {
    slug: "digitalisierung-mittelstand",
    title: "Digitalisierung im Mittelstand: Wo anfangen, was vermeiden",
    metaTitle: "Digitalisierung Mittelstand | Wo anfangen & was vermeiden",
    metaDescription:
      "Digitalisierung im deutschen Mittelstand: Ein praxisorientierter Einstiegsleitfaden, der zeigt, welche Maßnahmen wirklich Wirkung haben – und welche Fallen es zu vermeiden gilt.",
    category: "Digitalisierung",
    readingTime: 9,
    publishedAt: "2025-03-10",
    updatedAt: "2026-09-05",
    excerpt:
      "Viele Mittelständler wissen, dass sie digitalisieren müssen – aber nicht, womit sie anfangen sollen. Dieser Leitfaden gibt eine klare Priorisierung.",
    heroKeyword: "Digitalisierung Mittelstand",
    sections: [
      {
        type: "p",
        content:
          "Deutschland rangiert beim Digitalisierungsindex (DESI) der EU regelmäßig im Mittelfeld – trotz starker Wirtschaft und hoher Unternehmensdichte. Der Hauptgrund: Viele Mittelständler stehen vor dem Dilemma, nicht zu wissen, wo sie anfangen sollen, und scheuen gleichzeitig den Aufwand für große Transformationsprojekte.",
      },
      {
        type: "h2",
        heading: "Was Digitalisierung für den Mittelstand wirklich bedeutet",
        content:
          "Digitalisierung ist kein Projekt, das man einmal abschließt. Es ist ein kontinuierlicher Prozess der Verbesserung von Prozessen, Kommunikation und Kundenerlebnissen mithilfe digitaler Technologien. Der pragmatische Einstieg: Einen analogen Prozess digitalisieren, messen, nächsten Schritt machen.",
      },
      {
        type: "ul",
        heading: "Die fünf wirkungsstärksten Digitalisierungsmaßnahmen im Mittelstand",
        items: [
          "Digitales Angebots- und Rechnungswesen (statt Word-Dokumente per E-Mail)",
          "CRM-System einführen (Kundenkontakte strukturiert verwalten)",
          "Automatisierte Kommunikation (Terminbestätigung, Follow-up, Bewertungsanfragen)",
          "Website mit lokalem SEO (Neukunden über Suchmaschinen gewinnen)",
          "Digitale Terminbuchung (auch außerhalb der Öffnungszeiten, ohne Anruf)",
        ],
      },
      {
        type: "h2",
        heading: "Die häufigsten Digitalisierungsfehler",
        content:
          "Fehler 1: Mit dem komplexesten Problem anfangen. Digitalisierung sollte dort beginnen, wo der Schmerz am größten und die Lösung am einfachsten ist. Fehler 2: Tools kaufen ohne Prozessanalyse. Ein CRM-System nützt nichts, wenn der Vertriebsprozess nicht definiert ist. Fehler 3: Digitalisierung als IT-Projekt verstehen. Technologie ist Mittel, nicht Zweck. Fehler 4: Mitarbeitende nicht einbeziehen.",
      },
      {
        type: "h2",
        heading: "Der pragmatische Einstieg: Das 90-Tage-Modell",
        content:
          "In wenigen Monaten können viele Mittelständler drei messbare Digitalisierungsschritte umsetzen, wenn sie sich auf Impact-First konzentrieren: Was hat den größten Effekt bei geringstem Aufwand? Monat 1: Digitale Kommunikation automatisieren. Monat 2: Online-Sichtbarkeit verbessern. Monat 3: Ersten internen Prozess automatisieren.",
      },
      {
        type: "h2",
        heading: "Förderungen und Unterstützung für den Mittelstand",
        content:
          "Das Bundesministerium für Wirtschaft und Klimaschutz fördert Digitalisierungsmaßnahmen im Mittelstand über verschiedene Programme (z. B. Digital Jetzt, BAFA-Förderungen). Auch auf Landesebene gibt es in Bayern, Nordrhein-Westfalen und anderen Ländern spezifische Förderprogramme.",
      },
      {
        type: "h2",
        heading: "KI als Digitalisierungsbeschleuniger",
        content:
          "Künstliche Intelligenz ist nicht mehr Zukunft, sondern Gegenwart für den Mittelstand. KI-gestützte Telefonassistenten, automatische E-Mail-Antworten, Dokumentenverarbeitung und Prozessautomatisierung sind heute ohne eigenes IT-Team umsetzbar – und amortisieren sich schnell.",
      },
      {
        type: "callout",
        calloutType: "info",
        content:
          "Viele deutsche KMU arbeiten noch ohne CRM-System und wickeln Kundenkommunikation ausschließlich per E-Mail und Telefon ohne strukturierte Nachverfolgung ab.",
      },
    ],
    faqItems: [
      {
        question: "Wie viel Budget sollte ein Mittelständler für Digitalisierung einplanen?",
        answer:
          "Als grobe Faustregel werden oft 1–3 % des Jahresumsatzes genannt. Entscheidend ist weniger die Quote als der messbare Nutzen jeder einzelnen Maßnahme – rechnen Sie mit Ihren eigenen Zahlen.",
      },
      {
  question: "Welche Tools sind für den Einstieg empfehlenswert?",
  answer:
    "Für den Einstieg reichen wenige, sauber integrierte Systeme: ein CRM wie HubSpot oder Pipedrive, eine Buchhaltungslösung wie Lexoffice oder sevDesk, ein Terminbuchungssystem wie Calendly und individuelle KI-Automationen über n8n oder maßgeschneiderte Cogniiq-Workflows. Entscheidend ist nicht die Anzahl der Tools, sondern dass Prozesse messbar schneller, sauberer und profitabler werden.",
},
      {
        question: "Gibt es staatliche Förderungen für KMU-Digitalisierung?",
        answer:
          "Ja: Digital Jetzt (BMWK), BAFA-Beratungsförderung, KfW-Digitalisierungskredite und länderspezifische Programme. Eine aktuelle Übersicht bietet foerderland.de.",
      },
    ],
    relatedSlugs: [
      "ki-automatisierung-kleine-unternehmen",
      "prozessautomatisierung-roi",
      "webdesign-konversion-tipps",
    ],
    canonical: "https://cogniiq.de/blog/digitalisierung-mittelstand",
    serviceLinks: [
      { label: "Automatisierung für Unternehmen", href: "/automatisierung-unternehmen", note: "Wo Automatisierung im Mittelstand ansetzt und was Cogniiq dafür baut." },
      { label: "Prozessautomatisierung", href: "/prozessautomatisierung", note: "Abläufe aufnehmen, abbilden, automatisieren." },
    ],
  },
  {
    slug: "webdesign-agentur-auswahl",
    title: "Webdesign-Agentur auswählen: 7 Kriterien, die wirklich zählen",
    metaTitle: "Webdesign Agentur auswählen | 7 entscheidende Kriterien",
    metaDescription:
      "Wie finden Sie die richtige Webdesign-Agentur für Ihr Unternehmen? 7 konkrete Auswahlkriterien, die vor überteuerten Projekten und schlechten Ergebnissen schützen.",
    category: "Webdesign",
    readingTime: 7,
    publishedAt: "2025-03-13",
    updatedAt: "2026-09-05",
    excerpt:
      "Eine schlechte Wahl bei der Webdesign-Agentur kostet Zeit, Geld und Nerven. Diese sieben Kriterien helfen, die richtige Agentur zu finden – bevor der Vertrag unterschrieben ist.",
    heroKeyword: "Webdesign Agentur auswählen",
    sections: [
      {
        type: "p",
        content:
          "In Deutschland gibt es tausende Webdesign-Agenturen und Freelancer. Die Qualitätsunterschiede sind enorm: Von professionellen Agenturen mit klar definierten Prozessen bis zu Einzelpersonen mit WordPress-Template-Kenntnissen. Wer die falsche wählt, zahlt doppelt – für das erste Projekt und für die Überarbeitung.",
      },
      {
        type: "h2",
        heading: "Kriterium 1: Portfolio mit vergleichbaren Projekten",
        content:
          "Eine Agentur, die hauptsächlich E-Commerce-Projekte realisiert hat, ist nicht automatisch die beste Wahl für eine Dienstleistungswebsite mit Fokus auf Leadgenerierung. Das Portfolio sollte Projekte enthalten, die Ihrer Branche, Ihrem Ziel und Ihrer Unternehmensgröße ähneln.",
      },
      {
        type: "h2",
        heading: "Kriterium 2: SEO ist kein Add-on, sondern Grundlage",
        content:
          "Eine schöne Website, die in Google nicht gefunden wird, hat keinen Wert. Fragen Sie explizit: Wie sieht Ihre SEO-Strategie für neue Projekte aus? Wer antwortet mit 'das machen wir nach dem Launch' oder 'dafür brauchen Sie einen SEO-Spezialisten separat', signalisiert, dass SEO kein integraler Teil des Prozesses ist.",
      },
      {
        type: "h2",
        heading: "Kriterium 3: Ladezeit und Core Web Vitals",
        content:
          "Fragen Sie nach den durchschnittlichen Pagespeed-Scores ihrer Referenzprojekte. Seriöse Agenturen können Ihnen Google PageSpeed-Auswertungen zeigen und erklären, wie sie Performance sicherstellen.",
      },
      {
        type: "h2",
        heading: "Kriterium 4: Klare Projekt- und Kommunikationsstruktur",
        content:
          "Wie läuft das Projekt ab? Welche Meilensteine gibt es? Wer ist Ihr persönlicher Ansprechpartner? Wie kommuniziert die Agentur (E-Mail, Projektmanagement-Tool, wöchentliche Calls)? Unklare Antworten hier führen zu unklaren Projekten.",
      },
      {
        type: "h2",
        heading: "Kriterium 5: Transparente Preisstruktur",
        content:
          "Vage Angebote ('ab X €') führen zu unerwarteten Mehrkosten. Ein seriöses Angebot enthält: Gesamtpreis, Leistungsumfang (Anzahl Seiten, Funktionen), Zahlungsplan, Was ist nicht enthalten, Stundensatz für Zusatzleistungen.",
      },
      {
        type: "h2",
        heading: "Kriterium 6: Übergabe und Unabhängigkeit",
        content:
          "Was passiert, wenn Sie die Zusammenarbeit beenden möchten? Können Sie die Website selbst bearbeiten? Gehört der Code Ihnen? Diese Fragen schützen vor Lock-in-Situationen, in denen Sie dauerhaft auf die Agentur angewiesen sind.",
      },
      {
        type: "h2",
        heading: "Kriterium 7: Referenzgespräche führen",
        content:
          "Die aussagekräftigste Informationsquelle sind bestehende Kunden der Agentur. Fragen Sie direkt: Wurden Deadlines eingehalten? Wie war die Kommunikation? Würden Sie die Agentur weiterempfehlen? Seriöse Agenturen stellen Ihnen Referenzkunden zur Verfügung.",
      },
      {
        type: "callout",
        calloutType: "warning",
        content:
          "Warnsignale: Keine klaren Verträge, keine Meilensteine, Fullpayment vorab, fehlende schriftliche Leistungsbeschreibung, keine Antworten auf technische Fragen.",
      },
    ],
    faqItems: [
      {
        question: "Was kostet eine professionelle Unternehmenswebsite in Deutschland?",
        answer:
          "Für kleine Unternehmen: 1.500–4.000 € (Template-basiert). Für individuelle Designs mit SEO-Strategie: 3.500–10.000 €. Für komplexe Systeme: 10.000 €+.",
      },
      {
        question: "Sollte ich eine lokale Agentur oder eine deutschlandweit arbeitende Agentur wählen?",
        answer:
          "Für lokales SEO ist eine Agentur mit Expertise in Ihrer Region ein Vorteil. Remote-Zusammenarbeit funktioniert aber genauso gut, wenn Kommunikation und Prozesse klar definiert sind.",
      },
      {
        question: "Wie lange dauert eine neue Website?",
        answer:
          "Mit klarem Briefing und schnellen Feedbackprozessen: 4–8 Wochen. Komplexere Projekte: 8–16 Wochen.",
      },
    ],
    relatedSlugs: [
      "webdesign-konversion-tipps",
      "lokales-seo-unternehmen",
      "website-ohne-anfragen",
    ],
    canonical: "https://cogniiq.de/blog/webdesign-agentur-auswahl",
    serviceLinks: [
      { label: "Webdesign von Cogniiq", href: "/webdesign", note: "Wie Cogniiq Websites plant und umsetzt – zum Abgleich mit den sieben Kriterien." },
      { label: "Webdesign Kosten", href: "/kosten-webdesign", note: "Was eine professionelle Website kostet und wovon der Preis abhängt." },
    ],
  },
];

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return BLOG_ARTICLES.find((a) => a.slug === slug);
}

export function getRelatedArticles(slugs: string[]): BlogArticle[] {
  return slugs
    .map((s) => BLOG_ARTICLES.find((a) => a.slug === s))
    .filter(Boolean) as BlogArticle[];
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
}
