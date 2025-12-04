import { motion } from 'framer-motion';
import { AboutSection } from '@/components/AboutSection';

export function UeberUnsPage() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-32 pb-16"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            Über uns
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-600 max-w-3xl"
          >
            Lernen Sie das Team hinter Cogniiq kennen -
            Ihre Partner für AI und Webdesign.
          </motion.p>
        </div>
      </motion.div>
      <AboutSection />
    </>
  );
}
