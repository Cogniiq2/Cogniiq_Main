import { MapPin, Users, Building2, Zap, Clock, Phone, ExternalLink } from "lucide-react";
import { BUSINESS_INFO, getGoogleMapsUrl, getGoogleMapsEmbedUrl } from "@/lib/seo-data";
import { motion } from "framer-motion";

const SERVICE_CITIES = [
  "Bayreuth", "München", "Nürnberg", "Regensburg",
  "Bamberg", "Würzburg", "Erlangen", "Fürth",
  "Ingolstadt", "Augsburg",
];

export function LocationContent() {
  const locations = [
    {
      icon: MapPin,
      title: "Bayreuth",
      description: "Unser Hauptsitz im Herzen von Bayreuth. Persönliche Beratung vor Ort jederzeit möglich.",
      emphasis: "primary",
      badge: "Hauptsitz",
    },
    {
      icon: Building2,
      title: "Bayern",
      description: "Wir betreuen Unternehmen in ganz Bayern – von München bis Nürnberg, von Augsburg bis Regensburg.",
      emphasis: "secondary",
    },
    {
      icon: Users,
      title: "Deutschland",
      description: "Remote-Zusammenarbeit mit Kunden in ganz Deutschland und darüber hinaus.",
      emphasis: "secondary",
    },
  ];

  return (
    <section
      id="standort"
      aria-labelledby="location-heading"
      className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 transition-colors duration-300"
      itemScope
      itemType="https://schema.org/LocalBusiness"
    >
      <meta itemProp="name" content={BUSINESS_INFO.name} />
      <meta itemProp="telephone" content={BUSINESS_INFO.contact.phone} />
      <meta itemProp="email" content={BUSINESS_INFO.contact.email} />
      <meta itemProp="url" content={BUSINESS_INFO.website} />
      <div
        itemProp="address"
        itemScope
        itemType="https://schema.org/PostalAddress"
        className="hidden"
      >
        <span itemProp="streetAddress">{BUSINESS_INFO.address.streetAddress}</span>
        <span itemProp="addressLocality">{BUSINESS_INFO.address.addressLocality}</span>
        <span itemProp="addressRegion">{BUSINESS_INFO.address.addressRegion}</span>
        <span itemProp="postalCode">{BUSINESS_INFO.address.postalCode}</span>
        <span itemProp="addressCountry">{BUSINESS_INFO.address.addressCountry}</span>
      </div>
      <div
        itemProp="geo"
        itemScope
        itemType="https://schema.org/GeoCoordinates"
        className="hidden"
      >
        <meta itemProp="latitude" content={BUSINESS_INFO.geo.latitude} />
        <meta itemProp="longitude" content={BUSINESS_INFO.geo.longitude} />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2
            id="location-heading"
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4"
          >
            Ihre AI & Webdesign Agentur in{" "}
            <span className="text-[#515A61] dark:text-sky-400">Bayreuth</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Mit Sitz in Bayreuth betreuen wir Unternehmen in ganz Deutschland.
            Ob persönlich vor Ort oder remote – wir finden die beste Lösung für Ihr Projekt.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {locations.map((location, index) => {
            const Icon = location.icon;
            return (
              <motion.div
                key={location.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-6 rounded-2xl transition-colors duration-300 ${
                  location.emphasis === "primary"
                    ? "bg-[#515A61] dark:bg-gray-800 text-white shadow-lg"
                    : "bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
                }`}
              >
                {location.badge && (
                  <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-widest bg-white/20 dark:bg-white/10 px-2 py-0.5 rounded-full text-white">
                    {location.badge}
                  </span>
                )}
                <Icon
                  size={32}
                  className={`mb-4 ${
                    location.emphasis === "primary"
                      ? "text-white"
                      : "text-[#515A61] dark:text-sky-400"
                  }`}
                />
                <h3
                  className={`text-xl font-semibold mb-2 ${
                    location.emphasis === "primary"
                      ? "text-white"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {location.title}
                </h3>
                <p
                  className={
                    location.emphasis === "primary"
                      ? "text-gray-100"
                      : "text-gray-600 dark:text-gray-400"
                  }
                >
                  {location.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-lg p-8 md:p-12 transition-colors duration-300"
        >
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap size={24} className="text-[#515A61] dark:text-sky-400" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Lokal verwurzelt, digital vernetzt
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
                Als <strong className="text-gray-800 dark:text-gray-200">AI Agentur und Webdesign Agentur in Bayreuth</strong> verstehen
                wir die Bedürfnisse lokaler Unternehmen. Gleichzeitig nutzen wir modernste
                Technologien, um Kunden in ganz Deutschland zu betreuen.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                <strong className="text-gray-800 dark:text-gray-200">Persönliche Termine</strong> sind im Raum Bayreuth, Regensburg und
                München möglich. Für alle anderen Standorte arbeiten wir remote – mit den
                gleichen hohen Standards.
              </p>

              <div className="space-y-3 mb-6">
                <a
                  href={getGoogleMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#515A61] dark:text-sky-400 hover:text-[#434A51] dark:hover:text-sky-300 font-medium transition-colors"
                  aria-label={`Cogniiq auf Google Maps öffnen: ${BUSINESS_INFO.address.streetAddress}, ${BUSINESS_INFO.address.postalCode} ${BUSINESS_INFO.address.addressLocality}`}
                >
                  <MapPin size={16} />
                  <span>
                    {BUSINESS_INFO.address.streetAddress},{" "}
                    {BUSINESS_INFO.address.postalCode} {BUSINESS_INFO.address.addressLocality}
                  </span>
                </a>

                <a
                  href={`tel:${BUSINESS_INFO.contact.phone}`}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  aria-label={`Cogniiq anrufen: ${BUSINESS_INFO.contact.phoneDisplay}`}
                >
                  <Phone size={16} />
                  <span>{BUSINESS_INFO.contact.phoneDisplay}</span>
                </a>

                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500 text-sm">
                  <Clock size={15} />
                  <span>
                    Mo–Fr {BUSINESS_INFO.businessHours.opens} – {BUSINESS_INFO.businessHours.closes} Uhr
                  </span>
                </div>
              </div>

              <a
                href={getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#515A61] dark:bg-gray-700 hover:bg-[#434A51] dark:hover:bg-gray-600 text-white rounded-xl font-medium text-sm transition-colors"
              >
                <ExternalLink size={15} />
                In Google Maps öffnen
              </a>
            </div>

            <div
              className="relative rounded-xl overflow-hidden shadow-md h-[300px] md:h-[380px] ring-1 ring-gray-200 dark:ring-gray-700"
              aria-label={`Karte: ${BUSINESS_INFO.name}, ${BUSINESS_INFO.address.streetAddress}, ${BUSINESS_INFO.address.postalCode} ${BUSINESS_INFO.address.addressLocality}`}
            >
              <iframe
                title={`Standort von ${BUSINESS_INFO.name} in ${BUSINESS_INFO.address.addressLocality}`}
                src={getGoogleMapsEmbedUrl()}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 text-center mb-4">
            Servicegebiete
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SERVICE_CITIES.map((city) => (
              <span
                key={city}
                className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-full transition-colors duration-300"
                itemProp="areaServed"
              >
                {city}
              </span>
            ))}
            <span className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-500 rounded-full italic transition-colors duration-300">
              & ganz Deutschland
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
