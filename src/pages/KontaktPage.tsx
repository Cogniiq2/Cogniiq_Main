import { motion } from 'framer-motion';
import { ContactSection } from '@/components/ContactSection';
import { NAP } from '@/components/NAP';
import { PageSEO } from '@/components/PageSEO';
import { getGoogleMapsUrl, getGoogleMapsEmbedUrl, BUSINESS_INFO, PAGE_META } from '@/lib/seo-data';
import { MapPin } from 'lucide-react';

export function KontaktPage() {
  return (
    <>
      <PageSEO
        title={PAGE_META.kontakt.title}
        description={PAGE_META.kontakt.description}
        canonical={PAGE_META.kontakt.canonical}
        breadcrumbs={[
          { name: "Home", url: BUSINESS_INFO.website },
          { name: "Kontakt", url: PAGE_META.kontakt.canonical },
        ]}
      />
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
            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6"
          >
            Kontakt
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mb-12"
          >
            Lassen Sie uns über Ihr Projekt sprechen.
            Wir freuen uns auf Ihre Nachricht!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-2 gap-12 mb-16"
          >
            <div className="bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-lg p-8 transition-colors duration-300">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Kontaktdaten
              </h2>
              <NAP variant="vertical" showIcons={true} />
              <div className="mt-8">
                <a
                  href={getGoogleMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#515A61] dark:text-sky-400 hover:text-[#434A51] dark:hover:text-sky-300 font-medium transition-colors"
                >
                  <MapPin size={18} />
                  Auf Google Maps anzeigen
                </a>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 h-[400px]">
              <iframe
                src={getGoogleMapsEmbedUrl()}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Standort von ${BUSINESS_INFO.name} in ${BUSINESS_INFO.address.addressLocality}`}
                className="w-full h-full"
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
      <ContactSection />
    </>
  );
}
