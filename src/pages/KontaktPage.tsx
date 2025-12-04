import { motion } from 'framer-motion';
import { ContactSection } from '@/components/ContactSection';
import { NAP } from '@/components/NAP';
import { getGoogleMapsUrl, BUSINESS_INFO } from '@/lib/seo-data';
import { MapPin } from 'lucide-react';

export function KontaktPage() {
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
            Kontakt
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-600 max-w-3xl mb-12"
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
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Kontaktdaten
              </h2>
              <NAP variant="vertical" showIcons={true} />
              <div className="mt-8">
                <a
                  href={getGoogleMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#515A61] hover:text-[#434A51] font-medium transition-colors"
                >
                  <MapPin size={18} />
                  Auf Google Maps anzeigen
                </a>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-lg h-[400px]">
              <iframe
                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2562.8!2d${BUSINESS_INFO.geo.longitude}!3d${BUSINESS_INFO.geo.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDnCsDU2JzUzLjciTiAxMcKwMzQnNDEuOCJF!5e0!3m2!1sde!2sde!4v1234567890`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Standort von ${BUSINESS_INFO.name} in ${BUSINESS_INFO.address.addressLocality}`}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
      <ContactSection />
    </>
  );
}
