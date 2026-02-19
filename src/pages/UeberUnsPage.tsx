import { motion } from 'framer-motion';

import { AboutSection } from '@/components/AboutSection';
import { ProcessSection } from '@/components/ProcessSection';
import { PageSEO } from '@/components/PageSEO';
import { PAGE_META, BUSINESS_INFO } from '@/lib/seo-data';

export function UeberUnsPage() {
  return (
    <>
      <PageSEO
        title={PAGE_META.ueberUns.title}
        description={PAGE_META.ueberUns.description}
        canonical={PAGE_META.ueberUns.canonical}
        breadcrumbs={[
          { name: "Home", url: BUSINESS_INFO.website },
          { name: "Über Uns", url: PAGE_META.ueberUns.canonical },
        ]}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-32 pb-16"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-16">
          <AboutSection />
          <ProcessSection />
        </div>
      </motion.div>
    </>
  );
}