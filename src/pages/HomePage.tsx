import { HeroSection } from '@/components/HeroSection';
import { TrustStrip } from '@/components/TrustStrip';
import { StatsSection } from '@/components/StatsSection';
import { ROICalculator } from '@/components/ROICalculator';
import { CostComparisonSection } from '@/components/CostComparisonSection';
import { SolutionShowcase } from '@/components/SolutionShowcase';
import { ProblemSection } from '@/components/ProblemSection';
import { ServicesSection } from '@/components/ServicesSection';
import { TrustSection } from '@/components/TrustSection';
import { ProcessSection } from '@/components/ProcessSection';
import { CasesSection } from '@/components/CasesSection';
import { KiCTASection } from '@/components/KiCTASection';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { FAQSection } from '@/components/FAQSection';
import { FinalCTASection } from '@/components/FinalCTASection';
import { LocationContent } from '@/components/LocationContent';
import { PageSEO } from '@/components/PageSEO';
import { PAGE_META, BUSINESS_INFO } from '@/lib/seo-data';

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
      <ROICalculator />
      <CostComparisonSection />
      <SolutionShowcase />
      <ProblemSection />
      <ServicesSection />
      <TrustSection />
      <ProcessSection />
      <CasesSection />
      <KiCTASection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTASection />
      <LocationContent />
    </>
  );
}
