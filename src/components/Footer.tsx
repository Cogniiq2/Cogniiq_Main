import { useState } from "react";
import { Mail, Phone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
              <div className="text-2xl font-bold mb-4">
                <span className="bg-gradient-to-r from-[#8b5cf6] to-[#22d3ee] bg-clip-text text-transparent">
                  Cogniiq
                </span>
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
              <div className="space-y-3 text-gray-600">
                <address className="not-italic">
                  <strong>Cogniiq</strong><br />
                  Lazar & Djordje Popovic<br />
                  Am Main Straße 3<br />
                  95444 Bayreuth, Deutschland
                </address>

                <a
                  href="mailto:info@cogniiq.de"
                  className="flex items-center gap-2 text-[#8b5cf6] hover:text-[#22d3ee] transition-colors"
                >
                  <Mail size={16} /> info@cogniiq.de
                </a>

                <a
                  href="tel:01601832917"
                  className="flex items-center gap-2 text-[#8b5cf6] hover:text-[#22d3ee] transition-colors"
                >
                  <Phone size={16} /> 0160 1832917
                </a>
              </div>
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
            © {currentYear} Cogniiq. Alle Rechte vorbehalten.
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
                    Cogniiq – Lazar & Djordje Popovic<br />
                    Am Main Straße 3<br />
                    95444 Bayreuth<br />
                    Deutschland
                  </p>

                  <h4>Kontakt</h4>
                  <p>
                    Telefon: 0160 1832917<br />
                    E-Mail: info@cogniiq.de
                  </p>

                  <h4>Haftung für Inhalte</h4>
                  <p>
                    Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
                    nach den allgemeinen Gesetzen verantwortlich. Für die Richtigkeit,
                    Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
                  </p>

                  <h4>Haftung für Links</h4>
                  <p>
                    Für externe Links übernehmen wir keine Haftung. Für die Inhalte verlinkter externer
                    Seiten sind ausschließlich deren Betreiber verantwortlich.
                  </p>

                  <h4>Urheberrecht</h4>
                  <p>
                    Die durch uns erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
                    Urheberrecht. Die Vervielfältigung oder Verbreitung ist nur mit schriftlicher Genehmigung
                    zulässig.
                  </p>
                </div>
              ) : (
                <div className="prose prose-gray max-w-none">
                  <h4>1. Datenschutz auf einen Blick</h4>
                  <p>
                    Der Schutz Ihrer persönlichen Daten ist uns wichtig. Wir behandeln Ihre Daten stets
                    vertraulich und gemäß den gesetzlichen Datenschutzvorschriften der DSGVO.
                  </p>

                  <h4>2. Verantwortliche Stelle</h4>
                  <p>
                    Cogniiq – Lazar & Djordje Popovic<br />
                    Am Main Straße 3, 95444 Bayreuth<br />
                    info@cogniiq.de
                  </p>

                  <h4>3. Erhebung und Verarbeitung personenbezogener Daten</h4>
                  <p>
                    Wir verarbeiten personenbezogene Daten nur, wenn dies zur Bereitstellung unserer
                    Leistungen erforderlich ist – etwa für Kontaktanfragen, Projektkommunikation
                    oder Angebotsstellung.
                  </p>

                  <h4>4. Ihre Rechte</h4>
                  <ul>
                    <li>Recht auf Auskunft</li>
                    <li>Recht auf Berichtigung</li>
                    <li>Recht auf Löschung</li>
                    <li>Recht auf Einschränkung der Verarbeitung</li>
                    <li>Recht auf Datenübertragbarkeit</li>
                  </ul>

                  <h4>5. Cookies & Tracking</h4>
                  <p>
                    Wir verwenden ausschließlich technisch notwendige Cookies. Tracking oder Profiling
                    findet nicht statt.
                  </p>

                  <h4>6. Kontakt</h4>
                  <p>Bei Fragen zum Datenschutz können Sie uns jederzeit kontaktieren.</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
