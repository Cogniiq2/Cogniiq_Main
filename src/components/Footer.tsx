import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";
import { NAP } from "./NAP";
import { BUSINESS_INFO } from "@/lib/seo-data";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [openPanel, setOpenPanel] = useState<"impressum" | "datenschutz" | null>(null);

  return (
    <>
      {/* ====== FOOTER ====== */}
      <footer className="bg-gray-50 border-t border-gray-200 py-16" role="contentinfo">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">

            {/* LEFT */}
            <div>
              <div className="mb-4">
                <Logo className="h-10" />
              </div>
              <p className="text-gray-600 leading-relaxed">
                <strong>AI Agentur und Webdesign Agentur in Bayreuth.</strong>{" "}
                Wir bieten KI Automationen, AI Rezeptionisten und
                hochkonvertierende Websites für Unternehmen in ganz Deutschland.
              </p>
            </div>

            {/* CONTACT */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Kontakt</h4>
              <div className="mb-3 text-sm text-gray-600">
                <Logo className="h-6 mb-1" />
                {BUSINESS_INFO.legalName.replace('Cogniiq – ', '')}
              </div>
              <NAP variant="vertical" showIcons={true} />
            </div>

            {/* LINKS */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Links</h4>
              <div className="space-y-2 text-gray-600">
                <button
                  onClick={() => setOpenPanel("impressum")}
                  className="block hover:text-gray-900 transition-colors text-left w-full"
                >
                  Impressum
                </button>

                <button
                  onClick={() => setOpenPanel("datenschutz")}
                  className="block hover:text-gray-900 transition-colors text-left w-full"
                >
                  Datenschutz
                </button>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            © {currentYear} <Logo className="inline-block h-4 align-text-bottom" />. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>

      {/* ====== SLIDE-UP PANEL ====== */}
      <AnimatePresence>
        {openPanel && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenPanel(null)}
            />

            {/* Panel */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto p-8"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 260 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold">
                  {openPanel === "impressum" ? "Impressum" : "Datenschutzerklärung"}
                </h3>
                <button
                  onClick={() => setOpenPanel(null)}
                  className="text-gray-500 hover:text-gray-800 transition"
                >
                  <X size={26} />
                </button>
              </div>

              {/* ====== LEGAL TEXT CONTENT ====== */}
              {openPanel === "impressum" ? (
                <div className="prose prose-gray max-w-none">
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
                <div className="prose prose-gray max-w-none">
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
