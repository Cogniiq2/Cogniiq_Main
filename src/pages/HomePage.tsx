import { lazy, Suspense } from 'react';

import { HeroSection } from '@/components/HeroSection';
import { TrustStrip } from '@/components/TrustStrip';
import { StatsSection } from '@/components/StatsSection';
import { PageSEO } from '@/components/PageSEO';
import { PAGE_META, BUSINESS_INFO } from '@/lib/seo-data';
import { TelefonRechnerSection } from '@/components/TelefonRechnerSection';

const CostComparisonSection = lazy(() =>
  import('@/components/CostComparisonSection').then((module) => ({
    default: module.CostComparisonSection,
  }))
);

const SolutionShowcase = lazy(() =>
  import('@/components/SolutionShowcase').then((module) => ({
    default: module.SolutionShowcase,
  }))
);

const ProblemSection = lazy(() =>
  import('@/components/ProblemSection').then((module) => ({
    default: module.ProblemSection,
  }))
);

const ServicesSection = lazy(() =>
  import('@/components/ServicesSection').then((module) => ({
    default: module.ServicesSection,
  }))
);

const TrustSection = lazy(() =>
  import('@/components/TrustSection').then((module) => ({
    default: module.TrustSection,
  }))
);

const ProcessSection = lazy(() =>
  import('@/components/ProcessSection').then((module) => ({
    default: module.ProcessSection,
  }))
);

const HowItWorksSection = lazy(() =>
  import('@/components/HowItWorksSection').then((module) => ({
    default: module.HowItWorksSection,
  }))
);

const KiCTASection = lazy(() =>
  import('@/components/KiCTASection').then((module) => ({
    default: module.KiCTASection,
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
      <TrustStrip />
      <StatsSection />

      {/*
        EIN wirtschaftlicher Rechenweg auf dieser Seite, nicht zwei.

        Hier standen `ROICalculator` und `CostComparisonSection` untereinander:
        zwei Rechner, zwei Wochenfaktoren (4,3 und 4,33), zwei Vorstellungen
        davon, was Cogniiq kostet — der eine leitete den Preis aus den Tarifen
        ab, der andere behauptete einen Festpreis von 297 €, der in keiner
        Tarifliste steht. Ein Besucher, der beide bedient, findet den
        Widerspruch in unter einer Minute.

        Jetzt rechnet genau ein Bauteil, und zwar dasselbe wie auf
        /ki-telefonassistent: kompakte Darstellung, identische Formeln,
        identische Zahlen. `CostComparisonSection` rechnet nicht mehr, sondern
        vergleicht — Mensch und Assistent nach Eigenschaften, ohne eigene
        Preisbehauptung.
      */}
      <TelefonRechnerSection
        headline="Was kostet das bei Ihrem Anrufaufkommen — und rechnet es sich?"
        intro={[
          'Tragen Sie Ihr Anrufaufkommen ein. Der Rechner nennt den passenden Tarif, die wiederkehrenden Kosten und die einmalige Einrichtung — sofort, ohne E-Mail und ohne Verkaufsgespräch.',
          'Was vor der technischen Prüfung noch nicht feststeht, etwa die Anbindung an Ihr System, steht als offene Position in der Liste. Nicht als Null.',
        ]}
        variante="kompakt"
        tone="alt"
        headingClassName="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-[1.06] tracking-[-0.022em] mb-6"
      />

      <Suspense fallback={<SectionFallback />}>
        <CostComparisonSection />
        <SolutionShowcase />
        <ProblemSection />
        <ServicesSection />
        <HowItWorksSection />
        <TrustSection />
        <ProcessSection />
        <KiCTASection />
        <FAQSection />
        <FinalCTASection />
        <LocationContent />
      </Suspense>
    </>
  );
}

export default HomePage;