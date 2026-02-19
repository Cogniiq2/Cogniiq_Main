import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Phone, Zap, Globe } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";
import { CITY_LINKS } from "@/lib/standorte-data";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

const SERVICES_OVERVIEW = [
  {
    icon: Phone,
    title: "KI Telefonassistent",
    description: "Automatische Anrufannahme, Terminbuchung und Weiterleitung. Für Praxen, Gastronomie und Dienstleister in Bayern.",
    slug: "ki-telefonassistent",
  },
  {
    icon: Zap,
    title: "Automatisierung",
    description: "Geschäftsprozesse automatisieren mit n8n, Make.com und direkten API-Integrationen. Einmalig eingerichtet, dauerhaft entlastend.",
    slug: "automatisierung",
  },
  {
    icon: Globe,
    title: "Webdesign",
    description: "Hochkonvertierende Websites für Unternehmen in Bayern. Individuell entwickelt, technisch sauber, auf Leads ausgerichtet.",
    slug: "webdesign",
  },
];

const cities = Object.entries(CITY_LINKS) as Array<[string, typeof CITY_LINKS[keyof typeof CITY_LINKS]]>;

export function BayernPage() {
  return (
    <>
      <PageSEO
        title="KI Agentur Bayern – AI Rezeption, Automatisierung & Webdesign | Cogniiq"
        description="Cogniiq ist Ihre AI Agentur für Bayern. KI Telefonassistent, Prozessautomatisierung und Webdesign für Unternehmen in Bayreuth, Regensburg, München und ganz Bayern."
        canonical={`${BUSINESS_INFO.website}/bayern`}
        breadcrumbs={[
          { name: "Home", url: BUSINESS_INFO.website },
          { name: "Bayern", url: `${BUSINESS_INFO.website}/bayern` },
        ]}
      />

      <main>
        <section className="pt-32 pb-20 bg-white dark:bg-gray-950 transition-colors duration-300">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.1}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium tracking-wide uppercase mb-6">
                <MapPin size={12} />
                Bayern · Deutschland
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight mb-6">
                KI Agentur für Bayern
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed mb-8">
                Cogniiq entwickelt KI-Lösungen und digitale Systeme für Unternehmen in ganz Bayern.
                Mit Hauptsitz in Bayreuth betreuen wir Kunden in Regensburg, München und
                darüber hinaus – persönlich vor Ort oder remote.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/kontakt"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-colors"
                >
                  Kostenloses Erstgespräch
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/leistungen"
                  className="inline-flex items-center gap-2 px-6 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
                >
                  Alle Leistungen
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {["Bayreuth", "Regensburg", "München", "Bayern", "KI Telefonassistent", "Automatisierung", "Webdesign"].map((item, i) => (
                <span key={i} className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  {i > 0 && <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true" />}
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="services-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-12"
            >
              <h2 id="services-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Unsere Leistungen in Bayern
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Drei Bereiche – alle darauf ausgelegt, Ihren Betrieb effizienter und sichtbarer zu machen.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {SERVICES_OVERVIEW.map((service, i) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.slug}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i * 0.1}
                    className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-6"
                  >
                    <Icon size={24} className="mb-4 text-[#515A61] dark:text-sky-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {service.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                      {service.description}
                    </p>
                    <div className="space-y-1.5">
                      {cities.map(([, cityData]) => (
                        <Link
                          key={`${cityData.label}-${service.slug}`}
                          to={`/${Object.keys(CITY_LINKS).find(k => CITY_LINKS[k as keyof typeof CITY_LINKS] === cityData)}/${service.slug}`}
                          className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors group"
                        >
                          <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                          {service.title} {cityData.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300" aria-labelledby="cities-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-12"
            >
              <h2 id="cities-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Standorte & Servicegebiete
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Wir betreuen Unternehmen vor Ort und remote in ganz Bayern.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {cities.map(([slug, cityData], i) => (
                <motion.div
                  key={slug}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.1}
                  className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={16} className="text-[#515A61] dark:text-sky-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {cityData.label}
                    </h3>
                    {slug === "bayreuth" && (
                      <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                        Hauptsitz
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {cityData.services.map((service) => (
                      <li key={service.href}>
                        <Link
                          to={service.href}
                          className="group flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        >
                          <ArrowRight size={13} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                          {service.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Projekt besprechen
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Kostenloses Erstgespräch – für Unternehmen in ganz Bayern. Remote oder persönlich.
              </p>
              <Link
                to="/kontakt"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-white transition-colors"
              >
                Kostenloses Erstgespräch
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
