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
