import { motion } from 'framer-motion';
import { PageSEO } from '@/components/PageSEO';
import { BUSINESS_INFO } from '@/lib/seo-data';
import { ImpressumContent } from '@/lib/legal-content';

const base = BUSINESS_INFO.website;

export function ImpressumPage() {
  return (
    <>
      <PageSEO
        title="Impressum | Cogniiq"
        description="Impressum von Cogniiq – Anbieterkennzeichnung gemäß § 5 DDG, Kontaktangaben und rechtliche Hinweise."
        canonical={`${base}/impressum`}
        breadcrumbs={[
          { name: 'Home', url: base },
          { name: 'Impressum', url: `${base}/impressum` },
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
            Impressum
          </h1>
          <ImpressumContent />
        </div>
      </motion.div>
    </>
  );
}

export default ImpressumPage;
