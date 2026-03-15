import { useState } from "react";
import { Link } from "react-router-dom";
import { X, ChevronDown, Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";
import { BUSINESS_INFO, getGoogleMapsUrl } from "@/lib/seo-data";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeSlide = {
  hidden: { opacity: 0, y: 18 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, delay, ease },
  }),
};

const labelClass =
  "text-[10px] font-semibold uppercase tracking-[0.13em] text-gray-300 dark:text-gray-600 mb-2.5 block";

const linkClass =
  "block text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 py-[3px] leading-snug";

const subLinkClass =
  "block text-[13px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 py-[2px] leading-snug";

interface AccordionColProps {
  heading: string;
  children: React.ReactNode;
  delay?: number;
}

function AccordionCol({ heading, children, delay = 0 }: AccordionColProps) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
      variants={fadeSlide}
      custom={delay}
      className="border-b border-gray-100 dark:border-gray-800/80 md:border-none"
    >
      <button
        className="flex items-center justify-between w-full py-4 md:py-0 md:cursor-default md:pointer-events-none"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-gray-400 dark:text-gray-500 md:mb-4 block">
          {heading}
        </span>
        <ChevronDown
          size={14}
          className={`md:hidden text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div className={`overflow-hidden md:block ${open ? "block" : "hidden"}`}>
        <div className="pb-4 md:pb-0 space-y-0.5">{children}</div>
      </div>
    </motion.div>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [openPanel, setOpenPanel] = useState<"impressum" | "datenschutz" | null>(null);

  return (
    <>
      <footer
        className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800/60 overflow-hidden"
        role="contentinfo"
      >

        {/* ── MAIN GRID ── */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-x-8 gap-y-0 lg:gap-y-0">

            {/* ── BRAND COL ── */}
            <motion.div
              className="lg:pr-10 pb-8 md:pb-10 border-b border-gray-100 dark:border-gray-800/80 md:border-none lg:border-none"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={fadeSlide}
              custom={0}
            >
              <Link to="/" aria-label="Cogniiq Startseite" className="inline-block mb-5">
                <Logo className="h-7" />
              </Link>

              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed max-w-[240px] mb-7">
                Operative KI-Systeme für Unternehmen in Bayern und Deutschland.
                Kein Template, kein Overhead.
              </p>

              <div
                className="space-y-3"
                itemScope
                itemType="https://schema.org/LocalBusiness"
              >
                <meta itemProp="name" content={BUSINESS_INFO.name} />

                <a
                  href={`mailto:${BUSINESS_INFO.contact.email}`}
                  className="flex items-center gap-2.5 text-[13px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
                  itemProp="email"
                >
                  <Mail size={13} className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors flex-shrink-0" />
                  <span>{BUSINESS_INFO.contact.email}</span>
                </a>

                <a
                  href={`tel:${BUSINESS_INFO.contact.phone}`}
                  className="flex items-center gap-2.5 text-[13px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
                  itemProp="telephone"
                >
                  <Phone size={13} className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors flex-shrink-0" />
                  <span>{BUSINESS_INFO.contact.phoneDisplay}</span>
                </a>

                <a
                  href={getGoogleMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 text-[13px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
                  itemProp="address"
                  itemScope
                  itemType="https://schema.org/PostalAddress"
                >
                  <MapPin size={13} className="mt-0.5 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors flex-shrink-0" />
                  <span>
                    <span itemProp="streetAddress">{BUSINESS_INFO.address.streetAddress}</span>,{" "}
                    <span itemProp="postalCode">{BUSINESS_INFO.address.postalCode}</span>{" "}
                    <span itemProp="addressLocality">{BUSINESS_INFO.address.addressLocality}</span>
                  </span>
                </a>
              </div>

              <div className="mt-7 pt-6 border-t border-gray-100 dark:border-gray-800/80">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-gray-400 dark:text-gray-500 mb-3">
                  DSGVO-konform · Made in Bavaria
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["DSGVO", "ISO 27001", "Festpreis", "7–14 Tage"].map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ── LEISTUNGEN ── */}
            <AccordionCol heading="Leistungen" delay={0.06}>
              <Link to="/leistungen" className={linkClass}>Alle Leistungen</Link>
              <Link to="/ki-telefonassistent" className={linkClass}>KI-Telefonassistent</Link>
              <Link to="/webdesign-agentur-deutschland" className={linkClass}>Webdesign</Link>
              <Link to="/automatisierung-unternehmen" className={linkClass}>Automatisierung</Link>
              <Link to="/ki-telefonassistent/demo" className={linkClass}>Live-Demo</Link>

              <span className={`${labelClass} mt-4`}>Kosten & Preise</span>
              <Link to="/kosten-webdesign" className={subLinkClass}>Webdesign Kosten</Link>
              <Link to="/kosten-ki-telefonassistent" className={subLinkClass}>KI-Assistent Kosten</Link>
              <Link to="/kosten-automatisierung" className={subLinkClass}>Automatisierung Kosten</Link>
            </AccordionCol>

            {/* ── BRANCHEN ── */}
            <AccordionCol heading="Branchen" delay={0.12}>
              <span className={labelClass}>Webdesign</span>
              <Link to="/webdesign-arzt" className={subLinkClass}>Für Arztpraxen</Link>
              <Link to="/webdesign-gastronomie" className={subLinkClass}>Für Gastronomie</Link>
              <Link to="/webdesign-immobilien" className={subLinkClass}>Für Immobilien</Link>
              <Link to="/webdesign-hotel" className={subLinkClass}>Für Hotels</Link>
              <Link to="/webdesign-sport" className={subLinkClass}>Für Sport & Fitness</Link>

              <span className={`${labelClass} mt-4`}>KI-Telefonassistent</span>
              <Link to="/ki-telefonassistent-arzt" className={subLinkClass}>Für Arztpraxen</Link>
              <Link to="/ki-telefonassistent-restaurant" className={subLinkClass}>Für Restaurants</Link>
              <Link to="/ki-telefonassistent-hotel" className={subLinkClass}>Für Hotels</Link>
              <Link to="/ki-telefonassistent-praxis" className={subLinkClass}>Für Praxen</Link>

              <span className={`${labelClass} mt-4`}>Automatisierung</span>
              <Link to="/automatisierung-arzt" className={subLinkClass}>Für Arztpraxen</Link>
              <Link to="/automatisierung-restaurant" className={subLinkClass}>Für Restaurants</Link>
              <Link to="/automatisierung-immobilien" className={subLinkClass}>Für Immobilien</Link>
              <Link to="/automatisierung-sport" className={subLinkClass}>Für Sport & Fitness</Link>
            </AccordionCol>

            {/* ── STANDORTE ── */}
            <AccordionCol heading="Standorte" delay={0.18}>
              <span className={labelClass}>Bayreuth</span>
              <Link to="/bayreuth" className={subLinkClass}>Übersicht</Link>
              <Link to="/bayreuth/webdesign" className={subLinkClass}>Webdesign BT</Link>
              <Link to="/bayreuth/ki-telefonassistent" className={subLinkClass}>KI-Assistent BT</Link>
              <Link to="/bayreuth/automatisierung" className={subLinkClass}>Automatisierung BT</Link>

              <span className={`${labelClass} mt-4`}>München</span>
              <Link to="/muenchen" className={subLinkClass}>Übersicht</Link>
              <Link to="/muenchen/webdesign" className={subLinkClass}>Webdesign MUC</Link>
              <Link to="/muenchen/ki-telefonassistent" className={subLinkClass}>KI-Assistent MUC</Link>
              <Link to="/muenchen/automatisierung" className={subLinkClass}>Automatisierung MUC</Link>

              <span className={`${labelClass} mt-4`}>Regensburg</span>
              <Link to="/regensburg" className={subLinkClass}>Übersicht</Link>
              <Link to="/regensburg/webdesign" className={subLinkClass}>Webdesign R</Link>
              <Link to="/regensburg/ki-telefonassistent" className={subLinkClass}>KI-Assistent R</Link>
              <Link to="/regensburg/automatisierung" className={subLinkClass}>Automatisierung R</Link>

              <span className={`${labelClass} mt-4`}>Regional</span>
              <Link to="/bayern" className={subLinkClass}>Bayern</Link>
              <Link to="/deutschland" className={subLinkClass}>Deutschland</Link>
            </AccordionCol>

            {/* ── STADTSEITEN ── */}
            <AccordionCol heading="Stadtseiten" delay={0.24}>
              <span className={labelClass}>Bayreuth</span>
              <Link to="/webdesign-arzt-bayreuth" className={subLinkClass}>Arzt Bayreuth</Link>
              <Link to="/webdesign-gastronomie-bayreuth" className={subLinkClass}>Gastronomie BT</Link>
              <Link to="/webdesign-immobilien-bayreuth" className={subLinkClass}>Immobilien BT</Link>
              <Link to="/bayreuth/webdesign-kosten" className={subLinkClass}>Kosten Bayreuth</Link>
              <Link to="/bayreuth/website-erstellen" className={subLinkClass}>Website erstellen BT</Link>
              <Link to="/bayreuth/landingpage" className={subLinkClass}>Landingpage BT</Link>
              <Link to="/bayreuth/website-relaunch" className={subLinkClass}>Relaunch BT</Link>
              <Link to="/bayreuth/lokales-seo" className={subLinkClass}>Lokales SEO BT</Link>

              <span className={`${labelClass} mt-4`}>München</span>
              <Link to="/webdesign-arzt-muenchen" className={subLinkClass}>Arzt München</Link>
              <Link to="/webdesign-gastronomie-muenchen" className={subLinkClass}>Gastronomie MUC</Link>
              <Link to="/webdesign-immobilien-muenchen" className={subLinkClass}>Immobilien MUC</Link>
              <Link to="/muenchen/webdesign-kosten" className={subLinkClass}>Kosten München</Link>
              <Link to="/muenchen/website-erstellen" className={subLinkClass}>Website erstellen MUC</Link>
              <Link to="/muenchen/landingpage" className={subLinkClass}>Landingpage MUC</Link>
              <Link to="/muenchen/website-relaunch" className={subLinkClass}>Relaunch MUC</Link>
              <Link to="/muenchen/lokales-seo" className={subLinkClass}>Lokales SEO MUC</Link>

              <span className={`${labelClass} mt-4`}>Regensburg</span>
              <Link to="/webdesign-arzt-regensburg" className={subLinkClass}>Arzt Regensburg</Link>
              <Link to="/webdesign-gastronomie-regensburg" className={subLinkClass}>Gastronomie R</Link>
              <Link to="/webdesign-immobilien-regensburg" className={subLinkClass}>Immobilien R</Link>
              <Link to="/regensburg/webdesign-kosten" className={subLinkClass}>Kosten Regensburg</Link>
              <Link to="/regensburg/website-erstellen" className={subLinkClass}>Website erstellen R</Link>
              <Link to="/regensburg/landingpage" className={subLinkClass}>Landingpage R</Link>
              <Link to="/regensburg/website-relaunch" className={subLinkClass}>Relaunch R</Link>
              <Link to="/regensburg/lokales-seo" className={subLinkClass}>Lokales SEO R</Link>
            </AccordionCol>

            {/* ── UNTERNEHMEN ── */}
            <AccordionCol heading="Unternehmen" delay={0.30}>
              <Link to="/" className={linkClass}>Startseite</Link>
              <Link to="/ueber-uns" className={linkClass}>Über uns</Link>
              <Link to="/leistungen" className={linkClass}>Leistungen</Link>
              <Link to="/referenzen" className={linkClass}>Referenzen</Link>
              <Link to="/bewertungen" className={linkClass}>Bewertungen</Link>
              <Link to="/faq" className={linkClass}>FAQ</Link>
              <Link
                to="/kontakt"
                className={`${linkClass} inline-flex items-center gap-1.5 group`}
              >
                Kontakt
                <ArrowUpRight size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <span className={`${labelClass} mt-4`}>Probleme & Lösungen</span>
              <Link to="/verpasste-anrufe-verlust" className={subLinkClass}>Verpasste Anrufe</Link>
              <Link to="/keine-anfragen-website" className={subLinkClass}>Keine Web-Anfragen</Link>
              <Link to="/keine-terminbuchung-online" className={subLinkClass}>Keine Terminbuchung</Link>
              <Link to="/zu-viel-manuelle-arbeit" className={subLinkClass}>Manuelle Arbeit</Link>
              <Link to="/digitale-automatisierung-unternehmen" className={subLinkClass}>Digitale Automatisierung</Link>

              <span className={`${labelClass} mt-4`}>Pillar Pages</span>
              <Link to="/webdesign-agentur-deutschland" className={subLinkClass}>Webdesign Agentur DE</Link>
              <Link to="/ki-agentur-deutschland" className={subLinkClass}>KI-Agentur Deutschland</Link>
              <Link to="/automatisierung-unternehmen" className={subLinkClass}>Automatisierung DE</Link>
              <Link to="/bayern/ki-telefonassistent" className={subLinkClass}>KI-Assistent Bayern</Link>
            </AccordionCol>

          </div>
        </div>

        {/* ── SEO LINK STRIP ── */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            className="border-t border-gray-100 dark:border-gray-800/60 py-5"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.1, ease }}
          >
            <p className="text-[11px] leading-relaxed text-gray-400 dark:text-gray-600 max-w-5xl">
              <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Cogniiq</Link> ist eine{" "}
              <Link to="/ki-agentur-deutschland" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">KI-Agentur</Link> und{" "}
              <Link to="/webdesign-agentur-deutschland" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Webdesign-Agentur</Link> mit Sitz in{" "}
              <Link to="/bayreuth" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Bayreuth</Link>.{" "}
              Wir entwickeln operative Systeme:{" "}
              <Link to="/ki-telefonassistent" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">KI-Telefonassistenten</Link>,{" "}
              <Link to="/webdesign-agentur-deutschland" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">hochkonvertierende Websites</Link> und{" "}
              <Link to="/automatisierung-unternehmen" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Prozessautomatisierung</Link>{" "}
              für Unternehmen in{" "}
              <Link to="/muenchen" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">München</Link>,{" "}
              <Link to="/regensburg" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Regensburg</Link>,{" "}
              <Link to="/bayreuth" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Bayreuth</Link> und ganz{" "}
              <Link to="/deutschland" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Deutschland</Link>.
            </p>
          </motion.div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            className="border-t border-gray-100 dark:border-gray-800/60 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
          >
            <p className="text-xs text-gray-400 dark:text-gray-600">
              © {currentYear} {BUSINESS_INFO.name}. Alle Rechte vorbehalten.
            </p>
            <div className="flex items-center gap-5">
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
              <span className="text-xs text-gray-300 dark:text-gray-700">
                DSGVO-konform
              </span>
            </div>
          </motion.div>
        </div>
      </footer>

      {/* ── LEGAL SLIDE-UP PANELS ── */}
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
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {openPanel === "impressum" ? "Impressum" : "Datenschutzerklärung"}
                </h3>
                <button
                  onClick={() => setOpenPanel(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Schließen"
                >
                  <X size={15} />
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
