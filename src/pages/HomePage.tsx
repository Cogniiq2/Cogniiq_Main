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
        <HowWeWorkSection />
        <FAQSection />
        <FinalCTASection />
        <LocationContent />
      </Suspense>
    </>
  );
}

export default HomePage;