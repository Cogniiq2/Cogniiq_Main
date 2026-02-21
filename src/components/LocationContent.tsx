import { MapPin, Users, Building2, Zap, Clock, Phone, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { BUSINESS_INFO, getGoogleMapsUrl, getGoogleMapsEmbedUrl } from "@/lib/seo-data";
import { motion } from "framer-motion";

const SERVICE_CITIES: Array<{ label: string; href: string }> = [
  { label: "Bayreuth", href: "/bayreuth" },
  { label: "München", href: "/muenchen" },
  { label: "Regensburg", href: "/regensburg" },
  { label: "Nürnberg", href: "#" },
  { label: "Bamberg", href: "#" },
  { label: "Würzburg", href: "#" },
  { label: "Erlangen", href: "#" },
  { label: "Fürth", href: "#" },
  { label: "Ingolstadt", href: "#" },
  { label: "Augsburg", href: "#" },
];

const BAYREUTH_SERVICES = [
  { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
  { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
  { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
];

const BAYERN_SERVICES = [
  { label: "Webdesign München", href: "/muenchen/webdesign" },
  { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
  { label: "KI-Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
  { label: "KI-Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
  { label: "Automatisierung München", href: "/muenchen/automatisierung" },
  { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
];

const DEUTSCHLAND_SERVICES = [
  { label: "Webdesign Deutschland", href: "/deutschland" },
  { label: "KI-Telefonassistent Deutschland", href: "/deutschland" },
  { label: "Automatisierung Deutschland", href: "/deutschland" },
];

const LOKAL_LINKS = [
  { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
  { label: "Webdesign München", href: "/muenchen/webdesign" },
  { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
  { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
  { label: "KI-Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
  { label: "KI-Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
  { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
  { label: "Automatisierung München", href: "/muenchen/automatisierung" },
  { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
];

function InternalLink({ href, label }: { href: string; label: string }) {
  const isExternal = href === "#";
  if (isExternal) {
    return <span className="text-[#515A61] dark:text-sky-400 font-medium">{label}</span>;
  }
  return (
    <Link
      to={href}
      className="text-[#515A61] dark:text-sky-400 hover:text-[#3a4147] dark:hover:text-sky-300 font-medium underline underline-offset-2 decoration-[#515A61]/30 dark:decoration-sky-400/30 hover:decoration-[#515A61] dark:hover:decoration-sky-300 transition-colors"
    >
      {label}
    </Link>
  );
}

export function LocationContent() {
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
            Ihre AI &amp; Webdesign Agentur in{" "}
            <span className="text-[#515A61] dark:text-sky-400">Bayreuth</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Als AI- und Webdesign-Agentur in Bayreuth entwickelt Cogniiq Websites,{" "}
            <InternalLink href="/bayreuth/ki-telefonassistent" label="KI-Telefonassistenten" />{" "}
            und{" "}
            <InternalLink href="/bayreuth/automatisierung" label="Automatisierungssysteme" />{" "}
            für Unternehmen jeder Größe. Unsere Lösungen verbinden{" "}
            <InternalLink href="/bayreuth/webdesign" label="Webdesign" />,
            künstliche Intelligenz und Prozessautomatisierung zu einem durchgängigen digitalen Vertriebssystem.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            className="relative p-6 rounded-2xl transition-colors duration-300 bg-[#515A61] dark:bg-gray-800 text-white shadow-lg"
          >
            <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-widest bg-white/20 dark:bg-white/10 px-2 py-0.5 rounded-full text-white">
              Hauptsitz
            </span>
            <MapPin size={32} className="mb-4 text-white" />
            <h3 className="text-xl font-semibold mb-2 text-white">Bayreuth</h3>
            <p className="text-gray-100 mb-5">
              Unser Hauptsitz im Herzen von Bayreuth. Persönliche Beratung vor Ort jederzeit möglich.
            </p>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
              Leistungen in Bayreuth
            </p>
            <ul className="space-y-1.5">
              {BAYREUTH_SERVICES.map((s) => (
                <li key={s.href}>
                  <Link
                    to={s.href}
                    className="text-sm text-white/80 hover:text-white transition-colors underline underline-offset-2 decoration-white/30 hover:decoration-white"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative p-6 rounded-2xl transition-colors duration-300 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
          >
            <Building2 size={32} className="mb-4 text-[#515A61] dark:text-sky-400" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Bayern</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-5">
              Wir betreuen Unternehmen in ganz Bayern – von München bis Nürnberg, von Augsburg bis Regensburg.
            </p>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Leistungen in Bayern
            </p>
            <ul className="space-y-1.5">
              {BAYERN_SERVICES.map((s) => (
                <li key={s.href}>
                  <Link
                    to={s.href}
                    className="text-sm text-[#515A61] dark:text-sky-400 hover:text-[#3a4147] dark:hover:text-sky-300 transition-colors underline underline-offset-2 decoration-[#515A61]/30 dark:decoration-sky-400/30 hover:decoration-[#515A61] dark:hover:decoration-sky-300"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative p-6 rounded-2xl transition-colors duration-300 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
          >
            <Users size={32} className="mb-4 text-[#515A61] dark:text-sky-400" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Deutschland</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-5">
              Remote-Zusammenarbeit mit Kunden in ganz Deutschland und darüber hinaus.
            </p>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Digitale Leistungen
            </p>
            <ul className="space-y-1.5">
              {DEUTSCHLAND_SERVICES.map((s) => (
                <li key={s.label}>
                  <Link
                    to={s.href}
                    className="text-sm text-[#515A61] dark:text-sky-400 hover:text-[#3a4147] dark:hover:text-sky-300 transition-colors underline underline-offset-2 decoration-[#515A61]/30 dark:decoration-sky-400/30 hover:decoration-[#515A61] dark:hover:decoration-sky-300"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
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
                Als <strong className="text-gray-800 dark:text-gray-200">AI- und Webdesign-Agentur in Bayreuth</strong> verstehen
                wir die Anforderungen lokaler Unternehmen. Gleichzeitig betreuen wir Kunden in{" "}
                <Link to="/muenchen" className="font-medium text-[#515A61] dark:text-sky-400 hover:underline">München</Link>{" "}
                und{" "}
                <Link to="/regensburg" className="font-medium text-[#515A61] dark:text-sky-400 hover:underline">Regensburg</Link>{" "}
                mit denselben hochwertigen Systemen.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Unsere Kernleistungen stehen für alle drei Standorte zur Verfügung:
              </p>

              <div className="grid grid-cols-1 gap-1.5 mb-6">
                {LOKAL_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-sm text-[#515A61] dark:text-sky-400 hover:text-[#3a4147] dark:hover:text-sky-300 font-medium underline underline-offset-2 decoration-[#515A61]/30 dark:decoration-sky-400/30 hover:decoration-[#515A61] dark:hover:decoration-sky-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

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
              city.href === "#" ? (
                <span
                  key={city.label}
                  className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-full transition-colors duration-300"
                  itemProp="areaServed"
                >
                  {city.label}
                </span>
              ) : (
                <Link
                  key={city.label}
                  to={city.href}
                  className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[#515A61] dark:text-sky-400 hover:border-[#515A61] dark:hover:border-sky-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition-colors duration-300 font-medium"
                  itemProp="areaServed"
                >
                  {city.label}
                </Link>
              )
            ))}
            <span className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-500 rounded-full italic transition-colors duration-300">
              &amp; ganz Deutschland
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
