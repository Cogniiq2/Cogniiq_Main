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

  website: "https://cogniiq.com",

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
    "Bayern",
    "Deutschland",
  ],

  keywords: [
    "AI Agentur Deutschland",
    "Webdesign Agentur Bayreuth",
    "KI Automationen",
    "AI Rezeptionistin",
    "Make.com Automationen",
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
    description: "Moderne, schnelle Webseiten mit Fokus auf Conversion und SEO für lokale Unternehmen",
    category: "Webdesign",
  },
  {
    id: "ai-automation",
    name: "Make.com Automationen",
    description: "Automatisierte Workflows für Buchungen, Leads und Geschäftsprozesse",
    category: "AI Automation",
  },
  {
    id: "ai-receptionist",
    name: "AI Rezeptionistin",
    description: "Digitaler Telefon- und Chat-Assistent für Kliniken, Restaurants und Dienstleister",
    category: "AI Receptionist",
  },
  {
    id: "ai-content",
    name: "AI Content Erstellung",
    description: "Skalierbare Content-Erstellung mit AI für Kampagnen und Social Media",
    category: "AI Content Creation",
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

export function formatAddress(inline: boolean = false): string {
  const separator = inline ? ", " : "\n";
  return `${BUSINESS_INFO.address.streetAddress}${separator}${BUSINESS_INFO.address.postalCode} ${BUSINESS_INFO.address.addressLocality}${separator}${BUSINESS_INFO.address.addressCountry === "DE" ? "Deutschland" : BUSINESS_INFO.address.addressCountry}`;
}

export function getGoogleMapsUrl(): string {
  return `https://www.google.com/maps/place/Cogni+IQ/@49.9471651,11.5710085,17z/data=!3m1!4b1!4m6!3m5!1s0x47a1a30b011831f5:0x9a1f8b5c17a30837!8m2!3d49.9471651!4d11.5735834!16s%2Fg%2F11ms0md3q0?entry=ttu&g_ep=EgoyMDI1MTIwMS4wIKXMDSoASAFQAw%3D%3D`;
}

export function getGoogleBusinessProfileUrl(): string {
  return `https://business.google.com/create`;
}
