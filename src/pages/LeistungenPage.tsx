import { motion } from 'framer-motion';

import { ServicesSection } from '@/components/ServicesSection';
import { CasesSection } from '@/components/CasesSection';
import { PageSEO } from '@/components/PageSEO';
import { PAGE_META, BUSINESS_INFO } from '@/lib/seo-data';

export function LeistungenPage() {
  return (
    <>
      <PageSEO
        title={PAGE_META.leistungen.title}
        description={PAGE_META.leistungen.description}
        canonical={PAGE_META.leistungen.canonical}
        breadcrumbs={[
          { name: "Home", url: BUSINESS_INFO.website },
          { name: "Leistungen", url: PAGE_META.leistungen.canonical },
        ]}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-32 pb-16"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-16">
          <ServicesSection />
          <CasesSection />
        </div>
      </motion.div>
    </>
  );
}