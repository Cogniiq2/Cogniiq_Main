import { motion } from 'framer-motion';

import { AboutSection } from '@/components/AboutSection';
import { ProcessSection } from '@/components/ProcessSection';

export function UeberUnsPage() {
  return (
    <>
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