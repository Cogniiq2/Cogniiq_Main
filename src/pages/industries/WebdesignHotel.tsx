import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Webdesign für Hotels & Pensionen | Direktbuchungen steigern | Cogniiq",
    description: "Webdesign für Hotels: Mehr Direktbuchungen, weniger OTA-Provision. Hotel-Website mit Buchungssystem, Local SEO und überzeugender Zimmerpräsentation – damit Gäste direkt bei Ihnen buchen.",
    canonical: `${BUSINESS_INFO.website}/webdesign-hotel`,
    keywords: "Webdesign Hotel, Hotel Website erstellen, Pension Website, Direktbuchungen steigern, Webdesign Hotellerie",
  },
  h1: "Webdesign für Hotels & Pensionen",
  tagline: "Hotellerie · Direktbuchungen · weniger OTA-Abhängigkeit",
  intro: "Reisende vergleichen abends auf dem Sofa – oft zwischen Ihrer Website und dem Booking.com-Eintrag nebenan. Wer in diesem Moment nicht überzeugt, verliert die Buchung an die OTA. Mitsamt 18–25 % Provision. Eine starke Hotel-Website ist keine Ergänzung zum OTA-Auftritt – sie ist das Instrument, mit dem Direktbuchungen zurückgewonnen werden.",
  serviceSlug: "leistungen",
  serviceLabel: "Webdesign Leistungen",
  costLink: "/kosten-webdesign",
  costLinkLabel: "Webdesign Kosten",
  problems: [
    {
      title: "Jede OTA-Buchung kostet 18–25 % Provision",
      description: "Was wie ein Vertriebskanal aussieht, ist ein teurer Dauerzustand. Ein Hotel mit 25 Zimmern, das 60 % seiner Buchungen über OTAs abwickelt, zahlt auf Jahressicht oft fünfstellige Provisionen – für Buchungen, die ohne eigenen Webauftritt auch direkt hätten kommen können.",
    },
    {
      title: "Bei lokalen Suchanfragen erscheint die OTA-Seite, nicht das Hotel",
      description: "Sucht jemand nach 'Hotel Bayreuth Festspiele' oder 'Boutique Hotel München Altstadt', ranken Booking.com und Expedia meist vor der eigenen Website. Local SEO und strukturierte Google-Daten verschieben dieses Verhältnis.",
    },
    {
      title: "Das Direktbuchungssystem fehlt oder überzeugt nicht",
      description: "Hotels, die zwar eine Website haben, aber kein eingebettetes Buchungssystem, werden auf die OTA verwiesen – oft ungewollt durch eigene 'Jetzt buchen'-Buttons. Das Buchungssystem muss direkt, schnell und vertrauenswürdig sein.",
    },
    {
      title: "Zimmer werden nicht erlebt – sie werden aufgelistet",
      description: "Gäste buchen Atmosphäre, nicht Quadratmeter. Schlechte Fotos, generische Beschreibungen und fehlende Details zu Ausstattung und Lage machen Buchungen unwahrscheinlich – besonders im gehobenen Segment.",
    },
    {
      title: "Saisonale Buchungsspitzen werden verschenkt",
      description: "Messen, Festspiele, Feiertage und Events treiben die Suchnachfrage für Hotels in einer Stadt massiv. Wer für diese Suchbegriffe nicht sichtbar ist, überlässt die profitabelsten Nächte den Portalen.",
    },
    {
      title: "Gruppenanfragen und Events werden nicht systematisch erfasst",
      description: "Tagungen, Hochzeiten und Gruppenreisen haben höhere Durchschnittswerte als Einzelbuchungen – aber auch komplexere Anforderungen. Ohne strukturiertes Anfrage-Formular gehen diese Anfragen unter oder landen beim Wettbewerb.",
    },
  ],
  solution: {
    headline: "Eine Hotel-Website, die Direktbuchungen zurückholt.",
    text: "Cogniiq entwickelt Hotel-Websites, die Gäste überzeugen, bevor sie auf 'Weiter zu Booking.com' klicken. Mit eingebettetem Buchungssystem, überzeugender Zimmerpräsentation und Local SEO – damit Direktbuchungen nicht die Ausnahme sind, sondern die Regel.",
  },
  benefits: [
    "Integriertes Direktbuchungssystem – kein OTA-Umweg nötig",
    "Local SEO: sichtbar bei 'Hotel [Stadt]', 'Hotel [Anlass] [Stadt]'",
    "Zimmerpräsentation mit professioneller Galerie und Ausstattungsdetails",
    "Saisonale Seiten für Events, Messen und Festspiele",
    "Strukturiertes Gruppenanfrage-Formular mit automatischer Bestätigung",
    "Google Business Profil optimiert und mit Website synchronisiert",
    "DSGVO-konforme Gästedatenverarbeitung inklusive",
  ],
  workflow: {
    title: "Hotel-Website mit Direktbuchung – in drei Phasen",
    steps: [
      {
        step: "01",
        title: "Hotelmarke & Zielgruppenanalyse",
        description: "Wer bucht bei Ihnen – Urlauber, Geschäftsreisende, Eventgäste? Design und Struktur der Website werden auf Ihre tatsächliche Buchungssituation zugeschnitten, nicht auf ein generisches Hotel-Template.",
      },
      {
        step: "02",
        title: "Buchungssystem, Zimmerpräsentation & SEO",
        description: "Integration des Direktbuchungssystems (z. B. Little Hotelier, Booking Engine via Channel Manager), vollständige Zimmerpräsentation und Local SEO-Setup für Ihre wichtigsten Suchbegriffe.",
      },
      {
        step: "03",
        title: "Live schalten & Direktquote steigern",
        description: "Go-live mit vollständiger Einrichtung. Optionaler KI-Telefonassistent für Buchungsanrufe außerhalb der Rezeptionszeiten – damit keine Direktbuchung am Telefon verloren geht.",
      },
    ],
  },
  cityLinks: [
    { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
    { label: "Webdesign München", href: "/muenchen/webdesign" },
    { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
    { label: "Webdesign Bayern", href: "/bayern" },
    { label: "Webdesign Deutschland", href: "/webdesign-agentur-deutschland" },
  ],
  relatedLinks: [
    { label: "KI Telefonassistent Hotel", href: "/ki-telefonassistent-hotel" },
    { label: "Webdesign Gastronomie", href: "/webdesign-gastronomie" },
    { label: "Kosten Webdesign", href: "/kosten-webdesign" },
    { label: "Webdesign Immobilien", href: "/webdesign-immobilien" },
    { label: "Webdesign Sport", href: "/webdesign-sport" },
  ],
  faq: [
    {
      question: "Wie viel Provision kann durch mehr Direktbuchungen eingespart werden?",
      answer: "OTAs nehmen 18–25 % Provision pro Buchung. Ein Hotel mit 25 Zimmern, das seine Direktbuchungsquote von 20 % auf 35 % steigert, spart bei durchschnittlichem Zimmerpreis von 100 € und 250 Belegungstagen jährlich über 9.000 € an Provision – ohne zusätzliche Marketingkosten. Die Website amortisiert sich in der Regel innerhalb von 6–12 Monaten.",
    },
    {
      question: "Welches Buchungssystem integriert Cogniiq?",
      answer: "Wir arbeiten mit gängigen Buchungssystemen wie Little Hotelier, Beds24, Apaleo und eigenen Channel-Manager-Lösungen. Die Wahl richtet sich nach Ihrer Größe, bestehenden Systemen und Budget. Ziel ist immer: direkt buchbar, ohne OTA-Weiterleitung.",
    },
    {
      question: "Kann die Website für Gruppen, Tagungen und Events optimiert werden?",
      answer: "Ja. Anfrage-Formulare für Gruppen, Tagungspakete und Veranstaltungen lassen sich vollständig integrieren – mit automatischer Bestätigung, individuellen Anforderungsfeldern und optionalem Angebots-Workflow. Hochwertige Gruppenanfragen werden nicht mehr per E-Mail beantwortet, sondern strukturiert erfasst.",
    },
    {
      question: "Wie hilft Local SEO einem Hotel konkret?",
      answer: "Suchanfragen wie 'Hotel Bayreuth Festspielzeit' oder 'Boutique Hotel München Maxvorstadt' haben hohe Buchungsabsicht. Mit Local SEO und optimiertem Google Business Profil erscheinen Sie in genau diesen Suchen – nicht hinter dem OTA-Eintrag, sondern neben ihm. Saisonale Unterseiten verstärken das für Event- und Messezeiten.",
    },
    {
      question: "Ist die Hotel-Website mobiloptimiert?",
      answer: "Ja, und das ist nicht optional: Über 65 % aller Hotel-Buchungsrecherchen beginnen auf mobilen Geräten. Die Buchungsstrecke wird speziell auf mobile Nutzung optimiert – damit der Weg von 'Hotel gefunden' zu 'Buchung bestätigt' so kurz und reibungslos wie möglich ist.",
    },
  ],
};

export function WebdesignHotel() {
  return <NationalIndustryPage config={config} />;
}
