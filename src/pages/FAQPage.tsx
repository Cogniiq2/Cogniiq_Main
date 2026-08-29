import { FAQSection } from '@/components/FAQSection';
import { PageSEO } from '@/components/PageSEO';
import { PAGE_META, BUSINESS_INFO } from '@/lib/seo-data';

export function FAQPage() {
  return (
    <>
      <PageSEO
        title={PAGE_META.faq.title}
        description={PAGE_META.faq.description}
        canonical={PAGE_META.faq.canonical}
        breadcrumbs={[
          { name: "Home", url: BUSINESS_INFO.website },
          { name: "FAQ", url: PAGE_META.faq.canonical },
        ]}
      />
      <div className="cq-rise pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* FAQSection is written for embedding below a page's own heading and
              therefore opens at <h2>. Standing alone at /faq that left the route
              as the only public page on the site with no <h1> at all. The page
              heading belongs to the page, not to the shared section. */}
          <h1 className="sr-only">Häufige Fragen zu Kosten, Ablauf und KI-Systemen</h1>
          <FAQSection />
        </div>
      </div>
    </>
  );
}