import { motion } from 'framer-motion';

import { ServicesSection } from '@/components/ServicesSection';
import { CasesSection } from '@/components/CasesSection';

export function LeistungenPage() {
  return (
    <>
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