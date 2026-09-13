import { ProblemPage } from "@/components/ProblemPage";
import type { ProblemPageConfig } from "@/components/ProblemPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: ProblemPageConfig = {
  seo: {
    title: "Verpasste Anrufe: Was sie Unternehmen wirklich kosten | Cogniiq",
    description: "Verpasste Anrufe bedeuten verpasste Aufträge. Erfahren Sie, wie viel Ihr Unternehmen durch unbeantwortete Anrufe verliert – und wie KI dieses Problem dauerhaft löst.",
    canonical: `${BUSINESS_INFO.website}/verpasste-anrufe-verlust`,
  },
  h1: "Verpasste Anrufe kosten Ihr Unternehmen täglich Aufträge",
  tagline: "Problem · Verpasste Anrufe · Umsatzverlust",
  intro: "Ein erheblicher Teil der Anrufe bei kleinen und mittleren Unternehmen bleibt unbeantwortet. Dahinter stehen keine abstrakten Zahlen – das sind Kunden, die zum Wettbewerber gegangen sind.",
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
        description: "Jeder Anrufer, der niemanden erreicht, fragt beim nächsten Anbieter an. Was das kostet, hängt von Ihrem Auftragswert ab – rechnen Sie mit Ihren eigenen Zahlen.",
      },
      {
        title: "Kunden wechseln zur Konkurrenz",
        description: "Wer niemanden erreicht, ruft häufig beim nächsten Anbieter an – und kehrt oft nicht zurück. Der Schaden ist dauerhaft.",
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
    headline: "Der KI Telefonassistent: Anrufe werden angenommen statt verpasst.",
    text: "Ein KI Telefonassistent nimmt eingehende Anrufe entgegen – auch zu Stoßzeiten und außerhalb regulärer Geschäftszeiten, mehrere zur selben Zeit und ohne zusätzliches Personal. Er versteht das Anliegen, beantwortet freigegebene Fragen und vergibt, verschiebt oder storniert Termine nach Ihren Regeln, statt sie nur zu notieren.",
    bullets: [
      "Anrufe werden sofort und professionell entgegengenommen – auch zu Stoßzeiten",
      "Erreichbar auch abends, am Wochenende und an Feiertagen",
      "Terminwünsche werden nach Ihren Regeln aufgenommen – ins Kalender- oder Praxissystem geschrieben wird erst, wenn dessen Schnittstelle das nachweislich trägt",
      "Skaliert mit Ihrem Unternehmen ohne Mehrkosten",
    ],
  },
  rechner: {
    ankertext: "Was kostet das bei meinem Anrufvolumen?",
    kontext: "Verpasste Anrufe",
    einleitung:
      "Diese Seite rechnet Ihnen bewusst nicht vor, was verpasste Anrufe Sie kosten — das hängt an Ihrem Auftragswert und Ihrer Abschlussquote, und beides kennen wir nicht. Der Rechner auf der Produktseite rechnet mit Ihren Zahlen: erst der Preis für Ihr Anrufaufkommen, dann optional der Gegenwert der Anrufe, die heute niemanden erreichen.",
  },
  serviceLinks: [
    { label: "KI Telefonassistent", href: "/ki-telefonassistent" },
    { label: "KI Telefonassistent Arztpraxis", href: "/ki-telefonassistent-arzt" },
    { label: "KI Telefonassistent Kosten", href: "/kosten-ki-telefonassistent" },
    { label: "KI Agentur Deutschland", href: "/ki-agentur-deutschland" },
    { label: "Automatisierung Unternehmen", href: "/prozessautomatisierung" },
    { label: "Kontakt", href: "/kontakt" },
  ],
};

export function VerpassteAnrufePage() {
  return <ProblemPage config={config} />;
}
