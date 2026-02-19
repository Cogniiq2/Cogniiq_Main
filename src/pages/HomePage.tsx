import { HeroSection } from '@/components/HeroSection';
import { TrustSection } from '@/components/TrustSection';
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
        breadcrumbs={[{ name: "Home", url: BUSINESS_INFO.website }]}
      />
      <HeroSection />
      <TrustSection />
      <LocationContent />
    </>
  );
}
