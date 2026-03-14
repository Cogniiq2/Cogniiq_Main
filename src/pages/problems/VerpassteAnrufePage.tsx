import { ProblemPage } from "@/components/ProblemPage";
import type { ProblemPageConfig } from "@/components/ProblemPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: ProblemPageConfig = {
  seo: {
    title: "Verpasste Anrufe kosten Unternehmen täglich Aufträge | Cogniiq",
    description: "Verpasste Anrufe bedeuten verpasste Aufträge. Erfahren Sie, wie viel Ihr Unternehmen durch unbeantworte Anrufe verliert – und wie KI dieses Problem dauerhaft löst.",
    canonical: `${BUSINESS_INFO.website}/verpasste-anrufe-verlust`,
  },
  h1: "Verpasste Anrufe kosten Ihr Unternehmen täglich Aufträge",
  tagline: "Problem · Verpasste Anrufe · Umsatzverlust",
  intro: "Über 40 % aller Anrufe bei deutschen Unternehmen bleiben unbeantwortet. Das sind keine Statistiken – das sind Kunden, die zum Wettbewerber gegangen sind.",
  problem: {
    headline: "Warum Unternehmen so viele Anrufe verpassen",
    points: [
      "Mitarbeiter sind im Gespräch, auf der Baustelle oder im Außendienst",
      "Anrufe kommen außerhalb der Öffnungszeiten – abends, am Wochenende, an Feiertagen",
      "Stoßzeiten überlasten die telefonische Erreichbarkeit",
      "Urlaub und Krankheit reduzieren die Verfügbarkeit des Teams",
      "Keine Weiterleitung oder Voicemail-System implementiert",
      "Warteschleifen frustrieren Anrufer, die auflegen",
    ],
  },
  costs: {
    headline: "Was verpasste Anrufe Ihr Unternehmen wirklich kosten",
    points: [
      {
        title: "Direkt verlorene Aufträge",
        description: "Jeder Anrufer, der niemanden erreicht, fragt beim nächsten Anbieter an. Bei einem Auftragswert von 500 € und 3 verpassten Anrufen pro Tag sind das 375.000 € pro Jahr.",
      },
      {
        title: "Kunden wechseln zur Konkurrenz",
        description: "Über 60 % der Anrufer, die niemanden erreichen, rufen einen anderen Anbieter an – und kehren nicht zurück. Der Schaden ist dauerhaft.",
      },
      {
        title: "Ruf und Bewertungen leiden",
        description: "Kunden, die nicht erreicht werden, hinterlassen schlechte Bewertungen. Diese schaden dauerhaft der Online-Sichtbarkeit und dem Neukundengewinn.",
      },
      {
        title: "Kosten für Rückrufe und Nacharbeit",
        description: "Verpasste Anrufe bedeuten zusätzlichen Aufwand für Rückrufe, E-Mails und manuelle Nachverfolgung – Zeit, die produktiver eingesetzt werden könnte.",
      },
    ],
  },
  solution: {
    headline: "Der KI Telefonassistent: Kein Anruf geht mehr verloren.",
    text: "Ein KI Telefonassistent nimmt jeden eingehenden Anruf sofort entgegen – 24/7, ohne Warteschleife, ohne Personalaufwand. Er versteht Kundenanliegen, beantwortet Fragen und bucht Termine automatisch.",
    bullets: [
      "Jeder Anruf wird sofort und professionell entgegengenommen",
      "24/7 erreichbar – auch abends, am Wochenende und an Feiertagen",
      "Termine automatisch in den Kalender eingetragen",
      "DSGVO-konform auf deutschen Servern",
      "Einrichtung in 7–14 Tagen",
      "Skaliert mit Ihrem Unternehmen ohne Mehrkosten",
    ],
  },
  serviceLinks: [
    { label: "KI Telefonassistent", href: "/ki-telefonassistent" },
    { label: "KI Telefonassistent Kosten", href: "/kosten-ki-telefonassistent" },
    { label: "KI Agentur Deutschland", href: "/ki-agentur-deutschland" },
    { label: "Automatisierung Unternehmen", href: "/automatisierung-unternehmen" },
    { label: "Kontakt", href: "/kontakt" },
  ],
};

export function VerpassteAnrufePage() {
  return <ProblemPage config={config} />;
}
