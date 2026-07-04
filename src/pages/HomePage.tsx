import { lazy, Suspense } from 'react';

import { HeroSection } from '@/components/HeroSection';
import { TrustStrip } from '@/components/TrustStrip';
import { PageSEO } from '@/components/PageSEO';
import { PAGE_META, BUSINESS_INFO } from '@/lib/seo-data';

const StatsSection = lazy(() =>
  import('@/components/StatsSection').then((module) => ({
    default: module.StatsSection,
  }))
);

const ROICalculator = lazy(() =>
  import('@/components/ROICalculator').then((module) => ({
    default: module.ROICalculator,
  }))
);

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

const CasesSection = lazy(() =>
  import('@/components/CasesSection').then((module) => ({
    default: module.CasesSection,
  }))
);

const KiCTASection = lazy(() =>
  import('@/components/KiCTASection').then((module) => ({
    default: module.KiCTASection,
  }))
);

const TestimonialsSection = lazy(() =>
  import('@/components/TestimonialsSection').then((module) => ({
    default: module.TestimonialsSection,
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

      <Suspense fallback={<SectionFallback />}>
        <StatsSection />
        <ROICalculator />
        <CostComparisonSection />
        <SolutionShowcase />
        <ProblemSection />
        <ServicesSection />
        <HowItWorksSection />
        <TrustSection />
        <ProcessSection />
        <CasesSection />
        <KiCTASection />
        <TestimonialsSection />
        <FAQSection />
        <FinalCTASection />
        <LocationContent />
      </Suspense>
    </>
  );
}

export default HomePage;