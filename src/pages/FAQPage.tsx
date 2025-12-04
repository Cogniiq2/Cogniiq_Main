import { motion } from 'framer-motion';
import { FAQSection } from '@/components/FAQSection';

export function FAQPage() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-32 pb-16"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Only the FAQ content, without the old heading/description text */}
          <FAQSection />
        </div>
      </motion.div>
    </>
  );
}