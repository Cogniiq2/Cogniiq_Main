export type ServiceSlug = "ki-telefonassistent" | "automatisierung" | "webdesign";
export type CitySlug = "bayreuth" | "regensburg" | "muenchen";

export interface UseCaseCard {
  industry: string;
  title: string;
  description: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface RelatedLink {
  label: string;
  href: string;
}

export interface IndustryBlock {
  name: string;
  problem: string;
  solution: string;
}

export interface LocalScenario {
  title: string;
  description: string;
}

export interface CityServiceConfig {
  city: string;
  citySlug: CitySlug;
  service: string;
  serviceSlug: ServiceSlug;
  route: string;
  locationNote?: string;
  /*
    EINGEFRORENE ALT-URL IM FUSSVERWEIS — genau eine Seite, genau ein Grund.

    Der Verweisstreifen am Fuß jeder Stadt-x-Leistung-Seite zeigt seit dem
    12.09.2026 auf `/prozessautomatisierung`; `/automatisierung-unternehmen`
    ist per 301 dorthin überführt (src/lib/routing/legacyRedirects.ts).

    Genau eine Stadt-x-Leistung-Seite läuft jedoch als eingefrorenes
    Suchexperiment (PROTECTED_EXPERIMENT_PATHS in
    src/lib/routing/protectedExperiments.ts nennt sie). Zu ihrem Fingerabdruck
    gehören die ausgehenden Anker samt Zieladresse — die Messung gilt nur,
    solange die ausgelieferten Bytes unverändert bleiben. Diese eine Seite trägt
    deshalb weiterhin die alte Adresse, und zwar als DATEN in ihrer eigenen
    Konfiguration statt als Sonderfall im Bauteil: Die Bedingung steht dort, wo
    auch steht, warum diese Seite besonders ist.

    Der Pfad wird hier bewusst NICHT genannt. Der Freeze zählt jede Erwähnung
    einer geschützten Route im Quellbaum, Kommentare eingeschlossen; ihn hier
    auszuschreiben wäre selbst eine Änderung an ihrer Link-Topologie.

    Suchtechnisch kostet das nichts — ein interner Link auf eine 301 wird
    verfolgt und konsolidiert. Er verschwindet, sobald das Experiment endet;
    vermerkt in docs/seo/post-experiment-opportunities.md.
  */
  legacyAutomationLink?: string;
  /*
    Dieselbe Figur ein zweites Mal, seit dem 13.09.2026: Der Fußverweis
    „Webdesign Agentur" zeigt auf den Pillar `/webdesign`;
    `/webdesign-agentur-deutschland` bleibt vorerst eine lebende Route, deren
    Konsolidierung in den Pillar beschlossen und aufgeschoben ist (F9). Die
    eine eingefrorene Seite behält ihr gemessenes Ziel — aus genau dem Grund,
    der über `legacyAutomationLink` steht.
  */
  legacyWebdesignLink?: string;
  seo: {
    title: string;
    description: string;
    canonical: string;
  };
  intro: {
    h1: string;
    lead: string;
  };
  localIntro: {
    paragraphs: string[];
  };
  warumCogniiq: string[];
  useCases: UseCaseCard[];
  processSteps: ProcessStep[];
  faq: FAQItem[];
  localChallenges: string[];
  industries: string[];
  industriesExpanded: IndustryBlock[];
  localScenarios: LocalScenario[];
  sameServiceOtherCities: RelatedLink[];
  otherServicesInCity: RelatedLink[];
}

/**
 * Every city × service route, in CITY_SERVICE_CONFIGS order.
 *
 * Kept here — a module small enough for the entry chunk — so src/App.tsx can
 * register the routes without importing the ~102 KiB config literal. The page
 * component resolves its own config lazily from standorte-service-configs.ts.
 * src/lib/standorte-data.test.ts asserts this list matches those configs
 * exactly, so the split cannot drift.
 */
export const CITY_SERVICE_ROUTES: readonly string[] = [
  "/bayreuth/ki-telefonassistent",
  "/bayreuth/automatisierung",
  "/bayreuth/webdesign",
  "/regensburg/ki-telefonassistent",
  "/regensburg/automatisierung",
  "/regensburg/webdesign",
  "/muenchen/ki-telefonassistent",
  "/muenchen/automatisierung",
  "/muenchen/webdesign",
];

export const CITY_LINKS: Record<CitySlug, { label: string; services: Array<{ label: string; href: string }> }> = {
  bayreuth: {
    label: "Bayreuth",
    services: [
      { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
      { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
      { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
    ],
  },
  muenchen: {
    label: "München",
    services: [
      { label: "Webdesign München", href: "/muenchen/webdesign" },
      { label: "KI-Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
      { label: "Automatisierung München", href: "/muenchen/automatisierung" },
    ],
  },
  regensburg: {
    label: "Regensburg",
    services: [
      { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
      { label: "KI-Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
      { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
    ],
  },
};
