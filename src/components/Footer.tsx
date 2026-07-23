import { useState } from "react";
import { Link } from "react-router-dom";
import { X, ChevronDown, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";
import { BUSINESS_INFO, getGoogleMapsUrl } from "@/lib/seo-data";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (d = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: d, ease },
  }),
};

interface ColSection {
  label: string;
  links: Array<{ text: string; to: string }>;
}

interface FooterColProps {
  title: string;
  sections: ColSection[];
  delay?: number;
}

function FooterCol({ title, sections, delay = 0 }: FooterColProps) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-20px" }}
      variants={fadeUp}
      custom={delay}
    >
      <button
        className="flex w-full items-center justify-between border-b border-gray-100 dark:border-white/[0.06] pb-3 mb-5 lg:cursor-default lg:pointer-events-none"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-gray-400 dark:text-white/40">
          {title}
        </span>
        <ChevronDown
          size={13}
          className={`lg:hidden text-gray-300 dark:text-white/30 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div className={`space-y-5 lg:block ${open ? "block" : "hidden"}`}>
        {sections.map((section) => (
          <div key={section.label}>
            {section.label && (
              <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-gray-300 dark:text-white/25 mb-2.5">
                {section.label}
              </p>
            )}
            <ul className="space-y-1.5">
              {section.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="block text-[13px] text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 leading-snug"
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  const [panel, setPanel] = useState<"impressum" | "datenschutz" | null>(null);

  return (
    <>
      <footer className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 border-t border-gray-100 dark:border-gray-800" role="contentinfo">

        {/* ─── UPPER GRID ─── */}
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-12 lg:pt-20 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-14 lg:gap-20">

            {/* BRAND */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="flex flex-col gap-8"
            >
              <div>
                <Link to="/" aria-label="Cogniiq Startseite" className="inline-block mb-5">
                  <Logo className="h-6" />
                </Link>
                <p className="text-[13px] text-gray-500 dark:text-white/45 leading-relaxed max-w-[220px]">
                  Operative KI-Systeme für Unternehmen in Bayern und Deutschland.
                </p>
              </div>

              <div
                className="space-y-3"
                itemScope
                itemType="https://schema.org/LocalBusiness"
              >
                <meta itemProp="name" content={BUSINESS_INFO.name} />

                <a
                  href={`mailto:${BUSINESS_INFO.contact.email}`}
                  itemProp="email"
                  className="flex items-center gap-3 text-[13px] text-gray-500 dark:text-white/45 hover:text-gray-900 dark:hover:text-white transition-colors group"
                >
                  <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 dark:group-hover:bg-white/10 transition-colors">
                    <Mail size={12} className="text-gray-400 dark:text-white/50" />
                  </span>
                  {BUSINESS_INFO.contact.email}
                </a>

                <a
                  href={`tel:${BUSINESS_INFO.contact.phone}`}
                  itemProp="telephone"
                  className="flex items-center gap-3 text-[13px] text-gray-500 dark:text-white/45 hover:text-gray-900 dark:hover:text-white transition-colors group"
                >
                  <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 dark:group-hover:bg-white/10 transition-colors">
                    <Phone size={12} className="text-gray-400 dark:text-white/50" />
                  </span>
                  {BUSINESS_INFO.contact.phoneDisplay}
                </a>

                <a
                  href={getGoogleMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  itemProp="address"
                  itemScope
                  itemType="https://schema.org/PostalAddress"
                  className="flex items-start gap-3 text-[13px] text-gray-500 dark:text-white/45 hover:text-gray-900 dark:hover:text-white transition-colors group"
                >
                  <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-gray-200 dark:group-hover:bg-white/10 transition-colors">
                    <MapPin size={12} className="text-gray-400 dark:text-white/50" />
                  </span>
                  <span>
                    <span itemProp="streetAddress">{BUSINESS_INFO.address.streetAddress}</span>
                    <br />
                    <span itemProp="postalCode">{BUSINESS_INFO.address.postalCode}</span>{" "}
                    <span itemProp="addressLocality">{BUSINESS_INFO.address.addressLocality}</span>
                  </span>
                </a>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {["DSGVO", "Festpreis", "7–14 Tage", "Made in Bavaria"].map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/35 border border-gray-200 dark:border-white/[0.06]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* LINK COLUMNS */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-x-6 gap-y-10">

              <FooterCol
                title="Leistungen"
                delay={0.06}
                sections={[
                  {
                    label: "",
                    links: [
                      { text: "Alle Leistungen", to: "/leistungen" },
                      { text: "KI-Telefonassistent", to: "/ki-telefonassistent" },
                      { text: "Webdesign", to: "/webdesign" },
                      { text: "Prozessautomatisierung", to: "/prozessautomatisierung" },
                      { text: "Webdesign Agentur DE", to: "/webdesign-agentur-deutschland" },
                      { text: "KI Agentur DE", to: "/ki-agentur-deutschland" },
                      { text: "Automatisierung", to: "/automatisierung-unternehmen" },
                      { text: "Live-Demo", to: "/ki-telefonassistent/demo" },
                    ],
                  },
                  {
                    label: "Kosten",
                    links: [
                      { text: "Webdesign Kosten", to: "/kosten-webdesign" },
                      { text: "KI-Assistent Kosten", to: "/kosten-ki-telefonassistent" },
                      { text: "Automatisierung", to: "/kosten-automatisierung" },
                    ],
                  },
                ]}
              />

              <FooterCol
                title="Branchen"
                delay={0.10}
                sections={[
                  {
                    label: "Webdesign",
                    links: [
                      { text: "Arztpraxen", to: "/webdesign-arzt" },
                      { text: "Gastronomie", to: "/webdesign-gastronomie" },
                      { text: "Immobilien", to: "/webdesign-immobilien" },
                      { text: "Hotels", to: "/webdesign-hotel" },
                      { text: "Sport & Fitness", to: "/webdesign-sport" },
                    ],
                  },
                  {
                    label: "KI-Telefonassistent",
                    links: [
                      { text: "Arztpraxen", to: "/ki-telefonassistent-arzt" },
                      { text: "Restaurants", to: "/ki-telefonassistent-restaurant" },
                      { text: "Hotels", to: "/ki-telefonassistent-hotel" },
                      { text: "Praxen", to: "/ki-telefonassistent-praxis" },
                    ],
                  },
                  {
                    label: "Automatisierung",
                    links: [
                      { text: "Arztpraxen", to: "/automatisierung-arzt" },
                      { text: "Restaurants", to: "/automatisierung-restaurant" },
                      { text: "Immobilien", to: "/automatisierung-immobilien" },
                      { text: "Sport & Fitness", to: "/automatisierung-sport" },
                    ],
                  },
                ]}
              />

              <FooterCol
                title="Standorte"
                delay={0.14}
                sections={[
                  {
                    label: "Bayreuth",
                    links: [
                      { text: "Übersicht", to: "/bayreuth" },
                      { text: "Webdesign", to: "/bayreuth/webdesign" },
                      { text: "KI-Telefonassistent", to: "/bayreuth/ki-telefonassistent" },
                      { text: "Automatisierung", to: "/bayreuth/automatisierung" },
                    ],
                  },
                  {
                    label: "München",
                    links: [
                      { text: "Übersicht", to: "/muenchen" },
                      { text: "Webdesign", to: "/muenchen/webdesign" },
                      { text: "KI-Telefonassistent", to: "/muenchen/ki-telefonassistent" },
                      { text: "Automatisierung", to: "/muenchen/automatisierung" },
                    ],
                  },
                  {
                    label: "Regensburg",
                    links: [
                      { text: "Übersicht", to: "/regensburg" },
                      { text: "Webdesign", to: "/regensburg/webdesign" },
                      { text: "KI-Telefonassistent", to: "/regensburg/ki-telefonassistent" },
                      { text: "Automatisierung", to: "/regensburg/automatisierung" },
                    ],
                  },
                  {
                    label: "Regional",
                    links: [
                      { text: "Bayern", to: "/bayern" },
                      { text: "Deutschland", to: "/deutschland" },
                    ],
                  },
                ]}
              />

              <FooterCol
                title="Stadtseiten"
                delay={0.18}
                sections={[
                  {
                    label: "Bayreuth",
                    links: [
                      { text: "Arzt", to: "/webdesign-arzt-bayreuth" },
                      { text: "Gastronomie", to: "/webdesign-gastronomie-bayreuth" },
                      { text: "Immobilien", to: "/webdesign-immobilien-bayreuth" },
                      { text: "Kosten", to: "/bayreuth/webdesign-kosten" },
                      { text: "Website erstellen", to: "/bayreuth/website-erstellen" },
                      { text: "Landingpage", to: "/bayreuth/landingpage" },
                      { text: "Website Relaunch", to: "/bayreuth/website-relaunch" },
                      { text: "Lokales SEO", to: "/bayreuth/lokales-seo" },
                    ],
                  },
                  {
                    label: "München",
                    links: [
                      { text: "Arzt", to: "/webdesign-arzt-muenchen" },
                      { text: "Gastronomie", to: "/webdesign-gastronomie-muenchen" },
                      { text: "Immobilien", to: "/webdesign-immobilien-muenchen" },
                      { text: "Kosten", to: "/muenchen/webdesign-kosten" },
                      { text: "Website erstellen", to: "/muenchen/website-erstellen" },
                      { text: "Landingpage", to: "/muenchen/landingpage" },
                      { text: "Website Relaunch", to: "/muenchen/website-relaunch" },
                      { text: "Lokales SEO", to: "/muenchen/lokales-seo" },
                    ],
                  },
                  {
                    label: "Regensburg",
                    links: [
                      { text: "Arzt", to: "/webdesign-arzt-regensburg" },
                      { text: "Gastronomie", to: "/webdesign-gastronomie-regensburg" },
                      { text: "Immobilien", to: "/webdesign-immobilien-regensburg" },
                      { text: "Kosten", to: "/regensburg/webdesign-kosten" },
                      { text: "Website erstellen", to: "/regensburg/website-erstellen" },
                      { text: "Landingpage", to: "/regensburg/landingpage" },
                      { text: "Website Relaunch", to: "/regensburg/website-relaunch" },
                      { text: "Lokales SEO", to: "/regensburg/lokales-seo" },
                    ],
                  },
                ]}
              />

              <FooterCol
                title="Unternehmen"
                delay={0.22}
                sections={[
                  {
                    label: "",
                    links: [
                      { text: "Startseite", to: "/" },
                      { text: "Über uns", to: "/ueber-uns" },
                      { text: "Zertifizierungen", to: "/zertifizierungen" },
                      { text: "Leistungen", to: "/leistungen" },
                      { text: "Referenzen", to: "/referenzen" },
                      { text: "Bewertungen", to: "/bewertungen" },
                      { text: "Blog", to: "/blog" },
                      { text: "FAQ", to: "/faq" },
                      { text: "Kontakt", to: "/kontakt" },
                    ],
                  },
                  {
                    label: "Probleme",
                    links: [
                      { text: "Verpasste Anrufe", to: "/verpasste-anrufe-verlust" },
                      { text: "Keine Web-Anfragen", to: "/keine-anfragen-website" },
                      { text: "Keine Terminbuchung", to: "/keine-terminbuchung-online" },
                      { text: "Manuelle Arbeit", to: "/zu-viel-manuelle-arbeit" },
                      { text: "Digitale Automatisierung", to: "/digitale-automatisierung-unternehmen" },
                    ],
                  },
                  {
                    label: "Pillar Pages",
                    links: [
                      { text: "Webdesign Agentur DE", to: "/webdesign-agentur-deutschland" },
                      { text: "KI-Agentur Deutschland", to: "/ki-agentur-deutschland" },
                      { text: "Automatisierung DE", to: "/automatisierung-unternehmen" },
                      { text: "KI-Assistent Bayern", to: "/bayern/ki-telefonassistent" },
                    ],
                  },
                ]}
              />

            </div>
          </div>
        </div>

        {/* ─── DIVIDER ─── */}
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />
        </div>

        {/* ─── SEO PARAGRAPH ─── */}
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5">
          <motion.p
            className="text-[11px] leading-loose text-gray-300 dark:text-white/20 max-w-4xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease }}
          >
            <Link to="/" className="hover:text-gray-500 dark:hover:text-white/40 transition-colors">Cogniiq</Link> ist eine{" "}
            <Link to="/ki-agentur-deutschland" className="hover:text-gray-500 dark:hover:text-white/40 transition-colors">KI-Agentur</Link> und{" "}
            <Link to="/webdesign-agentur-deutschland" className="hover:text-gray-500 dark:hover:text-white/40 transition-colors">Webdesign-Agentur</Link> mit Sitz in{" "}
            <Link to="/bayreuth" className="hover:text-gray-500 dark:hover:text-white/40 transition-colors">Bayreuth</Link>.{" "}
            Wir entwickeln operative Systeme:{" "}
            <Link to="/ki-telefonassistent" className="hover:text-gray-500 dark:hover:text-white/40 transition-colors">KI-Telefonassistenten</Link>,{" "}
            <Link to="/webdesign-agentur-deutschland" className="hover:text-gray-500 dark:hover:text-white/40 transition-colors">hochkonvertierende Websites</Link> und{" "}
            <Link to="/automatisierung-unternehmen" className="hover:text-gray-500 dark:hover:text-white/40 transition-colors">Prozessautomatisierung</Link>{" "}
            für{" "}
            <Link to="/muenchen" className="hover:text-gray-500 dark:hover:text-white/40 transition-colors">München</Link>,{" "}
            <Link to="/regensburg" className="hover:text-gray-500 dark:hover:text-white/40 transition-colors">Regensburg</Link>,{" "}
            <Link to="/bayreuth" className="hover:text-gray-500 dark:hover:text-white/40 transition-colors">Bayreuth</Link> und ganz{" "}
            <Link to="/deutschland" className="hover:text-gray-500 dark:hover:text-white/40 transition-colors">Deutschland</Link>.
          </motion.p>
        </div>

        {/* ─── DIVIDER ─── */}
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />
        </div>

        {/* ─── BOTTOM BAR ─── */}
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5">
          <motion.div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease }}
          >
            <p className="text-[12px] text-gray-400 dark:text-white/20">
              © {year} {BUSINESS_INFO.name} · Alle Rechte vorbehalten
            </p>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setPanel("impressum")}
                className="text-[12px] text-gray-400 dark:text-white/25 hover:text-gray-700 dark:hover:text-white/55 transition-colors"
              >
                Impressum
              </button>
              <button
                onClick={() => setPanel("datenschutz")}
                className="text-[12px] text-gray-400 dark:text-white/25 hover:text-gray-700 dark:hover:text-white/55 transition-colors"
              >
                Datenschutz
              </button>
              <Link
                to="/kontakt"
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white transition-colors group"
              >
                Erstgespräch
                <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>

      </footer>

      {/* ─── LEGAL SLIDE-UP PANELS ─── */}
      <AnimatePresence>
        {panel && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPanel(null)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 rounded-t-3xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-950 flex justify-between items-center px-8 pt-7 pb-5 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                  {panel === "impressum" ? "Impressum" : "Datenschutzerklärung"}
                </h3>
                <button
                  onClick={() => setPanel(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Schließen"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="px-8 py-7">
                {panel === "impressum" ? (
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
