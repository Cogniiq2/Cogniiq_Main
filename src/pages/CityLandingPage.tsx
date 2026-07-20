import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Phone, Zap, Globe, ChevronRight, CheckCircle2 } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";
import type { CitySlug } from "@/lib/standorte-data";
import { CITY_LINKS } from "@/lib/standorte-data";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

interface CityConfig {
  slug: CitySlug;
  city: string;
  region: string;
  canonical: string;
  title: string;
  description: string;
  intro: string;
  tagline: string;
}

const CITY_CONFIGS: Record<CitySlug, CityConfig> = {
  bayreuth: {
    slug: "bayreuth",
    city: "Bayreuth",
    region: "Oberfranken",
    canonical: `${BUSINESS_INFO.website}/bayreuth`,
    title: "AI-Systeme & Webdesign in Bayreuth | Cogniiq",
    description: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungslösungen für Unternehmen in Bayreuth. Persönliche Beratung vor Ort, schnelle Umsetzung, messbare Ergebnisse.",
    intro: "Als AI- und Webdesign-Agentur mit Hauptsitz in Bayreuth betreuen wir Unternehmen in Oberfranken und ganz Bayern mit hochwertigen digitalen Systemen.",
    tagline: "Webdesign Bayreuth · KI-Telefonassistent Bayreuth · Automatisierung Bayreuth",
  },
  muenchen: {
    slug: "muenchen",
    city: "München",
    region: "Bayern",
    canonical: `${BUSINESS_INFO.website}/muenchen`,
    title: "AI-Systeme & Webdesign in München | Cogniiq",
    description: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungslösungen für Unternehmen in München. Hochwertige digitale Systeme für den Münchner Markt.",
    intro: "Cogniiq entwickelt digitale Systeme für Unternehmen in München – von hochkonvertierenden Websites über KI-Telefonassistenten bis zu vollautomatisierten Prozessen.",
    tagline: "Webdesign München · KI-Telefonassistent München · Automatisierung München",
  },
  regensburg: {
    slug: "regensburg",
    city: "Regensburg",
    region: "Ostbayern",
    canonical: `${BUSINESS_INFO.website}/regensburg`,
    title: "AI-Systeme & Webdesign in Regensburg | Cogniiq",
    description: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungslösungen für Unternehmen in Regensburg. Digitale Systeme für die Region Ostbayern.",
    intro: "Cogniiq betreut Unternehmen in Regensburg und der Region Ostbayern mit maßgeschneiderten Websites, KI-Telefonassistenten und Automatisierungslösungen.",
    tagline: "Webdesign Regensburg · KI-Telefonassistent Regensburg · Automatisierung Regensburg",
  },
};

const SERVICE_ICONS = {
  webdesign: Globe,
  "ki-telefonassistent": Phone,
  automatisierung: Zap,
};

interface Props {
  citySlug: CitySlug;
}

export function CityLandingPage({ citySlug }: Props) {
  const config = CITY_CONFIGS[citySlug];
  const cityLinks = CITY_LINKS[citySlug];

  const otherCities = (Object.keys(CITY_LINKS) as CitySlug[]).filter((s) => s !== citySlug);

  const breadcrumbs = [
    { name: "Home", url: BUSINESS_INFO.website },
    { name: "Bayern", url: `${BUSINESS_INFO.website}/bayern` },
    { name: config.city, url: config.canonical },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `${BUSINESS_INFO.website}/#localbusiness`,
        "name": BUSINESS_INFO.name,
        "url": BUSINESS_INFO.website,
        "telephone": BUSINESS_INFO.contact.phone,
        "email": BUSINESS_INFO.contact.email,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": BUSINESS_INFO.address.addressLocality,
          "addressRegion": BUSINESS_INFO.address.addressRegion,
          "postalCode": BUSINESS_INFO.address.postalCode,
          "addressCountry": BUSINESS_INFO.address.addressCountry,
        },
        "areaServed": [
          { "@type": "City", "name": config.city },
        ],
      },
    ],
  };

  return (
    <>
      <PageSEO
        title={config.title}
        description={config.description}
        canonical={config.canonical}
        breadcrumbs={breadcrumbs}
        additionalSchema={schema}
      />

      <main className="min-h-screen bg-white dark:bg-gray-950">
        <section className="pt-32 pb-20 bg-white dark:bg-gray-950 transition-colors duration-300">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Home</Link>
              <ChevronRight size={12} />
              <Link to="/bayern" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Bayern</Link>
              <ChevronRight size={12} />
              <span className="text-gray-600 dark:text-gray-300">{config.city}</span>
            </motion.nav>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.1}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium tracking-wide uppercase mb-6">
                <MapPin size={12} />
                {config.city} · {config.region}
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6 tracking-tight leading-tight">
                AI-Systeme &amp; Webdesign in {config.city}
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-400 mb-4 max-w-2xl leading-relaxed">
                {config.intro}
              </p>

              <p className="text-sm text-gray-400 dark:text-gray-500 mb-10">
                {config.tagline}
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/kontakt"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-white transition-colors"
                >
                  Kostenloses Erstgespräch
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/leistungen"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-gray-500 transition-colors"
                >
                  Leistungen ansehen
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Unsere Leistungen in {config.city}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Wir realisieren Webdesign-Projekte, KI-Telefonassistenten und Automatisierungssysteme für Unternehmen in {config.city}.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {cityLinks.services.map((service, i) => {
                const serviceKey = service.href.split("/").pop() as keyof typeof SERVICE_ICONS;
                const Icon = SERVICE_ICONS[serviceKey] ?? Globe;
                return (
                  <motion.div
                    key={service.href}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i * 0.1}
                  >
                    <Link
                      to={service.href}
                      className="group flex flex-col gap-4 p-6 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                        <Icon size={18} className="text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {service.label}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Für Unternehmen in {config.city}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors mt-auto">
                        Mehr erfahren
                        <ChevronRight size={14} />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-10"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Weitere Standorte
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Cogniiq betreut Unternehmen neben {config.city} auch in weiteren Städten:
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {otherCities.map((otherSlug, i) => {
                const otherCity = CITY_LINKS[otherSlug];
                return (
                  <motion.div
                    key={otherSlug}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i * 0.1}
                    className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin size={15} className="text-gray-400" />
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {otherCity.label}
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {otherCity.services.map((s) => (
                        <li key={s.href}>
                          <Link
                            to={s.href}
                            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors group"
                          >
                            <CheckCircle2 size={13} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                            {s.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
