import { ProblemPage } from "@/components/ProblemPage";
import type { ProblemPageConfig } from "@/components/ProblemPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: ProblemPageConfig = {
  seo: {
    title: "Keine Online-Terminbuchung – was Unternehmen verlieren | Cogniiq",
    description: "Unternehmen ohne Online-Terminbuchung verlieren täglich Kunden. Erfahren Sie, warum Online-Terminbuchung entscheidend ist und wie Sie es in wenigen Tagen einrichten.",
    canonical: `${BUSINESS_INFO.website}/keine-terminbuchung-online`,
  },
  h1: "Keine Online-Terminbuchung: Das kostet Ihr Unternehmen täglich",
  tagline: "Problem · Online-Terminbuchung · Kundenverlust",
  intro: "Kunden möchten Termine wann und wie sie wollen buchen – nicht nur während Ihrer Öffnungszeiten. Ohne Online-Terminbuchung verlieren Sie täglich Kunden an Anbieter, die diese Bequemlichkeit bieten.",
  problem: {
    headline: "Warum Unternehmen ohne Online-Terminbuchung verlieren",
    points: [
      "Kunden können abends und am Wochenende keinen Termin buchen",
      "Telefonische Terminvereinbarung ist umständlich und zeitaufwändig",
      "Interessenten buchen beim nächsten Anbieter, der Online-Buchung anbietet",
      "Keine Kalender-Integration: Termine werden doppelt vergeben oder vergessen",
      "Keine automatischen Bestätigungen und Erinnerungen für Kunden",
      "Manuelle Terminverwaltung bindet Personalzeit ohne Mehrwert",
    ],
  },
  costs: {
    headline: "Der tatsächliche Verlust durch fehlende Online-Terminbuchung",
    points: [
      {
        title: "Verlorene Abendtermine",
        description: "40–60 % der Terminbuchungsabsichten passieren nach 18 Uhr. Ohne Online-Buchung gehen diese Kunden zur Konkurrenz.",
      },
      {
        title: "Höhere No-Show-Rate",
        description: "Ohne automatische Erinnerungen erscheinen 20–30 % der Kunden nicht zum Termin. Das kostet direkt Umsatz und blockiert den Kalender.",
      },
      {
        title: "Personalzeit für Terminkoordination",
        description: "Manuelle Terminverwaltung kostet täglich Stunden. Diese Zeit ist in den meisten Unternehmen besser anderweitig eingesetzt.",
      },
      {
        title: "Wettbewerbsnachteil gegenüber digitalisierten Konkurrenten",
        description: "Kunden vergleichen Anbieter nach Bequemlichkeit. Wer keine Online-Buchung bietet, verliert gegenüber Konkurrenten, die es tun.",
      },
    ],
  },
  solution: {
    headline: "Online-Terminbuchung, die sich in Ihr System integriert.",
    text: "Cogniiq richtet Online-Terminbuchung ein, die sich nahtlos mit Ihrem Kalender synchronisiert, automatische Bestätigungen versendet und No-Shows durch Erinnerungen reduziert. Optional mit KI-Telefonassistenten für telefonische Buchungen.",
    bullets: [
      "Online-Buchung 24/7 – auch abends und am Wochenende",
      "Automatische Bestätigung und Erinnerungen",
      "Kalender-Integration (Google Calendar, Outlook)",
      "No-Show-Reduzierung durch SMS/E-Mail-Erinnerungen",
      "Einrichtung in 7–14 Tagen",
      "Optional: KI-Telefonassistent für telefonische Buchungen",
    ],
  },
  serviceLinks: [
    { label: "KI Telefonassistent", href: "/ki-telefonassistent" },
    { label: "Automatisierung Unternehmen", href: "/automatisierung-unternehmen" },
    { label: "KI Telefonassistent Kosten", href: "/kosten-ki-telefonassistent" },
    { label: "Webdesign mit Terminbuchung", href: "/leistungen" },
    { label: "Kontakt", href: "/kontakt" },
  ],
};

export function KeineTerminbuchungPage() {
  return <ProblemPage config={config} />;
}
