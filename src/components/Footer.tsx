import { useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";
import { NAP } from "./NAP";
import { BUSINESS_INFO } from "@/lib/seo-data";
import { ThemeToggle } from "./ui/theme-toggle";

const linkClass =
  "text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors";

const headingClass =
  "font-semibold text-gray-900 dark:text-gray-100 mb-4 text-sm uppercase tracking-wider";

const subHeadingClass =
  "text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-1.5 mt-4 first:mt-0";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [openPanel, setOpenPanel] = useState<"impressum" | "datenschutz" | null>(null);

  return (
    <>
      <footer
        className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pt-16 pb-8 transition-colors duration-300"
        role="contentinfo"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          {/* MAIN GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-8 mb-10">

            {/* COL 1 – Brand */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-1">
              <div className="mb-3">
                <Logo className="h-9" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                <strong className="text-gray-800 dark:text-gray-200">KI-Agentur & Webdesign für Unternehmen in Deutschland.</strong>{" "}
                Wir entwickeln KI-Telefonassistenten, Automatisierungen und hochkonvertierende Websites für Unternehmen in Bayern und ganz Deutschland.
              </p>
              <div className="space-y-1.5">
                <div>
                  <Link to="/leistungen" className={linkClass}>KI Agentur Bayern</Link>
                </div>
                <div>
                  <Link to="/leistungen" className={linkClass}>Webdesign Bayern</Link>
                </div>
                <div>
                  <Link to="/leistungen" className={linkClass}>Automatisierung Bayern</Link>
                </div>
              </div>
            </div>

            {/* COL 2 – Kontakt */}
            <div className="col-span-2 sm:col-span-1 lg:col-span-1">
              <h4 className={headingClass}>Kontakt</h4>
              <div className="mb-3 text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                <div className="font-medium text-gray-800 dark:text-gray-200">Cogniiq</div>
                <div>Lazar & Djordje Popovic</div>
              </div>
              <NAP variant="vertical" showIcons={true} />
            </div>

            {/* COL 3 – Leistungen */}
            <div>
              <h4 className={headingClass}>Leistungen</h4>
              <div className="space-y-1.5">
                <p className={subHeadingClass}>Deutschland</p>
                <div><Link to="/leistungen" className={linkClass}>Webdesign Deutschland</Link></div>
                <div><Link to="/leistungen" className={linkClass}>KI-Telefonassistent Deutschland</Link></div>
                <div><Link to="/leistungen" className={linkClass}>Automatisierung Deutschland</Link></div>

                <p className={subHeadingClass}>Bayern</p>
                <div><Link to="/bayreuth/webdesign" className={linkClass}>Webdesign Bayern</Link></div>
                <div><Link to="/bayreuth/ki-telefonassistent" className={linkClass}>KI-Telefonassistent Bayern</Link></div>
                <div><Link to="/bayreuth/automatisierung" className={linkClass}>Automatisierung Bayern</Link></div>
              </div>
            </div>

            {/* COL 4 – Regionen */}
            <div>
              <h4 className={headingClass}>Regionen</h4>
              <div className="space-y-1.5">
                <div>
                  <Link to="/deutschland" className={linkClass + " font-medium"}>Deutschland</Link>
                </div>
                <div>
                  <Link to="/bayern" className={linkClass + " font-medium"}>Bayern</Link>
                </div>
                <div>
                  <Link to="/bayern" className={linkClass}>Bayern – Alle Standorte</Link>
                </div>

                <div className="pt-2 space-y-1.5">
                  <div>
                    <Link to="/bayreuth" className={linkClass}>Bayreuth</Link>
                  </div>
                  <div>
                    <Link to="/muenchen" className={linkClass}>München</Link>
                  </div>
                  <div>
                    <Link to="/regensburg" className={linkClass}>Regensburg</Link>
                  </div>
                </div>
              </div>
            </div>

            {/* COL 5 – Leistungen nach Standort */}
            <div>
              <h4 className={headingClass}>Nach Standort</h4>
              <div className="space-y-1.5">
                <p className={subHeadingClass}>Bayreuth</p>
                <div><Link to="/bayreuth/webdesign" className={linkClass}>Webdesign Bayreuth</Link></div>
                <div><Link to="/bayreuth/ki-telefonassistent" className={linkClass}>KI-Telefonassistent Bayreuth</Link></div>
                <div><Link to="/bayreuth/automatisierung" className={linkClass}>Automatisierung Bayreuth</Link></div>

                <p className={subHeadingClass}>München</p>
                <div><Link to="/muenchen/webdesign" className={linkClass}>Webdesign München</Link></div>
                <div><Link to="/muenchen/ki-telefonassistent" className={linkClass}>KI-Telefonassistent München</Link></div>
                <div><Link to="/muenchen/automatisierung" className={linkClass}>Automatisierung München</Link></div>

                <p className={subHeadingClass}>Regensburg</p>
                <div><Link to="/regensburg/webdesign" className={linkClass}>Webdesign Regensburg</Link></div>
                <div><Link to="/regensburg/ki-telefonassistent" className={linkClass}>KI-Telefonassistent Regensburg</Link></div>
                <div><Link to="/regensburg/automatisierung" className={linkClass}>Automatisierung Regensburg</Link></div>
              </div>
            </div>

            {/* COL 6 – Branchen */}
            <div>
              <h4 className={headingClass}>Branchen</h4>
              <div className="space-y-1.5">
                <div><Link to="/leistungen" className={linkClass}>KI für Praxen</Link></div>
                <div><Link to="/leistungen" className={linkClass}>KI für Gastronomie</Link></div>
                <div><Link to="/leistungen" className={linkClass}>KI für Handwerk</Link></div>
                <div><Link to="/leistungen" className={linkClass}>KI für Dienstleister</Link></div>
                <div><Link to="/leistungen" className={linkClass}>Webdesign für Unternehmen</Link></div>
                <div><Link to="/leistungen" className={linkClass}>Automatisierung für KMU</Link></div>
              </div>
            </div>

            {/* COL 7 – Rechtliches */}
            <div>
              <h4 className={headingClass}>Rechtliches</h4>
              <div className="space-y-2">
                <div>
                  <button
                    onClick={() => setOpenPanel("impressum")}
                    className={linkClass + " block text-left w-full"}
                  >
                    Impressum
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => setOpenPanel("datenschutz")}
                    className={linkClass + " block text-left w-full"}
                  >
                    Datenschutz
                  </button>
                </div>
              </div>
              <div className="mt-6">
                <ThemeToggle />
              </div>
            </div>

          </div>

          {/* SEO TEXT BLOCK */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 mb-6">
            <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed max-w-4xl">
              <Link to="/" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Cogniiq</Link> ist eine{" "}
              <Link to="/leistungen" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">KI- und Webdesign-Agentur</Link>{" "}
              mit Sitz in{" "}
              <Link to="/bayreuth" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Bayreuth</Link>.
              Wir entwickeln{" "}
              <Link to="/leistungen" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Websites</Link>,{" "}
              <Link to="/bayreuth/ki-telefonassistent" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">KI-Telefonassistenten</Link>{" "}
              und{" "}
              <Link to="/bayreuth/automatisierung" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Automatisierungssysteme</Link>{" "}
              für Unternehmen in{" "}
              <Link to="/bayern" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Bayern</Link>{" "}
              und ganz{" "}
              <Link to="/deutschland" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Deutschland</Link>.
              Unsere Leistungen verbinden{" "}
              <Link to="/leistungen" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Webdesign</Link>,
              künstliche Intelligenz und Prozessautomatisierung zu einem durchgängigen digitalen Vertriebssystem.
            </p>
          </div>

          {/* BOTTOM BAR */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            © {currentYear} <Logo className="inline-block h-4 align-text-bottom" />. Alle Rechte vorbehalten.
          </div>

        </div>
      </footer>

      {/* SLIDE-UP PANEL */}
      <AnimatePresence>
        {openPanel && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenPanel(null)}
            />

            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto p-8"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 260 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {openPanel === "impressum" ? "Impressum" : "Datenschutzerklärung"}
                </h3>
                <button
                  onClick={() => setOpenPanel(null)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition"
                >
                  <X size={26} />
                </button>
              </div>

              {openPanel === "impressum" ? (
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <h4>Angaben gemäß § 5 TMG</h4>
                  <p>
                    {BUSINESS_INFO.legalName}<br />
                    {BUSINESS_INFO.address.streetAddress}<br />
                    {BUSINESS_INFO.address.postalCode} {BUSINESS_INFO.address.addressLocality}<br />
                    Deutschland
                  </p>

                  <h4>Kontakt</h4>
                  <p>
                    Telefon: {BUSINESS_INFO.contact.phoneDisplay}<br />
                    E-Mail: {BUSINESS_INFO.contact.email}
                  </p>

                  <h4>Haftung für Inhalte</h4>
                  <p>
                    Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
                    nach den allgemeinen Gesetzen verantwortlich …
                  </p>

                  <h4>Haftung für Links</h4>
                  <p>Für externe Links übernehmen wir keine Haftung …</p>

                  <h4>Urheberrecht</h4>
                  <p>
                    Die durch uns erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
                    Urheberrecht …
                  </p>
                </div>
              ) : (
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <h4>1. Datenschutz auf einen Blick</h4>
                  <p>Der Schutz Ihrer persönlichen Daten ist uns wichtig …</p>

                  <h4>2. Verantwortliche Stelle</h4>
                  <p>
                    {BUSINESS_INFO.legalName}<br />
                    {BUSINESS_INFO.address.streetAddress}, {BUSINESS_INFO.address.postalCode} {BUSINESS_INFO.address.addressLocality}<br />
                    {BUSINESS_INFO.contact.email}
                  </p>

                  <h4>3. Erhebung und Verarbeitung personenbezogener Daten</h4>
                  <p>Wir verarbeiten personenbezogene Daten nur, wenn …</p>

                  <h4>4. Ihre Rechte</h4>
                  <ul>
                    <li>Recht auf Auskunft</li>
                    <li>Recht auf Berichtigung</li>
                    <li>Recht auf Löschung</li>
                    <li>Recht auf Einschränkung der Verarbeitung</li>
                    <li>Recht auf Datenübertragbarkeit</li>
                  </ul>

                  <h4>5. Cookies & Tracking</h4>
                  <p>Wir verwenden ausschließlich technisch notwendige Cookies …</p>

                  <h4>6. Kontakt</h4>
                  <p>Bei Fragen können Sie uns jederzeit kontaktieren.</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
