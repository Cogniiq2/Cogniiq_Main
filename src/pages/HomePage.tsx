import { lazy, Suspense } from 'react';

import { HeroSection } from '@/components/HeroSection';
import { PageSEO } from '@/components/PageSEO';
import { PAGE_META, BUSINESS_INFO } from '@/lib/seo-data';
import { TelefonRechnerSection } from '@/components/TelefonRechnerSection';

const HowWeWorkSection = lazy(() =>
  import('@/components/HowWeWorkSection').then((module) => ({
    default: module.HowWeWorkSection,
  }))
);

const SolutionShowcase = lazy(() =>
  import('@/components/SolutionShowcase').then((module) => ({
    default: module.SolutionShowcase,
  }))
);

const ServicesSection = lazy(() =>
  import('@/components/ServicesSection').then((module) => ({
    default: module.ServicesSection,
  }))
);

const FAQSection = lazy(() =>
  import('@/components/FAQSection').then((module) => ({
    default: module.FAQSection,
  }))
);

const FinalCTASection = lazy(() =>
  import('@/components/FinalCTASection').then((module) => ({
    default: module.FinalCTASection,
  }))
);

const LocationContent = lazy(() =>
  import('@/components/LocationContent').then((module) => ({
    default: module.LocationContent,
  }))
);

function SectionFallback() {
  return null;
}

export function HomePage() {
  return (
    <>
      <PageSEO
        title={PAGE_META.home.title}
        description={PAGE_META.home.description}
        canonical={PAGE_META.home.canonical}
        breadcrumbs={[{ name: 'Home', url: BUSINESS_INFO.website }]}
      />

      <HeroSection />

      {/* Reihenfolge: Beispiel (was passiert) → Leistungen (was es gibt) →
          Rechner (was es kostet) → Zusammenarbeit → FAQ → Abschluss → Standort.
          TrustStrip, StatsSection, CostComparisonSection, ProblemSection,
          HowItWorksSection, TrustSection, ProcessSection und KiCTASection
          sind hier nicht mehr eingebunden: sie wiederholten Hero-Aussagen,
          den Ablauf und den Kontakt-CTA mehrfach. Ihre Verweise leben in
          ServicesSection (Ausgangslagen) und HowWeWorkSection weiter. */}
      <Suspense fallback={<SectionFallback />}>
        <SolutionShowcase />
        <ServicesSection />
      </Suspense>

      {/*
        Auf der Startseite steht die PREISFRAGE, nicht der ganze Rechenweg.
        Hier lagen vorher Tarifzeilen, Personalszenarien, Routineanteil,
        verpasste Anrufe, Annahmen und mehrere Hinweisblöcke über rund fünf
        Bildschirme zwischen Produkt und Abschluss. Der vollständige
        Wirtschaftlichkeitsteil steht unverändert auf /ki-telefonassistent und
        ist von hier aus einen Klick entfernt — dieselbe Komponente, dieselben
        Formeln, dieselben Quellpreise.
      */}
      <TelefonRechnerSection
        headline="Was kostet Ihr Telefonassistent?"
        intro={[
          'Tragen Sie Ihr Anrufaufkommen ein. Der Rechner nennt sofort den passenden Tarif, die wiederkehrenden Kosten und die einmalige Einrichtung — ohne E-Mail und ohne Verkaufsgespräch.',
        ]}
        variante="kompakt"
        tone="alt"
        headingClassName="text-[clamp(30px,3.2vw,40px)] font-bold text-pub-ink leading-[1.1] tracking-[-0.02em] mb-5"
      />

      <Suspense fallback={<SectionFallback />}>
        <HowWeWorkSection />
        <FAQSection />
        <FinalCTASection />
        <LocationContent />
      </Suspense>
    </>
  );
}

export default HomePage;