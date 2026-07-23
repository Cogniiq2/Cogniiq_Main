import { motion } from 'framer-motion';
import { PageSEO } from '@/components/PageSEO';
import { BUSINESS_INFO } from '@/lib/seo-data';
import { DatenschutzContent } from '@/lib/legal-content';

const base = BUSINESS_INFO.website;

export function DatenschutzPage() {
  return (
    <>
      <PageSEO
        title="Datenschutzerklärung | Cogniiq"
        description="Datenschutzerklärung von Cogniiq: Welche Daten wir verarbeiten, Hosting, Kontaktanfragen, Google Ads mit Einwilligung (Consent Mode v2) und Ihre Rechte."
        canonical={`${base}/datenschutz`}
        breadcrumbs={[
          { name: 'Home', url: base },
          { name: 'Datenschutz', url: `${base}/datenschutz` },
        ]}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-32 pb-20"
      >
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h1 className="mb-8 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Datenschutzerklärung
          </h1>
          <DatenschutzContent />
        </div>
      </motion.div>
    </>
  );
}

export default DatenschutzPage;
