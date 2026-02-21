import { useState } from "react";
import { Link } from "react-router-dom";
import { X, ChevronDown, Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";
import { BUSINESS_INFO, getGoogleMapsUrl } from "@/lib/seo-data";

const navLink =
  "block text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 py-0.5 group";

const colHeading =
  "text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-4";

interface AccordionColProps {
  heading: string;
  children: React.ReactNode;
}

function AccordionCol({ heading, children }: AccordionColProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 sm:border-none">
      <button
        className="flex items-center justify-between w-full py-4 sm:py-0 sm:cursor-default"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={colHeading + " mb-0 sm:mb-4"}>{heading}</span>
        <ChevronDown
          size={15}
          className={`sm:hidden text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div className={`overflow-hidden sm:block ${open ? "block" : "hidden"}`}>
        <div className="pb-4 sm:pb-0 space-y-1">{children}</div>
      </div>
    </div>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [openPanel, setOpenPanel] = useState<"impressum" | "datenschutz" | null>(null);

  return (
    <>
      <footer
        className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800/60"
        role="contentinfo"
      >
        {/* TOP SECTION */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-12 lg:gap-8">

            {/* BRAND */}
            <div className="lg:pr-8">
              <Link to="/" aria-label="Cogniiq Startseite">
                <Logo className="h-8 mb-5" />
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mb-6">
                KI-Agentur & Webdesign für Unternehmen in Deutschland.
                Websites, KI-Telefonassistenten und Automatisierung aus Bayreuth.
              </p>

              {/* Contact */}
              <div
                className="space-y-2.5"
                itemScope
                itemType="https://schema.org/LocalBusiness"
              >
                <meta itemProp="name" content={BUSINESS_INFO.name} />
                <a
                  href={`mailto:${BUSINESS_INFO.contact.email}`}
                  className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
                  itemProp="email"
                >
                  <Mail size={14} className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors flex-shrink-0" />
                  <span>{BUSINESS_INFO.contact.email}</span>
                </a>
                <a
                  href={`tel:${BUSINESS_INFO.contact.phone}`}
                  className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
                  itemProp="telephone"
                >
                  <Phone size={14} className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors flex-shrink-0" />
                  <span>{BUSINESS_INFO.contact.phoneDisplay}</span>
                </a>
                <a
                  href={getGoogleMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
                  itemProp="address"
                  itemScope
                  itemType="https://schema.org/PostalAddress"
                >
                  <MapPin size={14} className="mt-0.5 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors flex-shrink-0" />
                  <span>
                    <span itemProp="streetAddress">{BUSINESS_INFO.address.streetAddress}</span>,{" "}
                    <span itemProp="postalCode">{BUSINESS_INFO.address.postalCode}</span>{" "}
                    <span itemProp="addressLocality">{BUSINESS_INFO.address.addressLocality}</span>
                  </span>
                </a>
              </div>
            </div>

            {/* LEISTUNGEN */}
            <AccordionCol heading="Leistungen">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-300 dark:text-gray-600 pt-1 pb-0.5">Deutschland</p>
              <Link to="/leistungen" className={navLink}>Webdesign Deutschland</Link>
              <Link to="/leistungen" className={navLink}>KI-Telefonassistent DE</Link>
              <Link to="/leistungen" className={navLink}>Automatisierung DE</Link>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-300 dark:text-gray-600 pt-3 pb-0.5">Bayern</p>
              <Link to="/bayreuth/webdesign" className={navLink}>Webdesign Bayern</Link>
              <Link to="/bayreuth/ki-telefonassistent" className={navLink}>KI-Telefonassistent BY</Link>
              <Link to="/bayreuth/automatisierung" className={navLink}>Automatisierung BY</Link>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-300 dark:text-gray-600 pt-3 pb-0.5">Branchen</p>
              <Link to="/leistungen" className={navLink}>KI für Praxen</Link>
              <Link to="/leistungen" className={navLink}>KI für Gastronomie</Link>
              <Link to="/leistungen" className={navLink}>KI für Handwerk</Link>
              <Link to="/leistungen" className={navLink}>KI für Dienstleister</Link>
            </AccordionCol>

            {/* REGIONEN */}
            <AccordionCol heading="Regionen">
              <Link to="/deutschland" className={navLink}>
                <span className="font-medium text-gray-700 dark:text-gray-300">Deutschland</span>
              </Link>
              <Link to="/bayern" className={navLink}>
                <span className="font-medium text-gray-700 dark:text-gray-300">Bayern</span>
              </Link>
              <Link to="/bayreuth" className={navLink}>Bayreuth</Link>
              <Link to="/muenchen" className={navLink}>München</Link>
              <Link to="/regensburg" className={navLink}>Regensburg</Link>
            </AccordionCol>

            {/* STANDORTE */}
            <AccordionCol heading="Nach Standort">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-300 dark:text-gray-600 pb-0.5">Bayreuth</p>
              <Link to="/bayreuth/webdesign" className={navLink}>Webdesign Bayreuth</Link>
              <Link to="/bayreuth/ki-telefonassistent" className={navLink}>KI-Telefonassistent BT</Link>
              <Link to="/bayreuth/automatisierung" className={navLink}>Automatisierung BT</Link>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-300 dark:text-gray-600 pt-3 pb-0.5">München</p>
              <Link to="/muenchen/webdesign" className={navLink}>Webdesign München</Link>
              <Link to="/muenchen/ki-telefonassistent" className={navLink}>KI-Telefonassistent MUC</Link>
              <Link to="/muenchen/automatisierung" className={navLink}>Automatisierung MUC</Link>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-300 dark:text-gray-600 pt-3 pb-0.5">Regensburg</p>
              <Link to="/regensburg/webdesign" className={navLink}>Webdesign Regensburg</Link>
              <Link to="/regensburg/ki-telefonassistent" className={navLink}>KI-Telefonassistent R</Link>
              <Link to="/regensburg/automatisierung" className={navLink}>Automatisierung R</Link>
            </AccordionCol>

            {/* UNTERNEHMEN */}
            <AccordionCol heading="Unternehmen">
              <Link to="/" className={navLink}>Start</Link>
              <Link to="/leistungen" className={navLink}>Leistungen</Link>
              <Link to="/ueber-uns" className={navLink}>Über uns</Link>
              <Link to="/faq" className={navLink}>FAQ</Link>
              <Link to="/kontakt" className={navLink + " inline-flex items-center gap-1"}>
                Kontakt
                <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </AccordionCol>

          </div>
        </div>

        {/* SEO TEXT STRIP */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="border-t border-gray-100 dark:border-gray-800/60 py-6">
            <p className="text-[11px] leading-relaxed text-gray-400 dark:text-gray-600 max-w-5xl">
              <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Cogniiq</Link> ist eine{" "}
              <Link to="/leistungen" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">KI- und Webdesign-Agentur</Link> mit Sitz in{" "}
              <Link to="/bayreuth" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Bayreuth</Link>.
              {" "}Wir entwickeln{" "}
              <Link to="/leistungen" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Websites</Link>,{" "}
              <Link to="/bayreuth/ki-telefonassistent" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">KI-Telefonassistenten</Link> und{" "}
              <Link to="/bayreuth/automatisierung" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Automatisierungssysteme</Link> für Unternehmen in{" "}
              <Link to="/bayern" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Bayern</Link> und ganz{" "}
              <Link to="/deutschland" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Deutschland</Link>.
              {" "}Unsere Leistungen verbinden{" "}
              <Link to="/leistungen" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Webdesign</Link>,
              künstliche Intelligenz und Prozessautomatisierung zu einem durchgängigen digitalen Vertriebssystem.
            </p>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="border-t border-gray-100 dark:border-gray-800/60 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              © {currentYear} Cogniiq. Alle Rechte vorbehalten.
            </p>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setOpenPanel("impressum")}
                className="text-xs text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Impressum
              </button>
              <button
                onClick={() => setOpenPanel("datenschutz")}
                className="text-xs text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Datenschutz
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* LEGAL PANELS */}
      <AnimatePresence>
        {openPanel && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenPanel(null)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-900 flex justify-between items-center px-8 pt-7 pb-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {openPanel === "impressum" ? "Impressum" : "Datenschutzerklärung"}
                </h3>
                <button
                  onClick={() => setOpenPanel(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Schließen"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-8 py-7">
                {openPanel === "impressum" ? (
                  <div className="prose prose-sm prose-gray dark:prose-invert max-w-none">
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
                    <p>Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.</p>
                    <h4>Haftung für Links</h4>
                    <p>Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.</p>
                    <h4>Urheberrecht</h4>
                    <p>Die durch uns erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.</p>
                  </div>
                ) : (
                  <div className="prose prose-sm prose-gray dark:prose-invert max-w-none">
                    <h4>1. Datenschutz auf einen Blick</h4>
                    <p>Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. Wir verarbeiten Ihre Daten daher ausschließlich auf Grundlage der gesetzlichen Bestimmungen (DSGVO, TKG 2003).</p>
                    <h4>2. Verantwortliche Stelle</h4>
                    <p>
                      {BUSINESS_INFO.legalName}<br />
                      {BUSINESS_INFO.address.streetAddress}, {BUSINESS_INFO.address.postalCode} {BUSINESS_INFO.address.addressLocality}<br />
                      {BUSINESS_INFO.contact.email}
                    </p>
                    <h4>3. Erhebung und Verarbeitung personenbezogener Daten</h4>
                    <p>Wir verarbeiten personenbezogene Daten nur, soweit dies zur Erfüllung eines Vertrages oder auf Basis einer gesetzlichen Grundlage erforderlich ist.</p>
                    <h4>4. Ihre Rechte</h4>
                    <ul>
                      <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
                      <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
                      <li>Recht auf Löschung (Art. 17 DSGVO)</li>
                      <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                      <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
                    </ul>
                    <h4>5. Cookies & Tracking</h4>
                    <p>Wir verwenden ausschließlich technisch notwendige Cookies, die für den Betrieb der Website erforderlich sind. Es werden keine Tracking- oder Analyse-Cookies eingesetzt.</p>
                    <h4>6. Kontakt</h4>
                    <p>Bei Fragen zum Datenschutz können Sie uns jederzeit unter {BUSINESS_INFO.contact.email} kontaktieren.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
