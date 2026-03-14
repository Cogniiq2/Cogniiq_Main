import { ProblemPage } from "@/components/ProblemPage";
import type { ProblemPageConfig } from "@/components/ProblemPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: ProblemPageConfig = {
  seo: {
    title: "Digitale Automatisierung für Unternehmen – Einstieg & Strategie | Cogniiq",
    description: "Digitale Automatisierung für Unternehmen: Welche Prozesse sich lohnen, wie man startet und was zu beachten ist. Praxisnaher Leitfaden für KMU in Deutschland.",
    canonical: `${BUSINESS_INFO.website}/digitale-automatisierung-unternehmen`,
  },
  h1: "Digitale Automatisierung für Unternehmen: Wie man startet",
  tagline: "Digitalisierung · Automatisierung · KMU Deutschland",
  intro: "Viele Unternehmen wissen, dass sie Prozesse automatisieren sollten – aber wissen nicht, wo sie anfangen sollen. Dieser Leitfaden zeigt, welche Prozesse sich am schnellsten lohnen und wie der erste Schritt aussieht.",
  problem: {
    headline: "Warum Unternehmen mit der Digitalisierung zögern",
    points: [
      "Unklare Prioritäten: Welcher Prozess lohnt sich am meisten?",
      "Angst vor zu viel technischem Aufwand und Kosten",
      "Bedenken wegen Datenschutz und DSGVO-Konformität",
      "Keine interne IT-Expertise für Umsetzung",
      "Zu viele Tools und Anbieter, keine klare Entscheidungsgrundlage",
      "Befürchtung, dass Automatisierungen Mitarbeiter ersetzen",
    ],
  },
  costs: {
    headline: "Was das Zögern bei der Digitalisierung kostet",
    points: [
      {
        title: "Wachsender Wettbewerbsnachteil",
        description: "Während Sie zögern, automatisieren Ihre Konkurrenten. Jeder Monat ohne Automatisierung vergrößert den Produktivitäts- und Kostenunterschied.",
      },
      {
        title: "Steigende Personalkosten bei gleichbleibendem Output",
        description: "Manuelle Prozesse skalieren mit Personalkosten. Unternehmen, die nicht automatisieren, müssen bei Wachstum mehr Personal einstellen – oder wachsen nicht.",
      },
      {
        title: "Fachkräftemangel trifft Nicht-Automatisierer härter",
        description: "Wenn qualifiziertes Personal schwer zu finden ist, müssen Unternehmen mit vorhandenen Ressourcen mehr leisten. Automatisierung ist die einzige Antwort.",
      },
      {
        title: "Kundenerwartungen steigen ständig",
        description: "Kunden erwarten schnelle Reaktionszeiten, 24/7-Erreichbarkeit und nahtlose digitale Prozesse. Ohne Automatisierung können diese Erwartungen nicht erfüllt werden.",
      },
    ],
  },
  solution: {
    headline: "Digitale Automatisierung: einfacher als Sie denken.",
    text: "Der richtige Einstieg in die Automatisierung beginnt mit dem Prozess, der den größten ROI hat. Cogniiq analysiert Ihre Abläufe, identifiziert Quick-Wins und setzt diese innerhalb von Wochen um – DSGVO-konform und vollständig dokumentiert.",
    bullets: [
      "Kostenlose Analyse Ihrer automatisierungsfähigen Prozesse",
      "Quick-Win-Automatisierungen in 1–3 Wochen live",
      "DSGVO-konform auf deutschen/europäischen Servern",
      "Vollständige Dokumentation – keine Abhängigkeit",
      "Schulung Ihres Teams in der Nutzung der Systeme",
      "Skalierbar: von einem Workflow zur vollständigen Digitalisierung",
    ],
  },
  serviceLinks: [
    { label: "Automatisierung für Unternehmen", href: "/automatisierung-unternehmen" },
    { label: "Automatisierung Kosten", href: "/kosten-automatisierung" },
    { label: "KI Agentur Deutschland", href: "/ki-agentur-deutschland" },
    { label: "Zu viel manuelle Arbeit", href: "/zu-viel-manuelle-arbeit" },
    { label: "Kontakt", href: "/kontakt" },
  ],
};

export function DigitaleAutomatisierungPage() {
  return <ProblemPage config={config} />;
}
