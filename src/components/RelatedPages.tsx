import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Zap, Globe, TriangleAlert as AlertTriangle, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import type { CityServiceConfig } from "@/lib/standorte-data";

interface RelatedPagesProps {
  config: CityServiceConfig;
}

const ALL_CITY_SERVICE_LINKS: Record<string, Array<{ label: string; href: string }>> = {
  webdesign: [
    { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
    { label: "Webdesign München", href: "/muenchen/webdesign" },
    { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
  ],
  "ki-telefonassistent": [
    { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
    { label: "KI-Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
    { label: "KI-Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
  ],
  automatisierung: [
    { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
    { label: "Automatisierung München", href: "/muenchen/automatisierung" },
    { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
  ],
};

const PROBLEM_LINKS = [
  { label: "Verpasste Anrufe & Umsatzverlust", href: "/verpasste-anrufe-verlust" },
  { label: "Website bringt keine Anfragen", href: "/keine-anfragen-website" },
  { label: "Zu viel manuelle Arbeit", href: "/zu-viel-manuelle-arbeit" },
  { label: "Keine automatische Terminbuchung", href: "/keine-terminbuchung" },
];

const INDUSTRY_LINKS: Record<string, Array<{ label: string; href: string }>> = {
  webdesign: [
    { label: "Webdesign für Arztpraxen", href: "/webdesign-arzt" },
    { label: "Webdesign für Gastronomie", href: "/webdesign-gastronomie" },
    { label: "Webdesign für Immobilien", href: "/webdesign-immobilien" },
    { label: "Webdesign für Hotels", href: "/webdesign-hotel" },
  ],
  "ki-telefonassistent": [
    { label: "KI-Telefonassistent für Praxen", href: "/ki-telefonassistent-arzt" },
    { label: "KI-Telefonassistent für Restaurants", href: "/ki-telefonassistent-restaurant" },
    { label: "KI-Telefonassistent für Hotels", href: "/ki-telefonassistent-hotel" },
  ],
  automatisierung: [
    { label: "Automatisierung für Arztpraxen", href: "/automatisierung-arzt" },
    { label: "Automatisierung für Restaurants", href: "/automatisierung-restaurant" },
    { label: "Automatisierung für Immobilien", href: "/automatisierung-immobilien" },
  ],
};

export function RelatedPages({ config }: RelatedPagesProps) {
  const sameServiceLinks = ALL_CITY_SERVICE_LINKS[config.serviceSlug] ?? [];
  const filteredSameService = sameServiceLinks.filter((l) => l.href !== config.route);
  const otherServiceLinks = config.otherServicesInCity;
  const industryLinks = INDUSTRY_LINKS[config.serviceSlug] ?? [];

  return (
    <section
      className="py-16 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 transition-colors duration-300"
      aria-label="Verwandte Seiten"
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid gap-10 md:grid-cols-3 mb-10"
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={15} className="text-gray-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                {config.service} auch verfügbar in
              </span>
            </div>
            <ul className="space-y-2">
              {filteredSameService.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="group inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors text-sm"
                  >
                    <ArrowRight size={14} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap size={15} className="text-gray-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Weitere Leistungen in {config.city}
              </span>
            </div>
            <ul className="space-y-2">
              {otherServiceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="group inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors text-sm"
                  >
                    <ArrowRight size={14} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Globe size={15} className="text-gray-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Regionaler Überblick
              </span>
            </div>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/bayern"
                  className="group inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors text-sm"
                >
                  <ArrowRight size={14} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
                  KI-Agentur Bayern – Übersicht
                </Link>
              </li>
              <li>
                <Link
                  to="/ki-agentur-deutschland"
                  className="group inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors text-sm"
                >
                  <ArrowRight size={14} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
                  KI-Agentur Deutschland
                </Link>
              </li>
              <li>
                <Link
                  to="/leistungen"
                  className="group inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors text-sm"
                >
                  <ArrowRight size={14} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
                  Alle Leistungen von Cogniiq
                </Link>
              </li>
            </ul>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="pt-8 border-t border-gray-100 dark:border-gray-800 grid md:grid-cols-2 gap-10"
        >
          {industryLinks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={15} className="text-gray-400" />
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  {config.service} nach Branche
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {industryLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-xs font-medium text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  >
                    {link.label}
                    <ArrowRight size={10} className="text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={15} className="text-gray-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Häufige Probleme – direkt adressiert
              </span>
            </div>
            <ul className="space-y-1.5">
              {PROBLEM_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="group inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    <ArrowRight size={12} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-5">
            Alle Leistungen in Bayern
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {Object.entries(ALL_CITY_SERVICE_LINKS).map(([serviceSlug, links]) => (
              <div key={serviceSlug}>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-2">
                  {serviceSlug === "ki-telefonassistent"
                    ? "KI-Telefonassistent"
                    : serviceSlug === "webdesign"
                    ? "Webdesign"
                    : "Automatisierung"}
                </p>
                <ul className="space-y-1.5">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        to={link.href}
                        className={`group inline-flex items-center gap-1.5 text-sm transition-colors ${
                          link.href === config.route
                            ? "text-gray-400 dark:text-gray-600 pointer-events-none"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium"
                        }`}
                        aria-current={link.href === config.route ? "page" : undefined}
                      >
                        {link.href !== config.route && (
                          <ArrowRight size={12} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                        )}
                        {link.href === config.route && (
                          <span className="w-3 h-px bg-gray-300 dark:bg-gray-600 inline-block flex-shrink-0" />
                        )}
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
