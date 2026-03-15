export const BUSINESS_INFO = {
  name: "Cogniiq",
  legalName: "Cogniiq – Lazar & Djordje Popovic",
  description: "AI Agentur und Webdesign Agentur in Bayreuth. Spezialisiert auf KI Automationen, AI Rezeptionistin und hochkonvertierende Websites für Unternehmen in Deutschland.",
  foundingDate: "2023",

  address: {
    streetAddress: "Am Main Straße 3",
    addressLocality: "Bayreuth",
    addressRegion: "Bayern",
    postalCode: "95444",
    addressCountry: "DE",
  },

  geo: {
    latitude: "49.948260",
    longitude: "11.578270",
  },

  contact: {
    phone: "+49 160 1832917",
    phoneDisplay: "0160 1832917",
    email: "info@cogniiq.de",
  },

  website: "https://cogniiq.de",

  founders: [
    {
      name: "Lazar Popovic",
      jobTitle: "Co-Founder, Webdesign & System Architecture",
    },
    {
      name: "Djordje Popovic",
      jobTitle: "Co-Founder, AI & Automation Specialist",
    },
  ],

  serviceAreas: [
    "Bayreuth",
    "München",
    "Nürnberg",
    "Regensburg",
    "Bamberg",
    "Würzburg",
    "Erlangen",
    "Fürth",
    "Ingolstadt",
    "Augsburg",
    "Bayern",
    "Deutschland",
  ],

  keywords: [
    "AI Agentur Deutschland",
    "Webdesign Agentur Bayreuth",
    "KI Automationen",
    "AI Rezeptionistin",
    "Prozessautomatisierung",
    "AI Chatbot für Unternehmen",
    "Webdesign für lokale Unternehmen",
    "Website Performance Optimierung",
  ],

  businessHours: {
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "09:00",
    closes: "18:00",
  },

  socialMedia: {
    linkedin: "",
    instagram: "",
    facebook: "",
  },

  priceRange: "€€€",
};

export const SERVICES = [
  {
    id: "webdesign",
    name: "Hochkonvertierende Websites",
    description: "Moderne, schnelle Websites mit Fokus auf Conversion und lokalem SEO – gebaut für Unternehmen, die Anfragen brauchen, nicht nur Besucher.",
    category: "Webdesign",
    url: `${BUSINESS_INFO.website}/webdesign-agentur-deutschland`,
  },
  {
    id: "ai-automation",
    name: "Prozessautomatisierung",
    description: "Automatisierte Workflows für Buchungen, Lead-Nachverfolgung und Geschäftsprozesse – damit manuelle Arbeit aufhört, Zeit zu kosten.",
    category: "AI Automation",
    url: `${BUSINESS_INFO.website}/automatisierung-unternehmen`,
  },
  {
    id: "ai-receptionist",
    name: "KI-Telefonassistent",
    description: "KI-Telefonassistent für Praxen, Restaurants und Dienstleister – antwortet in unter 3 Sekunden, bucht Termine direkt ins System.",
    category: "AI Receptionist",
    url: `${BUSINESS_INFO.website}/ki-telefonassistent`,
  },
  {
    id: "ai-content",
    name: "AI Content Erstellung",
    description: "Skalierbare Content-Produktion mit KI – Kampagnen, Produktbilder und Social-Content im exakten Brand-Look, in Tagen statt Wochen.",
    category: "AI Content Creation",
    url: `${BUSINESS_INFO.website}/leistungen`,
  },
];

export const FAQ_ITEMS = [
  {
    question: "Was kostet ein Projekt mit Cogniiq?",
    answer: "Die Kosten hängen komplett von Ziel und Umfang ab. Wir arbeiten nicht mit pauschalen Paketpreisen, sondern mit individuellen Angeboten. Erstgespräch und grobe Einschätzung sind kostenlos.",
  },
  {
    question: "Wie schnell kann Cogniiq mit einem Projekt starten?",
    answer: "In der Regel innerhalb von 7-14 Tagen. Manchmal schneller, je nach Auslastung und Umfang des Projekts.",
  },
  {
    question: "Kann Cogniiq bestehende Systeme übernehmen und verbessern?",
    answer: "Ja. Wir können bestehende Websites, Buchungssysteme oder Automationen analysieren und modernisieren, anstatt alles neu zu bauen.",
  },
  {
    question: "Muss ich mich später um Technik und Wartung kümmern?",
    answer: "Nein, wir bieten auf Wunsch laufende Betreuung für Updates, Anpassungen und Monitoring.",
  },
  {
    question: "Arbeitet Cogniiq nur mit Unternehmen in Bayreuth?",
    answer: "Nein, wir arbeiten remote in ganz Deutschland und darüber hinaus. Persönliche Termine sind im Raum Bayreuth, Regensburg und München möglich.",
  },
];

export interface LocationPage {
  city: string;
  region: string;
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  isHeadquarters?: boolean;
}

