import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Zap, Globe } from "lucide-react";
import { motion } from "framer-motion";
import type { CityServiceConfig } from "@/lib/standorte-data";

interface RelatedPagesProps {
  config: CityServiceConfig;
}

export function RelatedPages({ config }: RelatedPagesProps) {
  const hasOtherCities = config.sameServiceOtherCities.length > 0;
  const hasOtherServices = config.otherServicesInCity.length > 0;

  const cols = [hasOtherCities, hasOtherServices, true].filter(Boolean).length;

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
          className={`grid gap-10 ${cols === 3 ? "md:grid-cols-3" : cols === 2 ? "md:grid-cols-2" : ""}`}
        >
          {hasOtherCities && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={15} className="text-gray-400" />
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Auch verfügbar in
                </span>
              </div>
              <ul className="space-y-2">
                {config.sameServiceOtherCities.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="group inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors text-sm"
                    >
                      <ArrowRight size={14} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasOtherServices && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap size={15} className="text-gray-400" />
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Weitere Leistungen in {config.city}
                </span>
              </div>
              <ul className="space-y-2">
                {config.otherServicesInCity.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="group inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors text-sm"
                    >
                      <ArrowRight size={14} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
                  <ArrowRight size={14} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                  KI-Agentur Bayern – Übersicht
                </Link>
              </li>
              <li>
                <Link
                  to="/leistungen"
                  className="group inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors text-sm"
                >
                  <ArrowRight size={14} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                  Alle Leistungen von Cogniiq
                </Link>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
