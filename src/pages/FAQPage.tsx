import { motion } from 'framer-motion';
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-32 pb-16"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FAQSection />
        </div>
      </motion.div>
    </>
  );
}