export const LOCATION_PAGES: LocationPage[] = [
  {
    city: "Bayreuth",
    region: "Bayern",
    slug: "",
    title: "AI Agentur & Webdesign Agentur Bayreuth",
    description: "Cogniiq – Ihre AI Agentur und Webdesign Agentur in Bayreuth. KI Automationen, AI Rezeptionistin und hochkonvertierende Websites direkt vor Ort.",
    keywords: ["AI Agentur Bayreuth", "Webdesign Agentur Bayreuth", "KI Automationen Bayreuth"],
    canonical: "https://cogniiq.de",
    isHeadquarters: true,
  },
  {
    city: "München",
    region: "Bayern",
    slug: "muenchen",
    title: "AI Agentur & Webdesign Agentur München | KI-Telefonassistent & Automatisierung – Cogniiq",
    description: "Cogniiq betreut Unternehmen in München mit KI-Telefonassistenten, Webdesign und Prozessautomatisierung. Kein Template, kein Overhead – Systeme, die täglich arbeiten.",
    keywords: ["AI Agentur München", "Webdesign München", "KI Telefonassistent München", "Automatisierung München", "KI Agentur Bayern"],
    canonical: "https://cogniiq.de/muenchen",
  },
  {
    city: "Nürnberg",
    region: "Bayern",
    slug: "nuernberg",
    title: "AI Agentur & Webdesign Nürnberg | KI-Telefonassistent & Automatisierung – Cogniiq",
    description: "KI-Telefonassistent, Webdesign und Automatisierung für Unternehmen in Nürnberg. Cogniiq entwickelt operative Systeme, die Anrufe annehmen, Leads konvertieren und Zeit sparen.",
    keywords: ["AI Agentur Nürnberg", "Webdesign Nürnberg", "KI Telefonassistent Nürnberg", "Automatisierung Nürnberg"],
    canonical: "https://cogniiq.de/nuernberg",
  },
  {
    city: "Regensburg",
    region: "Bayern",
    slug: "regensburg",
    title: "AI Agentur & Webdesign Regensburg | KI-Telefonassistent & Automatisierung – Cogniiq",
    description: "Cogniiq – KI-Telefonassistent, Webdesign und Automatisierung für Unternehmen in Regensburg. Persönliche Betreuung, Go-Live in 7–14 Tagen.",
    keywords: ["AI Agentur Regensburg", "Webdesign Regensburg", "KI Telefonassistent Regensburg", "Automatisierung Regensburg"],
    canonical: "https://cogniiq.de/regensburg",
  },
];

export const PAGE_META = {
  home: {
    title: "Cogniiq – KI-Telefonassistent, Webdesign & Automatisierung für Unternehmen in Bayern",
    description: "Cogniiq entwickelt operative KI-Systeme für Unternehmen in Bayern: KI-Telefonassistent, hochkonvertierende Websites und Prozessautomatisierung. Kein Anruf geht verloren. Go-Live in 7–14 Tagen.",
    canonical: "https://cogniiq.de",
  },
  leistungen: {
    title: "Leistungen | KI-Telefonassistent, Webdesign & Automatisierung – Cogniiq",
    description: "Drei operative Systeme, die täglich für Ihr Unternehmen arbeiten: KI-Telefonassistent, der jeden Anruf beantwortet – Webdesign, das konvertiert – Automatisierung, die manuelle Arbeit eliminiert.",
    canonical: "https://cogniiq.de/leistungen",
  },
  ueberUns: {
    title: "Über Uns | KI-Agentur Bayreuth – Lazar & Djordje Popovic – Cogniiq",
    description: "Cogniiq wurde von Lazar und Djordje Popovic in Bayreuth gegründet. Wir bauen operative KI-Systeme – keine Beratungsfolien, keine generischen Pakete. Direkter Kontakt, messbare Ergebnisse.",
    canonical: "https://cogniiq.de/ueber-uns",
  },
  faq: {
    title: "FAQ – Kosten, Ablauf & KI-Systeme | Cogniiq Bayreuth",
    description: "Antworten zu KI-Telefonassistent, Webdesign-Kosten, Projektstart und Automatisierung. Was kostet ein Projekt? Wie schnell geht es? Was ist realistisch? Hier, konkret.",
    canonical: "https://cogniiq.de/faq",
  },
  kontakt: {
    title: "Kostenloses Erstgespräch vereinbaren – Cogniiq | KI-Agentur Bayern",
    description: "30 Minuten – wir schauen uns Ihre konkrete Situation an und zeigen, wo KI-Telefonie, Webdesign oder Automatisierung sofort wirkt. Kein Pitch. Kein Standardangebot.",
    canonical: "https://cogniiq.de/kontakt",
  },
};

export function formatAddress(inline: boolean = false): string {
  const separator = inline ? ", " : "\n";
  return `${BUSINESS_INFO.address.streetAddress}${separator}${BUSINESS_INFO.address.postalCode} ${BUSINESS_INFO.address.addressLocality}${separator}${BUSINESS_INFO.address.addressCountry === "DE" ? "Deutschland" : BUSINESS_INFO.address.addressCountry}`;
}

export function getGoogleMapsUrl(): string {
  return `https://www.google.com/maps/place/Cogni+IQ/@49.9471651,11.5710085,17z/data=!3m1!4b1!4m6!3m5!1s0x47a1a30b011831f5:0x9a1f8b5c17a30837!8m2!3d49.9471651!4d11.5735834!16s%2Fg%2F11ms0md3q0?entry=ttu&g_ep=EgoyMDI1MTIwMS4wIKXMDSoASAFQAw%3D%3D`;
}

export function getGoogleMapsEmbedUrl(): string {
  const { latitude, longitude } = BUSINESS_INFO.geo;
  return `https://www.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`;
}

export function getGoogleBusinessProfileUrl(): string {
  return `https://business.google.com/create`;
}
